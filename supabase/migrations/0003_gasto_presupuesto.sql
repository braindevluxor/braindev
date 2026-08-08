-- ============================================================================
-- BrainDev · Migración 0003: módulo Gasto vs Presupuesto
-- ----------------------------------------------------------------------------
-- - departamentos: unidades a las que se asignan presupuestos y gastos.
-- - movimientos:  registro de gastos e ingresos en USD o VES (Bs).
--     * monto_usd es el valor PRIMARIO (el sistema siempre refleja USD).
--     * monto_bs es la conversión secundaria.
--     * registrado_por es automático (auth.uid()) y NO modificable.
--     * La conversión se calcula con un trigger (integridad garantizada en DB).
-- - presupuestos: presupuesto mensual en USD por departamento.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Departamentos
-- ---------------------------------------------------------------------------
create table if not exists public.departamentos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.departamentos is
  'Departamentos de la empresa para presupuestos y movimientos.';

insert into public.departamentos (nombre)
values ('Renta'), ('Nómina'), ('Suministros'), ('Servicios'), ('Marketing'), ('Otros')
on conflict (nombre) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Movimientos (gastos e ingresos)
-- ---------------------------------------------------------------------------
create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('gasto', 'ingreso')),
  departamento_id uuid not null references public.departamentos (id) on delete restrict,
  concepto text not null default '',
  numero_factura text not null default '',
  fecha date not null default current_date,
  moneda text not null check (moneda in ('USD', 'VES')),
  monto numeric(18, 2) not null,
  tasa_cambio numeric(18, 4) not null,
  monto_usd numeric(18, 2) not null,
  monto_bs numeric(18, 2) not null,
  registrado_por uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.movimientos is
  'Gastos e ingresos. monto_usd es el valor primario; monto_bs es la conversión secundaria.';

-- Conversión automática USD/Bs. La tasa siempre es "Bs por 1 USD".
--   - moneda = USD → monto_usd = monto;            monto_bs = monto * tasa.
--   - moneda = VES → monto_usd = monto / tasa;     monto_bs = monto.
create or replace function public.movimientos_conversion()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.monto is null or new.monto < 0 then
    raise exception 'El monto no puede ser negativo';
  end if;
  if new.tasa_cambio is null or new.tasa_cambio <= 0 then
    raise exception 'La tasa de cambio debe ser mayor a 0';
  end if;

  if new.moneda = 'USD' then
    new.monto_usd := round(new.monto, 2);
    new.monto_bs := round(new.monto * new.tasa_cambio, 2);
  elsif new.moneda = 'VES' then
    new.monto_bs := round(new.monto, 2);
    new.monto_usd := round(new.monto / new.tasa_cambio, 2);
  else
    raise exception 'Moneda inválida (use USD o VES)';
  end if;

  return new;
end;
$$;

drop trigger if exists movimientos_conversion_trg on public.movimientos;
create trigger movimientos_conversion_trg
  before insert or update on public.movimientos
  for each row execute procedure public.movimientos_conversion();

-- ---------------------------------------------------------------------------
-- 3. Presupuestos (mensual por departamento, en USD)
-- ---------------------------------------------------------------------------
create table if not exists public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  departamento_id uuid not null references public.departamentos (id) on delete cascade,
  anio integer not null,
  mes integer not null check (mes between 1 and 12),
  monto_usd numeric(18, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (departamento_id, anio, mes)
);

comment on table public.presupuestos is
  'Presupuesto mensual en USD por departamento.';

-- ---------------------------------------------------------------------------
-- 4. Triggers de updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists departamentos_set_updated_at on public.departamentos;
create trigger departamentos_set_updated_at
  before update on public.departamentos
  for each row execute procedure public.set_updated_at();

drop trigger if exists movimientos_set_updated_at on public.movimientos;
create trigger movimientos_set_updated_at
  before update on public.movimientos
  for each row execute procedure public.set_updated_at();

drop trigger if exists presupuestos_set_updated_at on public.presupuestos;
create trigger presupuestos_set_updated_at
  before update on public.presupuestos
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
--    - Cualquier usuario autenticado puede LEER y REGISTRAR movimientos
--      (registrado_por queda forzado a su propio id).
--    - Solo admins gestionan departamentos y presupuestos.
--    - Edición/eliminación de movimientos: el propio autor o un admin.
-- ---------------------------------------------------------------------------
alter table public.departamentos enable row level security;
alter table public.movimientos enable row level security;
alter table public.presupuestos enable row level security;

-- Directorio de perfiles: los usuarios autenticados pueden leer nombre/correo
-- para mostrar "quién registró" cada movimiento (sistema interno).
create policy "Autenticados leen directorio de perfiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Departamentos
create policy "Lectura de departamentos"
  on public.departamentos for select
  using (auth.role() = 'authenticated');

create policy "Admins gestionan departamentos"
  on public.departamentos for all
  using (public.is_admin())
  with check (public.is_admin());

-- Movimientos
create policy "Lectura de movimientos"
  on public.movimientos for select
  using (auth.role() = 'authenticated');

create policy "Registrar movimientos propios"
  on public.movimientos for insert
  with check (auth.role() = 'authenticated' and auth.uid() = registrado_por);

create policy "Editar movimientos propios o admin"
  on public.movimientos for update
  using (public.is_admin() or auth.uid() = registrado_por)
  with check (public.is_admin() or auth.uid() = registrado_por);

create policy "Eliminar movimientos propios o admin"
  on public.movimientos for delete
  using (public.is_admin() or auth.uid() = registrado_por);

-- Presupuestos
create policy "Lectura de presupuestos"
  on public.presupuestos for select
  using (auth.role() = 'authenticated');

create policy "Admins gestionan presupuestos"
  on public.presupuestos for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- BrainDev · Migración 009: Minutas
-- ----------------------------------------------------------------------------
-- - reuniones: reuniones/minutas con título, fecha, lugar, participantes y observaciones
-- - compromisos: compromisos por reunión con responsable y fecha tope de entrega
-- - Se registra el módulo y sus herramientas en el catálogo de permisos.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Reuniones
-- ---------------------------------------------------------------------------
create table if not exists public.reuniones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  fecha date not null default current_date,
  lugar text,
  participantes text[] not null default '{}',
  observaciones text,
  registrado_por uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reuniones is
  'Reuniones y sus minutas con participantes y observaciones.';

-- ---------------------------------------------------------------------------
-- 2. Compromisos
-- ---------------------------------------------------------------------------
create table if not exists public.compromisos (
  id uuid primary key default gen_random_uuid(),
  reunion_id uuid not null references public.reuniones (id) on delete cascade,
  descripcion text not null,
  responsable text not null,
  fecha_tope date not null,
  completado boolean not null default false,
  registrado_por uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.compromisos is
  'Compromisos o acuerdos de cada reunión, con responsable y fecha tope.';

create index if not exists compromisos_reunion_idx on public.compromisos (reunion_id);
create index if not exists compromisos_fecha_tope_idx on public.compromisos (fecha_tope);

-- ---------------------------------------------------------------------------
-- 3. Triggers de updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists reuniones_set_updated_at on public.reuniones;
create trigger reuniones_set_updated_at
  before update on public.reuniones
  for each row execute procedure public.set_updated_at();

drop trigger if exists compromisos_set_updated_at on public.compromisos;
create trigger compromisos_set_updated_at
  before update on public.compromisos
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
--    Mismo criterio que movimientos: cualquiera autenticado lee y registra
--    (registrado_por forzado a su propio id); edición/eliminación: autor o admin.
-- ---------------------------------------------------------------------------
alter table public.reuniones enable row level security;
alter table public.compromisos enable row level security;

-- Reuniones
drop policy if exists "Lectura de reuniones" on public.reuniones;
create policy "Lectura de reuniones"
  on public.reuniones for select
  using (auth.role() = 'authenticated');

drop policy if exists "Registrar reuniones propias" on public.reuniones;
create policy "Registrar reuniones propias"
  on public.reuniones for insert
  with check (auth.role() = 'authenticated' and auth.uid() = registrado_por);

drop policy if exists "Editar reuniones propias o admin" on public.reuniones;
create policy "Editar reuniones propias o admin"
  on public.reuniones for update
  using (public.is_admin() or auth.uid() = registrado_por)
  with check (public.is_admin() or auth.uid() = registrado_por);

drop policy if exists "Eliminar reuniones propias o admin" on public.reuniones;
create policy "Eliminar reuniones propias o admin"
  on public.reuniones for delete
  using (public.is_admin() or auth.uid() = registrado_por);

-- Compromisos
drop policy if exists "Lectura de compromisos" on public.compromisos;
create policy "Lectura de compromisos"
  on public.compromisos for select
  using (auth.role() = 'authenticated');

drop policy if exists "Registrar compromisos propios" on public.compromisos;
create policy "Registrar compromisos propios"
  on public.compromisos for insert
  with check (auth.role() = 'authenticated' and auth.uid() = registrado_por);

drop policy if exists "Editar compromisos propios o admin" on public.compromisos;
create policy "Editar compromisos propios o admin"
  on public.compromisos for update
  using (public.is_admin() or auth.uid() = registrado_por)
  with check (public.is_admin() or auth.uid() = registrado_por);

drop policy if exists "Eliminar compromisos propios o admin" on public.compromisos;
create policy "Eliminar compromisos propios o admin"
  on public.compromisos for delete
  using (public.is_admin() or auth.uid() = registrado_por);

-- ---------------------------------------------------------------------------
-- 5. Catálogo de permisos del módulo
-- ---------------------------------------------------------------------------
insert into public.modulos (id, nombre, descripcion, ruta, habilitado)
values
  ('minutas', 'Minutas', 'Registro y seguimiento de reuniones, compromisos y acuerdos', '/minutas', true)
on conflict (id) do nothing;

insert into public.herramientas (id, modulo_id, nombre, ruta, orden)
values
  ('mn-reuniones', 'minutas', 'Reuniones', '/reuniones', 1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. Refuerzo idempotente de restricciones
--    Si la migración ya se aplicó antes, garantiza que todo compromiso
--    tenga responsable y fecha tope de entrega obligatorios y que
--    registrado_por use auth.uid() por defecto (requisito RLS).
--    Nota: registrado_por es NULL en los seeds de simulación y el default
--    auth.uid() solo aplica cuando la BD corre bajo un usuario autenticado.
-- ---------------------------------------------------------------------------
alter table public.reuniones alter column registrado_por set default auth.uid();
alter table public.reuniones alter column registrado_por drop not null;
alter table public.compromisos alter column registrado_por set default auth.uid();
alter table public.compromisos alter column registrado_por drop not null;

update public.compromisos
set responsable = '—'
where responsable is null or btrim(responsable) = '';

update public.compromisos
set fecha_tope = current_date
where fecha_tope is null;

alter table public.compromisos alter column responsable set not null;
alter table public.compromisos alter column fecha_tope set not null;

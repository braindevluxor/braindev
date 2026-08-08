-- ============================================================================
-- BrainDev · Migración 0005: Sistema de permisos granulares
-- ----------------------------------------------------------------------------
-- Permite asignar módulos, herramientas y permisos específicos a cada usuario.
-- Estructura: usuario → módulos → herramientas → permisos (crear, leer, actualizar, eliminar)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabla de módulos disponibles
-- ---------------------------------------------------------------------------
create table if not exists public.modulos (
  id text primary key,
  nombre text not null,
  descripcion text,
  ruta text not null,
  habilitado boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.modulos is
  'Catálogo de módulos disponibles en el sistema.';

-- Insertar módulos existentes
insert into public.modulos (id, nombre, descripcion, ruta, habilitado)
values 
  ('gasto-presupuesto', 'Gasto vs Presupuesto', 'Control de gastos y presupuestos', '/gasto-presupuesto', true),
  ('usuarios', 'Usuarios', 'Gestión de usuarios del sistema', '/usuarios', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Tabla de herramientas/pestañas por módulo
-- ---------------------------------------------------------------------------
create table if not exists public.herramientas (
  id text primary key,
  modulo_id text not null references public.modulos(id) on delete cascade,
  nombre text not null,
  ruta text not null,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  unique (modulo_id, ruta)
);

comment on table public.herramientas is
  'Herramientas/pestañas disponibles dentro de cada módulo.';

-- Insertar herramientas existentes
insert into public.herramientas (id, modulo_id, nombre, ruta, orden)
values 
  ('gp-registro', 'gasto-presupuesto', 'Registro', '/registro', 1),
  ('gp-presupuestos', 'gasto-presupuesto', 'Presupuestos', '/presupuestos', 2),
  ('gp-reportes', 'gasto-presupuesto', 'Reportes', '/reportes', 3),
  ('usuarios-gestion', 'usuarios', 'Gestión de Usuarios', '/gestion', 1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Tabla de permisos por usuario
-- ---------------------------------------------------------------------------
create table if not exists public.permisos_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  modulo_id text not null references public.modulos(id) on delete cascade,
  herramienta_id text not null references public.herramientas(id) on delete cascade,
  puede_crear boolean not null default false,
  puede_leer boolean not null default false,
  puede_actualizar boolean not null default false,
  puede_eliminar boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, herramienta_id)
);

comment on table public.permisos_usuario is
  'Permisos granulares por usuario, módulo y herramienta.';

-- ---------------------------------------------------------------------------
-- 4. Trigger de updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists permisos_usuario_set_updated_at on public.permisos_usuario;
create trigger permisos_usuario_set_updated_at
  before update on public.permisos_usuario
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.modulos enable row level security;
alter table public.herramientas enable row level security;
alter table public.permisos_usuario enable row level security;

-- Lectura de módulos y herramientas para usuarios autenticados
create policy "Lectura de módulos"
  on public.modulos for select
  using (auth.role() = 'authenticated');

create policy "Lectura de herramientas"
  on public.herramientas for select
  using (auth.role() = 'authenticated');

-- Solo admins pueden gestionar permisos
create policy "Lectura de permisos propios"
  on public.permisos_usuario for select
  using (auth.uid() = usuario_id or public.is_admin());

create policy "Admins gestionan permisos"
  on public.permisos_usuario for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Función para verificar permisos
-- ---------------------------------------------------------------------------
create or replace function public.tiene_permiso(
  p_usuario_id uuid,
  p_herramienta_id text,
  p_accion text
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_permiso record;
begin
  -- Admins tienen todos los permisos
  if exists (select 1 from public.profiles where id = p_usuario_id and role = 'admin') then
    return true;
  end if;

  -- Verificar permiso específico
  select puede_crear, puede_leer, puede_actualizar, puede_eliminar
  into v_permiso
  from public.permisos_usuario
  where usuario_id = p_usuario_id and herramienta_id = p_herramienta_id;

  if not found then
    return false;
  end if;

  return case p_accion
    when 'crear' then v_permiso.puede_crear
    when 'leer' then v_permiso.puede_leer
    when 'actualizar' then v_permiso.puede_actualizar
    when 'eliminar' then v_permiso.puede_eliminar
    else false
  end;
end;
$$;

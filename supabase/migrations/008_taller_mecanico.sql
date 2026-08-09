-- ============================================================================
-- BrainDev · Migración 008: Taller Mecánico
-- ----------------------------------------------------------------------------
-- - vehiculos: flota de vehículos con sus características y estado activo/inactivo
-- - requisiciones: solicitudes de revisión, reparación u otros por vehículo
-- - Se registra el módulo y sus herramientas en el catálogo de permisos.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Vehículos
-- ---------------------------------------------------------------------------
create table if not exists public.vehiculos (
  id uuid primary key default gen_random_uuid(),
  placa text not null unique,
  marca text not null,
  modelo text not null,
  anio integer,
  color text,
  tipo text check (tipo in ('camioneta', 'sedan', 'camion', 'furgoneta', 'motocicleta', 'otro')),
  capacidad text,
  serial_motor text,
  serial_carroceria text,
  observaciones text,
  activo boolean not null default true,
  registrado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.vehiculos is
  'Flota de vehículos de la empresa y sus características.';

create index if not exists vehiculos_activo_idx on public.vehiculos (activo);

-- ---------------------------------------------------------------------------
-- 2. Requisiciones (solicitudes de taller)
-- ---------------------------------------------------------------------------
create table if not exists public.requisiciones (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos (id) on delete cascade,
  tipo text not null check (tipo in ('revision', 'reparacion', 'otro')),
  prioridad text check (prioridad in ('baja', 'media', 'alta')),
  descripcion text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'completado', 'cancelado')),
  fecha_solicitud date not null default current_date,
  fecha_estimada date,
  registrado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.requisiciones is
  'Solicitudes de revisión, reparación u otros servicios para vehículos.';

create index if not exists requisiciones_estado_idx on public.requisiciones (estado);
create index if not exists requisiciones_vehiculo_idx on public.requisiciones (vehiculo_id);

-- ---------------------------------------------------------------------------
-- 3. Triggers de updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists vehiculos_set_updated_at on public.vehiculos;
create trigger vehiculos_set_updated_at
  before update on public.vehiculos
  for each row execute procedure public.set_updated_at();

drop trigger if exists requisiciones_set_updated_at on public.requisiciones;
create trigger requisiciones_set_updated_at
  before update on public.requisiciones
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
--    Mismo criterio que movimientos: cualquiera autenticado lee y registra
--    (registrado_por forzado a su propio id); edición/eliminación: autor o admin.
-- ---------------------------------------------------------------------------
alter table public.vehiculos enable row level security;
alter table public.requisiciones enable row level security;

-- Vehículos
drop policy if exists "Lectura de vehiculos" on public.vehiculos;
create policy "Lectura de vehiculos"
  on public.vehiculos for select
  using (auth.role() = 'authenticated');

drop policy if exists "Registrar vehiculos propios" on public.vehiculos;
create policy "Registrar vehiculos propios"
  on public.vehiculos for insert
  with check (auth.role() = 'authenticated' and auth.uid() = registrado_por);

drop policy if exists "Editar vehiculos propios o admin" on public.vehiculos;
create policy "Editar vehiculos propios o admin"
  on public.vehiculos for update
  using (public.is_admin() or auth.uid() = registrado_por)
  with check (public.is_admin() or auth.uid() = registrado_por);

drop policy if exists "Eliminar vehiculos propios o admin" on public.vehiculos;
create policy "Eliminar vehiculos propios o admin"
  on public.vehiculos for delete
  using (public.is_admin() or auth.uid() = registrado_por);

-- Requisiciones
drop policy if exists "Lectura de requisiciones" on public.requisiciones;
create policy "Lectura de requisiciones"
  on public.requisiciones for select
  using (auth.role() = 'authenticated');

drop policy if exists "Registrar requisiciones propias" on public.requisiciones;
create policy "Registrar requisiciones propias"
  on public.requisiciones for insert
  with check (auth.role() = 'authenticated' and auth.uid() = registrado_por);

drop policy if exists "Editar requisiciones propias o admin" on public.requisiciones;
create policy "Editar requisiciones propias o admin"
  on public.requisiciones for update
  using (public.is_admin() or auth.uid() = registrado_por)
  with check (public.is_admin() or auth.uid() = registrado_por);

drop policy if exists "Eliminar requisiciones propias o admin" on public.requisiciones;
create policy "Eliminar requisiciones propias o admin"
  on public.requisiciones for delete
  using (public.is_admin() or auth.uid() = registrado_por);

-- ---------------------------------------------------------------------------
-- 5. Catálogo de permisos del módulo
-- ---------------------------------------------------------------------------
insert into public.modulos (id, nombre, descripcion, ruta, habilitado)
values
  ('taller-mecanico', 'Taller Mecánico', 'Gestión de la flota de vehículos y requisiciones de mantenimiento', '/taller-mecanico', true)
on conflict (id) do nothing;

insert into public.herramientas (id, modulo_id, nombre, ruta, orden)
values
  ('tm-vehiculos', 'taller-mecanico', 'Vehículos', '/vehiculos', 1),
  ('tm-requisiciones', 'taller-mecanico', 'Requisiciones', '/requisiciones', 2)
on conflict (id) do nothing;

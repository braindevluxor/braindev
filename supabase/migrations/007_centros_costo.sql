-- ============================================================================
-- BrainDev · Migración 007: Centros de Costo
-- ----------------------------------------------------------------------------
-- - razones_sociales: entidades legales/empresas
-- - centros_costo: centros de costo asociados a cada razón social
-- - movimientos: se actualiza para incluir centro_costo_id
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Razones Sociales
-- ---------------------------------------------------------------------------
create table if not exists public.razones_sociales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  rif text,
  direccion text,
  telefono text,
  email text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.razones_sociales is
  'Razones sociales / entidades legales de la empresa.';

-- ---------------------------------------------------------------------------
-- 2. Centros de Costo
-- ---------------------------------------------------------------------------
create table if not exists public.centros_costo (
  id uuid primary key default gen_random_uuid(),
  razon_social_id uuid not null references public.razones_sociales (id) on delete cascade,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (razon_social_id, nombre)
);

comment on table public.centros_costo is
  'Centros de costo asociados a cada razón social.';

-- ---------------------------------------------------------------------------
-- 3. Actualizar movimientos para incluir centro de costo
-- ---------------------------------------------------------------------------
alter table public.movimientos
add column if not exists centro_costo_id uuid references public.centros_costo (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 4. Triggers de updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists razones_sociales_set_updated_at on public.razones_sociales;
create trigger razones_sociales_set_updated_at
  before update on public.razones_sociales
  for each row execute procedure public.set_updated_at();

drop trigger if exists centros_costo_set_updated_at on public.centros_costo;
create trigger centros_costo_set_updated_at
  before update on public.centros_costo
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.razones_sociales enable row level security;
alter table public.centros_costo enable row level security;

-- Razones Sociales
drop policy if exists "Lectura de razones_sociales" on public.razones_sociales;
create policy "Lectura de razones_sociales"
  on public.razones_sociales for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admins gestionan razones_sociales" on public.razones_sociales;
create policy "Admins gestionan razones_sociales"
  on public.razones_sociales for all
  using (public.is_admin())
  with check (public.is_admin());

-- Centros de Costo
drop policy if exists "Lectura de centros_costo" on public.centros_costo;
create policy "Lectura de centros_costo"
  on public.centros_costo for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admins gestionan centros_costo" on public.centros_costo;
create policy "Admins gestionan centros_costo"
  on public.centros_costo for all
  using (public.is_admin())
  with check (public.is_admin());

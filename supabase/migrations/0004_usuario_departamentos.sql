-- ============================================================================
-- BrainDev · Migración 0004: Asignación de unidades presupuestarias a usuarios
-- ----------------------------------------------------------------------------
-- Permite asignar uno o más departamentos a cada usuario para controlar
-- qué unidades presupuestarias puede gestionar.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabla de relación usuario-departamento
-- ---------------------------------------------------------------------------
create table if not exists public.usuario_departamentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  departamento_id uuid not null references public.departamentos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (usuario_id, departamento_id)
);

comment on table public.usuario_departamentos is
  'Relación entre usuarios y departamentos asignados.';

-- ---------------------------------------------------------------------------
-- 2. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.usuario_departamentos enable row level security;

create policy "Lectura de asignaciones"
  on public.usuario_departamentos for select
  using (auth.role() = 'authenticated');

create policy "Admins gestionan asignaciones"
  on public.usuario_departamentos for all
  using (public.is_admin())
  with check (public.is_admin());

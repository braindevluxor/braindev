-- ============================================================================
-- BrainDev · Sistema integral empresarial
-- Migración 0001: estructura inicial (profiles + triggers + RLS)
-- Aplicar en el SQL Editor de Supabase (o con `supabase db push`).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabla de perfiles. Refleja a cada usuario de auth.users y guarda
--    los datos de negocio: nombre, rol y estado activo/inactivo.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'usuario'
    check (role in ('admin', 'usuario')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Datos de negocio de cada cuenta del sistema.';

-- ---------------------------------------------------------------------------
-- 2. Trigger: crear el perfil automáticamente al registrarse un usuario.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Trigger: mantener updated_at actualizado.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Función de ayuda: ¿el usuario actual es administrador?
--    Se marca SECURITY DEFINER para evaluarse con permisos del propietario
--    de la tabla y SIN reaplicar RLS dentro de la política. Esto evita la
--    recursión infinita que se produciría si la política consultara la misma
--    tabla directamente (error 42P17).
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- ---------------------------------------------------------------------------
-- 5. Row Level Security: los administradores gestionan perfiles; cada
--    usuario solo lee su propio perfil. Las mutaciones (crear/editar/
--    eliminar cuentas) se hacen mediante la Edge Function gestion-usuarios,
--    que usa la service_role y verifica que el solicitante sea admin.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Admins leen todos los perfiles" on public.profiles;
create policy "Admins leen todos los perfiles"
  on public.profiles
  for select
  using (public.is_admin());

drop policy if exists "Usuarios leen su propio perfil" on public.profiles;
create policy "Usuarios leen su propio perfil"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Admins actualizan perfiles" on public.profiles;
create policy "Admins actualizan perfiles"
  on public.profiles
  for update
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Procedimiento de auditoría / arranque:
--    Promover al primer administrador. Ejecutar una sola vez con el UUID
--    del usuario creado desde el dashboard:
--
--    update public.profiles set role = 'admin'
--    where id = 'TU-UUID-DE-USUARIO';
-- ---------------------------------------------------------------------------

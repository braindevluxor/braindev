-- ============================================================================
-- BrainDev · Migración 0002: gestión de usuarios mediante RPC (SQL puro)
-- ----------------------------------------------------------------------------
-- Funciones SECURITY DEFINER que la app invoca con supabase.rpc().
-- No requieren Edge Functions ni la service_role en el frontend:
--   - El navegador llama a la función con el JWT del usuario autenticado.
--   - La función verifica que el llamante sea administrador (is_admin()).
--   - Internamente opera sobre auth.users y public.profiles con privilegios
--     elevados (propietario: postgres), protegidas de la exposición pública.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Crear usuario (cuenta de login + perfil).
--    Insertar directamente en auth.users con hash bcrypt compatible con
--    Supabase Auth permite iniciar sesión sin confirmación de correo.
-- ---------------------------------------------------------------------------
create or replace function public.crear_usuario(
  p_email text,
  p_password text,
  p_full_name text default '',
  p_role text default 'usuario'
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Requiere rol de administrador';
  end if;

  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'El correo es obligatorio';
  end if;
  if p_password is null or length(p_password) < 8 then
    raise exception 'La contraseña debe tener al menos 8 caracteres';
  end if;
  if p_role is null or p_role not in ('admin', 'usuario') then
    raise exception 'Rol inválido';
  end if;

  if exists (select 1 from auth.users where lower(email) = lower(trim(p_email))) then
    raise exception 'Ya existe un usuario con ese correo';
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    now(),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', coalesce(trim(p_full_name), ''))
  )
  returning id into v_user_id;

  -- El trigger on_auth_user_created ya inserta el perfil; aquí se ajusta rol/nombre.
  insert into public.profiles (id, email, full_name, role)
  values (v_user_id, lower(trim(p_email)), coalesce(trim(p_full_name), ''), p_role)
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role;

  return v_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Actualizar usuario (nombre, rol, activo/inactivo).
--    is_active=false bloquea el login a nivel de Auth (banned_until).
-- ---------------------------------------------------------------------------
create or replace function public.actualizar_usuario(
  p_user_id uuid,
  p_full_name text default null,
  p_role text default null,
  p_is_active boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Requiere rol de administrador';
  end if;

  if p_role is not null and p_role not in ('admin', 'usuario') then
    raise exception 'Rol inválido';
  end if;

  if p_full_name is not null then
    update auth.users
    set raw_user_meta_data = jsonb_set(
          coalesce(raw_user_meta_data, '{}'::jsonb),
          '{full_name}',
          to_jsonb(trim(p_full_name))
        ),
        updated_at = now()
    where id = p_user_id;
  end if;

  if p_is_active is not null then
    update auth.users
    set banned_until = case
          when p_is_active then null
          else now() + interval '876000 hours'  -- ~100 años: bloqueo efectivo
        end,
        updated_at = now()
    where id = p_user_id;
  end if;

  update public.profiles
  set full_name = coalesce(trim(p_full_name), full_name),
      role = coalesce(p_role, role),
      is_active = coalesce(p_is_active, is_active)
  where id = p_user_id;

  if not found then
    raise exception 'Usuario no encontrado';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Eliminar usuario (borra la cuenta de Auth; el perfil se elimina por cascada).
-- ---------------------------------------------------------------------------
create or replace function public.eliminar_usuario(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Requiere rol de administrador';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta';
  end if;

  delete from auth.users where id = p_user_id;

  if not found then
    raise exception 'Usuario no encontrado';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Permisos: SOLO los usuarios autenticados pueden invocar estas funciones.
--    Se revoca el permiso por defecto (PUBLIC) y se otorga a `authenticated`.
-- ---------------------------------------------------------------------------
revoke execute on function public.crear_usuario(text, text, text, text) from public, anon;
grant execute on function public.crear_usuario(text, text, text, text) to authenticated;

revoke execute on function public.actualizar_usuario(uuid, text, text, boolean) from public, anon;
grant execute on function public.actualizar_usuario(uuid, text, text, boolean) to authenticated;

revoke execute on function public.eliminar_usuario(uuid) from public, anon;
grant execute on function public.eliminar_usuario(uuid) to authenticated;

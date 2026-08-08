# BRAINDEV · Sistema integral empresarial — Documentación BACKEND

> Documento de referencia para el equipo que herede y audite el backend.
> Leer junto con `docs/FRONTEND.md`.

---

## 1. Resumen

El backend se apoya en **Supabase** (PostgreSQL + Auth + RPC). No existe servidor
propio ni Edge Functions: toda la lógica vive en **migraciones SQL** del proyecto.
La app se conecta con el SDK (`supabase-js`) usando la **clave anónima**; la
seguridad se delega en **Row Level Security (RLS)** y en funciones Postgres
**SECURITY DEFINER** que validan al solicitante.

## 2. Componentes

```
supabase/
└── migrations/
    ├── 0001_inicial.sql             ← tabla profiles + triggers + RLS
    └── 0002_gestion_usuarios_rpc.sql ← RPCs para crear/editar/eliminar cuentas
```

## 3. Modelo de datos

### Tabla `public.profiles`

Refleja cada cuenta de `auth.users` y guarda los datos de negocio.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK, FK → auth.users) | Se elimina en cascada si se borra la cuenta |
| `email` | text not null | Correo de la cuenta |
| `full_name` | text not null default '' | Nombre visible |
| `role` | text, `check` in ('admin','usuario') | Rol de acceso |
| `is_active` | boolean default true | Cuenta activa/inactiva |
| `created_at` | timestamptz default now() | Fecha de alta |
| `updated_at` | timestamptz default now() | Última modificación |

### Funciones

| Función | Tipo | Qué hace |
|---|---|---|
| `handle_new_user()` | trigger, `security definer` | Crea el perfil al insertar en `auth.users` |
| `set_updated_at()` | trigger | Actualiza `updated_at` en UPDATE |
| `is_admin()` | sql, `security definer` | ¿El usuario actual tiene rol `admin`? Usada por políticas RLS y RPCs |
| `crear_usuario()` | plpgsql, `security definer` | Crea cuenta de Auth + perfil (migración 0002) |
| `actualizar_usuario()` | plpgsql, `security definer` | Edita nombre/rol/estado (migración 0002) |
| `eliminar_usuario()` | plpgsql, `security definer` | Borra la cuenta (migración 0002) |

> **`is_admin()`:** se declara `security definer` para evaluarse con permisos del
> propietario de la tabla y **sin reaplicar RLS** dentro de la política. Consultar
> `profiles` directamente dentro de la política causaba *infinite recursion
> detected in policy* (error 42P17).

### Row Level Security

| Política | Operación | Condición |
|---|---|---|
| Admins leen todos los perfiles | SELECT | `public.is_admin()` |
| Usuarios leen su propio perfil | SELECT | `auth.uid() = id` |
| Admins actualizan perfiles | UPDATE | `public.is_admin()` |

> Las mutaciones sobre `auth.users` **no** se exponen vía API REST: solo son
> posibles dentro de las RPCs `security definer` (que verifican rol admin) o por
> el dashboard. Esto mantiene el principio de *menor privilegio*.

## 4. Autenticación

- **Mecanismo:** Supabase Auth, correo + contraseña (`signInWithPassword`).
- **Sesión:** JWT emitido por Supabase; el SDK lo adjunta automáticamente a
  consultas REST y a `supabase.rpc()`.
- **Alta de usuarios:** solo vía RPC `crear_usuario` (o dashboard). La función
  inserta la cuenta en `auth.users` con hash bcrypt (`crypt`/`gen_salt` de
  pgcrypto) y marca `email_confirmed_at`, por lo que se puede iniciar sesión sin
  confirmar correo.
- **Baja lógica:** `is_active=false` → la RPC `actualizar_usuario` fija
  `banned_until` (~100 años) en `auth.users`: el usuario desactivado **no puede
  iniciar sesión**. Reactivar borra `banned_until`.
- **Baja física:** RPC `eliminar_usuario` borra la cuenta de Auth; `profiles` se
  elimina por cascada (FK).

### Arranque: primer administrador

1. Crear la primera cuenta por el dashboard (Authentication → Users → Add user)
   **o** directamente por SQL (ver `crear_usuario` con `p_role := 'admin'`).
2. Promoverla a admin ejecutando en el SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = '<UUID-DEL-USUARIO>';
   ```
3. Desde ese momento se gestionan más usuarios desde el módulo Usuarios de la app.

## 5. RPCs de gestión de usuarios (migración 0002)

Las tres funciones son `SECURITY DEFINER` (se ejecutan con privilegios de
`postgres`) y **verifican `is_admin()` en cada llamada**, por lo que un usuario
común no puede invocarlas. Además se revoca `EXECUTE` para `public`/`anon` y solo
se concede a `authenticated`.

| RPC | Parámetros | Efecto |
|---|---|---|
| `crear_usuario` | `p_email, p_password, p_full_name, p_role` | Crea cuenta + perfil; devuelve el `uuid` creado |
| `actualizar_usuario` | `p_user_id, p_full_name?, p_role?, p_is_active?` | Edita nombre/rol/estado; bloquea login si inactivo |
| `eliminar_usuario` | `p_user_id` | Borra la cuenta. Prohibido sobre sí mismo |

### Validaciones de negocio

- `p_password` con mínimo 8 caracteres (validado en frontend y backend).
- `p_role` solo acepta `admin` | `usuario`.
- Correo único: se rechaza si ya existe.
- Un administrador **no puede eliminarse a sí mismo**.
- `is_active=false` → `banned_until` en Auth (bloqueo de login efectivo).

## 6. Puesta en marcha (Supabase)

### En el SQL Editor del dashboard

1. Ejecutar `0001_inicial.sql` (esquema + triggers + RLS).
2. Ejecutar `0002_gestion_usuarios_rpc.sql` (RPCs + permisos).
3. Crear el primer usuario y promoverlo a admin (sección 4).

No se requiere CLI, Edge Functions, ni la `service_role` en el frontend.

### Opción CLI (opcional)

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push
```

## 7. Checklist de auditoría (backend)

- [ ] RLS habilitado en `profiles`; no hay políticas INSERT/DELETE desde el cliente.
- [ ] Las RPCs de mutación verifican `is_admin()` en **cada** llamada (no confían en el frontend).
- [ ] Las RPCs usan `security definer` con `search_path` fijo (previene inyección por search_path).
- [ ] `EXECUTE` de las RPCs revocado a `public`/`anon`; concedido solo a `authenticated`.
- [ ] La contraseña nunca se loguea; solo se pasa a `crypt()` para el hash.
- [ ] Las cuentas inactivas quedan bloqueadas a nivel de Auth (`banned_until`).
- [ ] Un admin no puede eliminarse a sí mismo.
- [ ] Correo único validado antes de insertar.
- [ ] El trigger `on_auth_user_created` usa `security definer` con `search_path` fijo.

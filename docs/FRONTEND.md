# BRAINDEV · Sistema integral empresarial — Documentación FRONTEND

> Documento de referencia para el equipo que herede y audite el frontend.
> Leer junto con `docs/BACKEND.md`.

---

## 1. Resumen

Frontend tipo SPA (Single Page Application) construido con **React 19 + Vite + TypeScript**.
Proporciona el shell del sistema: **login**, **barra de navegación superior con selector de módulos**,
**botón de cerrar sesión** y el primer módulo operativo (**Usuarios**).

Cada módulo tiene **su propio color plano** (paleta definida en configuración).
Cuando se activa un módulo, su paleta se propaga a todo el shell mediante
variables CSS (`--mod-color*`).

## 2. Stack y dependencias

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | Librería de UI |
| Vite | 8 | Bundler / dev server |
| TypeScript | 6 | Tipado estático |
| react-router-dom | 7 | Rutas y navegación |
| @supabase/supabase-js | 2 | Cliente Supabase (Auth + SDK) |
| oxlint | 1 | Linter (script `npm run lint`) |

## 3. Estructura de carpetas

```
frontend/
├── index.html
├── vite.config.ts
├── tsconfig*.json
├── .env.example              ← plantilla de variables de entorno
└── src/
    ├── main.tsx              ← punto de entrada (BrowserRouter + AuthProvider)
    ├── App.tsx               ← rutas + shell protegido
    ├── index.css             ← estilos globales y sistema de color por módulo
    ├── lib/supabase.ts       ← cliente Supabase (URL + anon key)
    ├── types/index.ts        ← tipos de dominio compartidos
    ├── config/modules.ts     ← REGISTRO DE MÓDULOS (colores planos)
    ├── contexts/AuthContext.tsx ← sesión, perfil y rol
    ├── components/
    │   ├── Login.tsx         ← pantalla de login
    │   ├── NavBar.tsx        ← barra superior + usuario + logout
    │   └── ModuleSelector.tsx← selector desplegable de módulos
    └── modules/
        └── usuarios/
            ├── UsuariosPage.tsx ← listado y acciones del módulo
            ├── UsuarioForm.tsx  ← modal crear/editar usuario
            └── services.ts      ← cliente de la Edge Function gestion-usuarios
```

## 4. Variables de entorno

Se leen desde el frontend (prefijo `VITE_`). Copiar `.env.example` a `.env`:

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anónima (anon key) |
| `VITE_EDGE_FUNCTION_URL` | (opcional) URL base de Edge Functions |

> **Seguridad:** solo se exponen la URL y la clave `anon` (pública por diseño,
> protegida por RLS en la base). **Nunca** incluir la `service_role` en el frontend.

## 5. Flujo de autenticación

1. `AuthProvider` (contexts/AuthContext.tsx) restaura la sesión al cargar:
   `supabase.auth.getSession()` + suscriptor `onAuthStateChange`.
2. Con el `user` cargado, consulta su fila en `public.profiles` (RLS permite
   a cada usuario leer su propio perfil).
3. `useAuth()` expone: `user`, `perfil`, `cargando`, `esAdmin`, `iniciarSesion`, `cerrarSesion`.
4. El rol `admin`/`usuario` se obtiene de `perfil.role`. La gestión de cuentas
   solo está disponible para `admin`.

**Rutas y protección (App.tsx):**

| Ruta | Comportamiento |
|---|---|
| `/login` | Si hay sesión → redirige a `/` |
| `/` (shell) | Si no hay sesión → redirige a `/login` |
| `/usuarios` | Módulo Usuarios (solo admin) |
| `*` | Redirige a `/` |

## 6. Sistema de módulos y colores planos

El registro de módulos vive en `src/config/modules.ts`. Estructura de cada módulo:

```ts
interface ModuloConfig {
  id: string
  nombre: string
  descripcion: string
  ruta: string
  habilitado: boolean
  color: {
    principal: string   // color plano del módulo (navbar, botones, avatares)
    oscuro: string      // variante hover
    suave: string       // fondo de encabezados/tablas del módulo
    contraste: string   // texto sobre principal
  }
}
```

| Módulo | Color plano | Estado |
|---|---|---|
| **Usuarios** | `#2563EB` (azul) | ✔ habilitado |
| Inventario | `#059669` (verde) | en desarrollo |
| Ventas | `#EA580C` (naranja) | en desarrollo |
| Reportes | `#7C3AED` (morado) | en desarrollo |

Al navegar a la ruta de un módulo, `AppShell` inyecta la paleta como variables
CSS en el contenedor raíz:

```css
--mod-color: <principal>
--mod-color-dark: <oscuro>
--mod-color-soft: <suave>
--mod-color-contrast: <contraste>
```

Todos los estilos del shell (navbar, botones, tablas, badges) consumen esas
variables, por lo que el color del módulo activo cambia la interfaz completa.

### Cómo añadir un módulo nuevo

1. Crear la página en `src/modules/<id>/`.
2. Registrar la ruta en `App.tsx` (dentro de `<AppShell>`).
3. Añadir la entrada en `config/modules.ts` con su paleta de colores planos
   y `habilitado: true`.
4. (Opcional) Exigir rol mínimo si aplica: filtrar en `AppShell`.

## 7. Módulo Usuarios

- **Listado:** lee `public.profiles` por SDK (RLS permite a los admins leer todos los perfiles).
- **Crear / Editar / Eliminar:** invoca las funciones Postgres `crear_usuario`,
  `actualizar_usuario` y `eliminar_usuario` mediante `supabase.rpc()`.
  Estas funciones son `SECURITY DEFINER`: verifican que el solicitante sea admin
  y operan sobre las cuentas con privilegios elevados (detalle en `docs/BACKEND.md` §5).
- **Activar/Desactivar:** RPC `actualizar_usuario` con `is_active`; además de
  cambiar el estado en `profiles`, el backend bloquea el login del usuario a nivel de Auth.
- **Eliminar:** prohibido sobre la propia cuenta (validado en el backend).

Toda la lógica de acceso vive en `modules/usuarios/services.ts`.

## 8. Scripts disponibles

```bash
cd frontend
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # typecheck (tsc -b) + build de producción
npm run lint       # lint con oxlint
npm run preview    # previsualizar el build de producción
```

## 9. Checklist de auditoría (frontend)

- [ ] No existe ninguna clave `service_role` ni secreto en el frontend.
- [ ] La sesión se restaura de forma segura vía `onAuthStateChange`.
- [ ] Las rutas protegidas redirigen a `/login` si no hay sesión.
- [ ] Las rutas del shell solo exponen módulos con `habilitado: true`.
- [ ] El rol se verifica en el cliente (UI) y **también** en el backend (funciones `security definer`).
- [ ] El formulario valida contraseña mínima de 8 caracteres.
- [ ] Los mensajes de error no filtran información sensible.

# BrainDev · Sistema integral empresarial

Sistema integral con login, barra de navegación superior con **selector de módulos**,
botón de **cerrar sesión** y colores planos por módulo. Base de datos en **Supabase**.

## Estructura del repositorio

```
BrainDev/
├── README.md                      ← este archivo (índice)
├── docs/
│   ├── FRONTEND.md                ← documentación completa del frontend
│   └── BACKEND.md                 ← documentación completa del backend
├── frontend/                      ← aplicación React + Vite + TypeScript
└── supabase/
    └── migrations/
        ├── 0001_inicial.sql             ← tabla profiles + triggers + RLS
        └── 0002_gestion_usuarios_rpc.sql ← RPCs para gestión de cuentas
```

## Módulos y colores planos

| Módulo | Color plano | Estado |
|---|---|---|
| Usuarios | `#2563EB` azul | ✔ operativo |
| Inventario | `#059669` verde | en desarrollo |
| Ventas | `#EA580C` naranja | en desarrollo |
| Reportes | `#7C3AED` morado | en desarrollo |

## Puesta en marcha (resumen)

1. **Frontend:** `cd frontend && npm install`, copiar `.env.example` a `.env` y completar.
2. **Base de datos:** en el SQL Editor de Supabase ejecutar `0001_inicial.sql` y
   después `0002_gestion_usuarios_rpc.sql`.
3. **Primer admin:** crear un usuario y promoverlo a admin (ver `docs/BACKEND.md` §4).

No se requiere CLI, Edge Functions ni la `service_role` en el frontend.
Detalle completo en `docs/FRONTEND.md` y `docs/BACKEND.md`.

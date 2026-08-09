import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { PermisosProvider } from './contexts/PermisosContext'
import Login from './components/Login'
import NavBar from './components/NavBar'
import UsuariosPage from './modules/usuarios/UsuariosPage'
import UsuariosLista from './modules/usuarios/UsuariosLista'
import UsuarioForm from './modules/usuarios/UsuarioForm'
import UsuarioPermisos from './modules/usuarios/UsuarioPermisos'
import GastoPresupuestoPage, {
  RegistroTab,
  PresupuestosTab,
  ReportesTab,
  CentrosCostoTab,
} from './modules/gasto-presupuesto'
import TallerMecanicoPage, {
  VehiculosTab,
  RequisicionesTab,
} from './modules/taller-mecanico'
import MinutasPage, { ReunionesTab } from './modules/minutas'
import { MODULOS, obtenerModuloPorRuta } from './config/modules'
import type { CSSProperties } from 'react'
function PantallaCarga() {
  return (
    <div className="pantalla-carga">
      <div className="spinner" />
      <p>Cargando sistema…</p>
    </div>
  )
}

/** Shell protegido: aplica la paleta del módulo activo vía variables CSS. */
function AppShell() {
  const { user, perfil, cargando } = useAuth()
  const location = useLocation()

  if (cargando) return <PantallaCarga />
  if (!user) return <Navigate to="/login" replace />

  const modulo = obtenerModuloPorRuta(location.pathname) ?? MODULOS[0]

  const estilo = {
    '--mod-color': modulo.color.principal,
    '--mod-color-dark': modulo.color.oscuro,
    '--mod-color-soft': modulo.color.suave,
    '--mod-color-contrast': modulo.color.contraste,
  } as CSSProperties

  return (
    <div className="app" style={estilo}>
      <NavBar moduloActivo={modulo} />
      <main className="app-main">
        {perfil && perfil.role !== 'admin' ? (
          <div className="sin-acceso">
            <h2>Sin acceso</h2>
            <p>Tu cuenta no tiene permisos para usar este módulo.</p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <PermisosProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/usuarios" replace />} />
          <Route path="usuarios" element={<UsuariosPage />}>
            <Route index element={<UsuariosLista />} />
            <Route path="crear" element={<UsuarioForm />} />
            <Route path="editar/:id" element={<UsuarioForm />} />
            <Route path="permisos/:id" element={<UsuarioPermisos />} />
          </Route>
          <Route path="gasto-presupuesto" element={<GastoPresupuestoPage />}>
            <Route index element={<Navigate to="registro" replace />} />
            <Route path="registro" element={<RegistroTab />} />
            <Route path="presupuestos" element={<PresupuestosTab />} />
            <Route path="reportes" element={<ReportesTab />} />
            <Route path="centros-costo" element={<CentrosCostoTab />} />
          </Route>
          <Route path="taller-mecanico" element={<TallerMecanicoPage />}>
            <Route index element={<Navigate to="vehiculos" replace />} />
            <Route path="vehiculos" element={<VehiculosTab />} />
            <Route path="requisiciones" element={<RequisicionesTab />} />
          </Route>
          <Route path="minutas" element={<MinutasPage />}>
            <Route index element={<Navigate to="reuniones" replace />} />
            <Route path="reuniones" element={<ReunionesTab />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PermisosProvider>
  )
}

function LoginPage() {
  const { user, cargando } = useAuth()
  if (cargando) return <PantallaCarga />
  if (user) return <Navigate to="/" replace />
  return <Login />
}

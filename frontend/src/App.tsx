import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import NavBar from './components/NavBar'
import UsuariosPage from './modules/usuarios/UsuariosPage'
import GastoPresupuestoPage, {
  RegistroTab,
  PresupuestosTab,
  ReportesTab,
} from './modules/gasto-presupuesto'
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
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/usuarios" replace />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="gasto-presupuesto" element={<GastoPresupuestoPage />}>
          <Route index element={<Navigate to="registro" replace />} />
          <Route path="registro" element={<RegistroTab />} />
          <Route path="presupuestos" element={<PresupuestosTab />} />
          <Route path="reportes" element={<ReportesTab />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function LoginPage() {
  const { user, cargando } = useAuth()
  if (cargando) return <PantallaCarga />
  if (user) return <Navigate to="/" replace />
  return <Login />
}

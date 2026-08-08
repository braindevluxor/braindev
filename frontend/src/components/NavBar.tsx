import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ModuleSelector from './ModuleSelector'
import type { ModuloConfig } from '../types'

interface Props {
  moduloActivo: ModuloConfig
}

export default function NavBar({ moduloActivo }: Props) {
  const { user, perfil, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const [cerrando, setCerrando] = useState(false)

  async function onCerrarSesion() {
    setCerrando(true)
    try {
      await cerrarSesion()
      navigate('/login', { replace: true })
    } finally {
      setCerrando(false)
    }
  }

  const nombre = perfil?.full_name?.trim() || user?.email || 'Usuario'
  const inicial = (perfil?.full_name || user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <header className="navbar">
      <div className="navbar-inicio">
        <span className="navbar-logo" aria-hidden="true">
          B
        </span>
        <span className="navbar-titulo">BrainDev</span>
      </div>

      <div className="navbar-modulos">
        <ModuleSelector moduloActivo={moduloActivo} />
      </div>

      <div className="navbar-usuario">
        <span className="navbar-avatar" style={{ backgroundColor: moduloActivo.color.principal }}>
          {inicial}
        </span>
        <div className="navbar-usuario-info">
          <strong>{nombre}</strong>
          <small>{perfil?.role === 'admin' ? 'Administrador' : 'Usuario'}</small>
        </div>
        <button
          type="button"
          className="btn-logout"
          onClick={onCerrarSesion}
          disabled={cerrando}
          title="Cerrar sesión"
        >
          {cerrando ? '…' : 'Cerrar sesión'}
        </button>
      </div>
    </header>
  )
}

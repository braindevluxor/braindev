import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ModuleSelector from './ModuleSelector'
import type { ModuloConfig } from '../types'

interface Props {
  moduloActivo: ModuloConfig
}

export default function NavBar({ moduloActivo }: Props) {
  const { user, perfil, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function alClicFuera(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', alClicFuera)
    return () => document.removeEventListener('mousedown', alClicFuera)
  }, [])

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
  const rol = perfil?.role === 'admin' ? 'Administrador' : 'Usuario'

  return (
    <header className="navbar">
      <div className="navbar-inicio">
        <span className="navbar-logo" aria-hidden="true">
          B
        </span>
        <span className="navbar-titulo">BrainDev</span>
      </div>

      {moduloActivo.pestanas.length > 0 && (
        <nav className="navbar-pestanas" role="tablist" aria-label="Secciones del módulo">
          {moduloActivo.pestanas.map((p) => {
            const Icono = p.icono
            const activa = location.pathname === p.ruta
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={activa}
                title={p.etiqueta}
                className={`nav-pestana ${activa ? 'activa' : ''}`}
                onClick={() => navigate(p.ruta)}
              >
                <span className="nav-pestana-icono">
                  <Icono />
                </span>
                <span className="nav-pestana-texto">{p.etiqueta}</span>
              </button>
            )
          })}
        </nav>
      )}

      <div className="navbar-acciones">
        <ModuleSelector moduloActivo={moduloActivo} />

        <div className="menu-usuario" ref={menuRef}>
          <button
            type="button"
            className="menu-usuario-boton"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
            title="Menú de usuario"
          >
            <span className="navbar-avatar" style={{ backgroundColor: moduloActivo.color.principal }}>
              {inicial}
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 9h12M6 15h12" strokeLinecap="round" />
            </svg>
          </button>

          {menuAbierto && (
            <div className="menu-usuario-panel" role="menu">
              <div className="menu-usuario-info">
                <span className="navbar-avatar" style={{ backgroundColor: moduloActivo.color.principal }}>
                  {inicial}
                </span>
                <div>
                  <strong>{nombre}</strong>
                  <small>{rol}</small>
                </div>
              </div>
              <button
                type="button"
                className="menu-usuario-salir"
                onClick={onCerrarSesion}
                disabled={cerrando}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="m16 17 5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {cerrando ? 'Cerrando…' : 'Cerrar sesión'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

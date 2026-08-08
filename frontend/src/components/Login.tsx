import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

function IconoCorreo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3.5 7.5 8.5 5 8.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconoCandado() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconoOjo({ abierto }: { abierto: boolean }) {
  return abierto ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.7M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.6-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CampoIcono({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <div className="campo-icono">
      <span className="campo-icono-ico">{icono}</span>
      {children}
    </div>
  )
}

export default function Login() {
  const { iniciarSesion } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (enviando) return
    setError(null)
    setEnviando(true)
    try {
      await iniciarSesion(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
      setEnviando(false)
    }
  }

  return (
    <div className="login-fondo">
      <div className="login-tarjeta">
        <aside className="login-panel">
          <div className="login-marca">
            <span className="login-logo">B</span>
            <div>
              <h1>BrainDev</h1>
              <p>Sistema integral empresarial</p>
            </div>
          </div>

          <div className="login-panel-texto">
            <h2>Gestiona tu empresa en un solo lugar</h2>
            <p>
              Usuarios, gastos, presupuestos y reportes: toda la información
              de tu negocio, organizada y segura.
            </p>
          </div>

          <ul className="login-lista">
            <li>
              <span className="login-lista-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Control de usuarios y roles
            </li>
            <li>
              <span className="login-lista-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Registro de gastos e ingresos
            </li>
            <li>
              <span className="login-lista-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Reportes y presupuestos
            </li>
          </ul>

          <p className="login-panel-pie">Acceso restringido para personal autorizado</p>
        </aside>

        <div className="login-formulario">
          <div className="login-formulario-cab">
            <h2>Bienvenido de nuevo</h2>
            <p>Inicia sesión con tu cuenta para continuar</p>
          </div>

          <form onSubmit={onSubmit} className="login-form" noValidate>
            <label className="campo">
              <span>Correo electrónico</span>
              <CampoIcono icono={<IconoCorreo />}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </CampoIcono>
            </label>

            <label className="campo">
              <span>Contraseña</span>
              <CampoIcono icono={<IconoCandado />}>
                <input
                  type={verPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="campo-icono-ojo"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <IconoOjo abierto={verPassword} />
                </button>
              </CampoIcono>
            </label>

            {error && (
              <div className="alerta error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primario" disabled={enviando}>
              {enviando ? (
                <>
                  <span className="spinner spinner-mini" />
                  Ingresando…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <p className="login-formulario-pie">
            ¿Olvidaste tu contraseña? Contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  )
}

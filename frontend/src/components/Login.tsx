import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { iniciarSesion } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await iniciarSesion(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-fondo">
      <div className="login-tarjeta">
        <div className="login-marca">
          <span className="login-logo">B</span>
          <h1>BrainDev</h1>
        </div>
        <p className="login-sub">Sistema integral empresarial</p>

        <form onSubmit={onSubmit} className="login-form" noValidate>
          <label className="campo">
            <span>Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="campo">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="alerta error">{error}</div>}

          <button type="submit" className="btn-primario" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

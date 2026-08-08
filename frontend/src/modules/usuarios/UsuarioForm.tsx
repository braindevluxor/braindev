import { useEffect, useState, type FormEvent } from 'react'
import type { Perfil, Rol } from '../../types'
import {
  usuariosService,
  type DatosCrearUsuario,
  type DatosActualizarUsuario,
} from './services'

type Modo = 'crear' | 'editar'

interface Props {
  modo: Modo
  perfil?: Perfil | null
  onCancelar: () => void
  onGuardado: (mensaje: string) => void
}

const ROLES: { valor: Rol; etiqueta: string }[] = [
  { valor: 'usuario', etiqueta: 'Usuario' },
  { valor: 'admin', etiqueta: 'Administrador' },
]

export default function UsuarioForm({ modo, perfil, onCancelar, onGuardado }: Props) {
  const [email, setEmail] = useState(perfil?.email ?? '')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState(perfil?.full_name ?? '')
  const [role, setRole] = useState<Rol>(perfil?.role ?? 'usuario')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const esCrear = modo === 'crear'

  useEffect(() => {
    function onTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancelar()
    }
    document.addEventListener('keydown', onTecla)
    return () => document.removeEventListener('keydown', onTecla)
  }, [onCancelar])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)

    const datos: DatosCrearUsuario | DatosActualizarUsuario = esCrear
      ? { email: email.trim(), password, full_name: fullName.trim(), role }
      : {
          user_id: perfil!.id,
          full_name: fullName.trim() || undefined,
          role,
        }

    const res = esCrear
      ? await usuariosService.crear(datos as DatosCrearUsuario)
      : await usuariosService.actualizar(datos as DatosActualizarUsuario)

    if (res.error) {
      setError(res.error.message)
      setEnviando(false)
      return
    }
    setEnviando(false)
    onGuardado(esCrear ? 'Usuario creado correctamente' : 'Usuario actualizado correctamente')
  }

  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{esCrear ? 'Nuevo usuario' : 'Editar usuario'}</h3>

        <form onSubmit={onSubmit} className="login-form" noValidate>
          <label className="campo">
            <span>Nombre completo</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nombre y apellidos"
              required
            />
          </label>

          {esCrear && (
            <>
              <label className="campo">
                <span>Correo electrónico</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  autoComplete="off"
                  required
                />
              </label>

              <label className="campo">
                <span>Contraseña</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            </>
          )}

          <label className="campo">
            <span>Rol</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Rol)}>
              {ROLES.map((r) => (
                <option key={r.valor} value={r.valor}>
                  {r.etiqueta}
                </option>
              ))}
            </select>
          </label>

          {error && <div className="alerta error">{error}</div>}

          <div className="modal-acciones">
            <button type="button" className="btn-secundario" onClick={onCancelar}>
              Cancelar
            </button>
            <button type="submit" className="btn-primario" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

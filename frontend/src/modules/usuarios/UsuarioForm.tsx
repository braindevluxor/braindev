import { useState, useEffect } from 'react'
import { useNavigate, useParams, useOutletContext } from 'react-router-dom'
import { usuariosService } from './services'
import Cargando from '../../components/Cargando'

interface OutletContextType {
  recargarUsuarios: boolean
  triggerRecarga: () => void
}

export default function UsuarioForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { triggerRecarga } = useOutletContext<OutletContextType>()
  const esEdicion = !!id

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'usuario'>('usuario')
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      cargarUsuario(id)
    }
  }, [id])

  async function cargarUsuario(userId: string) {
    setCargando(true)
    const res = await usuariosService.obtener(userId)
    if (res.error) {
      setError(res.error.message)
    } else if (res.data) {
      setEmail(res.data.email)
      setFullName(res.data.full_name)
      setRole(res.data.role)
    }
    setCargando(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    setExito(null)

    if (esEdicion && id) {
      const res = await usuariosService.actualizar({
        user_id: id,
        full_name: fullName,
        role,
      })
      if (res.error) {
        setError(res.error.message)
        setGuardando(false)
        return
      }

      if (password) {
        const resPass = await usuariosService.cambiarPassword(id, password)
        if (resPass.error) {
          setError(resPass.error.message)
          setGuardando(false)
          return
        }
      }
    } else {
      if (!password) {
        setError('La contraseña es obligatoria para crear un usuario')
        setGuardando(false)
        return
      }
      const res = await usuariosService.crear({
        email,
        password,
        full_name: fullName,
        role,
      })
      if (res.error) {
        setError(res.error.message)
        setGuardando(false)
        return
      }
    }

    triggerRecarga()
    setExito(esEdicion ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente')
    setPassword('')
    setGuardando(false)
  }

  if (cargando) {
    return (
      <div className="pestana-contenido">
        <div className="form-tarjeta">
          <Cargando mensaje="Cargando usuario…" />
        </div>
      </div>
    )
  }

  return (
    <div className="pestana-contenido">
      <div className="form-tarjeta">
        <div className="form-tarjeta-titulo">
          <div>
            <h3>{esEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
            <p>{esEdicion ? 'Modifica los datos del usuario' : 'Completa los datos para crear un nuevo usuario'}</p>
          </div>
          <button
            type="button"
            className="btn-secundario"
            onClick={() => navigate('/usuarios')}
          >
            ← Volver
          </button>
        </div>

        {error && <div className="alerta error">{error}</div>}
        {exito && <div className="alerta exito">{exito}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <label className="campo">
            <span>Nombre completo</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              required
            />
          </label>

          <label className="campo">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              required
            />
          </label>

          <label className="campo">
            <span>{esEdicion ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={esEdicion ? 'Dejar vacío para mantener la actual' : 'Mínimo 6 caracteres'}
              minLength={6}
              required={!esEdicion}
            />
          </label>

          <label className="campo">
            <span>Rol</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'usuario')}
            >
              <option value="usuario">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </label>

          <div className="form-acciones">
            <button
              type="button"
              className="btn-secundario"
              onClick={() => navigate('/usuarios')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primario"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

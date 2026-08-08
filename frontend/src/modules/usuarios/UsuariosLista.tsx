import { useCallback, useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { usuariosService } from './services'
import type { Perfil } from '../../types'
import Cargando from '../../components/Cargando'

interface OutletContextType {
  recargarUsuarios: boolean
  triggerRecarga: () => void
}

export default function UsuariosLista() {
  const { triggerRecarga } = useOutletContext<OutletContextType>()
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarUsuarios = useCallback(async () => {
    setCargando(true)
    setError(null)
    const res = await usuariosService.listar()
    if (res.error) {
      setError(res.error.message)
      setUsuarios([])
    } else {
      setUsuarios(res.data ?? [])
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    void cargarUsuarios()
  }, [cargarUsuarios])

  async function toggleEstado(usuario: Perfil) {
    const nuevoEstado = !usuario.is_active
    const res = await usuariosService.actualizar({
      user_id: usuario.id,
      is_active: nuevoEstado,
    })
    if (res.error) {
      setError(res.error.message)
    } else {
      await cargarUsuarios()
      triggerRecarga()
    }
  }

  async function eliminarUsuario(usuario: Perfil) {
    if (!confirm(`¿Eliminar definitivamente a ${usuario.full_name || usuario.email}?`)) return
    const res = await usuariosService.eliminar(usuario.id)
    if (res.error) {
      setError(res.error.message)
    } else {
      await cargarUsuarios()
      triggerRecarga()
    }
  }

  function formatearRol(rol: string): string {
    return rol === 'admin' ? 'Administrador' : 'Usuario'
  }

  return (
    <div className="pestana-contenido">
      <div className="form-tarjeta">
        <div className="form-tarjeta-titulo">
          <div>
            <h3>Lista de Usuarios</h3>
            <p>Gestión de cuentas y estado del sistema</p>
          </div>
          <button
            type="button"
            className="btn-primario"
            onClick={() => navigate('/usuarios/crear')}
          >
            + Nuevo Usuario
          </button>
        </div>

        {error && <div className="alerta error">{error}</div>}

        {cargando ? (
          <Cargando mensaje="Cargando usuarios…" />
        ) : usuarios.length === 0 ? (
          <p className="vacio">No hay usuarios registrados</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <strong>{usuario.full_name || 'Sin nombre'}</strong>
                    </td>
                    <td>{usuario.email}</td>
                    <td>
                      <span className={`badge-rol ${usuario.role === 'admin' ? 'rol-admin' : 'rol-usuario'}`}>
                        {formatearRol(usuario.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`estado ${usuario.is_active ? 'activo' : 'inactivo'}`}>
                        {usuario.is_active ? 'Activo' : 'Congelado'}
                      </span>
                    </td>
                    <td className="acciones">
                      <button
                        type="button"
                        className="btn-secundario btn-sm"
                        onClick={() => navigate(`/usuarios/editar/${usuario.id}`)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-secundario btn-sm"
                        onClick={() => navigate(`/usuarios/permisos/${usuario.id}`)}
                      >
                        Permisos
                      </button>
                      <button
                        type="button"
                        className={`btn-sm ${usuario.is_active ? 'btn-peligro' : 'btn-exito'}`}
                        onClick={() => toggleEstado(usuario)}
                      >
                        {usuario.is_active ? 'Congelar' : 'Descongelar'}
                      </button>
                      <button
                        type="button"
                        className="btn-peligro btn-sm"
                        onClick={() => eliminarUsuario(usuario)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

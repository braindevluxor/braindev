import { useCallback, useEffect, useState } from 'react'
import type { Perfil } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { usuariosService } from './services'
import UsuarioForm from './UsuarioForm'
import Cargando from '../../components/Cargando'

function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatearRol(rol: string): string {
  return rol === 'admin' ? 'Administrador' : 'Usuario'
}

export default function UsuariosPage() {
  const { perfil: perfilActual } = useAuth()
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState<Perfil | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    const res = await usuariosService.listar()
    if (res.error) {
      setError(res.error.message)
      setUsuarios([])
    } else {
      setError(null)
      setUsuarios(res.data ?? [])
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function mostrarAviso(mensaje: string) {
    setAviso(mensaje)
    window.setTimeout(() => setAviso(null), 3500)
    setFormAbierto(false)
    setEditando(null)
    void cargar()
  }

  async function alternarEstado(u: Perfil) {
    const res = await usuariosService.actualizar({
      user_id: u.id,
      is_active: !u.is_active,
    })
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso(
      u.is_active ? 'Usuario desactivado' : 'Usuario activado correctamente',
    )
  }

  async function eliminar(u: Perfil) {
    const confirmacion = window.confirm(
      `¿Eliminar definitivamente a "${u.full_name || u.email}"? Esta acción no se puede deshacer.`,
    )
    if (!confirmacion) return
    const res = await usuariosService.eliminar(u.id)
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso('Usuario eliminado correctamente')
  }

  return (
    <div className="modulo-contenido">
      <div className="modulo-cabecera">
        <div>
          <h2>Usuarios</h2>
          <p>Gestión de cuentas, roles y acceso al sistema.</p>
        </div>
        <button
          type="button"
          className="btn-primario"
          onClick={() => setFormAbierto(true)}
        >
          + Nuevo usuario
        </button>
      </div>

      {aviso && <div className="alerta exito">{aviso}</div>}
      {error && <div className="alerta error">{error}</div>}

      <div className="tabla-contenedor">
        {cargando ? (
          <Cargando mensaje="Cargando usuarios…" />
        ) : usuarios.length === 0 ? (
          <p className="vacio">
            No hay usuarios registrados. Crea el primer usuario con «Nuevo usuario».
          </p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Alta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const esActual = u.id === perfilActual?.id
                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.full_name || '—'}</strong>
                      {esActual && <span className="badge-yo">Tú</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`badge-rol ${u.role === 'admin' ? 'rol-admin' : 'rol-usuario'}`}
                      >
                        {formatearRol(u.role)}
                      </span>
                    </td>
                    <td>
                      <span className={u.is_active ? 'estado activo' : 'estado inactivo'}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{formatearFecha(u.created_at)}</td>
                    <td className="acciones">
                      <button
                        type="button"
                        className="btn-enlace"
                        onClick={() => {
                          setEditando(u)
                          setFormAbierto(true)
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-enlace"
                        onClick={() => void alternarEstado(u)}
                      >
                        {u.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      {!esActual && (
                        <button
                          type="button"
                          className="btn-enlace peligro"
                          onClick={() => void eliminar(u)}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {formAbierto && (
        <UsuarioForm
          modo={editando ? 'editar' : 'crear'}
          perfil={editando}
          onCancelar={() => {
            setFormAbierto(false)
            setEditando(null)
          }}
          onGuardado={mostrarAviso}
        />
      )}
    </div>
  )
}

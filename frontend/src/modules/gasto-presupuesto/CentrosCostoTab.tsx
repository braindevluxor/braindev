import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { gpService } from './services'
import type { CentroCosto, RazonSocial } from '../../types'
import Cargando from '../../components/Cargando'

export default function CentrosCostoTab() {
  const [razonesSociales, setRazonesSociales] = useState<RazonSocial[]>([])
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // Modal razón social
  const [modalRazonSocial, setModalRazonSocial] = useState(false)
  const [editandoRazonSocial, setEditandoRazonSocial] = useState<RazonSocial | null>(null)
  const [formRazonSocial, setFormRazonSocial] = useState({
    nombre: '',
    rif: '',
    direccion: '',
    telefono: '',
    email: '',
  })

  // Modal centro de costo
  const [modalCentroCosto, setModalCentroCosto] = useState(false)
  const [editandoCentroCosto, setEditandoCentroCosto] = useState<CentroCosto | null>(null)
  const [razonSocialSeleccionada, setRazonSocialSeleccionada] = useState('')
  const [formCentroCosto, setFormCentroCosto] = useState({
    razon_social_id: '',
    nombre: '',
    descripcion: '',
  })

  const cargar = useCallback(async () => {
    setCargando(true)
    const [resRS, resCC] = await Promise.all([
      gpService.listarRazonesSociales(),
      gpService.listarCentrosCosto(),
    ])
    if (resRS.error) {
      setError(resRS.error.message)
    } else {
      setRazonesSociales(resRS.data ?? [])
    }
    if (resCC.error) {
      setError(resCC.error.message)
    } else {
      setCentrosCosto(resCC.data ?? [])
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function mostrarAviso(msg: string) {
    setAviso(msg)
    window.setTimeout(() => setAviso(null), 3000)
  }

  // Razones Sociales
  function abrirNuevaRazonSocial() {
    setEditandoRazonSocial(null)
    setFormRazonSocial({ nombre: '', rif: '', direccion: '', telefono: '', email: '' })
    setModalRazonSocial(true)
  }

  function editarRazonSocial(rs: RazonSocial) {
    setEditandoRazonSocial(rs)
    setFormRazonSocial({
      nombre: rs.nombre,
      rif: rs.rif ?? '',
      direccion: rs.direccion ?? '',
      telefono: rs.telefono ?? '',
      email: rs.email ?? '',
    })
    setModalRazonSocial(true)
  }

  async function guardarRazonSocial(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!formRazonSocial.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    const datos = {
      nombre: formRazonSocial.nombre.trim(),
      rif: formRazonSocial.rif.trim() || undefined,
      direccion: formRazonSocial.direccion.trim() || undefined,
      telefono: formRazonSocial.telefono.trim() || undefined,
      email: formRazonSocial.email.trim() || undefined,
    }

    const res = editandoRazonSocial
      ? await gpService.actualizarRazonSocial(editandoRazonSocial.id, datos)
      : await gpService.crearRazonSocial(datos)

    if (res.error) {
      setError(res.error.message)
      return
    }

    mostrarAviso(editandoRazonSocial ? 'Razón social actualizada' : 'Razón social creada')
    setModalRazonSocial(false)
    void cargar()
  }

  async function eliminarRazonSocial(rs: RazonSocial) {
    if (!confirm(`¿Eliminar "${rs.nombre}"? Esta acción desactivará la razón social y sus centros de costo.`))
      return
    const res = await gpService.eliminarRazonSocial(rs.id)
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso('Razón social eliminada')
    void cargar()
  }

  // Centros de Costo
  function abrirNuevoCentroCosto() {
    setEditandoCentroCosto(null)
    setFormCentroCosto({ razon_social_id: '', nombre: '', descripcion: '' })
    setRazonSocialSeleccionada('')
    setModalCentroCosto(true)
  }

  function editarCentroCosto(cc: CentroCosto) {
    setEditandoCentroCosto(cc)
    setFormCentroCosto({
      razon_social_id: cc.razon_social_id,
      nombre: cc.nombre,
      descripcion: cc.descripcion ?? '',
    })
    setRazonSocialSeleccionada(cc.razon_social_id)
    setModalCentroCosto(true)
  }

  async function guardarCentroCosto(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!formCentroCosto.razon_social_id) {
      setError('Selecciona una razón social')
      return
    }
    if (!formCentroCosto.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    const datos = {
      razon_social_id: formCentroCosto.razon_social_id,
      nombre: formCentroCosto.nombre.trim(),
      descripcion: formCentroCosto.descripcion.trim() || undefined,
    }

    const res = editandoCentroCosto
      ? await gpService.actualizarCentroCosto(editandoCentroCosto.id, datos)
      : await gpService.crearCentroCosto(datos)

    if (res.error) {
      setError(res.error.message)
      return
    }

    mostrarAviso(editandoCentroCosto ? 'Centro de costo actualizado' : 'Centro de costo creado')
    setModalCentroCosto(false)
    void cargar()
  }

  async function eliminarCentroCosto(cc: CentroCosto) {
    if (!confirm(`¿Eliminar "${cc.nombre}"?`)) return
    const res = await gpService.eliminarCentroCosto(cc.id)
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso('Centro de costo eliminado')
    void cargar()
  }

  // Agrupar centros de costo por razón social
  const centrosPorRazonSocial = razonesSociales.map((rs) => ({
    razonSocial: rs,
    centros: centrosCosto.filter((cc) => cc.razon_social_id === rs.id),
  }))

  if (cargando) {
    return (
      <div className="pestana-contenido">
        <div className="form-tarjeta">
          <Cargando mensaje="Cargando centros de costo…" />
        </div>
      </div>
    )
  }

  return (
    <div className="pestana-contenido">
      <div className="tarjeta-herramienta">
        <div>
          <h3>Centros de Costo</h3>
          <p>Gestiona las razones sociales y sus centros de costo.</p>
        </div>
        <div className="acciones">
          <button type="button" className="btn-secundario" onClick={abrirNuevaRazonSocial}>
            + Razón Social
          </button>
          <button type="button" className="btn-primario" onClick={abrirNuevoCentroCosto}>
            + Centro de Costo
          </button>
        </div>
      </div>

      {aviso && <div className="alerta exito">{aviso}</div>}
      {error && <div className="alerta error">{error}</div>}

      {razonesSociales.length === 0 ? (
        <div className="form-tarjeta">
          <p className="vacio">
            No hay razones sociales registradas. Comienza creando una razón social.
          </p>
        </div>
      ) : (
        centrosPorRazonSocial.map(({ razonSocial, centros }) => (
          <div key={razonSocial.id} className="form-tarjeta">
            <div className="form-tarjeta-titulo">
              <div>
                <h3>{razonSocial.nombre}</h3>
                <p>
                  {razonSocial.rif && <>RIF: {razonSocial.rif} · </>}
                  {centros.length} centro{centros.length !== 1 ? 's' : ''} de costo
                </p>
              </div>
              <div className="acciones">
                <button
                  type="button"
                  className="btn-secundario btn-sm"
                  onClick={() => editarRazonSocial(razonSocial)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn-peligro btn-sm"
                  onClick={() => eliminarRazonSocial(razonSocial)}
                >
                  Eliminar
                </button>
              </div>
            </div>

            {centros.length === 0 ? (
              <p className="vacio">Sin centros de costo</p>
            ) : (
              <div className="tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centros.map((cc) => (
                      <tr key={cc.id}>
                        <td>{cc.nombre}</td>
                        <td>{cc.descripcion || '—'}</td>
                        <td className="acciones">
                          <button
                            type="button"
                            className="btn-secundario btn-sm"
                            onClick={() => editarCentroCosto(cc)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn-peligro btn-sm"
                            onClick={() => eliminarCentroCosto(cc)}
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
        ))
      )}

      {/* Modal Razón Social */}
      {modalRazonSocial && (
        <div className="modal-fondo" onClick={() => setModalRazonSocial(false)}>
          <div className="modal modal-ancho" onClick={(e) => e.stopPropagation()}>
            <h3>{editandoRazonSocial ? 'Editar Razón Social' : 'Nueva Razón Social'}</h3>
            <form onSubmit={guardarRazonSocial} className="login-form">
              <div className="form-grid">
                <label className="campo">
                  <span>Nombre *</span>
                  <input
                    value={formRazonSocial.nombre}
                    onChange={(e) =>
                      setFormRazonSocial({ ...formRazonSocial, nombre: e.target.value })
                    }
                    placeholder="Ej. SUPERMERCADO CASA SAN JUAN, C.A."
                    required
                  />
                </label>
                <label className="campo">
                  <span>RIF</span>
                  <input
                    value={formRazonSocial.rif}
                    onChange={(e) =>
                      setFormRazonSocial({ ...formRazonSocial, rif: e.target.value })
                    }
                    placeholder="Ej. J-12345678-9"
                  />
                </label>
                <label className="campo">
                  <span>Teléfono</span>
                  <input
                    value={formRazonSocial.telefono}
                    onChange={(e) =>
                      setFormRazonSocial({ ...formRazonSocial, telefono: e.target.value })
                    }
                    placeholder="Ej. 0212-1234567"
                  />
                </label>
                <label className="campo">
                  <span>Email</span>
                  <input
                    type="email"
                    value={formRazonSocial.email}
                    onChange={(e) =>
                      setFormRazonSocial({ ...formRazonSocial, email: e.target.value })
                    }
                    placeholder="correo@ejemplo.com"
                  />
                </label>
                <label className="campo campo-fijo">
                  <span>Dirección</span>
                  <input
                    value={formRazonSocial.direccion}
                    onChange={(e) =>
                      setFormRazonSocial({ ...formRazonSocial, direccion: e.target.value })
                    }
                    placeholder="Dirección fiscal"
                  />
                </label>
              </div>
              <div className="modal-acciones">
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={() => setModalRazonSocial(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primario">
                  {editandoRazonSocial ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Centro de Costo */}
      {modalCentroCosto && (
        <div className="modal-fondo" onClick={() => setModalCentroCosto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editandoCentroCosto ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}</h3>
            <form onSubmit={guardarCentroCosto} className="login-form">
              <label className="campo">
                <span>Razón Social *</span>
                <select
                  value={formCentroCosto.razon_social_id}
                  onChange={(e) => {
                    setFormCentroCosto({ ...formCentroCosto, razon_social_id: e.target.value })
                    setRazonSocialSeleccionada(e.target.value)
                  }}
                  required
                >
                  <option value="">Seleccionar…</option>
                  {razonesSociales.map((rs) => (
                    <option key={rs.id} value={rs.id}>
                      {rs.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span>Nombre *</span>
                <input
                  value={formCentroCosto.nombre}
                  onChange={(e) =>
                    setFormCentroCosto({ ...formCentroCosto, nombre: e.target.value })
                  }
                  placeholder="Ej. SAN JUAN, SAN JUAN (OFICINA)"
                  required
                />
              </label>
              <label className="campo">
                <span>Descripción</span>
                <input
                  value={formCentroCosto.descripcion}
                  onChange={(e) =>
                    setFormCentroCosto({ ...formCentroCosto, descripcion: e.target.value })
                  }
                  placeholder="Descripción opcional"
                />
              </label>
              <div className="modal-acciones">
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={() => setModalCentroCosto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primario">
                  {editandoCentroCosto ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

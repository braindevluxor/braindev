import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { IconClipboardText, IconPencilFilled, IconTrashFilled } from '@tabler/icons-react'
import { tallerService } from './services'
import { useContextoTaller } from './contexto'
import { usePermisos } from '../../contexts/PermisosContext'
import type {
  EstadoRequisicion,
  PrioridadRequisicion,
  Requisicion,
  TipoRequisicion,
  Vehiculo,
} from '../../types'
import Cargando from '../../components/Cargando'

const TIPOS: { valor: TipoRequisicion; etiqueta: string }[] = [
  { valor: 'revision', etiqueta: 'Revisión' },
  { valor: 'reparacion', etiqueta: 'Reparación' },
  { valor: 'otro', etiqueta: 'Otro' },
]

const ETIQUETA_TIPO: Record<string, string> = Object.fromEntries(
  TIPOS.map((t) => [t.valor, t.etiqueta]),
)

const PRIORIDADES: { valor: PrioridadRequisicion; etiqueta: string }[] = [
  { valor: 'baja', etiqueta: 'Baja' },
  { valor: 'media', etiqueta: 'Media' },
  { valor: 'alta', etiqueta: 'Alta' },
]

const ETIQUETA_PRIORIDAD: Record<string, string> = Object.fromEntries(
  PRIORIDADES.map((p) => [p.valor, p.etiqueta]),
)

const ESTADOS: { valor: EstadoRequisicion; etiqueta: string; clase: string }[] = [
  { valor: 'pendiente', etiqueta: 'Pendiente', clase: 'pendiente' },
  { valor: 'en_proceso', etiqueta: 'En proceso', clase: 'proceso' },
  { valor: 'completado', etiqueta: 'Completado', clase: 'completado' },
  { valor: 'cancelado', etiqueta: 'Cancelado', clase: 'cancelado' },
]

const ESTADOS_VALORES = ESTADOS.map((e) => e.valor)

interface FormRequisicion {
  vehiculo_id: string
  tipo: string
  prioridad: string
  descripcion: string
  fecha_solicitud: string
  fecha_estimada: string
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function RequisicionesTab() {
  const { vehiculos, directorio } = useContextoTaller()
  const { tienePermiso } = usePermisos()

  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Requisicion | null>(null)
  const [form, setForm] = useState<FormRequisicion>({
    vehiculo_id: '',
    tipo: '',
    prioridad: '',
    descripcion: '',
    fecha_solicitud: hoy(),
    fecha_estimada: '',
  })
  const [guardando, setGuardando] = useState(false)

  const puedeCrear = tienePermiso('tm-requisiciones', 'crear')
  const puedeActualizar = tienePermiso('tm-requisiciones', 'actualizar')
  const puedeEliminar = tienePermiso('tm-requisiciones', 'eliminar')

  const cargar = useCallback(async () => {
    setCargando(true)
    const res = await tallerService.listarRequisiciones()
    if (res.error) {
      setError(res.error.message)
      setRequisiciones([])
    } else {
      setError(null)
      setRequisiciones(res.data ?? [])
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

  function nombreVehiculo(v: Vehiculo | undefined): string {
    if (!v) return '—'
    return `${v.placa} · ${v.marca} ${v.modelo}`
  }

  function abrirNueva() {
    setEditando(null)
    setForm({
      vehiculo_id: '',
      tipo: '',
      prioridad: '',
      descripcion: '',
      fecha_solicitud: hoy(),
      fecha_estimada: '',
    })
    setError(null)
    setModal(true)
  }

  function editar(r: Requisicion) {
    setEditando(r)
    setForm({
      vehiculo_id: r.vehiculo_id,
      tipo: r.tipo,
      prioridad: r.prioridad ?? '',
      descripcion: r.descripcion,
      fecha_solicitud: r.fecha_solicitud,
      fecha_estimada: r.fecha_estimada ?? '',
    })
    setError(null)
    setModal(true)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.vehiculo_id) {
      setError('Selecciona un vehículo')
      return
    }
    if (!form.tipo) {
      setError('Selecciona el tipo de servicio')
      return
    }
    if (!form.descripcion.trim()) {
      setError('La descripción es obligatoria')
      return
    }

    const datos = {
      vehiculo_id: form.vehiculo_id,
      tipo: form.tipo as TipoRequisicion,
      prioridad: (form.prioridad as PrioridadRequisicion) || undefined,
      descripcion: form.descripcion.trim(),
      fecha_solicitud: form.fecha_solicitud || hoy(),
      fecha_estimada: form.fecha_estimada || undefined,
    }

    setGuardando(true)
    const res = editando
      ? await tallerService.actualizarRequisicion(editando.id, datos)
      : await tallerService.crearRequisicion(datos)
    setGuardando(false)

    if (res.error) {
      setError(res.error.message)
      return
    }

    mostrarAviso(editando ? 'Requisición actualizada' : 'Requisición registrada')
    setModal(false)
    void cargar()
  }

  async function cambiarEstado(r: Requisicion, estado: EstadoRequisicion) {
    const res = await tallerService.actualizarRequisicion(r.id, { estado })
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso('Estado actualizado')
    void cargar()
  }

  async function eliminar(r: Requisicion) {
    if (!confirm('¿Eliminar esta requisición?')) return
    const res = await tallerService.eliminarRequisicion(r.id)
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso('Requisición eliminada')
    void cargar()
  }

  const filtradas = requisiciones.filter((r) => {
    if (filtroEstado && r.estado !== filtroEstado) return false
    if (busqueda.trim()) {
      const texto = `${nombreVehiculo(r.vehiculo)} ${r.descripcion}`
        .toLowerCase()
        .replace(/·/g, ' ')
      if (!texto.includes(busqueda.trim().toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="pestana-contenido">
      <div className="tarjeta-herramienta">
        <div>
          <h3>Requisiciones de Taller</h3>
          <p>Solicitudes de revisión, reparación u otros servicios para la flota.</p>
        </div>
        {puedeCrear && (
          <div className="acciones">
            <button type="button" className="btn-primario" onClick={abrirNueva}>
              + Requisición
            </button>
          </div>
        )}
      </div>

      {aviso && <div className="alerta exito">{aviso}</div>}
      {error && <div className="alerta error">{error}</div>}

      <div className="form-grid filtros-grid">
        <div className="campo">
          <span>Buscar</span>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por placa, marca o descripción…"
          />
        </div>
        <div className="campo">
          <span>Estado</span>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map((es) => (
              <option key={es.valor} value={es.valor}>
                {es.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="form-tarjeta">
          <Cargando mensaje="Cargando requisiciones…" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="form-tarjeta">
          <p className="vacio">No hay requisiciones que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="form-tarjeta">
          <div className="tabla-contenedor">
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Vehículo</th>
                    <th>Tipo</th>
                    <th>Prioridad</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Solicitud</th>
                    <th>Estimada</th>
                    <th>Registrado por</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((r) => {
                    const vehiculo = vehiculos.find((v) => v.id === r.vehiculo_id)
                    const esLabel = ESTADOS.find((es) => es.valor === r.estado)
                    return (
                      <tr key={r.id}>
                        <td>
                          <span className="placa-vehiculo">
                            <IconClipboardText size={15} />
                            {nombreVehiculo(vehiculo)}
                          </span>
                        </td>
                        <td>{ETIQUETA_TIPO[r.tipo] ?? r.tipo}</td>
                        <td>
                          {r.prioridad ? (
                            <span className={`estado prioridad-${r.prioridad}`}>
                              {ETIQUETA_PRIORIDAD[r.prioridad]}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="celda-descripcion">{r.descripcion}</td>
                        <td>
                          {puedeActualizar ? (
                            <select
                              className="select-estado"
                              value={r.estado}
                              onChange={(e) =>
                                cambiarEstado(r, e.target.value as EstadoRequisicion)
                              }
                            >
                              {ESTADOS_VALORES.map((valor) => (
                                <option key={valor} value={valor}>
                                  {ESTADOS.find((es) => es.valor === valor)?.etiqueta}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`estado ${esLabel?.clase ?? ''}`}>
                              {esLabel?.etiqueta ?? r.estado}
                            </span>
                          )}
                        </td>
                        <td>{r.fecha_solicitud}</td>
                        <td>{r.fecha_estimada || '—'}</td>
                        <td>{directorio[r.registrado_por] ?? '—'}</td>
                        <td className="acciones">
                          {puedeActualizar && (
                            <button
                              type="button"
                              className="btn-secundario btn-sm"
                              onClick={() => editar(r)}
                              title="Editar"
                              aria-label="Editar"
                            >
                              <IconPencilFilled size={15} />
                            </button>
                          )}
                          {puedeEliminar && (
                            <button
                              type="button"
                              className="btn-peligro btn-sm"
                              onClick={() => eliminar(r)}
                              title="Eliminar"
                              aria-label="Eliminar"
                            >
                              <IconTrashFilled size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-fondo" onClick={() => setModal(false)}>
          <div className="modal modal-ancho" onClick={(e) => e.stopPropagation()}>
            <h3>{editando ? 'Editar Requisición' : 'Nueva Requisición'}</h3>
            <form onSubmit={guardar} className="login-form">
              <div className="form-grid">
                <label className="campo">
                  <span>Vehículo *</span>
                  <select
                    value={form.vehiculo_id}
                    onChange={(e) => setForm({ ...form, vehiculo_id: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar…</option>
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {nombreVehiculo(v)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo">
                  <span>Tipo de servicio *</span>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar…</option>
                    {TIPOS.map((t) => (
                      <option key={t.valor} value={t.valor}>
                        {t.etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo">
                  <span>Prioridad</span>
                  <select
                    value={form.prioridad}
                    onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                  >
                    <option value="">Seleccionar…</option>
                    {PRIORIDADES.map((p) => (
                      <option key={p.valor} value={p.valor}>
                        {p.etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo">
                  <span>Fecha de solicitud</span>
                  <input
                    type="date"
                    value={form.fecha_solicitud}
                    onChange={(e) => setForm({ ...form, fecha_solicitud: e.target.value })}
                  />
                </label>
                <label className="campo">
                  <span>Fecha estimada de entrega</span>
                  <input
                    type="date"
                    value={form.fecha_estimada}
                    onChange={(e) => setForm({ ...form, fecha_estimada: e.target.value })}
                  />
                </label>
                <label className="campo campo-fijo">
                  <span>Descripción *</span>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Describe el servicio solicitado…"
                    rows={3}
                    required
                  />
                </label>
              </div>
              <div className="modal-acciones">
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={() => setModal(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primario" disabled={guardando}>
                  {guardando ? 'Guardando…' : editando ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

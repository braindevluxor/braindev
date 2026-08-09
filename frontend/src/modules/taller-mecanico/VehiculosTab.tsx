import { useState, type FormEvent } from 'react'
import { IconPencilFilled, IconTrashFilled } from '@tabler/icons-react'
import { tallerService } from './services'
import { useContextoTaller } from './contexto'
import { usePermisos } from '../../contexts/PermisosContext'
import type { TipoVehiculo, Vehiculo } from '../../types'
import { IconoTruck } from '../../components/pestanaIconos'

const TIPOS_VEHICULO: { valor: TipoVehiculo; etiqueta: string }[] = [
  { valor: 'camioneta', etiqueta: 'Camioneta' },
  { valor: 'sedan', etiqueta: 'Sedán' },
  { valor: 'camion', etiqueta: 'Camión' },
  { valor: 'furgoneta', etiqueta: 'Furgoneta' },
  { valor: 'motocicleta', etiqueta: 'Motocicleta' },
  { valor: 'otro', etiqueta: 'Otro' },
]

const ETIQUETA_TIPO: Record<string, string> = Object.fromEntries(
  TIPOS_VEHICULO.map((t) => [t.valor, t.etiqueta]),
)

interface FormVehiculo {
  placa: string
  marca: string
  modelo: string
  anio: string
  tipo: string
  color: string
  capacidad: string
  serial_motor: string
  serial_carroceria: string
  observaciones: string
}

const FORM_VACIO: FormVehiculo = {
  placa: '',
  marca: '',
  modelo: '',
  anio: '',
  tipo: '',
  color: '',
  capacidad: '',
  serial_motor: '',
  serial_carroceria: '',
  observaciones: '',
}

export default function VehiculosTab() {
  const { vehiculos, recargarVehiculos, directorio } = useContextoTaller()
  const { tienePermiso } = usePermisos()

  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Vehiculo | null>(null)
  const [form, setForm] = useState<FormVehiculo>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const puedeCrear = tienePermiso('tm-vehiculos', 'crear')
  const puedeActualizar = tienePermiso('tm-vehiculos', 'actualizar')
  const puedeEliminar = tienePermiso('tm-vehiculos', 'eliminar')

  function mostrarAviso(msg: string) {
    setAviso(msg)
    window.setTimeout(() => setAviso(null), 3000)
  }

  function abrirNuevo() {
    setEditando(null)
    setForm(FORM_VACIO)
    setError(null)
    setModal(true)
  }

  function editar(v: Vehiculo) {
    setEditando(v)
    setForm({
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      anio: v.anio != null ? String(v.anio) : '',
      tipo: v.tipo ?? '',
      color: v.color ?? '',
      capacidad: v.capacidad ?? '',
      serial_motor: v.serial_motor ?? '',
      serial_carroceria: v.serial_carroceria ?? '',
      observaciones: v.observaciones ?? '',
    })
    setError(null)
    setModal(true)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.placa.trim() || !form.marca.trim() || !form.modelo.trim()) {
      setError('Placa, marca y modelo son obligatorios')
      return
    }

    const datos = {
      placa: form.placa.trim().toUpperCase(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      anio: form.anio ? Number(form.anio) : undefined,
      tipo: (form.tipo as TipoVehiculo) || undefined,
      color: form.color.trim() || undefined,
      capacidad: form.capacidad.trim() || undefined,
      serial_motor: form.serial_motor.trim() || undefined,
      serial_carroceria: form.serial_carroceria.trim() || undefined,
      observaciones: form.observaciones.trim() || undefined,
    }

    setGuardando(true)
    const res = editando
      ? await tallerService.actualizarVehiculo(editando.id, datos)
      : await tallerService.crearVehiculo(datos)
    setGuardando(false)

    if (res.error) {
      setError(res.error.message)
      return
    }

    mostrarAviso(editando ? 'Vehículo actualizado' : 'Vehículo registrado')
    setModal(false)
    void recargarVehiculos()
  }

  async function alternarActivo(v: Vehiculo) {
    const res = await tallerService.actualizarVehiculo(v.id, { activo: !v.activo })
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso(v.activo ? 'Vehículo dado de baja' : 'Vehículo activado')
    void recargarVehiculos()
  }

  async function eliminar(v: Vehiculo) {
    if (!confirm(`¿Dar de baja el vehículo "${v.placa}"? Su historial se conserva.`)) return
    const res = await tallerService.eliminarVehiculo(v.id)
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso('Vehículo dado de baja')
    void recargarVehiculos()
  }

  return (
    <div className="pestana-contenido">
      <div className="tarjeta-herramienta">
        <div>
          <h3>Flota de Vehículos</h3>
          <p>Registra y administra los vehículos de la empresa y su estado.</p>
        </div>
        {puedeCrear && (
          <div className="acciones">
            <button type="button" className="btn-primario" onClick={abrirNuevo}>
              + Vehículo
            </button>
          </div>
        )}
      </div>

      {aviso && <div className="alerta exito">{aviso}</div>}
      {error && <div className="alerta error">{error}</div>}

      {vehiculos.length === 0 ? (
        <div className="form-tarjeta">
          <p className="vacio">
            No hay vehículos registrados. Comienza registrando la flota.
          </p>
        </div>
      ) : (
        <div className="form-tarjeta">
          <div className="tabla-contenedor">
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Vehículo</th>
                    <th>Año</th>
                    <th>Tipo</th>
                    <th>Características</th>
                    <th>Estado</th>
                    <th>Registrado por</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculos.map((v) => (
                    <tr key={v.id} className={!v.activo ? 'fila-inactiva' : ''}>
                      <td>
                        <span className="placa-vehiculo">
                          <IconoTruck size={15} />
                          {v.placa}
                        </span>
                      </td>
                      <td>
                        {v.marca} {v.modelo}
                      </td>
                      <td>{v.anio ?? '—'}</td>
                      <td>{v.tipo ? ETIQUETA_TIPO[v.tipo] ?? v.tipo : '—'}</td>
                      <td>
                        {[v.color, v.capacidad]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </td>
                      <td>
                        <span className={`estado ${v.activo ? 'activo' : 'inactivo'}`}>
                          {v.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{directorio[v.registrado_por] ?? '—'}</td>
                      <td className="acciones">
                        {puedeActualizar && (
                          <>
                            <button
                              type="button"
                              className="btn-secundario btn-sm"
                              onClick={() => alternarActivo(v)}
                              title={v.activo ? 'Dar de baja' : 'Activar'}
                              aria-label={v.activo ? 'Dar de baja' : 'Activar'}
                            >
                              {v.activo ? 'Baja' : 'Activar'}
                            </button>
                            <button
                              type="button"
                              className="btn-secundario btn-sm"
                              onClick={() => editar(v)}
                              title="Editar"
                              aria-label={`Editar ${v.placa}`}
                            >
                              <IconPencilFilled size={15} />
                            </button>
                          </>
                        )}
                        {puedeEliminar && (
                          <button
                            type="button"
                            className="btn-peligro btn-sm"
                            onClick={() => eliminar(v)}
                            title="Eliminar"
                            aria-label={`Eliminar ${v.placa}`}
                          >
                            <IconTrashFilled size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-fondo" onClick={() => setModal(false)}>
          <div className="modal modal-ancho" onClick={(e) => e.stopPropagation()}>
            <h3>{editando ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
            <form onSubmit={guardar} className="login-form">
              <div className="form-grid">
                <label className="campo">
                  <span>Placa *</span>
                  <input
                    value={form.placa}
                    onChange={(e) => setForm({ ...form, placa: e.target.value })}
                    placeholder="Ej. AB123CD"
                    maxLength={12}
                    required
                  />
                </label>
                <label className="campo">
                  <span>Marca *</span>
                  <input
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    placeholder="Ej. Toyota"
                    required
                  />
                </label>
                <label className="campo">
                  <span>Modelo *</span>
                  <input
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                    placeholder="Ej. Hilux"
                    required
                  />
                </label>
                <label className="campo">
                  <span>Año</span>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    value={form.anio}
                    onChange={(e) => setForm({ ...form, anio: e.target.value })}
                    placeholder="Ej. 2021"
                  />
                </label>
                <label className="campo">
                  <span>Tipo</span>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="">Seleccionar…</option>
                    {TIPOS_VEHICULO.map((t) => (
                      <option key={t.valor} value={t.valor}>
                        {t.etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo">
                  <span>Color</span>
                  <input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="Ej. Blanco"
                  />
                </label>
                <label className="campo">
                  <span>Capacidad</span>
                  <input
                    value={form.capacidad}
                    onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
                    placeholder="Ej. 1.5 ton · 5 pasajeros"
                  />
                </label>
                <label className="campo">
                  <span>Serial Motor</span>
                  <input
                    value={form.serial_motor}
                    onChange={(e) => setForm({ ...form, serial_motor: e.target.value })}
                    placeholder="Serial del motor"
                  />
                </label>
                <label className="campo">
                  <span>Serial Carrocería</span>
                  <input
                    value={form.serial_carroceria}
                    onChange={(e) => setForm({ ...form, serial_carroceria: e.target.value })}
                    placeholder="Serial de carrocería / VIN"
                  />
                </label>
                <label className="campo campo-fijo">
                  <span>Observaciones</span>
                  <textarea
                    value={form.observaciones}
                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    placeholder="Observaciones adicionales"
                    rows={3}
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

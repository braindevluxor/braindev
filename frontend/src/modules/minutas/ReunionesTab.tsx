import { useEffect, useState, type FormEvent } from 'react'
import {
  IconCalendarFilled,
  IconClipboardCheckFilled,
  IconPencilFilled,
  IconTrashFilled,
} from '@tabler/icons-react'
import { minutasService } from './services'
import { useContextoMinutas } from './contexto'
import { usePermisos } from '../../contexts/PermisosContext'
import type { Compromiso, Reunion } from '../../types'

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatoFecha(iso: string): string {
  if (!iso) return '—'
  const [a, m, d] = iso.split('-')
  if (!a || !m || !d) return iso
  return `${d}/${m}/${a}`
}

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface FormReunion {
  titulo: string
  fecha: string
  lugar: string
  participantes: string[]
  nuevoParticipante: string
  observaciones: string
}

interface FormCompromiso {
  descripcion: string
  responsable: string
  fecha_tope: string
}

export default function ReunionesTab() {
  const { reuniones, recargarReuniones, directorio } = useContextoMinutas()
  const { tienePermiso } = usePermisos()

  const puedeCrear = tienePermiso('mn-reuniones', 'crear')
  const puedeActualizar = tienePermiso('mn-reuniones', 'actualizar')
  const puedeEliminar = tienePermiso('mn-reuniones', 'eliminar')

  const [vista, setVista] = useState<'lista' | 'formulario' | 'detalle'>('lista')
  const [vistaPrevia, setVistaPrevia] = useState<'lista' | 'detalle'>('lista')
  const [reunionId, setReunionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)

  const [editandoReunion, setEditandoReunion] = useState<Reunion | null>(null)
  const [formReunion, setFormReunion] = useState<FormReunion>({
    titulo: '',
    fecha: hoyISO(),
    lugar: '',
    participantes: [],
    nuevoParticipante: '',
    observaciones: '',
  })

  const [modalCompromiso, setModalCompromiso] = useState(false)
  const [editandoCompromiso, setEditandoCompromiso] = useState<Compromiso | null>(null)
  const [formCompromiso, setFormCompromiso] = useState<FormCompromiso>({
    descripcion: '',
    responsable: '',
    fecha_tope: '',
  })
  const [guardando, setGuardando] = useState(false)

  const reunion = vista === 'detalle' ? reuniones.find((r) => r.id === reunionId) : null

  useEffect(() => {
    if (vista === 'detalle' && reunionId && !reunion) {
      setVista('lista')
      setReunionId(null)
    }
  }, [vista, reunionId, reunion])

  function mostrarAviso(msg: string) {
    setAviso(msg)
    window.setTimeout(() => setAviso(null), 3000)
  }

  function abrirDetalle(r: Reunion) {
    setReunionId(r.id)
    setVista('detalle')
  }

  // ---------- Reuniones ----------
  function abrirNuevaReunion() {
    setEditandoReunion(null)
    setFormReunion({
      titulo: '',
      fecha: hoyISO(),
      lugar: '',
      participantes: [],
      nuevoParticipante: '',
      observaciones: '',
    })
    setError(null)
    setVistaPrevia('lista')
    setVista('formulario')
  }

  function editarReunion(r: Reunion) {
    setEditandoReunion(r)
    setFormReunion({
      titulo: r.titulo,
      fecha: r.fecha,
      lugar: r.lugar ?? '',
      participantes: [...r.participantes],
      nuevoParticipante: '',
      observaciones: r.observaciones ?? '',
    })
    setError(null)
    setVistaPrevia(vista === 'detalle' ? 'detalle' : 'lista')
    setVista('formulario')
  }

  function cancelarFormulario() {
    setVista(vistaPrevia)
  }

  function agregarParticipante() {
    const nombre = formReunion.nuevoParticipante.trim()
    if (!nombre) return
    if (formReunion.participantes.some((p) => p.toLowerCase() === nombre.toLowerCase())) return
    setFormReunion((prev) => ({
      ...prev,
      participantes: [...prev.participantes, nombre],
      nuevoParticipante: '',
    }))
  }

  function quitarParticipante(idx: number) {
    setFormReunion((prev) => ({
      ...prev,
      participantes: prev.participantes.filter((_, i) => i !== idx),
    }))
  }

  async function guardarReunion(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!formReunion.titulo.trim()) {
      setError('El título de la reunión es obligatorio')
      return
    }

    const datos = {
      titulo: formReunion.titulo.trim(),
      fecha: formReunion.fecha || hoyISO(),
      lugar: formReunion.lugar.trim() || undefined,
      participantes: formReunion.participantes,
      observaciones: formReunion.observaciones.trim() || undefined,
    }

    setGuardando(true)
    const res = editandoReunion
      ? await minutasService.actualizarReunion(editandoReunion.id, datos)
      : await minutasService.crearReunion(datos)
    setGuardando(false)

    if (res.error) {
      setError(res.error.message)
      return
    }

    mostrarAviso(editandoReunion ? 'Reunión actualizada' : 'Reunión registrada')
    await recargarReuniones()
    setVista(vistaPrevia)
  }

  async function eliminarReunion(r: Reunion) {
    if (!confirm(`¿Eliminar la reunión "${r.titulo}" y sus compromisos?`)) return
    const res = await minutasService.eliminarReunion(r.id)
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso('Reunión eliminada')
    if (vista === 'detalle' && r.id === reunionId) {
      setVista('lista')
      setReunionId(null)
    }
    await recargarReuniones()
  }

  // ---------- Compromisos ----------
  function abrirNuevoCompromiso() {
    setEditandoCompromiso(null)
    setFormCompromiso({ descripcion: '', responsable: '', fecha_tope: '' })
    setError(null)
    setModalCompromiso(true)
  }

  function editarCompromiso(c: Compromiso) {
    setEditandoCompromiso(c)
    setFormCompromiso({
      descripcion: c.descripcion,
      responsable: c.responsable,
      fecha_tope: c.fecha_tope,
    })
    setError(null)
    setModalCompromiso(true)
  }

  async function guardarCompromiso(e: FormEvent) {
    e.preventDefault()
    if (!reunion) return
    setError(null)

    if (!formCompromiso.descripcion.trim()) {
      setError('La descripción del compromiso es obligatoria')
      return
    }
    if (!formCompromiso.responsable.trim()) {
      setError('El responsable del compromiso es obligatorio')
      return
    }
    if (!formCompromiso.fecha_tope) {
      setError('La fecha tope de entrega es obligatoria')
      return
    }

    const datos = {
      reunion_id: reunion.id,
      descripcion: formCompromiso.descripcion.trim(),
      responsable: formCompromiso.responsable.trim(),
      fecha_tope: formCompromiso.fecha_tope,
    }

    setGuardando(true)
    const res = editandoCompromiso
      ? await minutasService.actualizarCompromiso(editandoCompromiso.id, datos)
      : await minutasService.crearCompromiso(datos)
    setGuardando(false)

    if (res.error) {
      setError(res.error.message)
      return
    }

    mostrarAviso(editandoCompromiso ? 'Compromiso actualizado' : 'Compromiso agregado')
    setModalCompromiso(false)
    await recargarReuniones()
  }

  async function alternarCompromiso(c: Compromiso) {
    const res = await minutasService.actualizarCompromiso(c.id, { completado: !c.completado })
    if (res.error) {
      setError(res.error.message)
      return
    }
    await recargarReuniones()
  }

  async function eliminarCompromiso(c: Compromiso) {
    if (!confirm('¿Eliminar este compromiso?')) return
    const res = await minutasService.eliminarCompromiso(c.id)
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso('Compromiso eliminado')
    await recargarReuniones()
  }

  // ---------- PDF ----------
  function exportarMinutaPDF(r: Reunion) {
    if (exportando) return
    setExportando(true)
    setError(null)

    const compromisos = r.compromisos ?? []
    const hoy = hoyISO()
    const filasCompromisos =
      compromisos.length === 0
        ? '<tr><td colspan="4" class="sin-datos">Sin compromisos registrados.</td></tr>'
        : compromisos
            .map((c) => {
              const vencido = !c.completado && c.fecha_tope && c.fecha_tope < hoy
              return `<tr class="${c.completado ? 'ok' : ''}">
                <td>${escapeHtml(c.descripcion)}</td>
                <td>${escapeHtml(c.responsable || '—')}</td>
                <td>${escapeHtml(formatoFecha(c.fecha_tope ?? ''))}${vencido ? ' <span class="vencido">Vencido</span>' : ''}</td>
                <td>${c.completado ? 'Completado' : 'Pendiente'}</td>
              </tr>`
            })
            .join('')

    const participantes = r.participantes.length
      ? r.participantes.map((p) => escapeHtml(p)).join('<br/>')
      : '—'

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Minuta - ${escapeHtml(r.titulo)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #1e293b; font-size: 12px; line-height: 1.45; margin: 0; }
  .encabezado { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0e7490; padding-bottom: 10px; margin-bottom: 14px; }
  h1 { font-size: 22px; margin: 0; color: #0e7490; }
  .meta { color: #64748b; font-size: 11px; margin-top: 4px; }
  h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; color: #334155; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; background: #f1f5f9; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; border-bottom: 2px solid #e2e8f0; }
  td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tr.ok td { color: #64748b; }
  .vencido { color: #dc2626; font-weight: 700; font-size: 9px; margin-left: 4px; }
  .participantes { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .observaciones { white-space: pre-wrap; }
  .pie { margin-top: 22px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  .sin-datos { color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <div class="encabezado">
    <div>
      <h1>Minuta de reunión</h1>
      <div class="meta">${escapeHtml(r.titulo)}</div>
    </div>
    <div class="meta">Generada el ${escapeHtml(formatoFecha(hoyISO()))}</div>
  </div>

  <h2>Datos de la reunión</h2>
  <table>
    <tr><th style="width:140px">Fecha</th><td>${escapeHtml(formatoFecha(r.fecha))}</td></tr>
    <tr><th>Lugar</th><td>${escapeHtml(r.lugar || '—')}</td></tr>
    <tr><th>Registrada por</th><td>${escapeHtml(directorio[r.registrado_por] ?? '—')}</td></tr>
  </table>

  <h2>Participantes</h2>
  <div class="participantes">${participantes}</div>

  <h2>Observaciones</h2>
  <p class="observaciones">${r.observaciones ? escapeHtml(r.observaciones) : 'Sin observaciones.'}</p>

  <h2>Compromisos</h2>
  <table>
    <thead>
      <tr>
        <th>Compromiso</th>
        <th style="width:140px">Responsable</th>
        <th style="width:130px">Fecha tope</th>
        <th style="width:100px">Estado</th>
      </tr>
    </thead>
    <tbody>${filasCompromisos}</tbody>
  </table>

  <div class="pie">Generado desde BrainDev &middot; Módulo de Minutas</div>
</body>
</html>`

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
    document.body.appendChild(iframe)
    try {
      const doc = iframe.contentDocument
      if (!doc) throw new Error('No se pudo crear el documento de impresión')
      doc.open()
      doc.write(html)
      doc.close()
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (err) {
      console.error('Error al exportar el PDF:', err)
      setError('No se pudo generar el PDF. Revisa la consola para más detalles.')
    } finally {
      window.setTimeout(() => {
        iframe.remove()
        setExportando(false)
      }, 1500)
    }
  }

  // ---------- Vista de formulario (registro/edición de reunión) ----------
  if (vista === 'formulario') {
    return (
      <div className="pestana-contenido">
        <div className="form-tarjeta registro-reunion">
          <div className="form-tarjeta-titulo">
            <div>
              <h3>{editandoReunion ? 'Editar Reunión' : 'Nueva Reunión'}</h3>
              <p>
                {editandoReunion
                  ? 'Modifica los datos de la reunión'
                  : 'Completa los datos de la reunión y sus participantes'}
              </p>
            </div>
            <button type="button" className="btn-secundario" onClick={cancelarFormulario}>
              ← Volver
            </button>
          </div>

          {aviso && <div className="alerta exito">{aviso}</div>}
          {error && <div className="alerta error">{error}</div>}

          <form onSubmit={guardarReunion} className="form-grid">
            <label className="campo campo-fijo">
              <span>Título *</span>
              <input
                value={formReunion.titulo}
                onChange={(e) => setFormReunion({ ...formReunion, titulo: e.target.value })}
                placeholder="Ej. Reunión de planificación semanal"
                required
              />
            </label>

            <label className="campo">
              <span>Fecha</span>
              <input
                type="date"
                value={formReunion.fecha}
                onChange={(e) => setFormReunion({ ...formReunion, fecha: e.target.value })}
              />
            </label>

            <label className="campo">
              <span>Lugar</span>
              <input
                value={formReunion.lugar}
                onChange={(e) => setFormReunion({ ...formReunion, lugar: e.target.value })}
                placeholder="Ej. Sala de reuniones"
              />
            </label>

            <div className="campo campo-fijo">
              <span>Participantes</span>
              <div className="participantes-input">
                <input
                  value={formReunion.nuevoParticipante}
                  onChange={(e) =>
                    setFormReunion({ ...formReunion, nuevoParticipante: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      agregarParticipante()
                    }
                  }}
                  placeholder="Nombre del participante…"
                />
                <button type="button" className="btn-secundario" onClick={agregarParticipante}>
                  Agregar
                </button>
              </div>
              {formReunion.participantes.length > 0 && (
                <div className="participantes-chips">
                  {formReunion.participantes.map((p, idx) => (
                    <span key={`${p}-${idx}`} className="participante-chip">
                      {p}
                      <button
                        type="button"
                        className="participante-chip-x"
                        onClick={() => quitarParticipante(idx)}
                        aria-label={`Quitar a ${p}`}
                        title="Quitar"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <label className="campo campo-fijo">
              <span>Observaciones</span>
              <textarea
                value={formReunion.observaciones}
                onChange={(e) => setFormReunion({ ...formReunion, observaciones: e.target.value })}
                placeholder="Acuerdos, temas tratados, notas…"
                rows={6}
              />
            </label>

            <div className="form-acciones">
              <button type="button" className="btn-secundario" onClick={cancelarFormulario} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="btn-primario" disabled={guardando}>
                {guardando ? 'Guardando…' : editandoReunion ? 'Guardar Cambios' : 'Registrar Reunión'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ---------- Vista de lista ----------
  if (vista === 'lista') {
    return (
      <div className="pestana-contenido">
        <div className="tarjeta-herramienta">
          <div>
            <h3>Reuniones</h3>
            <p>Registra reuniones y haz seguimiento de sus compromisos.</p>
          </div>
          {puedeCrear && (
            <div className="acciones">
              <button type="button" className="btn-primario" onClick={abrirNuevaReunion}>
                + Nueva Reunión
              </button>
            </div>
          )}
        </div>

        {aviso && <div className="alerta exito">{aviso}</div>}
        {error && <div className="alerta error">{error}</div>}

        {reuniones.length === 0 ? (
          <div className="form-tarjeta">
            <p className="vacio">No hay reuniones registradas. Comienza creando una reunión.</p>
          </div>
        ) : (
          <div className="minutas-grid">
            {reuniones.map((r) => {
              const pendientes = (r.compromisos ?? []).filter((c) => !c.completado).length
              const fecha = r.fecha ? r.fecha.split('-') : []
              return (
                <div key={r.id} className="form-tarjeta minuta-tarjeta">
                  <button type="button" className="minuta-tarjeta-cuerpo" onClick={() => abrirDetalle(r)}>
                    <div className="minuta-tarjeta-fecha">
                      {fecha.length === 3 ? (
                        <>
                          <strong>{Number(fecha[2])}</strong>
                          <span>{MESES[Number(fecha[1]) - 1]}</span>
                          <small>{fecha[0]}</small>
                        </>
                      ) : (
                        <strong>{formatoFecha(r.fecha)}</strong>
                      )}
                    </div>
                    <div className="minuta-tarjeta-info">
                      <h4>{r.titulo}</h4>
                      <p className="minuta-tarjeta-meta">
                        {r.lugar && <><IconCalendarFilled size={13} /> {r.lugar}</>}
                        {r.lugar && ' · '}
                        {r.participantes.length} participante{r.participantes.length !== 1 ? 's' : ''}
                      </p>
                      <p className="minuta-tarjeta-compromisos">
                        {(r.compromisos ?? []).length} compromiso{(r.compromisos ?? []).length !== 1 ? 's' : ''}
                        {pendientes > 0 && <span className="badge-pendientes"> {pendientes} pendiente{pendientes !== 1 ? 's' : ''}</span>}
                      </p>
                    </div>
                  </button>
                  <div className="minuta-tarjeta-acciones">
                    {puedeActualizar && (
                      <button
                        type="button"
                        className="btn-secundario btn-sm"
                        onClick={() => editarReunion(r)}
                        title="Editar"
                        aria-label={`Editar ${r.titulo}`}
                      >
                        <IconPencilFilled size={15} />
                      </button>
                    )}
                    {puedeEliminar && (
                      <button
                        type="button"
                        className="btn-peligro btn-sm"
                        onClick={() => eliminarReunion(r)}
                        title="Eliminar"
                        aria-label={`Eliminar ${r.titulo}`}
                      >
                        <IconTrashFilled size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ---------- Vista de detalle (seguimiento) ----------
  if (!reunion) {
    return (
      <div className="pestana-contenido">
        <div className="form-tarjeta">
          <p className="vacio">Reunión no encontrada.</p>
        </div>
      </div>
    )
  }

  const compromisos = reunion.compromisos ?? []
  const pendientes = compromisos.filter((c) => !c.completado).length
  const hoy = hoyISO()

  return (
    <div className="pestana-contenido">
      <div className="tarjeta-herramienta">
        <div>
          <button type="button" className="btn-secundario" onClick={() => setVista('lista')}>
            ← Volver a reuniones
          </button>
        </div>
        <div className="acciones">
          {puedeActualizar && (
            <button
              type="button"
              className="btn-secundario"
              onClick={() => editarReunion(reunion)}
            >
              Editar
            </button>
          )}
          <button
            type="button"
            className="btn-primario"
            onClick={() => exportarMinutaPDF(reunion)}
            disabled={exportando}
          >
            <IconClipboardCheckFilled size={16} />
            {exportando ? 'Generando…' : 'Exportar Minuta (PDF)'}
          </button>
        </div>
      </div>

      {aviso && <div className="alerta exito">{aviso}</div>}
      {error && <div className="alerta error">{error}</div>}

      <div className="form-tarjeta minuta-detalle">
        <div className="form-tarjeta-titulo">
          <div>
            <h3>{reunion.titulo}</h3>
            <p className="minuta-detalle-meta">
              <IconCalendarFilled size={14} /> {formatoFecha(reunion.fecha)}
              {reunion.lugar && <> · {reunion.lugar}</>}
              {' · '}
              {reunion.participantes.length} participante{reunion.participantes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="acciones">
            {puedeEliminar && (
              <button
                type="button"
                className="btn-peligro btn-sm"
                onClick={() => eliminarReunion(reunion)}
                title="Eliminar reunión"
                aria-label="Eliminar reunión"
              >
                <IconTrashFilled size={15} />
              </button>
            )}
          </div>
        </div>

        {reunion.participantes.length > 0 && (
          <div className="participantes-chips minuta-detalle-chips">
            {reunion.participantes.map((p, idx) => (
              <span key={`${p}-${idx}`} className="participante-chip">
                {p}
              </span>
            ))}
          </div>
        )}

        <div className="minuta-detalle-observaciones">
          <h4>Observaciones</h4>
          <p>{reunion.observaciones || 'Sin observaciones.'}</p>
        </div>
      </div>

      <div className="form-tarjeta">
        <div className="form-tarjeta-titulo">
          <div>
            <h3>Compromisos</h3>
            <p>
              {compromisos.length} en total · {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
            </p>
          </div>
          {puedeCrear && (
            <div className="acciones">
              <button type="button" className="btn-primario" onClick={abrirNuevoCompromiso}>
                + Compromiso
              </button>
            </div>
          )}
        </div>

        {compromisos.length === 0 ? (
          <p className="vacio">Sin compromisos registrados en esta reunión.</p>
        ) : (
          <div className="tabla-contenedor">
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Compromiso</th>
                    <th>Responsable</th>
                    <th>Fecha tope</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {compromisos.map((c) => {
                    const vencido = !c.completado && c.fecha_tope && c.fecha_tope < hoy
                    return (
                      <tr key={c.id} className={c.completado ? 'fila-inactiva' : ''}>
                        <td>{c.descripcion}</td>
                        <td>{c.responsable || '—'}</td>
                        <td>
                          {formatoFecha(c.fecha_tope ?? '')}
                          {vencido && <span className="estado inactivo vencido-label">Vencido</span>}
                        </td>
                        <td>
                          {puedeActualizar ? (
                            <label className="compromiso-check">
                              <input
                                type="checkbox"
                                checked={c.completado}
                                onChange={() => alternarCompromiso(c)}
                              />
                              <span className={`estado ${c.completado ? 'completado' : 'pendiente'}`}>
                                {c.completado ? 'Completado' : 'Pendiente'}
                              </span>
                            </label>
                          ) : (
                            <span className={`estado ${c.completado ? 'completado' : 'pendiente'}`}>
                              {c.completado ? 'Completado' : 'Pendiente'}
                            </span>
                          )}
                        </td>
                        <td className="acciones">
                          {puedeActualizar && (
                            <button
                              type="button"
                              className="btn-secundario btn-sm"
                              onClick={() => editarCompromiso(c)}
                              title="Editar"
                              aria-label="Editar compromiso"
                            >
                              <IconPencilFilled size={15} />
                            </button>
                          )}
                          {puedeEliminar && (
                            <button
                              type="button"
                              className="btn-peligro btn-sm"
                              onClick={() => eliminarCompromiso(c)}
                              title="Eliminar"
                              aria-label="Eliminar compromiso"
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
        )}
      </div>

      {modalCompromiso && (
        <div className="modal-fondo" onClick={() => setModalCompromiso(false)}>
          <div className="modal modal-ancho" onClick={(e) => e.stopPropagation()}>
            <h3>{editandoCompromiso ? 'Editar Compromiso' : 'Nuevo Compromiso'}</h3>
            <form onSubmit={guardarCompromiso} className="login-form">
              <div className="form-grid">
                <label className="campo campo-fijo">
                  <span>Compromiso *</span>
                  <textarea
                    value={formCompromiso.descripcion}
                    onChange={(e) =>
                      setFormCompromiso({ ...formCompromiso, descripcion: e.target.value })
                    }
                    placeholder="Describe el compromiso acordado…"
                    rows={3}
                    required
                  />
                </label>
                <label className="campo">
                  <span>Responsable *</span>
                  <input
                    value={formCompromiso.responsable}
                    onChange={(e) =>
                      setFormCompromiso({ ...formCompromiso, responsable: e.target.value })
                    }
                    placeholder="Nombre del responsable"
                    required
                  />
                </label>
                <label className="campo">
                  <span>Fecha tope de entrega *</span>
                  <input
                    type="date"
                    value={formCompromiso.fecha_tope}
                    onChange={(e) =>
                      setFormCompromiso({ ...formCompromiso, fecha_tope: e.target.value })
                    }
                    required
                  />
                </label>
              </div>
              <div className="modal-acciones">
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={() => setModalCompromiso(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primario" disabled={guardando}>
                  {guardando ? 'Guardando…' : editandoCompromiso ? 'Guardar Cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

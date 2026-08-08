import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { Departamento, Presupuesto } from '../../types'
import { gpService } from './services'
import { anioMesActual, nombreMes, parsearAnioMes, formatoUsd } from './utils'
import { useContextoGastoPresupuesto } from './contexto'
import Cargando from '../../components/Cargando'

function anioMesValor(): string {
  const { anio, mes } = anioMesActual()
  return `${anio}-${String(mes).padStart(2, '0')}`
}

type VistaPresupuestos = 'mes' | 'anio'

export default function PresupuestosTab() {
  const { perfil } = useAuth()
  const { departamentos, recargarDepartamentos } = useContextoGastoPresupuesto()
  const esAdmin = perfil?.role === 'admin'

  const [periodo, setPeriodo] = useState(anioMesValor())
  const [vista, setVista] = useState<VistaPresupuestos>('mes')
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioMesActual().anio)
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [presupuestosAnio, setPresupuestosAnio] = useState<Presupuesto[]>([])
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [nuevoDepto, setNuevoDepto] = useState('')
  const [modalDeptoAbierto, setModalDeptoAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const { anio, mes } = useMemo(() => parsearAnioMes(periodo), [periodo])

  const cargar = useCallback(async () => {
    setCargando(true)
    const res = await gpService.listarPresupuestos(anio, mes)
    if (res.error) {
      setError(res.error.message)
      setPresupuestos([])
    } else {
      setPresupuestos(res.data ?? [])
    }
    setCargando(false)
  }, [anio, mes])

  const cargarAnio = useCallback(async () => {
    const res = await gpService.listarPresupuestosAnio(anioSeleccionado)
    if (!res.error) {
      setPresupuestosAnio(res.data ?? [])
    }
  }, [anioSeleccionado])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    if (vista === 'anio') {
      void cargarAnio()
    }
  }, [vista, cargarAnio])

  useEffect(() => {
    // Cuando llegan los presupuestos del mes, precargar los montos en los inputs.
    const mapa: Record<string, string> = {}
    for (const p of presupuestos) {
      mapa[p.departamento_id] = String(p.monto_usd)
    }
    setMontos(mapa)
  }, [presupuestos])

  useEffect(() => {
    function onTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') cerrarModalDepto()
    }
    document.addEventListener('keydown', onTecla)
    return () => document.removeEventListener('keydown', onTecla)
  }, [modalDeptoAbierto])

  function cerrarModalDepto() {
    setModalDeptoAbierto(false)
    setNuevoDepto('')
    setError(null)
  }

  function mostrarAviso(msg: string) {
    setAviso(msg)
    window.setTimeout(() => setAviso(null), 3000)
  }

  async function guardar(departamentoId: string) {
    setError(null)
    const valor = Number.parseFloat(montos[departamentoId] ?? '')
    if (!Number.isFinite(valor) || valor < 0) {
      setError('Ingresa un monto válido (mayor o igual a 0)')
      return
    }
    const res = await gpService.guardarPresupuesto({
      departamento_id: departamentoId,
      anio,
      mes,
      monto_usd: valor,
    })
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso('Presupuesto guardado')
    void cargar()
  }

  async function agregarDepartamento(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!nuevoDepto.trim()) return
    const res = await gpService.crearDepartamento(nuevoDepto.trim())
    if (res.error) {
      setError(res.error.message)
      return
    }
    setNuevoDepto('')
    setModalDeptoAbierto(false)
    mostrarAviso('Departamento creado')
    recargarDepartamentos()
  }

  async function eliminarDepartamento(d: Departamento) {
    setError(null)
    const confirmacion = window.confirm(
      `¿Eliminar el departamento "${d.nombre}"?\n\nSe eliminarán sus presupuestos. No se podrá eliminar si tiene movimientos registrados.`,
    )
    if (!confirmacion) return
    const res = await gpService.eliminarDepartamento(d.id)
    if (res.error) {
      setError(
        `No se pudo eliminar: ${res.error.message}. Asegúrate de que no tenga movimientos registrados.`,
      )
      return
    }
    mostrarAviso('Departamento eliminado')
    recargarDepartamentos()
  }

  async function copiarDesdeMesAnterior() {
    let mesAnterior = mes - 1
    let anioAnterior = anio
    if (mesAnterior < 1) {
      mesAnterior = 12
      anioAnterior = anio - 1
    }
    setError(null)
    let copiados = 0
    for (const d of departamentos) {
      const res = await gpService.copiarPresupuesto(d.id, anioAnterior, mesAnterior, anio, mes)
      if (!res.error) copiados++
    }
    if (copiados > 0) {
      mostrarAviso(`Presupuestos copiados desde ${nombreMes(anioAnterior, mesAnterior)}`)
      void cargar()
    } else {
      setError('No hay presupuestos para copiar del mes anterior')
    }
  }

  async function copiarDesdeMesSiguiente() {
    let mesSiguiente = mes + 1
    let anioSiguiente = anio
    if (mesSiguiente > 12) {
      mesSiguiente = 1
      anioSiguiente = anio + 1
    }
    setError(null)
    let copiados = 0
    for (const d of departamentos) {
      const res = await gpService.copiarPresupuesto(d.id, anioSiguiente, mesSiguiente, anio, mes)
      if (!res.error) copiados++
    }
    if (copiados > 0) {
      mostrarAviso(`Presupuestos copiados desde ${nombreMes(anioSiguiente, mesSiguiente)}`)
      void cargar()
    } else {
      setError('No hay presupuestos para copiar del mes siguiente')
    }
  }

  async function copiarAMesSiguiente() {
    let mesSiguiente = mes + 1
    let anioSiguiente = anio
    if (mesSiguiente > 12) {
      mesSiguiente = 1
      anioSiguiente = anio + 1
    }
    setError(null)
    let copiados = 0
    for (const d of departamentos) {
      const presupuestoActual = presupuestos.find((p) => p.departamento_id === d.id)
      if (presupuestoActual) {
        const res = await gpService.guardarPresupuesto({
          departamento_id: d.id,
          anio: anioSiguiente,
          mes: mesSiguiente,
          monto_usd: presupuestoActual.monto_usd,
        })
        if (!res.error) copiados++
      }
    }
    if (copiados > 0) {
      mostrarAviso(`Presupuestos copiados a ${nombreMes(anioSiguiente, mesSiguiente)}`)
    }
  }

  const resumenAnio = useMemo(() => {
    const porMes: Record<number, number> = {}
    for (let m = 1; m <= 12; m++) {
      porMes[m] = presupuestosAnio.filter((p) => p.mes === m).reduce((s, p) => s + p.monto_usd, 0)
    }
    const totalAnio = Object.values(porMes).reduce((s, v) => s + v, 0)
    return { porMes, totalAnio }
  }, [presupuestosAnio])

  return (
    <div className="pestana-contenido">
      <div className="form-tarjeta">
        <div className="form-tarjeta-titulo">
          <h3>Presupuesto mensual por departamento</h3>
          <div className="vista-toggle">
            <button
              type="button"
              className={`vista-toggle-btn ${vista === 'mes' ? 'activo' : ''}`}
              onClick={() => setVista('mes')}
            >
              Por mes
            </button>
            <button
              type="button"
              className={`vista-toggle-btn ${vista === 'anio' ? 'activo' : ''}`}
              onClick={() => setVista('anio')}
            >
              Histórico anual
            </button>
          </div>
        </div>

        {vista === 'mes' ? (
          <>
            <div className="form-grid">
              <label className="campo">
                <span>Periodo</span>
                <input
                  type="month"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                />
              </label>
            </div>

            <p className="nota-ayuda">
              Presupuesto para <strong>{nombreMes(anio, mes)}</strong>. Los valores se guardan en
              USD (el sistema siempre refleja USD).
            </p>

            {esAdmin && (
              <div className="presupuesto-acciones-rapidas">
                <button
                  type="button"
                  className="btn-secundario btn-sm"
                  onClick={() => void copiarDesdeMesAnterior()}
                >
                  ← Copiar desde mes anterior
                </button>
                <button
                  type="button"
                  className="btn-secundario btn-sm"
                  onClick={() => void copiarDesdeMesSiguiente()}
                >
                  Copiar desde mes siguiente →
                </button>
                <button
                  type="button"
                  className="btn-secundario btn-sm"
                  onClick={() => void copiarAMesSiguiente()}
                >
                  Copiar actual al mes siguiente →
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="form-grid">
              <label className="campo">
                <span>Año</span>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                />
              </label>
            </div>

            <p className="nota-ayuda">
              Resumen de presupuestos para el año <strong>{anioSeleccionado}</strong>.
            </p>

            <div className="resumen-anio-grid">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <div key={m} className="resumen-anio-card">
                  <span className="resumen-anio-mes">{nombreMes(anioSeleccionado, m)}</span>
                  <strong className="resumen-anio-monto">{formatoUsd(resumenAnio.porMes[m])}</strong>
                </div>
              ))}
              <div className="resumen-anio-card resumen-anio-total">
                <span className="resumen-anio-mes">Total anual</span>
                <strong className="resumen-anio-monto">{formatoUsd(resumenAnio.totalAnio)}</strong>
              </div>
            </div>
          </>
        )}

        {error && <div className="alerta error">{error}</div>}
        {aviso && <div className="alerta exito">{aviso}</div>}

        {vista === 'mes' && (
          <div className="tabla-contenedor">
            {cargando ? (
              <Cargando mensaje="Cargando presupuestos…" />
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Departamento</th>
                    <th>Presupuesto (USD)</th>
                    {esAdmin && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {departamentos.map((d) => (
                    <tr key={d.id}>
                      <td>{d.nombre}</td>
                      <td>
                        <input
                          className="input-tabla"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          value={montos[d.id] ?? ''}
                          onChange={(e) =>
                            setMontos((prev) => ({ ...prev, [d.id]: e.target.value }))
                          }
                          disabled={!esAdmin}
                          placeholder="0.00"
                        />
                      </td>
                      {esAdmin && (
                        <td className="acciones">
                          <button
                            type="button"
                            className="btn-secundario btn-sm"
                            onClick={() => void guardar(d.id)}
                          >
                            Guardar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {esAdmin && (
        <div className="form-tarjeta form-tarjeta-fila">
          <div className="tarjeta-herramienta">
            <div>
              <h3>Departamentos</h3>
              <p>Unidades para asignar presupuestos y movimientos.</p>
            </div>
            <button
              type="button"
              className="btn-primario"
              onClick={() => setModalDeptoAbierto(true)}
            >
              + Nuevo departamento
            </button>
          </div>

          <div className="chip-lista">
            {departamentos.map((d) => (
              <span key={d.id} className="chip">
                {d.nombre}
                <button
                  type="button"
                  className="chip-eliminar"
                  title="Eliminar departamento"
                  onClick={() => void eliminarDepartamento(d)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {presupuestos.length > 0 && (
            <p className="nota-ayuda">
              Total presupuestado: {formatoUsd(presupuestos.reduce((s, p) => s + p.monto_usd, 0))}
            </p>
          )}
        </div>
      )}

      {modalDeptoAbierto && (
        <div className="modal-fondo" onClick={cerrarModalDepto}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo departamento</h3>

            <form onSubmit={agregarDepartamento} className="login-form" noValidate>
              <label className="campo">
                <span>Nombre</span>
                <input
                  value={nuevoDepto}
                  onChange={(e) => setNuevoDepto(e.target.value)}
                  placeholder="Ej. Logística"
                  autoFocus
                  required
                />
              </label>

              {error && <div className="alerta error">{error}</div>}

              <div className="modal-acciones">
                <button type="button" className="btn-secundario" onClick={cerrarModalDepto}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primario">
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

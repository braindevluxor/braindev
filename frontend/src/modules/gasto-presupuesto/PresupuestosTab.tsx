import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { Departamento, Presupuesto } from '../../types'
import { gpService } from './services'
import { anioMesActual, nombreMes, formatoUsd } from './utils'
import { useContextoGastoPresupuesto } from './contexto'
import Cargando from '../../components/Cargando'

function anioMesValor(): string {
  const { anio, mes } = anioMesActual()
  return `${anio}-${String(mes).padStart(2, '0')}`
}

export default function PresupuestosTab() {
  const { perfil } = useAuth()
  const { departamentos, recargarDepartamentos } = useContextoGastoPresupuesto()
  const esAdmin = perfil?.role === 'admin'

  const [periodo, setPeriodo] = useState(anioMesValor())
  const [presupuestosMes, setPresupuestosMes] = useState<Presupuesto[]>([])
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [cargandoMes, setCargandoMes] = useState(false)

  const [deptoSeleccionado, setDeptoSeleccionado] = useState<string | null>(null)
  const [historialDepto, setHistorialDepto] = useState<Presupuesto[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)

  const [modalDeptoAbierto, setModalDeptoAbierto] = useState(false)
  const [nuevoDepto, setNuevoDepto] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const { anio, mes } = useMemo(() => {
    const [a, m] = periodo.split('-').map(Number)
    return { anio: a, mes: m }
  }, [periodo])

  const cargarPresupuestosMes = useCallback(async () => {
    setCargandoMes(true)
    const res = await gpService.listarPresupuestos(anio, mes)
    if (res.error) {
      setError(res.error.message)
      setPresupuestosMes([])
    } else {
      setPresupuestosMes(res.data ?? [])
    }
    setCargandoMes(false)
  }, [anio, mes])

  useEffect(() => {
    void cargarPresupuestosMes()
  }, [cargarPresupuestosMes])

  useEffect(() => {
    const mapa: Record<string, string> = {}
    for (const p of presupuestosMes) {
      mapa[p.departamento_id] = String(p.monto_usd)
    }
    setMontos(mapa)
  }, [presupuestosMes])

  const cargarHistorial = useCallback(async (deptoId: string) => {
    setCargandoHistorial(true)
    const res = await gpService.listarPresupuestosDepartamento(deptoId)
    if (!res.error) {
      setHistorialDepto(res.data ?? [])
    }
    setCargandoHistorial(false)
  }, [])

  useEffect(() => {
    if (deptoSeleccionado) {
      void cargarHistorial(deptoSeleccionado)
    }
  }, [deptoSeleccionado, cargarHistorial])

  useEffect(() => {
    function onTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setModalDeptoAbierto(false)
        setNuevoDepto('')
      }
    }
    document.addEventListener('keydown', onTecla)
    return () => document.removeEventListener('keydown', onTecla)
  }, [])

  function mostrarAviso(msg: string) {
    setAviso(msg)
    window.setTimeout(() => setAviso(null), 3000)
  }

  async function guardar(departamentoId: string) {
    setError(null)
    const valor = Number.parseFloat(montos[departamentoId] ?? '')
    if (!Number.isFinite(valor) || valor < 0) {
      setError('Ingresa un monto válido')
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
    mostrarAviso('Guardado')
    void cargarPresupuestosMes()
    if (deptoSeleccionado) {
      void cargarHistorial(deptoSeleccionado)
    }
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
    mostrarAviso('Unidad creada')
    recargarDepartamentos()
  }

  async function eliminarDepartamento(d: Departamento) {
    setError(null)
    if (!window.confirm(`¿Eliminar "${d.nombre}"?`)) return
    const res = await gpService.eliminarDepartamento(d.id)
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso('Eliminada')
    recargarDepartamentos()
    if (deptoSeleccionado === d.id) {
      setDeptoSeleccionado(null)
    }
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
      mostrarAviso(`Copiado desde ${nombreMes(anioAnterior, mesAnterior)}`)
      void cargarPresupuestosMes()
    } else {
      setError('Sin datos en mes anterior')
    }
  }

  const totalMes = presupuestosMes.reduce((s, p) => s + p.monto_usd, 0)

  const historialPorMes = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const p of historialDepto) {
      const key = `${p.anio}-${String(p.mes).padStart(2, '0')}`
      mapa[key] = (mapa[key] || 0) + p.monto_usd
    }
    return Object.entries(mapa).sort(([a], [b]) => b.localeCompare(a))
  }, [historialDepto])

  const deptoNombre = deptoSeleccionado
    ? departamentos.find((d) => d.id === deptoSeleccionado)?.nombre ?? ''
    : ''

  return (
    <div className="presupuestos-layout">
      <aside className="presupuestos-sidebar">
        <div className="sidebar-header">
          <h3>Unidades</h3>
          {esAdmin && (
            <button
              type="button"
              className="btn-primario btn-sm"
              onClick={() => setModalDeptoAbierto(true)}
            >
              + Nueva
            </button>
          )}
        </div>

        <div className="sidebar-lista">
          {departamentos.length === 0 ? (
            <p className="sidebar-vacio">Sin unidades</p>
          ) : (
            departamentos.map((d) => {
              const presupuesto = presupuestosMes.find((p) => p.departamento_id === d.id)
              const seleccionado = deptoSeleccionado === d.id
              return (
                <div
                  key={d.id}
                  className={`sidebar-item ${seleccionado ? 'seleccionado' : ''}`}
                  onClick={() => setDeptoSeleccionado(seleccionado ? null : d.id)}
                >
                  <div className="sidebar-item-info">
                    <span className="sidebar-item-nombre">{d.nombre}</span>
                    <span className="sidebar-item-monto">
                      {formatoUsd(presupuesto?.monto_usd ?? 0)}
                    </span>
                  </div>
                  {esAdmin && (
                    <button
                      type="button"
                      className="sidebar-item-eliminar"
                      onClick={(e) => {
                        e.stopPropagation()
                        void eliminarDepartamento(d)
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </aside>

      <main className="presupuestos-main">
        <div className="main-header">
          <div className="main-header-info">
            <h2>{nombreMes(anio, mes)}</h2>
            <span className="main-total">{formatoUsd(totalMes)}</span>
          </div>
          <div className="main-header-acciones">
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="input-month"
            />
            {esAdmin && (
              <button
                type="button"
                className="btn-secundario btn-sm"
                onClick={() => void copiarDesdeMesAnterior()}
              >
                ← Copiar mes anterior
              </button>
            )}
          </div>
        </div>

        {error && <div className="alerta error">{error}</div>}
        {aviso && <div className="alerta exito">{aviso}</div>}

        <div className="tabla-contenedor">
          {cargandoMes ? (
            <Cargando mensaje="Cargando…" />
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th className="td-der">Presupuesto (USD)</th>
                  {esAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {departamentos.map((d) => (
                  <tr key={d.id} className={deptoSeleccionado === d.id ? 'fila-seleccionada' : ''}>
                    <td>{d.nombre}</td>
                    <td className="td-der">
                      {esAdmin ? (
                        <input
                          className="input-tabla input-tabla-der"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          value={montos[d.id] ?? ''}
                          onChange={(e) =>
                            setMontos((prev) => ({ ...prev, [d.id]: e.target.value }))
                          }
                          placeholder="0.00"
                        />
                      ) : (
                        formatoUsd(Number(montos[d.id]) || 0)
                      )}
                    </td>
                    {esAdmin && (
                      <td className="acciones">
                        <button
                          type="button"
                          className="btn-primario btn-sm"
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

        {deptoSeleccionado && (
          <div className="historial-panel">
            <div className="historial-header">
              <h3>Historial: {deptoNombre}</h3>
              <button
                type="button"
                className="btn-secundario btn-sm"
                onClick={() => setDeptoSeleccionado(null)}
              >
                ×
              </button>
            </div>
            <div className="historial-grid">
              {cargandoHistorial ? (
                <Cargando mensaje="Cargando…" />
              ) : historialPorMes.length === 0 ? (
                <p className="vacio">Sin historial</p>
              ) : (
                historialPorMes.map(([periodo, monto]) => (
                  <div key={periodo} className="historial-item">
                    <span className="historial-periodo">{periodo}</span>
                    <strong className="historial-monto">{formatoUsd(monto)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {modalDeptoAbierto && (
        <div className="modal-fondo" onClick={() => setModalDeptoAbierto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nueva unidad presupuestaria</h3>
            <form onSubmit={agregarDepartamento} className="login-form" noValidate>
              <label className="campo">
                <span>Nombre</span>
                <input
                  value={nuevoDepto}
                  onChange={(e) => setNuevoDepto(e.target.value)}
                  placeholder="Ej. Logística, Marketing..."
                  autoFocus
                  required
                />
              </label>
              <div className="modal-acciones">
                <button type="button" className="btn-secundario" onClick={() => setModalDeptoAbierto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primario">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

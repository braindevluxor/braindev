import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Departamento, Movimiento, Presupuesto } from '../../types'
import { gpService } from './services'
import {
  anioMesActual,
  formatoBs,
  formatoFecha,
  formatoUsd,
  nombreMes,
  parsearAnioMes,
  rangoMes,
} from './utils'
import { useContextoGastoPresupuesto } from './contexto'

interface FilaReporte {
  departamento: Departamento
  presupuesto: number
  gasto: number
  ingreso: number
  saldo: number
  porcentaje: number | null
}

type TipoPeriodo = 'mes' | 'anio' | 'todo' | 'rango'

const LIMITE_PAGINA = 50

const TIPOS_PERIODO: { valor: TipoPeriodo; etiqueta: string }[] = [
  { valor: 'mes', etiqueta: 'Mes' },
  { valor: 'anio', etiqueta: 'Año' },
  { valor: 'rango', etiqueta: 'Rango de fechas' },
  { valor: 'todo', etiqueta: 'Todo' },
]

function anioMesValor(): string {
  const { anio, mes } = anioMesActual()
  return `${anio}-${String(mes).padStart(2, '0')}`
}

function primerDiaMesActual(): string {
  const { anio, mes } = anioMesActual()
  return `${anio}-${String(mes).padStart(2, '0')}-01`
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function colorUso(porcentaje: number): string {
  if (porcentaje <= 60) return 'uso-bajo'
  if (porcentaje <= 85) return 'uso-medio'
  if (porcentaje <= 100) return 'uso-alto'
  return 'uso-excedido'
}

export default function ReportesTab() {
  const { departamentos } = useContextoGastoPresupuesto()
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('mes')
  const [periodo, setPeriodo] = useState(anioMesValor())
  const [anio, setAnio] = useState(String(anioMesActual().anio))
  const [desde, setDesde] = useState(primerDiaMesActual())
  const [hasta, setHasta] = useState(hoyISO())
  const [pagina, setPagina] = useState(1)

  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rango = useMemo(() => {
    if (tipoPeriodo === 'mes') {
      const { anio: a, mes: m } = parsearAnioMes(periodo)
      return rangoMes(a, m)
    }
    if (tipoPeriodo === 'anio') {
      const a = Number(anio)
      return { desde: `${a}-01-01`, hasta: `${a}-12-31` }
    }
    if (tipoPeriodo === 'rango') {
      if (!desde || !hasta) return null
      if (desde > hasta) return null
      return { desde, hasta }
    }
    return null
  }, [tipoPeriodo, periodo, anio, desde, hasta])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)

    const [resMov, resPres] = rango
      ? await Promise.all([
          gpService.listarMovimientosRango(rango.desde, rango.hasta),
          gpService.listarPresupuestosTodos(),
        ])
      : await Promise.all([gpService.listarMovimientos(), gpService.listarPresupuestosTodos()])

    if (resMov.error) {
      setError(resMov.error.message)
      setMovimientos([])
    } else {
      setMovimientos(resMov.data ?? [])
    }
    if (resPres.error) {
      setError(resPres.error.message)
      setPresupuestos([])
    } else {
      setPresupuestos(resPres.data ?? [])
    }
    setPagina(1)
    setCargando(false)
  }, [rango])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const presupuestosEnPeriodo = useMemo(() => {
    return presupuestos.filter((p) => {
      if (tipoPeriodo === 'todo') return true
      if (tipoPeriodo === 'anio') return p.anio === Number(anio)
      if (tipoPeriodo === 'mes') {
        const { anio: a, mes: m } = parsearAnioMes(periodo)
        return p.anio === a && p.mes === m
      }
      if (tipoPeriodo === 'rango') {
        if (!desde || !hasta || desde > hasta) return false
        const primerDia = new Date(`${p.anio}-${String(p.mes).padStart(2, '0')}-01`)
        const ultimoDia = new Date(p.anio, p.mes, 0)
        const d = new Date(desde)
        const h = new Date(hasta)
        return ultimoDia >= d && primerDia <= h
      }
      return false
    })
  }, [presupuestos, tipoPeriodo, periodo, anio, desde, hasta])

  const filas = useMemo<FilaReporte[]>(() => {
    const presupuestoPorDepto = new Map<string, number>()
    for (const p of presupuestosEnPeriodo) {
      presupuestoPorDepto.set(p.departamento_id, (presupuestoPorDepto.get(p.departamento_id) ?? 0) + p.monto_usd)
    }
    const gastoPorDepto = new Map<string, number>()
    const ingresoPorDepto = new Map<string, number>()

    for (const m of movimientos) {
      if (m.tipo === 'gasto') {
        gastoPorDepto.set(m.departamento_id, (gastoPorDepto.get(m.departamento_id) ?? 0) + m.monto_usd)
      } else {
        ingresoPorDepto.set(m.departamento_id, (ingresoPorDepto.get(m.departamento_id) ?? 0) + m.monto_usd)
      }
    }

    return departamentos
      .map((d) => {
        const presupuesto = presupuestoPorDepto.get(d.id) ?? 0
        const gasto = gastoPorDepto.get(d.id) ?? 0
        const ingreso = ingresoPorDepto.get(d.id) ?? 0
        const porcentaje = presupuesto > 0 ? (gasto / presupuesto) * 100 : null
        return {
          departamento: d,
          presupuesto,
          gasto,
          ingreso,
          saldo: presupuesto - gasto + ingreso,
          porcentaje,
        }
      })
      .sort((a, b) => (b.porcentaje ?? 0) - (a.porcentaje ?? 0))
  }, [departamentos, movimientos, presupuestosEnPeriodo])

  const totales = useMemo(() => {
    return filas.reduce(
      (acc, f) => ({
        presupuesto: acc.presupuesto + f.presupuesto,
        gasto: acc.gasto + f.gasto,
        ingreso: acc.ingreso + f.ingreso,
      }),
      { presupuesto: 0, gasto: 0, ingreso: 0 },
    )
  }, [filas])

  const conMovimientos = movimientos.length > 0

  const totalPaginas = Math.max(1, Math.ceil(movimientos.length / LIMITE_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const movimientosPagina = movimientos.slice(
    (paginaActual - 1) * LIMITE_PAGINA,
    paginaActual * LIMITE_PAGINA,
  )

  const etiquetaPeriodo = useMemo(() => {
    if (tipoPeriodo === 'mes') {
      const { anio: a, mes: m } = parsearAnioMes(periodo)
      return nombreMes(a, m)
    }
    if (tipoPeriodo === 'anio') return `año ${anio}`
    if (tipoPeriodo === 'rango') {
      if (!desde || !hasta) return 'periodo seleccionado'
      if (desde > hasta) return 'rango inválido'
      return `${formatoFecha(desde)} al ${formatoFecha(hasta)}`
    }
    return 'todo el historial'
  }, [tipoPeriodo, periodo, anio, desde, hasta])

  return (
    <div className="pestana-contenido">
      <div className="form-tarjeta">
        <div className="form-tarjeta-titulo">
          <h3>Reporte de gasto vs presupuesto</h3>
        </div>

        <div className="form-grid filtros-grid">
          <label className="campo">
            <span>Tipo de periodo</span>
            <select
              value={tipoPeriodo}
              onChange={(e) => setTipoPeriodo(e.target.value as TipoPeriodo)}
            >
              {TIPOS_PERIODO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          </label>

          {tipoPeriodo === 'mes' && (
            <label className="campo">
              <span>Mes</span>
              <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
            </label>
          )}

          {tipoPeriodo === 'anio' && (
            <label className="campo">
              <span>Año</span>
              <input
                type="number"
                min="2000"
                max="2100"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
              />
            </label>
          )}

          {tipoPeriodo === 'rango' && (
            <>
              <label className="campo">
                <span>Desde</span>
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              </label>
              <label className="campo">
                <span>Hasta</span>
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </label>
            </>
          )}
        </div>

        <p className="nota-ayuda">
          Comparación del gasto registrado contra el presupuesto de{' '}
          <strong>{etiquetaPeriodo}</strong>. El % de uso = gasto / presupuesto.
        </p>

        {error && <div className="alerta error">{error}</div>}

        {cargando ? (
          <p className="vacio">Calculando…</p>
        ) : !conMovimientos ? (
          <p className="vacio">No hay movimientos en este periodo.</p>
        ) : (
          <>
            <div className="kpi-grid">
              <div className="kpi-card kpi-gasto">
                <span>Gasto</span>
                <strong>{formatoUsd(totales.gasto)}</strong>
                <small>{`${filas.filter((f) => f.gasto > 0).length} de ${filas.length} departamentos`}</small>
              </div>
              <div className="kpi-card kpi-ingreso">
                <span>Ingreso</span>
                <strong>{formatoUsd(totales.ingreso)}</strong>
                <small>{`${filas.filter((f) => f.ingreso > 0).length} de ${filas.length} departamentos`}</small>
              </div>
              <div className="kpi-card kpi-saldo">
                <span>Saldo final</span>
                <strong
                  className={totales.presupuesto - totales.gasto + totales.ingreso < 0 ? 'texto-negativo' : ''}
                >
                  {formatoUsd(totales.presupuesto - totales.gasto + totales.ingreso)}
                </strong>
                <small>Presupuesto + Ingreso − Gasto</small>
              </div>
            </div>

            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Departamento</th>
                    <th className="td-der">Presupuesto</th>
                    <th className="td-der">Gasto</th>
                    <th className="td-der">Ingreso</th>
                    <th className="td-der">Saldo</th>
                    <th>Uso del presupuesto</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.departamento.id}>
                      <td>{f.departamento.nombre}</td>
                      <td className="td-der">{formatoUsd(f.presupuesto)}</td>
                      <td className="td-der">{formatoUsd(f.gasto)}</td>
                      <td className="td-der">{formatoUsd(f.ingreso)}</td>
                      <td className={`td-der ${f.saldo < 0 ? 'texto-negativo' : ''}`}>
                        {formatoUsd(f.saldo)}
                      </td>
                      <td>
                        {f.porcentaje === null ? (
                          <span className="td-secundario">—</span>
                        ) : (
                          <span className={`uso ${colorUso(f.porcentaje)}`}>
                            {f.porcentaje.toFixed(0)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="nota-ayuda">
              Movimientos del periodo ({movimientos.length} registros, máx.{' '}
              {LIMITE_PAGINA} por página):
            </p>
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Departamento</th>
                    <th>Concepto</th>
                    <th className="td-der">USD</th>
                    <th className="td-der">Bs</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosPagina.map((m) => {
                    const dep = departamentos.find((d) => d.id === m.departamento_id)
                    return (
                      <tr key={m.id}>
                        <td>{formatoFecha(m.fecha)}</td>
                        <td>
                          <span className={`estado ${m.tipo === 'gasto' ? 'inactivo' : 'activo'}`}>
                            {m.tipo === 'gasto' ? 'Gasto' : 'Ingreso'}
                          </span>
                        </td>
                        <td>{dep?.nombre ?? '—'}</td>
                        <td>{m.concepto || '—'}</td>
                        <td className="td-der">{formatoUsd(m.monto_usd)}</td>
                        <td className="td-der td-secundario">{formatoBs(m.monto_bs)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="paginacion">
                <button
                  type="button"
                  className="btn-secundario btn-sm"
                  disabled={paginaActual <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  ← Anterior
                </button>
                <span className="paginacion-info">
                  Página {paginaActual} de {totalPaginas} · {movimientos.length} registros
                </span>
                <button
                  type="button"
                  className="btn-secundario btn-sm"
                  disabled={paginaActual >= totalPaginas}
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

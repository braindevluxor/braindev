import { IconoGasto, IconoIngreso, IconoSuperavit, IconoOperaciones } from '@/components/pestanaIconos'
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
import Cargando from '../../components/Cargando'

type VistaReporte = 'tabla' | 'grafico'

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

function IconoGastoCard() {
  return <IconoGasto size={24} />
}

function IconoIngresoCard() {
  return <IconoIngreso size={24} />
}

function IconoSuperavitCard() {
  return <IconoSuperavit size={24} />
}

function IconoOperacionesCard() {
  return <IconoOperaciones size={24} />
}

const COLORES_DEPARTAMENTO = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
]

function generarCurvaSuave(puntos: { x: number; y: number }[]): string {
  if (puntos.length < 2) return ''
  let path = `M ${puntos[0].x},${puntos[0].y}`
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[Math.max(0, i - 1)]
    const p1 = puntos[i]
    const p2 = puntos[i + 1]
    const p3 = puntos[Math.min(puntos.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return path
}

function GraficoCurvas({ filas }: { filas: FilaReporte[] }) {
  const ancho = 600
  const alto = 300
  const margen = { top: 20, right: 20, bottom: 60, left: 60 }
  const anchoGrafico = ancho - margen.left - margen.right
  const altoGrafico = alto - margen.top - margen.bottom

  const maxGasto = Math.max(...filas.map((f) => f.gasto), 1)
  const maxPresupuesto = Math.max(...filas.map((f) => f.presupuesto), 1)
  const maxValor = Math.max(maxGasto, maxPresupuesto) * 1.1

  const filasConDatos = filas.filter((f) => f.gasto > 0 || f.presupuesto > 0)

  if (filasConDatos.length === 0) {
    return <p className="vacio">No hay datos para graficar.</p>
  }

  const pasoX = filasConDatos.length > 1 ? anchoGrafico / (filasConDatos.length - 1) : 0

  const puntosGasto = filasConDatos.map((f, i) => ({
    x: margen.left + i * pasoX,
    y: margen.top + altoGrafico - (f.gasto / maxValor) * altoGrafico,
  }))

  const puntosPresupuesto = filasConDatos.map((f, i) => ({
    x: margen.left + i * pasoX,
    y: margen.top + altoGrafico - (f.presupuesto / maxValor) * altoGrafico,
  }))

  const curvaGasto = generarCurvaSuave(puntosGasto)
  const curvaPresupuesto = generarCurvaSuave(puntosPresupuesto)

  const lineasY = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="grafico-contenedor">
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="grafico-svg">
        {lineasY.map((pct, i) => {
          const y = margen.top + altoGrafico - pct * altoGrafico
          return (
            <g key={i}>
              <line
                x1={margen.left}
                y1={y}
                x2={ancho - margen.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeDasharray="4,4"
              />
              <text
                x={margen.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="currentColor"
                fillOpacity={0.5}
              >
                {formatoUsd(maxValor * pct)}
              </text>
            </g>
          )
        })}

        {curvaPresupuesto && (
          <path
            d={curvaPresupuesto}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="6,4"
          />
        )}

        {curvaGasto && (
          <path
            d={curvaGasto}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
          />
        )}

        {puntosPresupuesto.map((p, i) => (
          <circle key={`pres-${i}`} cx={p.x} cy={p.y} r="4" fill="#10b981" />
        ))}

        {puntosGasto.map((p, i) => (
          <circle key={`gas-${i}`} cx={p.x} cy={p.y} r="4" fill="#ef4444" />
        ))}

        {filasConDatos.map((f, i) => {
          const x = margen.left + i * pasoX
          return (
            <text
              key={f.departamento.id}
              x={x}
              y={alto - margen.bottom + 20}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              fillOpacity={0.7}
              transform={`rotate(-30, ${x}, ${alto - margen.bottom + 20})`}
            >
              {f.departamento.nombre.length > 12
                ? f.departamento.nombre.slice(0, 12) + '...'
                : f.departamento.nombre}
            </text>
          )
        })}
      </svg>

      <div className="grafico-leyenda">
        <span className="leyenda-item">
          <span className="leyenda-color" style={{ backgroundColor: '#ef4444' }} />
          Gasto
        </span>
        <span className="leyenda-item">
          <span className="leyenda-color leyenda-linea" style={{ backgroundColor: '#10b981' }} />
          Presupuesto
        </span>
      </div>
    </div>
  )
}

export default function ReportesTab() {
  const { departamentos } = useContextoGastoPresupuesto()
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('mes')
  const [periodo, setPeriodo] = useState(anioMesValor())
  const [anio, setAnio] = useState(String(anioMesActual().anio))
  const [desde, setDesde] = useState(primerDiaMesActual())
  const [hasta, setHasta] = useState(hoyISO())
  const [pagina, setPagina] = useState(1)
  const [vista, setVista] = useState<VistaReporte>('tabla')

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
    let presupuesto = 0
    let gasto = 0
    let ingreso = 0
    let gastoBs = 0
    let ingresoBs = 0
    for (const f of filas) {
      presupuesto += f.presupuesto
      gasto += f.gasto
      ingreso += f.ingreso
    }
    for (const m of movimientos) {
      if (m.tipo === 'gasto') {
        gastoBs += m.monto_bs
      } else {
        ingresoBs += m.monto_bs
      }
    }
    return { presupuesto, gasto, ingreso, gastoBs, ingresoBs }
  }, [filas, movimientos])

  const superavit = totales.ingreso - totales.gasto
  const superavitBs = totales.ingresoBs - totales.gastoBs

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
          <Cargando mensaje="Calculando reportes…" />
        ) : !conMovimientos ? (
          <p className="vacio">No hay movimientos en este periodo.</p>
        ) : (
          <>
            <div className="kpi-grid">
              <div className="kpi-card kpi-gasto">
                <span className="kpi-icono">
                  <IconoGasto />
                </span>
                <div className="kpi-cuerpo">
                  <span>Total de gasto</span>
                  <strong>{formatoUsd(totales.gasto)}</strong>
                  <small>{formatoBs(totales.gastoBs)}</small>
                </div>
              </div>
              <div className="kpi-card kpi-ingreso">
                <span className="kpi-icono">
                  <IconoIngreso />
                </span>
                <div className="kpi-cuerpo">
                  <span>Total de ingreso</span>
                  <strong>{formatoUsd(totales.ingreso)}</strong>
                  <small>{formatoBs(totales.ingresoBs)}</small>
                </div>
              </div>
              <div className="kpi-card kpi-superavit">
                <span className="kpi-icono">
                  <IconoSuperavit />
                </span>
                <div className="kpi-cuerpo">
                  <span>Superávit</span>
                  <strong className={superavit < 0 ? 'texto-negativo' : ''}>
                    {formatoUsd(superavit)}
                  </strong>
                  <small className={superavitBs < 0 ? 'texto-negativo' : ''}>
                    {formatoBs(superavitBs)}
                  </small>
                </div>
              </div>
              <div className="kpi-card kpi-operaciones">
                <span className="kpi-icono">
                  <IconoOperaciones />
                </span>
                <div className="kpi-cuerpo">
                  <span>Operaciones</span>
                  <strong>{movimientos.length}</strong>
                  <small>
                    {`${filas.reduce((s, f) => s + (f.gasto > 0 ? 1 : 0), 0)} de gasto · ${
                      filas.reduce((s, f) => s + (f.ingreso > 0 ? 1 : 0), 0)
                    } de ingreso`}
                  </small>
                </div>
              </div>
            </div>

            <div className="vista-toggle">
              <button
                type="button"
                className={`vista-toggle-btn ${vista === 'tabla' ? 'activo' : ''}`}
                onClick={() => setVista('tabla')}
              >
                Tabla
              </button>
              <button
                type="button"
                className={`vista-toggle-btn ${vista === 'grafico' ? 'activo' : ''}`}
                onClick={() => setVista('grafico')}
              >
                Gráfico
              </button>
            </div>

            {vista === 'grafico' ? (
              <GraficoCurvas filas={filas} />
            ) : (
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
            )}

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

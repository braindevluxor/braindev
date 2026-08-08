import { IconoGasto, IconoIngreso, IconoSuperavit, IconoOperaciones, IconoInfo } from '@/components/pestanaIconos'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import type { CentroCosto, Departamento, Movimiento, Presupuesto, RazonSocial } from '../../types'
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
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    departamento: string
    valor: number
    tipo: 'gasto' | 'presupuesto'
  } | null>(null)
  
  const ancho = 800
  const alto = 400
  const margen = { top: 30, right: 30, bottom: 80, left: 80 }
  const anchoGrafico = ancho - margen.left - margen.right
  const altoGrafico = alto - margen.top - margen.bottom

  const filasConDatos = filas.filter((f) => f.gasto > 0 || f.presupuesto > 0)

  if (filasConDatos.length === 0) {
    return <p className="vacio">No hay datos para graficar.</p>
  }

  const maxGasto = Math.max(...filasConDatos.map((f) => f.gasto))
  const maxPresupuesto = Math.max(...filasConDatos.map((f) => f.presupuesto))
  const maxValor = Math.max(maxGasto, maxPresupuesto, 1) * 1.15

  const pasoX = filasConDatos.length > 1 ? anchoGrafico / (filasConDatos.length - 1) : anchoGrafico / 2

  const puntosGasto = filasConDatos.map((f, i) => ({
    x: margen.left + (filasConDatos.length > 1 ? i * pasoX : anchoGrafico / 2),
    y: margen.top + altoGrafico - (f.gasto / maxValor) * altoGrafico,
    valor: f.gasto,
    departamento: f.departamento.nombre,
  }))

  const puntosPresupuesto = filasConDatos.map((f, i) => ({
    x: margen.left + (filasConDatos.length > 1 ? i * pasoX : anchoGrafico / 2),
    y: margen.top + altoGrafico - (f.presupuesto / maxValor) * altoGrafico,
    valor: f.presupuesto,
    departamento: f.departamento.nombre,
  }))

  const curvaGasto = generarCurvaSuave(puntosGasto)
  const curvaPresupuesto = generarCurvaSuave(puntosPresupuesto)

  const lineasY = [0, 0.25, 0.5, 0.75, 1]

  function mostrarTooltip(e: React.MouseEvent, departamento: string, valor: number, tipo: 'gasto' | 'presupuesto', x: number, y: number) {
    const svg = (e.target as SVGElement).closest('svg')
    if (!svg) return
    
    const rect = svg.getBoundingClientRect()
    const svgWidth = rect.width
    const svgHeight = rect.height
    
    // Convertir coordenadas SVG a coordenadas de pantalla
    const scaleX = svgWidth / ancho
    const scaleY = svgHeight / alto
    
    setTooltip({
      visible: true,
      x: x * scaleX,
      y: y * scaleY,
      departamento,
      valor,
      tipo,
    })
  }

  function ocultarTooltip() {
    setTooltip(null)
  }

  return (
    <div className="grafico-contenedor">
      <div className="grafico-wrapper">
        <svg viewBox={`0 0 ${ancho} ${alto}`} className="grafico-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={margen.left} y={margen.top} width={anchoGrafico} height={altoGrafico} fill="#f8fafc" />

          {lineasY.map((pct, i) => {
            const y = margen.top + altoGrafico - pct * altoGrafico
            return (
              <g key={i}>
                <line
                  x1={margen.left}
                  y1={y}
                  x2={ancho - margen.right}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={margen.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#64748b"
                >
                  {formatoUsd(maxValor * pct)}
                </text>
              </g>
            )
          })}

          <line
            x1={margen.left}
            y1={margen.top + altoGrafico}
            x2={ancho - margen.right}
            y2={margen.top + altoGrafico}
            stroke="#334155"
            strokeWidth="2"
          />
          <line
            x1={margen.left}
            y1={margen.top}
            x2={margen.left}
            y2={margen.top + altoGrafico}
            stroke="#334155"
            strokeWidth="2"
          />

          {curvaPresupuesto && (
            <path
              d={curvaPresupuesto}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray="8,4"
            />
          )}

          {curvaGasto && (
            <path
              d={curvaGasto}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          )}

          {puntosPresupuesto.map((p, i) => (
            <circle
              key={`pres-${i}`}
              cx={p.x}
              cy={p.y}
              r="6"
              fill="#10b981"
              stroke="#fff"
              strokeWidth="2"
              className="grafico-punto"
              onMouseEnter={(e) => mostrarTooltip(e, p.departamento, p.valor, 'presupuesto', p.x, p.y)}
              onMouseLeave={ocultarTooltip}
            />
          ))}

          {puntosGasto.map((p, i) => (
            <circle
              key={`gas-${i}`}
              cx={p.x}
              cy={p.y}
              r="6"
              fill="#ef4444"
              stroke="#fff"
              strokeWidth="2"
              className="grafico-punto"
              onMouseEnter={(e) => mostrarTooltip(e, p.departamento, p.valor, 'gasto', p.x, p.y)}
              onMouseLeave={ocultarTooltip}
            />
          ))}

          {filasConDatos.map((f, i) => {
            const x = margen.left + (filasConDatos.length > 1 ? i * pasoX : anchoGrafico / 2)
            return (
              <text
                key={f.departamento.id}
                x={x}
                y={margen.top + altoGrafico + 25}
                textAnchor="middle"
                fontSize="11"
                fill="#334155"
                fontWeight="600"
              >
                {f.departamento.nombre.length > 15
                  ? f.departamento.nombre.slice(0, 15) + '...'
                  : f.departamento.nombre}
              </text>
            )
          })}
        </svg>

        {tooltip && tooltip.visible && (
          <div
            className="grafico-tooltip"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y - 10}px`,
            }}
          >
            <div className="tooltip-departamento">{tooltip.departamento}</div>
            <div className="tooltip-valor">
              {tooltip.tipo === 'gasto' ? 'Gasto: ' : 'Presupuesto: '}
              {formatoUsd(tooltip.valor)}
            </div>
          </div>
        )}
      </div>

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

function escapeHtml(valor: string | number): string {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
  const [razonesSociales, setRazonesSociales] = useState<RazonSocial[]>([])
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  const graficoExportRef = useRef<HTMLDivElement>(null)

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

    const [resMov, resPres, resRazones, resCentros] = rango
      ? await Promise.all([
          gpService.listarMovimientosRango(rango.desde, rango.hasta),
          gpService.listarPresupuestosTodos(),
          gpService.listarRazonesSociales(),
          gpService.listarCentrosCosto(),
        ])
      : await Promise.all([
          gpService.listarMovimientos(),
          gpService.listarPresupuestosTodos(),
          gpService.listarRazonesSociales(),
          gpService.listarCentrosCosto(),
        ])

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
    if (!resRazones.error) setRazonesSociales(resRazones.data ?? [])
    if (!resCentros.error) setCentrosCosto(resCentros.data ?? [])
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

  const tasaPromedio = useMemo(() => {
    const conTasa = movimientos.filter((m) => m.tasa_cambio > 0 && m.monto_usd > 0)
    const sumaUsd = conTasa.reduce((s, m) => s + m.monto_usd, 0)
    if (sumaUsd === 0) return null
    return conTasa.reduce((s, m) => s + m.tasa_cambio * m.monto_usd, 0) / sumaUsd
  }, [movimientos])

  const superavit = totales.presupuesto + totales.ingreso - totales.gasto
  const superavitBs =
    totales.ingresoBs - totales.gastoBs + (tasaPromedio ? totales.presupuesto * tasaPromedio : 0)

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

  function nombreBasePeriodo(): string {
    return etiquetaPeriodo
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
  }

  function exportarPDF() {
    if (exportando) return
    setExportando(true)
    setError(null)

    const svgEl = graficoExportRef.current?.querySelector('svg')
    const svgMarkup = svgEl
      ? new XMLSerializer().serializeToString(svgEl).replace(/^<svg /, '<svg xmlns="http://www.w3.org/2000/svg" ')
      : ''

    const filasHtml = filas
      .map((f) => {
        const pct = f.porcentaje
        let uso = '—'
        let color = '#64748b'
        if (pct !== null) {
          uso = `${pct.toFixed(0)}%`
          color = pct > 100 ? '#dc2626' : pct > 85 ? '#d97706' : pct > 60 ? '#ca8a04' : '#16a34a'
        }
        return `<tr>
            <td>${escapeHtml(f.departamento.nombre)}</td>
            <td class="num">${escapeHtml(formatoUsd(f.presupuesto))}</td>
            <td class="num">${escapeHtml(formatoUsd(f.gasto))}</td>
            <td class="num">${escapeHtml(formatoUsd(f.ingreso))}</td>
            <td class="num ${f.saldo < 0 ? 'neg' : ''}">${escapeHtml(formatoUsd(f.saldo))}</td>
            <td class="num"><span class="uso" style="color:${color}">${uso}</span></td>
          </tr>`
      })
      .join('')

    const kpiSuperavitNeg = superavit < 0 ? ' neg' : ''
    const kpiSuperavitBsNeg = superavitBs < 0 ? ' neg' : ''

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Reporte gasto vs presupuesto - ${escapeHtml(etiquetaPeriodo)}</title>
<style>
  @page { size: A4; margin: 11mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #1e293b; font-size: 12px; line-height: 1.4; margin: 0; }
  h1 { font-size: 21px; margin: 0 0 2px; }
  .meta { color: #64748b; font-size: 11px; margin-bottom: 16px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .kpi .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; font-weight: 700; }
  .kpi .val { font-size: 17px; font-weight: 700; margin-top: 2px; white-space: nowrap; }
  .kpi .bs { font-size: 10px; color: #64748b; }
  .neg { color: #dc2626 !important; }
  h2 { font-size: 14px; margin: 18px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; background: #f1f5f9; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; border-bottom: 2px solid #e2e8f0; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .num { text-align: right; }
  .uso { font-weight: 700; }
  .chart svg { width: 100%; height: auto; }
  .nota { margin-top: 14px; font-size: 10px; color: #94a3b8; }
</style>
</head>
<body>
  <h1>Reporte de gasto vs presupuesto</h1>
  <div class="meta">Periodo: <strong>${escapeHtml(etiquetaPeriodo)}</strong> &middot; Generado el ${escapeHtml(formatoFecha(hoyISO()))}</div>

  <div class="kpis">
    <div class="kpi">
      <div class="label">Total de gasto</div>
      <div class="val">${escapeHtml(formatoUsd(totales.gasto))}</div>
      <div class="bs">${escapeHtml(formatoBs(totales.gastoBs))}</div>
    </div>
    <div class="kpi">
      <div class="label">Total de ingreso</div>
      <div class="val">${escapeHtml(formatoUsd(totales.ingreso))}</div>
      <div class="bs">${escapeHtml(formatoBs(totales.ingresoBs))}</div>
    </div>
    <div class="kpi">
      <div class="label">Super&aacute;vit</div>
      <div class="val${kpiSuperavitNeg}">${escapeHtml(formatoUsd(superavit))}</div>
      <div class="bs${kpiSuperavitBsNeg}">${escapeHtml(formatoBs(superavitBs))}</div>
    </div>
    <div class="kpi">
      <div class="label">Operaciones</div>
      <div class="val">${movimientos.length}</div>
      <div class="bs">${filas.reduce((s, f) => s + (f.gasto > 0 ? 1 : 0), 0)} de gasto &middot; ${filas.reduce((s, f) => s + (f.ingreso > 0 ? 1 : 0), 0)} de ingreso</div>
    </div>
  </div>

  <h2>Comparaci&oacute;n por departamento</h2>
  <table>
    <thead>
      <tr>
        <th>Departamento</th>
        <th class="num">Presupuesto</th>
        <th class="num">Gasto</th>
        <th class="num">Ingreso</th>
        <th class="num">Saldo</th>
        <th class="num">Uso del presupuesto</th>
      </tr>
    </thead>
    <tbody>${filasHtml}</tbody>
  </table>

  <h2>Gr&aacute;fico de gasto vs presupuesto</h2>
  <div class="chart">${svgMarkup || '<p>No hay datos para graficar.</p>'}</div>

  <div class="nota">Los movimientos del periodo se exportan a Excel desde la aplicaci&oacute;n.</div>
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

  function exportarExcel() {
    if (movimientos.length === 0 || exportando) return
    const nombreDep = new Map(departamentos.map((d) => [d.id, d.nombre]))
    const nombreRazon = new Map(razonesSociales.map((r) => [r.id, r.nombre]))
    const filas = movimientos.map((m) => {
      const centro = centrosCosto.find((c) => c.id === m.centro_costo_id)
      return {
        Fecha: formatoFecha(m.fecha),
        Tipo: m.tipo === 'gasto' ? 'Gasto' : 'Ingreso',
        Departamento: nombreDep.get(m.departamento_id) ?? '—',
        'Razón social': centro ? (nombreRazon.get(centro.razon_social_id) ?? '—') : '—',
        'Centro de costo': centro ? centro.nombre : '—',
        Concepto: m.concepto || '—',
        'N° Factura': m.numero_factura || '—',
        Monto: m.monto,
        Moneda: m.moneda,
        'Tasa (Bs/USD)': m.tasa_cambio,
        'Monto USD': m.monto_usd,
        'Monto Bs': m.monto_bs,
      }
    })
    const ws = XLSX.utils.json_to_sheet(filas)
    ws['!cols'] = [
      { wch: 12 },
      { wch: 8 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
      { wch: 12 },
      { wch: 10 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
    XLSX.writeFile(wb, `movimientos-${nombreBasePeriodo() || 'periodo'}.xlsx`)
  }

  return (
    <div className="pestana-contenido">
      <div className="form-tarjeta">
        <div className="form-tarjeta-titulo">
          <h3>Reporte de gasto vs presupuesto</h3>
          <div className="titulo-acciones">
            <button
              type="button"
              className="btn-secundario btn-sm"
              onClick={exportarExcel}
              disabled={exportando || cargando || !conMovimientos}
            >
              Exportar Excel
            </button>
            <button
              type="button"
              className="btn-primario btn-sm"
              onClick={exportarPDF}
              disabled={exportando || cargando || !conMovimientos}
            >
              {exportando ? 'Exportando…' : 'Exportar PDF'}
            </button>
          </div>
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
            <div className="reporte-exportar">
              <div className="reporte-titulo-pdf">
                <h3>Reporte de gasto vs presupuesto</h3>
                <p>
                  Periodo: <strong>{etiquetaPeriodo}</strong> · Generado el{' '}
                  {formatoFecha(hoyISO())}
                </p>
              </div>
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
                  <div className="kpi-tooltip-contenedor">
                    <span>Superávit</span>
                    <button
                      type="button"
                      className="kpi-info-btn"
                      aria-label="Ver desglose del superávit"
                    >
                      <IconoInfo />
                    </button>
                    <div className="kpi-tooltip" role="tooltip">
                      <strong className="kpi-tooltip-titulo">
                        Superávit = (Presupuesto + Ingresos) − Gastos
                      </strong>
                      <div className="kpi-tooltip-fila">
                        <span>Presupuesto</span>
                        <strong>{formatoUsd(totales.presupuesto)}</strong>
                      </div>
                      <div className="kpi-tooltip-fila">
                        <span>Ingresos</span>
                        <strong>{formatoUsd(totales.ingreso)}</strong>
                      </div>
                      <div className="kpi-tooltip-fila">
                        <span>Gastos</span>
                        <strong>{formatoUsd(totales.gasto)}</strong>
                      </div>
                      <div className="kpi-tooltip-fila">
                        <span>Superávit</span>
                        <strong>{formatoUsd(superavit)}</strong>
                      </div>
                      <small className="kpi-tooltip-bs">≈ {formatoBs(superavitBs)}</small>
                    </div>
                  </div>
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
            </div>

            <div className="grafico-exportar" ref={graficoExportRef} aria-hidden="true">
              <GraficoCurvas filas={filas} />
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

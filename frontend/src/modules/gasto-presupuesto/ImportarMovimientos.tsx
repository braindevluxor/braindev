import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import * as XLSX from 'xlsx'
import { gpService, type DatosMovimiento } from './services'
import type { CentroCosto, Departamento, Moneda, RazonSocial, TipoMovimiento } from '../../types'
import { IconFileTypeXls } from '@tabler/icons-react'

interface Props {
  abierto: boolean
  onCerrar: () => void
  departamentos: Departamento[]
  razonesSociales: RazonSocial[]
  centrosCosto: CentroCosto[]
  onImportado: () => void
}

type Campo =
  | 'tipo'
  | 'fecha'
  | 'departamento'
  | 'razon_social'
  | 'centro_costo'
  | 'moneda'
  | 'monto'
  | 'tasa'
  | 'concepto'
  | 'factura'

interface FilaPreview {
  excelFila: number
  celdas: Record<Campo, unknown>
  errores: string[]
  datos: DatosMovimiento | null
}

const ENCABEZADOS: Campo[] = [
  'tipo',
  'fecha',
  'departamento',
  'razon_social',
  'centro_costo',
  'moneda',
  'monto',
  'tasa',
  'concepto',
  'factura',
]

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function parsearNumero(valor: unknown): number {
  if (typeof valor === 'number') return valor
  if (typeof valor !== 'string') return Number.NaN
  let t = valor.trim()
  if (!t) return Number.NaN
  t = t.replace(/[^\d,.-]/g, '')
  if (!t) return Number.NaN
  const ultimaComa = t.lastIndexOf(',')
  const ultimoPunto = t.lastIndexOf('.')
  if (ultimaComa > ultimoPunto) {
    t = t.replace(/\./g, '').replace(',', '.')
  } else {
    t = t.replace(/,/g, '')
  }
  const n = Number(t)
  return Number.isFinite(n) ? n : Number.NaN
}

function validarISO(anio: string, mes: string, dia: string): string | null {
  const y = Number(anio)
  const m = Number(mes)
  const d = Number(dia)
  if (!Number.isInteger(y) || y < 1900 || y > 2200 || m < 1 || m > 12) return null
  const fecha = new Date(Date.UTC(y, m - 1, d))
  if (
    fecha.getUTCFullYear() !== y ||
    fecha.getUTCMonth() !== m - 1 ||
    fecha.getUTCDate() !== d
  ) {
    return null
  }
  return `${anio}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function parsearFecha(valor: unknown): string | null {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor.toISOString().slice(0, 10)
  }
  if (typeof valor === 'number' && Number.isFinite(valor) && valor > 20000) {
    const codigo = XLSX.SSF.parse_date_code(valor)
    if (codigo) {
      return `${codigo.y}-${String(codigo.m).padStart(2, '0')}-${String(codigo.d).padStart(2, '0')}`
    }
    return null
  }
  if (typeof valor !== 'string') return null
  const t = valor.trim()
  if (!t) return null

  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return validarISO(m[1], m[2], m[3])

  m = t.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (m) return validarISO(m[1], m[2], m[3])

  m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/)
  if (m) {
    const [, a, b, c] = m
    if (c.length === 2) {
      const anio = 2000 + Number(c)
      return validarISO(String(anio), b, a) ?? validarISO(String(anio), a, b)
    }
    return validarISO(c, b, a) ?? validarISO(c, a, b)
  }
  return null
}

const MAPA_ENCABEZADOS: Record<string, Campo> = {
  tipo: 'tipo',
  fecha: 'fecha',
  'fecha (aaaa-mm-dd)': 'fecha',
  departamento: 'departamento',
  unidad: 'departamento',
  'unidad presupuestaria': 'departamento',
  'razon social': 'razon_social',
  'centro de costo': 'centro_costo',
  'centro costo': 'centro_costo',
  centro: 'centro_costo',
  moneda: 'moneda',
  monto: 'monto',
  'monto (usd)': 'monto',
  'tasa de cambio': 'tasa',
  tasa: 'tasa',
  'tasa cambio': 'tasa',
  'tasa (bs/usd)': 'tasa',
  'tasa (bs por usd)': 'tasa',
  concepto: 'concepto',
  factura: 'factura',
  'no factura': 'factura',
  'nro factura': 'factura',
  'numero factura': 'factura',
  'numero de factura': 'factura',
  'n de factura': 'factura',
  'n factura': 'factura',
}

export default function ImportarMovimientos({
  abierto,
  onCerrar,
  departamentos,
  razonesSociales,
  centrosCosto,
  onImportado,
}: Props) {
  const [archivo, setArchivo] = useState<string | null>(null)
  const [filas, setFilas] = useState<FilaPreview[]>([])
  const [importando, setImportando] = useState(false)
  const [errorImport, setErrorImport] = useState<string | null>(null)
  const [resultado, setResultado] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar()
    }
    if (abierto) {
      document.addEventListener('keydown', onTecla)
      return () => document.removeEventListener('keydown', onTecla)
    }
  }, [abierto, onCerrar])

  const departamentosPorNombre = useMemo(() => {
    const mapa = new Map<string, Departamento>()
    for (const d of departamentos) {
      const clave = normalizar(d.nombre)
      if (!mapa.has(clave)) mapa.set(clave, d)
    }
    return mapa
  }, [departamentos])

  function validarFila(excelFila: number, celdas: Record<Campo, unknown>): FilaPreview {
    const errores: string[] = []
    const c = (campo: Campo) => String(celdas[campo] ?? '').trim()

    const tipoTxt = normalizar(c('tipo'))
    let tipo: TipoMovimiento = 'gasto'
    if (tipoTxt === 'gasto' || tipoTxt === 'egreso') {
      tipo = 'gasto'
    } else if (tipoTxt === 'ingreso') {
      tipo = 'ingreso'
    } else {
      errores.push(`Tipo inválido "${c('tipo') || '(vacío)'}" (usa Gasto o Ingreso)`)
    }

    const fecha = parsearFecha(celdas.fecha)
    if (!fecha) errores.push(`Fecha inválida "${c('fecha') || '(vacía)'}" (usa AAAA-MM-DD)`)

    const nombreDepto = c('departamento')
    const depto = nombreDepto ? departamentosPorNombre.get(normalizar(nombreDepto)) : undefined
    if (!nombreDepto) {
      errores.push('Departamento requerido')
    } else if (!depto) {
      errores.push(`Departamento no encontrado: "${nombreDepto}"`)
    }

    const nombreRS = c('razon_social')
    let rs: RazonSocial | null = null
    if (nombreRS) {
      const coincidencias = razonesSociales.filter((r) => normalizar(r.nombre) === normalizar(nombreRS))
      if (coincidencias.length === 0) {
        errores.push(`Razón social no encontrada: "${nombreRS}"`)
      } else {
        rs = coincidencias[0]
      }
    }

    const nombreCC = c('centro_costo')
    let cc: CentroCosto | null = null
    if (nombreCC) {
      let candidatos = centrosCosto.filter((x) => normalizar(x.nombre) === normalizar(nombreCC))
      if (rs) candidatos = candidatos.filter((x) => x.razon_social_id === rs.id)
      if (candidatos.length === 0) {
        errores.push(`Centro de costo no encontrado: "${nombreCC}"`)
      } else if (candidatos.length > 1) {
        errores.push(`El centro de costo "${nombreCC}" es ambiguo (varios con el mismo nombre)`)
      } else {
        cc = candidatos[0]
      }
    }

    const monedaTxt = c('moneda').toUpperCase()
    let moneda: Moneda = 'USD'
    if (monedaTxt === 'USD') {
      moneda = 'USD'
    } else if (monedaTxt === 'VES' || monedaTxt === 'BS') {
      moneda = 'VES'
    } else {
      errores.push(`Moneda inválida "${c('moneda') || '(vacía)'}" (usa USD o VES)`)
    }

    const monto = parsearNumero(celdas.monto)
    if (!Number.isFinite(monto) || monto <= 0) {
      errores.push(`Monto inválido "${c('monto') || '(vacío)'}"`)
    }

    const tasa = parsearNumero(celdas.tasa)
    if (!Number.isFinite(tasa) || tasa <= 0) {
      errores.push(`Tasa inválida "${c('tasa') || '(vacía)'}" (Bs por USD)`)
    }

    const concepto = c('concepto')
    if (!concepto) errores.push('Concepto requerido')

    const factura = c('factura')
    if (!factura) errores.push('Nº de factura requerido')

    const valido = errores.length === 0

    return {
      excelFila,
      celdas,
      errores,
      datos:
        valido && depto && fecha
          ? {
              tipo,
              departamento_id: depto.id,
              concepto,
              numero_factura: factura,
              fecha,
              moneda,
              monto,
              tasa_cambio: tasa,
              centro_costo_id: cc?.id ?? undefined,
            }
          : null,
    }
  }

  function mapearEncabezados(encabezado: string[]): Record<number, Campo> {
    const res: Record<number, Campo> = {}
    const usados = new Set<Campo>()
    encabezado.forEach((h, i) => {
      const campo = MAPA_ENCABEZADOS[normalizar(h)]
      if (campo && !usados.has(campo)) {
        res[i] = campo
        usados.add(campo)
      }
    })
    return res
  }

  function procesarArchivo(filasCrudas: unknown[][]): FilaPreview[] {
    const conDatos = filasCrudas
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.some((celda) => String(celda ?? '').trim() !== ''))

    if (conDatos.length === 0) return []

    const mapaCol = mapearEncabezados(conDatos[0].f.map((celda) => String(celda ?? '').trim()))
    if (Object.keys(mapaCol).length === 0) {
      setErrorImport('El archivo no tiene columnas reconocidas. Descarga la plantilla y úsala.')
      return []
    }

    return conDatos.slice(1).map(({ f, i }) => {
      const celdas: Record<Campo, unknown> = { tipo: '', fecha: '', departamento: '', razon_social: '', centro_costo: '', moneda: '', monto: '', tasa: '', concepto: '', factura: '' }
      for (const [col, campo] of Object.entries(mapaCol)) {
        celdas[campo] = f[Number(col)] ?? ''
      }
      return validarFila(i + 1, celdas)
    })
  }

  async function onArchivoSeleccionado(e: ChangeEvent<HTMLInputElement>) {
    const archivoSel = e.target.files?.[0]
    if (!archivoSel) return
    setErrorImport(null)
    setResultado(null)
    try {
      const buffer = await archivoSel.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
      const hoja = wb.Sheets[wb.SheetNames[0]]
      const filasCrudas = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, defval: '' })
      setFilas(procesarArchivo(filasCrudas as unknown[][]))
      setArchivo(archivoSel.name)
    } catch {
      setFilas([])
      setArchivo(archivoSel.name)
      setErrorImport('No se pudo leer el archivo. Asegúrate de que sea un Excel válido (.xlsx, .xls o .csv).')
    }
  }

  function descargarPlantilla() {
    const ws = XLSX.utils.aoa_to_sheet([
      ENCABEZADOS.map((campo) =>
        campo === 'tipo'
          ? 'Tipo'
          : campo === 'fecha'
            ? 'Fecha'
            : campo === 'departamento'
              ? 'Departamento'
              : campo === 'razon_social'
                ? 'Razón Social'
                : campo === 'centro_costo'
                  ? 'Centro de Costo'
                  : campo === 'moneda'
                    ? 'Moneda'
                    : campo === 'monto'
                      ? 'Monto'
                      : campo === 'tasa'
                        ? 'Tasa de cambio (Bs/USD)'
                        : campo === 'concepto'
                          ? 'Concepto'
                          : 'Nº Factura',
      ),
      ['Gasto', '2026-08-01', 'Suministros', '', '', 'USD', '150.00', '36.50', 'Papelería de oficina', 'FAC-2026-001'],
      ['Ingreso', '2026-08-02', 'Otros', '', '', 'USD', '2000.00', '36.50', 'Abono de cliente', 'REC-2026-001'],
    ])
    ws['!cols'] = [
      { wch: 9 },
      { wch: 12 },
      { wch: 16 },
      { wch: 20 },
      { wch: 18 },
      { wch: 9 },
      { wch: 10 },
      { wch: 20 },
      { wch: 26 },
      { wch: 14 },
    ]

    const instrucciones = XLSX.utils.aoa_to_sheet([
      ['INSTRUCCIONES'],
      [],
      ['1. No modifiques los nombres de las columnas de la primera fila.'],
      ['2. Tipo: escribe Gasto o Ingreso.'],
      ['3. Fecha: formato AAAA-MM-DD (ej. 2026-08-01).'],
      ['4. Departamento: debe coincidir exactamente con uno existente en el sistema.'],
      ['5. Razón Social y Centro de Costo son OPCIONALES, pero si escribes un Centro de Costo debe existir.'],
      ['6. Moneda: USD o Bs.'],
      ['7. Monto y Tasa de cambio: números positivos. La tasa es "Bs por 1 USD".'],
      ['8. Concepto y Nº Factura son obligatorios.'],
      ['9. Elimina las filas de ejemplo antes de subir tu archivo.'],
    ])
    instrucciones['!cols'] = [{ wch: 90 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')
    XLSX.utils.book_append_sheet(wb, instrucciones, 'Instrucciones')
    XLSX.writeFile(wb, 'plantilla-importar-movimientos.xlsx')
  }

  const validadas = filas.filter((f) => f.errores.length === 0)
  const conErrores = filas.filter((f) => f.errores.length > 0)

  async function importar() {
    if (validadas.length === 0) return
    setImportando(true)
    setErrorImport(null)
    try {
      const conceptosUnicos = new Map<string, string>()
      for (const f of validadas) {
        if (f.datos) {
          const clave = `${f.datos.departamento_id}\u0000${f.datos.concepto}`
          if (!conceptosUnicos.has(clave)) conceptosUnicos.set(clave, f.datos.concepto)
        }
      }
      for (const [clave, concepto] of conceptosUnicos) {
        const deptoId = clave.split('\u0000')[0]
        await gpService.agregarConceptoDepartamento(deptoId, concepto)
      }

      const datosValidos = validadas
        .map((f) => f.datos)
        .filter((d): d is DatosMovimiento => d !== null)

      for (let i = 0; i < datosValidos.length; i += 500) {
        const lote = datosValidos.slice(i, i + 500)
        const res = await gpService.crearMovimientosMasivo(lote)
        if (res.error) throw new Error(res.error.message)
      }

      setResultado(
        `Se importaron ${datosValidos.length} movimiento${datosValidos.length !== 1 ? 's' : ''} correctamente.`,
      )
      setFilas([])
      setArchivo(null)
      if (inputRef.current) inputRef.current.value = ''
      onImportado()
    } catch (err) {
      setErrorImport(err instanceof Error ? err.message : 'Error al importar los movimientos')
    } finally {
      setImportando(false)
    }
  }

  if (!abierto) return null

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal modal-ancho importar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <div>
            <h3>Importar movimientos desde Excel</h3>
            <p className="importar-subtitulo">
              Sube un archivo .xlsx, .xls o .csv con los movimientos a registrar.
            </p>
          </div>
          <button type="button" className="btn-cerrar-modal" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>

        {errorImport && <div className="alerta error">{errorImport}</div>}
        {resultado && <div className="alerta exito">{resultado}</div>}

        <div className="importar-paso">
          <button type="button" className="btn-secundario" onClick={descargarPlantilla}>
            <IconFileTypeXls size={16} />
            Descargar plantilla
          </button>
          <p className="importar-ayuda">
            Usa la plantilla para no cometer errores: nombres de columnas, formato de fecha y nombres de
            departamentos deben coincidir.
          </p>
        </div>

        <label className="importar-archivo">
          <span className="importar-archivo-icono" aria-hidden="true">
            {archivo ? '📄' : '⬆️'}
          </span>
          <span>
            <strong>{archivo ?? 'Elige un archivo Excel'}</strong>
            <small>Se validarán las filas antes de importarlas; solo se registrarán las correctas.</small>
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => void onArchivoSeleccionado(e)}
            className="importar-input"
          />
        </label>

        {filas.length > 0 && (
          <>
            <div className="importar-resumen">
              <span className="ok">{validadas.length} válida{validadas.length !== 1 ? 's' : ''}</span>
              {conErrores.length > 0 && (
                <span className="error">
                  {conErrores.length} con error{conErrores.length !== 1 ? 'es' : ''}
                </span>
              )}
            </div>

            <div className="importar-preview">
              <table className="tabla tabla-importar">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Departamento</th>
                    <th>Centro</th>
                    <th className="td-der">Monto</th>
                    <th>Moneda</th>
                    <th>Concepto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr
                      key={f.excelFila}
                      className={f.errores.length > 0 ? 'fila-importar-error' : 'fila-importar-ok'}
                    >
                      <td>#{f.excelFila}</td>
                      <td>{String(f.celdas.tipo ?? '') || '—'}</td>
                      <td>{String(f.celdas.fecha ?? '') || '—'}</td>
                      <td>{String(f.celdas.departamento ?? '') || '—'}</td>
                      <td>
                        {String(f.celdas.centro_costo ?? '') ||
                          String(f.celdas.razon_social ?? '') ||
                          '—'}
                      </td>
                      <td className="td-der">{String(f.celdas.monto ?? '') || '—'}</td>
                      <td>{String(f.celdas.moneda ?? '') || '—'}</td>
                      <td>{String(f.celdas.concepto ?? '') || '—'}</td>
                      <td>
                        {f.errores.length === 0 ? (
                          <span className="importar-badge ok" title="Lista para importar">
                            ✓
                          </span>
                        ) : (
                          <span className="importar-badge error" title={f.errores.join(' · ')}>
                            {f.errores.length}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {conErrores.length > 0 && (
              <ul className="importar-lista-errores">
                {conErrores.slice(0, 20).map((f) => (
                  <li key={f.excelFila}>
                    <strong>Fila {f.excelFila}:</strong> {f.errores.join(' · ')}
                  </li>
                ))}
                {conErrores.length > 20 && (
                  <li>… y {conErrores.length - 20} filas más con errores</li>
                )}
              </ul>
            )}
          </>
        )}

        <div className="modal-acciones">
          <button type="button" className="btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primario"
            onClick={() => void importar()}
            disabled={validadas.length === 0 || importando}
          >
            {importando
              ? 'Importando…'
              : `Importar ${validadas.length} ${validadas.length === 1 ? 'movimiento' : 'movimientos'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

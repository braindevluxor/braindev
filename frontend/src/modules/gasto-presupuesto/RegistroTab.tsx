import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { Moneda, Movimiento, TipoMovimiento } from '../../types'
import { gpService, type DatosMovimiento } from './services'
import { formatoBs, formatoFecha, formatoUsd } from './utils'
import { useContextoGastoPresupuesto } from './contexto'
import Cargando from '../../components/Cargando'

const TIPOS: { valor: TipoMovimiento; etiqueta: string }[] = [
  { valor: 'gasto', etiqueta: 'Gasto' },
  { valor: 'ingreso', etiqueta: 'Ingreso' },
]

const MONEDAS: { valor: Moneda; etiqueta: string }[] = [
  { valor: 'USD', etiqueta: 'USD' },
  { valor: 'VES', etiqueta: 'Bs' },
]

type Vista = 'historial' | 'registrar'

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function RegistroTab() {
  const { perfil } = useAuth()
  const { departamentos } = useContextoGastoPresupuesto()

  const [vista, setVista] = useState<Vista>('historial')

  const [tipo, setTipo] = useState<TipoMovimiento>('gasto')
  const [fecha, setFecha] = useState(hoyISO())
  const [departamentoId, setDepartamentoId] = useState('')
  const [concepto, setConcepto] = useState('')
  const [factura, setFactura] = useState('')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState<Moneda>('USD')
  const [tasa, setTasa] = useState('')

  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [directorio, setDirectorio] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [editando, setEditando] = useState<Movimiento | null>(null)
  const [exitoForm, setExitoForm] = useState<string | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [tamanoPagina, setTamanoPagina] = useState(100)
  const [busqueda, setBusqueda] = useState('')

  const montoRef = useRef<HTMLInputElement>(null)

  const departamentosPorId = useMemo(
    () => new Map(departamentos.map((d) => [d.id, d])),
    [departamentos],
  )

  const cargar = useCallback(async () => {
    setCargando(true)
    const [resMov, resDir] = await Promise.all([
      gpService.listarMovimientos(),
      gpService.listarDirectorio(),
    ])
    if (resMov.error) {
      setError(resMov.error.message)
      setMovimientos([])
    } else {
      setMovimientos(resMov.data ?? [])
    }
    if (resDir.error) {
      setDirectorio({})
    } else {
      setDirectorio(resDir.data ?? {})
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const esAdmin = perfil?.role === 'admin'

  const montoNumero = Number.parseFloat(monto)
  const tasaNumero = Number.parseFloat(tasa)

  const conversion = useMemo(() => {
    if (!Number.isFinite(montoNumero) || !Number.isFinite(tasaNumero) || tasaNumero <= 0) {
      return null
    }
    if (moneda === 'USD') {
      return { usd: montoNumero, bs: montoNumero * tasaNumero }
    }
    return { usd: montoNumero / tasaNumero, bs: montoNumero }
  }, [montoNumero, tasaNumero, moneda])

  function limpiarForm() {
    setTipo('gasto')
    setFecha(hoyISO())
    setDepartamentoId('')
    setConcepto('')
    setFactura('')
    setMonto('')
    setMoneda('USD')
    setTasa('')
    setEditando(null)
    setExitoForm(null)
    setError(null)
  }

  function mostrarAviso(msg: string) {
    setAviso(msg)
    window.setTimeout(() => setAviso(null), 3000)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!departamentoId) return setError('Selecciona un departamento')
    if (!concepto.trim()) return setError('Escribe el concepto')
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      return setError('Ingresa un monto válido mayor a 0')
    }
    if (!Number.isFinite(tasaNumero) || tasaNumero <= 0) {
      return setError('Ingresa una tasa de cambio mayor a 0')
    }

    const datos: DatosMovimiento = {
      tipo,
      departamento_id: departamentoId,
      concepto: concepto.trim(),
      numero_factura: factura.trim(),
      fecha,
      moneda,
      monto: montoNumero,
      tasa_cambio: tasaNumero,
    }

    setEnviando(true)
    const res = editando
      ? await gpService.actualizarMovimiento(editando.id, datos)
      : await gpService.crearMovimiento(datos)
    setEnviando(false)

    if (res.error) {
      setError(res.error.message)
      return
    }

    if (editando) {
      mostrarAviso('Movimiento actualizado')
      setVista('historial')
      limpiarForm()
    } else {
      setExitoForm('Movimiento registrado correctamente')
      setMonto('')
      setTasa('')
      setError(null)
      montoRef.current?.focus()
    }
    void cargar()
  }

  function iniciarEdicion(m: Movimiento) {
    setEditando(m)
    setTipo(m.tipo)
    setFecha(m.fecha)
    setDepartamentoId(m.departamento_id)
    setConcepto(m.concepto)
    setFactura(m.numero_factura)
    setMonto(String(m.monto))
    setMoneda(m.moneda)
    setTasa(String(m.tasa_cambio))
    setError(null)
    setExitoForm(null)
    setVista('registrar')
  }

  function abrirNuevo() {
    limpiarForm()
    setVista('registrar')
  }

  async function eliminar(m: Movimiento) {
    const ok = window.confirm(`¿Eliminar este movimiento?\n${m.concepto} — ${formatoUsd(m.monto_usd)}`)
    if (!ok) return
    const res = await gpService.eliminarMovimiento(m.id)
    if (res.error) {
      setError(res.error.message)
      return
    }
    mostrarAviso('Movimiento eliminado')
    void cargar()
  }

  const puedeEditar = (m: Movimiento) => esAdmin || m.registrado_por === perfil?.id

  const movimientosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return movimientos
    
    const termino = busqueda.toLowerCase()
    return movimientos.filter((m) => {
      const dep = departamentosPorId.get(m.departamento_id)
      return (
        m.concepto.toLowerCase().includes(termino) ||
        m.numero_factura.toLowerCase().includes(termino) ||
        m.tipo.toLowerCase().includes(termino) ||
        dep?.nombre.toLowerCase().includes(termino) ||
        directorio[m.registrado_por]?.toLowerCase().includes(termino)
      )
    })
  }, [movimientos, busqueda, departamentosPorId, directorio])

  const totalPaginas = Math.ceil(movimientosFiltrados.length / tamanoPagina)
  const indiceInicio = (paginaActual - 1) * tamanoPagina
  const indiceFin = indiceInicio + tamanoPagina
  const movimientosPagina = movimientosFiltrados.slice(indiceInicio, indiceFin)

  function cambiarPagina(nuevaPagina: number) {
    setPaginaActual(nuevaPagina)
  }

  function cambiarTamanoPagina(nuevoTamano: number) {
    setTamanoPagina(nuevoTamano)
    setPaginaActual(1)
  }

  if (vista === 'registrar') {
    return (
      <div className="pestana-contenido">
        <div className="form-tarjeta registro-gasto">
          <div className="form-tarjeta-titulo">
            <div>
              <h3>{editando ? 'Editar movimiento' : 'Registrar gasto o ingreso'}</h3>
              <p>Completa los datos del movimiento y presiona el botón para guardarlo.</p>
            </div>
            <button type="button" className="btn-secundario" onClick={() => { setVista('historial'); limpiarForm() }}>
              ← Volver al historial
            </button>
          </div>

          {exitoForm && <div className="alerta exito">{exitoForm}</div>}

          <form onSubmit={onSubmit} className="login-form" noValidate>
            <div className="form-grid">
              <label className="campo">
                <span>Tipo</span>
                <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimiento)}>
                  {TIPOS.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.etiqueta}
                    </option>
                  ))}
                </select>
              </label>

              <label className="campo">
                <span>Fecha</span>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </label>

              <label className="campo">
                <span>Departamento</span>
                <select
                  value={departamentoId}
                  onChange={(e) => setDepartamentoId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar…</option>
                  {departamentos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="campo">
                <span>Moneda</span>
                <select value={moneda} onChange={(e) => setMoneda(e.target.value as Moneda)}>
                  {MONEDAS.map((m) => (
                    <option key={m.valor} value={m.valor}>
                      {m.etiqueta}
                    </option>
                  ))}
                </select>
              </label>

              <label className="campo">
                <span>Monto</span>
                <input
                  ref={montoRef}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>

              <label className="campo">
                <span>Tasa de cambio (Bs por USD)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.0001"
                  min="0.0001"
                  value={tasa}
                  onChange={(e) => setTasa(e.target.value)}
                  placeholder="Ej. 36.50"
                  required
                />
              </label>

              <label className="campo">
                <span>Concepto</span>
                <input
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Descripción breve"
                  required
                />
              </label>

              <label className="campo">
                <span>Nº de factura</span>
                <input
                  value={factura}
                  onChange={(e) => setFactura(e.target.value)}
                  placeholder="Opcional"
                />
              </label>
            </div>

            {conversion && (
              <div className="resumen-conversion">
                <div>
                  <small>Valor en USD (primario)</small>
                  <strong>{formatoUsd(conversion.usd)}</strong>
                </div>
                <div>
                  <small>Conversión a Bs (secundario)</small>
                  <strong>{formatoBs(conversion.bs)}</strong>
                </div>
              </div>
            )}

            {error && <div className="alerta error">{error}</div>}

            <div className="form-acciones">
              <button
                type="button"
                className="btn-secundario"
                onClick={() => { setVista('historial'); limpiarForm() }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primario" disabled={enviando}>
                {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar y continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="pestana-contenido">
      <div className="tarjeta-herramienta">
        <div>
          <h3>Movimientos</h3>
          <p>Historial de gastos e ingresos registrados.</p>
        </div>
        <button type="button" className="btn-primario" onClick={abrirNuevo}>
          + Registrar movimiento
        </button>
      </div>

      {aviso && <div className="alerta exito">{aviso}</div>}
      {error && <div className="alerta error">{error}</div>}

      <div className="busqueda-contenedor">
        <input
          type="text"
          className="busqueda-input"
          placeholder="Buscar por concepto, factura, departamento, tipo..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setPaginaActual(1)
          }}
        />
        {busqueda && (
          <span className="busqueda-resultado">
            {movimientosFiltrados.length} resultado{movimientosFiltrados.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="tabla-contenedor">
        {cargando ? (
          <Cargando mensaje="Cargando movimientos…" />
        ) : movimientosFiltrados.length === 0 ? (
          <p className="vacio">
            {busqueda
              ? 'No se encontraron movimientos con ese criterio de búsqueda.'
              : 'Aún no hay movimientos registrados.'}
          </p>
        ) : (
          <>
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Departamento</th>
                  <th>Concepto</th>
                  <th>Factura</th>
                  <th>Registrado</th>
                  <th className="td-der">Monto (USD)</th>
                  <th className="td-der">Bs</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movimientosPagina.map((m) => {
                  const dep = departamentosPorId.get(m.departamento_id)
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
                      <td>{m.numero_factura || '—'}</td>
                      <td>{directorio[m.registrado_por] ?? 'Usuario'}</td>
                      <td className="td-der">
                        <strong>{formatoUsd(m.monto_usd)}</strong>
                      </td>
                      <td className="td-der td-secundario">{formatoBs(m.monto_bs)}</td>
                      <td className="acciones">
                        {puedeEditar(m) && (
                          <button type="button" className="btn-enlace" onClick={() => iniciarEdicion(m)}>
                            Editar
                          </button>
                        )}
                        {puedeEditar(m) && (
                          <button
                            type="button"
                            className="btn-enlace peligro"
                            onClick={() => void eliminar(m)}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="paginacion">
              <div className="paginacion-info">
                <span>
                  Mostrando {indiceInicio + 1} - {Math.min(indiceFin, movimientosFiltrados.length)} de{' '}
                  {movimientosFiltrados.length} registros
                </span>
                <label className="paginacion-tamano">
                  <span>Registros por página:</span>
                  <select
                    value={tamanoPagina}
                    onChange={(e) => cambiarTamanoPagina(Number(e.target.value))}
                  >
                    <option value={100}>100</option>
                    <option value={300}>300</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                </label>
              </div>
              <div className="paginacion-controles">
                <button
                  type="button"
                  className="btn-secundario btn-sm"
                  onClick={() => cambiarPagina(1)}
                  disabled={paginaActual === 1}
                >
                  « Primera
                </button>
                <button
                  type="button"
                  className="btn-secundario btn-sm"
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                >
                  ← Anterior
                </button>
                <span className="paginacion-pagina">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  type="button"
                  className="btn-secundario btn-sm"
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente →
                </button>
                <button
                  type="button"
                  className="btn-secundario btn-sm"
                  onClick={() => cambiarPagina(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                >
                  Última »
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { Departamento, Moneda, Movimiento, TipoMovimiento } from '../../types'
import { gpService, type DatosMovimiento } from './services'
import { formatoBs, formatoFecha, formatoUsd } from './utils'

interface Props {
  departamentos: Departamento[]
}

const TIPOS: { valor: TipoMovimiento; etiqueta: string }[] = [
  { valor: 'gasto', etiqueta: 'Gasto' },
  { valor: 'ingreso', etiqueta: 'Ingreso' },
]

const MONEDAS: { valor: Moneda; etiqueta: string }[] = [
  { valor: 'USD', etiqueta: 'USD' },
  { valor: 'VES', etiqueta: 'Bs' },
]

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function RegistroTab({ departamentos }: Props) {
  const { perfil } = useAuth()

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
  const [formAbierto, setFormAbierto] = useState(false)

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

  useEffect(() => {
    function onTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') cerrarForm()
    }
    document.addEventListener('keydown', onTecla)
    return () => document.removeEventListener('keydown', onTecla)
  }, [formAbierto])

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
    mostrarAviso(editando ? 'Movimiento actualizado' : 'Movimiento registrado correctamente')
    cerrarForm()
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
    setFormAbierto(true)
  }

  function abrirNuevo() {
    limpiarForm()
    setError(null)
    setFormAbierto(true)
  }

  function cerrarForm() {
    setFormAbierto(false)
    limpiarForm()
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

      <div className="tabla-contenedor">
        {cargando ? (
          <p className="vacio">Cargando movimientos…</p>
        ) : movimientos.length === 0 ? (
          <p className="vacio">Aún no hay movimientos registrados.</p>
        ) : (
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
              {movimientos.map((m) => {
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
        )}
      </div>

      {formAbierto && (
        <div className="modal-fondo" onClick={cerrarForm}>
          <div className="modal modal-ancho" onClick={(e) => e.stopPropagation()}>
            <h3>{editando ? 'Editar movimiento' : 'Registrar gasto o ingreso'}</h3>

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

                <div className="campo campo-fijo">
                  <span>Registrado por (no modificable)</span>
                  <div className="campo-solo-lectura">
                    {perfil?.full_name?.trim() || perfil?.email || '—'}
                  </div>
                </div>
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

              <div className="modal-acciones">
                <button type="button" className="btn-secundario" onClick={cerrarForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primario" disabled={enviando}>
                  {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

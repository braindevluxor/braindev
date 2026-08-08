import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { Departamento, Presupuesto } from '../../types'
import { gpService } from './services'
import { anioMesActual, nombreMes, parsearAnioMes, formatoUsd } from './utils'
import { useContextoGastoPresupuesto } from './contexto'

function anioMesValor(): string {
  const { anio, mes } = anioMesActual()
  return `${anio}-${String(mes).padStart(2, '0')}`
}

export default function PresupuestosTab() {
  const { perfil } = useAuth()
  const { departamentos, recargarDepartamentos } = useContextoGastoPresupuesto()
  const esAdmin = perfil?.role === 'admin'

  const [periodo, setPeriodo] = useState(anioMesValor())
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
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

  useEffect(() => {
    void cargar()
  }, [cargar])

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

  return (
    <div className="pestana-contenido">
      <div className="form-tarjeta">
        <div className="form-tarjeta-titulo">
          <h3>Presupuesto mensual por departamento</h3>
        </div>

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

        {error && <div className="alerta error">{error}</div>}
        {aviso && <div className="alerta exito">{aviso}</div>}

        <div className="tabla-contenedor">
          {cargando ? (
            <p className="vacio">Cargando…</p>
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

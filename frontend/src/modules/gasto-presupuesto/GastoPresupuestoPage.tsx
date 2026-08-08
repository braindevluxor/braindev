import { useCallback, useEffect, useState } from 'react'
import type { Departamento } from '../../types'
import { gpService } from './services'
import RegistroTab from './RegistroTab'
import PresupuestosTab from './PresupuestosTab'
import ReportesTab from './ReportesTab'

type Pestana = 'registro' | 'presupuestos' | 'reportes'

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: 'registro', etiqueta: 'Registro' },
  { id: 'presupuestos', etiqueta: 'Presupuestos' },
  { id: 'reportes', etiqueta: 'Reportes' },
]

export default function GastoPresupuestoPage() {
  const [pestana, setPestana] = useState<Pestana>('registro')
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDepartamentos = useCallback(async () => {
    const res = await gpService.listarDepartamentos()
    if (res.error) {
      setError(res.error.message)
      setDepartamentos([])
    } else {
      setError(null)
      setDepartamentos(res.data ?? [])
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    void cargarDepartamentos()
  }, [cargarDepartamentos])

  return (
    <div className="modulo-contenido">
      {error && <div className="alerta error">{error}</div>}

      <nav className="pestanas" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            className={`pestana ${pestana === p.id ? 'activa' : ''}`}
            onClick={() => setPestana(p.id)}
          >
            {p.etiqueta}
          </button>
        ))}
      </nav>

      {cargando ? (
        <p className="vacio">Cargando módulo…</p>
      ) : (
        <>
          {pestana === 'registro' && <RegistroTab departamentos={departamentos} />}
          {pestana === 'presupuestos' && (
            <PresupuestosTab
              departamentos={departamentos}
              onCambioDepartamentos={() => void cargarDepartamentos()}
            />
          )}
          {pestana === 'reportes' && <ReportesTab departamentos={departamentos} />}
        </>
      )}
    </div>
  )
}

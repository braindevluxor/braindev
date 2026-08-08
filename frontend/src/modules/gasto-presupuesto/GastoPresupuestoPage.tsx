import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Departamento } from '../../types'
import { gpService } from './services'
import RegistroTab from './RegistroTab'
import PresupuestosTab from './PresupuestosTab'
import ReportesTab from './ReportesTab'

type Pestana = 'registro' | 'presupuestos' | 'reportes'

function IconoRegistro() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconoPresupuestos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

function IconoReportes() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17v-6" strokeLinecap="round" />
      <path d="M12 17V8" strokeLinecap="round" />
      <path d="M17 17v-4" strokeLinecap="round" />
    </svg>
  )
}

const PESTANAS: { id: Pestana; etiqueta: string; icono: ReactNode }[] = [
  { id: 'registro', etiqueta: 'Registro', icono: <IconoRegistro /> },
  { id: 'presupuestos', etiqueta: 'Presupuestos', icono: <IconoPresupuestos /> },
  { id: 'reportes', etiqueta: 'Reportes', icono: <IconoReportes /> },
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

      <nav className="nav-pestanas" role="tablist" aria-label="Secciones del módulo">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            title={p.etiqueta}
            className={`nav-pestana ${pestana === p.id ? 'activa' : ''}`}
            onClick={() => setPestana(p.id)}
          >
            <span className="nav-pestana-icono">{p.icono}</span>
            <span className="nav-pestana-texto">{p.etiqueta}</span>
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

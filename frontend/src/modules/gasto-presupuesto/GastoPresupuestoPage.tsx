import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import type { Departamento } from '../../types'
import { gpService } from './services'
import Cargando from '../../components/Cargando'

export default function GastoPresupuestoPage() {
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

      {cargando ? (
        <Cargando mensaje="Cargando módulo…" />
      ) : (
        <Outlet context={{ departamentos, recargarDepartamentos: cargarDepartamentos }} />
      )}
    </div>
  )
}

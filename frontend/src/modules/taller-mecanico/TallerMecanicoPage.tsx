import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import type { Vehiculo } from '../../types'
import { tallerService } from './services'
import Cargando from '../../components/Cargando'

export default function TallerMecanicoPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [directorio, setDirectorio] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarVehiculos = useCallback(async () => {
    const res = await tallerService.listarVehiculos()
    if (res.error) {
      setError(res.error.message)
      setVehiculos([])
    } else {
      setError(null)
      setVehiculos(res.data ?? [])
    }
  }, [])

  const cargarDirectorio = useCallback(async () => {
    const res = await tallerService.listarDirectorio()
    if (!res.error && res.data) {
      setDirectorio(res.data)
    }
  }, [])

  useEffect(() => {
    async function inicializar() {
      await Promise.all([cargarVehiculos(), cargarDirectorio()])
      setCargando(false)
    }
    void inicializar()
  }, [cargarVehiculos, cargarDirectorio])

  return (
    <div className="modulo-contenido">
      {error && <div className="alerta error">{error}</div>}

      {cargando ? (
        <Cargando mensaje="Cargando módulo…" />
      ) : (
        <Outlet
          context={{
            vehiculos,
            recargarVehiculos: cargarVehiculos,
            directorio,
            recargarDirectorio: cargarDirectorio,
          }}
        />
      )}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import type { Reunion } from '../../types'
import { minutasService } from './services'
import Cargando from '../../components/Cargando'

export default function MinutasPage() {
  const [reuniones, setReuniones] = useState<Reunion[]>([])
  const [directorio, setDirectorio] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarReuniones = useCallback(async () => {
    const res = await minutasService.listarReuniones()
    if (res.error) {
      setError(res.error.message)
      setReuniones([])
    } else {
      setError(null)
      setReuniones(res.data ?? [])
    }
  }, [])

  const cargarDirectorio = useCallback(async () => {
    const res = await minutasService.listarDirectorio()
    if (!res.error && res.data) {
      setDirectorio(res.data)
    }
  }, [])

  useEffect(() => {
    async function inicializar() {
      await Promise.all([cargarReuniones(), cargarDirectorio()])
      setCargando(false)
    }
    void inicializar()
  }, [cargarReuniones, cargarDirectorio])

  return (
    <div className="modulo-contenido">
      {error && <div className="alerta error">{error}</div>}

      {cargando ? (
        <Cargando mensaje="Cargando módulo…" />
      ) : (
        <Outlet
          context={{
            reuniones,
            recargarReuniones: cargarReuniones,
            directorio,
            recargarDirectorio: cargarDirectorio,
          }}
        />
      )}
    </div>
  )
}

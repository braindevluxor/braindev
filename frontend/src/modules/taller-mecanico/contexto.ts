import { useOutletContext } from 'react-router-dom'
import type { Vehiculo } from '../../types'

export interface ContextoTaller {
  vehiculos: Vehiculo[]
  recargarVehiculos: () => Promise<void>
  directorio: Record<string, string>
  recargarDirectorio: () => Promise<void>
}

export function useContextoTaller(): ContextoTaller {
  return useOutletContext<ContextoTaller>()
}

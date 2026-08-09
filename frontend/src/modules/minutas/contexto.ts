import { useOutletContext } from 'react-router-dom'
import type { Reunion } from '../../types'

export interface ContextoMinutas {
  reuniones: Reunion[]
  recargarReuniones: () => Promise<void>
  directorio: Record<string, string>
  recargarDirectorio: () => Promise<void>
}

export function useContextoMinutas(): ContextoMinutas {
  return useOutletContext<ContextoMinutas>()
}

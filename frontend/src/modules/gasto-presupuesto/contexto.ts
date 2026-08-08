import { useOutletContext } from 'react-router-dom'
import type { Departamento } from '../../types'

export interface ContextoGastoPresupuesto {
  departamentos: Departamento[]
  recargarDepartamentos: () => void
}

export function useContextoGastoPresupuesto(): ContextoGastoPresupuesto {
  return useOutletContext<ContextoGastoPresupuesto>()
}

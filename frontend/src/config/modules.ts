import type { ModuloConfig } from '../types'

/**
 * Registro central de módulos del sistema.
 *
 * Cada módulo tiene su propio color plano. Al activarse un módulo,
 * su paleta se propaga al shell completo mediante variables CSS
 * (--mod-color, --mod-color-dark, --mod-color-soft, --mod-color-contrast).
 *
 * Para añadir un módulo nuevo:
 *   1. Crear la página en src/modules/<id>/
 *   2. Agregar una ruta en src/App.tsx
 *   3. Registrar el módulo aquí con su paleta de colores planos.
 */
export const MODULOS: ModuloConfig[] = [
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    descripcion: 'Gestión de cuentas, roles y estado de los usuarios del sistema.',
    ruta: '/usuarios',
    habilitado: true,
    color: {
      principal: '#2563EB',
      oscuro: '#1E40AF',
      suave: '#EFF6FF',
      contraste: '#FFFFFF',
    },
  },
  {
    id: 'gasto-presupuesto',
    nombre: 'Gasto vs Presupuesto',
    descripcion: 'Registro de gastos e ingresos en USD/Bs y comparación contra presupuesto.',
    ruta: '/gasto-presupuesto',
    habilitado: true,
    color: {
      principal: '#0891B2',
      oscuro: '#0E7490',
      suave: '#ECFEFF',
      contraste: '#FFFFFF',
    },
  },
]

export const MODULOS_HABILITADOS = MODULOS.filter((m) => m.habilitado)

export function obtenerModuloPorRuta(ruta: string): ModuloConfig | undefined {
  return MODULOS.find((m) => m.ruta === ruta)
}

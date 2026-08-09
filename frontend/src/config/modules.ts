import {
  IconoCentrosCosto,
  IconoPresupuestos,
  IconoRegistro,
  IconoRequisiciones,
  IconoReportes,
  IconoUsuarios,
  IconoVehiculos,
} from '../components/pestanaIconos'
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
    descripcion: 'Gestión de cuentas, roles y permisos de los usuarios del sistema.',
    ruta: '/usuarios',
    habilitado: true,
    pestanas: [
      { id: 'lista', etiqueta: 'Usuarios', ruta: '/usuarios', icono: IconoUsuarios },
    ],
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
    pestanas: [
      { id: 'registro', etiqueta: 'Registro', ruta: '/gasto-presupuesto/registro', icono: IconoRegistro },
      {
        id: 'presupuestos',
        etiqueta: 'Presupuestos',
        ruta: '/gasto-presupuesto/presupuestos',
        icono: IconoPresupuestos,
      },
      { id: 'reportes', etiqueta: 'Reportes', ruta: '/gasto-presupuesto/reportes', icono: IconoReportes },
      {
        id: 'centros-costo',
        etiqueta: 'Centros de Costo',
        ruta: '/gasto-presupuesto/centros-costo',
        icono: IconoCentrosCosto,
      },
    ],
    color: {
      principal: '#0891B2',
      oscuro: '#0E7490',
      suave: '#ECFEFF',
      contraste: '#FFFFFF',
    },
  },
  {
    id: 'taller-mecanico',
    nombre: 'Taller Mecánico',
    descripcion: 'Gestión de la flota de vehículos y requisiciones de mantenimiento.',
    ruta: '/taller-mecanico',
    habilitado: true,
    pestanas: [
      {
        id: 'vehiculos',
        etiqueta: 'Vehículos',
        ruta: '/taller-mecanico/vehiculos',
        icono: IconoVehiculos,
      },
      {
        id: 'requisiciones',
        etiqueta: 'Requisiciones',
        ruta: '/taller-mecanico/requisiciones',
        icono: IconoRequisiciones,
      },
    ],
    color: {
      principal: '#7C3AED',
      oscuro: '#6D28D9',
      suave: '#F5F3FF',
      contraste: '#FFFFFF',
    },
  },
]

export const MODULOS_HABILITADOS = MODULOS.filter((m) => m.habilitado)

export function obtenerModuloPorRuta(ruta: string): ModuloConfig | undefined {
  return MODULOS.find(
    (m) => ruta === m.ruta || ruta.startsWith(`${m.ruta}/`) || m.pestanas.some((p) => p.ruta === ruta),
  )
}

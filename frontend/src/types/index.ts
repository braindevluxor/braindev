import type { ComponentType, SVGProps } from 'react'

export type Rol = 'admin' | 'usuario'

export interface Perfil {
  id: string
  email: string
  full_name: string
  role: Rol
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PaletaColor {
  /** Color plano principal del módulo */
  principal: string
  /** Variante oscura para hover / texto */
  oscuro: string
  /** Fondo suave para acentos */
  suave: string
  /** Color de texto/iconos sobre `principal` */
  contraste: string
}

export interface PestanaConfig {
  id: string
  etiqueta: string
  ruta: string
  icono: ComponentType<SVGProps<SVGSVGElement>>
}

export interface ModuloConfig {
  id: string
  nombre: string
  descripcion: string
  ruta: string
  habilitado: boolean
  color: PaletaColor
  pestanas: PestanaConfig[]
}

export interface RespuestaBackend<T> {
  data: T | null
  error: { message: string } | null
}

export type TipoMovimiento = 'gasto' | 'ingreso'
export type Moneda = 'USD' | 'VES'

export interface Departamento {
  id: string
  nombre: string
  created_at: string
}

export interface Movimiento {
  id: string
  tipo: TipoMovimiento
  departamento_id: string
  concepto: string
  numero_factura: string
  fecha: string
  moneda: Moneda
  monto: number
  tasa_cambio: number
  monto_usd: number
  monto_bs: number
  registrado_por: string
  created_at: string
}

export interface Presupuesto {
  id: string
  departamento_id: string
  anio: number
  mes: number
  monto_usd: number
  created_at: string
}

export interface FilaReporte {
  departamento_id: string
  departamento_nombre: string
  presupuesto: number
  gasto: number
  ingreso: number
  diferencia: number
  porcentaje: number | null
}

// Sistema de permisos granulares
export interface Modulo {
  id: string
  nombre: string
  descripcion: string
  ruta: string
  habilitado: boolean
  created_at: string
}

export interface Herramienta {
  id: string
  modulo_id: string
  nombre: string
  ruta: string
  orden: number
  created_at: string
}

export interface PermisosUsuario {
  id: string
  usuario_id: string
  modulo_id: string
  herramienta_id: string
  puede_crear: boolean
  puede_leer: boolean
  puede_actualizar: boolean
  puede_eliminar: boolean
  created_at: string
  updated_at: string
}

export interface PermisosPorHerramienta {
  herramienta_id: string
  puede_crear: boolean
  puede_leer: boolean
  puede_actualizar: boolean
  puede_eliminar: boolean
}

export interface PermisosUsuarioMap {
  [herramienta_id: string]: PermisosPorHerramienta
}

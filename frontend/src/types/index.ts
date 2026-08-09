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

export interface RazonSocial {
  id: string
  nombre: string
  rif?: string
  direccion?: string
  telefono?: string
  email?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CentroCosto {
  id: string
  razon_social_id: string
  nombre: string
  descripcion?: string
  activo: boolean
  created_at: string
  updated_at: string
  razon_social?: RazonSocial
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
  centro_costo_id?: string
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

// Módulo Taller Mecánico
export type TipoVehiculo = 'camioneta' | 'sedan' | 'camion' | 'furgoneta' | 'motocicleta' | 'otro'

export type TipoRequisicion = 'revision' | 'reparacion' | 'otro'
export type PrioridadRequisicion = 'baja' | 'media' | 'alta'
export type EstadoRequisicion = 'pendiente' | 'en_proceso' | 'completado' | 'cancelado'

export interface Vehiculo {
  id: string
  placa: string
  marca: string
  modelo: string
  anio?: number
  color?: string
  tipo?: TipoVehiculo
  capacidad?: string
  serial_motor?: string
  serial_carroceria?: string
  observaciones?: string
  activo: boolean
  registrado_por: string
  created_at: string
  updated_at: string
}

export interface Requisicion {
  id: string
  vehiculo_id: string
  tipo: TipoRequisicion
  prioridad?: PrioridadRequisicion
  descripcion: string
  estado: EstadoRequisicion
  fecha_solicitud: string
  fecha_estimada?: string
  registrado_por: string
  created_at: string
  updated_at: string
  vehiculo?: Vehiculo
}

// Módulo Minutas
export interface Reunion {
  id: string
  titulo: string
  fecha: string
  lugar?: string
  participantes: string[]
  observaciones?: string
  registrado_por: string
  created_at: string
  updated_at: string
  compromisos?: Compromiso[]
}

export interface Compromiso {
  id: string
  reunion_id: string
  descripcion: string
  responsable: string
  fecha_tope: string
  completado: boolean
  registrado_por: string
  created_at: string
  updated_at: string
}

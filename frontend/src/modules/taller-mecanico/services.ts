import { supabase } from '../../lib/supabase'
import type {
  EstadoRequisicion,
  PrioridadRequisicion,
  Requisicion,
  RespuestaBackend,
  TipoRequisicion,
  TipoVehiculo,
  Vehiculo,
} from '../../types'

export interface DatosVehiculo {
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
}

export interface DatosRequisicion {
  vehiculo_id: string
  tipo: TipoRequisicion
  prioridad?: PrioridadRequisicion
  descripcion: string
  fecha_solicitud: string
  fecha_estimada?: string
}

function num(valor: unknown): number | undefined {
  const n = Number(valor)
  return Number.isFinite(n) ? n : undefined
}

function mapearVehiculo(fila: Record<string, unknown>): Vehiculo {
  return {
    id: fila.id as string,
    placa: (fila.placa as string) ?? '',
    marca: (fila.marca as string) ?? '',
    modelo: (fila.modelo as string) ?? '',
    anio: num(fila.anio),
    color: fila.color as string | undefined,
    tipo: fila.tipo as TipoVehiculo | undefined,
    capacidad: fila.capacidad as string | undefined,
    serial_motor: fila.serial_motor as string | undefined,
    serial_carroceria: fila.serial_carroceria as string | undefined,
    observaciones: fila.observaciones as string | undefined,
    activo: (fila.activo as boolean) ?? true,
    registrado_por: (fila.registrado_por as string) ?? '',
    created_at: fila.created_at as string,
    updated_at: fila.updated_at as string,
  }
}

function mapearRequisicion(fila: Record<string, unknown>): Requisicion {
  const requisicion: Requisicion = {
    id: fila.id as string,
    vehiculo_id: fila.vehiculo_id as string,
    tipo: fila.tipo as TipoRequisicion,
    prioridad: fila.prioridad as PrioridadRequisicion | undefined,
    descripcion: (fila.descripcion as string) ?? '',
    estado: (fila.estado as EstadoRequisicion) ?? 'pendiente',
    fecha_solicitud: (fila.fecha_solicitud as string) ?? '',
    fecha_estimada: fila.fecha_estimada as string | undefined,
    registrado_por: (fila.registrado_por as string) ?? '',
    created_at: fila.created_at as string,
    updated_at: fila.updated_at as string,
  }
  if (fila.vehiculos) {
    requisicion.vehiculo = mapearVehiculo(fila.vehiculos as Record<string, unknown>)
  }
  return requisicion
}

export const tallerService = {
  // Vehículos
  async listarVehiculos(): Promise<RespuestaBackend<Vehiculo[]>> {
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .order('placa', { ascending: true })
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearVehiculo),
      error: null,
    }
  },

  async listarVehiculosActivos(): Promise<RespuestaBackend<Vehiculo[]>> {
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .eq('activo', true)
      .order('placa', { ascending: true })
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearVehiculo),
      error: null,
    }
  },

  async crearVehiculo(datos: DatosVehiculo): Promise<RespuestaBackend<Vehiculo>> {
    const { data, error } = await supabase.from('vehiculos').insert(datos).select().single()
    if (error) return { data: null, error: { message: error.message } }
    return { data: mapearVehiculo(data as Record<string, unknown>), error: null }
  },

  async actualizarVehiculo(
    id: string,
    datos: Partial<DatosVehiculo> & { activo?: boolean },
  ): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('vehiculos').update(datos).eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  /** Baja lógica: marca el vehículo como inactivo conservando su historial. */
  async eliminarVehiculo(id: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('vehiculos').update({ activo: false }).eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  // Requisiciones
  async listarRequisiciones(): Promise<RespuestaBackend<Requisicion[]>> {
    const { data, error } = await supabase
      .from('requisiciones')
      .select('*, vehiculos(*)')
      .order('fecha_solicitud', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearRequisicion),
      error: null,
    }
  },

  async crearRequisicion(datos: DatosRequisicion): Promise<RespuestaBackend<Requisicion>> {
    const { data, error } = await supabase.from('requisiciones').insert(datos).select().single()
    if (error) return { data: null, error: { message: error.message } }
    return { data: mapearRequisicion(data as Record<string, unknown>), error: null }
  },

  async actualizarRequisicion(
    id: string,
    datos: Partial<DatosRequisicion> & { estado?: EstadoRequisicion },
  ): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('requisiciones').update(datos).eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async eliminarRequisicion(id: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('requisiciones').delete().eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  /** Directorio id → nombre visible (para mostrar quién registró). */
  async listarDirectorio(): Promise<RespuestaBackend<Record<string, string>>> {
    const { data, error } = await supabase.from('profiles').select('id, full_name, email')
    if (error) return { data: null, error: { message: error.message } }
    const mapa: Record<string, string> = {}
    for (const p of (data ?? []) as Array<{
      id: string
      full_name?: string | null
      email?: string | null
    }>) {
      mapa[p.id] = (p.full_name ?? '').trim() || p.email || 'Usuario'
    }
    return { data: mapa, error: null }
  },
}

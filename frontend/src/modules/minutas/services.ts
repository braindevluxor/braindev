import { supabase } from '../../lib/supabase'
import type { Compromiso, RespuestaBackend, Reunion } from '../../types'

export interface DatosReunion {
  titulo: string
  fecha: string
  lugar?: string
  participantes: string[]
  observaciones?: string
}

export interface DatosCompromiso {
  reunion_id: string
  descripcion: string
  responsable: string
  fecha_tope: string
}

function mapearCompromiso(fila: Record<string, unknown>): Compromiso {
  return {
    id: fila.id as string,
    reunion_id: fila.reunion_id as string,
    descripcion: (fila.descripcion as string) ?? '',
    responsable: (fila.responsable as string) ?? '',
    fecha_tope: (fila.fecha_tope as string) ?? '',
    completado: (fila.completado as boolean) ?? false,
    registrado_por: (fila.registrado_por as string) ?? '',
    created_at: fila.created_at as string,
    updated_at: fila.updated_at as string,
  }
}

function mapearReunion(fila: Record<string, unknown>): Reunion {
  const reunion: Reunion = {
    id: fila.id as string,
    titulo: (fila.titulo as string) ?? '',
    fecha: (fila.fecha as string) ?? '',
    lugar: fila.lugar as string | undefined,
    participantes: Array.isArray(fila.participantes)
      ? (fila.participantes as string[])
      : [],
    observaciones: fila.observaciones as string | undefined,
    registrado_por: (fila.registrado_por as string) ?? '',
    created_at: fila.created_at as string,
    updated_at: fila.updated_at as string,
  }
  if (Array.isArray(fila.compromisos)) {
    reunion.compromisos = (fila.compromisos as Record<string, unknown>[]).map(mapearCompromiso)
  }
  return reunion
}

export const minutasService = {
  // Reuniones
  async listarReuniones(): Promise<RespuestaBackend<Reunion[]>> {
    const { data, error } = await supabase
      .from('reuniones')
      .select('*, compromisos(*)')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearReunion),
      error: null,
    }
  },

  async crearReunion(datos: DatosReunion): Promise<RespuestaBackend<Reunion>> {
    const { data, error } = await supabase.from('reuniones').insert(datos).select().single()
    if (error) return { data: null, error: { message: error.message } }
    return { data: mapearReunion(data as Record<string, unknown>), error: null }
  },

  async actualizarReunion(id: string, datos: Partial<DatosReunion>): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('reuniones').update(datos).eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async eliminarReunion(id: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('reuniones').delete().eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  // Compromisos
  async crearCompromiso(datos: DatosCompromiso): Promise<RespuestaBackend<Compromiso>> {
    const { data, error } = await supabase.from('compromisos').insert(datos).select().single()
    if (error) return { data: null, error: { message: error.message } }
    return { data: mapearCompromiso(data as Record<string, unknown>), error: null }
  },

  async actualizarCompromiso(
    id: string,
    datos: Partial<DatosCompromiso> & { completado?: boolean },
  ): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('compromisos').update(datos).eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async eliminarCompromiso(id: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('compromisos').delete().eq('id', id)
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

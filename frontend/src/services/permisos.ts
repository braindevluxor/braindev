import { supabase } from '../lib/supabase'
import type {
  Modulo,
  Herramienta,
  PermisosUsuario,
  PermisosUsuarioMap,
  RespuestaBackend,
} from '../types'

function mapearModulo(fila: Record<string, unknown>): Modulo {
  return {
    id: fila.id as string,
    nombre: fila.nombre as string,
    descripcion: (fila.descripcion as string) ?? '',
    ruta: fila.ruta as string,
    habilitado: fila.habilitado as boolean,
    created_at: fila.created_at as string,
  }
}

function mapearHerramienta(fila: Record<string, unknown>): Herramienta {
  return {
    id: fila.id as string,
    modulo_id: fila.modulo_id as string,
    nombre: fila.nombre as string,
    ruta: fila.ruta as string,
    orden: Number(fila.orden),
    created_at: fila.created_at as string,
  }
}

function mapearPermisos(fila: Record<string, unknown>): PermisosUsuario {
  return {
    id: fila.id as string,
    usuario_id: fila.usuario_id as string,
    modulo_id: fila.modulo_id as string,
    herramienta_id: fila.herramienta_id as string,
    puede_crear: Boolean(fila.puede_crear),
    puede_leer: Boolean(fila.puede_leer),
    puede_actualizar: Boolean(fila.puede_actualizar),
    puede_eliminar: Boolean(fila.puede_eliminar),
    created_at: fila.created_at as string,
    updated_at: fila.updated_at as string,
  }
}

export const permisosService = {
  async listarModulos(): Promise<RespuestaBackend<Modulo[]>> {
    const { data, error } = await supabase
      .from('modulos')
      .select('*')
      .eq('habilitado', true)
      .order('nombre')
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearModulo),
      error: null,
    }
  },

  async listarHerramientas(): Promise<RespuestaBackend<Herramienta[]>> {
    const { data, error } = await supabase
      .from('herramientas')
      .select('*')
      .order('modulo_id')
      .order('orden')
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearHerramienta),
      error: null,
    }
  },

  async listarHerramientasPorModulo(moduloId: string): Promise<RespuestaBackend<Herramienta[]>> {
    const { data, error } = await supabase
      .from('herramientas')
      .select('*')
      .eq('modulo_id', moduloId)
      .order('orden')
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearHerramienta),
      error: null,
    }
  },

  async obtenerPermisosUsuario(usuarioId: string): Promise<RespuestaBackend<PermisosUsuarioMap>> {
    const { data, error } = await supabase
      .from('permisos_usuario')
      .select('*')
      .eq('usuario_id', usuarioId)
    if (error) return { data: null, error: { message: error.message } }
    
    const mapa: PermisosUsuarioMap = {}
    for (const fila of (data ?? []) as Record<string, unknown>[]) {
      const permiso = mapearPermisos(fila)
      mapa[permiso.herramienta_id] = {
        herramienta_id: permiso.herramienta_id,
        puede_crear: permiso.puede_crear,
        puede_leer: permiso.puede_leer,
        puede_actualizar: permiso.puede_actualizar,
        puede_eliminar: permiso.puede_eliminar,
      }
    }
    return { data: mapa, error: null }
  },

  async guardarPermisos(
    usuarioId: string,
    moduloId: string,
    herramientaId: string,
    permisos: {
      puede_crear: boolean
      puede_leer: boolean
      puede_actualizar: boolean
      puede_eliminar: boolean
    },
  ): Promise<RespuestaBackend<null>> {
    const { error } = await supabase
      .from('permisos_usuario')
      .upsert(
        {
          usuario_id: usuarioId,
          modulo_id: moduloId,
          herramienta_id: herramientaId,
          ...permisos,
        },
        { onConflict: 'usuario_id,herramienta_id' },
      )
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async eliminarPermisosHerramienta(
    usuarioId: string,
    herramientaId: string,
  ): Promise<RespuestaBackend<null>> {
    const { error } = await supabase
      .from('permisos_usuario')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('herramienta_id', herramientaId)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async eliminarPermisosUsuario(usuarioId: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase
      .from('permisos_usuario')
      .delete()
      .eq('usuario_id', usuarioId)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },
}

import { supabase } from '../../lib/supabase'
import type { Perfil, RespuestaBackend, Rol } from '../../types'

export interface DatosCrearUsuario {
  email: string
  password: string
  full_name: string
  role: Rol
}

export interface DatosActualizarUsuario {
  user_id: string
  full_name?: string
  role?: Rol
  is_active?: boolean
}

/**
 * Acceso a los datos del módulo Usuarios.
 *
 * La lectura del listado se hace por SDK (RLS permite a los admins leer
 * todos los perfiles). Las mutaciones de cuentas (crear/editar/eliminar)
 * se ejecutan mediante RPC a funciones Postgres SECURITY DEFINER que
 * verifican que el solicitante sea administrador.
 */
export const usuariosService = {
  async listar(): Promise<RespuestaBackend<Perfil[]>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) return { data: null, error: { message: error.message } }
    return { data: data as Perfil[], error: null }
  },

  async crear(datos: DatosCrearUsuario): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.rpc('crear_usuario', {
      p_email: datos.email,
      p_password: datos.password,
      p_full_name: datos.full_name,
      p_role: datos.role,
    })

    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async actualizar(
    datos: DatosActualizarUsuario,
  ): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.rpc('actualizar_usuario', {
      p_user_id: datos.user_id,
      p_full_name: datos.full_name ?? null,
      p_role: datos.role ?? null,
      p_is_active: datos.is_active ?? null,
    })

    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async eliminar(user_id: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.rpc('eliminar_usuario', {
      p_user_id: user_id,
    })

    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },
}

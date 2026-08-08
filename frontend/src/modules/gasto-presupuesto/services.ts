import { supabase } from '../../lib/supabase'
import type {
  CentroCosto,
  Departamento,
  Moneda,
  Movimiento,
  Presupuesto,
  RazonSocial,
  RespuestaBackend,
  TipoMovimiento,
} from '../../types'

export interface DatosMovimiento {
  tipo: TipoMovimiento
  departamento_id: string
  concepto: string
  numero_factura: string
  fecha: string
  moneda: Moneda
  monto: number
  tasa_cambio: number
  centro_costo_id?: string
}

export interface DatosPresupuesto {
  departamento_id: string
  anio: number
  mes: number
  monto_usd: number
}

function num(valor: unknown): number {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function mapearMovimiento(fila: Record<string, unknown>): Movimiento {
  return {
    id: fila.id as string,
    tipo: fila.tipo as TipoMovimiento,
    departamento_id: fila.departamento_id as string,
    concepto: (fila.concepto as string) ?? '',
    numero_factura: (fila.numero_factura as string) ?? '',
    fecha: fila.fecha as string,
    moneda: fila.moneda as Moneda,
    monto: num(fila.monto),
    tasa_cambio: num(fila.tasa_cambio),
    monto_usd: num(fila.monto_usd),
    monto_bs: num(fila.monto_bs),
    registrado_por: fila.registrado_por as string,
    centro_costo_id: fila.centro_costo_id as string | undefined,
    created_at: fila.created_at as string,
  }
}

function mapearRazonSocial(fila: Record<string, unknown>): RazonSocial {
  return {
    id: fila.id as string,
    nombre: fila.nombre as string,
    rif: fila.rif as string | undefined,
    direccion: fila.direccion as string | undefined,
    telefono: fila.telefono as string | undefined,
    email: fila.email as string | undefined,
    activo: fila.activo as boolean,
    created_at: fila.created_at as string,
    updated_at: fila.updated_at as string,
  }
}

function mapearCentroCosto(fila: Record<string, unknown>): CentroCosto {
  const centro: CentroCosto = {
    id: fila.id as string,
    razon_social_id: fila.razon_social_id as string,
    nombre: fila.nombre as string,
    descripcion: fila.descripcion as string | undefined,
    activo: fila.activo as boolean,
    created_at: fila.created_at as string,
    updated_at: fila.updated_at as string,
  }
  if (fila.razones_sociales) {
    centro.razon_social = mapearRazonSocial(fila.razones_sociales as Record<string, unknown>)
  }
  return centro
}

function mapearPresupuesto(fila: Record<string, unknown>): Presupuesto {
  return {
    id: fila.id as string,
    departamento_id: fila.departamento_id as string,
    anio: Number(fila.anio),
    mes: Number(fila.mes),
    monto_usd: num(fila.monto_usd),
    created_at: fila.created_at as string,
  }
}

export const gpService = {
  async listarDepartamentos(): Promise<RespuestaBackend<Departamento[]>> {
    const { data, error } = await supabase
      .from('departamentos')
      .select('*')
      .order('nombre', { ascending: true })
    if (error) return { data: null, error: { message: error.message } }
    return { data: (data as Departamento[]) ?? [], error: null }
  },

  async crearDepartamento(nombre: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('departamentos').insert({ nombre })
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async eliminarDepartamento(id: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('departamentos').delete().eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async listarMovimientos(): Promise<RespuestaBackend<Movimiento[]>> {
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearMovimiento),
      error: null,
    }
  },

  async listarMovimientosRango(
    desde: string,
    hasta: string,
  ): Promise<RespuestaBackend<Movimiento[]>> {
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: true })
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearMovimiento),
      error: null,
    }
  },

  /** Directorio id → nombre visible (para mostrar el autor de cada movimiento). */
  async listarDirectorio(): Promise<RespuestaBackend<Record<string, string>>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
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

  async crearMovimiento(datos: DatosMovimiento): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('movimientos').insert(datos)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async actualizarMovimiento(
    id: string,
    datos: DatosMovimiento,
  ): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('movimientos').update(datos).eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async eliminarMovimiento(id: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('movimientos').delete().eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async listarPresupuestos(anio: number, mes: number): Promise<RespuestaBackend<Presupuesto[]>> {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('anio', anio)
      .eq('mes', mes)
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearPresupuesto),
      error: null,
    }
  },

  async listarPresupuestosTodos(): Promise<RespuestaBackend<Presupuesto[]>> {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .order('anio', { ascending: true })
      .order('mes', { ascending: true })
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearPresupuesto),
      error: null,
    }
  },

  async guardarPresupuesto(datos: DatosPresupuesto): Promise<RespuestaBackend<null>> {
    const { error } = await supabase
      .from('presupuestos')
      .upsert(datos, { onConflict: 'departamento_id,anio,mes' })
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async listarPresupuestosAnio(anio: number): Promise<RespuestaBackend<Presupuesto[]>> {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('anio', anio)
      .order('mes', { ascending: true })
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearPresupuesto),
      error: null,
    }
  },

  async listarPresupuestosDepartamento(departamentoId: string): Promise<RespuestaBackend<Presupuesto[]>> {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('departamento_id', departamentoId)
      .order('anio', { ascending: false })
      .order('mes', { ascending: false })
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearPresupuesto),
      error: null,
    }
  },

  async copiarPresupuesto(
    departamentoId: string,
    anioOrigen: number,
    mesOrigen: number,
    anioDestino: number,
    mesDestino: number,
  ): Promise<RespuestaBackend<null>> {
    const origen = await this.listarPresupuestos(anioOrigen, mesOrigen)
    if (origen.error) return { data: null, error: { message: origen.error.message } }
    const presupuesto = (origen.data ?? []).find((p) => p.departamento_id === departamentoId)
    if (!presupuesto) {
      return { data: null, error: { message: 'No hay presupuesto en el mes de origen' } }
    }
    return this.guardarPresupuesto({
      departamento_id: departamentoId,
      anio: anioDestino,
      mes: mesDestino,
      monto_usd: presupuesto.monto_usd,
    })
  },

  async listarDepartamentosUsuario(usuarioId: string): Promise<RespuestaBackend<Departamento[]>> {
    const { data, error } = await supabase
      .from('usuario_departamentos')
      .select('departamento_id, departamentos(*)')
      .eq('usuario_id', usuarioId)
    if (error) return { data: null, error: { message: error.message } }
    const departamentos = ((data ?? []) as Array<{ departamento_id: string; departamentos: unknown }>)
      .map((r) => r.departamentos as Departamento)
    return { data: departamentos, error: null }
  },

  async asignarDepartamento(usuarioId: string, departamentoId: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase
      .from('usuario_departamentos')
      .insert({ usuario_id: usuarioId, departamento_id: departamentoId })
    if (error) {
      if (error.code === '23505') return { data: null, error: { message: 'Ya está asignado' } }
      return { data: null, error: { message: error.message } }
    }
    return { data: null, error: null }
  },

  async desasignarDepartamento(usuarioId: string, departamentoId: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase
      .from('usuario_departamentos')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('departamento_id', departamentoId)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async obtenerConceptosDepartamento(departamentoId: string): Promise<RespuestaBackend<string[]>> {
    const { data, error } = await supabase
      .from('conceptos_departamento')
      .select('concepto')
      .eq('departamento_id', departamentoId)
      .order('concepto')
    if (error) return { data: null, error: { message: error.message } }
    return { data: (data ?? []).map((r) => r.concepto), error: null }
  },

  async agregarConceptoDepartamento(departamentoId: string, concepto: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase
      .from('conceptos_departamento')
      .insert({ departamento_id: departamentoId, concepto: concepto.trim() })
    if (error) {
      if (error.code === '23505') return { data: null, error: null }
      return { data: null, error: { message: error.message } }
    }
    return { data: null, error: null }
  },

  // Razones Sociales
  async listarRazonesSociales(): Promise<RespuestaBackend<RazonSocial[]>> {
    const { data, error } = await supabase
      .from('razones_sociales')
      .select('*')
      .eq('activo', true)
      .order('nombre')
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearRazonSocial),
      error: null,
    }
  },

  async crearRazonSocial(datos: {
    nombre: string
    rif?: string
    direccion?: string
    telefono?: string
    email?: string
  }): Promise<RespuestaBackend<RazonSocial>> {
    const { data, error } = await supabase
      .from('razones_sociales')
      .insert(datos)
      .select()
      .single()
    if (error) return { data: null, error: { message: error.message } }
    return { data: mapearRazonSocial(data as Record<string, unknown>), error: null }
  },

  async actualizarRazonSocial(
    id: string,
    datos: {
      nombre?: string
      rif?: string
      direccion?: string
      telefono?: string
      email?: string
      activo?: boolean
    },
  ): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('razones_sociales').update(datos).eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async eliminarRazonSocial(id: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('razones_sociales').update({ activo: false }).eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  // Centros de Costo
  async listarCentrosCosto(): Promise<RespuestaBackend<CentroCosto[]>> {
    const { data, error } = await supabase
      .from('centros_costo')
      .select('*, razones_sociales(*)')
      .eq('activo', true)
      .order('nombre')
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearCentroCosto),
      error: null,
    }
  },

  async listarCentrosCostoPorRazonSocial(razonSocialId: string): Promise<RespuestaBackend<CentroCosto[]>> {
    const { data, error } = await supabase
      .from('centros_costo')
      .select('*')
      .eq('razon_social_id', razonSocialId)
      .eq('activo', true)
      .order('nombre')
    if (error) return { data: null, error: { message: error.message } }
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapearCentroCosto),
      error: null,
    }
  },

  async crearCentroCosto(datos: {
    razon_social_id: string
    nombre: string
    descripcion?: string
  }): Promise<RespuestaBackend<CentroCosto>> {
    const { data, error } = await supabase.from('centros_costo').insert(datos).select().single()
    if (error) return { data: null, error: { message: error.message } }
    return { data: mapearCentroCosto(data as Record<string, unknown>), error: null }
  },

  async actualizarCentroCosto(
    id: string,
    datos: {
      razon_social_id?: string
      nombre?: string
      descripcion?: string
      activo?: boolean
    },
  ): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('centros_costo').update(datos).eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },

  async eliminarCentroCosto(id: string): Promise<RespuestaBackend<null>> {
    const { error } = await supabase.from('centros_costo').update({ activo: false }).eq('id', id)
    if (error) return { data: null, error: { message: error.message } }
    return { data: null, error: null }
  },
}

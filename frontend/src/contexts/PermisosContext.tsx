import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { permisosService } from '../services/permisos'
import type { PermisosUsuarioMap } from '../types'

interface PermisosContextValue {
  permisos: PermisosUsuarioMap
  cargando: boolean
  tienePermiso: (herramientaId: string, accion: 'crear' | 'leer' | 'actualizar' | 'eliminar') => boolean
  recargar: () => Promise<void>
}

const PermisosContext = createContext<PermisosContextValue | null>(null)

export function PermisosProvider({ children }: { children: ReactNode }) {
  const { perfil, esAdmin } = useAuth()
  const [permisos, setPermisos] = useState<PermisosUsuarioMap>({})
  const [cargando, setCargando] = useState(true)

  async function recargar() {
    if (!perfil) {
      setPermisos({})
      setCargando(false)
      return
    }

    // Admins tienen todos los permisos
    if (esAdmin) {
      setPermisos({})
      setCargando(false)
      return
    }

    setCargando(true)
    const res = await permisosService.obtenerPermisosUsuario(perfil.id)
    if (!res.error && res.data) {
      setPermisos(res.data)
    } else {
      setPermisos({})
    }
    setCargando(false)
  }

  useEffect(() => {
    void recargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil?.id, esAdmin])

  function tienePermiso(
    herramientaId: string,
    accion: 'crear' | 'leer' | 'actualizar' | 'eliminar',
  ): boolean {
    // Admins siempre tienen permisos
    if (esAdmin) return true

    const permiso = permisos[herramientaId]
    if (!permiso) return false

    switch (accion) {
      case 'crear':
        return permiso.puede_crear
      case 'leer':
        return permiso.puede_leer
      case 'actualizar':
        return permiso.puede_actualizar
      case 'eliminar':
        return permiso.puede_eliminar
      default:
        return false
    }
  }

  return (
    <PermisosContext.Provider value={{ permisos, cargando, tienePermiso, recargar }}>
      {children}
    </PermisosContext.Provider>
  )
}

export function usePermisos(): PermisosContextValue {
  const ctx = useContext(PermisosContext)
  if (!ctx) {
    throw new Error('usePermisos debe usarse dentro de <PermisosProvider>')
  }
  return ctx
}

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Perfil } from '../types'

interface AuthContextValue {
  /** Usuario de Supabase Auth (sesión activa). */
  user: User | null
  /** Fila de la tabla profiles del usuario actual. */
  perfil: Perfil | null
  /** Verdadero mientras se restaura la sesión o se carga el perfil. */
  cargando: boolean
  esAdmin: boolean
  iniciarSesion: (email: string, password: string) => Promise<void>
  cerrarSesion: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function cargarPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('Error al cargar perfil:', error.message)
    return null
  }
  return data as Perfil | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!activo) return
        const sesion = data.session
        setUser(sesion?.user ?? null)
        if (sesion?.user) {
          const p = await cargarPerfil(sesion.user.id)
          if (activo) setPerfil(p)
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    const { data: suscripcion } = supabase.auth.onAuthStateChange(
      async (_evento, sesion) => {
        setUser(sesion?.user ?? null)
        if (sesion?.user) {
          const p = await cargarPerfil(sesion.user.id)
          setPerfil(p)
        } else {
          setPerfil(null)
        }
      },
    )

    return () => {
      activo = false
      suscripcion.subscription.unsubscribe()
    }
  }, [])

  async function iniciarSesion(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function cerrarSesion() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  const esAdmin = perfil?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{ user, perfil, cargando, esAdmin, iniciarSesion, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}

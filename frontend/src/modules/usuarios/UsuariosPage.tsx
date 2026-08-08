import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

export default function UsuariosPage() {
  const [recargarUsuarios, setRecargarUsuarios] = useState(false)

  const triggerRecarga = useCallback(() => {
    setRecargarUsuarios((prev) => !prev)
  }, [])

  useEffect(() => {
    // Forzar recarga inicial
  }, [])

  return (
    <div className="modulo-contenido">
      <Outlet context={{ recargarUsuarios, triggerRecarga }} />
    </div>
  )
}

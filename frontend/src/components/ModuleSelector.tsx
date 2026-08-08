import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MODULOS } from '../config/modules'
import type { ModuloConfig } from '../types'

interface Props {
  moduloActivo: ModuloConfig
}

export default function ModuleSelector({ moduloActivo }: Props) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    function alClicFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', alClicFuera)
    return () => document.removeEventListener('mousedown', alClicFuera)
  }, [])

  useEffect(() => {
    setAbierto(false)
  }, [location.pathname])

  return (
    <div className="selector-modulos" ref={ref}>
      <button
        type="button"
        className="selector-modulos-actual"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
      >
        <span
          className="selector-modulos-punto"
          style={{ backgroundColor: moduloActivo.color.principal }}
        />
        <span>{moduloActivo.nombre}</span>
        <span className="selector-modulos-flecha">{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && (
        <ul className="selector-modulos-lista" role="listbox">
          {MODULOS.map((m) => {
            const activo = m.id === moduloActivo.id
            return (
              <li key={m.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={activo}
                  disabled={!m.habilitado || activo}
                  onClick={() => navigate(m.ruta)}
                  className="selector-modulos-item"
                  style={
                    activo
                      ? { borderLeftColor: m.color.principal }
                      : undefined
                  }
                >
                  <span
                    className="selector-modulos-punto"
                    style={{ backgroundColor: m.color.principal }}
                  />
                  <span className="selector-modulos-item-texto">
                    <span>{m.nombre}</span>
                    <small>{m.descripcion}</small>
                  </span>
                  {!m.habilitado && (
                    <span className="badge-proximamente">Próximamente</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

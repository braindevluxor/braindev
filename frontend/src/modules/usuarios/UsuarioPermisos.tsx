import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { permisosService } from '../../services/permisos'
import { usuariosService } from './services'
import { gpService } from '../gasto-presupuesto/services'
import type { Perfil, Modulo, Herramienta, Departamento } from '../../types'
import Cargando from '../../components/Cargando'
import MultiSelect from '../../components/MultiSelect'

interface OutletContextType {
  recargarUsuarios: boolean
  triggerRecarga: () => void
}

interface PermisosLocales {
  [herramientaId: string]: {
    moduloId: string
    puede_crear: boolean
    puede_leer: boolean
    puede_actualizar: boolean
    puede_eliminar: boolean
  }
}

export default function UsuarioPermisos() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { triggerRecarga } = useOutletContext<OutletContextType>()

  const [usuario, setUsuario] = useState<Perfil | null>(null)
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [herramientas, setHerramientas] = useState<Herramienta[]>([])
  const [permisos, setPermisos] = useState<PermisosLocales>({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState<string | null>(null)

  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [deptosAsignados, setDeptosAsignados] = useState<string[]>([])

  useEffect(() => {
    if (id) {
      void cargarDatos(id)
    }
  }, [id])

  async function cargarDatos(userId: string) {
    setCargando(true)
    const [resUsuario, resModulos, resHerramientas, resPermisos, resDeptos, resAsignados] = await Promise.all([
      usuariosService.obtener(userId),
      permisosService.listarModulos(),
      permisosService.listarHerramientas(),
      permisosService.obtenerPermisosUsuario(userId),
      gpService.listarDepartamentos(),
      gpService.listarDepartamentosUsuario(userId),
    ])

    if (!resUsuario.error && resUsuario.data) {
      setUsuario(resUsuario.data)
    }
    if (!resModulos.error && resModulos.data) {
      setModulos(resModulos.data)
    }
    if (!resHerramientas.error && resHerramientas.data) {
      setHerramientas(resHerramientas.data)
    }
    if (!resPermisos.error && resPermisos.data) {
      const locales: PermisosLocales = {}
      for (const [herrId, perm] of Object.entries(resPermisos.data)) {
        const herramienta = resHerramientas.data?.find((h) => h.id === herrId)
        locales[herrId] = {
          moduloId: herramienta?.modulo_id ?? '',
          puede_crear: perm.puede_crear,
          puede_leer: perm.puede_leer,
          puede_actualizar: perm.puede_actualizar,
          puede_eliminar: perm.puede_eliminar,
        }
      }
      setPermisos(locales)
    }
    if (!resDeptos.error && resDeptos.data) {
      setDepartamentos(resDeptos.data)
    }
    if (!resAsignados.error && resAsignados.data) {
      setDeptosAsignados(resAsignados.data.map((d) => d.id))
    }
    setCargando(false)
  }

  async function handleDeptosChange(nuevosIds: string[]) {
    if (!id) return

    const actuales = new Set(deptosAsignados)
    const nuevos = new Set(nuevosIds)

    for (const deptoId of nuevos) {
      if (!actuales.has(deptoId)) {
        await gpService.asignarDepartamento(id, deptoId)
      }
    }

    for (const deptoId of actuales) {
      if (!nuevos.has(deptoId)) {
        await gpService.desasignarDepartamento(id, deptoId)
      }
    }

    setDeptosAsignados(nuevosIds)
    triggerRecarga()
  }

  async function togglePermiso(
    herramientaId: string,
    moduloId: string,
    campo: 'puede_crear' | 'puede_leer' | 'puede_actualizar' | 'puede_eliminar',
  ) {
    if (!id) return

    const actual = permisos[herramientaId] ?? {
      moduloId,
      puede_crear: false,
      puede_leer: false,
      puede_actualizar: false,
      puede_eliminar: false,
    }

    const nuevoValor = !actual[campo]
    const nuevosPermisos = { ...actual, [campo]: nuevoValor }

    setPermisos((prev) => ({
      ...prev,
      [herramientaId]: nuevosPermisos,
    }))

    setGuardando(herramientaId)
    const res = await permisosService.guardarPermisos(
      id,
      moduloId,
      herramientaId,
      {
        puede_crear: nuevosPermisos.puede_crear,
        puede_leer: nuevosPermisos.puede_leer,
        puede_actualizar: nuevosPermisos.puede_actualizar,
        puede_eliminar: nuevosPermisos.puede_eliminar,
      },
    )
    setGuardando(null)

    if (res.error) {
      setPermisos((prev) => ({
        ...prev,
        [herramientaId]: actual,
      }))
    } else {
      triggerRecarga()
    }
  }

  async function toggleModuloCompleto(moduloId: string, herramientasDelModulo: Herramienta[]) {
    if (!id) return

    const todasActivas = herramientasDelModulo.every(
      (h) =>
        permisos[h.id]?.puede_crear &&
        permisos[h.id]?.puede_leer &&
        permisos[h.id]?.puede_actualizar &&
        permisos[h.id]?.puede_eliminar,
    )

    for (const h of herramientasDelModulo) {
      const nuevosPermisos = todasActivas
        ? { puede_crear: false, puede_leer: false, puede_actualizar: false, puede_eliminar: false }
        : { puede_crear: true, puede_leer: true, puede_actualizar: true, puede_eliminar: true }

      setPermisos((prev) => ({
        ...prev,
        [h.id]: {
          moduloId,
          ...nuevosPermisos,
        },
      }))

      await permisosService.guardarPermisos(id, moduloId, h.id, nuevosPermisos)
    }
    triggerRecarga()
  }

  if (cargando) {
    return (
      <div className="pestana-contenido">
        <div className="form-tarjeta">
          <Cargando mensaje="Cargando permisos…" />
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="pestana-contenido">
        <div className="form-tarjeta">
          <p className="vacio">Usuario no encontrado</p>
        </div>
      </div>
    )
  }

  if (usuario.role === 'admin') {
    return (
      <div className="pestana-contenido">
        <div className="form-tarjeta">
          <div className="form-tarjeta-titulo">
            <div>
              <h3>Permisos de {usuario.full_name || usuario.email}</h3>
              <p>Los administradores tienen acceso completo a todas las herramientas</p>
            </div>
            <button
              type="button"
              className="btn-secundario"
              onClick={() => navigate('/usuarios')}
            >
              ← Volver
            </button>
          </div>
          <div className="alerta exito">
            Los administradores no requieren configuración de permisos individuales.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pestana-contenido">
      <div className="form-tarjeta">
        <div className="form-tarjeta-titulo">
          <div>
            <h3>Permisos de {usuario.full_name || usuario.email}</h3>
            <p>Configura qué módulos, herramientas y acciones puede realizar este usuario</p>
          </div>
          <button
            type="button"
            className="btn-secundario"
            onClick={() => navigate('/usuarios')}
          >
            ← Volver
          </button>
        </div>

        {modulos.map((modulo) => {
          const herramientasDelModulo = herramientas.filter((h) => h.modulo_id === modulo.id)
          if (herramientasDelModulo.length === 0) return null

          const todasActivas = herramientasDelModulo.every(
            (h) =>
              permisos[h.id]?.puede_crear &&
              permisos[h.id]?.puede_leer &&
              permisos[h.id]?.puede_actualizar &&
              permisos[h.id]?.puede_eliminar,
          )

          return (
            <div key={modulo.id} className="permisos-modulo">
              <div className="permisos-modulo-header">
                <label className="permisos-checkbox-grupo">
                  <input
                    type="checkbox"
                    checked={todasActivas}
                    onChange={() => toggleModuloCompleto(modulo.id, herramientasDelModulo)}
                  />
                  <span className="permisos-modulo-nombre">{modulo.nombre}</span>
                </label>
                <span className="permisos-modulo-desc">{modulo.descripcion}</span>
              </div>

              {modulo.id === 'gasto-presupuesto' && (
                <div className="permisos-deptos-section">
                  <label className="permisos-deptos-label">
                    <span>Unidades presupuestarias que puede gestionar:</span>
                  </label>
                  <MultiSelect
                    options={departamentos.map((d) => ({ value: d.id, label: d.nombre }))}
                    selected={deptosAsignados}
                    onChange={handleDeptosChange}
                    placeholder="Seleccionar unidades..."
                    searchPlaceholder="Buscar unidad..."
                  />
                </div>
              )}

              <div className="permisos-herramientas">
                <div className="permisos-herramienta-header">
                  <span>Herramienta</span>
                  <span className="permisos-acciones-header">
                    <span>Crear</span>
                    <span>Leer</span>
                    <span>Editar</span>
                    <span>Eliminar</span>
                  </span>
                </div>

                {herramientasDelModulo.map((herramienta) => {
                  const p = permisos[herramienta.id]
                  const estaGuardando = guardando === herramienta.id

                  return (
                    <div
                      key={herramienta.id}
                      className={`permisos-herramienta ${estaGuardando ? 'guardando' : ''}`}
                    >
                      <span className="permisos-herramienta-nombre">{herramienta.nombre}</span>
                      <div className="permisos-acciones">
                        <label className="permisos-toggle">
                          <input
                            type="checkbox"
                            checked={p?.puede_crear ?? false}
                            onChange={() =>
                              togglePermiso(herramienta.id, modulo.id, 'puede_crear')
                            }
                            disabled={estaGuardando}
                          />
                        </label>
                        <label className="permisos-toggle">
                          <input
                            type="checkbox"
                            checked={p?.puede_leer ?? false}
                            onChange={() =>
                              togglePermiso(herramienta.id, modulo.id, 'puede_leer')
                            }
                            disabled={estaGuardando}
                          />
                        </label>
                        <label className="permisos-toggle">
                          <input
                            type="checkbox"
                            checked={p?.puede_actualizar ?? false}
                            onChange={() =>
                              togglePermiso(herramienta.id, modulo.id, 'puede_actualizar')
                            }
                            disabled={estaGuardando}
                          />
                        </label>
                        <label className="permisos-toggle">
                          <input
                            type="checkbox"
                            checked={p?.puede_eliminar ?? false}
                            onChange={() =>
                              togglePermiso(herramienta.id, modulo.id, 'puede_eliminar')
                            }
                            disabled={estaGuardando}
                          />
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

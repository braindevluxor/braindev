interface Props {
  mensaje?: string
  compacto?: boolean
}

export default function Cargando({ mensaje = 'Cargando…', compacto = false }: Props) {
  return (
    <div className={compacto ? 'cargando cargando-compacto' : 'cargando'}>
      <div className="cargando-anillo" aria-hidden="true" />
      <p>{mensaje}</p>
    </div>
  )
}

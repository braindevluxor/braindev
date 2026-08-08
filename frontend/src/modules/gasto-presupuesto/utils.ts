const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function formatoUsd(valor: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

export function formatoBs(valor: number): string {
  return `${new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)} Bs`
}

export function formatoFecha(iso: string): string {
  const fecha = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function nombreMes(anio: number, mes: number): string {
  return `${MESES[mes - 1]} ${anio}`
}

export function anioMesActual(): { anio: number; mes: number } {
  const ahora = new Date()
  return { anio: ahora.getFullYear(), mes: ahora.getMonth() + 1 }
}

/** Convierte "YYYY-MM" en { anio, mes }. */
export function parsearAnioMes(valor: string): { anio: number; mes: number } {
  const [anio, mes] = valor.split('-').map(Number)
  return { anio, mes }
}

/** Rango [desde, hasta] ISO de un mes, para filtrar movimientos por fecha. */
export function rangoMes(anio: number, mes: number): { desde: string; hasta: string } {
  const desde = `${anio}-${String(mes).padStart(2, '0')}-01`
  const ultimoDia = new Date(anio, mes, 0).getDate()
  const hasta = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
  return { desde, hasta }
}

export interface TasaCambio {
  fecha: string
  usd: number
  eur?: number
}

export const tasaService = {
  async obtenerTasaBCV(): Promise<{ data: TasaCambio | null; error: { message: string } | null }> {
    try {
      // API pública del BCV Venezuela
      const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial')
      
      if (!response.ok) {
        throw new Error('Error al obtener la tasa del BCV')
      }
      
      const data = await response.json()
      
      return {
        data: {
          fecha: data.fechaActualizacion || new Date().toISOString().split('T')[0],
          usd: data.promedio || 0,
        },
        error: null,
      }
    } catch (error) {
      console.error('Error al obtener tasa BCV:', error)
      return {
        data: null,
        error: { message: 'No se pudo obtener la tasa del BCV. Ingresa la tasa manualmente.' },
      }
    }
  },

  async obtenerTasaUSD(): Promise<{ data: number | null; error: { message: string } | null }> {
    try {
      // API alternativa: ExchangeRate API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      
      if (!response.ok) {
        throw new Error('Error al obtener tasa de cambio')
      }
      
      const data = await response.json()
      const tasaVES = data.rates?.VES || 0
      
      return {
        data: tasaVES,
        error: null,
      }
    } catch (error) {
      console.error('Error al obtener tasa USD:', error)
      return {
        data: null,
        error: { message: 'No se pudo obtener la tasa. Ingresa la tasa manualmente.' },
      }
    }
  },
}

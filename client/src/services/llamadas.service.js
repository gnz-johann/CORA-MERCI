import api from './api'

// Llamadas (Historial + Llamadas Activas comparten este mismo endpoint real,
// GET /api/llamadas — Bina 3). Respuesta: { data: { total, pagina, limite, llamadas } },
// cada llamada con agentes_virtuales/catalogo_estado_llamada/catalogo_resultado_llamada
// anidados (confirmado contra el backend real, no asumido).
export const llamadasService = {
  listar: (filtros = {}) => {
    const params = new URLSearchParams()
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        params.append(clave, valor)
      }
    })
    const q = params.toString() ? `?${params.toString()}` : ''
    return api.get(`/llamadas${q}`)
  },
  obtenerDetalle: (id) => api.get(`/llamadas/${id}`),
  sincronizarCDR: (filtros = {}) => api.post('/llamadas/sync-cdr', filtros),
}

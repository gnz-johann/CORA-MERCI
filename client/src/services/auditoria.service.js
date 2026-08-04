import api from './api'

// Auditoría

export const auditoriaService = {
  // filtros opcionales (fecha, usuario, accion, modulo, etc.) — se mandan
  // como query params solo si vienen definidos, igual que usuariosService.listar
  listar: (filtros = {}) => {
    const params = new URLSearchParams()
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        params.append(clave, valor)
      }
    })
    const q = params.toString() ? `?${params.toString()}` : ''
    return api.get(`/auditoria${q}`)
  },
}

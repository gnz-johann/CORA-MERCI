import api from './api'

// Configuración de Inteligencia Artificial (voz, idioma, proveedores, etc.)

export const configuracionService = {
  obtener:             () => api.get('/configuracion/empresa'),
  actualizar:          (datos) => api.put('/configuracion/empresa', datos),
  listarProveedoresIA: () => api.get('/configuracion/proveedores-ia'),
}

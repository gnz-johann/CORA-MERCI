import api from './api'

// Configuración de Inteligencia Artificial (voz, idioma, proveedores, etc.)

export const configuracionService = {
  obtener:             () => api.get('/configuracion/empresa'),
  actualizar:          (datos) => api.put('/configuracion/empresa', datos),
  listarProveedoresIA: () => api.get('/configuracion/proveedores-ia'),

  // PBX (Bina 3) — OJO: GET devuelve snake_case (api_url, api_usuario,
  // auth_tipo), pero PUT espera camelCase (apiUrl, apiUsuario, authTipo) en
  // el body. No es un descuido de este archivo, es así en el backend real
  // (confirmado en vivo antes de conectar Configuracion.jsx) — cada llamada
  // arma el body con el nombre que corresponde.
  obtenerPbx:        () => api.get('/configuracion/pbx'),
  guardarPbx:        (datos) => api.put('/configuracion/pbx', datos),
  probarConexionPbx: () => api.post('/configuracion/pbx/probar-conexion'),
}

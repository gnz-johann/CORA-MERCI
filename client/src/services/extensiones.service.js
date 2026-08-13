import api from './api'

// Extensiones — GET/POST reales (Bina 3). Editar/eliminar no existen todavía
// en el backend (solo GET /, POST /sync, POST /), así que esas acciones
// siguen sin conectar del lado de Extensiones.jsx.
//
// Errores de POST pueden venir con `categoria` ('conexion'|'validacion'|'sistema')
// en el body de error — ver error.middleware.js / cloudUCMErrors.js del backend.
// api.js ya adjunta ese body completo en `error.data` cuando la respuesta trae ok:false.
export const extensionesService = {
  listar: () => api.get('/extensiones'),
  crear:  (datos) => api.post('/extensiones', datos),
  sincronizar: () => api.post('/extensiones/sync'),
  eliminar: (id) => api.delete(`/extensiones/${id}`),
}

import api from './api'

// Tickets — mismo patrón que usuariosService/sucursalesService en este archivo.
//
// OJO: a diferencia de usuarios/sucursales/departamentos, el backend de tickets
// (src/modules/tickets/, Bina 3) devuelve las filas de Prisma tal cual —
// snake_case, sin mapear a camelCase, y `GET /tickets`/`GET /tickets/:id` no
// traen `mensaje` en la respuesta (solo `{ ok, data }`). Confirmado llamando
// al backend real antes de escribir Tickets.jsx, no asumido del patrón de
// otros módulos.
export const ticketsService = {
  listar:   () => api.get('/tickets'),
  obtener:  (id) => api.get(`/tickets/${id}`),
  crear:    (datos) => api.post('/tickets', datos),
  editar:   (id, datos) => api.put(`/tickets/${id}`, datos),
  eliminar: (id) => api.delete(`/tickets/${id}`),
  catalogos: () => api.get('/tickets/catalogos'),
  comentar: (datos) => api.post('/tickets/comentarios', datos),
}

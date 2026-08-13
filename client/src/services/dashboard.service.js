import api from './api'

// Dashboard — GET /api/dashboard real (Bina 4), un solo endpoint que devuelve
// todo lo que pinta Dashboard.jsx: kpis, llamadasRecientes, llamadasPorHora,
// sentimientosHoy, agentes, ticketsUrgentes, actividadReciente.
export const dashboardService = {
  resumen: () => api.get('/dashboard'),
}

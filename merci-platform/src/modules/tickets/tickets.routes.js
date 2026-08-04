const { Router } = require('express');
const {
  obtenerTickets,
  obtenerTicketPorId,
  crearTicket,
  actualizarTicket,
  eliminarTicket,
  agregarComentario,
  obtenerCatalogos
} = require('./tickets.controller.js');

const authenticate          = require('../../core/middlewares/auth.middleware');
const setTenant              = require('../../core/middlewares/tenant.middleware');
const { requirePermission }  = require('../../core/middlewares/permission.middleware');

const router = Router();

// Middleware base — mismo patrón que agentes.routes.js / extensiones.routes.js.
// Antes de este fix estas rutas no exigían ni siquiera estar logueado.
router.use(authenticate, setTenant);

router.get('/catalogos', requirePermission('tickets.ver'), obtenerCatalogos);
router.get('/', requirePermission('tickets.ver'), obtenerTickets);
router.get('/:id', requirePermission('tickets.ver'), obtenerTicketPorId);
router.post('/', requirePermission('tickets.crear'), crearTicket);
router.post('/comentarios', requirePermission('tickets.comentar'), agregarComentario);
router.put('/:id', requirePermission('tickets.editar'), actualizarTicket);
router.delete('/:id', requirePermission('tickets.eliminar'), eliminarTicket);

module.exports = router;
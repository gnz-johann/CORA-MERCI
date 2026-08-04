const express = require('express');
const router = express.Router();
const agentesController = require('./agentes.controller');

const authenticate           = require('../../core/middlewares/auth.middleware');
const setTenant              = require('../../core/middlewares/tenant.middleware');
const { requirePermission }  = require('../../core/middlewares/permission.middleware');

// Middleware base para todas las rutas de agentes (mismo patrón que
// extensiones.routes.js / llamadas.routes.js) — sin setTenant, req.empresaId
// llega undefined y Prisma ignora el filtro empresa_id por completo.
router.use(authenticate, setTenant);

// Endpoints de Agentes Virtuales (Módulo 1)
router.get('/', requirePermission('agentes.ver'), agentesController.obtenerAgentes);
router.get('/:id', requirePermission('agentes.ver'), agentesController.obtenerAgentePorId);
router.post('/', requirePermission('agentes.crear'), agentesController.crearAgente);
router.put('/:id', requirePermission('agentes.editar'), agentesController.actualizarAgente);
router.patch('/:id/estado', requirePermission('agentes.estado'), agentesController.cambiarEstadoAgente);
router.delete('/:id', requirePermission('agentes.eliminar'), agentesController.eliminarAgente);

const promptsRouter = require('../prompts/prompts.routes');
router.use('/:id/prompts', promptsRouter);

module.exports = router;
// src/modules/dashboard/dashboard.routes.js
// Bina 4 — Auditoría y Configuración IA
//
// Montado en index.routes.js como:
//   router.use('/dashboard', dashboardRoutes)
//
// Endpoints resultantes:
//   GET /api/dashboard → resumen de métricas reales para el dashboard principal

'use strict';

const express               = require('express');
const router                = express.Router();
const authenticate          = require('../../core/middlewares/auth.middleware');
const setTenant              = require('../../core/middlewares/tenant.middleware');
const { requirePermission }  = require('../../core/middlewares/permission.middleware');
const dashboardController   = require('./dashboard.controller');

router.use(authenticate, setTenant);

router.get(
  '/',
  requirePermission('dashboard.ver'),
  dashboardController.resumen
);

module.exports = router;

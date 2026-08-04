// src/modules/auditoria/auditoria.routes.js
// Bina 4 — Auditoría y Configuración IA
//
// Montado en index.routes.js como:
//   router.use('/auditoria', auditoriaRoutes)
//
// Endpoints resultantes:
//   GET /api/auditoria         (auditoria.ver)
//   GET /api/auditoria/export  (auditoria.exportar)
//
// OJO — desvío del contrato: .docs/CONTRATO_Auditoria_ConfiguracionIA.md
// dice "mismo permiso auditoria.ver" para ambos endpoints, pero el catálogo
// real (db/merci_schema.sql, ~línea 559) siembra 'auditoria.ver' y
// 'auditoria.exportar' como permisos separados, y empresas.repository.js
// ya los excluye por separado del rol Admin de Sucursal. Se usa el permiso
// real del catálogo, no el que sugiere el contrato — ver informe de esta
// sección para el detalle.

'use strict';

const express                = require('express');
const router                 = express.Router();
const authenticate           = require('../../core/middlewares/auth.middleware');
const setTenant              = require('../../core/middlewares/tenant.middleware');
const { requirePermission }  = require('../../core/middlewares/permission.middleware');
const auditoriaController    = require('./auditoria.controller');

router.use(authenticate, setTenant);

// GET /api/auditoria/export
router.get(
  '/export',
  requirePermission('auditoria.exportar'),
  auditoriaController.exportar
);

// GET /api/auditoria
router.get(
  '/',
  requirePermission('auditoria.ver'),
  auditoriaController.listar
);

module.exports = router;

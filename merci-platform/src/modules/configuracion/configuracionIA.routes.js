// src/modules/configuracion/configuracionIA.routes.js
// Bina 4 — Auditoría y Configuración IA
//
// Archivo separado de configuracion.routes.js (Bina 3, NO TOCAR) — Express
// permite montar varios routers en el mismo prefijo. Montado en
// index.routes.js como:
//   router.use('/configuracion', configuracionIARoutes)
//
// Endpoints resultantes:
//   GET /api/configuracion/proveedores-ia
//   GET /api/configuracion/empresa
//   PUT /api/configuracion/empresa
//   PUT /api/configuracion/credenciales-ia

'use strict';

const express                    = require('express');
const router                     = express.Router();
const authenticate                = require('../../core/middlewares/auth.middleware');
const setTenant                   = require('../../core/middlewares/tenant.middleware');
const { requirePermission }       = require('../../core/middlewares/permission.middleware');
const configuracionIAController   = require('./configuracionIA.controller');

router.use(authenticate, setTenant);

// GET /api/configuracion/proveedores-ia
// El contrato no fija un permiso propio para este endpoint — se usa el mismo
// que el resto del módulo (empresa.configurar) porque solo alimenta los
// selects del formulario de configuración IA, sin uso fuera de ahí.
router.get(
  '/proveedores-ia',
  requirePermission('empresa.configurar'),
  configuracionIAController.listarProveedores
);

// GET /api/configuracion/empresa
router.get(
  '/empresa',
  requirePermission('empresa.configurar'),
  configuracionIAController.obtenerConfig
);

// PUT /api/configuracion/empresa
router.put(
  '/empresa',
  requirePermission('empresa.configurar'),
  configuracionIAController.guardarConfig
);

// PUT /api/configuracion/credenciales-ia
// Body: { credenciales: { openai_api_key: 'sk-...', ... } } — se cifran con
// AES-256-GCM antes de guardarse (ver core/utils/credencialesIA.crypto.js).
router.put(
  '/credenciales-ia',
  requirePermission('empresa.configurar'),
  configuracionIAController.guardarCredenciales
);

module.exports = router;

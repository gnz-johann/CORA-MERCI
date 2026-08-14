// src/modules/internal/internal.routes.js
//
// Montado en index.routes.js como:
//   router.use('/internal', internalRoutes)
//
// Superficie de API interna para procesos de sistema sin usuario humano
// (hoy: el puente de voz sip-b2bua.js — ver
// referencia-voz-bina12/voz-en-vivo/README.md). Autenticada con
// x-internal-api-key (internalAuth.middleware.js), NUNCA con JWT — ver el
// comentario de esa misma función para el porqué.
//
// El puente NO está conectado ni desplegado todavía (instrucción explícita
// de esta tarea) — este módulo solo construye la API que consumiría.
//
// Endpoints resultantes:
//   POST /api/internal/llamadas/iniciar
//   POST /api/internal/llamadas/finalizar
//   GET  /api/internal/agentes/resolver
//   POST /api/internal/tickets/crear
//   GET  /api/internal/conocimiento/consultar   (stub, 501)

'use strict';

const express = require('express');
const router = express.Router();
const internalAuth = require('../../core/middlewares/internalAuth.middleware');
const internalController = require('./internal.controller');

// Todas las rutas de este módulo pasan por internalAuth — nunca por
// authenticate/setTenant (no hay JWT posible acá, ver internalAuth.middleware.js).
router.use(internalAuth);

router.post('/llamadas/iniciar', internalController.iniciarLlamada);
router.post('/llamadas/finalizar', internalController.finalizarLlamada);
router.get('/agentes/resolver', internalController.resolverAgente);
router.post('/tickets/crear', internalController.crearTicket);
router.get('/conocimiento/consultar', internalController.consultarConocimiento);

module.exports = router;

// src/modules/dashboard/dashboard.controller.js
// Bina 4 — Auditoría y Configuración IA
// Capa HTTP del módulo de dashboard. Sin lógica de negocio.

'use strict';

const dashboardService = require('./dashboard.service');

/**
 * GET /api/dashboard
 * Resumen completo de métricas para el dashboard principal.
 * Permiso requerido: dashboard.ver
 */
async function resumen(req, res, next) {
  try {
    const resultado = await dashboardService.obtenerResumen(req.empresaId);

    return res.status(200).json({
      ok:      true,
      mensaje: 'Resumen de dashboard obtenido correctamente',
      data:    resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { resumen };

// src/modules/auditoria/auditoria.controller.js
// Bina 4 — Auditoría y Configuración IA
// Capa HTTP del módulo de auditoría. Sin lógica de negocio.

'use strict';

const auditoriaService = require('./auditoria.service');

const CSV_HEADERS = ['Usuario', 'Username', 'IP', 'Fecha y Hora', 'Acción', 'Módulo'];

function filaCSV(valores) {
  return valores.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
}

function generarCSV(items) {
  const filas = items.map((log) => filaCSV([
    log.usuarioNombre, log.usuarioUsername, log.ip, log.fechaHora, log.accion, log.modulo
  ]));
  return [filaCSV(CSV_HEADERS), ...filas].join('\n');
}

/**
 * GET /api/auditoria
 * Query params opcionales: fecha, usuarioId, accion, modulo, page, pageSize
 */
async function listar(req, res, next) {
  try {
    const resultado = await auditoriaService.listar(req.empresaId, req.query);

    return res.status(200).json({
      ok:      true,
      mensaje: 'Auditoría obtenida correctamente',
      data:    resultado
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auditoria/export
 * Mismos filtros que listar(), sin paginación — devuelve un CSV.
 */
async function exportar(req, res, next) {
  try {
    const items = await auditoriaService.listarParaExport(req.empresaId, req.query);
    const csv = generarCSV(items);

    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="auditoria_${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, exportar };

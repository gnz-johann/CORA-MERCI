// src/modules/auditoria/auditoria.service.js
// Bina 4 — Auditoría y Configuración IA

'use strict';

const auditoriaRepository = require('./auditoria.repository');
const { ACCION_A_ESPANOL } = auditoriaRepository;

function formatearLog(log) {
  return {
    id:              String(log.id),
    usuarioNombre:   log.usuarios?.nombre   || null,
    usuarioUsername: log.usuarios?.usuario  || null,
    ip:              log.ip,
    fechaHora:       log.fecha_evento,
    accion:          ACCION_A_ESPANOL[log.accion] || log.accion,
    modulo:          log.modulo,
    datosAnteriores: log.datos_anteriores,
    datosNuevos:     log.datos_nuevos
  };
}

/**
 * @param {string} empresaId
 * @param {Object} query - filtros + paginación (ver auditoria.repository.js)
 * @returns {Promise<{items: Array, total: number, page: number, pageSize: number}>}
 */
async function listar(empresaId, query) {
  const { total, page, pageSize, items } = await auditoriaRepository.listar(empresaId, query);
  return { items: items.map(formatearLog), total, page, pageSize };
}

/**
 * @param {string} empresaId
 * @param {Object} filtros
 * @returns {Promise<Array>} - filas ya formateadas, listas para el CSV
 */
async function listarParaExport(empresaId, filtros) {
  const items = await auditoriaRepository.listarParaExport(empresaId, filtros);
  return items.map(formatearLog);
}

module.exports = { listar, listarParaExport };

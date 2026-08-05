// src/modules/auditoria/auditoria.service.js
// Bina 4 — Auditoría y Configuración IA

'use strict';

const auditoriaRepository = require('./auditoria.repository');

/**
 * auditoria.repository.js ya devuelve los logs mapeados a camelCase
 * (mapearParaFrontend) — este service no vuelve a tocar esos campos, solo
 * pasa el resultado tal cual. Volver a mapear aquí buscaba nombres de campo
 * viejos (log.fecha_evento, log.datos_nuevos, log.usuarios?.nombre) que ya
 * no existen en lo que entrega el repository, y los dejaba undefined.
 *
 * @param {string} empresaId
 * @param {Object} query - filtros + paginación (ver auditoria.repository.js)
 * @returns {Promise<{items: Array, total: number, page: number, pageSize: number}>}
 */
async function listar(empresaId, query) {
  return auditoriaRepository.listar(empresaId, query);
}

/**
 * @param {string} empresaId
 * @param {Object} filtros
 * @returns {Promise<Array>} - filas ya formateadas por el repository, listas para el CSV
 */
async function listarParaExport(empresaId, filtros) {
  return auditoriaRepository.listarParaExport(empresaId, filtros);
}

module.exports = { listar, listarParaExport };

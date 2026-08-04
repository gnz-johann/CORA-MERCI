// src/modules/auditoria/auditoria.repository.js
// Bina 4 — Auditoría y Configuración IA
//
// MULTI-TENANT: todas las queries filtran por empresa_id — es la única
// forma de aislar los logs de auditoría de una empresa de los de otra.

'use strict';

const prisma = require('../../config/database');

// Traducción de la acción cruda (la que escribe src/services/audit.service.js:
// 'INSERT'|'UPDATE'|'DELETE') al participio que ya espera el front — ver
// src/pages/Auditoria.jsx, que compara log.accion contra 'Creó'/'Editó'/'Eliminó'.
const ACCION_A_ESPANOL = {
  INSERT: 'Creó',
  UPDATE: 'Editó',
  DELETE: 'Eliminó'
};

const ACCION_A_CRUDA = {
  'Creó':    'INSERT',
  'Editó':   'UPDATE',
  'Eliminó': 'DELETE'
};

const SELECT_LISTADO = {
  id:               true,
  ip:               true,
  modulo:           true,
  accion:           true,
  tabla_afectada:   true,
  registro_id:      true,
  datos_anteriores: true,
  datos_nuevos:     true,
  fecha_evento:     true,
  usuarios:         { select: { nombre: true, usuario: true } }
};

function armarWhere(empresaId, { fecha, usuarioId, accion, modulo } = {}) {
  return {
    empresa_id: empresaId,
    ...(usuarioId && { usuario_id: usuarioId }),
    ...(modulo && { modulo }),
    ...(accion && { accion: ACCION_A_CRUDA[accion] || accion }),
    ...(fecha && {
      fecha_evento: {
        gte: new Date(`${fecha}T00:00:00.000Z`),
        lte: new Date(`${fecha}T23:59:59.999Z`)
      }
    })
  };
}

/**
 * Función de mapeo OBLIGATORIA para transformar el formato de PostgreSQL
 * al camelCase y estructura plana que requiere Auditoria.jsx.
 */
function mapearParaFrontend(log) {
  return {
    id: log.id.toString(), // BigInt a String para evitar crasheos en JSON
    usuarioNombre: log.usuarios?.nombre || null,
    usuarioUsername: log.usuarios?.usuario || null,
    ip: log.ip,
    fechaHora: log.fecha_evento,
    accion: ACCION_A_ESPANOL[log.accion] || log.accion,
    modulo: log.modulo,
    datosAnteriores: log.datos_anteriores,
    datosNuevos: log.datos_nuevos
  };
}

/**
 * Lista logs de auditoría de una empresa con filtros y paginación.
 *
 * @param {string} empresaId
 * @param {Object} filtros
 * @returns {Promise<{total: number, page: number, pageSize: number, items: Array}>}
 */
async function listar(empresaId, filtros = {}) {
  const { page = 1, pageSize = 10 } = filtros;
  const skip = (Number(page) - 1) * Number(pageSize);
  const where = armarWhere(empresaId, filtros);

  const [total, itemsDb] = await Promise.all([
    prisma.auditoria_logs.count({ where }),
    prisma.auditoria_logs.findMany({
      where,
      select:  SELECT_LISTADO,
      orderBy: { fecha_evento: 'desc' },
      skip,
      take: Number(pageSize)
    })
  ]);

  // Aquí ocurre la magia: Transformamos los datos crudos usando nuestra función
  const items = itemsDb.map(mapearParaFrontend);

  return { total, page: Number(page), pageSize: Number(pageSize), items };
}

/**
 * Devuelve todos los logs que hagan match con los filtros, sin paginar —
 * uso exclusivo del export a CSV.
 *
 * @param {string} empresaId
 * @param {Object} filtros
 * @returns {Promise<Array>}
 */
async function listarParaExport(empresaId, filtros = {}) {
  const itemsDb = await prisma.auditoria_logs.findMany({
    where:   armarWhere(empresaId, filtros),
    select:  SELECT_LISTADO,
    orderBy: { fecha_evento: 'desc' }
  });

  // Transformamos los datos también para el archivo CSV
  return itemsDb.map(mapearParaFrontend);
}

module.exports = { listar, listarParaExport, ACCION_A_ESPANOL };
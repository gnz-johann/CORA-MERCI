// src/modules/dashboard/dashboard.repository.js
// Bina 4 — Auditoría y Configuración IA (dashboard queda dentro de "Complementarios",
// mismo grupo de tickets — ver index.routes.js)
//
// MULTI-TENANT: todas las queries filtran por empresa_id.
//
// SOBRE fn_dashboard_empresa(): ya existe en db/merci_schema.sql (Bloque de
// funciones, "FUNCIÓN 9") — calcula llamadas_activas/llamadas_hoy/
// tiempo_promedio_atencion_hoy/tasa_resolucion_hoy/etc. en una sola consulta
// del lado de Postgres. Se reutiliza vía $queryRaw en vez de reescribir la
// misma lógica en Prisma — es exactamente el caso de "SQL manual porque
// Prisma no soporta esto" (llamar una función que devuelve JSONB), mismo
// precedente que worker.service.js con SELECT ... FOR UPDATE SKIP LOCKED.

'use strict';

const prisma = require('../../config/database');
const { ACCION_A_ESPANOL } = require('../auditoria/auditoria.repository');

/**
 * KPIs agregados — llama a la función de Postgres ya existente.
 * @param {string} empresaId
 * @returns {Promise<Object>} - { llamadas_activas, llamadas_hoy, tiempo_promedio_atencion_hoy, tasa_resolucion_hoy, ... }
 */
async function obtenerKpis(empresaId) {
  const [fila] = await prisma.$queryRaw`SELECT fn_dashboard_empresa(${empresaId}::uuid) AS data`;
  return fila?.data || {};
}

/**
 * Últimas llamadas registradas (para el panel "Llamadas en tiempo real").
 * No es push real (ver nota de LlamadasActivas.jsx sobre WebSocket) — es un
 * snapshot de las últimas N llamadas al momento de pedir el dashboard.
 * @param {string} empresaId
 * @param {number} limite
 */
async function obtenerLlamadasRecientes(empresaId, limite = 8) {
  return prisma.llamadas.findMany({
    where: { empresa_id: empresaId },
    select: {
      id: true,
      numero_origen: true,
      duracion_seg: true,
      fecha_inicio: true,
      agentes_virtuales: { select: { nombre: true } },
      catalogo_estado_llamada: { select: { nombre: true } }
    },
    orderBy: { fecha_registro: 'desc' },
    take: limite
  });
}

/**
 * Llamadas de las últimas `horas` horas, sin agrupar — el bucketing por hora
 * se hace en el service (Prisma no agrupa por expresión de fecha sin SQL
 * crudo; agrupar en JS sobre un solo SELECT es más simple que una función
 * nueva en Postgres para esto).
 */
async function obtenerLlamadasParaBucketPorHora(empresaId, horas = 8) {
  const desde = new Date(Date.now() - horas * 60 * 60 * 1000);
  return prisma.llamadas.findMany({
    where: { empresa_id: empresaId, fecha_inicio: { gte: desde } },
    select: { fecha_inicio: true }
  });
}

/**
 * Conteo de llamadas del día agrupadas por sentimiento (para el panel
 * "Sentimientos Hoy"). groupBy + un findMany chico de catálogo para
 * traducir sentimiento_id → nombre.
 */
async function obtenerSentimientosHoy(empresaId) {
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const grupos = await prisma.llamadas.groupBy({
    by: ['sentimiento_id'],
    where: {
      empresa_id: empresaId,
      fecha_registro: { gte: inicioHoy },
      sentimiento_id: { not: null }
    },
    _count: { _all: true }
  });

  if (grupos.length === 0) return [];

  const catalogo = await prisma.catalogo_sentimientos.findMany({
    where: { id: { in: grupos.map((g) => g.sentimiento_id) } },
    select: { id: true, nombre: true }
  });
  const nombrePorId = Object.fromEntries(catalogo.map((c) => [c.id, c.nombre]));

  return grupos.map((g) => ({
    nombre:   nombrePorId[g.sentimiento_id] || 'Sin clasificar',
    cantidad: g._count._all
  }));
}

/**
 * Agentes virtuales de la empresa con su estado y cuántas llamadas ha
 * atendido cada uno (histórico completo, no solo hoy).
 */
async function obtenerAgentesConConteo(empresaId) {
  const [agentes, conteos] = await Promise.all([
    prisma.agentes_virtuales.findMany({
      where: { empresa_id: empresaId, deleted_at: null },
      select: {
        id: true,
        nombre: true,
        catalogo_estado_agente: { select: { nombre: true } }
      },
      orderBy: { nombre: 'asc' }
    }),
    prisma.llamadas.groupBy({
      by: ['agente_id'],
      where: { empresa_id: empresaId, agente_id: { not: null } },
      _count: { _all: true }
    })
  ]);

  const conteoPorAgente = Object.fromEntries(conteos.map((c) => [c.agente_id, c._count._all]));

  return agentes.map((a) => ({
    id:                 a.id,
    nombre:             a.nombre,
    estado:             a.catalogo_estado_agente?.nombre || null,
    llamadasAtendidas:  conteoPorAgente[a.id] || 0
  }));
}

/**
 * Tickets urgentes (prioridad Crítica/Alta) que siguen sin cerrar.
 */
async function obtenerTicketsUrgentes(empresaId, limite = 5) {
  return prisma.tickets.findMany({
    where: {
      empresa_id: empresaId,
      deleted_at: null,
      catalogo_prioridad_ticket: { nombre: { in: ['Crítica', 'Alta'] } },
      catalogo_estado_ticket: { nombre: { notIn: ['Resuelto', 'Cerrado', 'Cancelado'] } }
    },
    select: {
      id:                        true,
      titulo:                    true,
      catalogo_prioridad_ticket: { select: { nombre: true } }
    },
    orderBy: { fecha_creacion: 'desc' },
    take: limite
  });
}

/**
 * Últimas entradas de auditoría de la empresa — mismo dato que ya expone
 * GET /api/auditoria, pero recortado a lo que necesita un widget del
 * dashboard (no pagina, no filtra por usuario/acción/módulo).
 */
async function obtenerActividadReciente(empresaId, limite = 6) {
  const logs = await prisma.auditoria_logs.findMany({
    where: { empresa_id: empresaId },
    select: {
      id:           true,
      accion:       true,
      modulo:       true,
      fecha_evento: true,
      usuarios:     { select: { nombre: true } }
    },
    orderBy: { fecha_evento: 'desc' },
    take: limite
  });

  return logs.map((log) => ({
    id:       log.id.toString(), // BigInt → string, mismo motivo que auditoria.repository.js
    usuario:  log.usuarios?.nombre || null,
    accion:   ACCION_A_ESPANOL[log.accion] || log.accion,
    modulo:   log.modulo,
    fecha:    log.fecha_evento
  }));
}

module.exports = {
  obtenerKpis,
  obtenerLlamadasRecientes,
  obtenerLlamadasParaBucketPorHora,
  obtenerSentimientosHoy,
  obtenerAgentesConConteo,
  obtenerTicketsUrgentes,
  obtenerActividadReciente
};

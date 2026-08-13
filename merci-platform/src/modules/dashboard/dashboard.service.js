// src/modules/dashboard/dashboard.service.js
// Bina 4 — Auditoría y Configuración IA
//
// Arma el resumen completo que pinta Dashboard.jsx en una sola respuesta.
// Todas las consultas van en paralelo (Promise.all) — son independientes
// entre sí, no hay razón para esperarlas en serie.

'use strict';

const dashboardRepository = require('./dashboard.repository');

/**
 * Arma los 8 buckets de la última `horas` horas (incluye la hora actual),
 * contando cuántas llamadas iniciaron en cada una.
 *
 * @param {Array<{fecha_inicio: Date|null}>} llamadas
 * @param {number} horas
 */
function armarLlamadasPorHora(llamadas, horas = 8) {
  const ahora = new Date();
  const buckets = [];

  for (let i = horas - 1; i >= 0; i--) {
    const hora = new Date(ahora.getTime() - i * 60 * 60 * 1000);
    buckets.push({ hora: hora.getHours(), cantidad: 0 });
  }

  for (const llamada of llamadas) {
    if (!llamada.fecha_inicio) continue;
    const horaLlamada = new Date(llamada.fecha_inicio).getHours();
    const bucket = buckets.find((b) => b.hora === horaLlamada);
    if (bucket) bucket.cantidad++;
  }

  return buckets.map((b) => ({
    hora:     `${String(b.hora).padStart(2, '0')}h`,
    cantidad: b.cantidad
  }));
}

/**
 * Convierte los conteos por sentimiento en porcentajes que suman ~100%
 * entre sí (relativo al total de llamadas de hoy CON sentimiento
 * registrado, no al total de llamadas del día).
 *
 * @param {Array<{nombre: string, cantidad: number}>} grupos
 */
function armarPorcentajesSentimiento(grupos) {
  const total = grupos.reduce((acc, g) => acc + g.cantidad, 0);
  if (total === 0) return [];

  return grupos.map((g) => ({
    nombre:     g.nombre,
    cantidad:   g.cantidad,
    porcentaje: Math.round((g.cantidad / total) * 100)
  }));
}

/**
 * Arma el resumen completo del dashboard para una empresa.
 *
 * @param {string} empresaId
 * @returns {Promise<Object>}
 */
async function obtenerResumen(empresaId) {
  const [
    kpis,
    llamadasRecientes,
    llamadasParaBucket,
    sentimientosGrupos,
    agentes,
    ticketsUrgentes,
    actividadReciente
  ] = await Promise.all([
    dashboardRepository.obtenerKpis(empresaId),
    dashboardRepository.obtenerLlamadasRecientes(empresaId),
    dashboardRepository.obtenerLlamadasParaBucketPorHora(empresaId),
    dashboardRepository.obtenerSentimientosHoy(empresaId),
    dashboardRepository.obtenerAgentesConConteo(empresaId),
    dashboardRepository.obtenerTicketsUrgentes(empresaId),
    dashboardRepository.obtenerActividadReciente(empresaId)
  ]);

  return {
    kpis: {
      llamadasActivas:    Number(kpis.llamadas_activas || 0),
      resolucionIA:       Number(kpis.tasa_resolucion_hoy || 0),
      tiempoPromedioSeg:  Number(kpis.tiempo_promedio_atencion_hoy || 0),
      llamadasHoy:        Number(kpis.llamadas_hoy || 0)
    },
    llamadasRecientes: llamadasRecientes.map((l) => ({
      id:            l.id,
      numeroOrigen:  l.numero_origen,
      agenteNombre:  l.agentes_virtuales?.nombre || null,
      estado:        l.catalogo_estado_llamada?.nombre || null,
      duracionSeg:   l.duracion_seg
    })),
    llamadasPorHora:   armarLlamadasPorHora(llamadasParaBucket),
    sentimientosHoy:   armarPorcentajesSentimiento(sentimientosGrupos),
    agentes,
    ticketsUrgentes: ticketsUrgentes.map((t) => ({
      id:        t.id,
      titulo:    t.titulo,
      prioridad: t.catalogo_prioridad_ticket?.nombre || null
    })),
    actividadReciente
  };
}

module.exports = { obtenerResumen };

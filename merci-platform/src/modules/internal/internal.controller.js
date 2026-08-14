// src/modules/internal/internal.controller.js
// Capa HTTP de la API interna. Sin lógica de negocio — ver internal.service.js.
//
// Las formas de respuesta de acá están fijadas por lo que sip-b2bua.js ya
// espera leer (confirmado línea por línea contra el archivo de referencia,
// ver .docs/Informe-implementacion-vozAI.md sección 3) — no son el formato
// libre que se usaría si diseñáramos este contrato desde cero.

'use strict';

const internalService = require('./internal.service');

/**
 * POST /internal/llamadas/iniciar
 * Body: { codigo_empresa, pbx_call_id, numero_origen }
 * El puente lee json.data.llamada_id.
 */
async function iniciarLlamada(req, res, next) {
  try {
    const resultado = await internalService.iniciarLlamada(req.body || {});
    return res.status(201).json({
      ok: true,
      mensaje: 'Llamada registrada correctamente',
      data: resultado, // { llamada_id }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /internal/llamadas/finalizar
 * Body: { llamada_id }
 * El puente solo revisa json.ok — no lee data.
 */
async function finalizarLlamada(req, res, next) {
  try {
    await internalService.finalizarLlamada(req.body || {});
    return res.status(200).json({ ok: true, mensaje: 'Fin de llamada registrado correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /internal/agentes/resolver?codigo=...
 * El puente lee json.data.instrucciones y json.data.empresa_nombre.
 */
async function resolverAgente(req, res, next) {
  try {
    const resultado = await internalService.resolverAgente({ codigo: req.query.codigo });
    return res.status(200).json({
      ok: true,
      mensaje: 'Instrucciones resueltas correctamente',
      data: resultado, // { instrucciones, empresa_nombre }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /internal/tickets/crear
 * Body: { codigo_empresa, pbx_call_id, titulo, descripcion, prioridad }
 * El puente lee json.data.ticket_id — OJO: internamente el ticket usa `id`,
 * la traducción a `ticket_id` pasa acá, no en el repository (ver
 * internal.service.js#crearTicket).
 */
async function crearTicket(req, res, next) {
  try {
    const resultado = await internalService.crearTicket(req.body || {});
    return res.status(201).json({
      ok: true,
      mensaje: 'Ticket creado correctamente',
      data: resultado, // { ticket_id }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /internal/conocimiento/consultar?codigo=...&consulta=...
 * Stub a propósito — ver internal.service.js#consultarConocimiento.
 * Responde 501 con { ok: false, mensaje } — el puente ya maneja este caso
 * con su propio fallback (le dice al modelo que no invente la respuesta).
 */
async function consultarConocimiento(req, res, next) {
  try {
    await internalService.consultarConocimiento();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  iniciarLlamada,
  finalizarLlamada,
  resolverAgente,
  crearTicket,
  consultarConocimiento,
};

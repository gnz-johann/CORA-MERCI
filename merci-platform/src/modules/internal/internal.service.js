// src/modules/internal/internal.service.js
//
// Lógica de negocio de la API interna — consumida por procesos de sistema
// (hoy: el puente de voz sip-b2bua.js, ver
// referencia-voz-bina12/voz-en-vivo/), autenticados por internalAuth
// (x-internal-api-key), no por JWT de usuario.
//
// Regla de esta capa: NO reimplementar lo que ya existe en otros módulos —
// solo traducir entre lo que el puente manda (codigo_empresa, prioridad en
// texto, pbx_call_id) y lo que los repositorios reales ya esperan
// (empresa_id UUID, prioridad_ticket_id UUID, llamada_id UUID). Ver
// .docs/Informe-implementacion-vozAI.md, sección 3, para el detalle exacto
// de cada traducción y por qué hace falta.

'use strict';

const empresasRepository = require('../empresas/empresas.repository');
const llamadasRepository = require('../llamadas/llamadas.repository');
const agentesRepository = require('../agentes/agentes.repository');
const promptsRepository = require('../prompts/prompts.repository');
const ticketsRepository = require('../tickets/tickets.repository');
const AppError = require('../../core/errors/AppError');
const NotFoundError = require('../../core/errors/NotFoundError');

/**
 * Resuelve empresa_id a partir del codigo_empresa que manda el puente
 * (parte user@ del URI SIP, ver README de referencia-voz-bina12).
 * Reusa empresasRepository.buscarPorCodigo tal cual — no se reimplementa.
 */
async function _resolverEmpresaId(codigoEmpresa) {
  if (!codigoEmpresa) {
    throw new AppError('codigo_empresa es obligatorio', 400);
  }
  const empresa = await empresasRepository.buscarPorCodigo(codigoEmpresa);
  if (!empresa) {
    throw new NotFoundError(`Empresa con codigo_empresa "${codigoEmpresa}"`);
  }
  return empresa.id;
}

/**
 * POST /internal/llamadas/iniciar
 * Reusa llamadasRepository.upsertLlamada — mismo mecanismo que ya usa el
 * sync de CDR, así que si CloudUCM reintenta el mismo pbx_call_id no se
 * duplica la llamada.
 */
async function iniciarLlamada({ codigo_empresa, pbx_call_id, numero_origen }) {
  if (!pbx_call_id) {
    throw new AppError('pbx_call_id es obligatorio', 400);
  }
  const empresaId = await _resolverEmpresaId(codigo_empresa);

  const llamada = await llamadasRepository.upsertLlamada(
    empresaId,
    pbx_call_id,
    { numero_origen: numero_origen ?? null, fecha_inicio: new Date() },
    { numero_origen: numero_origen ?? null }
  );

  return { llamada_id: llamada.id };
}

/**
 * POST /internal/llamadas/finalizar
 * Recibe llamada_id (UUID que esta misma API entregó en /iniciar) — no
 * codigo_empresa, no hace falta resolverlo de nuevo.
 */
async function finalizarLlamada({ llamada_id }) {
  if (!llamada_id) {
    throw new AppError('llamada_id es obligatorio', 400);
  }
  const llamada = await llamadasRepository.finalizarLlamada(llamada_id);
  if (!llamada) {
    throw new NotFoundError('Llamada');
  }
  return true;
}

/**
 * GET /internal/agentes/resolver?codigo=...
 *
 * Simplificación explícita: el puente no manda ningún identificador de
 * agente específico, solo codigo_empresa — así que se resuelve "el primer
 * agente_virtual activo de la empresa" (agentesRepository.obtenerTodos,
 * sin orderBy propio, primer elemento). El modelo de datos hoy no tiene un
 * campo que diga "este es el agente de la línea de voz en vivo" — si una
 * empresa llega a tener más de un agente, esta función no distingue cuál
 * usar. Documentado, no resuelto silenciosamente.
 */
async function resolverAgente({ codigo }) {
  const empresaId = await _resolverEmpresaId(codigo);
  const empresa = await empresasRepository.buscarPorId({ empresaId });

  const agentes = await agentesRepository.obtenerTodos(empresaId);
  const agente = agentes[0];
  if (!agente) {
    throw new NotFoundError('Agente virtual para esta empresa');
  }

  const promptActivo = await promptsRepository.obtenerPromptActivo(agente.id);
  if (!promptActivo) {
    throw new NotFoundError('Prompt activo para el agente de esta empresa');
  }

  return {
    instrucciones: promptActivo.prompt,
    empresa_nombre: empresa?.nombre_comercial ?? null,
  };
}

/**
 * POST /internal/tickets/crear
 *
 * Traducciones exactas pedidas:
 *   codigo_empresa (string) → empresa_id (UUID), via buscarPorCodigo
 *   prioridad (string: Baja/Media/Alta/Crítica) → prioridad_ticket_id (UUID),
 *     via ticketsRepository.buscarPrioridadPorNombre
 *
 * pbx_call_id llega en el body pero NO se traduce a llamada_id acá — no
 * estaba en el alcance pedido para esta construcción (solo empresa y
 * prioridad). El ticket queda creado sin vincular a la llamada de origen.
 * Ver .docs/Informe-implementacion-vozAI.md sección 3 para el pendiente.
 */
async function crearTicket({ codigo_empresa, pbx_call_id, titulo, descripcion, prioridad }) {
  if (!titulo || !descripcion) {
    throw new AppError('titulo y descripcion son obligatorios', 400);
  }
  const empresaId = await _resolverEmpresaId(codigo_empresa);

  let prioridadTicketId = null;
  if (prioridad) {
    const prioridadRow = await ticketsRepository.buscarPrioridadPorNombre(prioridad);
    // Si el modelo manda una prioridad que no está en el catálogo, no se
    // rechaza el ticket entero por eso — queda sin prioridad asignada.
    prioridadTicketId = prioridadRow?.id ?? null;
  }

  const ticket = await ticketsRepository.crearTicketBD({
    empresa_id: empresaId,
    titulo,
    descripcion,
    prioridad_ticket_id: prioridadTicketId,
  });

  // pbx_call_id no vinculado — ver nota arriba. Se acepta el parámetro para
  // no romper el body que el puente ya manda, aunque hoy no se use.
  void pbx_call_id;

  return { ticket_id: ticket.id };
}

/**
 * GET /internal/conocimiento/consultar
 * Stub explícito — Conocimiento IA no existe como módulo en este proyecto
 * (confirmado: no hay src/modules/conocimiento ni src/modules/documentos).
 * No se inventa una implementación — se avisa con claridad.
 */
async function consultarConocimiento() {
  throw new AppError('Conocimiento IA no está implementado todavía en MERCI.', 501);
}

module.exports = {
  iniciarLlamada,
  finalizarLlamada,
  resolverAgente,
  crearTicket,
  consultarConocimiento,
};

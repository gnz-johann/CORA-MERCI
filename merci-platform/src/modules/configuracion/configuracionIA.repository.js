// src/modules/configuracion/configuracionIA.repository.js
// Bina 4 — Auditoría y Configuración IA
//
// REGLA DE ORO (igual que pbx.repository.js, mismo folder): credenciales_ia
// (JSONB) NUNCA sale en la respuesta de un GET — SELECT_SEGURO la omite a
// propósito. El contrato de este módulo (ver
// .docs/CONTRATO_Auditoria_ConfiguracionIA.md) tampoco define todavía cómo se
// guarda/cifra esa clave — no se construyó ningún endpoint para ella aquí,
// ver el informe de esta sección.

'use strict';

const prisma = require('../../config/database');

const SELECT_SEGURO = {
  id:                 true,
  empresa_id:         true,
  voz_ia:             true,
  idioma:             true,
  timeout_seg:        true,
  proveedor_stt_id:   true,
  proveedor_tts_id:   true,
  proveedor_llm_id:   true,
  temperatura_modelo: true,
  modelo_ia:          true
  // credenciales_ia: false ← OMITIDO A PROPÓSITO
  // metadata: false        ← no lo pide el contrato, se omite también
};

/**
 * Catálogo de proveedores IA activos, opcionalmente filtrado por tipo.
 *
 * @param {string} [tipo] - 'stt' | 'tts' | 'llm'
 * @returns {Promise<Array>}
 */
function listarProveedores(tipo) {
  return prisma.catalogo_proveedores_ia.findMany({
    where: {
      deleted_at: null,
      ...(tipo && { tipo })
    },
    select:  { id: true, nombre: true, tipo: true },
    orderBy: { nombre: 'asc' }
  });
}

/**
 * Configuración IA de una empresa. null si todavía no la ha configurado.
 *
 * @param {string} empresaId
 * @returns {Promise<Object|null>}
 */
function obtenerConfig(empresaId) {
  return prisma.configuraciones_empresa.findFirst({
    where:  { empresa_id: empresaId },
    select: SELECT_SEGURO
  });
}

/**
 * Crea la configuración IA de una empresa (primera vez).
 *
 * @param {string} empresaId
 * @param {Object} datos - camelCase, ver configuracionIA.service.js
 * @returns {Promise<Object>}
 */
function crearConfig(empresaId, datos) {
  return prisma.configuraciones_empresa.create({
    data: {
      empresa_id:         empresaId,
      voz_ia:             datos.vozIa,
      idioma:             datos.idioma,
      timeout_seg:        datos.timeoutSeg,
      proveedor_stt_id:   datos.proveedorSttId,
      proveedor_tts_id:   datos.proveedorTtsId,
      proveedor_llm_id:   datos.proveedorLlmId,
      temperatura_modelo: datos.temperaturaModelo,
      modelo_ia:          datos.modeloIa
    },
    select: SELECT_SEGURO
  });
}

/**
 * Actualiza la configuración IA existente de una empresa.
 * Solo toca los campos que vienen definidos en `datos`.
 *
 * @param {string} empresaId
 * @param {string} id - UUID de la fila (viene de obtenerConfig)
 * @param {Object} datos
 * @returns {Promise<Object>}
 */
function actualizarConfig(empresaId, id, datos) {
  const dataUpdate = {
    ...(datos.vozIa             !== undefined && { voz_ia:             datos.vozIa }),
    ...(datos.idioma            !== undefined && { idioma:             datos.idioma }),
    ...(datos.timeoutSeg        !== undefined && { timeout_seg:        datos.timeoutSeg }),
    ...(datos.proveedorSttId    !== undefined && { proveedor_stt_id:   datos.proveedorSttId }),
    ...(datos.proveedorTtsId    !== undefined && { proveedor_tts_id:   datos.proveedorTtsId }),
    ...(datos.proveedorLlmId    !== undefined && { proveedor_llm_id:   datos.proveedorLlmId }),
    ...(datos.temperaturaModelo !== undefined && { temperatura_modelo: datos.temperaturaModelo }),
    ...(datos.modeloIa          !== undefined && { modelo_ia:          datos.modeloIa })
  };

  return prisma.configuraciones_empresa.update({
    where:  { id, empresa_id: empresaId }, // doble check de tenant, igual que pbx.repository.js
    data:   dataUpdate,
    select: SELECT_SEGURO
  });
}

/**
 * Busca la configuración de la empresa incluyendo credenciales_ia (cifrado).
 * USO INTERNO ÚNICAMENTE — jamás se devuelve este resultado directo al
 * cliente HTTP (mismo criterio que pbx.repository.js._obtenerConfigConCredenciales).
 *
 * @param {string} empresaId
 * @returns {Promise<Object|null>}
 */
function _obtenerConfigConCredenciales(empresaId) {
  return prisma.configuraciones_empresa.findFirst({
    where: { empresa_id: empresaId }
  });
}

/**
 * Reemplaza credenciales_ia en una fila ya existente.
 *
 * @param {string} empresaId
 * @param {string} id
 * @param {{iv: string, authTag: string, ciphertext: string}} sobreCifrado
 * @returns {Promise<Object>} - SELECT_SEGURO, sin credenciales_ia
 */
function actualizarCredenciales(empresaId, id, sobreCifrado) {
  return prisma.configuraciones_empresa.update({
    where:  { id, empresa_id: empresaId }, // doble check de tenant
    data:   { credenciales_ia: sobreCifrado },
    select: SELECT_SEGURO
  });
}

/**
 * Crea la fila de configuración de la empresa solo con credenciales_ia
 * (primera vez que guarda una clave, sin haber pasado antes por PUT /empresa).
 *
 * @param {string} empresaId
 * @param {{iv: string, authTag: string, ciphertext: string}} sobreCifrado
 * @returns {Promise<Object>} - SELECT_SEGURO, sin credenciales_ia
 */
function crearConCredenciales(empresaId, sobreCifrado) {
  return prisma.configuraciones_empresa.create({
    data:   { empresa_id: empresaId, credenciales_ia: sobreCifrado },
    select: SELECT_SEGURO
  });
}

module.exports = {
  listarProveedores,
  obtenerConfig,
  crearConfig,
  actualizarConfig,
  _obtenerConfigConCredenciales,
  actualizarCredenciales,
  crearConCredenciales
};

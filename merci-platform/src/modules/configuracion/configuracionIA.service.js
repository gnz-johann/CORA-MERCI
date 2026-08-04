// src/modules/configuracion/configuracionIA.service.js
// Bina 4 — Auditoría y Configuración IA

'use strict';

const configuracionIARepository = require('./configuracionIA.repository');
const credencialesCrypto        = require('../../core/utils/credencialesIA.crypto');
const audit                     = require('../../services/audit.service');
const AppError                  = require('../../core/errors/AppError');

const TIPOS_VALIDOS = ['stt', 'tts', 'llm'];

// temperatura_modelo es Decimal en Prisma — convertir a Number nativo antes
// de mandarlo al cliente, mismo criterio que ya usa AIProviderFactory.js
// (Decimal no es serializable en JSON directamente).
function formatearConfig(config) {
  if (!config) return null;
  return {
    vozIa:             config.voz_ia,
    idioma:            config.idioma,
    timeoutSeg:        config.timeout_seg,
    proveedorSttId:    config.proveedor_stt_id,
    proveedorTtsId:    config.proveedor_tts_id,
    proveedorLlmId:    config.proveedor_llm_id,
    temperaturaModelo: config.temperatura_modelo != null ? parseFloat(config.temperatura_modelo) : null,
    modeloIa:          config.modelo_ia
  };
}

/**
 * @param {string} [tipo] - 'stt' | 'tts' | 'llm'
 * @throws {AppError} - si tipo viene pero no es uno de los 3 válidos
 */
async function listarProveedores(tipo) {
  if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
    throw new AppError(`Tipo de proveedor inválido: ${tipo}. Use stt, tts o llm`, 400);
  }
  return configuracionIARepository.listarProveedores(tipo);
}

/**
 * @param {string} empresaId
 * @returns {Promise<Object|null>} - null si la empresa no ha configurado IA todavía
 */
async function obtenerConfig(empresaId) {
  const config = await configuracionIARepository.obtenerConfig(empresaId);
  return formatearConfig(config);
}

/**
 * Crea o actualiza la configuración IA de la empresa — mismo patrón manual
 * de upsert que pbxService.guardarConfigPbx (buscar, si existe actualizar,
 * si no crear). Registra el cambio en auditoria_logs vía audit.log().
 *
 * @param {string} empresaId
 * @param {Object} datos - camelCase, ver formatearConfig()
 * @param {Object} contexto
 * @param {string} contexto.usuarioId
 * @param {string} contexto.ip
 * @returns {Promise<Object>}
 */
async function guardarConfig(empresaId, datos, { usuarioId, ip }) {
  const existente = await configuracionIARepository.obtenerConfig(empresaId);

  const guardado = existente
    ? await configuracionIARepository.actualizarConfig(empresaId, existente.id, datos)
    : await configuracionIARepository.crearConfig(empresaId, datos);

  await audit.log({
    usuarioId, empresaId, ip,
    modulo:      'configuracion_ia',
    accion:      existente ? 'UPDATE' : 'INSERT',
    tabla:       'configuraciones_empresa',
    registroId:  guardado.id,
    datosAntes:  existente ? formatearConfig(existente) : null,
    datosNuevos: formatearConfig(guardado)
  });

  return formatearConfig(guardado);
}

/**
 * Guarda (reemplaza por completo, semántica PUT — no hace merge con lo
 * anterior) las credenciales de proveedores IA de la empresa, cifradas con
 * AES-256-GCM. Nunca se registra el valor real de una clave en
 * auditoria_logs — solo qué nombres de clave quedaron configurados, para
 * que GET /auditoria jamás pueda filtrar un secreto en texto plano.
 *
 * @param {string} empresaId
 * @param {Object} credenciales - ej. { openai_api_key: 'sk-...' }
 * @param {Object} contexto
 * @param {string} contexto.usuarioId
 * @param {string} contexto.ip
 * @returns {Promise<{proveedoresConfigurados: string[]}>}
 * @throws {AppError} - si `credenciales` no es un objeto plano
 */
async function guardarCredenciales(empresaId, credenciales, { usuarioId, ip }) {
  if (!credenciales || typeof credenciales !== 'object' || Array.isArray(credenciales)) {
    throw new AppError('credenciales debe ser un objeto { nombreClave: valor }', 400);
  }

  const existente = await configuracionIARepository._obtenerConfigConCredenciales(empresaId);

  let nombresAnteriores = [];
  if (existente?.credenciales_ia) {
    try {
      nombresAnteriores = Object.keys(credencialesCrypto.descifrar(existente.credenciales_ia));
    } catch {
      // dato viejo/corrupto o cifrado con otra clave — no debe tumbar el guardado nuevo
      nombresAnteriores = ['(valor anterior no se pudo leer)'];
    }
  }

  const sobreCifrado = credencialesCrypto.cifrar(credenciales);

  const guardado = existente
    ? await configuracionIARepository.actualizarCredenciales(empresaId, existente.id, sobreCifrado)
    : await configuracionIARepository.crearConCredenciales(empresaId, sobreCifrado);

  await audit.log({
    usuarioId, empresaId, ip,
    modulo:      'configuracion_ia',
    accion:      existente ? 'UPDATE' : 'INSERT',
    tabla:       'configuraciones_empresa',
    registroId:  guardado.id,
    datosAntes:  { proveedoresConfigurados: nombresAnteriores },
    datosNuevos: { proveedoresConfigurados: Object.keys(credenciales) }
  });

  return { proveedoresConfigurados: Object.keys(credenciales) };
}

module.exports = { listarProveedores, obtenerConfig, guardarConfig, guardarCredenciales };

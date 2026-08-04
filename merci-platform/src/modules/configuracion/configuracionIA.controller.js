// src/modules/configuracion/configuracionIA.controller.js
// Bina 4 — Auditoría y Configuración IA
// Capa HTTP del módulo de configuración IA. Sin lógica de negocio.

'use strict';

const configuracionIAService = require('./configuracionIA.service');

/**
 * GET /api/configuracion/proveedores-ia
 * Query opcional: ?tipo=stt|tts|llm
 */
async function listarProveedores(req, res, next) {
  try {
    const proveedores = await configuracionIAService.listarProveedores(req.query.tipo);

    return res.status(200).json({
      ok:      true,
      mensaje: 'Catálogo obtenido correctamente',
      data:    proveedores
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/configuracion/empresa
 * Config IA de la empresa del usuario logueado. data: null si aún no la configuró.
 */
async function obtenerConfig(req, res, next) {
  try {
    const config = await configuracionIAService.obtenerConfig(req.empresaId);

    return res.status(200).json({
      ok:      true,
      mensaje: 'Configuración obtenida correctamente',
      data:    config
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/configuracion/empresa
 * Crea o actualiza la configuración IA de la empresa.
 */
async function guardarConfig(req, res, next) {
  try {
    const config = await configuracionIAService.guardarConfig(
      req.empresaId,
      req.body,
      { usuarioId: req.user.usuarioId, ip: req.ip }
    );

    return res.status(200).json({
      ok:      true,
      mensaje: 'Configuración guardada correctamente',
      data:    config
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/configuracion/credenciales-ia
 * Body: { credenciales: { openai_api_key: 'sk-...', ... } }
 * Reemplaza por completo el set guardado (semántica PUT, no merge).
 * Nunca devuelve las claves — solo qué nombres quedaron configurados.
 */
async function guardarCredenciales(req, res, next) {
  try {
    const resultado = await configuracionIAService.guardarCredenciales(
      req.empresaId,
      req.body?.credenciales,
      { usuarioId: req.user.usuarioId, ip: req.ip }
    );

    return res.status(200).json({
      ok:      true,
      mensaje: 'Credenciales guardadas correctamente',
      data:    resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listarProveedores, obtenerConfig, guardarConfig, guardarCredenciales };

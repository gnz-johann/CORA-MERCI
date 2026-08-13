// src/modules/extensiones/extensiones.controller.js
// Bina 3 — CloudUCM, Llamadas y PBX
// Capa HTTP del módulo de extensiones. Sin lógica de negocio.

'use strict';

const extensionesService = require('./extensiones.service');

/**
 * GET /api/extensiones
 * Lista las extensiones de la empresa almacenadas en BD.
 * Permiso requerido: extensiones.ver
 */
async function listar(req, res, next) {
  try {
    const resultado = await extensionesService.listarExtensiones(req.empresaId);

    return res.status(200).json({
      ok:      true,
      mensaje: 'Extensiones obtenidas correctamente',
      data:    resultado
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/extensiones/sync
 * Sincroniza las extensiones del PBX de CloudUCM hacia la BD de MERCI.
 * Permiso requerido: extensiones.sync
 *
 * No requiere body — usa las credenciales guardadas en configuraciones_pbx.
 * Si no hay configuración PBX activa, devuelve 404.
 * Si CloudUCM no responde, devuelve 502 controlado.
 */
async function sincronizar(req, res, next) {
  try {
    const resultado = await extensionesService.sincronizarExtensiones(req.empresaId);

    return res.status(200).json({
      ok:      true,
      mensaje: `Sincronización ${resultado.status}: ${resultado.sincronizadas} extensiones procesadas`,
      data:    resultado
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/extensiones
 * Crea una extensión nueva: primero en CloudUCM (addSIPAccountAndUser +
 * applyChanges si hace falta), y solo si eso sale bien, la refleja en BD.
 * Permiso requerido: extensiones.crear
 *
 * Body esperado:
 *   { "extension": "1010", "nombre": "Ventas 03", "secret": "...", "cidnumber": "...", "permission": "internal" }
 *
 * Si CloudUCM no está disponible o los datos son inválidos, el error llega
 * con `categoria` ('conexion'|'validacion'|'sistema') en el JSON de
 * respuesta — ver error.middleware.js.
 */
async function crear(req, res, next) {
  try {
    const extension = await extensionesService.crearExtension(req.empresaId, req.body);

    return res.status(201).json({
      ok:      true,
      mensaje: 'Extensión creada correctamente',
      data:    extension
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/extensiones/:id
 * Borra (lógicamente) una extensión de la BD local de MERCI.
 * Permiso requerido: extensiones.eliminar
 *
 * No toca CloudUCM — ver nota en extensiones.service.js#eliminarExtension.
 */
async function eliminar(req, res, next) {
  try {
    const { id } = req.params;
    const eliminada = await extensionesService.eliminarExtension(id, req.empresaId);

    if (!eliminada) {
      return res.status(404).json({ ok: false, mensaje: 'Extensión no encontrada', data: null });
    }

    return res.status(200).json({
      ok:      true,
      mensaje: 'Extensión eliminada correctamente',
      data:    eliminada
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, sincronizar, crear, eliminar };
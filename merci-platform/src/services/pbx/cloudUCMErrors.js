// src/services/pbx/cloudUCMErrors.js
// Bina 3 — CloudUCM, Llamadas y PBX
//
// Traduce los códigos de status numéricos que devuelve CloudUCM (Grandstream)
// a algo que el resto del sistema puede usar: una categoría (para que la UI
// decida cómo reaccionar) y un mensaje en español explicando qué pasó y qué
// hacer. Tabla y descripciones en inglés fuente:
// .docs/IPPBX-HTTPS-API-Documentation-Center.pdf, sección "Error Return Codes"
// (confirmado contra el PDF real antes de escribir esta tabla, no inventado).
//
// Nunca debe llegar un status crudo de CloudUCM hasta el controller —
// CloudUCMProvider.js usa esto en cada método antes de devolver o lanzar.

'use strict';

const AppError = require('../../core/errors/AppError');

const TABLA_ERRORES = {
  // ─── Conexión ─────────────────────────────────────────────────────────────
  '-5': {
    categoria: 'conexion',
    mensaje: 'No se pudo autenticar con la central telefónica. Verifica la configuración de conexión en Configuración → PBX.'
  },
  '-6': {
    categoria: 'conexion',
    mensaje: 'La sesión con la central telefónica expiró. Estamos reconectando — si el problema persiste, revisa la conexión.'
  },
  '-7': {
    categoria: 'conexion',
    mensaje: 'Se perdió la conexión con la central telefónica. Verifica que esté encendida y accesible en la red.'
  },
  '-8': {
    categoria: 'conexion',
    mensaje: 'La central telefónica tardó demasiado en responder. Intenta de nuevo en unos momentos.'
  },
  '-37': {
    categoria: 'conexion',
    mensaje: 'El usuario o la contraseña configurados para la central telefónica son incorrectos. Corrígelos en Configuración → PBX.'
  },

  // ─── Validación ───────────────────────────────────────────────────────────
  '-1': {
    categoria: 'validacion',
    mensaje: 'Alguno de los datos del formulario no es válido para la central telefónica. Revísalos.'
  },
  '-15': {
    categoria: 'validacion',
    mensaje: 'Uno de los valores ingresados no es válido.'
  },
  '-16': {
    categoria: 'validacion',
    mensaje: 'Este elemento ya no existe en la central telefónica. Actualiza la página.'
  },
  '-43': {
    categoria: 'validacion',
    mensaje: 'La información cambió mientras trabajabas. Actualiza la página e intenta de nuevo.'
  },
  '-44': {
    categoria: 'validacion',
    mensaje: 'Ya existe una extensión con ese número en la central telefónica.'
  },

  // ─── Sistema ──────────────────────────────────────────────────────────────
  '-9': {
    categoria: 'sistema',
    mensaje: 'Ocurrió un error inesperado en la central telefónica. Intenta de nuevo más tarde.'
  },
  '-19': {
    categoria: 'sistema',
    mensaje: 'Esta acción no es compatible con tu central telefónica.'
  },
  '-24': {
    categoria: 'sistema',
    mensaje: 'No se pudo completar la operación en la central telefónica. Intenta de nuevo.'
  },
  '-25': {
    categoria: 'sistema',
    mensaje: 'No se pudo completar la operación en la central telefónica. Intenta de nuevo.'
  },
  '-26': {
    categoria: 'sistema',
    mensaje: 'No se pudo completar la operación en la central telefónica. Intenta de nuevo.'
  },
  '-45': {
    categoria: 'sistema',
    mensaje: 'Se están haciendo demasiadas operaciones al mismo tiempo. Espera unos segundos e intenta de nuevo.'
  },
  '-46': {
    categoria: 'sistema',
    mensaje: 'Se están haciendo demasiadas operaciones al mismo tiempo. Espera unos segundos e intenta de nuevo.'
  }
};

// HTTP status que corresponde a cada categoría al construir un error lanzable.
const HTTP_STATUS_POR_CATEGORIA = {
  conexion: 502,
  validacion: 400,
  sistema: 502
};

/**
 * @param {number|string} status - código numérico devuelto por CloudUCM (ej. -37)
 * @returns {{categoria: 'conexion'|'validacion'|'sistema', mensaje: string}}
 */
function obtenerErrorCloudUCM(status) {
  const entrada = TABLA_ERRORES[String(status)];
  if (entrada) return entrada;

  // Código no documentado en la tabla — no se inventa un mensaje específico.
  // Se trata como error de sistema (no bloquea la UI como 'conexion' haría,
  // pero tampoco se presenta como un error de validación del usuario, que
  // no lo es).
  return {
    categoria: 'sistema',
    mensaje: `La central telefónica devolvió un error no reconocido (código ${status}). Intenta de nuevo o contacta a soporte.`
  };
}

/**
 * Construye un AppError listo para `throw`/`next()` a partir de un status de
 * CloudUCM, con `categoria` agregado — mismo mecanismo de error que ya usa
 * el resto del backend (error.middleware.js lo serializa por
 * `statusCode`/`message`, y ahora también por `categoria` si está presente).
 *
 * @param {number|string} status
 * @returns {AppError} - con .categoria y .cloudUCMStatus agregados
 */
function crearErrorCloudUCM(status) {
  const { categoria, mensaje } = obtenerErrorCloudUCM(status);
  const error = new AppError(mensaje, HTTP_STATUS_POR_CATEGORIA[categoria] || 502);
  error.categoria = categoria;
  error.cloudUCMStatus = Number(status);
  return error;
}

module.exports = { obtenerErrorCloudUCM, crearErrorCloudUCM, TABLA_ERRORES };

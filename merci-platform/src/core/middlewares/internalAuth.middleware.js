// src/core/middlewares/internalAuth.middleware.js
//
// Autenticación para la superficie de API interna (src/modules/internal/) —
// consumida por procesos de sistema sin usuario humano detrás (hoy: el
// puente de voz sip-b2bua.js, ver referencia-voz-bina12/voz-en-vivo/), no
// por navegadores con sesión. Mismo motivo que webhooks.routes.js para no
// usar `authenticate` (JWT): un proceso de telefonía no tiene ni puede tener
// un usuario logueado. A diferencia de webhooks (que no valida credencial
// alguna, solo confía en el número de destino conocido), acá SÍ hay un
// secreto compartido de por medio porque estos endpoints escriben datos
// (llamadas, tickets) a nombre de cualquier empresa, no solo reaccionan a
// eventos de un número ya registrado.
//
// Header esperado: x-internal-api-key: <INTERNAL_API_KEY>

'use strict';

const crypto = require('crypto');
const env = require('../../config/env');

function compararConstante(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  // timingSafeEqual exige buffers del mismo largo — si difieren, ya sabemos
  // que no coinciden, pero igual comparamos contra sí mismo para no filtrar
  // por timing si alguien manda una key de largo distinto a propósito.
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Exige el header x-internal-api-key y lo compara contra INTERNAL_API_KEY.
 * Si INTERNAL_API_KEY no está configurada (feature sin desplegar todavía),
 * rechaza todo con 503 — nunca deja pasar una request sin key configurada.
 */
function internalAuth(req, res, next) {
  if (!env.INTERNAL_API_KEY) {
    return res.status(503).json({
      ok: false,
      mensaje: 'API interna no configurada (falta INTERNAL_API_KEY en el servidor).',
    });
  }

  const keyRecibida = req.headers['x-internal-api-key'];
  if (!keyRecibida || !compararConstante(keyRecibida, env.INTERNAL_API_KEY)) {
    return res.status(401).json({ ok: false, mensaje: 'x-internal-api-key inválida o ausente.' });
  }

  next();
}

module.exports = internalAuth;

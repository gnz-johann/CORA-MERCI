// src/core/utils/credencialesIA.crypto.js
// Cifrado AES-256-GCM real para configuraciones_empresa.credenciales_ia,
// con el módulo nativo `crypto` de Node — sin librerías externas.
//
// También lo reutiliza configuraciones_pbx.credenciales (ver
// src/modules/configuracion/pbx.repository.js, Bina 3) — su comentario
// decía "las credenciales se guardan encriptadas" pero el código real no
// cifraba nada hasta que se corrigió reusando exactamente esta función, sin
// escribir un segundo mecanismo de cifrado.
//
// Formato guardado en la columna JSONB: { iv, authTag, ciphertext }, los
// tres en hex. La clave sale de env.CREDENCIALES_IA_ENCRYPTION_KEY (32 bytes
// en hex = 64 caracteres) — nunca hardcodeada, nunca en el código.

'use strict'

const crypto = require('crypto')
const env = require('../../config/env')

const ALGORITMO = 'aes-256-gcm'
const IV_BYTES = 12 // tamaño recomendado del IV para GCM (NIST SP 800-38D)

function obtenerClave() {
  const clave = Buffer.from(env.CREDENCIALES_IA_ENCRYPTION_KEY, 'hex')
  if (clave.length !== 32) {
    throw new Error(
      'CREDENCIALES_IA_ENCRYPTION_KEY debe decodificar a 32 bytes (64 caracteres hex) para AES-256-GCM'
    )
  }
  return clave
}

/**
 * Cifra un objeto (ej. { openai_api_key: 'sk-...' }) para guardarlo tal cual
 * en la columna JSONB credenciales_ia.
 *
 * @param {Object} datos
 * @returns {{iv: string, authTag: string, ciphertext: string}}
 */
function cifrar(datos) {
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITMO, obtenerClave(), iv)
  const textoPlano = JSON.stringify(datos)
  const cifrado = Buffer.concat([cipher.update(textoPlano, 'utf8'), cipher.final()])

  return {
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
    ciphertext: cifrado.toString('hex'),
  }
}

/**
 * Descifra el sobre guardado en credenciales_ia de vuelta al objeto original.
 * GCM valida el authTag — si el dato fue alterado o la clave no es la misma
 * con la que se cifró, lanza en vez de devolver basura silenciosamente.
 *
 * @param {{iv: string, authTag: string, ciphertext: string}} sobre
 * @returns {Object}
 */
function descifrar(sobre) {
  const decipher = crypto.createDecipheriv(ALGORITMO, obtenerClave(), Buffer.from(sobre.iv, 'hex'))
  decipher.setAuthTag(Buffer.from(sobre.authTag, 'hex'))
  const descifrado = Buffer.concat([
    decipher.update(Buffer.from(sobre.ciphertext, 'hex')),
    decipher.final(),
  ])
  return JSON.parse(descifrado.toString('utf8'))
}

module.exports = { cifrar, descifrar }

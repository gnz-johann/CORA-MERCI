// src/utils/avatarColor.js
// ─────────────────────────────────────────────────────────────────────────────
// Paleta de colores para avatares de usuario.
//
// Regla de asignación: el color se deriva DETERMINISTAMENTE del usuarioId.
// Mismo userId → mismo color siempre, en cualquier tabla, panel o componente.
// No se almacena en BD — se calcula al vuelo en el frontend.
//
// Para agregar colores: añade el hex al array AVATAR_COLORS.
// Para cambiar colores: modifica el hex — TODOS los usuarios que tenían ese
// color obtendrán uno nuevo (hash determinista, no garantiza estabilidad
// si cambias el array).
// ─────────────────────────────────────────────────────────────────────────────

export const AVATAR_COLORS = [
  '#E63946', // rojo
  '#F4A261', // naranja suave
  '#2A9D8F', // verde azulado
  '#8338EC', // violeta
  '#F72585', // fucsia
  '#06D6A0', // esmeralda
  '#FB8500', // ámbar
  '#3A86FF', // azul brillante
  '#9B2226', // rojo oscuro
  '#7209B7', // púrpura
  '#4CC9F0', // celeste
  '#38B000', // verde
]

function hexToRgb(hex) {
  const value = hex.replace('#', '')

  return {
    r: parseInt(value.substring(0, 2), 16),
    g: parseInt(value.substring(2, 4), 16),
    b: parseInt(value.substring(4, 6), 16),
  }
}

function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  )
}

function adjustColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex)

  return rgbToHex(
    r + amount,
    g + amount,
    b + amount
  )
}

/**
 * Retorna un color de la paleta de forma determinista para un usuarioId dado.
 * El mismo userId siempre retorna el mismo color independientemente del
 * contexto o del momento en que se llame.
 *
 * @param {string} usuarioId - UUID del usuario
 * @returns {string} Color hex, ej. '#E63946'
 */
export function getAvatarColor(usuarioId) {
  if (!usuarioId) return AVATAR_COLORS[0]

  let hash = 0
  for (let i = 0; i < usuarioId.length; i++) {
    hash = usuarioId.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash | 0 // Forzar entero de 32 bits
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function getAvatarGradient(usuarioId) {
  const base = getAvatarColor(usuarioId)

  return {
    light: adjustColor(base, 35),
    base,
    dark: adjustColor(base, -40),
  }
}
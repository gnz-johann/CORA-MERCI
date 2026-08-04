// src/utils/rolColor.js
// ─────────────────────────────────────────────────────────────────────────────
// Paleta de colores para ROLES. A diferencia del avatar de usuario
// (avatarColor.js, que es determinístico por hash del usuarioId), el color
// de un rol es ALEATORIO al momento de su creación y se guarda en BD —
// así cada rol conserva su color propio aunque cambie de nombre o el orden
// de creación varíe entre roles.
//
// ⚠️ Requiere un cambio de backend para persistir de verdad (ver nota al
// final de RolesYPermisos.jsx): agregar el campo `color` a catalogo_roles
// y que roles.repository.crear() lo reciba y guarde. Mientras eso no esté,
// el color se ve bien al crear el rol pero se pierde al recargar la página.
// ─────────────────────────────────────────────────────────────────────────────

export const ROL_COLORS = [
  '#F59E0B', // ámbar
  '#3B82F6', // azul
  '#8B5CF6', // violeta
  '#06B6D4', // cyan
  '#10B981', // esmeralda
  '#EF4444', // rojo
  '#EC4899', // rosa
  '#84CC16', // lima
]

/**
 * Elige un color al azar de la paleta, evitando repetir uno que ya esté
 * en uso por otro rol de la misma empresa (si hay colores libres).
 * Si todos los colores de la paleta ya están en uso, elige uno al azar
 * sin restricción (mejor repetir color que fallar).
 *
 * @param {string[]} coloresEnUso - colores (hex) que ya tienen otros roles
 * @returns {string} color hex de la paleta
 */
export function elegirColorRol(coloresEnUso = []) {
  const libres = ROL_COLORS.filter((c) => !coloresEnUso.includes(c))
  const disponibles = libres.length > 0 ? libres : ROL_COLORS
  const index = Math.floor(Math.random() * disponibles.length)
  return disponibles[index]
}

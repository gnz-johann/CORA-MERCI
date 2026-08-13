# Prioridad 2 — Extensiones: `DELETE /api/extensiones/:id`

## Qué se hizo
- Backend: nuevo endpoint `DELETE /api/extensiones/:id` — borrado lógico (`deleted_at`)
  en la tabla `extensiones` de MERCI. **No toca CloudUCM** — no llama a `deleteUser` ni a
  ninguna acción de la API del PBX.
- Frontend: el modal de confirmación que ya existía en `Extensiones.jsx` (`DeleteModal`)
  ahora llama al endpoint real vía `extensionesService.eliminar(id)`, con estado de carga
  (`eliminando`) y manejo de error por toast — antes solo hacía
  `setExtensiones((prev) => prev.filter(...))`, un `filter` puramente local que nunca llegaba
  al backend.

## Por qué soft-delete y no borrado físico
Se revisó el patrón ya usado en el resto del proyecto antes de decidir — no es una elección
arbitraria:
- `agentes.repository.js#eliminarLogico` — mismo patrón exacto (`deleted_at: new Date()`).
- `tickets.repository.js#eliminarTicketBD` — mismo patrón.
- `extensiones` ya tenía la columna `deleted_at` desde antes (se usa para filtrar en
  `listarExtensiones`), así que ni siquiera hizo falta tocar el schema.

Es la única tabla de las tres (`extensiones`, `agentes_virtuales`, `tickets`) donde un
borrado físico hubiera roto la convención ya establecida sin ninguna razón nueva que lo
justifique.

## Cómo — capas tocadas
- `extensiones.repository.js`: `obtenerPorId(id, empresaId)` (verifica pertenencia a la
  empresa) y `eliminarLogico(id)`.
- `extensiones.service.js`: `eliminarExtension(id, empresaId)` — verifica existencia con
  `obtenerPorId` antes de borrar (devuelve `null` si no existe o es de otra empresa, mismo
  patrón que `agentesService.eliminarAgente`).
- `extensiones.controller.js`: `eliminar(req, res, next)` — 404 si no existe, 200 con el
  registro borrado si sale bien.
- `extensiones.routes.js`: `router.delete('/:id', requirePermission('extensiones.eliminar'), ...)`.
  El permiso `extensiones.eliminar` ya estaba sembrado en `db/merci_schema.sql` (línea 531),
  no hizo falta agregarlo.
- `client/src/services/extensiones.service.js`: `eliminar: (id) => api.delete(...)`.
- `client/src/pages/Extensiones.jsx`: `handleEliminar` ahora es async y llama al servicio
  real; `DeleteModal` recibe `eliminando` para deshabilitar los botones mientras la request
  está en curso y mostrar "Eliminando...". Se quitó el texto que decía "todavía no está
  conectado al backend real".

## Verificación
- `node --check` en los 4 archivos de backend tocados — sin errores de sintaxis.
- No se ejecutó contra CloudUCM en ningún momento (no aplica — el endpoint no lo toca).

## Pendiente / decisión no tomada
- No se implementó ninguna acción para borrar la cuenta SIP real en CloudUCM (`deleteUser`,
  documentada en el PDF de la API pero no implementada en `CloudUCMProvider.js`). Es una
  decisión aparte y explícitamente fuera de este pedido ("sin relación con CloudUCM en
  vivo").

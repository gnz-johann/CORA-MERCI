# Tickets — implementa `GET /tickets/catalogos` (dejó de ser un stub)

## Qué se hizo
`obtenerCatalogos` en `tickets.controller.js` era un stub que solo respondía
`{ ok: true, mensaje: 'Pendiente lógica catálogos' }`, sin tocar la base de datos. Se
implementó de verdad: consulta `catalogo_estado_ticket` y `catalogo_prioridad_ticket`
(filas no eliminadas) y devuelve `{ data: { estados: [...], prioridades: [...] } }`, cada
una con `id`/`nombre`.

## Por qué
El frontend (`Tickets.jsx`) armaba su catálogo de opciones a partir de lo que ya traía la
lista de tickets cargada — cubría solo 3 de 6 estados y 2 de 4 prioridades (las que ya usaba
algún ticket existente), porque este endpoint nunca devolvió datos reales.

## Cómo
- **Se verificó antes de sembrar nada**: se consultaron ambas tablas directo contra Postgres
  — ya estaban sembradas completas (6 estados: Abierto/En Proceso/Pendiente/Resuelto/Cerrado/
  Cancelado; 4 prioridades: Baja/Media/Alta/Crítica, vía `db/merci_schema.sql`). **No hizo
  falta sembrar nada** — el pedido de sembrar un catálogo de respaldo era condicional ("si
  están vacías") y no aplicó.
- Se agregó `obtenerCatalogosBD()` en `tickets.repository.js` (mismo patrón del módulo:
  controller llama al repository directo, sin service — `tickets.service.js` sigue siendo
  código muerto, no se tocó). Sin `orderBy`: no hay columna de orden en el schema, y ordenar
  alfabético hubiera roto la secuencia lógica del flujo (Abierto → En Proceso → Pendiente →
  Resuelto → Cerrado/Cancelado).
- `catalogo_estado_ticket`/`catalogo_prioridad_ticket` son catálogos globales (no llevan
  `empresa_id`) — el endpoint no filtra por tenant, es el mismo catálogo para cualquier
  empresa.

## Archivos tocados
- `src/modules/tickets/tickets.repository.js` (editado — nueva función `obtenerCatalogosBD`)
- `src/modules/tickets/tickets.controller.js` (editado — `obtenerCatalogos` ya no es un stub)

## Pendiente / riesgos
- **El punto clave, verificado con una prueba real de punta a punta**: se creó un ticket con
  `estado_ticket_id`/`prioridad_ticket_id` reales del catálogo, se cambió su estado vía
  `PUT /tickets/:id` (`Abierto` → `En Proceso`), y un `GET` posterior confirmó que el cambio
  persistió en Postgres. También se probó `usuario_responsable_id` por separado — se asignó
  un responsable a un ticket sin responsable y persistió. Los 3 nombres de campo que manda el
  frontend (`estado_ticket_id`, `prioridad_ticket_id`, `usuario_responsable_id`) coinciden
  exacto con lo que `actualizarTicketBD` espera — no había desajuste esta vez, pero se
  verificó explícitamente porque ya había pasado antes.
- **Inconsistencia menor encontrada, no corregida**: `actualizarTicketBD` (el `PUT`) no
  incluye `catalogo_estado_ticket`/`catalogo_prioridad_ticket` en su respuesta (a diferencia
  de `crearTicketBD`, que sí los incluye) — el `PUT` devuelve el ticket crudo con solo los
  IDs, no los objetos anidados con nombre. No rompe nada en `Tickets.jsx` porque después de
  editar se vuelve a pedir la lista completa (`GET /tickets`), pero si algún consumidor futuro
  esperara la forma completa en la respuesta del `PUT` mismo, se llevaría una sorpresa. No se
  tocó porque no se pidió y no bloqueaba el flujo actual.
- Todos los tickets de prueba creados durante la verificación se borraron (soft delete) al
  terminar — no quedó basura en la empresa demo del seed.

## Pertenece a otra bina?
Sí — `tickets.*` es de Bina 3. Se completó un stub ya existente del módulo, no se creó nada
nuevo fuera de su alcance original.

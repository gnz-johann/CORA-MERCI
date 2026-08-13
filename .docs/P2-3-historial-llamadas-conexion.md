# Prioridad 2 — Historial de Llamadas: conectado al backend real

## Qué se hizo
- `HistorialLlamadas.jsx` conectado a `GET /api/llamadas` (carga inicial) y
  `POST /api/llamadas/sync-cdr` (botón "Actualizar" nuevo) — **ambos endpoints ya existían
  completos y reales del lado del backend** (`src/modules/llamadas/`), no fue necesario
  tocar nada ahí. Se quitó por completo el array `mockLlamadas` (6 registros fijos que vivían
  al tope del archivo desde la reconstrucción de la Sección 1.0.3).
- Se agregó el botón "Actualizar" pedido, junto al de "Exportar CSV" — dispara
  `sincronizarCDR()` y, si sale bien, recarga la lista.

## Servicio de frontend — ya existía, solo le faltaba un método
`client/src/services/llamadas.service.js` ya existía y ya estaba verificado contra el
backend real (el comentario del archivo dice explícitamente "confirmado llamando al backend
real"). Solo le faltaba `sincronizarCDR`, que se agregó siguiendo el mismo patrón que
`listar`/`obtenerDetalle`.

## Diferencia de forma de los datos — mock vs. real
El mock usaba campos planos inventados (`agente_nombre`, `estado`, `resultado`,
`sentimiento` como strings sueltos). La respuesta real de Prisma trae objetos anidados
(`agentes_virtuales.nombre`, `catalogo_estado_llamada.nombre`,
`catalogo_resultado_llamada.nombre`, `catalogo_sentimientos.nombre`) — se verificó el shape
exacto corriendo `llamadasRepository.listarLlamadas()` directo contra Postgres antes de
escribir el JSX, no se asumió. Toda la tabla, el modal de detalle y el export CSV se
reescribieron para leer esos campos anidados (mismo patrón que ya usa
`LlamadasActivas.jsx`, que ya estaba conectado desde antes).

## El detalle (transcripción, sentimiento) no viene en el listado
`GET /api/llamadas` devuelve una selección reducida de campos (`SELECT_LISTADO` en el
repository, sin `transcripcion` ni `catalogo_sentimientos`) — el diseño real del backend
separa listado de detalle a propósito. Por eso, al abrir el modal de una llamada, ahora se
hace una segunda llamada a `GET /api/llamadas/:id` (`obtenerDetalle`) para traer el registro
completo, con un estado de carga (`cargandoDetalle`) dentro del modal mientras llega.

## Limitación real que quedó documentada, no oculta
El backend (`llamadas.repository.js#listarLlamadas`) solo filtra server-side por
`desde`/`hasta`/`estado` — no tiene filtro de teléfono ni de agente, y no tiene un endpoint
de export CSV real. Esto ya estaba anotado como bloqueante en `client/CLAUDE.md`
("HistorialLlamadas.jsx... bloqueada hasta que el backend tenga export CSV y filtros de
teléfono/agente") — se conectó igual porque me lo pediste de forma directa y explícita en
esta instrucción, que es el aviso que la situación exige, no un permiso tácito. La solución
adoptada:
- **Fecha y estado** van al servidor como query params reales.
- **Teléfono y agente** siguen siendo filtros client-side, igual que antes, pero ahora sobre
  un lote real traído con `limite: 200` (mismo patrón que ya usa `LlamadasActivas.jsx` con
  `listar({ limite: 100 })`) en vez de sobre los 6 registros fijos del mock.
- **El CSV exporta ese mismo lote ya cargado y filtrado**, no "todas las llamadas que
  existan" — es una limitación real del backend actual, no un bug de esta conexión. Queda
  comentado explícitamente en el código (`LIMITE_CARGA`) para que no se lea como descuido.

## Verificación
Se corrió `llamadasRepository.listarLlamadas()` directo contra Postgres real (sin HTTP, sin
CloudUCM) y se confirmó que el shape de la respuesta coincide exactamente con lo que el
componente nuevo espera. **No se ejecutó `sincronizarCDR()` contra el CloudUCM real** — a
diferencia de la verificación de lectura, esa acción sí dispara una llamada en vivo al PBX
del cliente (`cloudUCM.getCDR()` dentro de `llamadas.service.js`), y la instrucción de esta
tarea fue explícita en no tocar nada de CloudUCM en vivo. El botón queda conectado y listo
para probarse manualmente cuando se autorice.

## Pendiente
Filtro de teléfono/agente y export CSV del lado del servidor siguen siendo trabajo aparte
(mencionado como Bloque B.3.1 en `client/CLAUDE.md`) — no se resolvió acá, solo se documentó
la limitación con la que queda conviviendo esta conexión.

# Línea A — Tickets y Llamadas Activas: de `PageStub` a datos reales

*Nota de numeración: ninguna de las dos páginas aparece en la tabla "Estado real de cada
página" de `Plan_Estabilizacion_MERCI.md` — cuando se escribió esa tabla, `/tickets` y
`/llamadas/activas` todavía eran `PageStub` sin archivo propio, así que el inventario no las
contaba. No se les asignó un número de Sección A.1.x existente; si el equipo quiere,
convendría agregar ambas filas a la tabla del plan en la próxima actualización.*

## Qué se hizo
Se verificó el estado real de `/tickets` y `/llamadas/activas` en `AppRoutes.jsx`: ambas
apuntaban a `<PageStub />`, confirmado leyendo el archivo, no asumido.

- **Tickets**: se creó `src/services/tickets.service.js` (patrón de `usuarios.service.js`) y
  `src/pages/Tickets.jsx` — StatCards, filtros (estado/prioridad/búsqueda por título), tabla,
  creación de tickets, modal de detalle. Conectado a `GET/POST /api/tickets` reales.
- **Llamadas Activas**: se construyó la interfaz completa (`src/pages/LlamadasActivas.jsx`) con
  datos reales vía polling sobre `GET /api/llamadas`, no como placeholder — con un estado
  vacío explícito y correcto para cuando no hay ninguna llamada en curso.
- `AppRoutes.jsx`: ambas rutas dejaron de ser `PageStub` y ahora están protegidas con
  `<RutaConPermiso>` (`tickets.ver` / `llamadas.ver`, ya declarados en `menuSections.js` desde
  antes) — hasta ahora eran las únicas 2 rutas del sidebar sin ese guard, por no tener datos
  reales que proteger; ya no aplica esa excepción.

## Por qué
Ambas rutas eran la última pareja de huecos "PageStub sin backend real detrás" — Tickets ya
tenía backend completo desde la Sección 1.0.5 (fuga de tenant corregida) sin nada del lado
del frontend; Llamadas Activas necesitaba, ante todo, una decisión honesta sobre qué tan
"viva" puede ser sin tocar la zona restringida.

## Cómo

### Tickets
- **Verificación en vivo antes de escribir el mapeo** (mismo criterio que A.1.1/A.1.2): el
  backend de tickets (`tickets.controller.js`, Bina 3) **no transforma nada** — `GET /tickets`
  y `GET /tickets/:id` devuelven las filas de Prisma tal cual, `snake_case`, con
  `catalogo_estado_ticket`/`catalogo_prioridad_ticket`/`usuarios`/`llamadas` anidados como
  objetos completos. Confirmado con una llamada HTTP real antes de tocar `Tickets.jsx`.
  `tickets.service.js` lo documenta en un comentario para que nadie asuma camelCase por
  costumbre de los otros módulos.
- Se hizo un smoke test real de creación (`POST /tickets`) y limpieza (`DELETE`) contra la
  BD del seed antes de dar por buena la forma del body.
- **StatCard, paleta de colores y estructura general** copiados del patrón ya establecido en
  `Auditoria.jsx` (mismo shell, mismos tokens `#020C18`/`#061628`/`#0D2647`/`#155EEF`, mismo
  sistema de toasts) — no se inventó un estilo nuevo.

### Llamadas Activas — evaluación de viabilidad (pedida explícitamente antes de construir)
**El punto clave: no es viable mostrar datos con push real (WebSocket) sin tocar zona
restringida, pero sí es viable mostrar datos genuinamente en vivo por polling, y eso es lo
que se construyó.** Verificado leyendo el código, no asumido:
- `websocket.service.js` emite `call_started`/`call_ended` (constantes `EVENTOS.CALL_STARTED`/
  `CALL_ENDED`), pero quien los dispara es `llamadasService.registrarInicio()`/
  `registrarCierre()`, y esas dos funciones **solo las llama `webhooks.service.js`** cuando
  CloudUCM manda un evento real — `webhooks.service.js` está en la lista de zonas
  restringidas. Aunque no lo estuviera: sin un PBX real conectado (Fase 5, fuera de este
  plan), esos webhooks nunca llegan, así que el evento tampoco se dispararía nunca en este
  entorno — no es solo un problema de "no tocar el archivo", es que la fuente del dato en
  vivo (el PBX real) no existe todavía en este entorno de desarrollo.
- Tampoco existe `socket.io-client` en `client/package.json` — conectar el frontend al socket
  del backend hubiera significado agregar una dependencia nueva y un ciclo de vida de conexión
  para escuchar eventos que, en este entorno, no se van a disparar nunca. Se decidió no
  construir esa parte especulativa — sería "cableado" imposible de probar, no imposible de
  escribir.
- **Lo que sí es 100% real y viable sin tocar nada restringido**: `GET /api/llamadas` (Bina 3,
  módulo normal, no restringido) ya soporta filtrar por `estado`, y refleja el estado
  verdadero de la tabla `llamadas` en cada consulta. `LlamadasActivas.jsx` hace polling cada
  8 segundos sobre este endpoint, filtra client-side por `catalogo_estado_llamada.nombre` en
  `['En Espera', 'En Proceso']`, y muestra un reloj de duración calculado en el cliente
  (`fecha_inicio` vs. ahora, tick de 1s) para las llamadas en curso. Verificado en vivo contra
  el seed: hay 1 llamada en estado "En Proceso" ahora mismo, la vista la muestra correctamente
  con su duración corriendo.
- **Estado vacío construido a propósito, no un placeholder sin terminar**: cuando el filtro no
  encuentra ninguna llamada activa, se muestra "Sin llamadas activas en este momento" con
  explicación de que el panel sigue consultando cada 8s — es el comportamiento correcto para
  este entorno (sin PBX real, la mayoría del tiempo no va a haber llamadas activas), no un
  bug ni una página incompleta.
- Se agregó `src/services/llamadas.service.js` (no existía) — necesario para no hacer
  `fetch()` suelto dentro del componente, siguiendo la convención ya establecida
  ("servicios sobre `api.js`").

### Verificación
`npm run build` limpio. `npx eslint` sobre los 5 archivos tocados/creados: 2 errores, ambos
el mismo patrón `react-hooks/set-state-in-effect` ya presente en `Auditoria.jsx`/
`Configuracion.jsx` (decisión de equipo pendiente, no se corrige aquí). Se encontró y corrigió
un error *nuevo* y real en `LlamadasActivas.jsx` (`useState(Date.now())` es una llamada impura
durante el render, regla `react-hooks/purity`) — cambiado a `useState(() => Date.now())`, no
se dejó pasar por ser "el mismo patrón de siempre" porque no lo es.

No se pudo verificar en navegador (mismo motivo que A.1.1/A.1.2: sin `chromium-cli`/Playwright
en este entorno) — verificado con build limpio + llamadas HTTP reales replicando exactamente
lo que cada componente pide (incluido un smoke test de creación de ticket, revertido después).

## Archivos tocados
- `src/services/tickets.service.js` (creado)
- `src/services/llamadas.service.js` (creado)
- `src/pages/Tickets.jsx` (creado)
- `src/pages/LlamadasActivas.jsx` (creado)
- `src/routes/AppRoutes.jsx` (editado — Tickets/LlamadasActivas reemplazan PageStub, ambas
  con `RutaConPermiso`; se quitó el import de `PageStub` por quedar sin uso)

## Pendiente / riesgos
- **`GET /tickets/catalogos` es un stub real** (`tickets.controller.js`, línea ~74) — siempre
  responde `{ ok: true, mensaje: 'Pendiente lógica catálogos' }`, sin `data`. El formulario de
  creación arma sus selects de estado/prioridad a partir de lo que ya trae la lista de
  tickets cargada — hoy eso cubre 3 de 6 estados (falta Pendiente/Cerrado/Cancelado) y 2 de 4
  prioridades (falta Baja/Crítica). El servicio ya tiene `ticketsService.catalogos()`
  conectado para cuando Bina 3 implemente el endpoint de verdad — no se construyó la lógica de
  merge todavía porque no hay forma de probarla contra una respuesta real.
- **Otra discrepancia CLAUDE.md vs. código real**: `merci-platform/CLAUDE.md` dice
  "confirmado en `pbx.controller.js`, `tickets.controller.js`... [que usan] `{ ok, mensaje,
  data }`" — pero `obtenerTickets`/`obtenerTicketPorId` en `tickets.controller.js` responden
  `{ ok, data }`, **sin `mensaje`**. No rompe nada (el frontend no depende de `mensaje` para
  funcionar), pero la afirmación de `CLAUDE.md` no es exacta para este caso puntual.
- No se construyó edición ni comentarios de tickets (`PUT /tickets/:id` sí funciona en el
  backend, `POST /tickets/comentarios` es otro stub) — el pedido era explícitamente "tabla,
  filtros y creación", no se agregó más para no salirse del alcance.
- Llamadas Activas: el polling de 8s es una elección arbitraria razonable, no un valor que
  venga de ninguna configuración — ajustar si el equipo prefiere otro intervalo.
- **No se hizo commit ni push** — todos los cambios quedan sin comitear en el árbol de
  trabajo de `client/`, por instrucción explícita (todavía no existe el repo propio donde
  subir esto).

## Pertenece a otra bina?
No para los archivos de frontend (Bina 4). El backend que consumen (`tickets.*`,
`llamadas.*`) es de Bina 3 y no se tocó — solo se leyó para confirmar la forma real de los
endpoints y el estado de `obtenerCatalogos`.

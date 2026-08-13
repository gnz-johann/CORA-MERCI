# Prioridad 2 — Dashboard: módulo de backend nuevo + conexión real

## Qué se hizo
- Módulo de backend nuevo completo: `src/modules/dashboard/` (`dashboard.routes.js`,
  `.controller.js`, `.service.js`, `.repository.js`) — no existía ninguno de los 4 archivos
  antes de esta tarea, solo un `require` comentado en `index.routes.js` que ya anticipaba el
  nombre.
- `GET /api/dashboard` — un solo endpoint que devuelve todo lo que pinta `Dashboard.jsx`:
  KPIs, llamadas recientes, llamadas por hora, sentimientos de hoy, agentes con su conteo de
  llamadas atendidas, tickets urgentes, y actividad reciente de auditoría.
- `Dashboard.jsx` conectado a ese endpoint — se quitaron los 6 arrays de datos simulados
  (`kpis`, `llamadas`, `agentes`, `sentimientos`, `llamadasPorHora`, `tickets`) que existían
  antes como constantes fijas al tope del archivo.

## Hallazgo antes de escribir nada — no reinventar lo que ya existía
Antes de escribir las queries a mano, se revisó `db/merci_schema.sql` completo (regla nº 10
del plan: no asumir el estado de nada sin verificarlo) y apareció una función de Postgres ya
construida específicamente para esto, sin usar hasta ahora:

```sql
CREATE OR REPLACE FUNCTION fn_dashboard_empresa(p_empresa_id UUID) RETURNS JSONB
```

Calcula en una sola consulta: `llamadas_activas`, `llamadas_hoy`,
`tiempo_promedio_atencion_hoy`, `tasa_resolucion_hoy`, `llamadas_ia_hoy`,
`llamadas_escaladas_humano_hoy`, `tickets_abiertos`, `agentes_disponibles`,
`sentimiento_promedio_hoy`. En vez de reescribir esa misma lógica con Prisma, el repository
la llama directo vía `prisma.$queryRaw` — es exactamente el caso de "SQL manual porque Prisma
no soporta esto" que ya menciona `merci-platform/CLAUDE.md` (Prisma no puede invocar una
función de Postgres que devuelve JSONB), con el mismo precedente que `worker.service.js` y su
`SELECT ... FOR UPDATE SKIP LOCKED`. Los KPIs de las 4 tarjetas superiores del Dashboard usan
directamente 4 de esos 9 campos.

## Consultas reales contra las 4 tablas pedidas
- **`llamadas`**: KPIs (vía la función), últimas 8 llamadas para el panel "Llamadas en tiempo
  real", bucket de llamadas por hora (últimas 8h, agrupado en JS porque Prisma no agrupa por
  expresión de fecha sin SQL crudo — agrupar en memoria sobre un solo `findMany` es más
  simple que escribir otra función solo para esto), y `groupBy` por sentimiento del día.
- **`tickets`**: tickets con prioridad Crítica/Alta que siguen sin Resolver/Cerrar/Cancelar,
  para el panel "Tickets Urgentes".
- **`agentes_virtuales`**: lista completa de la empresa + `groupBy` de `llamadas.agente_id`
  para el conteo de "X llamadas atendidas" por agente.
- **`auditoria_logs`** (la tabla real de auditoría, `auditoria` no existe con ese nombre):
  últimas 6 entradas — se agregó un panel nuevo "Actividad Reciente" al final del Dashboard
  porque el mockup original no tenía ningún panel que correspondiera a auditoría; sin ese
  panel, la tabla pedida hubiera quedado sin ningún lugar real donde mostrarse. Se reutilizó
  `ACCION_A_ESPANOL` (ya exportado por `auditoria.repository.js`) para traducir
  `INSERT/UPDATE/DELETE` a `Creó/Editó/Eliminó`, en vez de duplicar ese mapeo.

## Lo que se dejó fuera a propósito
El panel "Consumo IA" del mockup corresponde a la tabla `consumo_ia` (existe una función
`fn_consumo_ia_mes()` ya lista también), pero esa tabla **no estaba en la lista de las 4**
que pediste (`llamadas, tickets, agentes virtuales, auditoría`). Se dejó ese panel con los
mismos datos de ejemplo que ya tenía, pero con una nota visible en la UI
("Datos de ejemplo — todavía no conectado a consumo_ia") para que no quede mezclado con el
resto de paneles reales sin que se note. Es una decisión de alcance, no un olvido — avisar si
se quiere que se conecte también.

## Verificación
`node --check` en los 5 archivos de backend tocados/creados. Se corrió
`dashboardService.obtenerResumen(empresaId)` directo contra Postgres real (sin pasar por
HTTP, sin tocar CloudUCM) y se confirmó que devuelve datos reales de la empresa de prueba —
1 llamada activa, 3 agentes con sus conteos reales, 1 ticket urgente, 6 entradas de
auditoría, etc. `npm run lint` en el frontend no muestra errores nuevos en `Dashboard.jsx`
(el único que marca es el mismo patrón de `useEffect` que ya existe en el resto de páginas
del proyecto).

## Pendiente
- Permiso `dashboard.ver` ya estaba sembrado en `db/merci_schema.sql` (línea 514) — no hizo
  falta agregarlo.
- No es tiempo real por WebSocket (mismo límite ya documentado para Llamadas Activas — el
  pipeline de eventos vive en `services/pbx/`, zona restringida, y no hay CloudUCM conectado
  en este entorno) — es un snapshot fresco cada vez que se carga o recarga la página, no un
  push en vivo.

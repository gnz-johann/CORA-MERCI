# Línea A · Sección A.1.2 — Ajusta `Auditoria.jsx` a la forma real del backend

## Qué se hizo
`Auditoria.jsx` ya llamaba a `auditoriaService.listar()`, pero esperaba una forma de datos
vieja: array plano y campos `snake_case` (`usuario_nombre`, `fecha_hora`, `datos_anteriores`,
etc.), sobrante de una versión anterior a que el backend real existiera (Sección 2.4.1). Se
ajustó el frontend a la forma real: `data.items` (paginado) con campos `camelCase`
(`usuarioNombre`, `fechaHora`, `datosAnteriores`, `datosNuevos`).

## Por qué
Sin este ajuste, la vista seguía mostrando el aviso "no se pudo cargar" (o, peor, se rompía
en silencio) aunque el backend ya funcione — el mismatch de forma, no la ausencia del
endpoint, era el bloqueo real desde la Sección 2.4.1.

## Cómo
- **Verificación previa en vivo, no el contrato**: se levantó el backend con los datos del
  seed y se llamó a `GET /auditoria` autenticado antes de tocar una línea del componente. La
  forma real: `{ data: { items: [...], total, page, pageSize } }`, cada item con
  `usuarioNombre`, `usuarioUsername`, `ip`, `fechaHora`, `accion`, `modulo`,
  `datosAnteriores`, `datosNuevos` — coincide con lo que la Sección 2.4.1 diseñó, pero **no**
  con lo que el componente todavía leía.
- Se reemplazaron todas las referencias `snake_case` por sus equivalentes `camelCase` en:
  `exportarCSV()`, `usuariosDisponibles`, el filtro `logsFiltrados`, la tabla y el modal de
  detalle.
- `cargarLogs()` ahora desempaqueta `res.data.items` en vez de asumir un array plano o
  `payload.logs`.
- **No se migró a paginación real del servidor** — la vista sigue filtrando/paginando del
  lado del cliente sobre todo lo cargado, como ya hacía con el mock. Para que eso siguiera
  funcionando iguial que antes (mostrar y filtrar sobre "todos" los logs), se pidió
  `auditoriaService.listar({ pageSize: 1000 })` en vez del default (10) — confirmado en vivo
  que sin esto la vista se hubiera quedado mostrando solo los primeros 10 registros aunque
  hubiera más. Migrar a paginación real del servidor es trabajo de optimización (Bloque A.2),
  no de esta sección.
- `npm run build` limpio. `npm run lint` sobre este archivo: 1 error
  (`react-hooks/set-state-in-effect` en el `useEffect(() => { cargarLogs(); }, [cargarLogs])`)
  — **ya existía antes de este cambio**, mismo patrón que `Configuracion.jsx` (Sección A.1.1)
  y el resto de la app; no se corrigió aquí por la misma razón documentada ahí (decisión de
  equipo pendiente, no algo a resolver módulo por módulo).

## Archivos tocados
- `src/pages/Auditoria.jsx` (editado — solo mapeo de campos y desempaquetado de la respuesta,
  sin cambios de UI/estructura)

## Pendiente / riesgos
- **El punto clave: hay auditoría real que no pasa por `audit.service.js`, y ya se ve en la
  vista.** Verificando en vivo apareció un registro de auditoría de "Agente Recepción" con
  `usuarioNombre`, `usuarioUsername`, `ip` y `modulo` en `null` — no por un bug del mapeo,
  sino porque `db/merci_schema.sql` tiene **triggers de Postgres** (`tr_auditoria_agentes` /
  `fn_auditoria_agentes()`, y el equivalente para `workflows`) que insertan directo en
  `auditoria_logs` al hacer INSERT/UPDATE sobre `agentes_virtuales`/`workflows`, sin pasar
  por Node. Esto **no estaba documentado en ningún `CLAUDE.md` ni en el informe de la
  Sección 2.4.1**, que decía "solo los módulos de Bina 1 llaman a `audit()`" — eso seguía
  siendo cierto del lado de Node, pero incompleto: Agentes y Workflows ya tienen cobertura
  parcial vía trigger de BD. `datosNuevos`/`datosAnteriores` en estos casos es la fila cruda
  completa (`row_to_json`, `snake_case`), no los campos curados que arma `audit.log()` — el
  cálculo de diff (`calcularDiff`) ya lo soporta sin cambios porque itera claves
  genéricamente, pero vale saber que el contenido del diff se ve distinto según el origen del
  registro. Se agregó `?? '—'` / `?? '— (evento automático del sistema)'` como fallback
  visual para cuando `usuarioNombre` viene null, en vez de dejarlo en blanco sin explicación.
- No se probó en navegador real (mismo motivo que la Sección A.1.1: sin `chromium-cli`/
  Playwright en este entorno) — verificado con build limpio + la misma llamada HTTP que hace
  el componente, con el mismo `pageSize` que ahora pide.

## Pertenece a otra bina?
No directamente — `Auditoria.jsx` es de Bina 4. El hallazgo de los triggers en
`agentes_virtuales`/`workflows` sí vale la pena avisarlo a Bina 2 (dueña de esos módulos),
aunque no se tocó ningún archivo de esa bina.

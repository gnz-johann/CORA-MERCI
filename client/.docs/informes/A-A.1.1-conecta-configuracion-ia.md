# Línea A · Sección A.1.1 — Conecta `Configuracion.jsx` a `GET/PUT /configuracion/empresa` y `GET /configuracion/proveedores-ia`

## Qué se hizo
Se conectó el panel "Configuración IA" y la tarjeta "Proveedores IA" de `Configuracion.jsx` a
los endpoints reales del backend, reemplazando `mockConfigData.empresa`. La tarjeta "Central
Telefónica (PBX)" y el modal "Configurar Credenciales PBX" **siguen en mock a propósito** —
no eran parte de este pedido (`GET/PUT /configuracion/pbx` es de Bina 3, otro endpoint).

## Por qué
Es el primer archivo de la Fase 3.4 ya verificado como listo para conectar: sus dos
endpoints (`GET/PUT /configuracion/empresa`, `GET /configuracion/proveedores-ia`) ya existían
y funcionaban de punta a punta desde el Bloque 3.3, a diferencia de `HistorialLlamadas.jsx`
(sigue bloqueado por trabajo de backend pendiente, Bloque 2.3).

## Cómo
- **Verificación previa obligatoria — no se asumió la forma del contrato.** Se levantó el
  backend real (con datos del seed del Bloque 3.2) y se llamó a los 2 endpoints en vivo antes
  de escribir una sola línea de mapeo:
  - `GET /configuracion/proveedores-ia` → `{ data: [{ id, nombre, tipo }, ...] }`
  - `GET /configuracion/empresa` → `{ data: { vozIa, idioma, timeoutSeg, proveedorSttId,
    proveedorTtsId, proveedorLlmId, temperaturaModelo, modeloIa } }`
- **Se agregó `configuracionService`** (ya existía en `src/services/configuracion.service.js`
  desde antes de esta sesión, sin usar) — no hizo falta tocarlo, sus 3 métodos ya calzaban
  exacto con lo necesitado.
- Se creó `DEFAULT_CONFIG_IA` con los mismos valores por defecto que tiene la columna en
  Postgres (`idioma: 'es'`, `timeoutSeg: 30`, `temperaturaModelo: 0.7` — ver
  `schema.prisma`), para que el primer guardado de una empresa sin configurar coincida con lo
  que el backend habría creado de todos modos.
- `cargarConfiguracion()` (en un `useEffect`, mismo patrón que ya usa `Auditoria.jsx` con
  `cargarLogs()`) trae catálogo + config en paralelo con `Promise.all`, con estados
  `cargando`/`errorCarga` y un banner de error con botón "Reintentar" — copiado del mismo
  patrón visual que ya usa `Auditoria.jsx`, no inventado.
- `handleGuardarCambios` ahora es async, llama a `configuracionService.actualizar(configIA)`,
  deshabilita el botón mientras guarda ("Guardando...") y muestra toast de éxito/error —
  reutilizando el sistema de toasts que ya existía en el archivo.

## Archivos tocados
- `src/pages/Configuracion.jsx` (editado — panel Configuración IA + tarjeta Proveedores IA
  conectados; PBX y modal de credenciales sin cambios funcionales)

## Pendiente / riesgos
- **El punto clave: los campos de proveedor no eran solo un rename, había que construir UI
  nueva.** El mock guardaba el *nombre* del proveedor como string literal
  (`proveedor_stt_id: 'OpenAI Whisper'`) en un `<span>` de solo lectura. El campo real
  (`proveedorSttId`) es un UUID del catálogo — mostrarlo tal cual habría sido un UUID crudo e
  ilegible, y no había manera de que el usuario lo cambiara. Se convirtieron los 3 campos
  (STT/TTS/LLM) en dropdowns reales contra `GET /proveedores-ia` filtrados por `tipo`, con el
  mismo patrón visual que ya usaba el dropdown de "Voz IA" en el mismo archivo — esto es más
  que "conectar", es la única forma de que el PUT pueda guardar algo con sentido.
- **Otro detalle que solo salió probando en vivo, no leyendo el contrato**: `GET /empresa`
  responde `data: null` cuando la empresa nunca configuró nada — no un objeto con los campos
  en `null`. El merge (`{ ...DEFAULT_CONFIG_IA, ...resEmpresa.data }`) solo se aplica si
  `resEmpresa.data` existe; si no, se quedan los defaults tal cual. Sin esta verificación
  explícita se hubiera podido asumir que siempre viene un objeto y romper con
  `Object.keys(null)` o similar.
- **No se pudo verificar visualmente en navegador** — el entorno (Windows, sandbox de esta
  sesión) no tiene `chromium-cli` ni Playwright instalado, y no se justificó instalarlo para
  esto. Verificado en su lugar con: `npm run build` limpio, y una llamada en vivo a los mismos
  2 endpoints con las mismas credenciales que usaría la página, confirmando que la forma de la
  respuesta coincide exactamente con lo que el componente espera. Recomendación: si se quiere
  verificación visual real, correr `/run-skill-generator` una vez para dejar un skill de
  proyecto que sepa levantar `client/` + `merci-platform/` juntos.
- `npm run lint` reporta 2 errores en este archivo (`'React' is defined but never used`,
  `react-hooks/set-state-in-effect` en el `useEffect` de carga) — **ninguno de los dos es
  nuevo**: el primero ya existía en el archivo original (import sin usar, mismo patrón que
  `Workflows.jsx`); el segundo es el mismo patrón ya presente en `Auditoria.jsx` y casi toda
  la app, ya documentado en el plan como decisión de equipo pendiente ("Regla de ESLint
  react-hooks/set-state-in-effect... no algo que Claude Code deba resolver módulo por
  módulo"). No se corrigió aquí para no adelantarse a esa decisión.
- PBX y el modal de credenciales de PBX siguen 100% mock — no tocados, fuera de esta sección.

## Pertenece a otra bina?
No — `Configuracion.jsx` no tiene dueño de bina único (es la vista de Bina 4 más el panel PBX
de Bina 3 en la misma pantalla). Solo se tocó la parte de Bina 4; la parte de Bina 3 (PBX)
sigue intacta.

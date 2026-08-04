# MERCI — Frontend (contexto de proyecto para Claude Code)

## Quiénes somos en este repo
Bina 4 (Kevin = backend, yo = frontend). Alcance original de sprint: **Auditoría +
Configuración**, frontend y backend completos. Los jobs/providers de IA de la guía oficial
de Bina 4 NO son parte de este sprint. El trabajo activo sigue `Plan_Estabilizacion_MERCI.md`
— vive en `.docs/` de este mismo repo (versionado, se actualiza con cada commit relevante) y
también como copia de referencia en `proyect/.docs/`, fuera de ambos repos y sin git, para
consultarla al iniciar sesión desde la carpeta principal. Cubre las 4 binas, no solo la
nuestra. **Regla fija del plan (nº 10): antes de ejecutar cualquier instrucción nueva,
consultar primero Graphify actualizado, `CLAUDE.md` de ambos repos y el plan — nunca asumir
el estado de un módulo/tabla/archivo sin verificarlo.**

## Avance del plan (resumen — detalle completo en `Plan_Estabilizacion_MERCI.md`)
- Fase 1 (Estabilización) — ✅ completa (incluida la corrección de `menuSections.js`, ver
  abajo).
- Fase 2, Bloque 2.4 (backend de Bina 4: `auditoria` + `configuracionIA`, cifrado de
  `credenciales_ia`) — ✅ completo del lado de `merci-platform/`, ver `merci-platform/CLAUDE.md`.
- Fase 3, Bloques 3.1-3.3 — corridos y probados del lado de `merci-platform/` (3.1 pausado
  a propósito, 3.2/3.3 cerrados) — nada de esto tocó este repo directamente.
- Línea A del plan (conectar frontend a backend ya existente) — en curso. Sección A.1.1
  (`Configuracion.jsx`, panel de Config IA + Proveedores IA) ya cerrada, ver abajo.

## Estado actual — rama activa y remotos (importante, no es lo habitual)
Trabajo en curso en **`feature/bina4-estabilizacion`**, creada desde el `origin/main` real
del equipo (no desde un commit inicial vacío — ver nota histórica más abajo).

Este repo tiene **dos remotos**, y hay que saber cuál usar para qué:
- **`origin`** → `mariaroman24s-dotcom/merci-platform` (el repo real del equipo). El push
  a este remoto está **bloqueado por permisos (403)** para la cuenta de GitHub disponible
  en esta sesión — no es un problema técnico, es de acceso. **No intentar resolverlo desde
  aquí**, el equipo lo gestiona directamente.
- **`sandbox`** → `gnz-johann/MERCI-SANDBOX` (fork con permiso de escritura). **Todo el
  trabajo de esta rama se pushea aquí, no a `origin`**, hasta que el acceso a `origin` se
  resuelva. Si en algún momento se recupera el acceso a `origin`, avisar antes de asumir
  que hay que migrar el trabajo — puede que el equipo prefiera revisarlo desde el fork y
  fusionarlo ellos mismos.

**Nota histórica importante**: el checkout local de este repo, antes de la Sección 1.0.4,
tenía **cero commits** y nunca se había conectado al `origin/main` real (9+ commits reales,
incluida una versión de `Workflows.jsx` funcional y un `Configuracion.jsx` propio del
equipo). Cualquier documento o informe escrito antes de eso (incluido el primer
`INFORME_SITUACION_ACTUAL.md`) puede tener diagnósticos basados en ese checkout viejo —
releerlos con ese contexto. La rama actual ya parte del historial real.

**Cerrado en esta rama** (informe completo por sección en `.docs/informes/`, un archivo por
sección — nunca varias secciones en un mismo informe):
- **Sección 1.0.4** — la rama se reconcilió con el `origin/main` real (no un commit inicial
  huérfano) y se reintegró el trabajo propio de Bina 4 que no existía ahí:
  `src/services/auditoria.service.js`, `src/services/configuracion.service.js`, y
  `Auditoria.jsx` ya conectado a un servicio real (antes mock en `origin/main`).
  `Configuracion.jsx` se dejó **tal cual está en `origin/main`** (su versión real, con modal
  de credenciales PBX) — no la reconstrucción hecha en una sesión anterior sobre el checkout
  viejo, que se descartó por decisión explícita.
- **Sección 1.0.3** — `HistorialLlamadas.jsx` reconstruido. Contenía una copia vieja de
  `Configuracion()` (solo un botón de logout) — confirmado que el bug existía también en
  `origin/main`, no solo en el checkout local. Reconstruido con métricas, filtros, tabla
  paginada, modal de detalle y export CSV, sobre datos simulados alineados al modelo real
  `llamadas` de Prisma. Sigue en mock a propósito — se conecta en la Línea A, Sección A.1.6,
  y solo hasta que el backend tenga export CSV y filtros de teléfono/agente (Bloque B.3.1).
- **Bloque 1.1** — confirmado cerrado contra `origin/main` real: `Workflows.jsx` existe y
  funciona ahí, el import nunca estuvo roto en el repo real (era un artefacto del checkout
  local desactualizado). No hizo falta tocar nada.
- **Bloque 1.2** — 7 rutas de `AppRoutes.jsx` no tenían ningún guard de permiso (Dashboard,
  Agentes Virtuales, Extensiones, Historial de Llamadas, Conocimiento IA, Configuración, y
  Workflows — esta última no estaba en la lista original, se agregó por tener el mismo
  hueco). Antes, ocultar el ítem en `menuSections.js` era la única protección — cualquier
  usuario logueado entraba escribiendo la URL directo. Ahora las 7 usan
  `<RutaConPermiso permiso="...">` con el mismo string que ya declaraba `menuSections.js`.
  Además, `menuSections.js` línea 44 declaraba `Sucursales` con el permiso `extensiones.ver`
  (copiado y pegado por error) en vez de `sucursales.gestionar` (el que exigen de verdad
  `AppRoutes.jsx` y el backend) — corregido, cierra el Bloque 1.2 por completo.
- **Sección A.1.1** — `Configuracion.jsx`: panel "Configuración IA" y tarjeta "Proveedores
  IA" conectados a `GET/PUT /api/configuracion/empresa` y `GET /api/configuracion/proveedores-ia`
  (`configuracionService`, ya existía sin usar). Los campos de proveedor pasaron de texto
  literal (`'OpenAI Whisper'`) a selects reales contra el catálogo, porque el valor real es
  un UUID, no un nombre. La tarjeta "Central Telefónica (PBX)" y el modal de credenciales PBX
  **siguen en mock a propósito** — son de Bina 3, otro endpoint, fuera de esta sección.
  Informe: `.docs/informes/A-A.1.1-conecta-configuracion-ia.md`.

**Sigue abierto / sin tocar:**
- Línea A, Secciones A.1.2 a A.1.7 (`Auditoria.jsx`, `AgentesVirtuales.jsx`,
  `Extensiones.jsx`, `Workflows.jsx`, `HistorialLlamadas.jsx`, `Login.jsx`) — ver
  `Plan_Estabilizacion_MERCI.md` para el detalle y el orden de cada una. `HistorialLlamadas.jsx`
  en particular está bloqueada hasta que el backend tenga export CSV y filtros de
  teléfono/agente (Bloque B.3.1) — no intentar conectarla del todo antes de eso.
- Línea A, Bloque A.2 (optimización de tamaño de archivo) — no se entra hasta que A.1 esté
  completo.
- Línea B completa (Conocimiento IA, Dashboard) — no iniciada, son módulos que no existen
  ni en backend todavía.

## Convenciones ya establecidas en el código real (no asumir, ya verificado)
- Respuesta de API real: `{ ok, mensaje, data }` — NO `{ success, message, data }` (eso es
  de un doc desactualizado).
- Servicios en `src/services/*.service.js` sobre el cliente `src/services/api.js`
  (maneja token/refresh). Seguir el patrón de `usuarios.service.js` al crear servicios nuevos.
- Sistema de colores real vive en `src/theme.css` (y los tokens usados en
  `src/pages/Auditoria.jsx`/`HistorialLlamadas.jsx`: `#020C18`, `#061628`, `#0D2647`,
  `#155EEF`, etc.). El componente `src/components/StatCard.jsx` ya usa esos colores —
  reusarlo para cualquier KPI card nueva, no reinventar.
- Rutas protegidas usan `<RutaConPermiso permiso="...">` en `src/routes/AppRoutes.jsx`. Ya
  no hay rutas "sin permiso explícito" salvo `/tickets` y `/llamadas/activas` (siguen en
  `PageStub`, sin datos reales que proteger todavía).
- El menú lateral (`src/data/menuSections.js`) declara el permiso requerido por cada ítem —
  si agregas una ruta nueva, verificar que el permiso coincida con el de `AppRoutes.jsx` **y**
  con lo que el backend real exige. El caso conocido de Sucursales (los tres no coincidían)
  ya se corrigió en el Bloque 1.2 — las 3 capas usan `sucursales.gestionar`.

## Reglas del proyecto (de "Asignación de módulos")
- Todo dato debe respetar `empresa_id` (multi-tenant).
- No modificar módulos de otras binas sin avisar.
- No hardcodear claves de API — todo sale de `.env`.

## Estilo al trabajar
- Antes de asumir un nombre de archivo, ruta, o componente existente: verificarlo leyendo el
  repo, no inventarlo. Hacer `git fetch origin` antes de asumir que el checkout local está al
  día — ya pasó una vez que no lo estaba (ver nota histórica arriba).
- Rama de trabajo activa: `feature/bina4-estabilizacion`. Push a `sandbox`, no a `origin`
  (ver "Estado actual" arriba). Nunca commitear directo a `main`.

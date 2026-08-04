# MERCI — Backend (contexto de proyecto para Claude Code)

## Quiénes somos en este repo
Bina 4 (Kevin = backend, compañera de bina = frontend). Alcance original de sprint:
**Auditoría + Configuración**, backend completo (los jobs/providers de la guía oficial de
Bina 4 no son parte de este sprint). El trabajo activo sigue `Plan_Estabilizacion_MERCI.md`
— vive en `.docs/` de este mismo repo (versionado, se actualiza con cada commit relevante) y
también como copia de referencia en `proyect/.docs/`, fuera de ambos repos y sin git, para
consultarla al iniciar sesión desde la carpeta principal. Cubre las 4 binas, no solo la
nuestra. **Regla fija del plan (nº 10): antes de ejecutar cualquier instrucción nueva,
consultar primero Graphify actualizado, `CLAUDE.md` de ambos repos y el plan — nunca asumir
el estado de un módulo/tabla/archivo sin verificarlo.**

## Estado actual — rama activa y avance del plan
Trabajo en curso en **`feature/bina4-estabilizacion`**, creada desde `main` (a partir del
commit `bce7e33`). Remoto: `origin` → `ferchislzch/merci-platform` — push normal, sin
problema de acceso (a diferencia del frontend, ver `client/CLAUDE.md`, que trabaja contra un
fork por un 403 de permisos en su repo original).

**Avance real (ver `Plan_Estabilizacion_MERCI.md` para el detalle completo por sección):**
- Fase 1 (Estabilización) — ✅ completa.
- Fase 2, Bloque 2.4 (nuestro módulo: `auditoria` + `configuracionIA`, incluido el cifrado
  de `credenciales_ia`) — ✅ completo, ver "Cerrado en esta rama" abajo.
- Fase 3, Bloques 3.1-3.3 — parcial: 3.1 (baseline de Prisma Migrate) **pausado a propósito**
  (la BD local ya tenía datos reales sin historial de Migrate, no se forzó un reset); 3.2
  (seed) y 3.3 (prueba e2e de 7 pares contra Postgres real) cerrados.
- Línea A del plan (conectar frontend a backend ya listo) — en curso desde el lado de
  `client/`; Sección A.1.1 (`Configuracion.jsx`) ya cerrada, ver `client/CLAUDE.md`.

**Cerrado en esta rama** (informe completo por sección en `.docs/informes/`, un archivo por
sección — nunca varias secciones en un mismo informe):
- **Sección 1.0.1** — sincronización con `main` real + corrección al diagnóstico de Fase 0:
  `src/modules/tickets/` sí existe (el informe viejo decía que no, por un checkout
  desactualizado que ya no se usa).
- **Sección 1.0.2** — fuga de datos entre empresas en Agentes Virtuales:
  `agentes.routes.js` no aplicaba `setTenant` ni `requirePermission`; `req.empresaId`
  llegaba `undefined` y Prisma ignoraba el filtro de empresa por completo. Corregido.
- **Sección 1.0.5** — mismo tipo de fuga en Tickets, pero más profunda: las rutas no
  exigían ni login, y el controller/repositorio confiaban en `empresa_id` que mandaba el
  propio cliente (query param o body), sin filtrar por empresa al leer/editar/borrar por
  `id`. Corregido en las 3 capas (rutas, controller, repository) — no bastaba con agregar
  el middleware como en 1.0.2.
- **Bloque 1.1** — confirmado cerrado. El import roto de `Workflows` que reportaba el
  informe de Fase 0 era un problema exclusivo del frontend (`client/`); no existe nada
  equivalente en este repo. No hizo falta tocar nada aquí.
- **Bloque 1.3** (formato de respuesta único `{ ok, mensaje, data }`) — ya estaba resuelto
  desde el diagnóstico de Fase 0, confirmado sin discrepancias, sin trabajo pendiente.
- **Sección 2.4.1** — módulo `src/modules/auditoria/` nuevo: `GET /api/auditoria` (paginado,
  filtros fecha/usuario/acción/módulo) y `GET /api/auditoria/export` (CSV). El permiso de
  export es `auditoria.exportar` (no `auditoria.ver` como sugería el contrato) — el catálogo
  real ya siembra ambos por separado. Informe: `.docs/informes/02-2.4-1-auditoria.md`.
- **Sección 2.4.2** — módulo `configuracionIA.*` nuevo dentro de `src/modules/configuracion/`
  (archivo separado de `configuracion.routes.js`, que es de Bina 3 y no se tocó):
  `GET /api/configuracion/proveedores-ia`, `GET`/`PUT /api/configuracion/empresa`. `GET
  /empresa` responde `data: null` si la empresa no ha configurado nada todavía (no un objeto
  con campos en null). Informe: `.docs/informes/02-2.4-2-configuracion-ia.md`.
- **Sección 2.4.3** — `PUT /api/configuracion/credenciales-ia`: cifra con AES-256-GCM
  (`crypto` nativo, `src/core/utils/credencialesIA.crypto.js`) antes de guardar en
  `credenciales_ia`, a diferencia de `pbx.repository.js` (Bina 3) cuyo comentario dice
  "se guardan encriptadas" pero el código real nunca cifra nada. `GET /empresa` nunca
  devuelve este campo. **Requiere `CREDENCIALES_IA_ENCRYPTION_KEY` en `.env`** (32 bytes en
  hex, 64 caracteres) — variable requerida agregada a `src/config/env.js`; ya está resuelta
  en `.env` (gestionado con dotenvx). **Pendiente real, no resuelto todavía**:
  `AIProviderFactory.js:267` sigue leyendo `credenciales_ia.openai_api_key` en texto plano,
  sin descifrar — el día que se active Fase 5 (fuera de este plan), alguien tiene que agregar
  el descifrado ahí; no se tocó ese archivo porque está en la lista de "Nunca tocar".
  Informe: `.docs/informes/02-2.4-3-credenciales-ia-cifrado.md`.
- **Bloque 3.2** — `prisma/seed.js` (+ `npm run db:seed` / `npx prisma db seed`): crea una
  empresa de prueba aislada ("Empresa Demo Estabilización", nunca toca las 2 empresas reales
  que ya existían), con sucursal, 2 usuarios (Admin General + Admin Sucursal, password
  `Demo1234`), 3 agentes, 5 llamadas, 3 tickets — reutilizando los services reales
  (`empresasService.crear`, `usuariosService.crear`, etc.), no lógica reinventada. Es
  idempotente (si la empresa ya existe, no duplica nada). Informe:
  `.docs/informes/03-3.2-seed-datos-prueba.md`.
- **Bloque 3.3** — prueba e2e contra Postgres real (servidor levantado + HTTP real, login con
  los usuarios del seed) de los 7 pares: Auditoría, Configuración IA, PBX, Usuarios, Roles,
  Sucursales, Departamentos. Todo respondió como se diseñó, incluida la exclusión de
  `credenciales_ia` del `GET` y el aislamiento cruzado de permisos entre Admin General/Admin
  Sucursal. Informe: `.docs/informes/03-3.3-prueba-e2e-postgres.md`.

**Sigue abierto / sin tocar:**
- **Bloque 3.1** — `prisma/migrations` sigue vacío; la BD local no está bautizada (baseline)
  en Prisma Migrate, aunque ya tiene datos reales. Pausado a propósito, no por omisión — un
  `migrate dev` en este estado puede ofrecer un reset completo. Falta decidir cómo bautizarla
  sin tocar filas existentes.
- `src/modules/tickets/tickets.service.js` es código muerto — el controller nunca lo usa, y
  además referencia funciones (`crearComentarioBD`, `obtenerCatalogosBD`) que no existen en
  `tickets.repository.js`. No se arregló — es tamaño Bloque 2.3, no una corrección urgente.
- `agregarComentario` y `obtenerCatalogos` de Tickets siguen siendo stubs sin lógica real.
- `crearRolesDefault()` (en `empresas.repository.js`) siembra 2 roles al crear una empresa
  (Administrador General, Administrador de Sucursal), no los 4 que el plan original asumía
  (+ Supervisor, Agente) — decisión pendiente del equipo, no algo que Claude Code deba
  resolver por su cuenta.
- Queda un `git stash` (`stash@{0}`) con cambios locales viejos de `package-lock.json` sin
  aplicar — pendiente de que alguien del equipo confirme si esos cambios eran intencionales
  antes de aplicarlo o descartarlo.
- Bloque 1.2 (consistencia de permisos en las 3 capas) se trabajó del lado del frontend
  (ver `client/CLAUDE.md`) — del lado del backend, las rutas de Agentes Virtuales y Tickets
  ya quedaron con `requirePermission` real como parte de 1.0.2/1.0.5, pero **no se hizo una
  auditoría completa de todos los demás módulos** (empresas, workflows, extensiones, etc.)
  para confirmar que todos exigen el permiso correcto — sigue pendiente si el equipo lo
  pide explícitamente.
- Bloque 2.1 a 2.3, 2.5 (completar el resto de las binas con backend real + frontend
  conectado, numeración de `Plan_Estabilizacion_MERCI.md` v1) — no iniciado. La v2 del plan
  no repite esta numeración tal cual; lo pendiente de Bina 1/2/3 en backend queda implícito
  en la Línea B (Conocimiento IA, Dashboard) y en el Bloque B.3 (huecos puntuales, incluido
  `tickets.service.js`). Nuestro propio Bloque 2.4 (Bina 4) ya está completo, ver arriba.

## Zonas restringidas — NUNCA modificar sin avisar explícitamente
- `src/services/` (incluye `audit.service.js`, `callOrchestrator.service.js`,
  `worker.service.js`, `websocket.service.js`, `services/pbx/`)
- `src/jobs/`
- `src/modules/webhooks/`
- Cualquier archivo cuyo encabezado indique que pertenece a otra bina (ej.
  `src/modules/configuracion/configuracion.routes.js` es de Bina 3 — solo tiene PBX).

Sí se puede **usar** (importar y llamar) lo que exportan esos archivos, como `audit()` de
`audit.service.js` — eso no es modificarlos.

## Convenciones ya verificadas en el código real
- Respuesta de API: `{ ok, mensaje, data }` en éxito/error (confirmado en
  `pbx.controller.js`, `tickets.controller.js`, y ahora en todo lo tocado del Bloque 1.0).
  No usar `{ success, message }`.
- Arquitectura: `routes → controllers → services → repositories`, por módulo en
  `src/modules/<nombre>/`. **Ojo**: `tickets` no sigue esto del todo — su controller salta
  el service y llama al repository directo; el service existe pero es código muerto.
- Multi-tenant: todo pasa por `empresa_id` / `req.empresaId` (vía `tenant.middleware`,
  montado con `router.use(authenticate, setTenant)` al inicio del archivo de rutas). Antes
  de dar por hecho que un módulo lo aplica bien, **verificarlo leyendo el archivo de rutas**
  — ya se encontraron dos casos reales (Agentes Virtuales, Tickets) donde faltaba.
- ORM: Prisma como método principal; SQL manual solo si Prisma no soporta el caso (ver
  `worker.service.js` como único precedente real de SQL crudo, por el `SELECT ... FOR UPDATE
  SKIP LOCKED`).
- Permisos reales (no inventar claves): el catálogo completo vive en
  `db/merci_schema.sql` (`INSERT INTO permisos ...`, alrededor de la línea 470) — consultarlo
  antes de usar `requirePermission('algo.nuevo')`, un permiso que no está sembrado bloquea a
  todo el mundo, incluidos los admins.

## Bloque 2.4 (nuestro módulo) — ✅ completo, ver "Cerrado en esta rama" arriba
`src/modules/auditoria/` y `src/modules/configuracion/configuracionIA.*` ya están
construidos y probados e2e contra Postgres real (Bloque 3.3). El contrato de referencia
(`.docs/CONTRATO_Auditoria_ConfiguracionIA.md` o la copia en `proyect/.docs/`) tenía dos
puntos que el código real no siguió al pie de la letra — documentado en los informes
2.4.1 y 2.4.3, no es un olvido:
- El permiso de `GET /auditoria/export` es `auditoria.exportar`, no `auditoria.ver` como
  decía el contrato (el catálogo real ya siembra ambos permisos por separado).
- El contrato no cubre `credenciales_ia` en absoluto — el endpoint de credenciales
  (`PUT /configuracion/credenciales-ia`, con cifrado AES-256-GCM real) se construyó fuera
  del contrato, siguiendo la instrucción explícita del plan, no una suposición.

## Reglas del proyecto (de "Asignación de módulos")
- `empresa_id` en todo.
- JWT en rutas privadas.
- No hardcodear claves de API — todo sale de `.env`.

## Estilo al trabajar
- Antes de asumir un nombre de archivo, modelo de Prisma, o convención: verificarlo en el
  repo real (`prisma/schema.prisma`, código existente), no asumirlo. Ya pasó más de una vez
  que el checkout local estaba desactualizado y un diagnóstico se hizo sobre información
  vieja (ver Sección 1.0.1) — hacer `git fetch` y comparar contra `origin/main` antes de dar
  por buena una suposición sobre qué existe o no.
- Rama de trabajo activa: `feature/bina4-estabilizacion`. Nunca commitear directo a `main`
  — eso lo hace el equipo manualmente tras revisar cada informe.

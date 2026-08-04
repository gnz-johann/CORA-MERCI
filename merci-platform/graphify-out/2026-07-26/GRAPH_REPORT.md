# Graph Report - merci-platform  (2026-07-25)

## Corpus Check
- 110 files · ~61,001 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 868 nodes · 1106 edges · 60 communities (52 shown, 8 thin omitted)
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 247 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `32502fe9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- database.js
- roles.service.js
- dependencies
- usuarios.service.js
- empresas.service.js
- agentes.controller.js
- app.js
- callOrchestrator.service.js
- AIProviderFactory.js
- env.js
- llamadas.service.js
- CloudUCMProvider.js
- worker.service.js
- OpenAITTSProvider.js
- package.json
- auth.service.js
- pbx.service.js
- extensiones.service.js
- GeminiLLMProvider.js
- sttProceso.job.js
- auth.repository.js
- llmProceso.job.js
- usuarios.repository.js
- index.routes.js
- tenant.middleware.js
- departamentos.service.js
- ttsProceso.job.js
- sucursales.service.js
- permission.middleware.js
- departamentos.controller.js
- GoogleSTTProvider.js
- auth.middleware.js
- test-login-post.js
- configuracion.routes.js
- departamentos.repository.js
- departamentos.routes.js
- extensiones.routes.js
- llamadas.routes.js
- roles.routes.js
- sucursales.controller.js
- sucursales.repository.js
- sucursales.routes.js
- AppError.js
- test-challenge.js
- test-recording.js
- test-webhook.js
- test-cdr-raw.js
- test-ucm-connect.js
- agentes.service.js
- empresas.controller.js
- agentes.routes.js
- prompts.repository.js
- prompts.service.js
- workflows.routes.js
- llamadas.repository.js
- sucursales.repository.js
- database.js
- workflows.repository.js
- llamadas.controller.js

## God Nodes (most connected - your core abstractions)
1. `INFORME_SITUACION_ACTUAL — Fase 0 del Plan de Estabilización MERCI` - 11 edges
2. `requirePermission()` - 10 edges
3. `CloudUCMProvider` - 10 edges
4. `MERCI — Backend (contexto de proyecto para Claude Code)` - 8 edges
5. `NotFoundError` - 7 edges
6. `login()` - 7 edges
7. `AIProviderFactory` - 7 edges
8. `IPBXProvider` - 7 edges
9. `emit()` - 7 edges
10. `Fase 1 · Bloque 1.0 · Sección 1.0.1 — Sincronizar `merci-platform` con `main` (corrige el informe de Fase 0)` - 7 edges

## Surprising Connections (you probably didn't know these)
- `login()` --calls--> `comparePassword()`  [EXTRACTED]
  src/modules/auth/auth.service.js → src/core/utils/password.util.js
- `logout()` --calls--> `hashRefreshToken()`  [EXTRACTED]
  src/modules/auth/auth.service.js → src/core/utils/token.util.js
- `emit()` --calls--> `getIO()`  [EXTRACTED]
  src/services/websocket.service.js → src/config/socket.js
- `cambiarPassword()` --calls--> `hashPassword()`  [EXTRACTED]
  src/modules/usuarios/usuarios.service.js → src/core/utils/password.util.js
- `crear()` --calls--> `hashPassword()`  [EXTRACTED]
  src/modules/usuarios/usuarios.service.js → src/core/utils/password.util.js

## Import Cycles
- None detected.

## Communities (60 total, 8 thin omitted)

### Community 1 - "roles.service.js"
Cohesion: 0.06
Nodes (12): prisma, permisosRepository, rolesService, prisma, AppError, audit, formatearRol(), listar() (+4 more)

### Community 2 - "dependencies"
Cohesion: 0.06
Nodes (35): axios, bcrypt, cors, dotenv, @elevenlabs/elevenlabs-js, express, express-rate-limit, @google-cloud/speech (+27 more)

### Community 3 - "usuarios.service.js"
Cohesion: 0.08
Nodes (17): bcrypt, comparePassword(), hashPassword(), usuariosService, AppError, audit, cambiarPassword(), crear() (+9 more)

### Community 4 - "empresas.service.js"
Cohesion: 0.07
Nodes (14): empresasService, crearRolesDefault(), PERMISOS_EXCLUIDOS_ADMIN_GENERAL, PERMISOS_EXCLUIDOS_ADMIN_SUCURSAL, prisma, AppError, audit, cambiarStatus() (+6 more)

### Community 5 - "agentes.controller.js"
Cohesion: 0.09
Nodes (8): promptsService, prisma, authenticate, express, promptsController, router, agentesRepository, promptsRepository

### Community 6 - "app.js"
Cohesion: 0.06
Nodes (23): app, cors, env, errorHandler, express, { generalLimiter }, indexRoutes, AppError (+15 more)

### Community 7 - "callOrchestrator.service.js"
Cohesion: 0.09
Nodes (22): ACCION_FALLBACK, webhooksService, prisma, ACCION_DEFAULT, callOrchestrator, _extraerNumeroDestino(), NotFoundError, procesarEventoCloudUCM() (+14 more)

### Community 8 - "AIProviderFactory.js"
Cohesion: 0.09
Nodes (15): AIProviderFactory, _calcularCostoBase(), DEFAULTS_POR_TIPO, _envNum(), FABRICAS_PROVIDER, NotImplementedError, OpenAILLMProvider, OpenAITTSProvider (+7 more)

### Community 9 - "env.js"
Cohesion: 0.05
Nodes (34): envSchema, parsed, { z }, env, getIO(), initSocket(), { Server }, app (+26 more)

### Community 10 - "llamadas.service.js"
Cohesion: 0.15
Nodes (7): AppError, cloudUCM, CloudUCMProvider, llamadasRepository, NotFoundError, prisma, websocketService

### Community 11 - "CloudUCMProvider.js"
Cohesion: 0.11
Nodes (9): axios, CloudUCMProvider, crypto, https, httpsAgent, IPBXProvider, md5(), prisma (+1 more)

### Community 12 - "worker.service.js"
Cohesion: 0.12
Nodes (20): actualizarTicket(), agregarComentario(), crearTicket(), eliminarTicket(), obtenerCatalogos(), obtenerTicketPorId(), obtenerTickets(), {
  obtenerTicketsPorEmpresaBD,
  obtenerTicketPorIdBD,
  crearTicketBD,
  actualizarTicketBD,
  eliminarTicketBD
} (+12 more)

### Community 13 - "OpenAITTSProvider.js"
Cohesion: 0.11
Nodes (12): { ElevenLabsClient }, ElevenLabsTTSProvider, env, ITTSProvider, ITTSProvider, FORMATOS_OPENAI_VALIDOS, ITTSProvider, { OpenAI } (+4 more)

### Community 14 - "package.json"
Cohesion: 0.10
Nodes (19): nodemon, author, description, devDependencies, nodemon, prisma, keywords, license (+11 more)

### Community 15 - "auth.service.js"
Cohesion: 0.17
Nodes (18): crypto, env, generarAccessToken(), generarRefreshToken(), hashRefreshToken(), jwt, verificarRefreshToken(), AppError (+10 more)

### Community 16 - "pbx.service.js"
Cohesion: 0.11
Nodes (9): pbxService, prisma, SELECT_SEGURO, AppError, CloudUCMProvider, guardarConfigPbx(), NotFoundError, obtenerConfigPbx() (+1 more)

### Community 17 - "extensiones.service.js"
Cohesion: 0.11
Nodes (8): extensionesService, prisma, SELECT_EXTENSION, AppError, cloudUCM, CloudUCMProvider, extensionesRepository, NotFoundError

### Community 18 - "GeminiLLMProvider.js"
Cohesion: 0.12
Nodes (9): env, GeminiLLMProvider, { GoogleGenerativeAI }, ILLMProvider, ILLMProvider, ILLMProvider, { OpenAI }, OpenAILLMProvider (+1 more)

### Community 19 - "sttProceso.job.js"
Cohesion: 0.18
Nodes (14): AIProviderFactory, _cicloSondeo(), CloudUCMProvider, CONFIG, _descargarAudioCloudUCM(), iniciar(), _liberarJobsHuerfanos(), _manejarFalloJob() (+6 more)

### Community 20 - "auth.repository.js"
Cohesion: 0.12
Nodes (15): 1. Qué hace MERCI hoy, en una frase, 2. Cómo se hizo este diagnóstico, 3. El hallazgo más importante: fuga de datos entre empresas en Agentes Virtuales, 4. Estado real por Bina, 5. Cosas que no son de una sola bina, 6. Discrepancias documento vs código real (lo que pedía el Bloque 0.2), 7. Qué tan grande es la brecha hasta "funcional", 8. Qué no se tocó (+7 more)

### Community 21 - "llmProceso.job.js"
Cohesion: 0.21
Nodes (13): AIProviderFactory, _cicloSondeo(), CONFIG, _construirHistorial(), iniciar(), _liberarJobsHuerfanos(), _manejarFalloJob(), _marcarCompletado() (+5 more)

### Community 23 - "index.routes.js"
Cohesion: 0.12
Nodes (15): agentesRoutes, authRoutes, configuracionRoutes, departamentosRoutes, empresasRoutes, express, extensionesRoutes, llamadasRoutes (+7 more)

### Community 24 - "tenant.middleware.js"
Cohesion: 0.16
Nodes (8): AppError, ForbiddenError, { ForbiddenError }, authenticate, empresasController, express, { ForbiddenError }, router

### Community 25 - "departamentos.service.js"
Cohesion: 0.20
Nodes (4): AppError, audit, departamentosRepository, { NotFoundError }

### Community 26 - "ttsProceso.job.js"
Cohesion: 0.21
Nodes (12): AIProviderFactory, _cicloSondeo(), CloudUCMProvider, CONFIG, iniciar(), _liberarJobsHuerfanos(), _manejarFalloJob(), _marcarCompletado() (+4 more)

### Community 27 - "sucursales.service.js"
Cohesion: 0.15
Nodes (5): AppError, audit, { NotFoundError }, sucursalesRepository, prisma

### Community 28 - "permission.middleware.js"
Cohesion: 0.29
Nodes (6): authenticate, express, { requirePermission }, router, setTenant, usuariosController

### Community 29 - "departamentos.controller.js"
Cohesion: 0.36
Nodes (8): AppError, crear(), departamentosService, editar(), eliminar(), exigirSucursal(), listar(), obtener()

### Community 30 - "GoogleSTTProvider.js"
Cohesion: 0.22
Nodes (4): GoogleSTTProvider, ISTTProvider, speech, ISTTProvider

### Community 31 - "auth.middleware.js"
Cohesion: 0.22
Nodes (8): Convenciones ya verificadas en el código real, Estado actual — rama activa, Estilo al trabajar, Lo que hay que construir (Bloque 2.4 del plan — nuestro módulo, sigue sin empezar), MERCI — Backend (contexto de proyecto para Claude Code), Quiénes somos en este repo, Reglas del proyecto (de "Asignación de módulos"), Zonas restringidas — NUNCA modificar sin avisar explícitamente

### Community 32 - "test-login-post.js"
Cohesion: 0.29
Nodes (5): axios, crypto, https, httpsAgent, prisma

### Community 33 - "configuracion.routes.js"
Cohesion: 0.29
Nodes (6): authenticate, express, pbxController, { requirePermission }, router, setTenant

### Community 34 - "departamentos.repository.js"
Cohesion: 0.09
Nodes (6): actualizarAgente(), agentesService, crearAgente(), filtrarCampos(), prisma, agentesRepository

### Community 35 - "departamentos.routes.js"
Cohesion: 0.20
Nodes (8): { ForbiddenError }, requirePermission(), authenticate, departamentosController, express, { requirePermission }, router, setTenant

### Community 36 - "extensiones.routes.js"
Cohesion: 0.29
Nodes (6): authenticate, express, extensionesController, { requirePermission }, router, setTenant

### Community 37 - "llamadas.routes.js"
Cohesion: 0.29
Nodes (6): authenticate, express, llamadasController, { requirePermission }, router, setTenant

### Community 38 - "roles.routes.js"
Cohesion: 0.29
Nodes (6): authenticate, express, { requirePermission }, rolesController, router, setTenant

### Community 41 - "sucursales.routes.js"
Cohesion: 0.29
Nodes (6): authenticate, express, { requirePermission }, router, setTenant, sucursalesController

### Community 42 - "AppError.js"
Cohesion: 0.29
Nodes (3): AppError, AppError, NotFoundError

### Community 43 - "test-challenge.js"
Cohesion: 0.40
Nodes (4): axios, https, httpsAgent, prisma

### Community 44 - "test-recording.js"
Cohesion: 0.50
Nodes (3): CloudUCMProvider, fs, prisma

### Community 45 - "test-webhook.js"
Cohesion: 0.50
Nodes (3): app, bodyParser, express

### Community 49 - "agentes.service.js"
Cohesion: 0.25
Nodes (7): Archivos tocados, Cómo, Fase 1 · Bloque 1.0 · Sección 1.0.1 — Sincronizar `merci-platform` con `main` (corrige el informe de Fase 0), Pendiente / riesgos, Pertenece a otra bina?, Por qué, Qué se hizo

### Community 50 - "empresas.controller.js"
Cohesion: 0.25
Nodes (7): Archivos tocados, Cómo, Fase 1 · Bloque 1.0 · Sección 1.0.2 — Fuga de datos entre empresas en Agentes Virtuales, Pendiente / riesgos, Pertenece a otra bina?, Por qué, Qué se hizo

### Community 51 - "agentes.routes.js"
Cohesion: 0.25
Nodes (7): agentesController, authenticate, express, promptsRouter, { requirePermission }, router, setTenant

### Community 52 - "prompts.repository.js"
Cohesion: 0.25
Nodes (7): Archivos tocados, Cómo, Fase 1 · Bloque 1.0 · Sección 1.0.5 — Tickets sin `authenticate`/`setTenant`, Pendiente / riesgos, Pertenece a otra bina?, Por qué, Qué se hizo

### Community 53 - "prompts.service.js"
Cohesion: 0.25
Nodes (5): UnauthorizedError, env, jwt, prisma, { UnauthorizedError }

### Community 54 - "workflows.routes.js"
Cohesion: 0.22
Nodes (7): prisma, workflowsController, workflowsService, authenticate, express, router, workflowsController

### Community 55 - "llamadas.repository.js"
Cohesion: 0.25
Nodes (3): prisma, SELECT_DETALLE, SELECT_LISTADO

### Community 57 - "database.js"
Cohesion: 0.33
Nodes (5): adapter, env, prisma, { PrismaClient }, { PrismaPg }

### Community 58 - "workflows.repository.js"
Cohesion: 0.33
Nodes (4): prisma, workflowsRepository, workflowsRepository, workflowsService

## Knowledge Gaps
- **371 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+366 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `name`, `version`, `description` to the rest of the system?**
  _371 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `roles.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05689900426742532 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `usuarios.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0773109243697479 - nodes in this community are weakly interconnected._
- **Should `empresas.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0677361853832442 - nodes in this community are weakly interconnected._
- **Should `agentes.controller.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06417112299465241 - nodes in this community are weakly interconnected._
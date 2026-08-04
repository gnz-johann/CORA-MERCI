# Graph Report - merci-platform  (2026-07-25)

## Corpus Check
- 102 files · ~53,727 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 795 nodes · 1010 edges · 55 communities (45 shown, 10 thin omitted)
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 231 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b248dd3c`
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

## God Nodes (most connected - your core abstractions)
1. `CloudUCMProvider` - 10 edges
2. `requirePermission()` - 8 edges
3. `NotFoundError` - 7 edges
4. `login()` - 7 edges
5. `AIProviderFactory` - 7 edges
6. `IPBXProvider` - 7 edges
7. `emit()` - 7 edges
8. `MERCI — Backend (contexto de proyecto para Claude Code)` - 7 edges
9. `scripts` - 6 edges
10. `_cicloSondeo()` - 6 edges

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

## Communities (55 total, 10 thin omitted)

### Community 0 - "database.js"
Cohesion: 0.07
Nodes (14): adapter, env, prisma, { PrismaClient }, { PrismaPg }, prisma, prisma, prisma (+6 more)

### Community 1 - "roles.service.js"
Cohesion: 0.06
Nodes (12): prisma, permisosRepository, rolesService, prisma, AppError, audit, formatearRol(), listar() (+4 more)

### Community 2 - "dependencies"
Cohesion: 0.06
Nodes (35): axios, bcrypt, cors, dotenv, @elevenlabs/elevenlabs-js, express, express-rate-limit, @google-cloud/speech (+27 more)

### Community 3 - "usuarios.service.js"
Cohesion: 0.07
Nodes (17): bcrypt, comparePassword(), hashPassword(), prisma, AppError, audit, cambiarPassword(), crear() (+9 more)

### Community 4 - "empresas.service.js"
Cohesion: 0.18
Nodes (9): AppError, audit, cambiarStatus(), crear(), empresasRepository, ESTADOS_VALIDOS, generarCodigo(), generarCodigoUnico() (+1 more)

### Community 5 - "agentes.controller.js"
Cohesion: 0.20
Nodes (5): promptsService, authenticate, express, promptsController, router

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
Cohesion: 0.10
Nodes (21): envSchema, parsed, { z }, env, getIO(), initSocket(), { Server }, app (+13 more)

### Community 10 - "llamadas.service.js"
Cohesion: 0.08
Nodes (11): llamadasService, prisma, SELECT_DETALLE, SELECT_LISTADO, AppError, cloudUCM, CloudUCMProvider, llamadasRepository (+3 more)

### Community 11 - "CloudUCMProvider.js"
Cohesion: 0.11
Nodes (9): axios, CloudUCMProvider, crypto, https, httpsAgent, IPBXProvider, md5(), prisma (+1 more)

### Community 12 - "worker.service.js"
Cohesion: 0.11
Nodes (13): env, grabacionFetch, HANDLERS, llmWorker, obtenerJobs(), prisma, procesarJob(), start() (+5 more)

### Community 13 - "OpenAITTSProvider.js"
Cohesion: 0.11
Nodes (12): { ElevenLabsClient }, ElevenLabsTTSProvider, env, ITTSProvider, ITTSProvider, FORMATOS_OPENAI_VALIDOS, ITTSProvider, { OpenAI } (+4 more)

### Community 14 - "package.json"
Cohesion: 0.10
Nodes (19): nodemon, author, description, devDependencies, nodemon, prisma, keywords, license (+11 more)

### Community 15 - "auth.service.js"
Cohesion: 0.08
Nodes (19): crypto, env, generarAccessToken(), generarRefreshToken(), hashRefreshToken(), jwt, verificarRefreshToken(), prisma (+11 more)

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
Cohesion: 0.20
Nodes (4): crearRolesDefault(), PERMISOS_EXCLUIDOS_ADMIN_GENERAL, PERMISOS_EXCLUIDOS_ADMIN_SUCURSAL, prisma

### Community 21 - "llmProceso.job.js"
Cohesion: 0.21
Nodes (13): AIProviderFactory, _cicloSondeo(), CONFIG, _construirHistorial(), iniciar(), _liberarJobsHuerfanos(), _manejarFalloJob(), _marcarCompletado() (+5 more)

### Community 23 - "index.routes.js"
Cohesion: 0.13
Nodes (14): agentesRoutes, authRoutes, configuracionRoutes, departamentosRoutes, empresasRoutes, express, extensionesRoutes, llamadasRoutes (+6 more)

### Community 24 - "tenant.middleware.js"
Cohesion: 0.12
Nodes (12): AppError, ForbiddenError, UnauthorizedError, env, jwt, prisma, { UnauthorizedError }, authenticate (+4 more)

### Community 25 - "departamentos.service.js"
Cohesion: 0.15
Nodes (5): AppError, audit, departamentosRepository, { NotFoundError }, prisma

### Community 26 - "ttsProceso.job.js"
Cohesion: 0.21
Nodes (12): AIProviderFactory, _cicloSondeo(), CloudUCMProvider, CONFIG, iniciar(), _liberarJobsHuerfanos(), _manejarFalloJob(), _marcarCompletado() (+4 more)

### Community 27 - "sucursales.service.js"
Cohesion: 0.20
Nodes (4): AppError, audit, { NotFoundError }, sucursalesRepository

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
Cohesion: 0.25
Nodes (7): Convenciones ya verificadas en el código real, Estilo al trabajar, Lo que hay que construir este sprint, MERCI — Backend (contexto de proyecto para Claude Code), Quiénes somos en este repo, Reglas del proyecto (de "Asignación de módulos"), Zonas restringidas — NUNCA modificar sin avisar explícitamente

### Community 32 - "test-login-post.js"
Cohesion: 0.29
Nodes (5): axios, crypto, https, httpsAgent, prisma

### Community 33 - "configuracion.routes.js"
Cohesion: 0.29
Nodes (6): authenticate, express, pbxController, { requirePermission }, router, setTenant

### Community 35 - "departamentos.routes.js"
Cohesion: 0.29
Nodes (6): authenticate, departamentosController, express, { requirePermission }, router, setTenant

### Community 36 - "extensiones.routes.js"
Cohesion: 0.29
Nodes (6): authenticate, express, extensionesController, { requirePermission }, router, setTenant

### Community 37 - "llamadas.routes.js"
Cohesion: 0.20
Nodes (8): { ForbiddenError }, requirePermission(), authenticate, express, llamadasController, { requirePermission }, router, setTenant

### Community 38 - "roles.routes.js"
Cohesion: 0.29
Nodes (6): authenticate, express, { requirePermission }, rolesController, router, setTenant

### Community 41 - "sucursales.routes.js"
Cohesion: 0.20
Nodes (7): { ForbiddenError }, authenticate, express, { requirePermission }, router, setTenant, sucursalesController

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

### Community 51 - "agentes.routes.js"
Cohesion: 0.33
Nodes (5): agentesController, authenticate, express, promptsRouter, router

### Community 54 - "workflows.routes.js"
Cohesion: 0.40
Nodes (4): authenticate, express, router, workflowsController

## Knowledge Gaps
- **328 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+323 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `name`, `version`, `description` to the rest of the system?**
  _328 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `database.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `roles.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05689900426742532 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `usuarios.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06970128022759602 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06417112299465241 - nodes in this community are weakly interconnected._
- **Should `callOrchestrator.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08817204301075268 - nodes in this community are weakly interconnected._
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This directory contains **two independent, unrelated npm projects** — there is no root package.json, workspace config, or shared tooling. Always `cd` into the relevant one before running commands.

- `client/` — React 19 + Vite frontend ("MERCI" admin platform for a call-center/IVR product). Package name `inttelec-platform`.
- `merci-platform/` — Node/Express backend for the same MERCI product ("backend" package). Prisma 7 + PostgreSQL.

Neither project has a git remote configured beyond a local `.git`. Neither has an automated test suite (no Jest/Vitest/Mocha configured) — verify changes manually (dev server / manual API calls) rather than assuming `npm test` exists.

## `merci-platform/` (backend)

### Commands
```
npm run dev          # nodemon src/server.js — dev server with auto-reload
npm start             # node src/server.js — plain start
npm run db:pull       # prisma db pull — introspect DB into schema.prisma
npm run db:generate   # prisma generate — regenerate client into generated/prisma
npm run db:studio     # prisma studio
```
There is no build/lint/test script defined in package.json.

The Prisma client is generated to `generated/prisma` (not the default `node_modules/@prisma/client`) — always `require('../../generated/prisma')` via `src/config/database.js`, never `@prisma/client` directly.

`prisma.config.ts` points at `prisma/schema.prisma` and `prisma/migrations`; `DATABASE_URL` comes from `.env`.

### Startup / environment validation
`src/config/env.js` validates `process.env` with a `zod` schema at import time and **calls `process.exit(1)` if anything required is missing** — the server refuses to boot with an incomplete `.env`. Required vars include `DATABASE_URL`, `JWT_SECRET`/`JWT_REFRESH_SECRET`, `OPENAI_API_KEY`, `GOOGLE_GEMINI_API_KEY`, `GOOGLE_CLOUD_PROJECT_ID`/`GOOGLE_APPLICATION_CREDENTIALS`, `ELEVENLABS_API_KEY`, plus per-provider pricing envs (`PRICE_*`) and `MERCI_MARGIN_PERCENTAGE`. When adding a new required env var, add it to this schema — don't just read `process.env.X` ad hoc elsewhere.

### Architecture: layered modules
Each feature lives under `src/modules/<name>/` with four files following a strict one-way dependency chain:
```
<name>.routes.js → <name>.controller.js → <name>.service.js → <name>.repository.js
```
- **routes**: wires Express paths to controller functions, applies `authenticate` / `requirePermission(...)` / rate limiters.
- **controller**: parses `req`, calls the service, shapes the `{ ok, mensaje, data }` response, forwards errors via `next(err)`. No business logic or Prisma calls.
- **service**: business logic, throws `AppError`/`UnauthorizedError`/`ForbiddenError`/`NotFoundError` subclasses.
- **repository**: the *only* layer that talks to Prisma (`src/config/database.js`) for that module.

All new routes get registered in `src/routes/index.routes.js` under `/api`. Modules are informally grouped by team ("Bina 1/2/3/4") in comments there — cosmetic, not functional.

### Auth, tenancy, and permissions
- JWT-based auth (`src/core/middlewares/auth.middleware.js`) verifies the token **and** checks a matching active row in `sesiones` (DB-backed session revocation — logout / forced session kill takes effect immediately even though the JWT itself hasn't expired).
- The JWT payload shape is a contract shared by `auth.middleware`, `tenant.middleware`, and `permission.middleware`:
  ```
  { usuarioId, empresaId, sucursalId, roles, permisos, esGlobal }
  ```
  `sucursalId: null` = Admin General (sees whole company/`empresa`); a UUID = Admin de Sucursal (repositories must scope queries to that branch).
- `esGlobal: true` = Super Admin — bypasses all permission checks in `permission.middleware.js` and tenant scoping in `tenant.middleware.js`. Super Admin has `empresa_id = null` in `usuarios` and logs in without `codigoAcceso`.
- `permission.middleware.js` exports `requirePermission(clave)` and `requireAnyPermission([...])`, checked against `req.user.permisos` (flattened from `usuario_roles → catalogo_roles → roles_permisos → permisos`).
- `tenant.middleware.js` sets `req.empresaId` / `req.sucursalId` from the JWT (or from query params for Super Admin) — repositories filter by these for multi-tenant isolation. **Every repository query must scope by `empresa_id` (and `sucursal_id` when relevant)** — this is the tenant isolation boundary, there's no DB-level RLS.
- Login lockout: 5 failed attempts within a 15-minute window blocks the account (lazy-evaluated from `intentos_login` rows, no cron job clears it).

### Error handling
`src/core/errors/AppError.js` is the base class (`statusCode`, `isOperational`); `AuthError.js` defines `UnauthorizedError` (401) and `ForbiddenError` (403); `NotFoundError.js` similarly. Throw these from services — `src/core/middlewares/error.middleware.js` (registered last in `app.js`) catches them, plus Prisma error codes `P2025` (not found → 404) and `P2002` (unique constraint → 409), and hides stack traces unless `NODE_ENV === 'development'`.

### Async job system (`src/services/worker.service.js`)
Hybrid architecture, started/stopped from `server.js`:
1. **Central dispatcher** — a single `setInterval` polls `jobs_async` (`SELECT ... FOR UPDATE SKIP LOCKED`) and dispatches by `tipo` to handlers in `src/jobs/`: `workflowTrigger`, `ticketAuto`, `grabacionFetch`.
2. **Autonomous AI daemons** — `sttProceso`, `llmProceso`, `ttsProceso` jobs manage their own polling loop independently (also via `SELECT FOR UPDATE SKIP LOCKED`) and self-chain: STT → LLM → TTS. Started/stopped explicitly via `.iniciar()`/`.detener()`, not through the dispatcher's handler map.

### AI provider abstraction (`src/providers/`)
`AIProviderFactory.js` (singleton, in-memory cache keyed by `` `${empresaId}:${tipoProvider}` ``) resolves which concrete provider class to instantiate per company based on `configuraciones_empresa` + `catalogo_proveedores_ia`, so callers never hardcode "OpenAI" vs "Google". Interfaces `ILLMProvider` / `ISTTProvider` / `ITTSProvider` define the contract; concrete implementations live in `providers/{llm,stt,tts}/`. Not all catalog providers have a class yet (Google STT/Gemini, ElevenLabs are `null` in `FABRICAS_PROVIDER` → throw `NotImplementedError`) — check that map before assuming a provider works. The factory also owns `registrarConsumo()`, the single point that computes AI usage cost (provider base price + `MERCI_MARGIN_PERCENTAGE`) and writes to `consumo_ia`.

### Telephony integration
`src/services/callOrchestrator.service.js` bridges CloudUCM (PBX) webhooks to the AI pipeline: `webhooks.service` receives PBX events and delegates to `manejarCallIncoming/Answer/DTMF/End`. Responses to CloudUCM **must** include `status: 0` or CloudUCM silently discards them and falls back to its own native IVR flow — this is documented in detail in the file's header comment because it was the root cause of a past production bug. `services/pbx/` holds the `IPBXProvider` interface and `CloudUCMProvider` implementation.

### Data model
`prisma/schema.prisma` (~60 models) is the source of truth for the Node code; `db/merci_schema.sql` is a raw SQL dump of the same schema (useful for grep-searching constraints/triggers without parsing Prisma syntax). Soft deletes are the norm (`deleted_at` columns, filtered out in repository queries rather than hard `DELETE`). Prisma models are plural snake_case matching table names (e.g. `usuarios`, `catalogo_roles`, `roles_permisos`) — relation field names on a model are the *related table's* name, not a semantic alias.

Key multi-tenant entities: `empresas` (tenant/company) → `sucursales` (branches) → `usuarios`/`agentes_virtuales`/`extensiones` etc. scoped underneath. `catalogo_*` tables are shared lookup/enum tables (not per-tenant).

## `client/` (frontend)

### Commands
```
npm run dev       # vite — dev server (proxies /api/* to http://localhost:3000, see vite.config.js)
npm run build      # vite build
npm run lint       # eslint .
npm run preview    # vite preview
```

### Architecture
- React 19 + React Router 7 + Tailwind 4 (via `@tailwindcss/vite`), plain JS (`.jsx`, no TypeScript).
- `src/routes/AppRoutes.jsx` defines all routes. Two guard components: `RutaProtegida` (must be logged in) and `RutaConPermiso` (must additionally hold a specific permission string, unless `esGlobal`). Routes needing a not-yet-built page use `PageStub` rather than being omitted, so the sidebar menu doesn't dead-end.
- `src/context/AuthContext.jsx` owns the session: on mount it silently redeems the stored refresh token, then calls `/auth/me` to get the full user (including `permisos`/`roles`/`esGlobal` — the `/login` response itself does *not* include permissions, only `/me` does).
- `src/services/api.js` is the sole fetch wrapper. It auto-attaches the bearer token, and on a `401` uses a **singleton in-flight refresh promise** so concurrent failed requests share one `/auth/refresh` call instead of racing each other. On unrecoverable auth failure it dispatches a `merci:sesion-expirada` `window` event, which `AuthContext` listens for to force logout/redirect.
- `src/permissions/usePermissions.jsx` provides `hasPermission()` for conditionally rendering UI (e.g. sidebar items), fed by the same `permisos` array from the JWT/`/me`.
- Backend response envelope is always `{ ok, mensaje, data }`; `api.js` throws on `ok: false` with `error.status`/`error.data` attached.

### Conventions
- Spanish is used throughout both projects for identifiers, comments, error messages, and route/permission names (e.g. `usuarios.ver`, `empresa.configurar`) — match this when adding code, don't switch to English identifiers.
- `graphify-out/` and `.graphifyignore` in both projects are output/config for an external codebase-graphing tool — generated, not hand-maintained.

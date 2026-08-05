# Graph Report - client  (2026-08-05)

## Corpus Check
- 73 files · ~65,937 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 375 nodes · 501 edges · 31 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `40f97a1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- AppRoutes.jsx
- package.json
- AppLayout.jsx
- Departamentos.jsx
- Usuarios.jsx
- Login.jsx
- AuthContext.jsx
- avatarColor.js
- RolesYPermisos.jsx
- Dashboard.jsx
- AgentesVirtuales.jsx
- Extensiones.jsx
- MERCI — Frontend (contexto de proyecto para Claude Code)
- Auditoria.jsx
- Dashboard.jsx
- Fase 1 · Bloque 1.0 · Sección 1.0.3 — `HistorialLlamadas.jsx` con contenido equivocado
- Fase 1 · Bloque 1.0 · Sección 1.0.4 — Primer commit de `client`
- Fase 1 · Bloque 1.2 — Guard de permiso faltante en `AppRoutes.jsx` (varias vistas)
- Fase 1 · Bloque 1.2 — Permiso incorrecto de `Sucursales` en `menuSections.js`
- Línea A — Tickets y Llamadas Activas: de `PageStub` a datos reales
- Línea A · Sección A.1.1 — Conecta `Configuracion.jsx` a `GET/PUT /configuracion/empresa` y `GET /configuracion/proveedores-ia`
- Línea A · Sección A.1.2 — Ajusta `Auditoria.jsx` a la forma real del backend
- Workflows.jsx

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 18 edges
2. `INFORME_SITUACION_ACTUAL — Fase 0 del Plan de Estabilización MERCI` - 11 edges
3. `MERCI — Plan de estabilización v2` - 10 edges
4. `Bloque A.1 — Conectar páginas que ya tienen backend listo` - 8 edges
5. `api` - 7 edges
6. `Fase 1 · Bloque 1.0 · Sección 1.0.3 — `HistorialLlamadas.jsx` con contenido equivocado` - 7 edges
7. `Fase 1 · Bloque 1.0 · Sección 1.0.4 — Primer commit de `client`` - 7 edges
8. `Fase 1 · Bloque 1.2 — Guard de permiso faltante en `AppRoutes.jsx` (varias vistas)` - 7 edges
9. `Fase 1 · Bloque 1.2 — Permiso incorrecto de `Sucursales` en `menuSections.js`` - 7 edges
10. `Línea A · Sección A.1.1 — Conecta `Configuracion.jsx` a `GET/PUT /configuracion/empresa` y `GET /configuracion/proveedores-ia`` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Departamentos()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Departamentos.jsx → src/hooks/useAuth.js
- `ModalCrearUsuario()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Usuarios.jsx → src/hooks/useAuth.js
- `ModalEditarUsuario()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Usuarios.jsx → src/hooks/useAuth.js
- `RutaConPermiso()` --calls--> `useAuth()`  [EXTRACTED]
  src/routes/AppRoutes.jsx → src/hooks/useAuth.js
- `RutaProtegida()` --calls--> `useAuth()`  [EXTRACTED]
  src/routes/AppRoutes.jsx → src/hooks/useAuth.js

## Import Cycles
- None detected.

## Communities (31 total, 0 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+17 more)

### Community 1 - "AppRoutes.jsx"
Cohesion: 0.08
Nodes (23): Bloque A.1 — Conectar páginas que ya tienen backend listo, Bloque A.2 — Optimización de código, Bloqueadores activos (resolver en paralelo, no esperar), Decisiones pendientes del equipo (no resolver sin confirmar), Estado real de cada página del frontend (verificado el 26 de julio), Fase 0 — Diagnóstico ✅, Fase 1 — Estabilización ✅, Fase 2, Bloque 2.4 — Bina 4 ✅ (+15 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (20): lucide-react, dependencies, lucide-react, prop-types, react, react-dom, react-router-dom, name (+12 more)

### Community 3 - "AppLayout.jsx"
Cohesion: 0.23
Nodes (7): Rail(), AI_BAR_HEIGHTS, Sidebar(), SidebarItem, PermissionsContext, PermissionsProvider(), usePermissions()

### Community 4 - "Departamentos.jsx"
Cohesion: 0.08
Nodes (22): ModalConfirmarEliminar(), ModalRol(), ModalSucursal(), colorEstado, formatFecha(), formatFechaCorta(), PanelDetalleUsuario(), Departamentos() (+14 more)

### Community 5 - "Usuarios.jsx"
Cohesion: 0.12
Nodes (15): 1. Qué hace MERCI hoy, en una frase, 2. Cómo se hizo este diagnóstico, 3. El hallazgo más importante: fuga de datos entre empresas en Agentes Virtuales, 4. Estado real por Bina, 5. Cosas que no son de una sola bina, 6. Discrepancias documento vs código real (lo que pedía el Bloque 0.2), 7. Qué tan grande es la brecha hasta "funcional", 8. Qué no se tocó (+7 more)

### Community 6 - "Login.jsx"
Cohesion: 0.50
Nodes (3): InputField(), LoginForm(), TODO: navigate('/contacto') cuando la página esté creada

### Community 7 - "AuthContext.jsx"
Cohesion: 0.11
Nodes (20): App(), AuthContext, AuthProvider(), AuditoriaView(), calcularDiff(), exportarCSV(), formatFecha(), catalogoAuth (+12 more)

### Community 8 - "avatarColor.js"
Cohesion: 0.39
Nodes (7): UserAvatar(), adjustColor(), AVATAR_COLORS, getAvatarColor(), getAvatarGradient(), hexToRgb(), rgbToHex()

### Community 9 - "RolesYPermisos.jsx"
Cohesion: 0.14
Nodes (14): Bloque B.1 — Conocimiento IA (backend + frontend), Bloque B.2 — Dashboard (backend + frontend), Bloque B.3 — Huecos pendientes de Bina 2 y 3 (los que no son módulos nuevos), LÍNEA B — Construir lo que no existe, Sección B.1.1 — Documentos IA, Sección B.1.2 — Información del negocio, Sección B.1.3 — FAQs, Sección B.1.4 — Productos (+6 more)

### Community 10 - "Dashboard.jsx"
Cohesion: 0.07
Nodes (30): ConfirmModal(), FormField(), FormModal(), Header(), LoginMessages(), messages, Header(), OrbAI() (+22 more)

### Community 11 - "AgentesVirtuales.jsx"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + Vite

### Community 12 - "Extensiones.jsx"
Cohesion: 0.18
Nodes (4): badgeEstado(), Extensiones(), extensionesIniciales, usuariosDisponibles

### Community 15 - "MERCI — Frontend (contexto de proyecto para Claude Code)"
Cohesion: 0.25
Nodes (7): Avance del plan (resumen — detalle completo en `Plan_Estabilizacion_MERCI.md`), Convenciones ya establecidas en el código real (no asumir, ya verificado), Estado actual — rama activa y remotos (importante, no es lo habitual), Estilo al trabajar, MERCI — Frontend (contexto de proyecto para Claude Code), Quiénes somos en este repo, Reglas del proyecto (de "Asignación de módulos")

### Community 16 - "Auditoria.jsx"
Cohesion: 0.16
Nodes (16): StatCard(), exportarCSV(), formatDuracion(), formatFecha(), HistorialLlamadas(), mockLlamadas, ESTADOS_ACTIVOS, formatDuracion() (+8 more)

### Community 17 - "Dashboard.jsx"
Cohesion: 0.20
Nodes (9): agentes, badgeAgente(), badgeLlamada(), Dashboard(), kpis, llamadas, llamadasPorHora, sentimientos (+1 more)

### Community 18 - "Fase 1 · Bloque 1.0 · Sección 1.0.3 — `HistorialLlamadas.jsx` con contenido equivocado"
Cohesion: 0.25
Nodes (7): Archivos tocados, Cómo, Fase 1 · Bloque 1.0 · Sección 1.0.3 — `HistorialLlamadas.jsx` con contenido equivocado, Pendiente / riesgos, Pertenece a otra bina?, Por qué, Qué se hizo

### Community 19 - "Fase 1 · Bloque 1.0 · Sección 1.0.4 — Primer commit de `client`"
Cohesion: 0.25
Nodes (7): Archivos tocados, Cómo, Fase 1 · Bloque 1.0 · Sección 1.0.4 — Primer commit de `client`, Pendiente / riesgos, Pertenece a otra bina?, Por qué, Qué se hizo

### Community 20 - "Fase 1 · Bloque 1.2 — Guard de permiso faltante en `AppRoutes.jsx` (varias vistas)"
Cohesion: 0.25
Nodes (7): Archivos tocados, Cómo, Fase 1 · Bloque 1.2 — Guard de permiso faltante en `AppRoutes.jsx` (varias vistas), Pendiente / riesgos, Pertenece a otra bina?, Por qué, Qué se hizo

### Community 25 - "Fase 1 · Bloque 1.2 — Permiso incorrecto de `Sucursales` en `menuSections.js`"
Cohesion: 0.25
Nodes (7): Archivos tocados, Cómo, Fase 1 · Bloque 1.2 — Permiso incorrecto de `Sucursales` en `menuSections.js`, Pendiente / riesgos, Pertenece a otra bina?, Por qué, Qué se hizo

### Community 26 - "Línea A — Tickets y Llamadas Activas: de `PageStub` a datos reales"
Cohesion: 0.18
Nodes (10): Archivos tocados, Cómo, Llamadas Activas — evaluación de viabilidad (pedida explícitamente antes de construir), Línea A — Tickets y Llamadas Activas: de `PageStub` a datos reales, Pendiente / riesgos, Pertenece a otra bina?, Por qué, Qué se hizo (+2 more)

### Community 27 - "Línea A · Sección A.1.1 — Conecta `Configuracion.jsx` a `GET/PUT /configuracion/empresa` y `GET /configuracion/proveedores-ia`"
Cohesion: 0.25
Nodes (7): Archivos tocados, Cómo, Línea A · Sección A.1.1 — Conecta `Configuracion.jsx` a `GET/PUT /configuracion/empresa` y `GET /configuracion/proveedores-ia`, Pendiente / riesgos, Pertenece a otra bina?, Por qué, Qué se hizo

### Community 28 - "Línea A · Sección A.1.2 — Ajusta `Auditoria.jsx` a la forma real del backend"
Cohesion: 0.25
Nodes (7): Archivos tocados, Cómo, Línea A · Sección A.1.2 — Ajusta `Auditoria.jsx` a la forma real del backend, Pendiente / riesgos, Pertenece a otra bina?, Por qué, Qué se hizo

### Community 29 - "Workflows.jsx"
Cohesion: 0.40
Nodes (4): initialActions, initialConditions, initialRules, MerciWorkflowsModule()

## Knowledge Gaps
- **147 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+142 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Dashboard.jsx` to `Departamentos.jsx`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `MERCI — Plan de estabilización v2` connect `AppRoutes.jsx` to `RolesYPermisos.jsx`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _147 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `AppRoutes.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
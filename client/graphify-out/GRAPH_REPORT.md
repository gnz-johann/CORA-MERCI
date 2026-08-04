# Graph Report - client  (2026-07-26)

## Corpus Check
- 65 files · ~57,028 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 293 nodes · 404 edges · 26 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3d47e6c8`
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

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 18 edges
2. `INFORME_SITUACION_ACTUAL — Fase 0 del Plan de Estabilización MERCI` - 11 edges
3. `Fase 1 · Bloque 1.0 · Sección 1.0.3 — `HistorialLlamadas.jsx` con contenido equivocado` - 7 edges
4. `Fase 1 · Bloque 1.0 · Sección 1.0.4 — Primer commit de `client`` - 7 edges
5. `Fase 1 · Bloque 1.2 — Guard de permiso faltante en `AppRoutes.jsx` (varias vistas)` - 7 edges
6. `Fase 1 · Bloque 1.2 — Permiso incorrecto de `Sucursales` en `menuSections.js`` - 7 edges
7. `RolesYPermisos()` - 6 edges
8. `MERCI — Frontend (contexto de proyecto para Claude Code)` - 6 edges
9. `scripts` - 5 edges
10. `AuditoriaView()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `AppLayout()` --calls--> `useAuth()`  [EXTRACTED]
  src/layouts/AppLayout.jsx → src/hooks/useAuth.js
- `Login()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Login.jsx → src/hooks/useAuth.js
- `ModalCrearUsuario()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Usuarios.jsx → src/hooks/useAuth.js
- `ModalEditarUsuario()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Usuarios.jsx → src/hooks/useAuth.js
- `Usuarios()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Usuarios.jsx → src/hooks/useAuth.js

## Import Cycles
- None detected.

## Communities (26 total, 0 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+17 more)

### Community 1 - "AppRoutes.jsx"
Cohesion: 0.15
Nodes (10): Header(), Header(), useAuth(), Departamentos(), DrawerDepartamento(), formatFecha(), ModalCrearUsuario(), ModalEditarUsuario() (+2 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (20): lucide-react, dependencies, lucide-react, prop-types, react, react-dom, react-router-dom, name (+12 more)

### Community 3 - "AppLayout.jsx"
Cohesion: 0.17
Nodes (11): Rail(), AI_BAR_HEIGHTS, Sidebar(), SidebarItem, menuSections, useSidebar(), AppLayout(), iconMap (+3 more)

### Community 4 - "Departamentos.jsx"
Cohesion: 0.16
Nodes (11): ModalConfirmarEliminar(), ModalRol(), ModalSucursal(), CATEGORIA_ICONS, ORDEN_CATEGORIAS, permisosIdsDeRol(), RolesYPermisos(), totalUsuariosDeRol() (+3 more)

### Community 5 - "Usuarios.jsx"
Cohesion: 0.12
Nodes (15): 1. Qué hace MERCI hoy, en una frase, 2. Cómo se hizo este diagnóstico, 3. El hallazgo más importante: fuga de datos entre empresas en Agentes Virtuales, 4. Estado real por Bina, 5. Cosas que no son de una sola bina, 6. Discrepancias documento vs código real (lo que pedía el Bloque 0.2), 7. Qué tan grande es la brecha hasta "funcional", 8. Qué no se tocó (+7 more)

### Community 6 - "Login.jsx"
Cohesion: 0.23
Nodes (7): InputField(), LoginForm(), TODO: navigate('/contacto') cuando la página esté creada, LoginMessages(), messages, OrbAI(), Login()

### Community 7 - "AuthContext.jsx"
Cohesion: 0.20
Nodes (9): App(), AuthContext, AuthProvider(), AppRoutes(), api, renovarToken(), request(), tokenStorage (+1 more)

### Community 8 - "avatarColor.js"
Cohesion: 0.39
Nodes (7): UserAvatar(), adjustColor(), AVATAR_COLORS, getAvatarColor(), getAvatarGradient(), hexToRgb(), rgbToHex()

### Community 9 - "RolesYPermisos.jsx"
Cohesion: 0.17
Nodes (14): ConfirmModal(), FormField(), FormModal(), colorEstado, formatFecha(), formatFechaCorta(), PanelDetalleUsuario(), badgeEstado() (+6 more)

### Community 10 - "Dashboard.jsx"
Cohesion: 0.09
Nodes (18): AgentesVirtuales(), initialAgents, mockPromptHistory, ConocimientoIA(), TODO: Reemplazar por llamadas a API reales (POST, PUT, DELETE), TODO: Eliminar categoría en base de datos, TODO: Reemplazar con la petición real a tu API:, catalogoAuth (+10 more)

### Community 11 - "AgentesVirtuales.jsx"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + Vite

### Community 12 - "Extensiones.jsx"
Cohesion: 0.18
Nodes (4): badgeEstado(), Extensiones(), extensionesIniciales, usuariosDisponibles

### Community 15 - "MERCI — Frontend (contexto de proyecto para Claude Code)"
Cohesion: 0.29
Nodes (6): Convenciones ya establecidas en el código real (no asumir, ya verificado), Estado actual — rama activa y remotos (importante, no es lo habitual), Estilo al trabajar, MERCI — Frontend (contexto de proyecto para Claude Code), Quiénes somos en este repo, Reglas del proyecto (de "Asignación de módulos")

### Community 16 - "Auditoria.jsx"
Cohesion: 0.25
Nodes (11): StatCard(), AuditoriaView(), calcularDiff(), exportarCSV(), formatFecha(), exportarCSV(), formatDuracion(), formatFecha() (+3 more)

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

## Knowledge Gaps
- **95 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `AppRoutes.jsx` to `AppLayout.jsx`, `Login.jsx`, `AuthContext.jsx`, `RolesYPermisos.jsx`, `Dashboard.jsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Usuarios.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `Dashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09401709401709402 - nodes in this community are weakly interconnected._
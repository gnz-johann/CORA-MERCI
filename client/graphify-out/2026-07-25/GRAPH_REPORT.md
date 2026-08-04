# Graph Report - client  (2026-07-25)

## Corpus Check
- 49 files · ~25,843 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 207 nodes · 316 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 18 edges
2. `MERCI — Frontend (contexto de proyecto para Claude Code)` - 6 edges
3. `scripts` - 5 edges
4. `AuditoriaView()` - 5 edges
5. `Usuarios()` - 5 edges
6. `api` - 5 edges
7. `getAvatarGradient()` - 5 edges
8. `PanelDetalleUsuario()` - 4 edges
9. `AppLayout()` - 4 edges
10. `Departamentos()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `AppLayout()` --calls--> `useAuth()`  [EXTRACTED]
  src/layouts/AppLayout.jsx → src/hooks/useAuth.js
- `Configuracion()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/HistorialLlamadas.jsx → src/hooks/useAuth.js
- `Login()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Login.jsx → src/hooks/useAuth.js
- `ModalCrearUsuario()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Usuarios.jsx → src/hooks/useAuth.js
- `ModalEditarUsuario()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Usuarios.jsx → src/hooks/useAuth.js

## Import Cycles
- None detected.

## Communities (17 total, 1 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+17 more)

### Community 1 - "AppRoutes.jsx"
Cohesion: 0.13
Nodes (16): ConfirmModal(), FormModal(), Header(), useAuth(), Departamentos(), DrawerDepartamento(), formatFecha(), badgeEstado() (+8 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (20): lucide-react, dependencies, lucide-react, prop-types, react, react-dom, react-router-dom, name (+12 more)

### Community 3 - "AppLayout.jsx"
Cohesion: 0.17
Nodes (11): Rail(), AI_BAR_HEIGHTS, Sidebar(), SidebarItem, menuSections, useSidebar(), AppLayout(), iconMap (+3 more)

### Community 4 - "Departamentos.jsx"
Cohesion: 0.32
Nodes (4): DrawerSucursal(), formatFecha(), Sucursales(), sucursalesService

### Community 5 - "Usuarios.jsx"
Cohesion: 0.22
Nodes (6): FormField(), CONFIG_INICIAL, ConfiguracionView(), IDIOMAS, inputNumeroClase, configuracionService

### Community 6 - "Login.jsx"
Cohesion: 0.23
Nodes (7): InputField(), LoginForm(), TODO: navigate('/contacto') cuando la página esté creada, LoginMessages(), messages, OrbAI(), Login()

### Community 7 - "AuthContext.jsx"
Cohesion: 0.19
Nodes (9): App(), AuthContext, AuthProvider(), AppRoutes(), api, renovarToken(), request(), tokenStorage (+1 more)

### Community 8 - "avatarColor.js"
Cohesion: 0.39
Nodes (7): UserAvatar(), adjustColor(), AVATAR_COLORS, getAvatarColor(), getAvatarGradient(), hexToRgb(), rgbToHex()

### Community 9 - "RolesYPermisos.jsx"
Cohesion: 0.19
Nodes (8): colorEstado, formatFecha(), formatFechaCorta(), PanelDetalleUsuario(), DrawerRol(), formatFechaCorta(), RolesYPermisos(), rolesService

### Community 10 - "Dashboard.jsx"
Cohesion: 0.12
Nodes (13): agentes, AgentesVirtuales(), getEstadoClass(), BaseConocimiento(), agents, calls, Dashboard(), getBadge() (+5 more)

### Community 11 - "AgentesVirtuales.jsx"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + Vite

### Community 15 - "MERCI — Frontend (contexto de proyecto para Claude Code)"
Cohesion: 0.29
Nodes (6): Archivos ya reescritos en este sprint (con lo que falta), Convenciones ya establecidas en el código real (no asumir, ya verificado), Estilo al trabajar, MERCI — Frontend (contexto de proyecto para Claude Code), Quiénes somos en este repo, Reglas del proyecto (de "Asignación de módulos")

### Community 16 - "Auditoria.jsx"
Cohesion: 0.52
Nodes (5): StatCard(), AuditoriaView(), calcularDiff(), exportarCSV(), formatFecha()

## Knowledge Gaps
- **45 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `AppRoutes.jsx` to `Dashboard.jsx`, `AppLayout.jsx`, `Login.jsx`, `AuthContext.jsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `AppRoutes.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Dashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
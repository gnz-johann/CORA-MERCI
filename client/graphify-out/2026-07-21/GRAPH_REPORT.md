# Graph Report - C:\proyect\client  (2026-07-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 184 nodes · 284 edges · 15 communities (14 shown, 1 thin omitted)
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

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 20 edges
2. `scripts` - 5 edges
3. `Usuarios()` - 5 edges
4. `getAvatarGradient()` - 5 edges
5. `PanelDetalleUsuario()` - 4 edges
6. `AppLayout()` - 4 edges
7. `Departamentos()` - 4 edges
8. `rolesService` - 4 edges
9. `adjustColor()` - 4 edges
10. `Header()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `AppLayout()` --calls--> `useAuth()`  [EXTRACTED]
  src/layouts/AppLayout.jsx → src/hooks/useAuth.js
- `Departamentos()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Departamentos.jsx → src/hooks/useAuth.js
- `Login()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Login.jsx → src/hooks/useAuth.js
- `ModalCrearUsuario()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Usuarios.jsx → src/hooks/useAuth.js
- `ModalEditarUsuario()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Usuarios.jsx → src/hooks/useAuth.js

## Import Cycles
- None detected.

## Communities (15 total, 1 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+17 more)

### Community 1 - "AppRoutes.jsx"
Cohesion: 0.14
Nodes (14): Header(), AuthContext, useAuth(), Auditoria(), BaseConocimiento(), Configuracion(), Configuracion(), Landing() (+6 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (20): lucide-react, dependencies, lucide-react, prop-types, react, react-dom, react-router-dom, name (+12 more)

### Community 3 - "AppLayout.jsx"
Cohesion: 0.17
Nodes (11): Rail(), AI_BAR_HEIGHTS, Sidebar(), SidebarItem, menuSections, useSidebar(), AppLayout(), iconMap (+3 more)

### Community 4 - "Departamentos.jsx"
Cohesion: 0.15
Nodes (9): Departamentos(), DrawerDepartamento(), formatFecha(), DrawerSucursal(), formatFecha(), Sucursales(), departamentosService, sucursalesService (+1 more)

### Community 5 - "Usuarios.jsx"
Cohesion: 0.18
Nodes (11): ConfirmModal(), FormField(), FormModal(), colorEstado, formatFecha(), formatFechaCorta(), PanelDetalleUsuario(), StatCard() (+3 more)

### Community 6 - "Login.jsx"
Cohesion: 0.23
Nodes (7): InputField(), LoginForm(), TODO: navigate('/contacto') cuando la página esté creada, LoginMessages(), messages, OrbAI(), Login()

### Community 7 - "AuthContext.jsx"
Cohesion: 0.27
Nodes (7): App(), AuthProvider(), AppRoutes(), api, renovarToken(), request(), tokenStorage

### Community 8 - "avatarColor.js"
Cohesion: 0.39
Nodes (7): UserAvatar(), adjustColor(), AVATAR_COLORS, getAvatarColor(), getAvatarGradient(), hexToRgb(), rgbToHex()

### Community 9 - "RolesYPermisos.jsx"
Cohesion: 0.28
Nodes (4): DrawerRol(), formatFechaCorta(), RolesYPermisos(), rolesService

### Community 10 - "Dashboard.jsx"
Cohesion: 0.40
Nodes (5): agents, calls, Dashboard(), getBadge(), kpis

### Community 11 - "AgentesVirtuales.jsx"
Cohesion: 0.50
Nodes (3): agentes, AgentesVirtuales(), getEstadoClass()

## Knowledge Gaps
- **35 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `AppRoutes.jsx` to `AppLayout.jsx`, `Departamentos.jsx`, `Usuarios.jsx`, `Login.jsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `AppRoutes.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
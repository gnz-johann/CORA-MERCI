import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../hooks/useAuth'

import Landing             from '../pages/Landing'
import Login               from '../pages/Login'
import Dashboard           from '../pages/Dashboard'
import AgentesVirtuales    from '../pages/AgentesVirtuales'
import Workflows           from '../pages/Workflows'
import Extensiones         from '../pages/Extensiones'
import HistorialLlamadas   from '../pages/HistorialLlamadas'
import BaseConocimiento    from '../pages/BaseConocimiento'
import Usuarios            from '../pages/Usuarios'
import RolesYPermisos      from '../pages/RolesYPermisos'
import Departamentos       from '../pages/Departamentos'
import Sucursales          from '../pages/Sucursales'
import Auditoria           from '../pages/Auditoria'
import Configuracion       from '../pages/Configuracion'
import MiCuenta            from '../pages/MiCuenta'
import Tickets             from '../pages/Tickets'
import LlamadasActivas     from '../pages/LlamadasActivas'
import NotFoundPage        from '../pages/NotFoundPage'

// ─── Guards ───────────────────────────────────────────────────────────────────

function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />
  return children
}

/**
 * Protege rutas que requieren un permiso específico.
 * Super Admin (esGlobal) tiene acceso irrestricto.
 * Sin permiso → redirige al dashboard.
 */
function RutaConPermiso({ permiso, children }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.esGlobal) return children
  if (permiso && !usuario.permisos?.includes(permiso)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// ─── Rutas ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login"   element={<Login />} />

      {/* AppLayout envuelve todas las rutas autenticadas */}
      <Route
        element={
          <RutaProtegida>
            <AppLayout />
          </RutaProtegida>
        }
      >
        {/* Bloque 1.2 — todas las vistas exigen ahora el mismo permiso que ya
            declaraba menuSections.js para decidir si mostrarlas en el menú.
            Antes, ocultar el ítem del menú era la única protección — cualquier
            usuario logueado podía entrar escribiendo la URL directo. */}
        <Route path="/dashboard"
          element={<RutaConPermiso permiso="dashboard.ver"><Dashboard /></RutaConPermiso>}
        />
        <Route path="/agentes-virtuales"
          element={<RutaConPermiso permiso="agentes.ver"><AgentesVirtuales /></RutaConPermiso>}
        />
        <Route path="/extensiones"
          element={<RutaConPermiso permiso="extensiones.ver"><Extensiones /></RutaConPermiso>}
        />
        <Route path="/historial-llamadas"
          element={<RutaConPermiso permiso="llamadas.ver"><HistorialLlamadas /></RutaConPermiso>}
        />
        <Route path="/base-conocimiento"
          element={<RutaConPermiso permiso="documentos.ver"><BaseConocimiento /></RutaConPermiso>}
        />
        <Route path="/configuracion"
          element={<RutaConPermiso permiso="empresa.configurar"><Configuracion /></RutaConPermiso>}
        />
        {/* Workflows no estaba en la lista original del Bloque 1.2, pero tiene el
            mismo hueco (sin guard) — se corrige igual, ver informe de esta sección. */}
        <Route path="/workflows"
          element={<RutaConPermiso permiso="workflows.ver"><Workflows /></RutaConPermiso>}
        />

        {/* Línea A, Sección A.1.3 — ya no son PageStub: Tickets conecta contra
            /api/tickets real; Llamadas Activas contra /api/llamadas (polling,
            no WebSocket — ver informe A.1.3 del por qué). */}
        <Route path="/tickets"
          element={<RutaConPermiso permiso="tickets.ver"><Tickets /></RutaConPermiso>}
        />
        <Route path="/llamadas/activas"
          element={<RutaConPermiso permiso="llamadas.ver"><LlamadasActivas /></RutaConPermiso>}
        />

        {/* Con permiso explícito */}
        <Route path="/usuarios"
          element={<RutaConPermiso permiso="usuarios.ver"><Usuarios /></RutaConPermiso>}
        />
        <Route path="/roles"
          element={<RutaConPermiso permiso="roles.ver"><RolesYPermisos /></RutaConPermiso>}
        />
        <Route path="/auditoria"
          element={<RutaConPermiso permiso="auditoria.ver"><Auditoria /></RutaConPermiso>}
        />
        <Route path="/sucursales"
          element={<RutaConPermiso permiso="sucursales.gestionar"><Sucursales /></RutaConPermiso>}
        />
        <Route path="/departamentos"
          element={<RutaConPermiso permiso="departamentos.ver"><Departamentos /></RutaConPermiso>}
        />

        {/* Sin RutaConPermiso a propósito — es la cuenta del propio usuario
            logueado, no un recurso de negocio; cualquiera con sesión activa
            puede entrar, sin importar sus permisos (ya está protegida por el
            RutaProtegida de más arriba, que exige login). */}
        <Route path="/mi-cuenta" element={<MiCuenta />} />

        {/* 404 — cualquier ruta desconocida se muestra DENTRO del AppLayout
            (Rail/Sidebar/Header visibles) para no expulsar al usuario. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
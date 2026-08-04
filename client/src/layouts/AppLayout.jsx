// src/layouts/AppLayout.jsx
// Cascarón de todas las páginas autenticadas: Rail + Sidebar + Header + <Outlet />.
// Para agregar páginas nuevas registrarlas en src/routes/AppRoutes.jsx.

import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Rail, Sidebar, Header } from '../components/Navigation';
import { useSidebar } from '../hooks/useSidebar';
import { menuSections } from '../data/menuSections';
import { PermissionsProvider } from '../permissions/usePermissions';
import { useAuth } from '../hooks/useAuth';
import '../styles/theme.css';
import './AppLayout.css';

// ─── LOGO ─────────────────────────────────────────────────────────────────────
import logoMerci from '../assets/logo-merci.svg';

// ─── ÍCONOS (SVG locales vía vite-plugin-svgr, sufijo ?react) ──────────────────
// Cada string en menuSections.icon debe tener una entrada en el iconMap.
import LayoutDashboard from '../assets/icons/dashboard.svg?react';
import PhoneCall       from '../assets/icons/phone.svg?react';
import History         from '../assets/icons/historial.svg?react';
import Ticket          from '../assets/icons/tickets.svg?react';
import Bot             from '../assets/icons/agent.svg?react';
import Book            from '../assets/icons/book.svg?react';
import Workflow        from '../assets/icons/workflows.svg?react';
import Users           from '../assets/icons/user.svg?react';
import Shield          from '../assets/icons/roles.svg?react';
import Building        from '../assets/icons/building.svg?react';
import Activity        from '../assets/icons/activity.svg?react';
import Audit           from '../assets/icons/auditoria.svg?react';
import Settings        from '../assets/icons/settings.svg?react';
import Sparks          from '../assets/icons/sparks.svg?react';
import Departament     from '../assets/icons/depa_icon.svg?react';

const iconMap = {
  LayoutDashboard, PhoneCall, History, Ticket, Bot, Book, Workflow,
  Users, Shield, Building, Activity, Audit, Settings, Sparks, Departament,
};

// ─── AppLayout ────────────────────────────────────────────────────────────────

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const currentPath = location.pathname;
  const { activeSection } = useSidebar(menuSections, currentPath);
  const currentItem = menuSections
    .flatMap((s) => s.items)
    .find((i) => i.path === currentPath);

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar el panel mobile al navegar
  useEffect(() => { setSidebarOpen(false); }, [currentPath]);

  // ── Puente JWT → PermissionsProvider ─────────────────────────────────────
  // Super Admin (esGlobal) recibe todos los permisos del menú.
  // El resto recibe exactamente los permisos que vienen en el JWT.
  const permissions = usuario?.esGlobal
    ? menuSections.flatMap((s) => s.items.map((i) => i.permission))
    : (usuario?.permisos ?? []);

  return (
    <PermissionsProvider permissions={permissions}>
      <div className="app-shell">

        <Rail
          sections={menuSections}
          activeSection={activeSection}
          onSectionChange={(_id, firstPath) => navigate(firstPath)}
          iconMap={iconMap}
          logoSrc={logoMerci}
        />

        {/* Backdrop mobile — solo renderizado cuando el panel está abierto */}
        {isSidebarOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={`sidebar-wrap${isSidebarOpen ? ' open' : ''}`}>
          <Sidebar
            sections={menuSections}
            currentPath={currentPath}
            iconMap={iconMap}
            // badges={{ '/tickets': { text: '7', className: 'nb-warn' } }}  ← datos reales en vivo (Bina 2/3)
          />
        </div>

        <div className="app-main">
          <Header
            title={currentItem?.name ?? 'MERCI'}
            onMenuClick={() => setSidebarOpen((open) => !open)}
          />
          <main className="app-content">
            <Outlet />
          </main>
        </div>

      </div>
    </PermissionsProvider>
  );
}

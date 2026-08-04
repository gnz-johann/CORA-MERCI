// src/components/Navigation/Header.jsx
// Header — barra superior. Markup del diseño correcto (título · EN VIVO ·
// pill de empresa · pill de usuario) pero alimentado con datos REALES del
// usuario logueado vía useAuth (nada hardcodeado).
//
// Notas:
// - El pill de empresa se pinta SOLO si el usuario trae un nombre de empresa.
//   El shape exacto de /auth/me lo define el backend; en cuanto la Bina de auth
//   confirme el campo, basta ajustar `empresaNombre` abajo. Multi-tenant: nunca
//   se hardcodea "Inttelec Networks" para no mostrar empresa ajena a otros tenants.
// - El toggle de tema (sol) del mockup se deja para v2; no se incluye aquí.
// - Menú de "Cerrar sesión": se despliega con :hover puro en CSS (ver
//   Header.css, .tb-user-menu / .tb-user-dropdown) — sin estado de React.
//   El ícono es NUEVO (no estaba en el inventario de RolesYPermisos):
//   ruta simulada '../../assets/iconos_vistas/globales/cerrar_sesion.svg?react'.

import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';
import IconCerrarSesion from '../../assets/iconos_vistas/globales/cerrar_sesion.svg?react';
import './Header.css';

export default function Header({ title, onMenuClick }) {
  const { usuario, logout } = useAuth();

  // Rol legible derivado del JWT.
  const userRole = usuario?.esGlobal
    ? 'SUPER ADMIN'
    : usuario?.sucursalId
      ? 'ADMIN · SUCURSAL'
      : 'ADMIN · EMPRESA';

  // Iniciales: primeras letras de las dos primeras palabras del nombre.
  const avatarInitials =
    usuario?.nombre
      ?.split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  // Nombre de empresa (condicional). Ajustar el campo cuando /auth/me lo confirme.
  const empresaNombre =
    usuario?.empresa?.nombre ?? usuario?.empresaNombre ?? usuario?.empresa ?? '';

  return (
    <div className="topbar">
      {/* Botón hamburguesa — solo visible en mobile (< 880px) */}
      <button type="button" className="menu-btn" onClick={onMenuClick} aria-label="Abrir menú">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <div className="tb-title">{title}</div>

      <div className="chip-live">
        <span className="dot-live" />
        EN VIVO
      </div>

      {typeof empresaNombre === 'string' && empresaNombre.trim() !== '' && (
        <div className="tb-company">{empresaNombre}</div>
      )}

      {/* Contenedor que agrupa el pill + el dropdown, para que el :hover de
          CSS cubra ambos sin espacios muertos (ver .tb-user-dropdown en
          Header.css: el padding-top ahí es lo que evita que el menú se
          cierre al mover el mouse del pill hacia abajo). */}
      <div className="tb-user-menu">
        <div className="tb-user-pill">
          <div className="tb-av">{avatarInitials}</div>
          <div>
            <div className="tb-uname">{usuario?.nombre || 'Usuario'}</div>
            <div className="tb-urole">{userRole}</div>
          </div>
        </div>

        <div className="tb-user-dropdown">
          <div className="tb-user-dropdown-inner">
            <button type="button" className="tb-logout-btn" onClick={logout}>
              <IconCerrarSesion className="tb-logout-ico" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
  onMenuClick: PropTypes.func,
};

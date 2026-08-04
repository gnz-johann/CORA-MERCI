// src/pages/PageStub.jsx
//
// Placeholder temporal para rutas cuyo módulo aún no existe (Tickets, Workflows,
// Llamadas Activas). Evita que el catch-all expulse al usuario a /landing.
// Cuando un compañero termine la página real, se reemplaza el element de esa
// ruta en src/routes/AppRoutes.jsx — sin tocar Rail/Sidebar/Header.

import PropTypes from 'prop-types';

export default function PageStub({ title, path }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, marginBottom: 8 }}>{title}</h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)' }}>
        Ruta: {path} — página pendiente de construir.
      </p>
    </div>
  );
}

PageStub.propTypes = {
  title: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
};

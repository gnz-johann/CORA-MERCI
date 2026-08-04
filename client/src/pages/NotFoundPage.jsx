// Se muestra cuando alguien entra a una ruta que no existe en menuSections.js.
// Mantiene el Rail/Sidebar/Header visibles (vive dentro de AppLayout) para
// que la persona pueda seguir navegando sin quedar varada.

import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
        <div
            style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: 3,
            color: 'var(--text3)',
            marginBottom: 8,
            }}
        >
            ERROR 404
        </div>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 24, marginBottom: 12 }}>
            No encontramos esta página
        </h2>
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
            La ruta que buscas no existe o fue movida.
        </p>
        <Link
            to="/dashboard"
            style={{
            display: 'inline-block',
            padding: '10px 20px',
            borderRadius: 9,
            background: 'var(--glow)',
            border: '1px solid rgba(21, 94, 239, 0.28)',
            color: 'var(--blue2)',
            textDecoration: 'none',
            fontWeight: 600,
            }}
        >
            Volver al Dashboard
        </Link>
        </div>
    );
}

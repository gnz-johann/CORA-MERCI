import { useRef } from 'react';
import PropTypes from 'prop-types';
import SidebarItem from './SidebarItem';
import { usePermissions } from '../../permissions/usePermissions';
import './Sidebar.css';

const AI_BAR_HEIGHTS = [4, 7, 10, 14, 11, 8, 12, 6, 9, 13, 5, 10];

/**
 * Sidebar — barra de 220px. Muestra SIEMPRE las 6 secciones completas
 * (igual que el HTML final): lo único que cambia al navegar es qué ítem
 * queda resaltado, derivado de `currentPath`.
 *
 * @param {Array} sections     - menuSections
 * @param {string} currentPath - ruta actual, para resaltar el item activo
 * @param {Object} iconMap     - { [iconName]: ComponenteIcono } — TÚ LO ARMAS (mismo objeto que en Rail)
 * @param {string} model       - modelo/motor de IA mostrado en el widget (default "GPT-4o").
 *   Hoy es OpenAI; si se elige otro motor, se pasa aquí sin tocar el componente.
 * @param {Object} quota       - { percent, tokensPerHour, latencyMs } — datos del panel inferior.
 *   Tienen valores por defecto para el diseño; cuando el backend exponga los reales,
 *   se pasan desde AppLayout: <Sidebar quota={quotaReal} model={modelReal} ... />
 * @param {Object} badges      - { [path]: { text, className } } — números en vivo (tickets abiertos,
 *   llamadas activas, etc.). Van SEPARADOS de menuSections.js a propósito: menuSections.js es solo
 *   estructura del menú (fija), badges es dato que cambia en tiempo real. Ejemplo:
 *   <Sidebar badges={{ '/tickets': { text: String(ticketCount), className: 'nb-warn' } }} ... />
 *
 * La navegación la maneja internamente <Link> de react-router (SidebarItem.jsx) —
 * por eso no hay una prop onNavigate: clic normal, Ctrl+clic, clic central y
 * "abrir en pestaña nueva" funcionan todos solos
 */
export default function Sidebar({
  sections,
  currentPath = '',
  iconMap,
  model = 'GPT-4o',
  quota = { percent: 62, tokensPerHour: '48K', latencyMs: 312 },
  badges = {},
}) {
  const { hasPermission } = usePermissions();

  // Lista plana de refs de TODOS los ítems visibles, en orden — sin importar
  // en qué sección estén. Así las flechas ↑↓ se mueven de corrido por todo
  // el menú, igual que esperarías en cualquier lista de navegación.
  const itemRefs = useRef([]);
  itemRefs.current = [];
  const registerItemRef = (el) => {
    if (el) itemRefs.current.push(el);
  };

  const handleKeyDown = (e) => {
    const items = itemRefs.current;
    const currentIndex = items.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = null;
    if (e.key === 'ArrowDown') nextIndex = Math.min(currentIndex + 1, items.length - 1);
    else if (e.key === 'ArrowUp') nextIndex = Math.max(currentIndex - 1, 0);
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = items.length - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      items[nextIndex].focus();
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <div className="sidebar-brand">MERCI</div>
          <div className="sidebar-sub">AI VOICE ENGINE</div>
        </div>
      </div>

      <div className="ai-strip">
        <div className="ai-strip-row">
          <div className="ai-pulse" />
          <span className="ai-label">MOTOR IA</span>
          <span className="ai-model">{model}</span>
        </div>
        <div className="ai-bars">
          {AI_BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="ai-bar"
              style={{ '--h': `${h}px`, '--d': `${0.35 + i * 0.13}s`, animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>
      </div>

      <div className="nav-scroll" onKeyDown={handleKeyDown}>
        {sections.map((section) => {
          const visibleItems = section.items.filter((item) => hasPermission(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div className="nav-group" key={section.id}>
              <div className="nav-group-label">{section.title}</div>
              {visibleItems.map((item) => (
                <SidebarItem
                  key={item.path}
                  ref={registerItemRef}
                  item={badges[item.path] ? { ...item, badge: badges[item.path] } : item}
                  Icon={iconMap[item.icon]}
                  isActive={item.path === currentPath}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div className="quota-block">
        <div className="quota-row">
          <span>Cuota mensual</span>
          <span className="quota-pct">{quota.percent}%</span>
        </div>
        <div className="quota-track">
          <div className="quota-fill" style={{ width: `${quota.percent}%` }} />
        </div>
        <div className="quota-cards">
          <div className="quota-card">
            <div className="quota-card-label">Tokens/h</div>
            <div className="quota-card-value">{quota.tokensPerHour}</div>
          </div>
          <div className="quota-card">
            <div className="quota-card-label">Latencia</div>
            <div className="quota-card-value success">
              {quota.latencyMs}
              <span className="quota-card-unit">ms</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  sections: PropTypes.array.isRequired,
  currentPath: PropTypes.string,
  iconMap: PropTypes.object.isRequired,
  model: PropTypes.string,
  quota: PropTypes.shape({
    percent: PropTypes.number,
    tokensPerHour: PropTypes.string,
    latencyMs: PropTypes.number,
  }),
  badges: PropTypes.objectOf(
    PropTypes.shape({
      text: PropTypes.string,
      className: PropTypes.string,
    })
  ),
};

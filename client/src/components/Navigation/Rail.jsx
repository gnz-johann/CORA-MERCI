import PropTypes from 'prop-types';
import './Rail.css';

/**
 * Rail — barra de 56px, solo íconos con tooltip.
 *
 * @param {Array} sections     - menuSections (usa id, icon, title, pinBottom)
 * @param {string} activeSection - id de la sección activa
 * @param {Function} onSectionChange - (id) => void
 * @param {Object} iconMap     - { [iconName]: ComponenteIcono } — TÚ LO ARMAS
 *   ej: import { LayoutDashboard, PhoneCall, Bot, Users, Activity, Settings } from 'tu-libreria-de-iconos';
 *       const iconMap = { LayoutDashboard, PhoneCall, Bot, Users, Activity, Settings };
 * @param {string} logoSrc    ruta/import de la imagen del logo MERCI
 *   ej: import logoMerci from '../../assets/logo-merci.svg';  <Rail logoSrc={logoMerci} ... />
 */
export default function Rail({ sections, activeSection = null, onSectionChange, iconMap, logoSrc }) {
  return (
    <nav className="rail" aria-label="Navegación principal">
      <img src={logoSrc} alt="MERCI" className="rail-logo" />

      {sections.map((section, index) => {
        const Icon = iconMap[section.icon];
        const isActive = section.id === activeSection;

        return (
          <div key={section.id} style={{ display: 'contents' }}>
            {section.pinBottom ? (
              <div className="rail-spacer" aria-hidden="true" />
            ) : (
              index > 0 && <div className="rail-sep" aria-hidden="true" />
            )}
            <button
              type="button"
              className={`rail-icon${isActive ? ' active' : ''}`}
              onClick={() => onSectionChange(section.id, section.items[0]?.path)}
              aria-current={isActive ? 'true' : undefined}
              aria-label={section.title}
            >
              {Icon && <Icon className="rail-ico" />}
              <span className="rail-tip" role="tooltip">
                {section.title}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

Rail.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      pinBottom: PropTypes.bool,
    })
  ).isRequired,
  activeSection: PropTypes.string,
  onSectionChange: PropTypes.func.isRequired,
  iconMap: PropTypes.object.isRequired,
  logoSrc: PropTypes.string.isRequired,
};

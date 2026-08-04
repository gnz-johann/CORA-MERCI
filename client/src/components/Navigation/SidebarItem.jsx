import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const SidebarItem = forwardRef(function SidebarItem({ item, Icon = null, isActive = false }, ref) {
  return (
    <Link
      ref={ref}
      to={item.path}
      className={`nav-item${isActive ? ' active' : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {Icon && <Icon className="nav-ico" />}
      {item.name}
      {item.badge && (
        <span className={`nav-badge ${item.badge.className || ''}`}>{item.badge.text}</span>
      )}
    </Link>
  );
});

SidebarItem.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    badge: PropTypes.shape({
      text: PropTypes.string,
      className: PropTypes.string,
    }),
  }).isRequired,
  Icon: PropTypes.elementType,
  isActive: PropTypes.bool,
};

export default SidebarItem;

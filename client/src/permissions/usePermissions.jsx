import { createContext, useContext } from 'react';

const PermissionsContext = createContext({ permissions: [] });

/**
 * Proveedor de permisos. AppLayout lo alimenta con los permisos
 * del JWT (via useAuth) para que Sidebar los filtre automáticamente.
 */
export function PermissionsProvider({ permissions = [], children }) {
  return (
    <PermissionsContext.Provider value={{ permissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const { permissions } = useContext(PermissionsContext);

  const hasPermission = (permission) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  return { permissions, hasPermission };
}

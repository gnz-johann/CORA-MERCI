import api from './api'

//Usuarios 

export const usuariosService = {
  listar: (busqueda = '') => {
    const q = busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : ''
    return api.get(`/usuarios${q}`)
  },
  obtener:        (id) => api.get(`/usuarios/${id}`),
  crear:          (datos) => api.post('/usuarios', datos),
  editar:         (id, datos) => api.put(`/usuarios/${id}`, datos),
  eliminar:       (id) => api.delete(`/usuarios/${id}`),
  asignarRoles:   (id, rolesIds) => api.patch(`/usuarios/${id}/roles`, { rolesIds }),
  desbloquear:    (id) => api.patch(`/usuarios/${id}/desbloquear`, {}),
  cambiarPassword:(id, datos) => api.patch(`/usuarios/${id}/password`, datos),
  stats:          () => api.get('/usuarios/stats'),
  // Catálogo global de estados (Activo, Inactivo, Suspendido, Bloqueado…)
  estados:        () => api.get('/usuarios/estados'),
}

// Roles 

export const rolesService = {
  listar:          () => api.get('/roles'),
  obtener:         (id) => api.get(`/roles/${id}`),
  listarPermisos:  () => api.get('/roles/permisos'),
  crear:           (datos) => api.post('/roles', datos),
  editar:          (id, datos) => api.put(`/roles/${id}`, datos),
  eliminar:        (id) => api.delete(`/roles/${id}`),
  asignarPermisos: (id, permisosIds) => api.patch(`/roles/${id}/permisos`, { permisosIds }),
}

// Sucursales 

export const sucursalesService = {
  listar: (busqueda = '') => {
    const q = busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : ''
    return api.get(`/sucursales${q}`)
  },
  obtener:  (id) => api.get(`/sucursales/${id}`),
  crear:    (datos) => api.post('/sucursales', datos),
  editar:   (id, datos) => api.put(`/sucursales/${id}`, datos),
  eliminar: (id) => api.delete(`/sucursales/${id}`),
}

// Departamentos 

export const departamentosService = {
  listar:   () => api.get('/departamentos'),
  obtener:  (id) => api.get(`/departamentos/${id}`),
  crear:    (datos) => api.post('/departamentos', datos),
  editar:   (id, datos) => api.put(`/departamentos/${id}`, datos),
  eliminar: (id) => api.delete(`/departamentos/${id}`),
}
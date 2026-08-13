// `icon` es un string (nombre lógico) propios componentes de
// ícono (o SVGs) pasa un `iconMap` = { NombreIcono: <ComponenteIcono /> }
// a Rail y Sidebar — este archivo no depende de ninguna librería.
//
// pinBottom: true en una sección hace que, en el Rail, esa sección (y todo lo que venga después) se ancle hasta abajo del todo.

export const menuSections = [
  {
    id: 'principal',
    icon: 'LayoutDashboard', // ícono de sección, usado en el Rail
    title: 'PRINCIPAL',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', permission: 'dashboard.ver' },
    ],
  },
  {
    id: 'operacion',
    icon: 'PhoneCall',
    title: 'OPERACIÓN',
    items: [
      { name: 'Extensiones', path: '/extensiones', icon: 'PhoneCall', permission: 'extensiones.ver' },
      { name: 'Historial Llamadas', path: '/historial-llamadas', icon: 'History', permission: 'llamadas.ver' },
      { name: 'Tickets', path: '/tickets', icon: 'Ticket', permission: 'tickets.ver' },
    ],
  },
  {
    id: 'ia',
    icon: 'Sparks',
    title: 'INTELIGENCIA ARTIFICIAL',
    items: [
      { name: 'Agentes Virtuales', path: '/agentes-virtuales', icon: 'Bot', permission: 'agentes.ver' },
      // Ruta y permiso intactos (/base-conocimiento · documentos.ver); solo el rótulo visible cambia a "Conocimiento IA" para calzar con el mockup.
      { name: 'Conocimiento IA', path: '/base-conocimiento', icon: 'Book', permission: 'documentos.ver' },
      { name: 'Workflows', path: '/workflows', icon: 'Workflow', permission: 'workflows.ver' },
    ],
  },
  {
    id: 'administracion',
    icon: 'Building',
    title: 'ADMINISTRACIÓN',
    items: [
      { name: 'Usuarios', path: '/usuarios', icon: 'Users', permission: 'usuarios.ver' },
      { name: 'Roles y Permisos', path: '/roles', icon: 'Shield', permission: 'roles.ver' },
      { name: 'Sucursales', path: '/sucursales', icon: 'Building', permission: 'sucursales.gestionar' },
      //{ name: 'Departamentos', path: '/departamentos', icon: 'Departament', permission: 'departamentos.ver'}
    ],
  },
  {
    id: 'monitorizacion',
    icon: 'Activity',
    title: 'MONITORIZACIÓN',
    items: [
      { name: 'Llamadas Activas', path: '/llamadas/activas', icon: 'Activity', permission: 'llamadas.ver' },
    ],
  },
  {
    id: 'sistema',
    icon: 'Settings',
    title: 'SISTEMA',
    pinBottom: true,
    items: [
      // Primero a propósito: el ícono de engranaje del Rail navega siempre
      // al PRIMER item de la sección (ver Rail.jsx#onSectionChange) — antes
      // "Auditoría" estaba primero, así que el engranaje (que visualmente
      // se lee como "cuenta/ajustes") mandaba ahí en vez de a la cuenta del
      // usuario. Sin `permission`: cualquier usuario logueado la ve, no es
      // un recurso de negocio con permiso propio.
      { name: 'Mi Cuenta', path: '/mi-cuenta', icon: 'Users', permission: null },
      { name: 'Auditoría', path: '/auditoria', icon: 'Audit', permission: 'auditoria.ver' },
      { name: 'Configuración', path: '/configuracion', icon: 'Settings', permission: 'empresa.configurar' },
    ],
  },
];

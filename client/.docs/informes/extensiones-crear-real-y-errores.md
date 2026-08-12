# Extensiones.jsx — conecta creación real + UI de errores por categoría

## Qué se hizo
`Extensiones.jsx` era 100% mock (array `extensionesIniciales` hardcodeado, `handleCrear`
solo tocaba estado local, sin ningún `fetch` real). Se conectó el listado a
`GET /api/extensiones` y la creación a `POST /api/extensiones` (ver informe del backend en
`merci-platform/.docs/informes/cloudUCM-errores-y-crear-extension.md`), con manejo de
errores por categoría.

## Por qué
Sin esto, "crear extensión" no llegaba a ningún lado — solo simulaba éxito en memoria. El
pedido específico era conectarlo de verdad y diferenciar cómo reacciona la UI según el tipo
de error que devuelva CloudUCM.

## Cómo
- **Corrección a la premisa del pedido, verificada antes de asumir nada**: el botón de crear
  no estaba deshabilitado en el código real (a diferencia de lo que decía el pedido) — todo
  el archivo era mock sin ninguna conexión, ni real ni deshabilitada. Se construyó desde ahí:
  el botón queda habilitado por default, y se deshabilita dinámicamente solo cuando hay un
  error de categoría `conexion` activo (`errorConexion` en el estado).
- **Categoría `conexion`** → bandera fija (banner) arriba de la tabla + botón "NUEVA
  EXTENSIÓN" deshabilitado (con `title` mostrando el motivo) hasta que una creación
  posterior salga bien (se limpia la bandera en el próximo `handleCrear` exitoso).
- **Categoría `validacion`/`sistema`** (o sin categoría, ej. validación local de campo
  vacío) → `ErrorModal`, puntual, se cierra con "Entendido" y no toca nada más de la vista —
  la tabla, los filtros y el botón de crear siguen funcionando normal.
- `err.data?.categoria` es lo que trae el error — confirmado que `api.js` ya adjunta el body
  completo de la respuesta de error en `error.data` (no hubo que tocar `api.js`).
- Se separó el modal de creación (`CrearExtensionModal`, conectado, solo pide
  `extension`/`nombre`/`secret` — lo que el backend real usa) del modal de edición
  (`EditarExtensionModal`, que se dejó **igual de mock que antes** — no existe
  `PUT /api/extensiones/:id` en el backend, conectarlo no era parte de este pedido).
  Eliminar tampoco está conectado (no existe `DELETE`), mismo criterio.
- La tabla y las KPI cards se remapearon a los campos reales (`extension`, `nombre`,
  `catalogo_estado_extension.nombre`, `sucursales.nombre`, `departamentos.nombre`,
  `pbx_mac_address`) — se quitaron las columnas "Usuario Asignado"/"Handle" del mock viejo
  porque no hay ningún dato real detrás (el `SELECT` del backend no trae esa relación).
- `npm run build` limpio. `npx eslint`: 1 error, el mismo patrón `react-hooks/set-state-in-effect`
  ya presente en el resto de la app (no se corrige aquí, ya documentado como decisión de
  equipo pendiente). Se corrigió además un `'onClose' is defined but never used` en el
  componente `Toast` — ya estaba en el mock original, se limpió de paso al reescribir el
  archivo.

## Archivos tocados
- `src/services/extensiones.service.js` (creado)
- `src/pages/Extensiones.jsx` (reescrito — listado + creación reales, resto sigue mock)

## Pendiente / riesgos
- **No se pudo verificar visualmente en navegador** (sin `chromium-cli`/Playwright en este
  entorno) — verificado con build limpio + llamadas HTTP reales replicando exactamente lo
  que hace el componente: `GET /extensiones` (lista vacía real, no mock) y `POST /extensiones`
  sin PBX configurado, confirmando que `err.data.categoria === 'conexion'` llega tal cual el
  componente lo espera.
- No se pudo probar el camino de éxito de creación (no hay PBX real en este entorno) — mismo
  límite ya documentado del lado del backend.
- Editar y eliminar extensiones siguen siendo acciones puramente locales (no persisten) —
  fuera de alcance, backend no las soporta todavía.
- Los filtros de sucursal/estado ahora se derivan de los valores reales que traigan las
  extensiones cargadas (antes eran del mock) — si no hay ninguna extensión con sucursal
  asignada, el filtro de sucursales queda vacío (comportamiento esperado, no un bug).

## Pertenece a otra bina?
No para este archivo (Bina 4/frontend general). Los endpoints reales que ahora consume
(`GET`/`POST /api/extensiones`) son de Bina 3.

# Prioridad 2 — Botón de "Configuración de cuenta": ubicado y corregido

## Decisión tomada
Elegiste la opción 2: construir una pantalla real de cuenta personal, separada de
`/configuracion` (que es config de empresa). Lo que sigue abajo es primero el diagnóstico
original (por qué el botón redirigía mal) y después qué se construyó para resolverlo.

## Dónde está el botón y qué hace hoy

No existe un botón literal con el texto "Configuración de cuenta" en ningún componente de
header/menú de usuario (`src/components/Header.jsx`, `src/components/Navigation/Header.jsx`,
`UserAvatar.jsx`) — ambos Header solo tienen un botón de "Cerrar sesión". **El botón real es
el ícono de engranaje (⚙) anclado abajo del todo en el Rail** (`src/components/Navigation/Rail.jsx`),
que es el patrón visual estándar en casi cualquier dashboard para "ajustes/cuenta" — sección
`sistema` de `menuSections.js`, con `icon: 'Settings'` y `pinBottom: true`.

## La causa exacta del bug

`menuSections.js` (líneas 56-65) define la sección así:

```js
{
  id: 'sistema',
  icon: 'Settings',
  title: 'SISTEMA',
  pinBottom: true,
  items: [
    { name: 'Auditoría',      path: '/auditoria',     ... },
    { name: 'Configuración',  path: '/configuracion',  ... },
  ],
},
```

Y en `Rail.jsx` (línea 35), el click del ícono de sección hace:

```js
onClick={() => onSectionChange(section.id, section.items[0]?.path)}
```

— navega siempre al **primer item** de la sección, sin importar cuál sea. Y en
`AppLayout.jsx` (línea 73):

```js
onSectionChange={(_id, firstPath) => navigate(firstPath)}
```

navega ahí directo, sin mostrar ningún submenú intermedio. Como `Auditoría` está primero en
el array de `items` de la sección `sistema`, el gear icon del Rail siempre manda a
`/auditoria`, nunca a `/configuracion` — exactamente el síntoma que describiste. No es un
problema del componente `Sidebar.jsx` (ese sí navega correctamente a cada item individual
cuando se hace click ahí) — es específico del ícono de sección en el Rail angosto.

## La decisión real que falta — no es solo "cambiar el orden del array"

Ahí es donde entra la segunda parte de tu pregunta. Revisé qué es `/configuracion`
(`Configuracion.jsx`) hoy: según `client/CLAUDE.md`, es una pantalla de **configuración de
la empresa/tenant** — panel "Configuración IA", tarjeta "Proveedores IA", tarjeta "Central
Telefónica (PBX)" — gateada por el permiso `empresa.configurar`. **No existe en ningún lado
del proyecto una pantalla de "configuración de cuenta" personal** (cambiar mi propia
contraseña, mi nombre, mi avatar, preferencias de notificación, etc.) — confirmado
revisando `AppRoutes.jsx` completo, no hay ninguna ruta parecida.

Entonces hay dos escenarios posibles detrás de "el botón redirige mal", y llevan a trabajo
muy distinto:

1. **El gear icon del Rail debería llevar a `/configuracion`** (la pantalla de empresa que
   ya existe) — en ese caso el fix es puramente de routing: reordenar `items` en
   `menuSections.js` (Configuración primero) y/o hacer que `Rail.jsx` no asuma
   "primer item" sino que reciba explícitamente a dónde debe ir el ícono de cada sección.
   Trabajo chico, sin pantallas nuevas.
2. **El gear icon debería llevar a una "configuración de cuenta" personal de verdad**
   (distinta de la config de empresa) — en ese caso hace falta diseñar y construir una
   pantalla nueva desde cero (ruta, permiso, backend si aplica para editar el propio
   perfil/contraseña), porque hoy no existe nada parecido en ningún punto del proyecto.
   Trabajo bastante más grande, y no hay ningún mockup ni contrato de referencia para
   basarse.

No elegí ninguna de las dos por mi cuenta porque son alcances completamente distintos y la
instrucción pedía explícitamente reportar antes de decidir.

## Qué se construyó

### Backend — reutilizando lo que ya existía, no reinventado
Antes de escribir nada nuevo se revisó `usuariosService` completo (`usuarios.service.js`) y
resultó que **ya soportaba el caso "un usuario editando/cambiando su propia contraseña"**:
`cambiarPassword` ya tiene una rama `if (adminId === usuarioId)` que exige y valida
`passwordActual` — pensada para cuando el que llama es el mismo usuario objetivo. Lo único
que faltaba era una forma de *llegar* ahí sin el permiso `usuarios.editar` (que es para
administrar a otros, no a uno mismo). Se agregaron 3 rutas nuevas en `usuarios.routes.js`,
**sin `requirePermission`** (cualquier usuario autenticado puede usarlas, forzando siempre
el id al del propio token, nunca al de la URL):

- `GET /api/usuarios/me` → `usuariosController.obtenerPropio` (reusa `obtenerPorId`)
- `PUT /api/usuarios/me` → `usuariosController.editarPropio` (reusa `editar`)
- `PATCH /api/usuarios/me/password` → `usuariosController.cambiarPasswordPropio` (reusa `cambiarPassword`)

Ningún archivo de `usuarios.service.js` ni `usuarios.repository.js` se modificó — todo el
trabajo nuevo fue de ruteo/controller, reusando lógica de negocio que ya era correcta.

### Frontend
- `client/src/services/usuarios.service.js`: `propio()`, `editarPropio()`,
  `cambiarPasswordPropio()`.
- `client/src/pages/MiCuenta.jsx` (nuevo): dos paneles — "Perfil" (nombre/usuario/correo,
  editable) y "Cambiar contraseña" (actual/nueva/confirmar, con validación de que
  nueva=confirmar antes de mandar la request).
- `AppRoutes.jsx`: ruta `/mi-cuenta`, **sin `RutaConPermiso`** a propósito — no es un
  recurso de negocio con permiso propio, es la cuenta del usuario logueado; ya queda
  protegida por el `RutaProtegida` que envuelve todo `AppLayout` (exige sesión activa, nada
  más).
- `menuSections.js`: se agregó `Mi Cuenta` como **primer item** de la sección `sistema`
  (antes de Auditoría y Configuración), con `permission: null` (visible para cualquiera). Al
  ser el primero, el bug de `Rail.jsx` (que siempre navega a `items[0]`) ahora resuelve
  correcto en vez de mal — se corrigió aprovechando el mismo mecanismo que causaba el bug,
  no cambiando `Rail.jsx`. Se documentó ahí mismo, en un comentario, por qué el orden
  importa — para que nadie reordene sin querer y reintroduzca el bug original.

## Verificación
- `node --check` en los archivos de backend tocados, y `require('./src/app')` completo sin
  errores (confirma que las rutas nuevas cargan bien junto con todo el resto del servidor).
- Se corrió `usuariosService.obtenerPorId()` directo contra Postgres real con un usuario del
  seed — devuelve nombre/usuario/correo/roles/permisos reales.
- `npm run build` del frontend completo (todo el batch de esta sesión, no solo esta tarea)
  compila sin errores.
- No se probó el flujo completo por HTTP con sesión real (login → `/mi-cuenta` → cambiar
  contraseña) — no hay navegador disponible en este entorno; recomendado probarlo
  manualmente antes de dar por cerrada esta tarea.


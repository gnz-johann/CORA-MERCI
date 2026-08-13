# Logging de CloudUCM + prueba real de creación de extensión

## Qué se hizo
1. `CloudUCMProvider.js#_request()` — antes de lanzar el error categorizado, se agregó
   `console.error('CloudUCM respondió status != 0:', { action, status, response })` con el
   dato crudo completo.
2. `error.middleware.js` — los `AppError` que traen `categoria` (los de `cloudUCMErrors.js`)
   ahora también se loguean en el `catch` correspondiente, no solo el fallback de 500 no
   controlado.
3. Se creó una extensión de prueba real (`extension: "9999"`, `nombre: "PRUEBA MERCI -
   borrar"`, con contraseña SIP real) contra el CloudUCM ya conectado
   (`merci_dev_inttelec` @ `0729f8.a.myucm.cloud`).

## Resultado real de la prueba (tal como pediste, sin asumir de antemano)
**Falló.** HTTP `502`, `categoria: "sistema"`:
```
{"ok":false,"mensaje":"No se pudo completar la operación en la central telefónica. Intenta de nuevo.","categoria":"sistema"}
```

Gracias al logging nuevo, la terminal del backend mostró el detalle real que antes era
invisible:
```
CloudUCM respondió status != 0: {
  action: 'addSIPAccountAndUser',
  status: -25,
  response: { error_msg: 'Failed to update data.' }
}
```

**Status `-25` = "Failed to update data"** — un error genérico de CloudUCM, no un bug de
MERCI ni un problema de conexión/autenticación (la sesión sí se estableció bien, igual que en
la prueba de `probar-conexion` anterior). No se creó nada en BD local (confirmado con una
consulta directa: 0 filas en `extensiones`) — la falla ocurrió del lado de CloudUCM antes de
llegar al paso de reflejarlo en BD, tal como está diseñado.

## Por qué pudo haber fallado (no confirmado, son hipótesis — no se investigó más porque no se pidió)
El mensaje de CloudUCM (`Failed to update data`) es demasiado genérico para saber la causa
exacta sin más información del lado del PBX. Posibles causas, sin descartar ni confirmar
ninguna: el número `9999` podría estar fuera del rango de extensiones permitido en el plan de
numeración de esta central, el usuario de la API podría no tener permiso para crear cuentas
SIP (distinto de poder hacer `login`/`getSystemStatus`), o podría haber una validación propia
de CloudUCM sobre el formato de `secret` u otro campo no evidente desde la documentación.

## Archivos tocados
- `src/services/pbx/CloudUCMProvider.js` (editado — logging en `_request()`; **zona
  restringida**, mismo aviso que en secciones anteriores)
- `src/core/middlewares/error.middleware.js` (editado — logging de `AppError` con `categoria`)

## Pendiente / riesgos
- **No se implementó borrado**, tal como se pidió explícitamente — no hizo falta de todos
  modos, porque la creación falló y no quedó nada que borrar, ni en CloudUCM ni en BD local.
- La causa raíz del `-25` no se investigó a fondo (no se pidió) — si se quiere insistir con
  la creación real, valdría la pena probar con un número de extensión típico del rango que
  ya usa esta central (no `9999`) o revisar del lado del panel de CloudUCM qué rango/permiso
  espera, antes de intentar de nuevo.
- El logging nuevo en `_request()` va a aparecer en la terminal cada vez que CUALQUIER
  llamada a CloudUCM falle (no solo creación de extensiones) — es intencional (era el punto
  del pedido), pero vale que el equipo sepa que a partir de ahora los fallos de sync, CDR,
  etc. también van a ser más verbosos en el log del servidor.

## Pertenece a otra bina?
Sí — ambos archivos son de Bina 3 (`services/pbx/` y `core/middlewares/`, este último
compartido por todo el proyecto, no exclusivo de una bina, pero el cambio fue motivado por
un caso de PBX).

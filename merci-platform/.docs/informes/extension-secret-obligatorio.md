# Extensiones — `secret` pasa a ser obligatorio (CloudUCM nunca lo devuelve)

## Qué se hizo
Se confirmó en la documentación oficial de Grandstream que `addSIPAccountAndUser` **nunca**
devuelve el `secret` (contraseña SIP) en su respuesta — ni el que se envía, ni uno generado
automáticamente si se omite. Como consecuencia, `secret` pasó de opcional a **obligatorio**
tanto en el backend (`extensiones.service.js`) como en el formulario de creación
(`Extensiones.jsx`).

## Por qué
Si CloudUCM genera una contraseña sola cuando `secret` se omite, esa extensión queda creada
pero inutilizable — nadie conoce su contraseña y la API nunca la expone para poder
mostrarla después, ni siquiera consultando la extensión ya creada.

## Cómo
- **Verificación en la documentación real antes de decidir**, tal como se pidió: se releyó
  la sección `addSIPAccountAndUser` de
  `.docs/IPPBX-HTTPS-API-Documentation-Center.pdf` (texto extraído con `pdftotext`, ya
  disponible de una sección anterior). La respuesta documentada es, sin excepción:
  ```json
  { "response": { "need_apply": "yes" }, "status": 0 }
  ```
  No hay ningún campo de contraseña en la respuesta, se haya mandado `secret` o no. Se buscó
  además cualquier nota sobre generación automática (`grep -i "generat"`) — el único
  resultado relacionado con "generate secret" es sobre el `challenge` del login (MD5), sin
  relación con extensiones SIP.
- Como la respuesta **NO** incluye el secret bajo ninguna circunstancia, se aplicó la
  segunda rama de la instrucción: campo obligatorio, no captura-y-muestra.
- **Backend** (`extensiones.service.js#crearExtension`): nueva validación
  `if (!datos?.secret) throw new AppError(...)` — se agregó **antes** de
  `cloudUCM.connect(empresaId)`, igual que la validación de `extension` que ya existía, para
  que una request inválida falle rápido sin tocar CloudUCM ni la BD.
- **Frontend** (`Extensiones.jsx`): el campo "Contraseña SIP" ahora es obligatorio (`*` en el
  label, nota explicando por qué, ya no dice "se genera una si se deja vacío" — eso hubiera
  sido engañoso, sugería una garantía que la API no ofrece). El botón "Crear Extensión" se
  deshabilita si el campo está vacío, igual que ya hacía con `extension`.

## Verificación
Se probó el caso que debía fallar: `POST /api/extensiones` sin `secret` →
`400 { mensaje: "La contraseña SIP (secret) es obligatoria..." }`, y se confirmó que no se
creó nada en BD. La validación corre antes de `cloudUCM.connect()`, así que tampoco tocó el
PBX real.

**No se probó el caso de éxito (crear con `secret`)** — a diferencia de las secciones
anteriores, esta vez había una configuración PBX real y funcional guardada
(`merci_dev_inttelec` en `0729f8.a.myucm.cloud`), así que un `POST` con `secret` habría
creado una extensión SIP **real** en esa central telefónica — un efecto en un sistema
externo que no se pidió explícitamente en esta instrucción. Se optó por no hacerlo sin
avisar primero.

## Archivos tocados
- `src/modules/extensiones/extensiones.service.js` (editado — validación de `secret`)
- `client/src/pages/Extensiones.jsx` (editado — campo obligatorio en el formulario)

## Pendiente / riesgos
- **Falta probar el camino de éxito contra el PBX real** — crear una extensión con `secret`
  y confirmar que efectivamente queda utilizable (login SIP con esa contraseña, si se quiere
  verificar hasta ese nivel). Requiere confirmación explícita antes de crear datos reales en
  la central telefónica del cliente, y sería buena práctica también decidir si esa extensión
  de prueba se borra después (hay una acción `deleteUser` documentada en el PDF, pero
  `CloudUCMProvider.js` no la implementa todavía).
- No se agregó ninguna validación de fortaleza/formato para `secret` (longitud mínima,
  caracteres permitidos) — no se pidió, y la documentación de `updateSIPAccount` no especifica
  ninguna restricción más allá de "string".

## Pertenece a otra bina?
Sí — ambos archivos son de Bina 3 (`extensiones.service.js`, back; `Extensiones.jsx` toca el
mismo módulo del lado del frontend).

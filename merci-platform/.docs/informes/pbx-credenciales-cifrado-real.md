# PBX — cifra `configuraciones_pbx.credenciales` de verdad (reusa el mecanismo de `credenciales_ia`)

## Qué se hizo
`pbx.repository.js` guardaba `datos.credenciales` (incluida la contraseña del PBX) tal cual
llegaba del request — el comentario del código decía "las credenciales se guardan
encriptadas" pero nunca cifraba nada. Se cifra ahora con el mismo mecanismo AES-256-GCM que
ya existe para `credenciales_ia` (`src/core/utils/credencialesIA.crypto.js`, Sección 2.4.3) —
no se escribió una función de cifrado nueva, se reutilizó la existente tal cual.

## Por qué
El modal de "Configurar Credenciales" en `Configuracion.jsx` (frontend) le promete al
usuario "Las credenciales se almacenan cifradas y no son visibles una vez guardadas" — pero
del lado del backend eso era falso para el PBX. Cualquiera con acceso directo a la BD (o a
un dump) podía leer la contraseña real del PBX en texto plano.

## Cómo
- **Se reutilizó la función existente, no se creó una nueva** — exactamente lo pedido:
  `pbx.repository.js` ahora importa `{ cifrar }` de `../../core/utils/credencialesIA.crypto`
  y lo usa en `crearConfigPbx` y `actualizarConfigPbx` antes de escribir en Postgres.
- **`CloudUCMProvider.connect()`** (zona restringida, ya se venía tocando por pedido explícito
  en la sección anterior) ahora descifra `config.credenciales` con `descifrar()` de ese mismo
  archivo antes de leer `.password`. Si el descifrado falla (dato corrupto o cifrado con una
  clave distinta a la actual), se trata como error de categoría `conexion` — no se deja pasar
  en silencio ni se intenta usar basura como contraseña.
- **Se verificó antes de escribir cualquier código** que no hubiera filas existentes en
  `configuraciones_pbx` con credenciales ya guardadas en texto plano — la tabla estaba vacía
  (0 filas). Esto significa que no hizo falta ninguna lógica de compatibilidad con datos
  legacy sin cifrar; si hubiera habido filas viejas, este cambio las habría dejado
  indescifrables (se documenta como riesgo abajo, por si en producción sí hay datos).
- Se actualizó el comentario de cabecera de `credencialesIA.crypto.js`, que documentaba
  explícitamente el bug de `pbx.repository.js` como algo vigente — ya no lo es, se dejó
  registro de que se corrigió reusando la misma función, para no dejar un comentario
  desactualizado contradiciendo el código real.

## Verificación (pedida explícitamente antes de cerrar el informe)
Se guardó una configuración PBX real vía `PUT /api/configuracion/pbx` (contraseña
`SuperSecreta123!`), y se consultó la tabla **directo con Prisma, sin pasar por ningún
endpoint** (la misma vía que usaría Prisma Studio):

```json
"credenciales": {
  "iv": "51301e1cca6ff1908a093589",
  "authTag": "f6b6c9b4db508e561d016407424d7810",
  "ciphertext": "9ddcaf215b4d855f515dd8ae6a8df00b99f3122324c68de4ff7a9714ad83b7"
}
```

La contraseña **no aparece en ningún lado de la fila cruda**. Después, se llamó a
`POST /configuracion/pbx/probar-conexion` (que internamente pasa por
`CloudUCMProvider.connect()`) — el error que dio fue `ETIMEDOUT` contra la IP de prueba
(192.168.1.50, no es un PBX real), no un error de "no se pudieron leer las credenciales" —
confirma que el descifrado sí extrajo la contraseña real antes de intentar conectar. La fila
de prueba se borró al terminar.

## Archivos tocados
- `src/modules/configuracion/pbx.repository.js` (editado — cifra en `crearConfigPbx`/`actualizarConfigPbx`)
- `src/services/pbx/CloudUCMProvider.js` (editado — descifra en `connect()`; **zona restringida**, ver Pendiente)
- `src/core/utils/credencialesIA.crypto.js` (editado — comentario de cabecera actualizado, sin cambios de código)

## Pendiente / riesgos
- **El punto clave: si alguna vez existieron filas reales con credenciales de PBX en texto
  plano (fuera de esta sesión, en otro entorno), este cambio las deja indescifrables** —
  `descifrar()` va a lanzar sobre un objeto `{password: '...'}` plano (no tiene
  `iv`/`authTag`/`ciphertext`), y `connect()` lo va a reportar como error de conexión en vez
  de leer la contraseña vieja. En este entorno se verificó que la tabla estaba vacía antes de
  aplicar el cambio, así que no hay impacto aquí — pero si esto se despliega a un ambiente con
  datos reales ya guardados, cada empresa con un PBX configurado va a necesitar volver a
  guardar sus credenciales una vez (se recifran solas al hacer `PUT` de nuevo). No se
  construyó ningún script de migración porque no hacía falta en este entorno — el equipo debe
  saberlo antes de desplegar esto a un ambiente con datos reales.
- Se sigue modificando `CloudUCMProvider.js` (zona restringida, `services/pbx/`) — mismo
  aviso que en la sección anterior, ahora por un segundo cambio en el mismo archivo.
- No se tocó `pbx.service.js` ni `pbx.controller.js` — no lo necesitaban, el cifrado/descifrado
  quedó contenido en la capa de repository (donde se escribe) y en el provider (donde se lee
  para conectar), sin que el service intermedio tenga que saber que existe cifrado.

## Pertenece a otra bina?
Sí — `pbx.repository.js` y `CloudUCMProvider.js` son de Bina 3. Se corrigió un bug de
seguridad real en código de otra bina, avisado explícitamente aquí como pide la regla del
proyecto.

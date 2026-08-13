# Informe de Auditoría — Parámetros de `addSIPAccountAndUser` / `updateSIPAccount`: documentación oficial vs. código real

**Modo:** auditoría únicamente. No se realizó ninguna llamada a la API real de CloudUCM
durante esta tarea, y no se propuso ni se aplicó ningún cambio de código. Todo lo que sigue
es lectura de los dos PDFs en `.docs/` (extraídos con `pdftotext -layout`) y lectura directa
del código real en `merci-platform/` y `client/`.

## Alcance

1. Lista completa y exacta de parámetros que Grandstream documenta para
   `addSIPAccountAndUser` (que la propia doc declara idéntica a `updateSIPAccount`),
   con su condición de obligatorio/opcional y cualquier nota especial.
2. Dónde aparece cada uno de esos parámetros en el código de MERCI (backend y frontend),
   sin asumir todavía si está bien conectado.
3. Recorrido real del dato, campo por campo, desde el formulario "Nueva Extensión"
   (`Extensiones.jsx`) hasta el payload final que `CloudUCMProvider.addSIPAccountAndUser()`
   envía a CloudUCM — confirmando en cada punto si el nombre y el valor sobreviven sin
   pérdida, renombre o transformación inesperada.
4. Hallazgos, sin proponer corrección.

---

## Parte 1 — Parámetros documentados por Grandstream

Fuente: `.docs/IPPBX-HTTPS-API-Documentation-Center.pdf`, sección `Add SIPAccountAndUser`
(dice explícitamente: *"The addSIPAccountAndUser's supported parameters and values are the
same as the existing updateSIPAccount command"*) + la tabla completa de parámetros de la
sección `updateSIPAccount` que le sigue (única tabla de parámetros que existe para esta
acción en el PDF).

### 1.1 — Únicos dos campos obligatorios según la tabla oficial

| Parámetro   | Obligatorio | Tipo   | Nota |
|-------------|:-----------:|--------|------|
| `cookie`    | **Sí**      | string | Cookie de sesión ya autenticada. Sin ella, CloudUCM responde `-6`. |
| `extension` | **Sí**      | string | 2-18 dígitos. Único campo de negocio realmente obligatorio para identificar la extensión. |

### 1.2 — Resto de parámetros de la tabla `updateSIPAccount` (todos opcionales, `no` en la columna Mandatory)

| Parámetro | Tipo | Nota / valores válidos |
|---|---|---|
| `hasvoicemail` | string | yes / no |
| `cidnumber` | string | Caller ID de llamadas entrantes |
| `secret` | string | Contraseña SIP/IAX — **la propia tabla no documenta ninguna restricción de formato ni longitud**, aunque el manual de usuario sí exige una política de complejidad para el flujo de creación vía GUI (ver informe de la sesión anterior sobre las hipótesis descartadas) |
| `vmsecret` | string | Contraseña de voicemail |
| `skip_vmsecret` | string | yes / no |
| `ring_timeout` | int | 3-600, o `null` para usar el valor global |
| `auto_record` | string | all / external / internal / off |
| `encryption` | string | no / yes / support (SRTP) |
| `faxdetect` | string | no / yes |
| `sendtofax` | string | yes / no |
| `strategy_ipacl` | int | 0 / 1 / 2 |
| `local_network1` … `local_network10` | string | Subredes permitidas cuando `strategy_ipacl=1` |
| `specific_ip` | string | IP específica cuando `strategy_ipacl=2` |
| `allow` | string | Lista de codecs (ulaw, alaw, gsm, g726, g722, g729, h264, ilbc, …) |
| `dnd` | string | yes / no |
| `dnd_timetype` | int | 0,1,2,3,4,5,6,8 |
| `permission` | string | internal / internal-local / internal-local-national / internal-local-national-international |
| `nat` | string | yes / no |
| `bypass_outrt_auth` | string | no / yes / bytime |
| `skip_auth_timetype` | int | 0,1,2,3,4,5,6,8 |
| `t38_udptl` | string | yes / no |
| `directmedia` | string | yes / no |
| `dtmfmode` | string | rfc4733 / info / inband / auto |
| `enable_qualify` | string | yes / no |
| `qualifyfreq` | int | 1-3600 segundos (columna "Value" la marca como "Required" si se usa `enable_qualify`, pero la columna Mandatory general la deja en "no") |
| `authid` | string | Hasta 32 caracteres, sin espacio ni `;:?"()<>@,\/[]={}.` |
| `tel_uri` | string | disabled / user_phone / enabled |
| `enablehotdesk` | string | yes / no |
| `user_outrt_passwd` | string | 4-10 dígitos |
| `out_of_service` | string | yes / no |
| `mohsuggest` | string | default / ringback_tone_default / nombre de playlist MoH |
| `en_ringboth` | string | yes / no |
| `external_number` | string | Hasta 32 caracteres alfanuméricos + `+-*#` |
| `use_callee_dod_on_fwd_rb` | string | yes / no |
| `use_callee_dod_on_fm` | string | yes / no |
| `ringboth_timetype` | int | 0,1,2,3,4,5,6,8 |
| `enable_ldap` | string | yes / no |
| `max_contacts` | int | 1-10 (registros concurrentes) |
| `custom_autoanswer` | string | yes / no |
| `sca_enable` | string | yes / no |
| `call_waiting` | string | yes / no |
| `emergcidnumber` | string | 2-32 caracteres alfanuméricos |
| `enable_webrtc` | string | yes / no |
| `alertinfo` | string | ring1…ring10, Bellcore-dr1…dr5, custom, none |
| `limitime` | int | 0-86400 segundos, duración máxima de llamada (0 = sin límite) |
| `dndwhitelist` | string | Números separados por coma |
| `fwdwhitelist` | string | Extensiones separadas por coma |
| `callbarging_monitor` | string | Lista de extensiones que pueden espiar esta extensión |
| `seamless_transfer_members` | string | Lista de extensiones para transferencia sin intervención |
| `sip_presence_settings` | JSON array | Configuración de presencia (ver nota 1.4 sobre inconsistencia de nombre) |
| `presence_status` | string | available / away / chat / dnd / userdef / unavailable |
| `cfb`, `cfn`, `cfu` | string | Destino de reenvío (busy / no-answer / unconditional) |
| `cfb_timetype`, `cfn_timetype`, `cfu_timetype` | int | 0,1,2,3,4,5,6,8 |
| `cfb_destination_type`, `cfn_destination_type`, `cfu_destination_type` | int | 0-6 (None/Extension/Custom/Voicemail/RingGroup/Queues/VoicemailGroup) |
| `vm_attach` | string | yes / no / null (usa config global) |
| `vm_reserve` | string | yes / no / null (usa config global) |

### 1.3 — Condición especial documentada (la única "campo obligatorio según el valor de otro" que aparece en el PDF)

> *"Editing presence configuration requires sending the entire json list of
> sip_presence_settings. Make sure to specify the presence status when updating
> presence settings."*

Es decir: `sip_presence_settings` es opcional en general, pero si se manda, debe ir el
array completo con los 5 estados de presencia — no se puede mandar un subconjunto. Es la
única condicionalidad documentada entre parámetros en toda la tabla.

### 1.4 — Inconsistencia real dentro de la propia documentación de Grandstream

El ejemplo de request que el PDF muestra específicamente para `addSIPAccountAndUser`
(no para `updateSIPAccount`) incluye estos campos:

```json
"max_contacts": "3",
"permission": "internal",
"language": "ch",
"secret": "Abc123456!",
"vmsecret": "Abc123456!",
"user_password": "Abc123456!",
"wave_privilege_id": "0",
"presence_settings": [ ... ]
```

De estos, **tres no aparecen en ninguna parte de la tabla de parámetros** que la misma
página dice que aplica (`language`, `user_password`, `wave_privilege_id`) — no hay fila,
tipo, ni descripción para ellos en ningún lugar del PDF. Y el campo de presencia aparece
con el nombre `presence_settings` en el ejemplo, pero `sip_presence_settings` en la tabla
de parámetros — no queda claro cuál de los dos nombres es el real. Esto es una
inconsistencia documental preexistente de Grandstream, no un error de lectura de esta
auditoría.

---

## Parte 2 — Dónde aparece cada parámetro en el código de MERCI

Búsqueda hecha sobre `merci-platform/src/` completo y `client/src/` completo (no solo el
módulo de extensiones), para no asumir que un parámetro "no existe" solo porque no está en
el módulo obvio.

| Parámetro (doc.) | ¿Aparece en `Extensiones.jsx`? | ¿En `extensiones.service.js` (frontend)? | ¿En `POST /api/extensiones` (controller)? | ¿En `extensiones.service.js` (backend)? | ¿En `CloudUCMProvider.js`? |
|---|---|---|---|---|---|
| `extension` | Sí — campo del form | Sí — pasa tal cual | Sí — `req.body` | Sí — validado + reenviado | Sí — validado + reenviado |
| `secret` | Sí — campo del form | Sí — pasa tal cual | Sí — `req.body` | Sí — validado + reenviado | Sí — reenviado |
| `nombre` | Sí — campo del form | Sí — pasa tal cual | Sí — `req.body` | Sí — pero **no se reenvía a CloudUCM**, solo a BD local | No aparece (correcto: no es parámetro de CloudUCM) |
| `cidnumber` | **No** — no hay campo en el form | **No** | No lo manda el frontend, pero el controller lo *documenta* en su comentario de ejemplo de body (línea 58) | Sí — se destructura de `datos` y se reenvía *si viene* | No aparece por nombre propio, pero el JSDoc de `addSIPAccountAndUser` lo lista como parámetro esperado |
| `permission` | **No** — no hay campo en el form | **No** | Mismo caso que `cidnumber` (documentado en el comentario, no en un input real) | Sí — mismo patrón que `cidnumber` | Mismo caso que `cidnumber` |
| Todos los demás (~55 restantes: `vmsecret`, `user_password`, `wave_privilege_id`, `max_contacts`, `language`, `sip_presence_settings`/`presence_settings`, `authid`, `hasvoicemail`, `qualifyfreq`, etc.) | No | No | No | No | No |

Nota sobre `permission`: la palabra `permission` sí aparece muchas veces en `client/src`
(`menuSections.js`, `usePermissions.jsx`, `Sidebar.jsx`), pero siempre en el sentido de
"permiso RBAC de MERCI" (`extensiones.ver`, `usuarios.ver`, etc.) — no tiene ninguna
relación con el `permission` de CloudUCM (nivel de privilegio de llamada saliente). No hay
colisión real en el código, pero se deja registrado para que no se confunda si alguien
busca `permission` en el repo esperando encontrar el campo de CloudUCM.

---

## Parte 3 — Recorrido real del dato, capa por capa

### 3.1 — `extension`

1. `Extensiones.jsx:145` — estado del form: `{ extension: "", ... }`
2. `Extensiones.jsx:157` — input controlado, sin transformación, sin validación de formato
   (el `note` dice "2-18 dígitos" pero es solo texto informativo, no hay regex ni `maxLength`)
3. `Extensiones.jsx:368` — `handleCrear`: `extension: form.extension.trim()` — se le aplica
   `.trim()` (quita espacios) antes de mandarlo
4. `extensiones.service.js` (frontend, línea 12) — `crear: (datos) => api.post('/extensiones', datos)`
   — pasa el objeto completo sin tocar ningún campo
5. `api.js:122` — `JSON.stringify(body)` — serializa el objeto tal cual, la clave sigue
   siendo `extension`
6. `extensiones.controller.js:66` — `req.body` ya trae `{ extension, ... }` con el mismo
   nombre
7. `extensiones.service.js` (backend, línea 162) — `if (!datos?.extension) throw ...` —
   valida presencia, no formato
8. `extensiones.service.js` (backend, línea 182 y 184) — `const { extension, ... } = datos`
   → `extension: String(extension)` — coerción a string (no-op real, porque ya llega como
   string desde un `<input type="text">`, pero es una transformación explícita en el código)
9. `CloudUCMProvider.js:318-325` — `addSIPAccountAndUser(empresaId, datos)` recibe
   `{ extension: "<valor>", secret: "<valor>" }`, valida `!datos?.extension` de nuevo, y
   pasa `datos` completo a `_request('addSIPAccountAndUser', datos)`
10. `CloudUCMProvider.js:185-190` — `_request` arma
    `{ request: { action, cookie: this.cookie, ...params } }` — el spread de `params`
    inyecta `extension` sin cambiar la clave

**Conclusión para `extension`:** mismo nombre, mismo valor (salvo `.trim()` en el frontend
y un `String()` sin efecto real en el backend) en las 10 paradas. Sin pérdida, sin
renombre inesperado.

### 3.2 — `secret`

1. `Extensiones.jsx:145` — estado del form
2. `Extensiones.jsx:159-166` — input tipo `password`, sin validación de fortaleza ni
   longitud mínima (ningún `pattern`, ningún chequeo en `onChange`)
3. `Extensiones.jsx:370` — `secret: form.secret.trim() || undefined` — si el usuario deja
   el campo vacío (imposible en la práctica porque el botón se deshabilita, línea 175, pero
   el código lo contempla), se manda `undefined` en vez de string vacío
4. `extensiones.service.js` (frontend) → `api.post` → `JSON.stringify` — si el valor es
   `undefined`, `JSON.stringify` **omite la clave por completo** del JSON enviado (no manda
   `"secret": null`, directamente no aparece la clave) — comportamiento estándar de
   `JSON.stringify`, no un bug, pero es la única transformación real de todo el recorrido
   que puede hacer desaparecer una clave completa antes de llegar al backend
5. `extensiones.controller.js:66` — `req.body`
6. `extensiones.service.js` (backend, línea 173) — `if (!datos?.secret) throw ...` — si el
   paso 4 hizo desaparecer la clave, esta validación la atrapa aquí con un 400 claro, antes
   de tocar CloudUCM
7. `extensiones.service.js` (backend, línea 185) — `...(secret && { secret })` — spread
   condicional: como el paso 6 ya garantizó que `secret` es truthy si se llegó hasta acá,
   esta condición **siempre evalúa a verdadero en la práctica** — es un guard redundante,
   no una pérdida de dato (la rama `false` de este spread es código muerto en el flujo real,
   porque nunca se llega a esta línea con `secret` falsy)
8. `CloudUCMProvider.js` → `_request` → mismo mecanismo que `extension`, misma clave

**Conclusión para `secret`:** mismo nombre, mismo valor en todas las paradas donde
efectivamente viaja. El único punto real de "pérdida posible" es el paso 4
(`JSON.stringify` omitiendo `undefined`), pero está cubierto por una validación explícita
en el paso 6 que lo convierte en un error claro (400), no en un fallo silencioso.

### 3.3 — `nombre`

1. `Extensiones.jsx:145` — estado del form
2. `Extensiones.jsx:369` — `nombre: form.nombre.trim() || undefined`
3. → `extensiones.service.js` (frontend) → `api.post` → llega a `extensiones.controller.js`
   con el mismo nombre
4. `extensiones.service.js` (backend, línea 182) — se destructura `nombre` de `datos`
5. `extensiones.service.js` (backend, línea 199) — `nombre: nombre || null` — **se manda a
   `extensionesRepository.upsertExtension` (BD local), NO a `cloudUCM.addSIPAccountAndUser`**

**Conclusión para `nombre`:** no hay pérdida ni renombre — es un desvío de ruta
intencional y correcto según el diseño actual: `nombre` nunca fue pensado para viajar a
CloudUCM (no es un parámetro de `addSIPAccountAndUser`/`updateSIPAccount` en ninguna parte
de la doc), solo se persiste en la tabla `extensiones` de MERCI. Se documenta aquí porque
la pregunta pedía confirmar el recorrido completo de cada campo del formulario, no porque
sea un hallazgo de pérdida.

### 3.4 — `cidnumber` y `permission`

1. **No existen como campos en `CrearExtensionModal` (`Extensiones.jsx:144-185`)** — el
   `useState` inicial es literalmente `{ extension: "", nombre: "", secret: "" }`, sin
   `cidnumber` ni `permission`
2. Por lo tanto, `extensionesService.crear()` (frontend) nunca los recibe, nunca los manda
3. `extensiones.controller.js:58` los **menciona en el comentario JSDoc** del body
   esperado (`{ "extension": "1010", "nombre": "Ventas 03", "secret": "...", "cidnumber": "...", "permission": "internal" }`)
   — es decir, el contrato documentado en el propio código backend es más amplio que lo que
   el frontend real puede producir
4. `extensiones.service.js` (backend, línea 182) — `const { extension, nombre, secret, cidnumber, permission } = datos`
   — destructura ambos campos de `datos` (`req.body`)
5. `extensiones.service.js` (backend, línea 186-187) —
   `...(cidnumber && { cidnumber })`, `...(permission && { permission })` — como `datos`
   nunca trae estas claves desde el frontend actual, `cidnumber` y `permission` son
   siempre `undefined` en este punto → ambos spreads evalúan a `{}` → **ninguno de los dos
   llega jamás al payload que se manda a CloudUCM, en el estado actual del sistema**
6. `CloudUCMProvider.js` — el JSDoc de `addSIPAccountAndUser` (línea 315) también los
   lista como parámetros esperados (`{ extension, secret?, cidnumber?, permission?, ... }`),
   pero nunca los recibe en la práctica

**Conclusión para `cidnumber`/`permission`:** no es un caso de "pérdida" en el sentido de
un dato que el usuario ingresó y se perdió en el camino — es código backend (service +
provider) escrito y documentado para aceptar estos dos campos opcionales, pero **la única
fuente real de datos hoy (el formulario de `Extensiones.jsx`) nunca los produce**. Es
tramo de código estructuralmente inalcanzable con la UI actual, no un bug de transformación.
Ya estaba anotado como pendiente en `.docs/informes/cloudUCM-errores-y-crear-extension.md`
(línea 85-88) de una sesión anterior: *"addSIPAccountAndUser solo pasa extension/secret/cidnumber/permission — el resto de los parámetros que soporta la acción real (...) no se expusieron porque el formulario del frontend no los pide"* — confirmado aquí que ni siquiera esos dos que sí "pasa" tienen forma de llegar con datos reales todavía.

---

## Parte 4 — Payload final real, confirmado línea por línea

Con el formulario actual (`extension`, `nombre`, `secret` como únicos campos posibles),
el payload que **efectivamente** sale hacia CloudUCM en cada creación, sin excepción, es:

```json
{
  "request": {
    "action": "addSIPAccountAndUser",
    "cookie": "<cookie de sesión activa>",
    "extension": "<valor del form, trimmed>",
    "secret": "<valor del form, trimmed>"
  }
}
```

Ningún otro parámetro de los ~60 documentados (Parte 1) viaja jamás en el payload actual,
incluyendo los que el propio ejemplo oficial de `addSIPAccountAndUser` muestra
(`max_contacts`, `permission`, `language`, `vmsecret`, `user_password`,
`wave_privilege_id`, `presence_settings`) y los dos que el backend sí tiene código
preparado para reenviar pero que la UI nunca produce (`cidnumber`, `permission`).

---

## Parte 5 — Resumen de hallazgos

1. **No se encontró ningún caso de renombre o transformación inesperada** en los
   parámetros que sí viajan de punta a punta (`extension`, `secret`) — llegan con el mismo
   nombre y el mismo valor (salvo `.trim()`/`String()`, ambos intencionales e inocuos) en
   las diez paradas del recorrido.
2. **`cidnumber` y `permission` están "cableados" en el backend (service + provider +
   comentarios JSDoc) pero son estructuralmente inalcanzables** con el formulario actual de
   `Extensiones.jsx` — no hay inputs para ellos, así que los spreads condicionales que los
   reenviarían nunca se activan. Esto ya estaba anotado como pendiente conocido en un
   informe de sesión anterior, no es un hallazgo nuevo, pero esta auditoría confirma el
   mecanismo exacto por el que quedan siempre vacíos.
3. **`nombre` diverge de ruta de forma intencional** (va a BD local, no a CloudUCM) — no es
   una pérdida, es el diseño actual.
4. **Ninguno de los ~55 parámetros opcionales restantes documentados por Grandstream para
   esta acción** (`vmsecret`, `user_password`, `wave_privilege_id`, `max_contacts`,
   `language`, `sip_presence_settings`/`presence_settings`, `authid`, `hasvoicemail`,
   `qualifyfreq`, los de call-forwarding, etc.) **aparece en ningún punto del código**, ni
   siquiera como referencia muerta — no están ni en el form, ni en los services, ni en el
   provider.
5. **La propia documentación de Grandstream es internamente inconsistente**: el ejemplo de
   `addSIPAccountAndUser` incluye tres campos (`language`, `user_password`,
   `wave_privilege_id`) que no están descritos en ninguna tabla de parámetros del PDF, y usa
   el nombre `presence_settings` en el ejemplo mientras la tabla de parámetros lo llama
   `sip_presence_settings`. Esto no afecta al código actual de MERCI (ninguno de los dos
   nombres se usa hoy), pero es relevante si en el futuro se decide exponer configuración de
   presencia desde el formulario.
6. **El guard `...(secret && { secret })` en el backend es código muerto en su rama falsa**
   — dado que `crearExtension` ya lanza un error 400 antes si `secret` no vino, para cuando
   se llega a esa línea `secret` siempre es truthy. No causa ningún problema funcional, solo
   se deja registrado porque la auditoría pedía no asumir que "un campo existe en el código"
   significa que su lógica condicional es alcanzable de verdad.

No se propone ni se aplica ningún cambio en este informe — es exclusivamente el resultado
de la auditoría solicitada.

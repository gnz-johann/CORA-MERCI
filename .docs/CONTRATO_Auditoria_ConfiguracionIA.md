# Contrato de API — Auditoría + Configuración IA (para Kevin)

Todo lo de aquí sale de leer el schema real (`prisma/schema.prisma`) y el código
actual del repo, no de suposiciones. Fuente de cada dato marcada entre [ ].

## Convención de respuesta (confirmada en el código real, no en el doc de asignación)

El doc general dice `{ success, message, data }`, pero **el código real usa
`{ ok, mensaje, data }`** (así lo consume `api.js` del front, así responde
`pbx.controller.js` y `tickets.controller.js`). Usa esta forma, no la del doc:

```js
res.status(200).json({ ok: true, mensaje: 'texto', data: {...} })
res.status(4xx/5xx).json({ ok: false, mensaje: 'texto del error' })
```

## Dónde poner los archivos nuevos (para no tocar el módulo de Bina 3)

`src/modules/configuracion/configuracion.routes.js` tiene en su encabezado
"Bina 3 — CloudUCM, Llamadas y PBX". No lo edites. En su lugar:

```
src/modules/configuracion/
  configuracion.routes.js        ← de Bina 3, NO TOCAR
  pbx.controller.js / .service.js / .repository.js   ← de Bina 3, NO TOCAR
  configuracionIA.routes.js      ← NUEVO, tuyo
  configuracionIA.controller.js  ← NUEVO, tuyo
  configuracionIA.service.js     ← NUEVO, tuyo
  configuracionIA.repository.js  ← NUEVO, tuyo
```

En `src/routes/index.routes.js`, monta el router nuevo en el mismo prefijo,
sin tocar la línea de Bina 3:

```js
const configuracionRoutes   = require('../modules/configuracion/configuracion.routes')   // Bina 3, ya existe
const configuracionIARoutes = require('../modules/configuracion/configuracionIA.routes')  // tuyo, nuevo

router.use('/configuracion', configuracionRoutes)     // ya existe
router.use('/configuracion', configuracionIARoutes)   // agregar — Express permite varios routers en el mismo prefijo
```

Para Auditoría, `src/modules/auditoria/` no existe — se crea limpio, sin
conflicto con nadie.

## 1. `GET /api/configuracion/proveedores-ia`

Catálogo de proveedores IA, para llenar los selects de STT/TTS/LLM en el front.

Query opcional: `?tipo=stt|tts|llm` (si no se manda, devuelve los 3 tipos).

Tabla: `catalogo_proveedores_ia` — campos `id (uuid), nombre, tipo, deleted_at`.
Filtrar `deleted_at IS NULL`. [fuente: schema.prisma línea 177]

```json
{
  "ok": true,
  "mensaje": "Catálogo obtenido correctamente",
  "data": [
    { "id": "uuid", "nombre": "OpenAI Whisper", "tipo": "stt" },
    { "id": "uuid", "nombre": "OpenAI GPT-4o", "tipo": "llm" }
  ]
}
```

## 2. `GET /api/configuracion/empresa`

Config IA + Proveedores de la empresa del usuario logueado (`req.empresaId`,
via `tenant.middleware`, igual que el resto del proyecto).

Tabla: `configuraciones_empresa` — `voz_ia, idioma, timeout_seg,
proveedor_stt_id, proveedor_tts_id, proveedor_llm_id, temperatura_modelo,
modelo_ia`. **No** devolver `credenciales_ia` en este GET (mismo criterio que
ya usa `pbx.repository.js` con las credenciales del PBX — no se exponen).
[fuente: schema.prisma línea 294]

Permiso: `empresa.configurar` (ya existe en el catálogo — aparece en la lista
de permisos excluidos de Admin Sucursal en el doc de cobertura).

```json
{
  "ok": true,
  "mensaje": "Configuración obtenida correctamente",
  "data": {
    "vozIa": "Femenina",
    "idioma": "es",
    "timeoutSeg": 25,
    "temperaturaModelo": 0.4,
    "proveedorSttId": "uuid",
    "proveedorTtsId": "uuid",
    "proveedorLlmId": "uuid"
  }
}
```

## 3. `PUT /api/configuracion/empresa`

Crea o actualiza (mismo patrón que `pbxService.guardarConfigPbx`: si no existe
fila para la empresa, la crea; si existe, la actualiza). Body = mismos campos
del GET. Debe llamar a `audit()` (import de `src/services/audit.service.js`,
**no lo modifiques**, solo úsalo) para registrar el cambio con
`datos_anteriores`/`datos_nuevos`.

Permiso: `empresa.configurar`.

## 4. `GET /api/auditoria`

Lectura paginada con filtros. Tabla: `auditoria_logs` — `usuario_id, ip,
modulo, accion, tabla_afectada, registro_id, datos_anteriores (json),
datos_nuevos (json), fecha_evento`. [fuente: schema.prisma línea 43]

Importante: `datos_anteriores`/`datos_nuevos` son objetos JSON completos, no
un solo campo — el front ya está preparado para recibir varios campos
cambiados a la vez y calcular el diff él mismo.

Query params: `fecha` (YYYY-MM-DD), `usuarioId`, `accion`, `modulo`, `page`
(default 1), `pageSize` (default 10 o 5, a definir).

Permiso: `auditoria.ver` (ya usado en `AppRoutes.jsx` del front).

```json
{
  "ok": true,
  "mensaje": "Auditoría obtenida correctamente",
  "data": {
    "items": [
      {
        "id": "1",
        "usuarioNombre": "Fernanda Lazo",
        "usuarioUsername": "fernanda.l",
        "ip": "187.190.4.22",
        "fechaHora": "2026-07-06T09:41:02Z",
        "accion": "Editó",
        "modulo": "Usuarios",
        "datosAnteriores": { "rol": "Analista" },
        "datosNuevos": { "rol": "Supervisor" }
      }
    ],
    "total": 48,
    "page": 1,
    "pageSize": 10
  }
}
```

`usuarioNombre`/`usuarioUsername` requieren el join con `usuarios` (la
relación ya existe en el schema: `usuarios usuarios? @relation(...)`).

## 5. `GET /api/auditoria/export`

Mismos filtros que el listado, pero devuelve un CSV (`Content-Type:
text/csv`) en vez de JSON. Mismo permiso `auditoria.ver`.

## Nota sobre cobertura de datos

Hoy solo los módulos de Bina 1 llaman a `audit()`. Tickets (recién agregado)
todavía no lo hace. Esto significa que `GET /api/auditoria` va a devolver
poco al principio — es esperado, no es un bug de tu endpoint. Ampliar la
cobertura a los demás módulos es una decisión que le corresponde al líder
técnico (implica tocar módulos de otras binas), no algo que resolvamos
nosotros solos.
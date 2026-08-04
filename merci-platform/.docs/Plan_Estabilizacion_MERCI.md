# MERCI — Plan de estabilización v2

*Reemplaza completamente la v1. Basado en el estado real verificado del proyecto al 26 de julio de 2026 (10 commits en backend, 5 en frontend, 14 informes generados, ambos repos inspeccionados directamente contra GitHub).*

---

## Objetivo

Llevar MERCI a un estado donde **cada vista del sistema muestre datos reales de la base de datos** (no arrays hardcodeados en el código), con **archivos optimizados** (sin código muerto, sin markup duplicado, sin mocks residuales), y con **todo el cableado listo** para que el día que se conecten las claves de IA y el protocolo SIP, no haya que reescribir nada — solo activar.

**Plazo**: 2 semanas desde el inicio del sprint (quedan ~10 días). La IA en vivo y el protocolo SIP/RTP quedan explícitamente fuera de este plan.

---

## Reglas fijas (aplican a todo el plan, sin excepción)

1. **Un informe por sección**, archivo separado en `.docs/informes/` del repo que corresponda. Nunca consolidar varias secciones en un solo documento. Cada informe lleva un **punto clave en negritas** al inicio — quien lo lea por encima capta lo esencial sin leer todo.

2. **Nunca asumir el estado de algo que se puede verificar.** Si hay duda sobre si la BD tiene datos, si un archivo existe, si una decisión ya se tomó — preguntar antes de actuar, no asumir el escenario más conveniente.

3. **Ninguna acción destructiva sobre la base de datos** (migrate reset, DROP, TRUNCATE) sin verificar primero si hay datos reales y sin confirmación humana explícita. Ya pasó una vez: se sugirió una migración asumiendo BD vacía cuando ya existía un seed con datos reales.

4. **No usar SQL manual nuevo** — Prisma es el método principal. SQL crudo solo si Prisma no soporta el caso (único precedente real: `worker.service.js` por `SELECT ... FOR UPDATE SKIP LOCKED`). Documentar la justificación en el informe si se usa.

5. **Zonas restringidas** — no modificar sin avisar explícitamente: `src/services/`, `src/jobs/`, `src/modules/webhooks/`, `callOrchestrator`. Sí se puede importar y usar lo que exportan (como `audit()`).

6. **Nunca tocar** el pipeline de IA en vivo (`AIProviderFactory`, los 6 providers, los 4 jobs) ni nada del protocolo SIP/RTP. El CRUD alrededor de esas piezas (crear agentes, editar prompts, configurar proveedores) sí se toca.

7. **Al cerrar cada sección**: commit con mensaje `Fase X · Bloque Y · Sección Z: <resumen>`, push a `feature/bina4-estabilizacion` en el repo que corresponda. Backend → `origin`. Frontend → `sandbox` (fork, por el 403 en el repo original).

8. **Rama de trabajo**: `feature/bina4-estabilizacion` en ambos repos. Nunca push a `main`.

9. **Principio de datos con CloudUCM**: MERCI consulta datos en vivo de CloudUCM y los muestra, sin guardarlos en Postgres salvo que sean parte esencial del sistema. No tenemos la documentación de Grandstream — cualquier decisión sobre qué se consulta en vivo vs. qué se persiste se documenta como pendiente de confirmar.

10. **Antes de ejecutar cualquier instrucción nueva, consultar primero — siempre, sin
    excepción**: los reportes de Graphify actualizados (backend y frontend), `CLAUDE.md` de
    ambos repos, y este plan. No asumir el estado de un módulo, una tabla, o un archivo sin
    haberlo verificado contra estas fuentes primero. Esta regla existe directamente por lo
    que pasó con la migración de Prisma: se sugirió borrar datos asumiendo que la BD estaba
    vacía, sin haber consultado nada que lo confirmara primero. Si Graphify o el `CLAUDE.md`
    están desactualizados respecto al código real, decirlo explícitamente en el informe en
    vez de confiar en ellos a ciegas — son una guía rápida, no la fuente de verdad final (esa
    siempre es el código y el schema real).

---

## Lo que YA está hecho (no repetir, no rehacer)

### Fase 0 — Diagnóstico ✅
Informe de situación actual completo, con corrección posterior del diagnóstico de Tickets.

### Fase 1 — Estabilización ✅
- 1.0.1: sincronización con `main` real (`bce7e33`)
- 1.0.2: fuga de datos en Agentes Virtuales corregida (`setTenant` + `requirePermission`)
- 1.0.3: `HistorialLlamadas.jsx` reconstruido (estaba corrupto)
- 1.0.4: primer commit de `client/` reconciliado con `origin/main`
- 1.0.5: fuga de datos en Tickets corregida (3 capas: rutas, controller, repository)
- 1.1: confirmado cerrado (el import roto de Workflows era del checkout viejo)
- 1.2: guards de permiso en 7 vistas + corrección de Sucursales en `menuSections.js`
- 1.3: formato `{ ok, mensaje, data }` confirmado uniforme

### Fase 2, Bloque 2.4 — Bina 4 ✅
- 2.4.1: módulo `auditoria` (GET paginado + export CSV)
- 2.4.2: módulo `configuracionIA` (GET/PUT empresa + GET proveedores-ia)
- 2.4.3: cifrado AES-256-GCM de `credenciales_ia`

### Fase 3, Bloques 3.1-3.3 parciales ✅
- 3.1: migración pausada (correcto — BD ya tenía datos)
- 3.2: `prisma/seed.js` creado con empresa demo aislada
- 3.3: prueba e2e de 7 pares contra Postgres (todos respondieron correctamente)
- 3.4: verificación de Historial (bloqueado por backend incompleto) y Configuración (listo para conectar)

---

## Lo que FALTA — organizado en dos líneas paralelas

El trabajo restante se divide en dos líneas que **no deben bloquearse mutuamente**:

**Línea A — Conectar y optimizar lo que ya tiene backend** (no depende de construir nada nuevo).
**Línea B — Construir los módulos que no existen todavía** (backend desde cero + frontend después).

---

## LÍNEA A — Conectar y optimizar

### Estado real de cada página del frontend (verificado el 26 de julio)

| Página | Líneas | ¿Conectada? | Backend | Acción |
|---|---|---|---|---|
| Usuarios.jsx | 601 | ✅ service | ✅ completo | Solo optimizar tamaño |
| RolesYPermisos.jsx | 514 | ✅ service | ✅ completo | Solo optimizar tamaño |
| Departamentos.jsx | 479 | ✅ service | ✅ completo | Solo optimizar tamaño |
| Sucursales.jsx | 215 | ✅ service | ✅ completo | Ya optimizada |
| Auditoria.jsx | 412 | ✅ service | ✅ recién creado | Ajustar forma de datos (snake→camelCase), optimizar |
| Configuracion.jsx | 432 | ❌ mock | ✅ recién creado | **Conectar ya** — crear service, quitar mock, optimizar |
| HistorialLlamadas.jsx | 433 | ❌ mock | ⚠️ parcial | Conectar lo que sirve (listado), marcar lo que falta (CSV, filtros) |
| AgentesVirtuales.jsx | 387 | ❌ mock | ✅ montado | Crear service, conectar, optimizar |
| Extensiones.jsx | 513 | ❌ mock | ✅ montado | Crear service, conectar, optimizar |
| Workflows.jsx | 493 | ❌ mock | ✅ montado (13 rutas) | Crear service, conectar, optimizar |
| Login.jsx | 105 | ❌ | ✅ auth | Verificar si usa `api.js` directo o necesita service |
| BaseConocimiento.jsx | 727 | ❌ mock | ❌ NO EXISTE | → Línea B |
| Dashboard.jsx | 266 | ❌ mock | ❌ NO EXISTE | → Línea B |
| Automatizaciones.jsx | 13 | ❌ stub | — | Stub, no prioritario |
| CloudUCM.jsx | 13 | ❌ stub | — | Stub, no prioritario |
| PreguntasFrecuentes.jsx | 13 | ❌ stub | — | Stub, no prioritario |
| Reportes.jsx | 13 | ❌ stub | — | Stub, no prioritario |

### Bloque A.1 — Conectar páginas que ya tienen backend listo

**Orden**: de menor riesgo a mayor (primero las que tienen backend probado y forma de datos clara, después las que requieren ajustes).

#### Sección A.1.1 — `Configuracion.jsx`
- Backend: `GET/PUT /api/configuracion/empresa` y `GET /api/configuracion/proveedores-ia` ya probados en e2e.
- Trabajo: crear `configuracion.service.js` si no existe ya (verificar — puede que el de la sesión anterior siga), conectar los tres bloques (Config IA, Proveedores, PBX), quitar el mock.
- **Verificar** la forma exacta de la respuesta del backend real antes de escribir el mapeo — no asumir que es la misma del contrato.

#### Sección A.1.2 — `Auditoria.jsx`
- Ya tiene `auditoria.service.js`, pero el frontend espera datos en una forma (snake_case, campos planos) distinta a lo que el backend realmente devuelve (camelCase, paginado con `data.items`). Ajustar el frontend a la forma real, no al revés.

#### Sección A.1.3 — `AgentesVirtuales.jsx`
- Backend: `GET/POST/PUT/DELETE /api/agentes` + prompts (versionado).
- Crear `agentes.service.js`, conectar, quitar mock.
- Incluir el versionado de prompts si la UI lo usa (verificar primero).

#### Sección A.1.4 — `Extensiones.jsx`
- Backend: `GET /api/extensiones` + `POST /api/extensiones/sync`.
- Crear `extensiones.service.js`, conectar, quitar mock.
- La UI tiene botones de crear/editar/eliminar extensiones — si el backend no los soporta (solo sync de una vía, confirmado en el documento de cobertura), **deshabilitarlos visualmente con un tooltip que explique por qué**, no dejarlos como botones muertos.

#### Sección A.1.5 — `Workflows.jsx`
- Backend: 13 rutas montadas (CRUD + versiones + reglas + clonar + evaluar).
- Crear `workflows.service.js`, conectar, quitar mock.

#### Sección A.1.6 — `HistorialLlamadas.jsx`
- Backend parcial: `GET /api/llamadas` (paginado, filtros fecha/estado) funciona. Faltan: export CSV, filtros por teléfono/agente.
- Conectar lo que sí funciona. Los filtros/botones que no tienen backend: **deshabilitarlos visualmente** (no quitarlos, no dejarlos como si funcionaran).
- La forma de la respuesta es anidada (`agentes_virtuales.nombre`) y el mock espera campos planos — el frontend se ajusta a lo que el backend realmente devuelve.

#### Sección A.1.7 — `Login.jsx`
- Verificar si ya usa `api.js` directo para auth o si necesita un service. El mock aquí probablemente es solo el array de mensajes decorativos, no datos de negocio — confirmar antes de cambiar algo.

### Bloque A.2 — Optimización de código

**No se entra a este bloque hasta que el A.1 esté completo y confirmado.**

Regla general de tamaño: un archivo que solo muestra datos de una tabla con filtros y paginación no debería pasar de 200-250 líneas. Si pasa, hay código que sobra (markup duplicado, lógica que un componente compartido ya resuelve, arrays de mock residuales, estados que ya no se usan).

Por cada archivo:
1. Medir tamaño actual.
2. Identificar qué sobra (mocks residuales, componentes que deberían extraerse, lógica repetida).
3. Reducir al objetivo.
4. **Probar contra Postgres después de cada archivo** — nunca acumular varios sin probar.

**Salida del Bloque A.2**: informe con tabla `archivo | líneas antes | líneas después | qué se quitó/extrajo`.

---

## LÍNEA B — Construir lo que no existe

### Bloque B.1 — Conocimiento IA (backend + frontend)

**El más grande de todo lo que falta.** No existe ni carpeta ni módulo. Las tablas sí existen en el schema de Prisma (9 modelos: `documentos_ia`, `informacion_negocio`, `listas_faq`, `catalogo_categorias_faq`, `preguntas_frecuentes`, `listas_productos`, `catalogo_categorias_productos`, `productos_servicios`, `catalogo_tipo_documento_ia`).

Son 4 sub-recursos, **no un CRUD simple** — FAQs y Productos son recursos anidados (lista → categorías → items):

#### Sección B.1.1 — Documentos IA
- CRUD simple sobre `documentos_ia`.
- Crear `src/modules/conocimiento/documentos.controller.js`, `.service.js`, `.repository.js`.

#### Sección B.1.2 — Información del negocio
- CRUD simple sobre `informacion_negocio` ("temas": horario, zonas, políticas).

#### Sección B.1.3 — FAQs
- 3 recursos anidados: `listas_faq` → `catalogo_categorias_faq` → `preguntas_frecuentes`.
- El frontend (`BaseConocimiento.jsx`, 727 líneas) ya tiene tabs para esto — verificar qué forma espera antes de construir el backend.

#### Sección B.1.4 — Productos
- 3 recursos anidados: `listas_productos` → `catalogo_categorias_productos` → `productos_servicios`.
- Misma estructura que FAQs.

#### Sección B.1.5 — Conectar `BaseConocimiento.jsx`
- Solo después de que las 4 secciones anteriores estén probadas.
- Crear `conocimiento.service.js`, conectar las 4 tabs, quitar mocks, optimizar (727 líneas es el archivo más grande del frontend — objetivo: 350-400 max).

### Bloque B.2 — Dashboard (backend + frontend)

**Depende de que los demás módulos ya den datos reales** — es un agregador.

#### Sección B.2.1 — `GET /api/dashboard/summary`
- Endpoint que agrega: total llamadas, tickets abiertos, agentes activos, sentimiento promedio, volumen por hora.
- Consulta las tablas de los otros módulos, no las propias — no crea tablas nuevas.

#### Sección B.2.2 — Conectar `Dashboard.jsx`
- Crear `dashboard.service.js`, conectar, quitar mock, optimizar.

### Bloque B.3 — Huecos pendientes de Bina 2 y 3 (los que no son módulos nuevos)

Estos no son módulos que no existen — son funcionalidad faltante dentro de módulos que ya existen:

#### Sección B.3.1 — Historial de llamadas: export CSV + filtros faltantes
- Agregar endpoint de export CSV en `llamadas.controller.js`.
- Agregar filtros por teléfono y agente en `llamadas.repository.js`.
- **Habilitar** los botones que se deshabilitaron en A.1.6.

#### Sección B.3.2 — Workflows: tab "Tipos disponibles"
- Crear tablas `catalogo_condiciones_workflow` y `catalogo_acciones_workflow`.
- Seed de claves cerradas.
- Endpoints de listar, activar/desactivar, renombrar.

#### Sección B.3.3 — `tickets.service.js` (código muerto)
- El controller lo salta y llama al repository directo. El service referencia funciones que no existen. Decidir: arreglarlo para que funcione, o borrarlo y dejar controller→repository (como ya funciona de hecho).

---

## Bloqueadores activos (resolver en paralelo, no esperar)

| Bloqueador | Impacto | Acción |
|---|---|---|
| `CREDENCIALES_IA_ENCRYPTION_KEY` no está en `.env` | Servidor no arranca | Generar con `crypto.randomBytes(32).toString('hex')` y agregar a `.env` |
| `.env.example` borrado de la rama | Nadie nuevo sabe qué variables necesita | Restaurarlo o crearlo con las variables actuales (sin valores reales) |
| Push a `client/` bloqueado (403) | Se trabaja vía fork (`sandbox`), funcional pero no ideal | Pedir acceso al repo original en paralelo |
| `git stash` con `package-lock.json` viejo | Menor, pero ensucia el working tree | Confirmar con el equipo si se aplica o descarta |

---

## Decisiones pendientes del equipo (no resolver sin confirmar)

1. **Seed de roles**: ¿son 2 (como está hoy) o 4 (como decía el plan original)?
2. **Scoping por `sucursal_id`**: ¿se aplica o no? El diseño N17 lo exige, el código no lo hace.
3. **Extensiones**: ¿MERCI crea extensiones en el PBX real o solo espeja las existentes?
4. **`requirePermission` en el resto de módulos del backend**: ¿se audita completamente o solo los que ya se arreglaron (Agentes, Tickets)?

---

## Orden recomendado de ejecución

```
1. Resolver bloqueador: CREDENCIALES_IA_ENCRYPTION_KEY en .env     ← YA (manual, sin Claude Code)
2. Línea A, Bloque A.1: conectar las 7 páginas que ya tienen backend
3. Línea A, Bloque A.2: optimizar código de todas las páginas conectadas
4. Línea B, Bloque B.1: construir Conocimiento IA (el más grande)
5. Línea B, Bloque B.3: cerrar huecos de Bina 2/3
6. Línea B, Bloque B.2: Dashboard (último, porque agrega datos de los demás)
7. Fase 4: documentación final + actualizar CLAUDE.md
```

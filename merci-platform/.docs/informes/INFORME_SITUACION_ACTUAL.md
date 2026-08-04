# INFORME_SITUACION_ACTUAL — Fase 0 del Plan de Estabilización MERCI

**Fecha:** 2026-07-25/26
**Alcance:** los dos repos (`client/` + `merci-platform/`). Se guarda una copia idéntica en
`client/.docs/informes/` y en `merci-platform/.docs/informes/` porque el contenido aplica a
ambos (regla 6 del plan).
**Importante:** este informe es solo diagnóstico. No se tocó ni una línea de código para
producirlo — ni siquiera el import roto del Bloque 1.1. Se espera confirmación antes de seguir
a la Fase 1.

---

## Resumen ejecutivo (si solo vas a leer una sección, que sea esta)

MERCI tiene bastante más código escrito de lo que parece a primera vista — el backend de
varias binas ya tiene endpoints reales conectados a Prisma — pero **casi nada de eso está
conectado al frontend todavía**. De las 4 binas, solo la Bina 1 (usuarios/roles/sucursales/
departamentos) funciona de punta a punta contra la base de datos real. Auditoría y
Configuración IA (nuestra bina) tienen el frontend listo pero el backend no existe. Agentes
Virtuales, Workflows, Extensiones e Historial de Llamadas tienen backend real pero el
frontend sigue desconectado o, en dos casos, directamente roto.

El hallazgo más serio no estaba en la lista del plan: **el endpoint `GET /api/agentes` le
devuelve a cualquier usuario logueado los agentes virtuales de TODAS las empresas, no solo
la suya**, por un middleware que falta (detalle en la sección 3). Es el tipo de cosa que
conviene arreglar temprano en la Fase 1, junto con el import roto.

También se encontraron **dos páginas del frontend con contenido incorrecto** (no mock, sino
literalmente el archivo equivocado guardado ahí — mismo patrón que ya se vio y corrigió una
vez con `Configuracion.jsx` en la sesión anterior). Detalle abajo.

La brecha hasta "funcional" según este plan es grande pero no descabellada para 2 semanas
**si** se prioriza bien: la Fase 1 (arrancar y compilar) es rápida, pero la Fase 2
(completar binas) tiene trabajo real pendiente en las 4 binas, no solo en la nuestra.

---

## 1. Qué hace MERCI hoy, en una frase

Es un panel de administración (React) para un producto de call-center/IVR con IA, respaldado
por una API (Express + Prisma + PostgreSQL) que ya tiene login con JWT, permisos por rol,
multi-empresa (tenant) y varios módulos de administración funcionando de verdad — pero el
pipeline de IA en vivo (STT/LLM/TTS) y la telefonía real (SIP/RTP) todavía no se conectan a
nada real (ninguna clave de API está en uso), y varias pantallas del menú lateral no muestran
datos reales todavía.

---

## 2. Cómo se hizo este diagnóstico

Se leyó completo: `proyect/.docs/PLAN_ESTABILIZACION_MERCI.md`, `client/CLAUDE.md`,
`merci-platform/CLAUDE.md`, `.docs/CONTRATO_Auditoria_ConfiguracionIA.md`, y los
`GRAPH_REPORT.md` más recientes de Graphify en ambos repos (se corrió `graphify update` antes
en la sesión anterior, así que ya estaban al día — se comparó el reporte de nivel superior
contra las carpetas fechadas para confirmar cuál era el más nuevo).

Además, contra lo que pide el Bloque 0.2, se corrió:
- `npm run build` y `npm run lint` en `client/`.
- `git log --oneline -20` y `git status` en ambos repos.
- Una revisión archivo por archivo del código real de cada módulo del backend (rutas,
  controllers, services, repositories) contra lo que documentan los `CLAUDE.md` y el
  contrato — no se asumió nada de lo que decían los documentos sin verificarlo en el código.
- `merci-platform` no tiene scripts `build` ni `lint` en su `package.json` (ya lo dice su
  propio `CLAUDE.md`). Como sustituto se corrió `node --check` sobre los 102 archivos `.js`
  del backend — cero errores de sintaxis. **No se probó que el servidor arranque de verdad
  contra una base de datos local** (no se intentó levantar Postgres ni el servidor); eso
  queda pendiente para la Fase 3 (Bloque 3.1-3.3), que es justo donde el plan lo pone.

---

## 3. El hallazgo más importante: fuga de datos entre empresas en Agentes Virtuales

**Qué pasa:** cualquier usuario logueado (de cualquier empresa) que llame a
`GET /api/agentes` recibe los agentes virtuales de **todas** las empresas registradas, no
solo la suya. Lo mismo aplica a ver el detalle de uno, editarlo, cambiarle el estado o
borrarlo, siempre que se sepa o se adivine el `id` (UUID) de un agente de otra empresa.

**Por qué pasa (con evidencia, no es una sospecha):**
- `src/modules/agentes/agentes.routes.js` solo aplica el middleware `authenticate` a estas
  rutas — le falta `setTenant`, que es el middleware que en el resto del proyecto calcula
  `req.empresaId` a partir del token (ver `merci-platform/CLAUDE.md`, sección de
  tenant.middleware).
- `src/modules/agentes/agentes.controller.js` lee `const empresaId = req.empresaId` en 5 de
  sus 6 funciones (`obtenerAgentes`, `obtenerAgentePorId`, `actualizarAgente`,
  `cambiarEstadoAgente`, `eliminarAgente`) — como `setTenant` nunca corrió, ese valor es
  `undefined`.
- `src/modules/agentes/agentes.repository.js` línea 3-9 (`obtenerTodos`) arma
  `where: { empresa_id: empresaId, deleted_at: null }`. Prisma, cuando un campo del `where`
  llega en `undefined` (no `null`), **lo ignora por completo** — es su comportamiento
  documentado. Entonces el filtro por empresa desaparece y la consulta trae todo.
- La única función que sí funciona bien es `crearAgente` — tiene un fallback manual
  (`req.empresaId || req.user?.empresa_id || req.user?.empresaId || ...`) que el propio
  código comenta como un parche de depuración ("Ponemos estos console.log para ver dónde
  está escondido el ID"), no un fix intencional del problema de fondo.
- Por contraste, el módulo de `prompts` (versionado de prompts de los agentes) sí lee
  `req.user?.empresaId` en sus 3 funciones — ese sí funciona bien y no tiene este problema.
  `extensiones.routes.js` y `llamadas.routes.js` sí aplican `setTenant` correctamente. El
  problema está acotado a `agentes.routes.js`/`agentes.controller.js`.

**Por qué importa ahora y no solo en la Fase 2:** aunque Agentes Virtuales es trabajo de
Bina 2 y "completar la bina" es tarea de la Fase 2, esto es una fuga de datos activa hoy
mismo con el código tal cual está, no un hueco de funcionalidad — cualquiera con una cuenta
válida en cualquier empresa ya puede explotarlo. Vale la pena tratarlo con la misma urgencia
que el Bloque 1.1, aunque formalmente el plan lo asigne a Bloque 2.2.

---

## 4. Estado real por Bina

### Bina 1 — Usuarios, Roles, Permisos, Empresas, Departamentos, Sucursales

**La más completa de las 4.** Backend real contra Prisma, frontend conectado, sin mocks
detectados.

| Módulo | Backend | Frontend conectado | Probado contra BD real |
|---|---|---|---|
| Usuarios | Sí, completo | Sí (`usuarios.service.js`) | No se ejecutó en vivo (ver nota Fase 3), pero el código llama al endpoint real |
| Roles y permisos | Sí, completo | Sí | Igual que arriba |
| Empresas | Sí, completo | (no tiene pantalla propia en el sidebar) | — |
| Sucursales | Sí, con hueco de permisos (ver abajo) | Sí | Igual que arriba |
| Departamentos | Sí, falta 1 endpoint | Sí | Igual que arriba |

Huecos que el plan ya conocía y **siguen abiertos**, confirmados en el código:
- **Sucursales solo tiene un nivel de permiso.** `sucursales.routes.js` exige
  `sucursales.gestionar` en las 5 rutas, incluida la de solo listar (`GET /`) — no existe un
  permiso `sucursales.ver` separado. Un Admin de Sucursal con permiso de solo lectura no
  podría ni ver la lista.
- **Además**, y esto no estaba tan detallado en el plan: `client/src/data/menuSections.js`
  línea 44 declara el ítem "Sucursales" con `permission: 'extensiones.ver'` — un permiso que
  no tiene nada que ver, probablemente copiado y pegado del ítem de arriba. El backend y
  `AppRoutes.jsx` sí usan `sucursales.gestionar` correctamente entre ellos, pero el menú
  lateral usa un permiso distinto a los dos — hay que arreglar los tres para que coincidan,
  no solo backend↔frontend.
- **Departamentos no tiene endpoint para asignar/desasignar extensiones.** Se buscó en todo
  el módulo (`grep "extension" src/modules/departamentos/`) y no aparece nada — confirma lo
  que decía el plan.

Cosa que el plan daba por **no hecha y sí está hecha** (parcialmente):
- `empresas.service.js` (línea 72) **sí llama** a `crearRolesDefault()` al crear una empresa
  nueva — el plan decía que este seed no existía. Sí existe, pero crea **2 roles**
  ("Administrador General" y "Administrador de Sucursal"), no los 4 que menciona el plan
  (Admin empresa, Admin sucursal, Supervisor, Agente). Vale la pena confirmar con el equipo
  si 2 es la decisión actual o si Supervisor/Agente siguen pendientes de agregar.

Hueco nuevo encontrado (no estaba en el plan):
- **`sucursal_id` no se usa para filtrar en absoluto** en `sucursales.repository.js` (0
  apariciones) ni en `llamadas.repository.js` (0 apariciones) — sí se usa correctamente en
  `usuarios.repository.js` (8 veces) y `departamentos.repository.js` (3 veces). Para
  Llamadas esto sí importa (un Admin de Sucursal vería llamadas de toda la empresa, no solo
  las suyas) — para Sucursales tiene menos sentido conceptual (una sucursal no se filtra por
  sí misma), pero vale la pena que el equipo lo confirme explícitamente en vez de asumirlo.

### Bina 2 — Agentes Virtuales, Prompts, Workflows, Conocimiento IA

**Backend más avanzado de lo esperado, frontend casi completamente desconectado.**

- **Agentes Virtuales**: backend con CRUD completo (6 endpoints) — pero con el problema de
  aislamiento entre empresas descrito en la sección 3. Ninguna ruta usa `requirePermission`
  tampoco (solo `authenticate`), así que hoy cualquier usuario logueado, sin importar su rol
  o permisos, puede crear/editar/borrar agentes. El frontend (`AgentesVirtuales.jsx`) no
  importa ningún archivo de `services/` — no existe `agentes.service.js` en
  `client/src/services/` — así que la pantalla sigue mostrando datos locales, no conectados
  a este backend.
- **Prompts** (versionado): 3 endpoints, sí validan correctamente la empresa
  (`req.user?.empresaId`, sin el problema de Agentes). Sin frontend visible propio (se
  gestionaría presumiblemente desde dentro de Agentes Virtuales, que tampoco está
  conectado).
- **Workflows**: backend sorprendentemente completo — 13 rutas incluyendo versionado,
  reglas, clonado y un endpoint de "evaluar". Un bug real encontrado: la ruta
  `POST /:id/reglas` (pensada para crear una regla nueva — el propio comentario en el código
  dice *"ESTA ES LA QUE FALTA 🚀"*) está conectada por error al controller de **listar**
  reglas (`workflowsController.listarReglasWorkflow`), no al de crear. El frontend no tiene
  ni siquiera el archivo de la página: `Workflows.jsx` no existe en `client/src/pages/`, y su
  ruta en `AppRoutes.jsx` está comentada (línea 90) — el ítem "Workflows" del menú lateral
  hoy es un enlace muerto, no un stub con aviso como Tickets o Llamadas Activas.
- **Conocimiento IA** (`BaseConocimiento.jsx`): tal como decía el plan, no existe nada en el
  backend (ni documentos, ni información del negocio, ni FAQs, ni productos). A diferencia
  de Workflows, el frontend aquí es honesto sobre su estado — el archivo completo es:
  *"BaseConocimiento — Página en construcción."* No hay mock disfrazado de dato real.
- **Catálogo de Workflows** ("Tipos disponibles"): confirmado, `catalogo_condiciones_workflow`
  y `catalogo_acciones_workflow` no existen en `prisma/schema.prisma` — no hay ni tabla.

### Bina 3 — Extensiones, Historial de Llamadas, Tickets, Llamadas Activas

**Backend parcial pero bien hecho donde existe; frontend con el problema más visible de
todo el diagnóstico.**

- **Extensiones**: backend confirmado de una sola vía (lee de CloudUCM hacia MERCI, sin
  crear/editar/eliminar extensiones reales en el PBX) — tal como describía el plan, con el
  comentario del propio código confirmándolo ("Única responsabilidad: listar extensiones de
  BD y sincronizarlas desde CloudUCM"). Esta ruta sí tiene `setTenant` y `requirePermission`
  bien puestos (`extensiones.ver`, `extensiones.sync`). El frontend (`Extensiones.jsx`) no
  tiene `services/` propio — sigue con datos locales.
- **Historial de Llamadas — encontrado un archivo con el contenido equivocado.**
  `client/src/pages/HistorialLlamadas.jsx` no contiene una pantalla de historial de
  llamadas: contiene una función llamada literalmente `Configuracion()` con solo un botón de
  "Cerrar sesión". Es el mismo tipo de problema que se encontró y corrigió la sesión pasada
  con `Configuracion.jsx` (un archivo con el contenido de otro guardado por error) — aquí
  sigue sin corregir. El backend, mientras tanto, sí tiene `GET /`, `GET /:id` y
  `POST /sync-cdr` funcionando con permisos y tenant bien aplicados — no hay endpoint de
  exportar CSV ni filtro por teléfono/agente todavía, tal como decía el plan.
- **Tickets**: la brecha real es más grande de lo que decía el plan. El plan asumía que "el
  módulo ya existe pero toma `empresa_id` mal" — en el código actual **no existe ningún
  módulo de tickets** (`src/modules/tickets/` no existe). Lo único relacionado a tickets es
  `src/jobs/ticketAuto.job.js`, un job interno que crea tickets automáticamente desde
  workflows — no hay rutas, controller ni endpoints para que un humano liste, vea o edite un
  ticket desde el panel. El frontend usa un `PageStub` (aviso "en construcción"), que es lo
  correcto dado que no hay nada que conectar todavía.
- **Llamadas Activas**: confirmado igual que el plan — `transferCall()` ya existe en
  `CloudUCMProvider.js` (línea 208) y en la interfaz `IPBXProvider`, pero no hay ninguna ruta
  que lo exponga (`POST /llamadas/:id/transferir` no existe). El frontend usa `PageStub`
  correctamente.

### Bina 4 — Auditoría + Configuración IA (nuestro módulo)

**Backend en 0%, frontend construido la sesión pasada pero con desajustes de forma de datos
contra el contrato real, que en ese momento no estaba en el repo.**

- **Backend**: confirmado que no existe nada. `src/modules/auditoria/` no existe.
  `src/modules/configuracion/` solo tiene los archivos de Bina 3 (PBX) — ningún
  `configuracionIA.*`. Esto es exactamente lo que dice `merci-platform/CLAUDE.md` que falta
  por construir.
- **Frontend**: `auditoria.service.js` y `configuracion.service.js` existen y siguen el
  patrón de `usuarios.service.js` como se pidió. `Auditoria.jsx` y `Configuracion.jsx` cargan
  desde esos servicios con estado de carga y error, y fallan con gracia (sin tumbar la
  vista) porque los endpoints todavía no existen — eso funciona como se buscaba.
- **Pero ahora que el contrato real está en el repo (`.docs/CONTRATO_Auditoria_ConfiguracionIA.md`),
  se puede confirmar un desajuste de forma que había quedado como suposición:**
  - El contrato dice que `GET /api/auditoria` devuelve `data: { items: [...], total, page,
    pageSize }`. El código actual de `Auditoria.jsx` busca `payload?.logs` (no existe ese
    campo) — funcionaría por casualidad solo si `payload` ya viene como array plano, que no
    es lo que dice el contrato.
  - El contrato dice que `GET /api/configuracion/empresa` devuelve los campos en camelCase
    directo en `data` (`vozIa`, `idioma`, `timeoutSeg`, `temperaturaModelo`,
    `proveedorSttId`, `proveedorTtsId`, `proveedorLlmId`), no anidados bajo
    `data.configuracion` y no en snake_case. El código actual de `Configuracion.jsx` y
    `configuracion.service.js` usa snake_case (`voz_ia`, `proveedor_stt_id`, etc.) y espera
    `data.configuracion`. El mismo desajuste aplica al `PUT`.
  - Esto **no rompe nada hoy** (los endpoints no existen, así que el catch de error ya lo
    cubre), pero si Kevin construye el backend seguiendo el contrato tal cual está escrito
    y nadie ajusta el frontend, la pantalla se va a ver "vacía" en silencio (sin error, solo
    con los valores por defecto) — vale la pena ajustarlo como parte del Bloque 2.4, antes
    de dar el módulo por cerrado.
  - `GET /api/configuracion/proveedores-ia` sí está bien manejado en el frontend (ya
    contempla que la respuesta sea un array plano, que es justo lo que dice el contrato).
- **Credenciales de proveedores IA** (Bloque 2.4, la parte de guardar la clave cifrada de
  cada proveedor): no se ha construido nada todavía, ni en el backend ni en el formulario de
  `Configuracion.jsx` — no hay ningún campo para capturar una API key. Pendiente completo.

---

## 5. Cosas que no son de una sola bina

- **Formato de respuesta `{ ok, mensaje, data }`** (Bloque 1.3): revisado en todo
  `src/modules/` y `src/core/` — no se encontró ningún controller usando
  `{ success, message }`. Las únicas apariciones de `message:` son de la configuración
  interna de `express-rate-limit`, que no es una respuesta de API. **Este bloque ya está
  resuelto**, no debería requerir trabajo en la Fase 1.
- **Build del frontend**: `npm run build` **ya compila** — pero no porque el Bloque 1.1 se
  haya resuelto de verdad. En `AppRoutes.jsx`, alguien comentó el `import Workflows` y su
  `<Route>` (líneas 9 y 90) en vez de arreglar el hueco. Eso saca el error de compilación,
  pero deja el ítem "Workflows" del menú apuntando a una ruta que ya no existe — hoy es un
  enlace muerto (cae al 404 genérico dentro del layout) en vez de mostrar el aviso de
  "página en construcción" que sí usan Tickets y Llamadas Activas. El Bloque 1.1 debería
  considerarse abierto todavía, con la corrección real siendo: o se restaura una página
  `Workflows.jsx` mínima, o se apunta esa ruta a `PageStub` como las otras dos.
- **`npm run lint` en el frontend**: 26 errores, ninguno nuevo por el trabajo de la sesión
  pasada (se revisó específicamente). La mayoría (unas 20) son el mismo patrón repetido en
  casi todas las páginas: `useEffect(() => { cargarX() }, [cargarX])` — una regla de eslint
  relativamente nueva (`react-hooks/set-state-in-effect`) que no le gusta este patrón aunque
  hoy funcione bien. Es un problema de estilo transversal a casi toda la Bina 1 y a
  Auditoría/Configuración, no algo aislado — decidir si se corrige en masa o se ajusta la
  regla de eslint es una decisión de equipo, no algo para resolver módulo por módulo.
- **Consistencia de permisos menú↔rutas↔backend** (Bloque 1.2): más allá del caso ya
  conocido de Sucursales (ver Bina 1 arriba), se encontró que **Dashboard, Agentes
  Virtuales, Extensiones, Historial de Llamadas y Conocimiento IA no tienen ningún guard de
  permiso en `AppRoutes.jsx`** — están en la sección que el propio archivo marca como "Sin
  permiso explícito" (línea 81-90). `menuSections.js` sí les declara un permiso
  (`agentes.ver`, `documentos.ver`, etc.) para decidir si mostrarlos en el menú, pero eso
  solo oculta el enlace — cualquier usuario logueado puede entrar escribiendo la URL
  directamente, sin importar sus permisos. Esto es consistente con que esas binas tampoco
  tienen `requirePermission` en el backend todavía (Bina 2 y 3), así que no es un hueco
  "extra" tanto como el síntoma en el frontend del mismo hueco de fondo — pero vale la pena
  que el Bloque 1.2 lo cubra explícitamente, no solo el caso de Sucursales.
- **Git**: `merci-platform` tiene historial normal (20+ commits) y el árbol de trabajo está
  limpio salvo archivos de configuración de esta sesión (`CLAUDE.md`, `graphify-out/`, etc.)
  más un `.env.example` borrado y un `package-lock.json` modificado que valdría la pena que
  alguien del equipo confirme si fue intencional. **`client` no tiene ningún commit
  todavía** — `git log` devuelve "your current branch 'main' does not have any commits yet".
  Todo el código del frontend, incluido lo hecho la sesión pasada, está sin versionar. Esto
  bloquea directamente la regla 7 del plan (commitear y pushear al cerrar cada sección) hasta
  que se haga un primer commit base.

---

## 6. Discrepancias documento vs código real (lo que pedía el Bloque 0.2)

| Documento dice... | Código real dice... |
|---|---|
| `client/CLAUDE.md`: "Auditoria.jsx... Sigue en mock, falta conectar" | Ya está conectado (sesión anterior) — el documento quedó desactualizado, no es un problema del código |
| Plan: "empresas.service no siembra los 4 roles base" | Sí siembra 2 de los 4 (Admin General, Admin Sucursal) — parcialmente hecho |
| Plan: "Tickets — el módulo ya existe pero toma empresa_id mal" | El módulo no existe en absoluto, solo un job interno |
| `merci-platform/CLAUDE.md`: no menciona ningún hueco de seguridad en Agentes | Hueco real de aislamiento entre empresas confirmado (sección 3) |
| Graphify (client, reporte anterior al 21 jul): listaba comunidades distintas a las de hoy | Reporte del 25 jul ya está al día — se usó ese, no el viejo |

---

## 7. Qué tan grande es la brecha hasta "funcional"

- **Fase 1** (arrancar y compilar): rápida. El Bloque 1.3 ya está resuelto. El 1.1 necesita
  una decisión de una línea (stub vs. restaurar Workflows). El 1.2 necesita revisar la tabla
  de permisos completa, no solo Sucursales — medio día de trabajo con foco, no más.
- **Fase 2** (completar binas): es donde está el grueso del trabajo, y no está pareja entre
  binas:
  - Bina 1: la más cerca de terminar — son ajustes puntuales (permiso `ver` en Sucursales,
    scoping de `sucursal_id`, endpoint de extensiones en Departamentos).
  - Bina 2: el hueco de seguridad en Agentes debería tratarse ya. Conocimiento IA es
    construcción desde cero (4 sub-recursos). Workflows necesita frontend completo desde
    cero más el fix del routing de reglas.
  - Bina 3: Tickets es más grande de lo que el plan asumía — construcción de módulo
    completo, no un ajuste. Historial de Llamadas necesita el archivo corregido más CSV y
    filtros nuevos. Extensiones necesita la decisión de producto (¿escribir al PBX o no?)
    antes de tocar código.
  - Bina 4: backend completo desde cero (Kevin) más el ajuste de nombres de campo en el
    frontend una vez que exista.
  - Dashboard (Bloque 2.5) depende de que las demás binas ya den datos reales — correcto
    dejarlo al final, como dice el plan.
- **Fase 3, 4**: no se puede estimar bien sin haber probado el arranque real contra una base
  de datos local — eso es, literalmente, lo que hace la Fase 3.

En dos semanas, Fase 0-2 priorizadas (como recomienda el propio plan) es razonable si el
hueco de seguridad y los dos archivos con contenido equivocado se atienden temprano, dentro
de la Fase 1, en vez de esperar a que le toque el turno formal a cada bina.

---

## 8. Qué no se tocó

Nada. No se modificó, corrigió, ni comentó ningún archivo de código (`.js`, `.jsx`) de
ninguno de los dos repos durante este diagnóstico — incluido el import roto de `Workflows`
del Bloque 1.1, tal como se pidió explícitamente. Los únicos archivos nuevos son este informe
y su duplicado.

---

## 9. Siguiente paso

Este informe queda a la espera de confirmación antes de empezar la Fase 1. Dos cosas que
vale la pena decidir antes de seguir, porque cambian el orden de trabajo:

1. ¿El hueco de aislamiento entre empresas en Agentes Virtuales (sección 3) se trata como
   parte del Bloque 1.1 (urgente, aunque formalmente sea Bina 2), o se deja para su turno en
   el Bloque 2.2 como dice el plan?
2. Los dos archivos con contenido equivocado (`HistorialLlamadas.jsx` con el código de
   Configuración vieja) — ¿se reconstruyen ahora como parte de estabilización, o se esperan
   a la Fase 2 cuando de todos modos hay que construir esas pantallas conectadas al backend
   real?

He leído sip-b2bua.js completo (528 líneas), webhook-server.js (el archivo deprecado, para contexto), el README.md del propio directorio de referencia, y los crucé contra services/pbx/CloudUCMProvider.js, services/callOrchestrator.service.js, services/worker.service.js, el daemon jobs/sttProceso.job.js, modules/tickets/, modules/webhooks/, y el schema de empresas. Esto es lo que encontré — sin código, como pediste.

0. Qué es este archivo realmente
No es un job de cola: es un B2BUA SIP en vivo. Al arrancar, hace bind() de un socket UDP crudo en el puerto 5060 (señalización SIP) y de un segundo socket UDP para RTP (puerto 20000) — ambos quedan escuchando de forma continua e indefinida. Cuando entra una llamada, abre una conexión WebSocket a la Realtime API de OpenAI y corre un setInterval de 20ms durante toda la duración de la llamada para empaquetar audio μ-law hacia CloudUCM en tiempo real. Es infraestructura de telefonía con estado persistente por llamada, no una unidad de trabajo acotada.

1. Factibilidad multiempresa
El mecanismo de identificación de empresa ya está pensado para multiempresa — eso es lo bueno. extractRequestUriUser() saca el codigo_empresa de la parte user@ del URI SIP (INVITE sip:HTL-001@...), y el README documenta que esto viene del campo "Prepend" de un Outbound Route por empresa en CloudUCM. Verifiqué que codigo_acceso ya existe como columna real en empresas (empresas.repository.js#buscarPorCodigo, ya usado hoy para el login sin empresaId) — la pieza de "¿qué empresa es esta llamada?" no hay que inventarla, ya existe y encaja.

Lo que sí es de un solo tenant, de forma dura:

let call = null; — una sola variable global para TODA la llamada activa del proceso. El propio README lo admite: "Una sola llamada activa a la vez (prototipo)". Para multiempresa real (varias llamadas simultáneas de distintas empresas) esto necesita convertirse en un Map por llamada — no es un ajuste menor, es la pieza central del archivo.
RTP_PORT_CLOUDUCM_SIDE = 20000 — un solo puerto RTP fijo para todas las llamadas. Con llamadas concurrentes reales hace falta un pool de puertos, uno por llamada activa.
OPENAI_API_KEY — una sola clave global de .env para todas las empresas. Nuestra arquitectura real ya resuelve esto por empresa (AIProviderFactory + credenciales_ia cifradas), pero el bridge no lo usa — todas las llamadas de todas las empresas facturan a la misma cuenta de OpenAI, sin aislamiento de costo ni posibilidad de que una empresa use un proveedor distinto. Nota aparte: AIProviderFactory.js:267 ya tiene un bug pendiente conocido (lee openai_api_key sin descifrar) documentado en merci-platform/CLAUDE.md — ni siquiera nuestra propia referencia multiempresa está 100% terminada hoy.
Sin reporte a consumo_ia — las llamadas por este bridge son invisibles para el modelo de negocio de margen/costo que sí aplican los daemons STT/LLM/TTS.
Puerto SIP fijo (5060) en un solo proceso/host — solo un proceso puede tener ese puerto bindeado a la vez, así que no hay forma de escalar horizontalmente sin un proxy SIP delante (infraestructura nueva, no trivial).
Resumen de factibilidad: la identificación de tenant es reutilizable casi tal cual; el aislamiento de estado por llamada, el pool de puertos RTP, las credenciales de IA por empresa y el reporte de consumo requieren trabajo real de ingeniería, no configuración.

2. Daemon en jobs_async vs. servicio externo — ventajas y desventajas de cada camino
No es mi decisión, así que van los dos caminos sin inclinar la balanza:

Camino A — meterlo como daemon más (junto a sttProceso/llmProceso/ttsProceso)
A favor:

Un solo repo/deploy, comparte AIProviderFactory y Prisma directo — resuelve el problema de credenciales por empresa sin rediseñar nada, y evita reinventar un "API interna" aparte con su propio esquema de auth.
Reutiliza llamadasRepository.upsertLlamada (ya existe, ya lo usa el sync de CDR) en vez del registrarInicioLlamada/registrarFinLlamada que hoy el bridge llama contra un endpoint que no existe.
En contra:

El patrón jobs_async (incluidos los daemons IA) está diseñado para trabajo por lotes tolerante a latencia — sondeo cada segundos, una unidad de trabajo que dura segundos y termina. El pacer de 20ms de este bridge es sensible a jitter; compartir el mismo proceso/event-loop con Express + Prisma + los otros 3 daemons es un riesgo real de audio entrecortado si el proceso se satura (una migración pesada, un pico de tráfico, un GC largo).
Escalado incompatible: los daemons IA sí escalan multi-instancia gracias a SELECT FOR UPDATE SKIP LOCKED. Un socket UDP en el puerto SIP fijo (5060) solo puede estar bindeado por un proceso en un host — meterlo como "otro daemon" rompe el supuesto de que todo lo que cuelga de worker.service.js escala igual.
Mezclar en el mismo proceso la superficie de ataque de "puerto de telefonía expuesto a Internet" con la de "backend con acceso completo a la BD y a JWTs" es un cambio de perfil de riesgo, no cosmético — sobre todo considerando que el puerto SIP ya fue explotado una vez según el propio README de esta referencia.
Un crash o redeploy del backend (o un simple nodemon en dev) tira todas las llamadas de voz en curso al mismo tiempo que reinicia la API HTTP — hoy son fallas independientes.
Camino B — servicio externo separado, como está desplegado hoy
A favor:

Aislamiento de fallas real: un crash del bridge no toca el backend ni viceversa; un ataque al puerto SIP queda contenido a esa VM, no en la máquina con acceso a la BD completa.
El pacer de 20ms corre sin competencia de otros procesos — menor riesgo de jitter.
Ya está construido, desplegado y validado así en producción según el README (migración de SIP nativo de OpenAI a WebSocket directo, probado real).
En contra:

Llama hoy a una "API interna" que no existe en nuestro backend en ningún escenario — construirla es trabajo obligatorio sin importar el camino elegido.
Duplica lógica que ya existe en el backend bajo otro nombre (su propio registro de llamadas, su propia resolución de instrucciones) — dos lugares para mantener la misma idea.
Necesita su propio mecanismo de auth compartida (INTERNAL_API_KEY) para rotar y vigilar, aparte del JWT que ya existe.
Infraestructura propia que mantener (VM, pm2, ufw, SSH, el bug conocido de Node 24 + libuv en Windows que menciona el README) — un sistema más para parchear y pagar.
Sin acceso directo a Prisma/AIProviderFactory: todo pasa por HTTP a la API interna. Si el backend está caído, hoy el bridge sigue la llamada igual pero sin registrar nada y sin poder crear tickets ni resolver instrucciones — falla en silencio, con solo un console.warn, sin cola ni reintento.
3. ¿Coincide nuestro POST /api/tickets real con lo que el bridge espera mandar?
No coincide, en varios niveles — confirmado leyendo tickets.controller.js/tickets.repository.js línea por línea, no asumido:

Lo que manda el bridge	Lo que espera nuestro endpoint real
Ruta	POST {INTERNAL_API_URL}/tickets/crear (namespace "interno" que no existe en el proyecto)	POST /api/tickets
Auth	Header x-internal-api-key (secreto compartido)	JWT Bearer + authenticate + setTenant + permiso tickets.crear — el bridge no tiene ni puede tener un JWT de usuario, no es una persona logueada
Identificador de empresa	codigo_empresa (string, ej. "HTL-001")	empresa_id (UUID), sacado de req.empresaId — resuelto por el JWT, no por el body
Identificador de llamada	pbx_call_id (string crudo de CloudUCM)	llamada_id (UUID, FK a la tabla llamadas) — nadie traduce pbx_call_id → llamada_id hoy
Prioridad	prioridad: string ("Baja"/"Media"/"Alta"/"Crítica")	prioridad_ticket_id: UUID (FK a catalogo_prioridad_ticket) — nadie hace ese nombre → id hoy
Campos que el bridge nunca manda	—	estado_ticket_id, departamento_id, cliente_id, usuario_responsable_id — ninguno es obligatorio, el ticket quedaría creado sin estado ni responsable, no es un error pero sí queda "huérfano" en la UI
Respuesta esperada	json.data.ticket_id	El controller real devuelve data: ticketNuevo (la fila completa de Prisma) — la clave real es data.id, no data.ticket_id. Aunque se construyera el puente de la API interna, esta única línea (json.data.ticket_id) rompería en silencio si simplemente se reenvía la respuesta real tal cual.
Ningún campo llega con el mismo nombre y tipo de un lado al otro. La resolución codigo_empresa → empresa_id es fácil (la función ya existe, buscarPorCodigo); la de prioridad string → UUID de catálogo también es sencilla (el catálogo ya existe con esos 4 valores exactos); la de pbx_call_id → llamada_id es la más delicada porque además depende de que la llamada ya se haya registrado antes (vía el registrarInicioLlamada que tampoco tiene backend real hoy).

4. Puntos donde el código asume cosas que en nuestro proyecto no existen todavía
Toda una superficie de API "interna" que no existe: POST /llamadas/iniciar, POST /llamadas/finalizar, GET /agentes/resolver, POST /tickets/crear (bajo ese namespace), GET /conocimiento/consultar — ninguno de estos 5 endpoints existe en merci-platform/src/routes/index.routes.js ni en ningún módulo. Habría que construir los 5 desde cero, con su propio mecanismo de auth (x-internal-api-key), que tampoco existe todavía (el único precedente cercano es webhooks.routes.js, que sí es "sin JWT" pero valida distinto — por número de destino conocido, no por API key compartida).
Conocimiento IA — confirmado que no existe, exactamente como preguntaste: no hay ningún módulo conocimiento ni documentos en src/modules/ (busqué directo, cero resultados). merci-platform/CLAUDE.md lo confirma explícitamente: "Línea B completa (Conocimiento IA, Dashboard) — no iniciada, son módulos que no existen ni en backend todavía". La tool consultar_informacion del bridge (RAG sobre info de la empresa) apunta a un endpoint que no tiene ninguna implementación real detrás — ni búsqueda semántica, ni tabla poblada, nada. Es la asunción más grande de las cuatro.
Un pipeline de voz paralelo que no habla con el que ya existe: callOrchestrator.service.js (ya real, confirmado contra CloudUCM en pruebas del 2026-07-21) resuelve la voz vía el webhook nativo de IVR de CloudUCM (play/playAndRead/makeCall/hangup, con status: 0 obligatorio). sip-b2bua.js resuelve la voz vía un Trunk SIP dedicado (B2BUA, RTP crudo) — son dos mecanismos de telefonía completamente distintos y no integrados entre sí. El comentario del propio callOrchestrator.service.js dice textual que la captura de audio real del cliente es "DECISIÓN PENDIENTE, no resuelta" — es decir, nuestra arquitectura de voz "oficial" ni siquiera tiene resuelto cómo llega el audio, mientras que este bridge sí lo resuelve, pero por una vía que nuestro backend no sabe que existe.
transferir_a_humano sin implementar — está mencionado en "Limitaciones conocidas" del README pero no aparece ni en TOOLS ni en ejecutarHerramienta(). Si el modelo intentara usarla, caería en el default (Herramienta 'transferir_a_humano' no implementada).
Requisito no negociable — firewall
El propio README de esta referencia documenta que el puerto SIP ya fue explotado una vez (julio/agosto 2026, fraude telefónico con clave de OpenAI comprometida) por tenerlo abierto sin restricción. Si en algún momento se despliega cualquier versión de este puente — como daemon o como servicio externo — el puerto SIP (5060/UDP) debe quedar restringido por firewall a la IP exacta de CloudUCM desde el primer despliegue, no como remediación posterior a un incidente. No es una sugerencia de este análisis: es una condición para que el despliegue sea aceptable en absoluto, y ya hay un precedente real y documentado de lo que pasa si se omite.
# Voz en Vivo — Puente MERCI ↔ OpenAI Realtime API

## ⚠️ Cambio de arquitectura importante (2 de agosto de 2026)

La primera versión de este puente conectaba CloudUCM → nuestro bridge → **SIP nativo de
OpenAI**. Se descubrió que la integración SIP de la Realtime API es, a la fecha,
**inestable de forma documentada** — múltiples desarrolladores reportan fallas
recurrentes (`504 Cloudflare Gateway time-out`, llamadas que nunca disparan su
webhook) desde hace varios meses, confirmado incluso probando con dos cuentas
de OpenAI distintas y dos regiones de servidor distintas.

**Se migró a una arquitectura sin SIP hacia OpenAI**: el bridge ahora abre una
conexión **WebSocket directa** a la Realtime API (la misma vía que usarías
desde una app de escritorio, no la de telefonía) y hace el puente de audio él
mismo, empaquetando/desempaquetando entre paquetes RTP (CloudUCM) y eventos
WebSocket (OpenAI). Esto eliminó por completo la inestabilidad — validado
en pruebas reales tras el cambio.

## Archivos

- `sip-b2bua.js` — **Archivo activo.** Puente completo: señalización SIP con
  CloudUCM (sin cambios respecto a antes) + conexión WebSocket directa a
  OpenAI Realtime API + puente de audio RTP↔WebSocket + function calling +
  registro de llamadas.
- `webhook-server.js` — **Deprecado, no se usa en el flujo actual.** Era
  necesario cuando el audio pasaba por el SIP nativo de OpenAI (aceptaba la
  llamada vía webhook). Se conserva como referencia por si se vuelve a
  necesitar ese patrón en el futuro; actualmente detenido (`pm2 stop`).
- `.env.example` — Plantilla de variables de entorno.

## Puesta en marcha desde cero (VM nueva)

1. Ubuntu 24.04: `apt update && apt upgrade -y`
2. Node 20: `curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs`
3. Dependencias: `npm install ws dotenv`
4. Instalar pm2: `npm install -g pm2`
5. Copiar `sip-b2bua.js` a `/root/`

**Ya no se necesita:** certificado HTTPS/dominio ni servidor Express para
este flujo (eso era exclusivo de `webhook-server.js`). Si se reactiva ese
archivo en el futuro, sí hace falta — ver la versión anterior de este
README en el historial de Git.

## ⚠️ FIREWALL — sigue siendo obligatorio

El vector de ataque real de julio/agosto 2026 (puerto 5060 abierto a
cualquiera) sigue existiendo si no se aplica esto. **Con la nueva
arquitectura el firewall es más simple** — ya no se necesita abrir puertos
RTP hacia OpenAI (el audio hacia OpenAI viaja por la conexión WebSocket
saliente que el propio bridge inicia, no por RTP entrante):

```bash
ufw allow 22/tcp          # SIEMPRE primero, o te quedas fuera de la VM
ufw allow from 44.228.157.30 to any port 5060 proto udp   # IP real de CloudUCM
ufw deny 5060/udp
ufw enable
```

Confirmar con `ufw status verbose` que el puerto 22 sigue permitido ANTES de
cerrar la sesión SSH actual.

**Recomendado además:** deshabilitar login SSH por contraseña una vez que
todo el equipo tenga su llave SSH configurada (`PasswordAuthentication no`
en `/etc/ssh/sshd_config`, `systemctl restart sshd` — confirmar acceso por
llave en una sesión nueva ANTES de cerrar la actual).

## Variables de entorno

Nunca se pasan por línea de comandos — quedan expuestas en el historial de
bash y en `ps aux`. Usar siempre `/root/.env` (nunca se sube a Git):

```
OPENAI_API_KEY=sk-...
INTERNAL_API_URL=https://tu-backend/api/internal
INTERNAL_API_KEY=un-secreto-compartido-con-el-backend
```

`sip-b2bua.js` lo carga automáticamente vía `require('dotenv').config()`.

```bash
pm2 delete merci-sip-bridge   # si ya existía, para evitar que pm2
                                # reutilice variables de entorno viejas
pm2 start sip-b2bua.js --name merci-sip-bridge
```

## Configuración fuera de código (CloudUCM y OpenAI)

**CloudUCM:**
- Trunk SIP (`VoIP Trunks`): tipo Peer, host = IP de esta VM, transporte UDP
- Outbound Route por empresa: patrón de marcado propio, Prepend =
  `codigo_acceso` de esa empresa (ej. `HTL-001` para Hotel Paraíso)

**OpenAI:**
- El bridge se conecta a `wss://api.openai.com/v1/realtime?model=gpt-realtime`
  usando el `OPENAI_API_KEY` directamente — **ya no se necesita configurar
  ningún webhook ni Project ID especial en el panel de OpenAI**, a
  diferencia de la arquitectura anterior.
- Formato de audio: `audio/pcmu` (G.711 μ-law) en ambas direcciones,
  configurado vía `session.audio.input.format` / `session.audio.output.format`
  — la GA de la Realtime API exige esta estructura anidada con `format`
  como objeto, no como string plano (`{type: 'g711_ulaw'}` como en la beta
  antigua NO funciona).

## Incidencias reales documentadas (para la memoria)

**Inestabilidad del SIP nativo de OpenAI (31 jul – 2 ago 2026):** ver sección
de arquitectura arriba. Diagnosticado con reintentos automáticos, prueba con
cuenta nueva, prueba con región de servidor distinta, y prueba de aislamiento
(WebSocket directo funcionando perfecto mientras el SIP fallaba) — evidencia
suficiente para descartar causas propias y confirmar problema externo,
documentado también por otros desarrolladores en el foro de OpenAI.

**Explotación de puerto SIP abierto + clave API comprometida (31 jul – 1
ago 2026):** puerto 5060/UDP sin restricción fue encontrado y usado por bots
de fraude telefónico, generando consumo no autorizado en la cuenta de
OpenAI. Resuelto restringiendo el puerto a la IP de CloudUCM, rotando la
clave API, y migrando su manejo a `.env`. Caso reportado a soporte de OpenAI
con evidencia (logs de la cuenta mostrando patrones de "checker" automatizado
de claves robadas).

**Crash del backend en Windows (Node.js v24 + libuv, 1-2 ago 2026):** bug
conocido del propio Node.js (`nodejs/node#56645`) en Windows con `fetch()`
nativo durante reinicios del proceso (`nodemon`). No es un error de la
aplicación. Mitigación recomendada: usar Node 22 LTS en vez de v24 para
correr el backend en desarrollo.

**Colisión de respuestas simultáneas (`conversation_already_has_active_response`):**
ocurría cuando el bridge pedía una respuesta manualmente (tras ejecutar una
función) mientras el `server_vad` de OpenAI ya había disparado una
automáticamente. Resuelto con una bandera de estado (`responsePending`) que
encola la solicitud en vez de mandarla en conflicto — ver comentarios en
`sip-b2bua.js`.

**Eco acústico en pruebas:** al probar sin audífonos (micrófono captando las
bocinas), el sistema interpretaba la propia voz de la IA como interrupción
del cliente, causando cortes y repeticiones. No es un bug del sistema — es
un artefacto del entorno de prueba. Usar audífonos al probar.

## Limitaciones conocidas (a la fecha de este README)

- Una sola llamada activa a la vez (prototipo)
- El backend real (`api/internal/...`) solo funciona si está corriendo
  localmente + ngrok, hasta que se despliegue a Render
- Falta implementar la herramienta `transferir_a_humano`
- Node v24 en Windows puede crashear el backend durante reinicios de
  desarrollo (ver incidencia arriba) — no afecta producción si se despliega
  en Linux (Render)
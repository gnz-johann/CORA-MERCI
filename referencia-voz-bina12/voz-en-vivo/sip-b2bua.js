'use strict';
require('dotenv').config();
const dgram = require('dgram');
const crypto = require('crypto');
const WebSocket = require('ws');

// ── Configuración ────────────────────────────────────────────────────────
const LOCAL_IP = '143.198.113.101';
const CLOUDUCM_SIP_PORT = 5060;
const RTP_PORT_CLOUDUCM_SIDE = 20000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_WS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-realtime';
const INTERNAL_API_URL = process.env.INTERNAL_API_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const SAMPLES_PER_PACKET = 160;
const PACKET_INTERVAL_MS = 20;
const MULAW_SILENCE = 0xFF;

if (!OPENAI_API_KEY) {
  console.error('✗ Falta OPENAI_API_KEY.');
  process.exit(1);
}
if (!INTERNAL_API_URL || !INTERNAL_API_KEY) {
  console.warn('⚠ Falta INTERNAL_API_URL o INTERNAL_API_KEY — sin registro de llamadas ni datos dinámicos.');
}

const INSTRUCCIONES_RESPALDO = 'Eres un asistente virtual de atención telefónica. Saluda cordialmente y pregunta en qué puedes ayudar.';

const TOOLS = [
  {
    type: 'function',
    name: 'crear_ticket',
    description: 'Crea un ticket de soporte cuando el cliente reporta un problema, queja o solicitud que requiere seguimiento humano.',
    parameters: {
      type: 'object',
      properties: {
        titulo: { type: 'string', description: 'Resumen breve del problema.' },
        descripcion: { type: 'string', description: 'Detalle completo de lo reportado.' },
        prioridad: { type: 'string', enum: ['Baja', 'Media', 'Alta', 'Crítica'] },
      },
      required: ['titulo', 'descripcion'],
    },
  },
  {
    type: 'function',
    name: 'consultar_informacion',
    description: 'Busca información real sobre la empresa antes de responder preguntas específicas del cliente. Nunca inventes datos del negocio.',
    parameters: {
      type: 'object',
      properties: { consulta: { type: 'string', description: 'La pregunta o tema a buscar.' } },
      required: ['consulta'],
    },
  },
];

let call = null;

// ── Utilidades SIP ─────────────────────────────────────────────────────
function parseMessage(raw) {
  const text = raw.toString('utf8');
  const sepIndex = text.indexOf('\r\n\r\n');
  const headerPart = sepIndex === -1 ? text : text.slice(0, sepIndex);
  const body = sepIndex === -1 ? '' : text.slice(sepIndex + 4);
  const lines = headerPart.split('\r\n');
  const startLine = lines[0];
  const headers = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    headers.push([line.slice(0, idx).trim(), line.slice(idx + 1).trim()]);
  }
  return { startLine, headers, body };
}
function getHeader(headers, name) {
  const f = headers.find(([n]) => n.toLowerCase() === name.toLowerCase());
  return f ? f[1] : null;
}
function getAllHeaders(headers, name) {
  return headers.filter(([n]) => n.toLowerCase() === name.toLowerCase()).map(([, v]) => v);
}
function randomTag() { return crypto.randomBytes(4).toString('hex'); }
function extractRequestUriUser(startLine) {
  const match = startLine.match(/^INVITE sip:([^@]+)@/i);
  return match ? match[1] : null;
}
function extractFromUser(headers) {
  const from = getHeader(headers, 'From');
  if (!from) return null;
  const match = from.match(/sip:([^@]+)@/i);
  return match ? match[1] : null;
}
function extractRtpFromSdp(sdpBody) {
  const lines = sdpBody.split('\r\n');
  const cLine = lines.find((l) => l.startsWith('c=IN IP4'));
  const mLine = lines.find((l) => l.startsWith('m=audio'));
  return {
    ip: cLine ? cLine.split(' ')[2] : null,
    port: mLine ? parseInt(mLine.split(' ')[1], 10) : null,
  };
}
function buildSdp(rtpPort) {
  return [
    'v=0',
    `o=- ${Date.now()} ${Date.now()} IN IP4 ${LOCAL_IP}`,
    's=MERCI-Bridge',
    `c=IN IP4 ${LOCAL_IP}`,
    't=0 0',
    `m=audio ${rtpPort} RTP/AVP 0`,
    'a=rtpmap:0 PCMU/8000',
    'a=sendrecv',
    '',
  ].join('\r\n');
}

// ── Utilidades RTP ────────────────────────────────────────────────────────
function parseRtpPacket(buf) {
  if (buf.length < 12) return null;
  return {
    payloadType: buf[1] & 0x7f,
    sequenceNumber: buf.readUInt16BE(2),
    timestamp: buf.readUInt32BE(4),
    ssrc: buf.readUInt32BE(8),
    payload: buf.slice(12),
  };
}
function buildRtpPacket(seq, timestamp, ssrc, payload) {
  const header = Buffer.alloc(12);
  header[0] = 0x80;
  header[1] = 0x00;
  header.writeUInt16BE(seq & 0xffff, 2);
  header.writeUInt32BE(timestamp >>> 0, 4);
  header.writeUInt32BE(ssrc >>> 0, 8);
  return Buffer.concat([header, payload]);
}

// ── Registro / instrucciones / tools ──────────────────────────────────────
async function registrarInicioLlamada(currentCall) {
  if (!INTERNAL_API_URL || !INTERNAL_API_KEY) return;
  try {
    const response = await fetch(`${INTERNAL_API_URL}/llamadas/iniciar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-api-key': INTERNAL_API_KEY },
      body: JSON.stringify({
        codigo_empresa: currentCall.empresaCodigo,
        pbx_call_id: currentCall.pbxCallId,
        numero_origen: currentCall.numeroOrigen,
      }),
    });
    const json = await response.json();
    if (response.ok && json.ok) {
      currentCall.llamadaId = json.data.llamada_id;
      console.log('✓ Llamada registrada en MERCI, llamada_id:', currentCall.llamadaId);
    } else {
      console.warn('⚠ No se pudo registrar la llamada en MERCI:', json.mensaje || response.status);
    }
  } catch (err) {
    console.error('✗ Error registrando inicio de llamada:', err.message);
  }
}
async function registrarFinLlamada(llamadaId) {
  if (!INTERNAL_API_URL || !INTERNAL_API_KEY || !llamadaId) return;
  try {
    const response = await fetch(`${INTERNAL_API_URL}/llamadas/finalizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-api-key': INTERNAL_API_KEY },
      body: JSON.stringify({ llamada_id: llamadaId }),
    });
    const json = await response.json();
    if (response.ok && json.ok) console.log('✓ Fin de llamada registrado en MERCI (llamada_id:', llamadaId, ')');
    else console.warn('⚠ No se pudo registrar el fin de llamada:', json.mensaje || response.status);
  } catch (err) {
    console.error('✗ Error registrando fin de llamada:', err.message);
  }
}
async function resolverInstrucciones(codigoEmpresa) {
  if (!codigoEmpresa || !INTERNAL_API_URL || !INTERNAL_API_KEY) return INSTRUCCIONES_RESPALDO;
  try {
    const url = `${INTERNAL_API_URL}/agentes/resolver?codigo=${encodeURIComponent(codigoEmpresa)}`;
    const response = await fetch(url, { headers: { 'x-internal-api-key': INTERNAL_API_KEY } });
    if (!response.ok) return INSTRUCCIONES_RESPALDO;
    const json = await response.json();
    if (json.ok && json.data && json.data.instrucciones) {
      console.log(`✓ Instrucciones dinámicas cargadas para "${json.data.empresa_nombre}".`);
      return json.data.instrucciones;
    }
    return INSTRUCCIONES_RESPALDO;
  } catch (err) {
    console.error('✗ Error consultando instrucciones:', err.message);
    return INSTRUCCIONES_RESPALDO;
  }
}
async function ejecutarCrearTicket(args, contexto) {
  if (!INTERNAL_API_URL || !INTERNAL_API_KEY) return { ok: false, mensaje: 'Backend no disponible.' };
  try {
    const response = await fetch(`${INTERNAL_API_URL}/tickets/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-api-key': INTERNAL_API_KEY },
      body: JSON.stringify({
        codigo_empresa: contexto.empresaCodigo,
        pbx_call_id: contexto.pbxCallId,
        titulo: args.titulo, descripcion: args.descripcion, prioridad: args.prioridad,
      }),
    });
    const json = await response.json();
    if (response.ok && json.ok) {
      console.log('✓ Ticket creado, id:', json.data.ticket_id);
      return { ok: true, ticket_id: json.data.ticket_id, mensaje: 'Ticket creado correctamente.' };
    }
    return { ok: false, mensaje: json.mensaje || 'No se pudo crear el ticket.' };
  } catch (err) {
    return { ok: false, mensaje: 'Error interno al crear el ticket.' };
  }
}
async function ejecutarConsultarInformacion(args, contexto) {
  if (!INTERNAL_API_URL || !INTERNAL_API_KEY) return { ok: false, mensaje: 'Backend no disponible.' };
  try {
    const url = `${INTERNAL_API_URL}/conocimiento/consultar?codigo=${encodeURIComponent(contexto.empresaCodigo)}&consulta=${encodeURIComponent(args.consulta)}`;
    const response = await fetch(url, { headers: { 'x-internal-api-key': INTERNAL_API_KEY } });
    const json = await response.json();
    if (response.ok && json.ok) {
      const resultados = json.data.resultados || [];
      if (resultados.length === 0) {
        return { ok: true, encontrado: false, mensaje: 'No se encontró información — no inventes una respuesta, confírmalo al cliente.' };
      }
      return { ok: true, encontrado: true, resultados };
    }
    return { ok: false, mensaje: json.mensaje || 'No se pudo consultar.' };
  } catch (err) {
    return { ok: false, mensaje: 'Error interno.' };
  }
}
async function ejecutarHerramienta(nombre, argsCrudo, contexto) {
  let args = {};
  try { args = JSON.parse(argsCrudo || '{}'); } catch (e) { /* vacío */ }
  switch (nombre) {
    case 'crear_ticket': return ejecutarCrearTicket(args, contexto);
    case 'consultar_informacion': return ejecutarConsultarInformacion(args, contexto);
    default: return { ok: false, mensaje: `Herramienta '${nombre}' no implementada.` };
  }
}

// ── Lado CloudUCM (UDP) ────────────────────────────────────────────────────
const cloudUcmSipSocket = dgram.createSocket('udp4');

function sendCloudUcmResponse(statusLine, parsed, rinfo, extraHeaders = [], body = '') {
  const vias = getAllHeaders(parsed.headers, 'Via');
  const from = getHeader(parsed.headers, 'From');
  let to = getHeader(parsed.headers, 'To');
  const callId = getHeader(parsed.headers, 'Call-ID');
  const cseq = getHeader(parsed.headers, 'CSeq');
  if (to && !to.includes('tag=') && !statusLine.startsWith('SIP/2.0 100')) {
    to = `${to};tag=${call.clouducm.localTag}`;
  }
  const lines = [statusLine];
  for (const v of vias) lines.push(`Via: ${v}`);
  lines.push(`From: ${from}`, `To: ${to}`, `Call-ID: ${callId}`, `CSeq: ${cseq}`);
  for (const h of extraHeaders) lines.push(h);
  lines.push(`Content-Length: ${Buffer.byteLength(body)}`, '', body);
  cloudUcmSipSocket.send(Buffer.from(lines.join('\r\n'), 'utf8'), rinfo.port, rinfo.address);
}

function sendCloudUcmBye() {
  if (!call || !call.clouducm) return;
  const rinfo = call.clouducm.originalRinfo;
  const parsed = call.clouducm.originalInvite;
  const from = getHeader(parsed.headers, 'To');
  const to = getHeader(parsed.headers, 'From');
  const callId = getHeader(parsed.headers, 'Call-ID');
  const branch = 'z9hG4bK' + crypto.randomBytes(6).toString('hex');
  const bye = [
    `BYE sip:${rinfo.address}:${rinfo.port} SIP/2.0`,
    `Via: SIP/2.0/UDP ${LOCAL_IP}:${CLOUDUCM_SIP_PORT};branch=${branch};rport`,
    `From: ${from};tag=${call.clouducm.localTag}`,
    `To: ${to}`, `Call-ID: ${callId}`, `CSeq: 2 BYE`, `Max-Forwards: 70`,
    `Content-Length: 0`, '', '',
  ].join('\r\n');
  cloudUcmSipSocket.send(Buffer.from(bye, 'utf8'), rinfo.port, rinfo.address);
  console.log('→ BYE enviado a CloudUCM.');
}

cloudUcmSipSocket.on('message', (msg, rinfo) => {
  const parsed = parseMessage(msg);
  const method = parsed.startLine.split(' ')[0];
  console.log(`\n[CloudUCM→] ${parsed.startLine}`);

  if (method === 'INVITE') {
    if (call) {
      console.log('⚠ Ya hay una llamada activa. Ignorando (prototipo: una a la vez).');
      return;
    }
    const empresaCodigo = extractRequestUriUser(parsed.startLine);
    const pbxCallId = getHeader(parsed.headers, 'Call-ID');
    const numeroOrigen = extractFromUser(parsed.headers);
    console.log('→ Código de empresa:', empresaCodigo || '(ninguno)', '| pbx_call_id:', pbxCallId);

    call = {
      empresaCodigo, pbxCallId, numeroOrigen, llamadaId: null,
      sessionReady: false,
      responsePending: false,
      needsFollowupResponse: false,
      outputBuffer: Buffer.alloc(0),
      pendingCalls: {},
      clouducm: { rinfo, localTag: randomTag(), remoteRtp: extractRtpFromSdp(parsed.body), originalInvite: parsed, originalRinfo: rinfo },
      openaiWs: null, rtpSocket: null, pacerInterval: null,
    };
    console.log('→ SDP de CloudUCM apunta a RTP:', call.clouducm.remoteRtp);
    sendCloudUcmResponse('SIP/2.0 100 Trying', parsed, rinfo);
    registrarInicioLlamada(call);
    connectToOpenAiRealtime();
  } else if (method === 'ACK') {
    console.log('[CloudUCM] ACK recibido — diálogo confirmado.');
  } else if (method === 'BYE') {
    console.log('← BYE de CloudUCM. Colgando.');
    sendCloudUcmResponse('SIP/2.0 200 OK', parsed, rinfo);
    cleanupCall();
  }
});
cloudUcmSipSocket.on('listening', () => console.log(`Escuchando CloudUCM en ${LOCAL_IP}:${CLOUDUCM_SIP_PORT} (UDP)`));
cloudUcmSipSocket.bind(CLOUDUCM_SIP_PORT);

// ── Lado OpenAI (WebSocket) ─────────────────────────────────────────────
async function connectToOpenAiRealtime() {
  if (!call) return;
  const instrucciones = await resolverInstrucciones(call.empresaCodigo);
  if (!call) return;

  console.log('→ Conectando a Realtime API por WebSocket...');
  const ws = new WebSocket(OPENAI_WS_URL, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } });
  call.openaiWs = ws;

  ws.on('open', () => {
    if (!call) { ws.close(); return; }
    console.log('✓ WebSocket con OpenAI abierto. Configurando sesión (g711_ulaw, esquema GA)...');
    // NUEVO: esquema GA — el formato de audio va anidado bajo session.audio,
    // y "format" es un objeto, no un string suelto (confirmado con la API real).
    ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        type: 'realtime',
        instructions: instrucciones,
        audio: {
          input: {
            format: { type: 'audio/pcmu' },
            turn_detection: { type: 'server_vad' },
          },
          output: {
            format: { type: 'audio/pcmu' },
          },
        },
        tools: TOOLS,
        tool_choice: 'auto',
      },
    }));
  });

  ws.on('message', (raw) => handleOpenAiWsMessage(raw));

  ws.on('error', (err) => {
    console.error('✗ Error de WebSocket con OpenAI:', err.message);
    if (call && !call.sessionReady) {
      sendCloudUcmResponse('SIP/2.0 503 Service Unavailable', call.clouducm.originalInvite, call.clouducm.originalRinfo);
      cleanupCall();
    }
  });

  ws.on('close', () => {
    console.log('WebSocket con OpenAI cerrado.');
    if (call) { sendCloudUcmBye(); cleanupCall(); }
  });
}

async function handleOpenAiWsMessage(raw) {
  if (!call) return;
  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch (e) { return; }

  console.log('[OpenAI evento]', event.type);

  if (event.type === 'error') {
    console.error('✗ Error de sesión Realtime:', JSON.stringify(event, null, 2));
    if (!call.sessionReady) {
      sendCloudUcmResponse('SIP/2.0 503 Service Unavailable', call.clouducm.originalInvite, call.clouducm.originalRinfo);
      cleanupCall();
    }
    return;
  }

  if (event.type === 'session.updated' && !call.sessionReady) {
    console.log('✓ Sesión confirmada:', JSON.stringify(event.session?.audio));
    call.sessionReady = true;

    const sdp = buildSdp(RTP_PORT_CLOUDUCM_SIDE);
    sendCloudUcmResponse('SIP/2.0 200 OK', call.clouducm.originalInvite, call.clouducm.originalRinfo,
      [`Contact: <sip:merci-bridge@${LOCAL_IP}:${CLOUDUCM_SIP_PORT}>`, 'Content-Type: application/sdp'], sdp);
    console.log('→ 200 OK enviado a CloudUCM. Esperando ACK...\n');

startRtpBridge();

    // NUEVO: con server_vad el modelo espera pasivamente — lo forzamos a
    // saludar primero en cuanto la llamada está lista, sin esperar al cliente.
    call.responsePending = true;
    call.openaiWs.send(JSON.stringify({ type: 'response.create' }));
    console.log('→ Se pidió a la IA que salude primero.');
    return;  }

if (event.type === 'input_audio_buffer.speech_started') {
    // NUEVO: el cliente empezó a hablar — OpenAI cancela su respuesta de su
    // lado, pero el audio que ya nos había mandado antes sigue en nuestro
    // buffer local. Hay que descartarlo para que la interrupción sea real.
    const bytesDescartados = call.outputBuffer.length;
    call.outputBuffer = Buffer.alloc(0);
    console.log(`✂ Interrupción detectada — se descartaron ${bytesDescartados} bytes de audio pendiente.`);
  }

if (event.type === 'response.created') {
    call.responsePending = true;
  }
  if (event.type === 'response.done') {
    call.responsePending = false;
    if (call.needsFollowupResponse) {
      call.needsFollowupResponse = false;
      call.responsePending = true;
      call.openaiWs.send(JSON.stringify({ type: 'response.create' }));
    }
  }

  if (event.type === 'response.output_audio.delta' && event.delta) {
    const mulawChunk = Buffer.from(event.delta, 'base64');
    call.outputBuffer = Buffer.concat([call.outputBuffer, mulawChunk]);
    return;
  }

  if (event.type === 'response.output_item.added' && event.item && event.item.type === 'function_call') {
    call.pendingCalls[event.item.call_id] = { name: event.item.name };
    console.log(`→ El modelo va a llamar a la función "${event.item.name}"`);
    return;
  }

  if (event.type === 'response.function_call_arguments.done') {
    const pending = call.pendingCalls[event.call_id];
    const nombre = pending ? pending.name : null;
    if (!nombre) return;
    console.log(`→ Ejecutando "${nombre}" con argumentos:`, event.arguments);
    const resultado = await ejecutarHerramienta(nombre, event.arguments, call);
    if (call && call.openaiWs) {
call.openaiWs.send(JSON.stringify({
        type: 'conversation.item.create',
        item: { type: 'function_call_output', call_id: event.call_id, output: JSON.stringify(resultado) },
      }));
      // NUEVO: si ya hay una respuesta en curso, no pedimos otra de inmediato
      // (causaba "conversation_already_has_active_response") — la encolamos
      // para el momento en que la actual termine.
      if (call.responsePending) {
        call.needsFollowupResponse = true;
      } else {
        call.responsePending = true;
        call.openaiWs.send(JSON.stringify({ type: 'response.create' }));
      }
    }
    delete call.pendingCalls[event.call_id];
  }
}

// ── Puente de audio RTP ⟷ WebSocket ─────────────────────────────────────
function startRtpBridge() {
  const rtpSocket = dgram.createSocket('udp4');
  call.rtpSocket = rtpSocket;

let packetsIn = 0;
  rtpSocket.on('message', (msg) => {
    if (!call || !call.openaiWs || call.openaiWs.readyState !== WebSocket.OPEN) return;
    const packet = parseRtpPacket(msg);
    if (!packet) return;
    packetsIn++;
    if (packetsIn === 1 || packetsIn % 100 === 0) {
      console.log(`[RTP→OpenAI] Paquete #${packetsIn}, ${packet.payload.length} bytes`);
    }
    call.openaiWs.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: packet.payload.toString('base64'),
    }));
  });
  rtpSocket.bind(RTP_PORT_CLOUDUCM_SIDE, () => console.log(`[RTP] Escuchando CloudUCM en ${RTP_PORT_CLOUDUCM_SIDE}`));

  call.outSeq = crypto.randomBytes(2).readUInt16BE(0);
  call.outTimestamp = crypto.randomBytes(4).readUInt32BE(0);
  call.outSsrc = crypto.randomBytes(4).readUInt32BE(0);

let packetsOutReal = 0;
  call.pacerInterval = setInterval(() => {
    if (!call || !call.clouducm || !call.clouducm.remoteRtp || !call.rtpSocket) return;
    let chunk;
    if (call.outputBuffer.length >= SAMPLES_PER_PACKET) {
      chunk = call.outputBuffer.slice(0, SAMPLES_PER_PACKET);
      call.outputBuffer = call.outputBuffer.slice(SAMPLES_PER_PACKET);
      packetsOutReal++;
      if (packetsOutReal === 1 || packetsOutReal % 50 === 0) {
        console.log(`[OpenAI→RTP] Enviando audio REAL #${packetsOutReal} a CloudUCM`);
      }
    } else {
      chunk = Buffer.alloc(SAMPLES_PER_PACKET, MULAW_SILENCE);
    }


    const packet = buildRtpPacket(call.outSeq, call.outTimestamp, call.outSsrc, chunk);
    call.outSeq = (call.outSeq + 1) & 0xffff;
    call.outTimestamp = (call.outTimestamp + SAMPLES_PER_PACKET) >>> 0;
    call.rtpSocket.send(packet, call.clouducm.remoteRtp.port, call.clouducm.remoteRtp.ip);
  }, PACKET_INTERVAL_MS);
}

function cleanupCall() {
  if (call) {
    const llamadaId = call.llamadaId;
    if (call.pacerInterval) clearInterval(call.pacerInterval);
    if (call.rtpSocket) call.rtpSocket.close();
    if (call.openaiWs) { try { call.openaiWs.close(); } catch (e) { /* ya cerrado */ } }
    if (llamadaId) registrarFinLlamada(llamadaId);
  }
  call = null;
  console.log('Llamada finalizada. Listo para la siguiente.\n');
}

process.on('uncaughtException', (err) => console.error('Excepción no capturada:', err));

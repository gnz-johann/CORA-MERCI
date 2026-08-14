'use strict';
require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

const DOMAIN = '143-198-113-101.nip.io';
const PORT = 443;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const INTERNAL_API_URL = process.env.INTERNAL_API_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('✗ Falta OPENAI_API_KEY.');
  process.exit(1);
}
if (!INTERNAL_API_URL || !INTERNAL_API_KEY) {
  console.warn('⚠ Falta INTERNAL_API_URL o INTERNAL_API_KEY — instrucciones de respaldo y sin function calling real.');
}

const INSTRUCCIONES_RESPALDO = 'Eres un asistente virtual de atención telefónica. Saluda cordialmente y pregunta en qué puedes ayudar.';

const TOOLS = [
  {
    type: 'function',
    name: 'crear_ticket',
    description: 'Crea un ticket de soporte cuando el cliente reporta un problema, queja o solicitud que requiere seguimiento humano. Úsala en cuanto el cliente describa algo que no puedas resolver tú directamente en la llamada.',
    parameters: {
      type: 'object',
      properties: {
        titulo: { type: 'string', description: 'Resumen breve del problema, en una sola línea.' },
        descripcion: { type: 'string', description: 'Detalle completo de lo que reportó el cliente, en sus propias palabras si es posible.' },
        prioridad: { type: 'string', enum: ['Baja', 'Media', 'Alta', 'Crítica'], description: 'Urgencia del problema reportado, según tu criterio.' },
      },
      required: ['titulo', 'descripcion'],
    },
  },
  {
    type: 'function',
    name: 'consultar_informacion',
    description: 'Busca información real sobre la empresa (políticas, servicios, horarios, preguntas frecuentes) antes de responder preguntas específicas del cliente. Úsala siempre que el cliente pregunte algo sobre el hotel/empresa que no sepas con certeza absoluta — nunca inventes datos sobre el negocio.',
    parameters: {
      type: 'object',
      properties: {
        consulta: { type: 'string', description: 'La pregunta o tema a buscar, en tus propias palabras.' },
      },
      required: ['consulta'],
    },
  },
];

const app = express();
app.use(express.json());

async function resolverInstrucciones(codigoEmpresa) {
  if (!codigoEmpresa || codigoEmpresa === 'DESCONOCIDO' || !INTERNAL_API_URL || !INTERNAL_API_KEY) {
    return INSTRUCCIONES_RESPALDO;
  }
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
  if (!INTERNAL_API_URL || !INTERNAL_API_KEY) {
    return { ok: false, mensaje: 'No se pudo crear el ticket: backend no disponible en este momento.' };
  }
  try {
    const response = await fetch(`${INTERNAL_API_URL}/tickets/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-api-key': INTERNAL_API_KEY },
      body: JSON.stringify({
        codigo_empresa: contexto.codigoEmpresa,
        pbx_call_id: contexto.pbxCallId,
        titulo: args.titulo,
        descripcion: args.descripcion,
        prioridad: args.prioridad,
      }),
    });
    const json = await response.json();
    if (response.ok && json.ok) {
      console.log('✓ Ticket creado, id:', json.data.ticket_id);
      return { ok: true, ticket_id: json.data.ticket_id, mensaje: 'Ticket creado correctamente.' };
    }
    console.warn('⚠ No se pudo crear el ticket:', json.mensaje);
    return { ok: false, mensaje: json.mensaje || 'No se pudo crear el ticket.' };
  } catch (err) {
    console.error('✗ Error creando ticket:', err.message);
    return { ok: false, mensaje: 'Error interno al crear el ticket.' };
  }
}

async function ejecutarConsultarInformacion(args, contexto) {
  if (!INTERNAL_API_URL || !INTERNAL_API_KEY) {
    return { ok: false, mensaje: 'No se pudo consultar información: backend no disponible en este momento.' };
  }
  try {
    const url = `${INTERNAL_API_URL}/conocimiento/consultar?codigo=${encodeURIComponent(contexto.codigoEmpresa)}&consulta=${encodeURIComponent(args.consulta)}`;
    const response = await fetch(url, { headers: { 'x-internal-api-key': INTERNAL_API_KEY } });
    const json = await response.json();
    if (response.ok && json.ok) {
      const resultados = json.data.resultados || [];
      console.log(`✓ Consulta de conocimiento: ${resultados.length} resultado(s) para "${args.consulta}"`);
      if (resultados.length === 0) {
        return { ok: true, encontrado: false, mensaje: 'No se encontró información sobre esto en la base de conocimiento de la empresa. No inventes una respuesta — dile al cliente que vas a confirmarlo, y considera crear un ticket de seguimiento si es importante.' };
      }
      return { ok: true, encontrado: true, resultados };
    }
    return { ok: false, mensaje: json.mensaje || 'No se pudo consultar la información.' };
  } catch (err) {
    console.error('✗ Error consultando información:', err.message);
    return { ok: false, mensaje: 'Error interno al consultar la información.' };
  }
}

async function ejecutarHerramienta(nombre, argsCrudo, contexto) {
  let args = {};
  try { args = JSON.parse(argsCrudo || '{}'); } catch (e) { /* args vacíos si no parsea */ }

  switch (nombre) {
    case 'crear_ticket':
      return ejecutarCrearTicket(args, contexto);
    case 'consultar_informacion':
      return ejecutarConsultarInformacion(args, contexto);
    default:
      console.warn('⚠ Herramienta desconocida solicitada por el modelo:', nombre);
      return { ok: false, mensaje: `Herramienta '${nombre}' no implementada.` };
  }
}

function abrirSesionRealtime(callId, contexto) {
  const ws = new WebSocket(`wss://api.openai.com/v1/realtime?call_id=${callId}`, {
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
  });

  const pendingCalls = {};

  ws.on('open', () => {
    console.log('✓ WebSocket de sesión abierto para call_id:', callId);
    ws.send(JSON.stringify({
      type: 'session.update',
      session: { type: 'realtime', tools: TOOLS, tool_choice: 'auto' },
    }));
  });

  ws.on('message', async (raw) => {
    let event;
    try { event = JSON.parse(raw.toString('utf8')); } catch (e) { return; }

    if (event.type === 'error') {
      console.error('✗ Error de sesión Realtime:', JSON.stringify(event));
      return;
    }

    if (event.type === 'response.output_item.added' && event.item && event.item.type === 'function_call') {
      pendingCalls[event.item.call_id] = { name: event.item.name };
      console.log(`→ El modelo va a llamar a la función "${event.item.name}"`);
      return;
    }

    if (event.type === 'response.function_call_arguments.done') {
      const pending = pendingCalls[event.call_id];
      const nombreFuncion = pending ? pending.name : null;
      if (!nombreFuncion) {
        console.warn('⚠ Argumentos de function-call recibidos sin nombre asociado. Ignorando.');
        return;
      }
      console.log(`→ Ejecutando "${nombreFuncion}" con argumentos:`, event.arguments);

      const resultado = await ejecutarHerramienta(nombreFuncion, event.arguments, contexto);

      ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: event.call_id,
          output: JSON.stringify(resultado),
        },
      }));
      ws.send(JSON.stringify({ type: 'response.create' }));
      delete pendingCalls[event.call_id];
    }
  });

  ws.on('error', (err) => console.error('✗ Error en WebSocket de sesión:', err.message));
  ws.on('close', () => console.log('Sesión WebSocket cerrada para call_id:', callId));

  return ws;
}

app.post('/webhooks/openai-realtime', async (req, res) => {
  console.log('\n════ Webhook de OpenAI recibido ════');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('═════════════════════════════════\n');

  res.status(200).send('ok');

  if (req.body && req.body.type === 'realtime.call.incoming') {
    const callId = req.body.data.call_id;
    const sipHeaders = req.body.data.sip_headers || [];
    const buscarHeader = (nombre) => {
      const h = sipHeaders.find((x) => x.name.toLowerCase() === nombre.toLowerCase());
      return h ? h.value : null;
    };
    const codigoEmpresa = buscarHeader('x-merci-empresa');
    const pbxCallId = buscarHeader('x-merci-pbxcallid');

    console.log('→ Llamada entrante, call_id:', callId, '| empresa:', codigoEmpresa, '| pbx_call_id:', pbxCallId);

    const instrucciones = await resolverInstrucciones(codigoEmpresa);

    try {
      const response = await fetch(`https://api.openai.com/v1/realtime/calls/${callId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'realtime',
          model: 'gpt-realtime',
          instructions: instrucciones,
        }),
      });

      if (response.ok) {
        console.log('✓ Llamada aceptada. Abriendo sesión WebSocket...');
        abrirSesionRealtime(callId, { codigoEmpresa, pbxCallId });
      } else {
        const text = await response.text();
        console.error('✗ Error al aceptar la llamada:', response.status, text);
      }
    } catch (err) {
      console.error('✗ Error llamando a la API de OpenAI:', err.message);
    }
  }
});

app.get('/health', (req, res) => res.json({ ok: true, domain: DOMAIN }));

const sslOptions = {
  cert: fs.readFileSync(`/etc/letsencrypt/live/${DOMAIN}/fullchain.pem`),
  key: fs.readFileSync(`/etc/letsencrypt/live/${DOMAIN}/privkey.pem`),
};

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`Servidor de webhooks escuchando en https://${DOMAIN}:${PORT}`);
  console.log('Esperando eventos de OpenAI...\n');
});

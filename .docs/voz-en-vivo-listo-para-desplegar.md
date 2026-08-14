# Voz en vivo — API interna lista, en espera de decisión de despliegue

## Estado

**La API interna que `sip-b2bua.js` necesita ya está construida y verificada
contra Postgres real.** El puente de voz (`referencia-voz-bina12/voz-en-vivo/sip-b2bua.js`)
**no está conectado ni desplegado** — sigue siendo código de referencia, sin tocar. Este
documento describe lo que ya quedó listo del lado de MERCI y lo que falta decidir/configurar
antes de que alguien intente desplegar el bridge de verdad.

Todo el trabajo vive en la rama `feature/voz-en-vivo` (no está en `main`).

## Qué se construyó

Módulo nuevo `merci-platform/src/modules/internal/`, con su propio middleware de
autenticación (`x-internal-api-key`, nunca JWT — un proceso de telefonía no tiene usuario
logueado). Si `INTERNAL_API_KEY` no está configurada en el servidor, el middleware falla
**cerrado** (403/503 a todo) en vez de tumbar el arranque completo del backend.

Confirmado campo por campo contra lo que `sip-b2bua.js` ya espera mandar/leer — no se
adivinó ninguna forma, se leyó el archivo de referencia línea por línea:

| Llamada del bridge | Lo que espera | Lo que ya existe en MERCI | ¿Coincide? |
|---|---|---|---|
| `registrarInicioLlamada` | `POST {URL}/llamadas/iniciar`, body `{codigo_empresa, pbx_call_id, numero_origen}`, lee `json.data.llamada_id` | `POST /api/internal/llamadas/iniciar`, mismos campos, responde `data.llamada_id` | ✅ |
| `registrarFinLlamada` | `POST {URL}/llamadas/finalizar`, body `{llamada_id}`, solo revisa `json.ok` | `POST /api/internal/llamadas/finalizar`, mismo body | ✅ |
| `resolverInstrucciones` | `GET {URL}/agentes/resolver?codigo=...`, lee `json.data.instrucciones` y `json.data.empresa_nombre` | `GET /api/internal/agentes/resolver?codigo=...`, responde exactamente esos dos campos | ✅ |
| `ejecutarCrearTicket` | `POST {URL}/tickets/crear`, body `{codigo_empresa, pbx_call_id, titulo, descripcion, prioridad}`, lee `json.data.ticket_id` | `POST /api/internal/tickets/crear`, mismo body, responde `data.ticket_id` (traducido de `id` internamente) | ✅ |
| `ejecutarConsultarInformacion` | `GET {URL}/conocimiento/consultar?codigo=...&consulta=...`, si `!response.ok` cae a `{ok:false, mensaje: json.mensaje}` | Stub explícito, responde 501 `{ok:false, mensaje:'Conocimiento IA no está implementado todavía en MERCI.'}` — el bridge ya maneja esto sin caerse | ✅ (falla con gracia, no crashea) |

**Conclusión ya confirmada en una revisión aparte**: `sip-b2bua.js` no necesita ningún
cambio de código para hablar con esta API — el contrato ya coincide exacto. Lo único que
falta es configuración.

Las traducciones de datos que hacía falta resolver quedaron reales, no simuladas:
- `codigo_empresa` (string) → `empresa_id` (UUID), reusando `empresasRepository.buscarPorCodigo`
  (ya existía, usado hoy para el login sin `empresaId`).
- `prioridad` (string: Baja/Media/Alta/Crítica) → `prioridad_ticket_id` (UUID del catálogo),
  vía `ticketsRepository.buscarPrioridadPorNombre` (nuevo).
- `llamada_id` se resuelve una sola vez en `/llamadas/iniciar` (reusando
  `llamadasRepository.upsertLlamada`, el mismo mecanismo que ya usa el sync de CDR) y el
  bridge lo reutiliza en `/llamadas/finalizar` — no hace falta volver a traducir nada ahí.

## Verificación — contra Postgres real, no simulada

Se levantó el servidor local con un `INTERNAL_API_KEY` de prueba y se golpearon los 5
endpoints con `fetch` real:
- Sin API key / con API key incorrecta → `401`.
- `codigo_empresa` inexistente → `404` con mensaje claro.
- `codigo_empresa: "HTL-001"` (Hotel Paraíso — el mismo ejemplo que ya usa el propio README
  del bridge) resolvió a su `empresa_id` real.
- Reintentar `/llamadas/iniciar` con el mismo `pbx_call_id` devolvió el mismo `llamada_id`
  (idempotente, sin duplicar la llamada).
- El ticket de prueba quedó en BD con `prioridad_ticket_id` correctamente resuelto a la fila
  "Alta" del catálogo real.
- `/conocimiento/consultar` respondió el 501 esperado.

Los registros de prueba (llamada y ticket) se borraron después de verificar — no quedó
nada de prueba en la base de datos.

## Las dos variables de entorno exactas para desplegar

Cuando el equipo decida desplegar el bridge, en su `.env` (nunca en línea de comandos ni en
código — se expondría en el historial de bash y en `ps aux`):

```
INTERNAL_API_URL=https://<host-real-del-backend>/api/internal
INTERNAL_API_KEY=<el mismo valor configurado como INTERNAL_API_KEY en el backend de MERCI>
```

El propio `.env.example` de la referencia ya anticipaba el prefijo `/api/internal`
(`INTERNAL_API_URL=https://tu-url-ngrok-o-render/api/internal`) — coincide exacto con dónde
está montada la ruta en `index.routes.js` (`router.use('/internal', internalRoutes)` bajo `/api`).

### Detalle de la doble barra — no es un bug, es un error de configuración fácil de cometer

Si `INTERNAL_API_URL` se configura con `/` al final por error
(`https://host/api/internal/`), la concatenación que ya hace el bridge
(`` `${INTERNAL_API_URL}/llamadas/iniciar` ``) produce una doble barra:
`https://host/api/internal//llamadas/iniciar`. Vale la pena dejarlo explícito en las
instrucciones de despliegue para que nadie pierda tiempo debugueando esto — la variable
**no debe llevar `/` al final**.

## Requisito no negociable — firewall

**Si en algún momento se despliega el bridge, el puerto SIP (5060/UDP) debe quedar
restringido por firewall a la IP exacta de CloudUCM desde el primer despliegue — no como
remediación posterior a un incidente.** No es una recomendación de este documento: ya hay un
precedente real. El propio README de `referencia-voz-bina12/voz-en-vivo/` documenta que el
puerto SIP fue explotado una vez (31 jul – 1 ago 2026) por bots de fraude telefónico
mientras estuvo abierto sin restricción, generando consumo no autorizado en la cuenta de
OpenAI del equipo que construyó esta referencia (Bina 1/2) — resuelto en su momento
restringiendo el puerto a la IP de CloudUCM, rotando la clave API comprometida, y migrando
su manejo a `.env`. El caso fue reportado a soporte de OpenAI con evidencia de logs
mostrando un patrón de "checker" automatizado de claves robadas.

Regla mínima de firewall documentada en esa misma referencia:

```bash
ufw allow 22/tcp          # SIEMPRE primero, o se pierde el acceso a la VM
ufw allow from <IP-real-de-CloudUCM> to any port 5060 proto udp
ufw deny 5060/udp
ufw enable
```

## Resumen — qué está listo y qué falta

**Listo:** la API interna completa (5 endpoints), verificada contra Postgres real, con el
contrato ya confirmado compatible con `sip-b2bua.js` sin cambios de código.

**No hecho a propósito, en espera de decisión del equipo:**
- El bridge no está conectado a esta API (ni siquiera configurado con las variables de
  arriba).
- No hay ninguna VM ni infraestructura de despliegue para el bridge todavía.
- La decisión de arquitectura (daemon dentro de `jobs_async` vs. servicio externo separado,
  ver `.docs/Informe-implementacion-vozAI.md` sección 2) sigue sin tomarse.
- El firewall del puerto SIP no aplica todavía porque no hay ninguna VM desplegada — pero
  es la condición no negociable para el día que la haya.

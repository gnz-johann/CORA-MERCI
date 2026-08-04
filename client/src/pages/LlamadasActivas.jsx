import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Activity, PhoneCall, AlertCircle, RefreshCw, PhoneOff } from 'lucide-react';
import StatCard from '../components/StatCard';
import { llamadasService } from '../services/llamadas.service';

// Estados de catalogo_estado_llamada que cuentan como "en curso" — ver
// db/merci_schema.sql (INSERT INTO catalogo_estado_llamada). El resto
// (Finalizada, Cancelada, Transferida, Perdida, Escalada) ya terminaron.
const ESTADOS_ACTIVOS = ['En Espera', 'En Proceso'];

// Cada cuánto se vuelve a pedir /api/llamadas. Esto NO es WebSocket — ver el
// informe A.1.3 para por qué (resumen: los eventos call_started/call_ended
// solo los emite el pipeline de webhooks de CloudUCM, zona restringida y sin
// PBX real conectado en este entorno; el polling sí es 100% real, solo que
// pull en vez de push).
const INTERVALO_POLL_MS = 8000;

function formatDuracion(segundos) {
  const m = Math.floor(segundos / 60).toString().padStart(2, '0');
  const s = Math.floor(segundos % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function LlamadasActivasView() {
  const [llamadas, setLlamadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const primeraCarga = useRef(true);

  const cargarLlamadas = useCallback(async () => {
    if (primeraCarga.current) setCargando(true);
    setErrorCarga('');
    try {
      const res = await llamadasService.listar({ limite: 100 });
      const todas = res.data?.llamadas ?? [];
      setLlamadas(todas.filter((l) => ESTADOS_ACTIVOS.includes(l.catalogo_estado_llamada?.nombre)));
      setUltimaActualizacion(new Date());
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo consultar llamadas activas desde el servidor.');
    } finally {
      setCargando(false);
      primeraCarga.current = false;
    }
  }, []);

  // Poll cada INTERVALO_POLL_MS — esto es lo que hace "vivo" a este panel sin
  // depender de callOrchestrator.service.js/WebSocket (zona restringida).
  useEffect(() => {
    cargarLlamadas();
    const intervalo = setInterval(cargarLlamadas, INTERVALO_POLL_MS);
    return () => clearInterval(intervalo);
  }, [cargarLlamadas]);

  // Reloj para la duración en vivo de cada llamada en curso — 1 tick/segundo,
  // independiente del poll de red.
  useEffect(() => {
    const tick = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const llamadasConDuracion = useMemo(() => {
    return llamadas.map((l) => ({
      ...l,
      duracionEnVivo: l.fecha_inicio ? Math.max(0, Math.floor((ahora - new Date(l.fecha_inicio).getTime()) / 1000)) : 0,
    }));
  }, [llamadas, ahora]);

  const enEspera = llamadas.filter((l) => l.catalogo_estado_llamada?.nombre === 'En Espera').length;
  const enProceso = llamadas.filter((l) => l.catalogo_estado_llamada?.nombre === 'En Proceso').length;

  return (
    <div className="w-full min-h-screen bg-[#020C18] text-[#DCE9FF] p-6 font-sans relative">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">Llamadas Activas</h1>
          <p className="text-[11px] text-[#2E5070] font-mono mt-1 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" />
            {ultimaActualizacion
              ? `Actualizado ${ultimaActualizacion.toLocaleTimeString('es-MX')} — se refresca cada ${INTERVALO_POLL_MS / 1000}s`
              : 'Cargando...'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard titulo="Llamadas Activas" valor={llamadas.length} descripcion="En espera o en proceso" icon={Activity} cargando={cargando} />
        <StatCard titulo="En Espera" valor={enEspera} descripcion="Todavía sin atender" icon={PhoneCall} cargando={cargando} iconColor="text-[#F59E0B]" descColor="text-[#F59E0B]" />
        <StatCard titulo="En Proceso" valor={enProceso} descripcion="Conversación en curso" icon={Activity} cargando={cargando} iconColor="text-[#10B981]" descColor="text-[#10B981]" />
      </div>

      {errorCarga && (
        <div className="flex items-center gap-3 mb-6 px-5 py-3.5 rounded-xl border border-[#E11D48]/30 bg-[#3B0711]/60 text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{errorCarga}</p>
          <button
            onClick={cargarLlamadas}
            className="ml-auto text-xs font-bold uppercase tracking-wider text-[#FDA4AF] hover:text-white underline underline-offset-2 shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="bg-[#061628] border border-[#0D2647] rounded-2xl overflow-hidden shadow-xl">
        {cargando && (
          <div className="px-6 py-16 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[#155EEF] border-t-transparent animate-spin" />
              <span className="text-sm text-[#2E5070]">Consultando llamadas activas...</span>
            </div>
          </div>
        )}

        {/* Estado vacío correcto — no es un placeholder sin terminar, es el
            resultado real de no tener ninguna llamada en curso ahora mismo. */}
        {!cargando && llamadasConDuracion.length === 0 && !errorCarga && (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#0A1E38] border border-[#1A3A5C] flex items-center justify-center">
              <PhoneOff className="w-6 h-6 text-[#2E5070]" />
            </div>
            <p className="text-sm font-semibold text-[#7A9EC4]">Sin llamadas activas en este momento</p>
            <p className="text-xs text-[#2E5070] max-w-sm">
              Este panel consulta el estado real de <code className="text-[#3D6B94]">llamadas</code> cada{' '}
              {INTERVALO_POLL_MS / 1000}s — en cuanto una llamada entre en curso, va a aparecer aquí solo.
            </p>
          </div>
        )}

        {!cargando && llamadasConDuracion.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#0D2647]">
                  <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Origen</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Agente</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Duración</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Escalada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0D2647]/50">
                {llamadasConDuracion.map((l) => (
                  <tr key={l.id} className="hover:bg-[#0D2647]/30 transition-colors">
                    <td className="px-6 py-4"><span className="text-sm font-mono text-[#DCE9FF]">{l.numero_origen ?? '—'}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-[#DCE9FF]">{l.agentes_virtuales?.nombre ?? '— Sin asignar —'}</span></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium tracking-wide ${
                        l.catalogo_estado_llamada?.nombre === 'En Proceso'
                          ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/5'
                          : 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/5'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        {l.catalogo_estado_llamada?.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs font-mono text-[#7A9EC4]">{formatDuracion(l.duracionEnVivo)}</span></td>
                    <td className="px-6 py-4">
                      {l.escalada_humano
                        ? <span className="text-[11px] font-medium text-[#EF4444]">Sí</span>
                        : <span className="text-[11px] text-[#2E5070]">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

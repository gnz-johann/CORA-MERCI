import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Phone, PhoneIncoming, Clock, UserCheck, Download, Eye, X, FileText,
  ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, XCircle, AlertCircle, RefreshCw,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { llamadasService } from '../services/llamadas.service';

// Bloque 2.3 — conectado a GET /api/llamadas (carga) y POST /api/llamadas/sync-cdr
// (botón Actualizar). El backend hoy solo filtra server-side por desde/hasta/estado
// (ver llamadas.repository.js#listarLlamadas) — no tiene filtro de teléfono/agente
// ni export CSV real todavía. Por eso: desde/estado van al servidor, y
// teléfono/agente + paginación siguen siendo client-side sobre el lote ya
// cargado (limite alto, ver LIMITE_CARGA), igual que ya hace LlamadasActivas.jsx
// con `listar({ limite: 100 })`. El CSV exporta ese mismo lote ya cargado, no
// "todas las llamadas que existan" — es una limitación real, no un bug.
const PAGE_SIZE = 5;
const LIMITE_CARGA = 200;

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatDuracion(seg) {
  if (!seg && seg !== 0) return '—';
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function exportarCSV(filas) {
  const headers = ['Teléfono', 'Agente', 'Fecha y Hora', 'Duración', 'Estado', 'Resultado'];
  const rows = filas.map((l) => [
    l.numero_origen, l.agentes_virtuales?.nombre, formatFecha(l.fecha_inicio),
    formatDuracion(l.duracion_seg), l.catalogo_estado_llamada?.nombre, l.catalogo_resultado_llamada?.nombre,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `historial_llamadas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistorialLlamadas() {
  const [llamadas, setLlamadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [sincronizando, setSincronizando] = useState(false);

  const [selectedLlamada, setSelectedLlamada] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const [page, setPage] = useState(1);

  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTelefono, setFiltroTelefono] = useState('');
  const [filtroAgente, setFiltroAgente] = useState('');

  const showToast = useCallback((type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  }, []);

  const cargarLlamadas = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const res = await llamadasService.listar({
        limite: LIMITE_CARGA,
        desde: filtroFecha || undefined,
        estado: filtroEstado || undefined,
      });
      setLlamadas(res.data?.llamadas ?? []);
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo cargar el historial de llamadas desde el servidor.');
      setLlamadas([]);
    } finally {
      setCargando(false);
    }
  }, [filtroFecha, filtroEstado]);

  useEffect(() => { cargarLlamadas(); }, [cargarLlamadas]);

  const handleActualizar = async () => {
    setSincronizando(true);
    try {
      const res = await llamadasService.sincronizarCDR();
      showToast('success', `Sincronización ${res.data?.status}: ${res.data?.registrosSincronizados} registros procesados.`);
      await cargarLlamadas();
    } catch (err) {
      showToast('error', err.message || 'No se pudo sincronizar el CDR desde CloudUCM.');
    } finally {
      setSincronizando(false);
    }
  };

  // estado/agente disponibles para los selects — derivados del lote ya
  // cargado (mismo criterio que ya usaba la versión mock, no hay catálogo
  // dedicado de agentes/estados de llamada expuesto por el backend todavía).
  const agentesDisponibles = useMemo(
    () => [...new Set(llamadas.map((l) => l.agentes_virtuales?.nombre).filter(Boolean))], [llamadas]
  );
  const estadosDisponibles = useMemo(
    () => [...new Set(llamadas.map((l) => l.catalogo_estado_llamada?.nombre).filter(Boolean))], [llamadas]
  );

  // Teléfono y agente: client-side sobre el lote ya cargado (ver nota de
  // arriba) — fecha y estado ya vienen filtrados desde el servidor.
  const llamadasFiltradas = useMemo(() => {
    return llamadas.filter((l) => {
      if (filtroTelefono && !l.numero_origen?.includes(filtroTelefono.trim())) return false;
      if (filtroAgente && l.agentes_virtuales?.nombre !== filtroAgente) return false;
      return true;
    });
  }, [llamadas, filtroTelefono, filtroAgente]);

  const totalPaginas = Math.max(1, Math.ceil(llamadasFiltradas.length / PAGE_SIZE));
  const paginaActual = Math.min(page, totalPaginas);
  const llamadasPagina = llamadasFiltradas.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  const totalLlamadas = llamadas.length;
  const totalExitosas = llamadas.filter((l) => l.catalogo_resultado_llamada?.nombre === 'Exitosa').length;
  const totalEscaladas = llamadas.filter((l) => l.catalogo_estado_llamada?.nombre === 'Escalada').length;
  const duracionPromedio = Math.round(
    llamadas.reduce((acc, l) => acc + (l.duracion_seg || 0), 0) / (llamadas.length || 1)
  );

  const handleExportar = () => {
    exportarCSV(llamadasFiltradas);
    showToast('success', 'Archivo CSV exportado correctamente.');
  };

  const abrirDetalles = async (llamada) => {
    setIsModalOpen(true);
    setSelectedLlamada(llamada);
    setCargandoDetalle(true);
    try {
      // El listado no trae transcripción/sentimiento — hay que pedir el
      // detalle completo (GET /api/llamadas/:id) por separado.
      const res = await llamadasService.obtenerDetalle(llamada.id);
      setSelectedLlamada(res.data);
    } catch (err) {
      showToast('error', err.message || 'No se pudo cargar el detalle de la llamada.');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const getBadgeStyle = (estado) => {
    switch (estado) {
      case 'Finalizada':  return 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/5';
      case 'En Proceso':
      case 'En Espera':   return 'text-[#155EEF] border-[#155EEF]/30 bg-[#155EEF]/5';
      case 'Transferida': return 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/5';
      case 'Escalada':    return 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/5';
      case 'Perdida':
      case 'Cancelada':   return 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/5';
      default:            return 'text-[#7A9EC4] border-[#1A3A5C] bg-[#061628]';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#020C18] text-[#DCE9FF] p-6 font-sans relative">

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard titulo="Total Llamadas" valor={totalLlamadas} descripcion="Cargadas" icon={Phone} cargando={cargando} />
        <StatCard titulo="Exitosas" valor={totalExitosas} descripcion="Resultado exitoso" icon={CheckCircle2} cargando={cargando} />
        <StatCard titulo="Escaladas" valor={totalEscaladas} descripcion="Requirieron humano" icon={UserCheck} cargando={cargando} />
        <StatCard titulo="Duración Promedio" valor={formatDuracion(duracionPromedio)} descripcion="Minutos:segundos" icon={Clock} cargando={cargando} />
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

      {/* BARRA DE FILTROS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#061628] border border-[#1A3A5C] rounded-xl px-4 py-2 text-sm text-[#DCE9FF]">
            <PhoneIncoming className="w-4 h-4 text-[#7A9EC4]" />
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => { setFiltroFecha(e.target.value); setPage(1); }}
              className="bg-transparent focus:outline-none text-[#DCE9FF]"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#061628] border border-[#1A3A5C] rounded-xl px-4 py-2 text-sm text-[#DCE9FF]">
            <Phone className="w-4 h-4 text-[#7A9EC4]" />
            <input
              type="text"
              placeholder="Buscar teléfono..."
              value={filtroTelefono}
              onChange={(e) => { setFiltroTelefono(e.target.value); setPage(1); }}
              className="bg-transparent focus:outline-none text-[#DCE9FF] placeholder:text-[#2E5070] w-32"
            />
          </div>

          <div className="relative">
            <select
              value={filtroEstado}
              onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
              className="appearance-none bg-[#061628] border border-[#1A3A5C] rounded-xl pl-4 pr-9 py-2 text-sm text-[#DCE9FF] hover:bg-[#0D2647] transition-colors cursor-pointer focus:outline-none"
            >
              <option value="">Todos los estados</option>
              {estadosDisponibles.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-[#7A9EC4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filtroAgente}
              onChange={(e) => { setFiltroAgente(e.target.value); setPage(1); }}
              className="appearance-none bg-[#061628] border border-[#1A3A5C] rounded-xl pl-4 pr-9 py-2 text-sm text-[#DCE9FF] hover:bg-[#0D2647] transition-colors cursor-pointer focus:outline-none"
            >
              <option value="">Todos los agentes</option>
              {agentesDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-[#7A9EC4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleActualizar}
            disabled={sincronizando}
            className="flex items-center gap-2 bg-[#061628] hover:bg-[#0D2647] border border-[#1A3A5C] text-[#7A9EC4] px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
            {sincronizando ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button
            onClick={handleExportar}
            className="flex items-center gap-2 bg-[#061628] hover:bg-[#0D2647] border border-[#1A3A5C] text-[#7A9EC4] px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* TABLA DE LLAMADAS */}
      <div className="bg-[#061628] border border-[#0D2647] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#0D2647]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Teléfono</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Agente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Fecha y Hora</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Duración</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest text-center">Ver Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0D2647]/50">
              {cargando && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-[#155EEF] border-t-transparent animate-spin" />
                      <span className="text-sm text-[#2E5070]">Cargando historial de llamadas...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!cargando && llamadasPagina.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#2E5070]">
                    No hay llamadas que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}
              {!cargando && llamadasPagina.map((llamada) => (
                <tr key={llamada.id} className="hover:bg-[#0D2647]/30 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm font-mono text-[#DCE9FF]">{llamada.numero_origen ?? '—'}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-[#DCE9FF]">{llamada.agentes_virtuales?.nombre ?? '— Sin asignar —'}</span></td>
                  <td className="px-6 py-4"><span className="text-xs font-mono text-[#7A9EC4]">{formatFecha(llamada.fecha_inicio)}</span></td>
                  <td className="px-6 py-4"><span className="text-xs font-mono text-[#7A9EC4]">{formatDuracion(llamada.duracion_seg)}</span></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium tracking-wide ${getBadgeStyle(llamada.catalogo_estado_llamada?.nombre)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {llamada.catalogo_estado_llamada?.nombre ?? 'Sin estado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => abrirDetalles(llamada)}
                      className="p-2 bg-[#061628] hover:bg-[#0D2647] border border-[#1A3A5C] rounded-lg transition-colors text-[#7A9EC4] hover:text-white inline-flex"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0D2647]/30 border-t border-[#0D2647]">
          <span className="text-xs font-mono text-[#2E5070]">
            Mostrando {llamadasPagina.length} de {llamadasFiltradas.length} llamadas
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="p-1.5 bg-[#061628] border border-[#1A3A5C] rounded text-[#2E5070] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 bg-[#155EEF] text-white text-xs font-bold rounded">{paginaActual}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="p-1.5 bg-[#061628] border border-[#1A3A5C] rounded text-[#2E5070] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* === MODAL: DETALLE DE LA LLAMADA === */}
      {isModalOpen && selectedLlamada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020C18]/80 backdrop-blur-sm p-4">
          <div className="bg-[#061628] border border-[#0D2647] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#0D2647]">
              <div className="flex items-center gap-4">
                <div className="bg-[#0A1E38] p-3 rounded-xl border border-[#1A3A5C]">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-wide">Detalle de la llamada</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 bg-[#0A1E38] hover:bg-[#0D2647] border border-[#1A3A5C] rounded-lg transition-colors text-[#7A9EC4] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {cargandoDetalle && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <div className="w-4 h-4 rounded-full border-2 border-[#155EEF] border-t-transparent animate-spin" />
                  <span className="text-sm text-[#2E5070]">Cargando detalle...</span>
                </div>
              )}

              <div className="grid grid-cols-[140px_1fr] gap-y-4 text-sm">
                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Teléfono</span>
                <span className="text-[#DCE9FF] font-mono">{selectedLlamada.numero_origen ?? '—'}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Agente</span>
                <span className="text-[#DCE9FF] font-medium">{selectedLlamada.agentes_virtuales?.nombre ?? '— Sin asignar —'}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Fecha</span>
                <span className="text-[#DCE9FF] font-mono text-xs">{formatFecha(selectedLlamada.fecha_inicio)}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Duración</span>
                <span className="text-[#DCE9FF] font-mono text-xs">{formatDuracion(selectedLlamada.duracion_seg)}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Estado</span>
                <span className="text-[#DCE9FF] font-medium">{selectedLlamada.catalogo_estado_llamada?.nombre ?? '—'}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Resultado</span>
                <span className="text-[#DCE9FF] font-medium">{selectedLlamada.catalogo_resultado_llamada?.nombre ?? '—'}</span>

                {selectedLlamada.catalogo_sentimientos?.nombre && (
                  <>
                    <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Sentimiento</span>
                    <span className="text-[#DCE9FF] font-medium">{selectedLlamada.catalogo_sentimientos.nombre}</span>
                  </>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-[#0D2647]">
                <h3 className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mb-4">
                  Clasificación IA
                </h3>
                <p className="text-sm text-[#DCE9FF]">
                  {selectedLlamada.clasificacion_ia || 'Sin clasificar — la llamada no llegó a procesarse por IA.'}
                </p>
              </div>

              <div className="pt-4">
                <h3 className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mb-4">
                  Transcripción
                </h3>
                <p className="text-sm text-[#DCE9FF] bg-[#0A1E38] border border-[#1A3A5C] rounded-lg p-4 leading-relaxed">
                  {selectedLlamada.transcripcion || 'No hay transcripción disponible para esta llamada.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#0D2647] bg-[#040F1E]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-colors text-[#7A9EC4] hover:text-white bg-transparent border border-[#1A3A5C] hover:bg-[#0D2647]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === TOASTS === */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl max-w-sm ${
            toast.type === 'success'
              ? 'bg-[#003829] border-[#059669] text-[#10B981]'
              : 'bg-[#3B0711] border-[#E11D48] text-[#FDA4AF]'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-medium text-white">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

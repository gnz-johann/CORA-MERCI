import { useState, useMemo } from 'react';
import {
  Phone, PhoneIncoming, Clock, UserCheck, Download, Eye, X, FileText,
  ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, XCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard';

// === DATOS SIMULADOS — forma alineada al modelo real `llamadas` de Prisma ===
// (numero_origen, numero_destino, fecha_inicio, duracion_seg, agente/estado/resultado
// vienen de catálogos relacionados: catalogo_estado_llamada, catalogo_resultado_llamada).
// Reconstrucción del Bloque 1.0 — Sección 1.0.3. Sigue en mock a propósito: se conecta al
// backend real (GET /api/llamadas) en el Bloque 2.3, cuando también se agregue el export a
// CSV real y los filtros por teléfono/agente del lado del servidor.
const mockLlamadas = [
  {
    id: 1,
    numero_origen: '3312345678',
    numero_destino: '1000',
    agente_nombre: 'Agente Virtual Recepción',
    fecha_inicio: '2026-07-24T09:12:03',
    duracion_seg: 184,
    estado: 'Finalizada',
    resultado: 'Exitosa',
    clasificacion_ia: 'Consulta de disponibilidad',
    sentimiento: 'Positivo',
    transcripcion: 'Cliente pregunta por disponibilidad de habitaciones para el fin de semana. Se le confirma disponibilidad y se transfiere a reservaciones.',
  },
  {
    id: 2,
    numero_origen: '5522334455',
    numero_destino: '1000',
    agente_nombre: 'Agente Virtual Recepción',
    fecha_inicio: '2026-07-24T08:47:21',
    duracion_seg: 46,
    estado: 'Perdida',
    resultado: 'Sin Respuesta',
    clasificacion_ia: null,
    sentimiento: null,
    transcripcion: null,
  },
  {
    id: 3,
    numero_origen: '3319988776',
    numero_destino: '7099',
    agente_nombre: 'IVR Ventas',
    fecha_inicio: '2026-07-23T18:30:55',
    duracion_seg: 312,
    estado: 'Escalada',
    resultado: 'Escalada a Humano',
    clasificacion_ia: 'Reclamo de facturación',
    sentimiento: 'Negativo',
    transcripcion: 'Cliente reporta cobro duplicado. El agente virtual no logra resolverlo y escala a un supervisor humano.',
  },
  {
    id: 4,
    numero_origen: '3312345678',
    numero_destino: '1000',
    agente_nombre: 'Agente Virtual Recepción',
    fecha_inicio: '2026-07-23T14:05:10',
    duracion_seg: 97,
    estado: 'Finalizada',
    resultado: 'Exitosa',
    clasificacion_ia: 'Confirmación de reserva',
    sentimiento: 'Positivo',
    transcripcion: 'Cliente confirma su reserva del día 30. Se le envía confirmación por correo.',
  },
  {
    id: 5,
    numero_origen: '5588776655',
    numero_destino: '7099',
    agente_nombre: 'IVR Ventas',
    fecha_inicio: '2026-07-22T11:20:40',
    duracion_seg: 0,
    estado: 'Cancelada',
    resultado: 'Cancelada por Usuario',
    clasificacion_ia: null,
    sentimiento: null,
    transcripcion: null,
  },
  {
    id: 6,
    numero_origen: '3315566778',
    numero_destino: '1000',
    agente_nombre: 'Agente Virtual Recepción',
    fecha_inicio: '2026-07-22T10:02:17',
    duracion_seg: 205,
    estado: 'Transferida',
    resultado: 'Transferida',
    clasificacion_ia: 'Solicitud de late check-out',
    sentimiento: 'Neutral',
    transcripcion: 'Cliente solicita salida tardía. Se transfiere a recepción humana para autorizar.',
  },
];

const PAGE_SIZE = 5;

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
    l.numero_origen, l.agente_nombre, formatFecha(l.fecha_inicio),
    formatDuracion(l.duracion_seg), l.estado, l.resultado,
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
  const [llamadas] = useState(mockLlamadas);
  const [selectedLlamada, setSelectedLlamada] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const [page, setPage] = useState(1);

  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTelefono, setFiltroTelefono] = useState('');
  const [filtroAgente, setFiltroAgente] = useState('');

  const agentesDisponibles = useMemo(
    () => [...new Set(llamadas.map((l) => l.agente_nombre))], [llamadas]
  );
  const estadosDisponibles = useMemo(
    () => [...new Set(llamadas.map((l) => l.estado))], [llamadas]
  );

  const llamadasFiltradas = useMemo(() => {
    return llamadas.filter((l) => {
      if (filtroFecha && !l.fecha_inicio?.startsWith(filtroFecha)) return false;
      if (filtroEstado && l.estado !== filtroEstado) return false;
      if (filtroTelefono && !l.numero_origen?.includes(filtroTelefono.trim())) return false;
      if (filtroAgente && l.agente_nombre !== filtroAgente) return false;
      return true;
    });
  }, [llamadas, filtroFecha, filtroEstado, filtroTelefono, filtroAgente]);

  const totalPaginas = Math.max(1, Math.ceil(llamadasFiltradas.length / PAGE_SIZE));
  const paginaActual = Math.min(page, totalPaginas);
  const llamadasPagina = llamadasFiltradas.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  const totalLlamadas = llamadas.length;
  const totalExitosas = llamadas.filter((l) => l.resultado === 'Exitosa').length;
  const totalEscaladas = llamadas.filter((l) => l.estado === 'Escalada').length;
  const duracionPromedio = Math.round(
    llamadas.reduce((acc, l) => acc + (l.duracion_seg || 0), 0) / (llamadas.length || 1)
  );

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };

  const handleExportar = () => {
    exportarCSV(llamadasFiltradas);
    showToast('success', 'Archivo CSV exportado correctamente.');
  };

  const abrirDetalles = (llamada) => {
    setSelectedLlamada(llamada);
    setIsModalOpen(true);
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
        <StatCard titulo="Total Llamadas" valor={totalLlamadas} descripcion="Registradas" icon={Phone} />
        <StatCard titulo="Exitosas" valor={totalExitosas} descripcion="Resultado exitoso" icon={CheckCircle2} />
        <StatCard titulo="Escaladas" valor={totalEscaladas} descripcion="Requirieron humano" icon={UserCheck} />
        <StatCard titulo="Duración Promedio" valor={formatDuracion(duracionPromedio)} descripcion="Minutos:segundos" icon={Clock} />
      </div>

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

        <button
          onClick={handleExportar}
          className="flex items-center gap-2 bg-[#061628] hover:bg-[#0D2647] border border-[#1A3A5C] text-[#7A9EC4] px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
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
              {llamadasPagina.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#2E5070]">
                    No hay llamadas que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}
              {llamadasPagina.map((llamada) => (
                <tr key={llamada.id} className="hover:bg-[#0D2647]/30 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm font-mono text-[#DCE9FF]">{llamada.numero_origen}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-[#DCE9FF]">{llamada.agente_nombre}</span></td>
                  <td className="px-6 py-4"><span className="text-xs font-mono text-[#7A9EC4]">{formatFecha(llamada.fecha_inicio)}</span></td>
                  <td className="px-6 py-4"><span className="text-xs font-mono text-[#7A9EC4]">{formatDuracion(llamada.duracion_seg)}</span></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium tracking-wide ${getBadgeStyle(llamada.estado)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {llamada.estado}
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
              <div className="grid grid-cols-[140px_1fr] gap-y-4 text-sm">
                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Teléfono</span>
                <span className="text-[#DCE9FF] font-mono">{selectedLlamada.numero_origen}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Agente</span>
                <span className="text-[#DCE9FF] font-medium">{selectedLlamada.agente_nombre}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Fecha</span>
                <span className="text-[#DCE9FF] font-mono text-xs">{formatFecha(selectedLlamada.fecha_inicio)}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Duración</span>
                <span className="text-[#DCE9FF] font-mono text-xs">{formatDuracion(selectedLlamada.duracion_seg)}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Estado</span>
                <span className="text-[#DCE9FF] font-medium">{selectedLlamada.estado}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Resultado</span>
                <span className="text-[#DCE9FF] font-medium">{selectedLlamada.resultado}</span>

                {selectedLlamada.sentimiento && (
                  <>
                    <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Sentimiento</span>
                    <span className="text-[#DCE9FF] font-medium">{selectedLlamada.sentimiento}</span>
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

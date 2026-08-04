import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Ticket, CircleDot, Clock, CheckCircle2, Plus, Eye, X, AlertCircle,
  ChevronDown, XCircle, Phone,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { ticketsService } from '../services/tickets.service';
import { usuariosService } from '../services/usuarios.service';

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function badgeEstado(nombre) {
  switch (nombre) {
    case 'Abierto':    return 'text-[#155EEF] border-[#155EEF]/30 bg-[#155EEF]/5';
    case 'En Proceso': return 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/5';
    case 'Pendiente':  return 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/5';
    case 'Resuelto':   return 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/5';
    case 'Cerrado':    return 'text-[#7A9EC4] border-[#1A3A5C] bg-[#061628]';
    case 'Cancelado':  return 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/5';
    default:           return 'text-[#7A9EC4] border-[#1A3A5C] bg-[#061628]';
  }
}

function badgePrioridad(nombre) {
  switch (nombre) {
    case 'Crítica': return 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/5';
    case 'Alta':    return 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/5';
    case 'Media':   return 'text-[#155EEF] border-[#155EEF]/30 bg-[#155EEF]/5';
    case 'Baja':    return 'text-[#7A9EC4] border-[#1A3A5C] bg-[#061628]';
    default:        return 'text-[#7A9EC4] border-[#1A3A5C] bg-[#061628]';
  }
}

const FORM_VACIO = { titulo: '', descripcion: '', estadoTicketId: '', prioridadTicketId: '', usuarioResponsableId: '' };

export default function TicketsView() {
  const [tickets, setTickets] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const [resTickets, resUsuarios] = await Promise.all([
        ticketsService.listar(),
        usuariosService.listar(),
      ]);
      setTickets(resTickets.data ?? []);
      setUsuarios(resUsuarios.data?.usuarios ?? []);
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo cargar Tickets desde el servidor.');
      setTickets([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // El backend (GET /tickets/catalogos) todavía es un stub sin datos reales —
  // el catálogo disponible para crear/filtrar se arma con lo que ya trae la
  // lista de tickets. Solo cubre estados/prioridades que ya tenga al menos un
  // ticket existente (ver informe A.1.3).
  const estadosDisponibles = useMemo(() => {
    const mapa = new Map();
    tickets.forEach((t) => { if (t.catalogo_estado_ticket) mapa.set(t.catalogo_estado_ticket.id, t.catalogo_estado_ticket.nombre); });
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [tickets]);

  const prioridadesDisponibles = useMemo(() => {
    const mapa = new Map();
    tickets.forEach((t) => { if (t.catalogo_prioridad_ticket) mapa.set(t.catalogo_prioridad_ticket.id, t.catalogo_prioridad_ticket.nombre); });
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [tickets]);

  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((t) => {
      if (filtroEstado && t.catalogo_estado_ticket?.id !== filtroEstado) return false;
      if (filtroPrioridad && t.catalogo_prioridad_ticket?.id !== filtroPrioridad) return false;
      if (busqueda && !t.titulo?.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [tickets, filtroEstado, filtroPrioridad, busqueda]);

  const totalTickets = tickets.length;
  const totalAbiertos = tickets.filter((t) => t.catalogo_estado_ticket?.nombre === 'Abierto').length;
  const totalEnProceso = tickets.filter((t) => t.catalogo_estado_ticket?.nombre === 'En Proceso').length;
  const totalResueltos = tickets.filter((t) => t.catalogo_estado_ticket?.nombre === 'Resuelto').length;

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };

  const handleCrearTicket = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      showToast('error', 'El título es obligatorio.');
      return;
    }
    setGuardando(true);
    try {
      await ticketsService.crear({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        estado_ticket_id: form.estadoTicketId || undefined,
        prioridad_ticket_id: form.prioridadTicketId || undefined,
        usuario_responsable_id: form.usuarioResponsableId || undefined,
      });
      showToast('success', 'Ticket creado correctamente.');
      setIsModalCrearOpen(false);
      setForm(FORM_VACIO);
      cargarDatos();
    } catch (err) {
      showToast('error', err.message || 'No se pudo crear el ticket.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#020C18] text-[#DCE9FF] p-6 font-sans relative">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-wide">Tickets</h1>
        <button
          onClick={() => setIsModalCrearOpen(true)}
          className="flex items-center gap-2 bg-[#155EEF] hover:bg-[#1253c4] text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Ticket
        </button>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard titulo="Total Tickets" valor={totalTickets} descripcion="Todos los registrados" icon={Ticket} cargando={cargando} />
        <StatCard titulo="Abiertos" valor={totalAbiertos} descripcion="Recién generados" icon={CircleDot} cargando={cargando} iconColor="text-[#155EEF]" descColor="text-[#155EEF]" />
        <StatCard titulo="En Proceso" valor={totalEnProceso} descripcion="Siendo atendidos" icon={Clock} cargando={cargando} iconColor="text-[#F59E0B]" descColor="text-[#F59E0B]" />
        <StatCard titulo="Resueltos" valor={totalResueltos} descripcion="Problema solucionado" icon={CheckCircle2} cargando={cargando} iconColor="text-[#10B981]" descColor="text-[#10B981]" />
      </div>

      {/* BARRA DE FILTROS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por título..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-[#061628] border border-[#1A3A5C] rounded-xl px-4 py-2 text-sm text-[#DCE9FF] placeholder-[#2E5070] focus:outline-none focus:border-[#155EEF] transition-colors w-56"
          />

          <div className="relative">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="appearance-none bg-[#061628] border border-[#1A3A5C] rounded-xl pl-4 pr-9 py-2 text-sm text-[#DCE9FF] hover:bg-[#0D2647] transition-colors cursor-pointer focus:outline-none"
            >
              <option value="">Todos los estados</option>
              {estadosDisponibles.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-[#7A9EC4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              className="appearance-none bg-[#061628] border border-[#1A3A5C] rounded-xl pl-4 pr-9 py-2 text-sm text-[#DCE9FF] hover:bg-[#0D2647] transition-colors cursor-pointer focus:outline-none"
            >
              <option value="">Todas las prioridades</option>
              {prioridadesDisponibles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-[#7A9EC4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {errorCarga && (
        <div className="flex items-center gap-3 mb-6 px-5 py-3.5 rounded-xl border border-[#E11D48]/30 bg-[#3B0711]/60 text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{errorCarga}</p>
          <button
            onClick={cargarDatos}
            className="ml-auto text-xs font-bold uppercase tracking-wider text-[#FDA4AF] hover:text-white underline underline-offset-2 shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* TABLA DE TICKETS */}
      <div className="bg-[#061628] border border-[#0D2647] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#0D2647]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Título</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Prioridad</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Responsable</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Creado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest text-center">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0D2647]/50">
              {cargando && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-[#155EEF] border-t-transparent animate-spin" />
                      <span className="text-sm text-[#2E5070]">Cargando tickets...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!cargando && ticketsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#2E5070]">
                    No hay tickets que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}
              {!cargando && ticketsFiltrados.map((t) => (
                <tr key={t.id} className="hover:bg-[#0D2647]/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-[#DCE9FF]">{t.titulo}</p>
                    {t.llamadas && (
                      <p className="text-[11px] text-[#2E5070] font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {t.llamadas.numero_origen}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium tracking-wide ${badgeEstado(t.catalogo_estado_ticket?.nombre)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {t.catalogo_estado_ticket?.nombre ?? 'Sin estado'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium tracking-wide ${badgePrioridad(t.catalogo_prioridad_ticket?.nombre)}`}>
                      {t.catalogo_prioridad_ticket?.nombre ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-[#DCE9FF]">{t.usuarios?.nombre ?? '— Sin asignar —'}</span></td>
                  <td className="px-6 py-4"><span className="text-xs font-mono text-[#7A9EC4]">{formatFecha(t.fecha_creacion)}</span></td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedTicket(t)}
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
        <div className="flex items-center justify-between px-6 py-4 bg-[#0D2647]/30 border-t border-[#0D2647]">
          <span className="text-xs font-mono text-[#2E5070]">
            Mostrando {ticketsFiltrados.length} de {tickets.length} tickets
          </span>
        </div>
      </div>

      {/* === MODAL: CREAR TICKET === */}
      {isModalCrearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020C18]/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCrearTicket} className="bg-[#061628] border border-[#0D2647] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#0D2647]">
              <h2 className="text-xl font-bold">Nuevo Ticket</h2>
              <button type="button" onClick={() => setIsModalCrearOpen(false)} className="p-1.5 bg-[#0A1E38] hover:bg-[#0D2647] border border-[#1A3A5C] rounded-lg transition-colors text-[#7A9EC4] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#7A9EC4] mb-1.5 uppercase tracking-wider">Título *</label>
                <input
                  type="text" required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full bg-[#0A1E38] border border-[#1A3A5C] rounded-lg px-4 py-2.5 text-sm text-[#DCE9FF] focus:outline-none focus:border-[#155EEF] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#7A9EC4] mb-1.5 uppercase tracking-wider">Descripción</label>
                <textarea
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full bg-[#0A1E38] border border-[#1A3A5C] rounded-lg px-4 py-2.5 text-sm text-[#DCE9FF] focus:outline-none focus:border-[#155EEF] transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#7A9EC4] mb-1.5 uppercase tracking-wider">Estado</label>
                  <select
                    value={form.estadoTicketId}
                    onChange={(e) => setForm({ ...form, estadoTicketId: e.target.value })}
                    className="w-full bg-[#0A1E38] border border-[#1A3A5C] rounded-lg px-3 py-2.5 text-sm text-[#DCE9FF] focus:outline-none focus:border-[#155EEF]"
                  >
                    <option value="">Sin definir</option>
                    {estadosDisponibles.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7A9EC4] mb-1.5 uppercase tracking-wider">Prioridad</label>
                  <select
                    value={form.prioridadTicketId}
                    onChange={(e) => setForm({ ...form, prioridadTicketId: e.target.value })}
                    className="w-full bg-[#0A1E38] border border-[#1A3A5C] rounded-lg px-3 py-2.5 text-sm text-[#DCE9FF] focus:outline-none focus:border-[#155EEF]"
                  >
                    <option value="">Sin definir</option>
                    {prioridadesDisponibles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#7A9EC4] mb-1.5 uppercase tracking-wider">Responsable</label>
                <select
                  value={form.usuarioResponsableId}
                  onChange={(e) => setForm({ ...form, usuarioResponsableId: e.target.value })}
                  className="w-full bg-[#0A1E38] border border-[#1A3A5C] rounded-lg px-3 py-2.5 text-sm text-[#DCE9FF] focus:outline-none focus:border-[#155EEF]"
                >
                  <option value="">Sin asignar</option>
                  {usuarios.map((u) => <option key={u.usuarioId} value={u.usuarioId}>{u.nombre}</option>)}
                </select>
              </div>
              {estadosDisponibles.length < 6 && (
                <p className="text-[11px] text-[#2E5070] font-mono leading-relaxed">
                  El catálogo completo de estados/prioridades todavía no lo expone el backend
                  (endpoint pendiente) — solo aparecen aquí los que ya usa algún ticket existente.
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#0D2647] bg-[#040F1E]">
              <button type="button" onClick={() => setIsModalCrearOpen(false)} className="px-6 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-colors text-[#7A9EC4] hover:text-white bg-transparent border border-[#1A3A5C] hover:bg-[#0D2647]">
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className="px-6 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-colors bg-[#155EEF] hover:bg-[#1253c4] text-white disabled:opacity-50">
                {guardando ? 'Creando...' : 'Crear Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* === MODAL: DETALLE DE TICKET === */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020C18]/80 backdrop-blur-sm p-4">
          <div className="bg-[#061628] border border-[#0D2647] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#0D2647]">
              <h2 className="text-xl font-bold">{selectedTicket.titulo}</h2>
              <button onClick={() => setSelectedTicket(null)} className="p-1.5 bg-[#0A1E38] hover:bg-[#0D2647] border border-[#1A3A5C] rounded-lg transition-colors text-[#7A9EC4] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#DCE9FF]">{selectedTicket.descripcion || 'Sin descripción.'}</p>
              <div className="grid grid-cols-[110px_1fr] gap-y-3 text-sm">
                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Estado</span>
                <span className={`inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium ${badgeEstado(selectedTicket.catalogo_estado_ticket?.nombre)}`}>
                  {selectedTicket.catalogo_estado_ticket?.nombre ?? 'Sin estado'}
                </span>
                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Prioridad</span>
                <span className={`inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium ${badgePrioridad(selectedTicket.catalogo_prioridad_ticket?.nombre)}`}>
                  {selectedTicket.catalogo_prioridad_ticket?.nombre ?? '—'}
                </span>
                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Responsable</span>
                <span className="text-[#DCE9FF]">{selectedTicket.usuarios?.nombre ?? '— Sin asignar —'}</span>
                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Creado</span>
                <span className="text-[#DCE9FF] font-mono text-xs">{formatFecha(selectedTicket.fecha_creacion)}</span>
                {selectedTicket.fecha_cierre && (
                  <>
                    <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Cerrado</span>
                    <span className="text-[#DCE9FF] font-mono text-xs">{formatFecha(selectedTicket.fecha_cierre)}</span>
                  </>
                )}
                {selectedTicket.llamadas && (
                  <>
                    <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Llamada</span>
                    <span className="text-[#DCE9FF] font-mono text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedTicket.llamadas.numero_origen}</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-[#2E5070] font-mono leading-relaxed pt-2 border-t border-[#0D2647]">
                Agregar comentarios todavía no está disponible — el endpoint del backend
                (POST /tickets/comentarios) es un stub sin lógica real.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#0D2647] bg-[#040F1E]">
              <button onClick={() => setSelectedTicket(null)} className="px-6 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-colors text-[#7A9EC4] hover:text-white bg-transparent border border-[#1A3A5C] hover:bg-[#0D2647]">
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

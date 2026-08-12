import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, Edit3, Trash2, Users, Download, Eye, X, List,
  ArrowRight, CheckCircle2, XCircle, ChevronLeft, ChevronRight, ChevronDown,
  AlertCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { auditoriaService } from '../services/auditoria.service';

const PAGE_SIZE = 5;

// Calcula, entre datos_anteriores y datos_nuevos, qué campos cambiaron.
// Soporta N campos (no solo uno), porque en la vida real un update puede
// tocar varios a la vez.
function calcularDiff(anteriores, nuevos) {
  if (!anteriores && !nuevos) return [];
  const claves = new Set([
    ...Object.keys(anteriores || {}),
    ...Object.keys(nuevos || {}),
  ]);
  return [...claves].map((campo) => ({
    campo,
    anterior: anteriores?.[campo],
    nuevo: nuevos?.[campo],
  }));
}

function formatFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function exportarCSV(filas) {
  const headers = ['Usuario', 'Username', 'IP', 'Fecha y Hora', 'Acción', 'Módulo'];
  const rows = filas.map((l) => [
    l.usuarioNombre, l.usuarioUsername, l.ip, formatFecha(l.fechaHora), l.accion, l.modulo,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditoriaView() {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const [page, setPage] = useState(1);

  // Estado real de filtros (antes eran botones decorativos)
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');

  // Carga de logs contra el backend real. La respuesta viene paginada
  // (data.items / data.total / data.page / data.pageSize, camelCase) — se
  // pide un pageSize grande para poder seguir filtrando/paginando del lado
  // del cliente como ya hacía esta vista, sin reescribir ese flujo todavía.
  // Paginación real del lado del servidor queda para cuando se optimice
  // este archivo (Bloque A.2).
  const cargarLogs = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const res = await auditoriaService.listar({ pageSize: 1000 });
      const rawItems = res.data?.items ?? [];

      // DICCIONARIO DE RESPALDO (Por si el backend envía INSERT en lugar de Creó)
      const traducir = { 'INSERT': 'Creó', 'UPDATE': 'Editó', 'DELETE': 'Eliminó' };

      // ADAPTADOR A PRUEBA DE FALLOS: 
      // Mapea los datos crudos de PostgreSQL al formato que requiere React.
      const itemsFormateados = rawItems.map(log => ({
        ...log, // Conserva cualquier otra propiedad por si acaso
        id: log.id,
        // Busca el nombre ya sea en camelCase o anidado dentro del objeto 'usuarios' de Prisma
        usuarioNombre: log.usuarioNombre || log.usuarios?.nombre || 'Sistema / Automático',
        usuarioUsername: log.usuarioUsername || log.usuarios?.usuario || '—',
        // Rescata la fecha cruda
        fechaHora: log.fechaHora || log.fecha_evento,
        // Traduce la acción si viene en inglés
        accion: traducir[log.accion] || log.accion,
        modulo: log.modulo,
        // Rescata los JSON de cambios
        datosAnteriores: log.datosAnteriores || log.datos_anteriores,
        datosNuevos: log.datosNuevos || log.datos_nuevos
      }));

      setLogs(itemsFormateados);
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo cargar la auditoría desde el servidor.');
      setLogs([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarLogs(); }, [cargarLogs]);

  const usuariosDisponibles = useMemo(
    () => [...new Set(logs.map((l) => l.usuarioNombre))], [logs]
  );
  const modulosDisponibles = useMemo(
    () => [...new Set(logs.map((l) => l.modulo))], [logs]
  );

  const logsFiltrados = useMemo(() => {
    return logs.filter((l) => {
      if (filtroFecha && !l.fechaHora?.startsWith(filtroFecha)) return false;
      if (filtroUsuario && l.usuarioNombre !== filtroUsuario) return false;
      if (filtroAccion && l.accion !== filtroAccion) return false;
      if (filtroModulo && l.modulo !== filtroModulo) return false;
      return true;
    });
  }, [logs, filtroFecha, filtroUsuario, filtroAccion, filtroModulo]);

  const totalPaginas = Math.max(1, Math.ceil(logsFiltrados.length / PAGE_SIZE));
  const paginaActual = Math.min(page, totalPaginas);
  const logsPagina = logsFiltrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  // KPIs derivados de los datos reales, no hardcodeados
  const totalEventos = logs.length;
  const totalModificaciones = logs.filter((l) => l.accion === 'Editó').length;
  const totalEliminaciones = logs.filter((l) => l.accion === 'Eliminó').length;
  // Usuarios activos/sesiones abiertas NO sale de auditoria_logs — es un dato
  // de sesiones en vivo (otra fuente, probablemente socket). Queda mock aquí
  // a propósito hasta que exista esa fuente real.
  const usuariosActivosMock = 5;

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };

  const handleExportar = () => {
    exportarCSV(logsFiltrados);
    showToast('success', 'Archivo CSV exportado correctamente.');
  };

  const abrirDetalles = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const getBadgeStyle = (accion) => {
    switch (accion) {
      case 'Editó':   return 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/5';
      case 'Creó':    return 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/5';
      case 'Eliminó': return 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/5';
      default:        return 'text-[#7A9EC4] border-[#1A3A5C] bg-[#061628]';
    }
  };

  const diff = selectedLog ? calcularDiff(selectedLog.datosAnteriores, selectedLog.datosNuevos) : [];

  return (
    <div className="w-full min-h-screen bg-[#020C18] text-[#DCE9FF] p-6 font-sans relative">

      {/* TARJETAS DE MÉTRICAS — ahora con el componente StatCard real del proyecto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard titulo="Total Eventos" valor={totalEventos} descripcion="Todas las acciones" icon={Calendar} cargando={cargando} />
        <StatCard titulo="Modificaciones" valor={totalModificaciones} descripcion="Ediciones registradas" icon={Edit3} cargando={cargando} />
        <StatCard titulo="Eliminaciones" valor={totalEliminaciones} descripcion="Registros eliminados" icon={Trash2} cargando={cargando} />
        <StatCard titulo="Usuarios Activos" valor={usuariosActivosMock} descripcion="Sesiones abiertas" icon={Users} />
      </div>

      {/* BARRA DE FILTROS — ahora con estado real, ya filtran la tabla */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#061628] border border-[#1A3A5C] rounded-xl px-4 py-2 text-sm text-[#DCE9FF]">
            <Calendar className="w-4 h-4 text-[#7A9EC4]" />
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => { setFiltroFecha(e.target.value); setPage(1); }}
              className="bg-transparent focus:outline-none text-[#DCE9FF]"
            />
          </div>

          <div className="relative">
            <select
              value={filtroUsuario}
              onChange={(e) => { setFiltroUsuario(e.target.value); setPage(1); }}
              className="appearance-none bg-[#061628] border border-[#1A3A5C] rounded-xl pl-4 pr-9 py-2 text-sm text-[#DCE9FF] hover:bg-[#0D2647] transition-colors cursor-pointer focus:outline-none"
            >
              <option value="">Todos los usuarios</option>
              {usuariosDisponibles.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-[#7A9EC4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filtroAccion}
              onChange={(e) => { setFiltroAccion(e.target.value); setPage(1); }}
              className="appearance-none bg-[#061628] border border-[#1A3A5C] rounded-xl pl-4 pr-9 py-2 text-sm text-[#DCE9FF] hover:bg-[#0D2647] transition-colors cursor-pointer focus:outline-none"
            >
              <option value="">Todas las acciones</option>
              <option value="Creó">Creó</option>
              <option value="Editó">Editó</option>
              <option value="Eliminó">Eliminó</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#7A9EC4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filtroModulo}
              onChange={(e) => { setFiltroModulo(e.target.value); setPage(1); }}
              className="appearance-none bg-[#061628] border border-[#1A3A5C] rounded-xl pl-4 pr-9 py-2 text-sm text-[#DCE9FF] hover:bg-[#0D2647] transition-colors cursor-pointer focus:outline-none"
            >
              <option value="">Todos los módulos</option>
              {modulosDisponibles.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-[#7A9EC4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={handleExportar}
          disabled={cargando}
          className="flex items-center gap-2 bg-[#061628] hover:bg-[#0D2647] border border-[#1A3A5C] text-[#7A9EC4] px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* AVISO — el endpoint /auditoria no respondió (probablemente aún no
          existe en el backend). La vista sigue funcional, solo sin datos. */}
      {errorCarga && (
        <div className="flex items-center gap-3 mb-6 px-5 py-3.5 rounded-xl border border-[#E11D48]/30 bg-[#3B0711]/60 text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{errorCarga}</p>
          <button
            onClick={cargarLogs}
            className="ml-auto text-xs font-bold uppercase tracking-wider text-[#FDA4AF] hover:text-white underline underline-offset-2 shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* TABLA DE AUDITORÍA */}
      <div className="bg-[#061628] border border-[#0D2647] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#0D2647]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">IP</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Fecha y Hora</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Acción</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest">Módulo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#7A9EC4] uppercase tracking-widest text-center">Ver Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0D2647]/50">
              {cargando && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-[#155EEF] border-t-transparent animate-spin" />
                      <span className="text-sm text-[#2E5070]">Cargando eventos de auditoría...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!cargando && logsPagina.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#2E5070]">
                    No hay eventos que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}
              {!cargando && logsPagina.map((log) => (
                <tr key={log.id} className="hover:bg-[#0D2647]/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-[#DCE9FF]">{log.usuarioNombre ?? '—'}</p>
                    <p className="text-[11px] text-[#2E5070] font-mono mt-0.5">{log.usuarioUsername}</p>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-mono text-[#7A9EC4]">{log.ip}</span></td>
                  <td className="px-6 py-4"><span className="text-xs font-mono text-[#7A9EC4]">{formatFecha(log.fechaHora)}</span></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium tracking-wide ${getBadgeStyle(log.accion)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {log.accion}
                    </span>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-[#DCE9FF]">{log.modulo}</span></td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => abrirDetalles(log)}
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

        {/* PAGINACIÓN — ahora funcional */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0D2647]/30 border-t border-[#0D2647]">
          <span className="text-xs font-mono text-[#2E5070]">
            Mostrando {logsPagina.length} de {logsFiltrados.length} eventos
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

      {/* === MODAL: DETALLE DE LA ACTIVIDAD (soporta N campos cambiados) === */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020C18]/80 backdrop-blur-sm p-4">
          <div className="bg-[#061628] border border-[#0D2647] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#0D2647]">
              <div className="flex items-center gap-4">
                <div className="bg-[#0A1E38] p-3 rounded-xl border border-[#1A3A5C]">
                  <List className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-wide">Detalle de la actividad</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 bg-[#0A1E38] hover:bg-[#0D2647] border border-[#1A3A5C] rounded-lg transition-colors text-[#7A9EC4] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-[120px_1fr] gap-y-4 text-sm">
                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Usuario</span>
                <span className="text-[#DCE9FF] font-medium">{selectedLog.usuarioNombre ?? '— (evento automático del sistema)'}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Fecha</span>
                <span className="text-[#DCE9FF] font-mono text-xs">{formatFecha(selectedLog.fechaHora)}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Acción</span>
                <span className="text-[#DCE9FF] font-medium">{selectedLog.accion}</span>

                <span className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mt-0.5">Módulo</span>
                <span className="text-[#DCE9FF] font-medium">{selectedLog.modulo}</span>
              </div>

              {diff.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[#0D2647]">
                  <h3 className="text-[#2E5070] font-bold uppercase tracking-widest text-xs mb-4">
                    {selectedLog.accion === 'Creó' ? 'Datos creados' : selectedLog.accion === 'Eliminó' ? 'Datos eliminados' : 'Cambios realizados'}
                  </h3>
                  <div className="space-y-3">
                    {diff.map(({ campo, anterior, nuevo }) => (
                      <div key={campo} className="flex items-center gap-6 text-sm">
                        <span className="text-[#DCE9FF] font-medium w-28 capitalize shrink-0">{campo.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-4 bg-[#0A1E38] border border-[#1A3A5C] px-4 py-2 rounded-lg flex-1">
                          {anterior !== undefined && anterior !== null && (
                            <span className="text-[#2E5070] line-through font-mono">{String(anterior)}</span>
                          )}
                          {anterior !== undefined && anterior !== null && nuevo !== undefined && nuevo !== null && (
                            <ArrowRight className="w-4 h-4 text-[#155EEF]" />
                          )}
                          {nuevo !== undefined && nuevo !== null && (
                            <span className="text-[#10B981] font-mono font-medium">{String(nuevo)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diff.length === 0 && (
                <div className="mt-8 pt-6 border-t border-[#0D2647]">
                  <p className="text-[#2E5070] text-sm italic font-mono">No hay detalles de cambios específicos para esta acción.</p>
                </div>
              )}
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
import { useState, useEffect, useCallback } from "react";
import {
  Users,
  User,
  Shield,
  Phone,
  Bot,
  Ticket,
  AlertCircle,
  History,
} from "lucide-react";
import { dashboardService } from "../services/dashboard.service";

// Bloque 2.3 — conectado a GET /api/dashboard real (Bina 4). El backend
// reutiliza fn_dashboard_empresa() (ya existía en db/merci_schema.sql, sin
// usar hasta ahora) para los KPIs, y consultas reales contra llamadas,
// tickets, agentes_virtuales y auditoria_logs para el resto de paneles.
//
// El panel "Consumo IA" sigue en mock a propósito — consumo_ia no estaba en
// el alcance pedido para este endpoint (solo llamadas/tickets/agentes/
// auditoría), se deja marcado como tal en vez de mezclarlo con datos reales
// sin avisar.
const consumoIA = {
  tokensEntrada: "1.24",
  tokensSalida: "1.24",
  costoEstimado: "$47.82",
};

function formatDuracion(seg) {
  if (!seg && seg !== 0) return "—";
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatFechaCorta(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

// ── Helpers de estilo por estado (paleta del catálogo MERCI) ────
function badgeLlamada(estado) {
  const map = {
    "En Proceso":  "bg-blue-400/10 text-blue-300 border-blue-400/20",
    "En Espera":   "bg-amber-400/10 text-amber-300 border-amber-400/20",
    "Finalizada":  "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    "Transferida": "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
    "Escalada":    "bg-amber-400/10 text-amber-300 border-amber-400/20",
    "Cancelada":   "bg-slate-400/10 text-slate-300 border-slate-400/20",
    "Perdida":     "bg-rose-400/10 text-rose-300 border-rose-400/20",
  };
  return map[estado] || "bg-slate-400/10 text-slate-300 border-slate-400/20";
}

function badgeAgente(estado) {
  const map = {
    Ocupado:            "bg-rose-400/10 text-rose-300 border-rose-400/20",
    Disponible:         "bg-blue-400/10 text-blue-300 border-blue-400/20",
    Pausado:             "bg-amber-400/10 text-amber-300 border-amber-400/20",
    "Fuera de Servicio": "bg-slate-400/10 text-slate-300 border-slate-400/20",
    Desconectado:        "bg-slate-400/10 text-slate-300 border-slate-400/20",
  };
  return map[estado] || "bg-slate-400/10 text-slate-300 border-slate-400/20";
}

const sentimientoColor = {
  Positivo: "text-emerald-400",
  Neutral:  "text-slate-300",
  Negativo: "text-amber-400",
  Molesto:  "text-rose-400",
};

const prioridadColor = {
  "Crítica": "bg-rose-500",
  Alta:      "bg-amber-400",
};

// ── Card de métrica (StatCard) ───────────────────────────────────
function StatCard({ titulo, valor, descripcion, icon: Icon, cargando }) {
  return (
    <div className="relative rounded-2xl border border-[#0D2647] bg-[#061628] p-4 overflow-hidden font-['JetBrains_Mono']">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#2C4E6D] font-bold leading-tight">
          {titulo}
        </p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 bg-[#0A1E38] border-[#1A3A5C]">
          <Icon size={16} className="text-[#155EEF]" />
        </div>
      </div>
      <div className="mt-2">
        {cargando
          ? <div className="h-7 w-14 rounded-lg bg-[#0A1E38] animate-pulse" />
          : <span className="text-2xl font-bold text-slate-100">{valor}</span>}
      </div>
      <p className="mt-1.5 text-xs font-semibold text-[#7A9EC4]">{descripcion}</p>

      {/* Línea gradiente #155EEF */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#155EEF] to-transparent opacity-100" />
    </div>
  );
}

// ── Contenedor de panel reutilizable ─────────────────────────────
function Panel({ titulo, accion, children }) {
  return (
    <div className="relative rounded-2xl border border-[#0D2647] bg-[#061628] overflow-hidden font-['JetBrains_Mono']">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#0D2647]">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-200">
          {titulo}
        </h3>
        {accion && (
          <span className="text-[11px] text-[#7A9EC4] cursor-pointer">{accion}</span>
        )}
      </div>
      {children}
    </div>
  );
}

const RESUMEN_VACIO = {
  kpis: { llamadasActivas: 0, resolucionIA: 0, tiempoPromedioSeg: 0, llamadasHoy: 0 },
  llamadasRecientes: [],
  llamadasPorHora: [],
  sentimientosHoy: [],
  agentes: [],
  ticketsUrgentes: [],
  actividadReciente: [],
};

export default function Dashboard() {
  const [resumen, setResumen] = useState(RESUMEN_VACIO);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  const cargarResumen = useCallback(async () => {
    setCargando(true);
    setErrorCarga("");
    try {
      const res = await dashboardService.resumen();
      setResumen(res.data ?? RESUMEN_VACIO);
    } catch (err) {
      setErrorCarga(err.message || "No se pudo cargar el dashboard desde el servidor.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarResumen(); }, [cargarResumen]);

  const { kpis, llamadasRecientes, llamadasPorHora, sentimientosHoy, agentes, ticketsUrgentes, actividadReciente } = resumen;
  const maxHora = Math.max(1, ...llamadasPorHora.map((h) => h.cantidad));

  return (
    <div className="p-2 space-y-5 font-['JetBrains_Mono']">
      {errorCarga && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-[#E11D48]/30 bg-[#3B0711]/60 text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{errorCarga}</p>
          <button
            onClick={cargarResumen}
            className="ml-auto text-xs font-bold uppercase tracking-wider text-[#FDA4AF] hover:text-white underline underline-offset-2 shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard titulo="Llamadas Activas" valor={kpis.llamadasActivas} descripcion="En curso" icon={Users} cargando={cargando} />
        <StatCard titulo="Resolución IA" valor={`${kpis.resolucionIA}%`} descripcion="Llamadas exitosas hoy" icon={User} cargando={cargando} />
        <StatCard titulo="Tiempo Promedio" valor={formatDuracion(kpis.tiempoPromedioSeg)} descripcion="Por llamada hoy" icon={Shield} cargando={cargando} />
        <StatCard titulo="Llamadas Hoy" valor={kpis.llamadasHoy} descripcion="Llamadas totales el día de hoy" icon={Phone} cargando={cargando} />
      </div>

      {/* Llamadas en tiempo real + Agentes / Sentimientos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <Panel titulo="Llamadas en tiempo real" accion="Ver todo">
            <div className="divide-y divide-[#0D2647]">
              {!cargando && llamadasRecientes.length === 0 && (
                <p className="px-5 py-6 text-sm text-[#2C4E6D]">Sin llamadas registradas todavía.</p>
              )}
              {llamadasRecientes.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#0A1E38]/40"
                >
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-semibold text-slate-100">{l.numeroOrigen ?? '—'}</p>
                    <span
                      className={`inline-flex mt-1 px-2 py-0.5 rounded-md border text-[9px] font-bold ${badgeLlamada(
                        l.estado
                      )}`}
                    >
                      {l.estado ?? 'Sin estado'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{l.agenteNombre ?? '— Sin asignar —'}</p>
                  </div>

                  <div className="text-xs text-[#7A9EC4] shrink-0">{formatDuracion(l.duracionSeg)}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel titulo="Agentes Virtuales" accion="Ver todo">
            <div className="p-5 space-y-4">
              {!cargando && agentes.length === 0 && (
                <p className="text-sm text-[#2C4E6D]">Sin agentes registrados.</p>
              )}
              {agentes.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0A1E38] border border-[#1A3A5C] shrink-0">
                    <Bot size={16} className="text-[#155EEF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{a.nombre}</p>
                    <p className="text-[11px] text-[#2C4E6D] truncate">{a.llamadasAtendidas} llamadas atendidas</p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-1 rounded-md border shrink-0 ${badgeAgente(
                      a.estado
                    )}`}
                  >
                    {a.estado ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel titulo="Sentimientos Hoy">
            <div className="grid grid-cols-4 gap-2 p-5">
              {sentimientosHoy.length === 0 && (
                <p className="col-span-4 text-sm text-[#2C4E6D]">Sin llamadas clasificadas hoy.</p>
              )}
              {sentimientosHoy.map((s) => (
                <div
                  key={s.nombre}
                  className="rounded-xl border border-[#0D2647] bg-[#0A1E38]/40 p-3 text-center"
                >
                  <p className={`font-bold text-sm ${sentimientoColor[s.nombre] || 'text-slate-300'}`}>{s.porcentaje}%</p>
                  <p className="text-[9px] text-[#4A6A8C] mt-1 uppercase tracking-wide">
                    {s.nombre}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Llamadas por hora + Tickets urgentes + Consumo IA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel titulo="Llamadas por hora" accion="Últimas 8 horas">
          <div className="p-5">
            <div className="h-40 flex items-end gap-3">
              {llamadasPorHora.map((h) => (
                <div key={h.hora} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#155EEF] to-cyan-400"
                    style={{ height: `${(h.cantidad / maxHora) * 120}px` }}
                  />
                  <span className="text-[9px] text-[#4A6A8C]">{h.hora}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel titulo="Tickets Urgentes">
          <div className="p-5 space-y-3">
            {!cargando && ticketsUrgentes.length === 0 && (
              <p className="text-sm text-[#2C4E6D]">Sin tickets urgentes abiertos.</p>
            )}
            {ticketsUrgentes.map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${prioridadColor[t.prioridad] || 'bg-slate-400'}`} />
                <Ticket size={12} className="text-[#4A6A8C] shrink-0" />
                <span className="text-slate-300 text-xs truncate">{t.titulo}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel titulo="Consumo IA · Julio">
          <div className="p-5 space-y-4">
            <p className="text-[10px] text-[#4A6A8C] -mt-1">
              Datos de ejemplo — todavía no conectado a consumo_ia.
            </p>
            <div>
              <div className="flex justify-between text-xs text-[#4A6A8C] mb-1">
                <span>Tokens Entrada</span>
              </div>
              <p className="text-lg font-bold text-slate-100 mb-1.5">{consumoIA.tokensEntrada}</p>
              <div className="h-1.5 rounded-full bg-[#0A1E38] overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-[#155EEF]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#4A6A8C] mb-1">
                <span>Tokens Salida</span>
              </div>
              <p className="text-lg font-bold text-slate-100 mb-1.5">{consumoIA.tokensSalida}</p>
              <div className="h-1.5 rounded-full bg-[#0A1E38] overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-emerald-400" />
              </div>
            </div>

            <div className="pt-2 border-t border-[#0D2647] flex items-center justify-between">
              <span className="text-xs text-[#4A6A8C]">Costo Estimado</span>
              <span className="text-lg font-bold text-amber-400">{consumoIA.costoEstimado}</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Actividad reciente (auditoría) */}
      <Panel titulo="Actividad Reciente">
        <div className="divide-y divide-[#0D2647]">
          {!cargando && actividadReciente.length === 0 && (
            <p className="px-5 py-6 text-sm text-[#2C4E6D]">Sin actividad registrada todavía.</p>
          )}
          {actividadReciente.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3">
              <History size={14} className="text-[#4A6A8C] shrink-0" />
              <span className="text-sm text-slate-100 font-semibold shrink-0">{a.usuario ?? 'Usuario'}</span>
              <span className="text-xs text-[#7A9EC4] shrink-0">{a.accion}</span>
              <span className="text-xs text-[#4A6A8C] truncate">{a.modulo}</span>
              <span className="text-[10px] text-[#2C4E6D] font-mono ml-auto shrink-0">{formatFechaCorta(a.fecha)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

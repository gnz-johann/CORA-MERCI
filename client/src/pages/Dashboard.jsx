import { useState } from "react";
import {
  Users,
  User,
  Shield,
  Phone,
  Bot,
  Ticket,
  AlertCircle,
} from "lucide-react";

// ── Datos simulados ──────────────────────────────────────────────
const kpis = [
  { titulo: "Llamadas Activas", valor: "2", descripcion: "En curso", icon: Users },
  { titulo: "Resolución IA", valor: "78%", descripcion: "Sin transferencia", icon: User },
  { titulo: "Tiempo Promedio", valor: "2:30", descripcion: "Por llamada", icon: Shield },
  { titulo: "Llamadas Hoy", valor: "55", descripcion: "Llamadas totales el día de hoy", icon: Phone },
];

const llamadas = [
  { numero: "+52 33 1234", nombre: "Sofía", detalle: "IA · Ventas", estado: "EN PROCESO", tiempo: "2:30" },
  { numero: "+52 33 1234", nombre: "Atlas", detalle: "IA · Soporte Técnico", estado: "EN PROCESO", tiempo: "1:20" },
  { numero: "+52 33 1234", nombre: "Aria", detalle: "IA · Soporte Técnico", estado: "EN ESPERA", tiempo: "3:50" },
  { numero: "+52 33 1234", nombre: "Iván Rodríguez", detalle: "Humano · Soporte Técnico", estado: "FINALIZADA", tiempo: "1:02" },
  { numero: "+52 33 1234", nombre: "Carlos Martínez", detalle: "Humano · Soporte Técnico", estado: "TRANSFERIDA", tiempo: "1:44" },
  { numero: "+52 33 1234", nombre: "José Ríos", detalle: "Humano · Soporte Técnico", estado: "CANCELADA", tiempo: "3:03" },
];

const agentes = [
  { nombre: "Sofía", detalle: "128 llamadas atendidas", estado: "OCUPADO" },
  { nombre: "Atlas", detalle: "102 llamadas atendidas", estado: "OCUPADO" },
  { nombre: "Aria", detalle: "80 llamadas atendidas", estado: "DISPONIBLE" },
];

const sentimientos = [
  { label: "Positivas", valor: "62%", color: "text-emerald-400" },
  { label: "Neutral", valor: "21%", color: "text-slate-300" },
  { label: "Negativo", valor: "11%", color: "text-amber-400" },
  { label: "Molesto", valor: "6%", color: "text-rose-400" },
];

const llamadasPorHora = [
  { hora: "08h", valor: 45 },
  { hora: "09h", valor: 78 },
  { hora: "10h", valor: 92 },
  { hora: "11h", valor: 58 },
  { hora: "12h", valor: 95 },
  { hora: "13h", valor: 82 },
  { hora: "14h", valor: 50 },
  { hora: "15h", valor: 98 },
];

const tickets = [
  { id: "#TK-044", texto: "Falla en transferencia ext. 1003", color: "bg-rose-500" },
  { id: "#TK-044", texto: "PBX desconectado sucursal GDL", color: "bg-rose-500" },
  { id: "#TK-044", texto: "Revisar horario sucursal CDMX", color: "bg-amber-400" },
  { id: "#TK-044", texto: "Asistente Aria desactualizada", color: "bg-emerald-400" },
];

// ── Helpers de estilo por estado (paleta del catálogo MERCI) ────
function badgeLlamada(estado) {
  const map = {
    "EN PROCESO": "bg-blue-400/10 text-blue-300 border-blue-400/20",
    "EN ESPERA": "bg-amber-400/10 text-amber-300 border-amber-400/20",
    FINALIZADA: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    TRANSFERIDA: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
    CANCELADA: "bg-slate-400/10 text-slate-300 border-slate-400/20",
  };
  return map[estado] || "bg-slate-400/10 text-slate-300 border-slate-400/20";
}

function badgeAgente(estado) {
  const map = {
    OCUPADO: "bg-rose-400/10 text-rose-300 border-rose-400/20",
    DISPONIBLE: "bg-blue-400/10 text-blue-300 border-blue-400/20",
  };
  return map[estado] || "bg-slate-400/10 text-slate-300 border-slate-400/20";
}

// ── Card de métrica (StatCard) ───────────────────────────────────
function StatCard({ titulo, valor, descripcion, icon: Icon }) {
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
        <span className="text-2xl font-bold text-slate-100">{valor}</span>
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

export default function Dashboard() {
  const maxHora = Math.max(...llamadasPorHora.map((h) => h.valor));

  return (
    <div className="p-2 space-y-5 font-['JetBrains_Mono']">      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((item) => (
          <StatCard key={item.titulo} {...item} />
        ))}
      </div>

      {/* Llamadas en tiempo real + Agentes / Sentimientos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <Panel titulo="Llamadas en tiempo real" accion="Ver todo">
            <div className="divide-y divide-[#0D2647]">
              {llamadas.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#0A1E38]/40"
                >
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-semibold text-slate-100">{l.numero}</p>
                    <span
                      className={`inline-flex mt-1 px-2 py-0.5 rounded-md border text-[9px] font-bold ${badgeLlamada(
                        l.estado
                      )}`}
                    >
                      {l.estado}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{l.nombre}</p>
                    <p className="text-xs text-[#2C4E6D]">{l.detalle}</p>
                  </div>

                  <div className="text-xs text-[#7A9EC4] shrink-0">{l.tiempo}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel titulo="Agentes Virtuales" accion="Ver todo">
            <div className="p-5 space-y-4">
              {agentes.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0A1E38] border border-[#1A3A5C] shrink-0">
                    <Bot size={16} className="text-[#155EEF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{a.nombre}</p>
                    <p className="text-[11px] text-[#2C4E6D] truncate">{a.detalle}</p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-1 rounded-md border shrink-0 ${badgeAgente(
                      a.estado
                    )}`}
                  >
                    {a.estado}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel titulo="Sentimientos Hoy">
            <div className="grid grid-cols-4 gap-2 p-5">
              {sentimientos.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-[#0D2647] bg-[#0A1E38]/40 p-3 text-center"
                >
                  <p className={`font-bold text-sm ${s.color}`}>{s.valor}</p>
                  <p className="text-[9px] text-[#4A6A8C] mt-1 uppercase tracking-wide">
                    {s.label}
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
                    style={{ height: `${(h.valor / maxHora) * 120}px` }}
                  />
                  <span className="text-[9px] text-[#4A6A8C]">{h.hora}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel titulo="Tickets Urgentes">
          <div className="p-5 space-y-3">
            {tickets.map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.color}`} />
                <span className="text-[10px] text-[#4A6A8C] shrink-0">{t.id}</span>
                <span className="text-slate-300 text-xs truncate">{t.texto}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel titulo="Consumo IA · Julio">
          <div className="p-5 space-y-4">
            <div>
              <div className="flex justify-between text-xs text-[#4A6A8C] mb-1">
                <span>Tokens Entrada</span>
              </div>
              <p className="text-lg font-bold text-slate-100 mb-1.5">1.24</p>
              <div className="h-1.5 rounded-full bg-[#0A1E38] overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-[#155EEF]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#4A6A8C] mb-1">
                <span>Tokens Salida</span>
              </div>
              <p className="text-lg font-bold text-slate-100 mb-1.5">1.24</p>
              <div className="h-1.5 rounded-full bg-[#0A1E38] overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-emerald-400" />
              </div>
            </div>

            <div className="pt-2 border-t border-[#0D2647] flex items-center justify-between">
              <span className="text-xs text-[#4A6A8C]">Costo Estimado</span>
              <span className="text-lg font-bold text-amber-400">$47.82</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
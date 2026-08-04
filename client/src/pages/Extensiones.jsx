import { useState } from "react";
import {
  Search,
  ChevronDown,
  Plus,
  Pencil,
  X,
  Radio,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  UserCheck,
  Phone,
  PhoneOff,
  Trash2,
} from "lucide-react";

// ── Datos simulados ──────────────────────────────────────────────
const usuariosDisponibles = ["Fernanda Lazo", "Carlos Martínez", "Ximena Sanchez"];

const extensionesIniciales = [
  { id: 1, ext: "1001", nombre: "Recepción Principal", usuario: "Fernanda Lazo", handle: "fernanda.l", estado: "Activa", sucursal: "Sucursal CDMX", departamento: "Ventas" },
  { id: 2, ext: "1002", nombre: "Ventas 01", usuario: "Carlos Martínez", handle: "carlos.m", estado: "Ocupada", sucursal: "Sucursal Guadalajara", departamento: "Ventas" },
  { id: 3, ext: "1003", nombre: "Ventas 02", usuario: "Ximena Sanchez", handle: "ximena.s", estado: "En Llamada", sucursal: "Sucursal Guadalajara", departamento: "Soporte Técnico" },
  { id: 4, ext: "1004", nombre: "Soporte 01", usuario: "Iván Rodríguez", handle: "ivan.r", estado: "Suspendida", sucursal: "Sucursal Guadalajara", departamento: "Soporte Técnico" },
  { id: 5, ext: "1005", nombre: "Soporte 02", usuario: "Francisco López", handle: "francisco.l", estado: "Desconectada", sucursal: "Sucursal Monterrey", departamento: "Soporte Técnico" },
  { id: 6, ext: "1006", nombre: "Atención Agente Virtual", usuario: "José Ríos", handle: "francisco.l", estado: "No Disponible", sucursal: "Sucursal Monterrey", departamento: "Cobranza" },
];

function badgeEstado(estado) {
  const map = {
    Activa: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    Ocupada: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    "En Llamada": "bg-blue-400/10 text-blue-300 border-blue-400/20",
    Suspendida: "bg-rose-400/10 text-rose-300 border-rose-400/20",
    Desconectada: "bg-slate-400/10 text-slate-300 border-slate-400/20",
    "No Disponible": "bg-purple-400/10 text-purple-300 border-purple-400/20",
  };
  return map[estado] || "bg-slate-400/10 text-slate-300 border-slate-400/20";
}

// ── Input reutilizable ────────────────────────────────────────────
function FormInput({ label, placeholder, value, onChange, note }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.18em] text-[#7A9EC4] font-bold mb-1.5">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-[#040F1E] border border-[#1A3A5C] rounded-lg px-3 py-2.5 text-sm
                   text-[#EEEEEE] placeholder:text-[#5D5D5D]
                   focus:outline-none focus:border-[#1667F4] transition-colors"
      />
      {note && <p className="mt-1.5 text-[10px] text-[#2D547E] leading-snug">{note}</p>}
    </div>
  );
}

// ── Select personalizado (Usuario Asignado) ──────────────────────
function FormSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-[10px] uppercase tracking-[0.18em] text-[#7A9EC4] font-bold mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-[#040F1E] border border-[#1A3A5C] rounded-lg
                   px-3 py-2.5 text-sm text-[#EEEEEE] focus:outline-none focus:border-[#1667F4]"
      >
        <span className={value ? "text-[#EEEEEE]" : "text-[#5D5D5D]"}>
          {value || "Selecciona un usuario"}
        </span>
        <ChevronDown size={14} className="text-[#7A9EC4]" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-[#040F1E] border border-[#1A3A5C] rounded-lg overflow-hidden">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer ${
                opt === value
                  ? "bg-[#1667F4] text-white"
                  : "text-[#EEEEEE] hover:bg-[#0A1E38]"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dropdown de filtro (Sucursal / Estado) ────────────────────────
function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-[#061628] border border-[#0D2647] rounded-lg px-3 py-2 text-xs text-[#2C4E6D] whitespace-nowrap"
      >
        {value || label}
        <ChevronDown size={12} className="text-[#2C4E6D]" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 min-w-full w-max bg-[#040F1E] border border-[#1A3A5C] rounded-lg overflow-hidden">
          <div
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`px-3 py-2 text-xs cursor-pointer whitespace-nowrap ${
              !value ? "bg-[#1667F4] text-white" : "text-[#EEEEEE] hover:bg-[#0A1E38]"
            }`}
          >
            Todas
          </div>
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`px-3 py-2 text-xs cursor-pointer whitespace-nowrap ${
                opt === value
                  ? "bg-[#1667F4] text-white"
                  : "text-[#EEEEEE] hover:bg-[#0A1E38]"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Modal base (Crear / Editar / Eliminar) ────────────────────────
// iconBoxBg / iconBoxBorder / iconColor: por defecto el set "normal"
// (0A1E38 / 1A3A5C / DAEBFF). El modal de Eliminar sobreescribe
// iconBoxBg e iconBoxBorder con la paleta roja (642323).
// El botón de cerrar (X) SIEMPRE usa el set normal (0A1E38 / 1A3A5C / 7A9EC4),
// incluso en el modal de Eliminar.
function ModalBase({
  titulo,
  icon: Icon,
  onClose,
  children,
  iconBoxBg = "#0A1E38",
  iconBoxBorder = "#1A3A5C",
  iconColor = "#DAEBFF",
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#061628] border border-[#0D2647] rounded-2xl font-['JetBrains_Mono']">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#0D2647]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center border"
              style={{ backgroundColor: iconBoxBg, borderColor: iconBoxBorder }}
            >
              <Icon size={16} style={{ color: iconColor }} />
            </div>
            <h2 className="text-lg font-bold text-[#DAEBFF] font-['Syne']">{titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0A1E38] border border-[#1A3A5C]"
          >
            <X size={14} className="text-[#7A9EC4]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Modal Crear / Editar Extensión ────────────────────────────────
function ExtensionFormModal({ modo, extension, onClose, onSubmit }) {
  const esEdicion = modo === "editar";

  const [form, setForm] = useState({
    ext: extension?.ext || "",
    nombre: extension?.nombre || "",
    usuario: extension?.usuario || "",
    sucursal: extension?.sucursal || "",
    departamento: extension?.departamento || "",
    estado: extension?.estado || "",
    mac: extension?.mac || "",
  });

  const set = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target ? e.target.value : e }));

  return (
    <ModalBase
      titulo={esEdicion ? "Editar Extensión" : "Crear Extensión"}
      icon={esEdicion ? Pencil : Radio}
      onClose={onClose}
    >
      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Extensión" placeholder="Ej: 1001" value={form.ext} onChange={set("ext")} />
          <FormInput label="Nombre" placeholder="Ej: Recepción Principal" value={form.nombre} onChange={set("nombre")} />
        </div>

        <FormSelect
          label="Usuario Asignado"
          value={form.usuario}
          onChange={set("usuario")}
          options={usuariosDisponibles}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Sucursal" placeholder="Ej: Sucursal CDMX" value={form.sucursal} onChange={set("sucursal")} />
          <FormInput label="Departamento" placeholder="Ej: Ventas" value={form.departamento} onChange={set("departamento")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Estado" placeholder="Ej: Activa" value={form.estado} onChange={set("estado")} />
          <FormInput
            label="MAC del teléfono (PBX)"
            placeholder="Ej: C0:74:AD:18:2E:9F"
            value={form.mac}
            onChange={set("mac")}
            note="12 dígitos hexadecimales (0-9, A-F). Opcional."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#0D2647]">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#061628] border border-[#2D547E] text-[#2D547E]"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSubmit(form)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#1667F4] text-white"
        >
          <Plus size={14} />
          {esEdicion ? "Guardar Cambios" : "Crear Extensión"}
        </button>
      </div>
    </ModalBase>
  );
}

// ── Modal Eliminar Extensión ───────────────────────────────────────
function DeleteModal({ onClose, onConfirm }) {
  return (
    <ModalBase
      titulo="Eliminar Extensión"
      icon={AlertTriangle}
      onClose={onClose}
      iconBoxBg="rgba(100, 35, 35, 0.2)"
      iconBoxBorder="#642323"
    >
      <div className="px-6 py-5">
        <p className="text-sm font-semibold text-[#DCE9FF] font-['Montserrat'] not-italic">
          ¿Estás seguro de que deseas eliminar esta extensión?
        </p>
        <p className="mt-2 text-xs text-[#2D547E] leading-snug font-['Montserrat'] not-italic">
          Esta acción no se puede deshacer. La extensión quedará eliminada.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#0D2647]">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#061628] border border-[#2D547E] text-[#2D547E]"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: "#642323" }}
        >
          <Trash2 size={14} className="text-white" />
          Eliminar Extensión
        </button>
      </div>
    </ModalBase>
  );
}

// ── Toast ──────────────────────────────────────────────────────────
function Toast({ tipo, mensaje, onClose }) {
  const accent = tipo === "success" ? "#10974D" : "#853333";
  const Icon = tipo === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2
                 bg-[#040F1E] border rounded-full px-4 py-2.5 font-['JetBrains_Mono']"
      style={{ borderColor: accent, color: accent }}
    >
      <Icon size={14} />
      <span className="text-xs font-semibold">{mensaje}</span>
    </div>
  );
}

// ── Vista principal ─────────────────────────────────────────────
export default function Extensiones() {
  const [extensiones, setExtensiones] = useState(extensionesIniciales);
  const [modal, setModal] = useState(null); // { tipo: 'crear' | 'editar' | 'eliminar', data? }
  const [toast, setToast] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(null);

  const sucursalesUnicas = [...new Set(extensiones.map((e) => e.sucursal))];
  const estadosUnicos = [...new Set(extensiones.map((e) => e.estado))];

  const extensionesFiltradas = extensiones.filter((e) => {
    const coincideBusqueda =
      !busqueda || e.sucursal.toLowerCase().includes(busqueda.toLowerCase());
    const coincideSucursal = !filtroSucursal || e.sucursal === filtroSucursal;
    const coincideEstado = !filtroEstado || e.estado === filtroEstado;
    return coincideBusqueda && coincideSucursal && coincideEstado;
  });

  const mostrarToast = (tipo, mensaje) => {
    setToast({ tipo, mensaje });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCrear = (form) => {
    setExtensiones((prev) => [
      ...prev,
      { id: Date.now(), handle: "", ...form },
    ]);
    setModal(null);
    mostrarToast("success", "Extensión creada correctamente");
  };

  const handleEditar = (form) => {
    setExtensiones((prev) =>
      prev.map((e) => (e.id === modal.data.id ? { ...e, ...form } : e))
    );
    setModal(null);
    mostrarToast("success", "Extensión actualizada correctamente");
  };

  const handleEliminar = () => {
    // Simulación de fallo — reemplazar por la llamada real a la API.
    const fallo = false;

    if (fallo) {
      setModal(null);
      mostrarToast("error", "Error al eliminar extensión");
      return;
    }

    setExtensiones((prev) => prev.filter((e) => e.id !== modal.data.id));
    setModal(null);
    mostrarToast("success", "Extensión eliminada correctamente");
  };

  return (
    <div className="p-6 space-y-5 font-['JetBrains_Mono']">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { titulo: "Totales", valor: extensiones.length, descripcion: "Registradas", icon: Radio },
          { titulo: "Activas", valor: extensiones.filter((e) => e.estado === "Activa").length, descripcion: "Disponibles ahora", icon: UserCheck },
          { titulo: "En Llamada", valor: extensiones.filter((e) => e.estado === "En Llamada").length, descripcion: "En curso", icon: Phone },
          { titulo: "Suspendidas", valor: extensiones.filter((e) => e.estado === "Suspendida").length, descripcion: "Fuera de servicio", icon: PhoneOff },
        ].map((k) => (
          <div key={k.titulo} className="relative rounded-2xl border border-[#0D2647] bg-[#061628] p-4 overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#2C4E6D] font-bold leading-tight">
                {k.titulo}
              </p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 bg-[#0A1E38] border-[#1A3A5C]">
                <k.icon size={16} className="text-[#155EEF]" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-100">{k.valor}</span>
            </div>
            <p className="mt-1.5 text-xs font-semibold text-[#7A9EC4]">{k.descripcion}</p>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#155EEF] to-transparent" />
          </div>
        ))}
      </div>

      {/* Barra de búsqueda / filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-[#061628] border border-[#0D2647] rounded-lg px-3 py-2">
          <Search size={13} className="text-[#2C4E6D]" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por sucursales..."
            className="bg-transparent text-xs text-[#EEEEEE] placeholder:text-[#2C4E6D] focus:outline-none w-full"
          />
        </div>
        <FilterDropdown
          label="Filtrar por sucursales"
          value={filtroSucursal}
          options={sucursalesUnicas}
          onChange={setFiltroSucursal}
        />
        <FilterDropdown
          label="Filtrar por estado"
          value={filtroEstado}
          options={estadosUnicos}
          onChange={setFiltroEstado}
        />
        <button
          onClick={() => setModal({ tipo: "crear" })}
          className="ml-auto flex items-center gap-2 bg-[#1667F4] text-white rounded-lg px-4 py-2.5 text-sm font-semibold"
        >
          <Plus size={14} /> NUEVA EXTENSIÓN
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-[#0D2647] bg-[#061628] overflow-hidden">
        <div className="grid grid-cols-[70px_1.4fr_1.4fr_1fr_1.2fr_1.2fr_90px] gap-3 px-5 py-3 border-b border-[#0D2647] text-[10px] uppercase tracking-[0.15em] text-[#4A6A8C] font-bold">
          <span>Ext.</span>
          <span>Nombre</span>
          <span>Usuario Asignado</span>
          <span>Estado</span>
          <span>Sucursal</span>
          <span>Departamento</span>
          <span>Acciones</span>
        </div>

        {extensionesFiltradas.map((e) => (
          <div
            key={e.id}
            className="grid grid-cols-[70px_1.4fr_1.4fr_1fr_1.2fr_1.2fr_90px] gap-3 px-5 py-4 items-center"
          >
            <span className="text-sm text-slate-100">{e.ext}</span>
            <span className="text-sm text-slate-100">{e.nombre}</span>
            <div>
              <p className="text-sm text-slate-100">{e.usuario}</p>
              <p className="text-[11px] text-[#2C4E6D]">{e.handle}</p>
            </div>
            <span
              className={`inline-flex w-fit px-2 py-1 rounded-md border text-[10px] font-bold ${badgeEstado(
                e.estado
              )}`}
            >
              {e.estado}
            </span>
            <span className="text-sm text-[#7A9EC4]">{e.sucursal}</span>
            <span className="text-sm text-[#7A9EC4]">{e.departamento}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModal({ tipo: "editar", data: e })}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0A1E38] border border-[#1A3A5C]"
              >
                <Pencil size={13} className="text-[#7A9EC4]" />
              </button>
              <button
                onClick={() => setModal({ tipo: "eliminar", data: e })}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/10 border border-rose-500/30"
              >
                <X size={13} className="text-rose-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modales */}
      {modal?.tipo === "crear" && (
        <ExtensionFormModal modo="crear" onClose={() => setModal(null)} onSubmit={handleCrear} />
      )}
      {modal?.tipo === "editar" && (
        <ExtensionFormModal
          modo="editar"
          extension={modal.data}
          onClose={() => setModal(null)}
          onSubmit={handleEditar}
        />
      )}
      {modal?.tipo === "eliminar" && (
        <DeleteModal onClose={() => setModal(null)} onConfirm={handleEliminar} />
      )}

      {toast && <Toast tipo={toast.tipo} mensaje={toast.mensaje} onClose={() => setToast(null)} />}
    </div>
  );
}
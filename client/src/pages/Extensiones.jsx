import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronDown,
  Plus,
  Pencil,
  X,
  Radio,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  Phone,
  PhoneOff,
  Trash2,
} from "lucide-react";
import { extensionesService } from "../services/extensiones.service";

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
function FormInput({ label, placeholder, value, onChange, note, type = "text" }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.18em] text-[#7A9EC4] font-bold mb-1.5">
        {label}
      </label>
      <input
        type={type}
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

// ── Modal Crear Extensión — conectado a POST /api/extensiones real ──
// Solo pide lo que el backend de verdad usa (extension/nombre/secret vía
// CloudUCM addSIPAccountAndUser) — nada de campos que no se envían a
// ningún lado (a diferencia del modal de Editar, que sigue siendo mock
// porque no existe PUT /api/extensiones/:id en el backend todavía).
function CrearExtensionModal({ onClose, onSubmit, enviando }) {
  const [form, setForm] = useState({ extension: "", nombre: "", secret: "" });
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  return (
    <ModalBase titulo="Crear Extensión" icon={Radio} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="px-6 py-5 space-y-4">
          <FormInput label="Extensión *" placeholder="Ej: 1010" value={form.extension} onChange={set("extension")} note="2-18 dígitos. Obligatorio." />
          <FormInput label="Nombre" placeholder="Ej: Ventas 03" value={form.nombre} onChange={set("nombre")} />
          <FormInput
            label="Contraseña SIP *"
            placeholder="Elige una contraseña"
            value={form.secret}
            onChange={set("secret")}
            type="password"
            note="Obligatoria: CloudUCM nunca devuelve esta contraseña en su respuesta, ni la que se envía ni una generada automáticamente — si se deja en blanco, la extensión queda creada pero nadie puede conocer su contraseña después."
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#0D2647]">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#061628] border border-[#2D547E] text-[#2D547E]">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || !form.extension.trim() || !form.secret.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#1667F4] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            {enviando ? "Creando..." : "Crear Extensión"}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}

// ── Modal Editar Extensión — SIGUE SIENDO MOCK a propósito ─────────
// No existe PUT /api/extensiones/:id en el backend todavía — conectar esto
// es trabajo aparte, no pedido en esta sección.
function EditarExtensionModal({ extension, onClose, onSubmit }) {
  const [form, setForm] = useState({
    nombre: extension?.nombre || "",
  });
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  return (
    <ModalBase titulo="Editar Extensión" icon={Pencil} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        <FormInput label="Extensión" value={extension?.extension || ""} onChange={() => {}} note="El número de extensión no se puede cambiar aquí." />
        <FormInput label="Nombre" placeholder="Ej: Recepción Principal" value={form.nombre} onChange={set("nombre")} />
        <p className="text-[10px] text-[#2D547E] leading-snug">
          Editar todavía no está conectado al backend real (no existe endpoint para
          actualizar una extensión) — este cambio no se guarda.
        </p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#0D2647]">
        <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#061628] border border-[#2D547E] text-[#2D547E]">
          Cancelar
        </button>
        <button
          onClick={() => onSubmit(form)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#1667F4] text-white"
        >
          Guardar Cambios
        </button>
      </div>
    </ModalBase>
  );
}

// ── Modal Eliminar Extensión — conectado a DELETE /api/extensiones/:id real ──
// Borrado lógico solo en BD de MERCI — no toca la cuenta SIP en CloudUCM
// (ver nota en extensiones.service.js#eliminarExtension del backend).
function DeleteModal({ onClose, onConfirm, eliminando }) {
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
          Esta acción no se puede deshacer. La extensión quedará eliminada de MERCI —
          la cuenta SIP en la central telefónica no se toca desde aquí.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#0D2647]">
        <button
          onClick={onClose}
          disabled={eliminando}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#061628] border border-[#2D547E] text-[#2D547E] disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={eliminando}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#642323" }}
        >
          <Trash2 size={14} className="text-white" />
          {eliminando ? "Eliminando..." : "Eliminar Extensión"}
        </button>
      </div>
    </ModalBase>
  );
}

// ── Modal de error puntual (validación / sistema) ───────────────────
// No bloquea el resto de la vista — se cierra y ya, la lista y el botón de
// crear siguen funcionando normal.
function ErrorModal({ categoria, mensaje, onClose }) {
  const esValidacion = categoria === "validacion";
  return (
    <ModalBase
      titulo={esValidacion ? "Revisa los datos" : "Error de la central telefónica"}
      icon={AlertTriangle}
      onClose={onClose}
      iconBoxBg="rgba(100, 35, 35, 0.2)"
      iconBoxBorder="#642323"
      iconColor="#F59E0B"
    >
      <div className="px-6 py-5">
        <p className="text-sm text-[#DCE9FF] leading-relaxed">{mensaje}</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#0D2647]">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#1667F4] text-white"
        >
          Entendido
        </button>
      </div>
    </ModalBase>
  );
}

// ── Toast ──────────────────────────────────────────────────────────
function Toast({ tipo, mensaje }) {
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
  const [extensiones, setExtensiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [creando, setCreando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [modal, setModal] = useState(null); // { tipo: 'crear' | 'editar' | 'eliminar', data? }
  const [toast, setToast] = useState(null);

  // Error de categoría 'conexion' al crear — persiste como bandera fija
  // arriba de la tabla y deshabilita el botón de crear hasta que se
  // reintente con éxito. Error de 'validacion'/'sistema' — modal puntual,
  // no bloquea nada más (ver errorPuntual abajo).
  const [errorConexion, setErrorConexion] = useState("");
  const [errorPuntual, setErrorPuntual] = useState(null); // { categoria, mensaje }

  const [busqueda, setBusqueda] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(null);

  const cargarExtensiones = useCallback(async () => {
    setCargando(true);
    setErrorCarga("");
    try {
      const res = await extensionesService.listar();
      setExtensiones(res.data?.extensiones ?? []);
    } catch (err) {
      setErrorCarga(err.message || "No se pudieron cargar las extensiones desde el servidor.");
      setExtensiones([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarExtensiones(); }, [cargarExtensiones]);

  const sucursalesUnicas = [...new Set(extensiones.map((e) => e.sucursales?.nombre).filter(Boolean))];
  const estadosUnicos = [...new Set(extensiones.map((e) => e.catalogo_estado_extension?.nombre).filter(Boolean))];

  const extensionesFiltradas = extensiones.filter((e) => {
    const coincideBusqueda =
      !busqueda || (e.sucursales?.nombre || "").toLowerCase().includes(busqueda.toLowerCase());
    const coincideSucursal = !filtroSucursal || e.sucursales?.nombre === filtroSucursal;
    const coincideEstado = !filtroEstado || e.catalogo_estado_extension?.nombre === filtroEstado;
    return coincideBusqueda && coincideSucursal && coincideEstado;
  });

  const mostrarToast = (tipo, mensaje) => {
    setToast({ tipo, mensaje });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCrear = async (form) => {
    setCreando(true);
    try {
      await extensionesService.crear({
        extension: form.extension.trim(),
        nombre: form.nombre.trim() || undefined,
        secret: form.secret.trim() || undefined,
      });
      setModal(null);
      setErrorConexion(""); // si había una bandera de conexión previa, ya se resolvió
      mostrarToast("success", "Extensión creada correctamente");
      cargarExtensiones();
    } catch (err) {
      const categoria = err.data?.categoria;
      const mensaje = err.message || "No se pudo crear la extensión.";

      if (categoria === "conexion") {
        // Bandera fija + botón deshabilitado — no se cierra el modal solo,
        // el usuario ve el problema real antes de reintentar.
        setErrorConexion(mensaje);
        mostrarToast("error", mensaje);
      } else {
        // 'validacion' | 'sistema' | sin categoría (validación local, ej.
        // extensión vacía) — modal puntual, no bloquea el resto de la vista.
        setErrorPuntual({ categoria: categoria || "validacion", mensaje });
      }
    } finally {
      setCreando(false);
    }
  };

  const handleEditar = (form) => {
    setExtensiones((prev) =>
      prev.map((e) => (e.id === modal.data.id ? { ...e, nombre: form.nombre } : e))
    );
    setModal(null);
    mostrarToast("success", "Extensión actualizada (solo en esta vista, no se guardó)");
  };

  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await extensionesService.eliminar(modal.data.id);
      setModal(null);
      mostrarToast("success", "Extensión eliminada correctamente");
      cargarExtensiones();
    } catch (err) {
      mostrarToast("error", err.message || "No se pudo eliminar la extensión.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="p-6 space-y-5 font-['JetBrains_Mono']">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { titulo: "Totales", valor: extensiones.length, descripcion: "Registradas", icon: Radio },
          { titulo: "Activas", valor: extensiones.filter((e) => e.catalogo_estado_extension?.nombre === "Activa").length, descripcion: "Disponibles ahora", icon: UserCheck },
          { titulo: "En Llamada", valor: extensiones.filter((e) => e.catalogo_estado_extension?.nombre === "En Llamada").length, descripcion: "En curso", icon: Phone },
          { titulo: "Suspendidas", valor: extensiones.filter((e) => e.catalogo_estado_extension?.nombre === "Suspendida").length, descripcion: "Fuera de servicio", icon: PhoneOff },
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
              <span className="text-2xl font-bold text-slate-100">{cargando ? "—" : k.valor}</span>
            </div>
            <p className="mt-1.5 text-xs font-semibold text-[#7A9EC4]">{k.descripcion}</p>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#155EEF] to-transparent" />
          </div>
        ))}
      </div>

      {/* Bandera fija de error de conexión — solo desaparece al reintentar con éxito */}
      {errorConexion && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-[#E11D48]/30 bg-[#3B0711]/60 text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{errorConexion}</p>
        </div>
      )}

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
          disabled={!!errorConexion}
          title={errorConexion || undefined}
          className="ml-auto flex items-center gap-2 bg-[#1667F4] text-white rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> NUEVA EXTENSIÓN
        </button>
      </div>

      {errorCarga && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-[#E11D48]/30 bg-[#3B0711]/60 text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{errorCarga}</p>
          <button
            onClick={cargarExtensiones}
            className="ml-auto text-xs font-bold uppercase tracking-wider text-[#FDA4AF] hover:text-white underline underline-offset-2 shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-2xl border border-[#0D2647] bg-[#061628] overflow-hidden">
        <div className="grid grid-cols-[70px_1.4fr_1fr_1.2fr_1.2fr_1fr_90px] gap-3 px-5 py-3 border-b border-[#0D2647] text-[10px] uppercase tracking-[0.15em] text-[#4A6A8C] font-bold">
          <span>Ext.</span>
          <span>Nombre</span>
          <span>Estado</span>
          <span>Sucursal</span>
          <span>Departamento</span>
          <span>MAC</span>
          <span>Acciones</span>
        </div>

        {cargando && (
          <div className="px-5 py-10 text-center text-sm text-[#2C4E6D]">Cargando extensiones...</div>
        )}

        {!cargando && extensionesFiltradas.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-[#2C4E6D]">
            No hay extensiones que coincidan con los filtros seleccionados.
          </div>
        )}

        {!cargando && extensionesFiltradas.map((e) => (
          <div
            key={e.id}
            className="grid grid-cols-[70px_1.4fr_1fr_1.2fr_1.2fr_1fr_90px] gap-3 px-5 py-4 items-center"
          >
            <span className="text-sm text-slate-100">{e.extension}</span>
            <span className="text-sm text-slate-100">{e.nombre || "—"}</span>
            <span
              className={`inline-flex w-fit px-2 py-1 rounded-md border text-[10px] font-bold ${badgeEstado(
                e.catalogo_estado_extension?.nombre
              )}`}
            >
              {e.catalogo_estado_extension?.nombre || "Sin estado"}
            </span>
            <span className="text-sm text-[#7A9EC4]">{e.sucursales?.nombre || "— Sin asignar —"}</span>
            <span className="text-sm text-[#7A9EC4]">{e.departamentos?.nombre || "— Sin asignar —"}</span>
            <span className="text-xs text-[#4A6A8C] font-mono">{e.pbx_mac_address || "—"}</span>
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
        <CrearExtensionModal onClose={() => setModal(null)} onSubmit={handleCrear} enviando={creando} />
      )}
      {modal?.tipo === "editar" && (
        <EditarExtensionModal extension={modal.data} onClose={() => setModal(null)} onSubmit={handleEditar} />
      )}
      {modal?.tipo === "eliminar" && (
        <DeleteModal onClose={() => setModal(null)} onConfirm={handleEliminar} eliminando={eliminando} />
      )}
      {errorPuntual && (
        <ErrorModal
          categoria={errorPuntual.categoria}
          mensaje={errorPuntual.mensaje}
          onClose={() => setErrorPuntual(null)}
        />
      )}

      {toast && <Toast tipo={toast.tipo} mensaje={toast.mensaje} onClose={() => setToast(null)} />}
    </div>
  );
}

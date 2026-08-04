// src/pages/Departamentos.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  Building2, Plus, Search, X, ChevronRight,
  AlertCircle, Check, Calendar, FileText,
} from 'lucide-react'
import { departamentosService } from '../services/usuarios.service'
import { useAuth } from '../hooks/useAuth'

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

// ─── Componente principal ─────────────────────────────────────────────────────

function Departamentos() {
  const { usuario: authUsuario } = useAuth()

  const [departamentos,     setDepartamentos]     = useState([])
  const [cargando,          setCargando]          = useState(true)
  const [busqueda,          setBusqueda]          = useState('')
  const [error,             setError]             = useState('')
  const [depDetalle,        setDepDetalle]        = useState(null)
  const [drawerAbierto,     setDrawerAbierto]     = useState(false)
  const [modoDrawer,        setModoDrawer]        = useState('ver')
  const [modalCrear,        setModalCrear]        = useState(false)

  // ─── Carga ────────────────────────────────────────────────────────────────────

  const cargarDepartamentos = useCallback(async () => {
    try {
      setCargando(true)
      const res = await departamentosService.listar()
      setDepartamentos(res.data.departamentos || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarDepartamentos() }, [cargarDepartamentos])

  // ─── Acciones ─────────────────────────────────────────────────────────────────

  const abrirDetalle = async (dep) => {
    try {
      const res = await departamentosService.obtener(dep.id)
      setDepDetalle(res.data.departamento)
      setModoDrawer('ver')
      setDrawerAbierto(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const cerrarDrawer = () => {
    setDrawerAbierto(false)
    setDepDetalle(null)
    setModoDrawer('ver')
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este departamento? Esta acción no se puede deshacer.')) return
    try {
      await departamentosService.eliminar(id)
      cerrarDrawer()
      cargarDepartamentos()
    } catch (err) {
      setError(err.message)
    }
  }

  // Filtro en cliente (lista corta)
  const depFiltrados = busqueda.trim()
    ? departamentos.filter((d) =>
        d.nombre?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : departamentos

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-100">Departamentos</h1>
          <p className="mt-1 text-sm text-cyan-300/60">
            {authUsuario?.sucursalNombre
              ? `Departamentos de ${authUsuario.sucursalNombre}.`
              : 'Departamentos de tu sucursal.'}
          </p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:bg-cyan-300 transition"
        >
          <Plus size={18} />
          Nuevo departamento
        </button>
      </div>

      {/* Error global */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-2xl border border-cyan-400/10 bg-[#071426]/95 shadow-[0_0_35px_rgba(34,211,238,0.07)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 border-b border-cyan-400/10">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-200">
              Lista de departamentos
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {departamentos.length} departamento{departamentos.length !== 1 ? 's' : ''} registrado{departamentos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="relative w-full lg:w-72">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300/60" />
            <input
              type="text"
              placeholder="Buscar departamento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-2xl border border-cyan-400/10 bg-[#0b1b31] outline-none text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/60"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            </div>
          ) : depFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Building2 size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No hay departamentos registrados</p>
              <p className="text-xs mt-1 text-slate-600">Crea el primero con el botón de arriba</p>
            </div>
          ) : (
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-cyan-400/10 text-left">
                  <th className="px-5 py-4 text-xs uppercase tracking-[0.18em] text-slate-500">Departamento</th>
                  <th className="px-5 py-4 text-xs uppercase tracking-[0.18em] text-slate-500">Fecha de registro</th>
                  <th className="px-5 py-4 text-xs uppercase tracking-[0.18em] text-slate-500 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {depFiltrados.map((dep) => (
                  <tr
                    key={dep.id}
                    className="border-b border-cyan-400/5 hover:bg-cyan-400/[0.03] transition cursor-pointer"
                    onClick={() => abrirDetalle(dep)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-700 flex items-center justify-center shrink-0">
                          <Building2 size={16} className="text-white" />
                        </div>
                        <p className="font-semibold text-slate-100 text-sm">{dep.nombre}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatFecha(dep.fecha_registro || dep.fechaRegistro)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <ChevronRight size={18} className="text-slate-500" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerAbierto && depDetalle && (
        <DrawerDepartamento
          departamento={depDetalle}
          modo={modoDrawer}
          onModoChange={setModoDrawer}
          onCerrar={cerrarDrawer}
          onEliminar={eliminar}
          onActualizado={() => { cargarDepartamentos(); cerrarDrawer() }}
        />
      )}

      {/* Modal crear */}
      {modalCrear && (
        <ModalCrearDepartamento
          onCerrar={() => setModalCrear(false)}
          onCreado={() => { cargarDepartamentos(); setModalCrear(false) }}
        />
      )}
    </div>
  )
}

// ─── DrawerDepartamento ───────────────────────────────────────────────────────

function DrawerDepartamento({ departamento, modo, onModoChange, onCerrar, onEliminar, onActualizado }) {
  const [nombre,    setNombre]    = useState(departamento.nombre || '')
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')
  const [exito,     setExito]     = useState('')

  const guardarEdicion = async () => {
    setError('')
    if (!nombre.trim()) {
      setError('El nombre del departamento es requerido.')
      return
    }
    setGuardando(true)
    try {
      await departamentosService.editar(departamento.id, { nombre: nombre.trim() })
      onActualizado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onCerrar} />

      <div className="fixed inset-y-0 right-0 z-50 w-full lg:w-[520px] flex flex-col bg-[#071426] border-l border-cyan-400/20 shadow-[0_0_60px_rgba(34,211,238,0.15)]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cyan-400/10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-700 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.30)]">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{departamento.nombre}</h2>
              <p className="text-sm text-cyan-300/60">Departamento</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="w-10 h-10 rounded-xl border border-cyan-400/10 text-slate-400 hover:text-cyan-300 hover:bg-cyan-400/10 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-cyan-400/10 shrink-0">
          {[
            { key: 'ver',    label: 'Detalle' },
            { key: 'editar', label: 'Editar'  },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { onModoChange(tab.key); setError(''); setExito('') }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                modo === tab.key
                  ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-cyan-400/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {exito && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              <Check size={16} />
              {exito}
            </div>
          )}

          {/* Detalle */}
          {modo === 'ver' && (
            <div className="grid grid-cols-1 gap-4">
              <InfoItem
                icon={<Building2 size={15} />}
                label="Nombre"
                value={departamento.nombre}
              />
              {departamento.sucursales && (
                <InfoItem
                  icon={<FileText size={15} />}
                  label="Sucursal"
                  value={
                    <span className="text-blue-300">{departamento.sucursales.nombre}</span>
                  }
                />
              )}
              <InfoItem
                icon={<Calendar size={15} />}
                label="Fecha de registro"
                value={formatFecha(departamento.fecha_registro || departamento.fechaRegistro)}
              />
            </div>
          )}

          {/* Editar */}
          {modo === 'editar' && (
            <div className="max-w-sm">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Nombre *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-2xl border border-cyan-400/10 bg-[#0b1b31] outline-none text-sm text-slate-100 focus:border-cyan-400/60"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cyan-400/10 flex items-center justify-between shrink-0">
          <button
            onClick={() => onEliminar(departamento.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-400/20 text-rose-300 hover:bg-rose-400/10 text-sm font-semibold transition"
          >
            <TrashIcon />
            Eliminar
          </button>

          <div className="flex gap-3">
            <button
              onClick={onCerrar}
              className="px-4 py-2.5 rounded-2xl border border-cyan-400/10 text-slate-300 hover:bg-cyan-400/10 text-sm transition"
            >
              Cancelar
            </button>
            {modo === 'editar' && (
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                className="px-4 py-2.5 rounded-2xl bg-cyan-400 text-slate-950 text-sm font-bold hover:bg-cyan-300 transition disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── ModalCrearDepartamento ───────────────────────────────────────────────────

function ModalCrearDepartamento({ onCerrar, onCreado }) {
  const [nombre,    setNombre]    = useState('')
  const [error,     setError]     = useState('')
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) {
      setError('El nombre del departamento es requerido.')
      return
    }
    setGuardando(true)
    try {
      await departamentosService.crear({ nombre: nombre.trim() })
      onCreado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl border border-cyan-400/20 bg-[#071426] shadow-[0_0_50px_rgba(34,211,238,0.18)] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-cyan-400/10">
          <h2 className="text-lg font-bold text-slate-100">Nuevo departamento</h2>
          <button
            onClick={onCerrar}
            className="w-9 h-9 rounded-xl border border-cyan-400/10 text-slate-400 hover:text-cyan-300 hover:bg-cyan-400/10 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Nombre *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Recepción, Cocina, Ventas..."
              autoFocus
              className="mt-2 w-full h-11 px-4 rounded-2xl border border-cyan-400/10 bg-[#0b1b31] outline-none text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/60"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2.5 rounded-2xl border border-cyan-400/10 text-slate-300 hover:bg-cyan-400/10 text-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2.5 rounded-2xl bg-cyan-400 text-slate-950 text-sm font-bold hover:bg-cyan-300 transition disabled:opacity-60"
            >
              {guardando ? 'Creando...' : 'Crear departamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── InfoItem ─────────────────────────────────────────────────────────────────

function InfoItem({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-400/10 bg-[#0b1b31]/80 p-4">
      <div className="flex items-center gap-2 text-cyan-300/60 mb-2">
        {icon}
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      </div>
      <div className="text-sm font-semibold text-slate-100">{value}</div>
    </div>
  )
}

export default Departamentos

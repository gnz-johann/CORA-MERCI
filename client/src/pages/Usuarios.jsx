// src/pages/Usuarios.jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, Phone, Plus, Search, X,
  ShieldCheck, Mail, User, AlertCircle, Lock,
  Eye, LayoutDashboard, Pencil, Save, UserCog, UserX,
} from 'lucide-react'
import { usuariosService, rolesService, sucursalesService, departamentosService } from '../services/usuarios.service'
import StatCard            from '../components/StatCard'
import UserAvatar          from '../components/UserAvatar'
import FormModal           from '../components/FormModal'
import FormField           from '../components/FormField'
import ConfirmModal        from '../components/ConfirmModal'
import PanelDetalleUsuario from '../components/PanelDetalleUsuario'
import { useAuth } from '../hooks/useAuth'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function badgeEstado(estado) {
  const estilos = {
    Activo:     'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    Inactivo:   'bg-slate-400/10 text-slate-400 border-slate-400/20',
    Suspendido: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    Bloqueado:  'bg-rose-400/10 text-rose-300 border-rose-400/20',
  }
  return estilos[estado] || 'bg-slate-400/10 text-slate-400 border-slate-400/20'
}

function formatFecha(fecha) {
  if (!fecha) return 'Nunca'
  return new Date(fecha).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Componente principal ─────────────────────────────────────────────────────

function Usuarios() {
  const navigate = useNavigate()
  const { usuario: authUsuario } = useAuth()

  // ── Stats ──────────────────────────────────────────────────────────────────
  const [stats,         setStats]         = useState({ totalUsuarios: 0, nuevosEsteMes: 0, sesionesActivas: 0, totalRoles: 0 })
  const [cargandoStats, setCargandoStats] = useState(true)

  // ── Lista ──────────────────────────────────────────────────────────────────
  const [usuarios,      setUsuarios]      = useState([])
  const [roles,         setRoles]         = useState([])
  const [sucursales,    setSucursales]    = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [estados,       setEstados]       = useState([])
  const [cargando,      setCargando]      = useState(true)
  const [busqueda,      setBusqueda]      = useState('')
  const [rolFiltro,     setRolFiltro]     = useState('')
  const [error,         setError]         = useState('')

  // ── Panel de detalle ───────────────────────────────────────────────────────
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [usuarioPanel, setUsuarioPanel] = useState(null)

  // ── Modal editar ───────────────────────────────────────────────────────────
  const [modalEditar,    setModalEditar]    = useState(false)
  const [usuarioAEditar, setUsuarioAEditar] = useState(null)

  // ── Modal crear ────────────────────────────────────────────────────────────
  const [modalCrear, setModalCrear] = useState(false)

  // ── Confirmación eliminar ──────────────────────────────────────────────────
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [usuarioAEliminar,  setUsuarioAEliminar]  = useState(null)
  const [cargandoEliminar,  setCargandoEliminar]  = useState(false)

  // ── Carga de datos ─────────────────────────────────────────────────────────

  const cargarStats = useCallback(async () => {
    try { setCargandoStats(true); const res = await usuariosService.stats(); setStats(res.data) }
    catch { } finally { setCargandoStats(false) }
  }, [])

  const cargarUsuarios = useCallback(async () => {
    try { setCargando(true); const res = await usuariosService.listar(busqueda); setUsuarios(res.data.usuarios || []) }
    catch (err) { setError(err.message) } finally { setCargando(false) }
  }, [busqueda])

  const cargarRoles = useCallback(async () => {
    try { const res = await rolesService.listar(); setRoles(res.data.roles || []) } catch { }
  }, [])

  const cargarSucursales = useCallback(async () => {
    if (authUsuario?.sucursalId) return
    try { const res = await sucursalesService.listar(); setSucursales(res.data.sucursales || []) } catch { }
  }, [authUsuario?.sucursalId])

  const cargarDepartamentos = useCallback(async () => {
    if (!authUsuario?.sucursalId) return
    try { const res = await departamentosService.listar(); setDepartamentos(res.data.departamentos || []) } catch { }
  }, [authUsuario?.sucursalId])

  const cargarEstados = useCallback(async () => {
    try { const res = await usuariosService.estados(); setEstados(res.data.estados || []) } catch { }
  }, [])

  useEffect(() => { cargarStats()         }, [cargarStats])
  useEffect(() => { cargarUsuarios()      }, [cargarUsuarios])
  useEffect(() => { cargarRoles()         }, [cargarRoles])
  useEffect(() => { cargarSucursales()    }, [cargarSucursales])
  useEffect(() => { cargarDepartamentos() }, [cargarDepartamentos])
  useEffect(() => { cargarEstados()       }, [cargarEstados])

  // ── Filtro client-side por rol ─────────────────────────────────────────────
  const usuariosFiltrados = useMemo(() =>
    rolFiltro
      ? usuarios.filter((u) => u.roles?.some((r) => r.rolId === rolFiltro))
      : usuarios,
    [usuarios, rolFiltro]
  )

  // ── Acciones ───────────────────────────────────────────────────────────────

  const abrirPanel = async (usuario) => {
    try {
      const res = await usuariosService.obtener(usuario.usuarioId)
      setUsuarioPanel(res.data.usuario)
      setPanelAbierto(true)
    } catch (err) { setError(err.message) }
  }

  const cerrarPanel = () => {
    setPanelAbierto(false)
    setUsuarioPanel(null)
  }

  const editarDesdePanel = () => {
    cerrarPanel()
    setUsuarioAEditar(usuarioPanel)
    setModalEditar(true)
  }

  const abrirEditar = async (usuario) => {
    try {
      const res = await usuariosService.obtener(usuario.usuarioId)
      setUsuarioAEditar(res.data.usuario)
      setModalEditar(true)
    } catch (err) { setError(err.message) }
  }

  const abrirConfirmarEliminar = (usuario) => {
    setUsuarioAEliminar(usuario)
    setConfirmarEliminar(true)
  }

  const ejecutarEliminar = async () => {
    if (!usuarioAEliminar) return
    setCargandoEliminar(true)
    try {
      await usuariosService.eliminar(usuarioAEliminar.usuarioId)
      cerrarPanel()
      cargarUsuarios()
      cargarStats()
      setConfirmarEliminar(false)
      setUsuarioAEliminar(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoEliminar(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          titulo="Total Usuarios"
          valor={stats.totalUsuarios}
          descripcion={cargandoStats ? 'Calculando...' : `+${stats.nuevosEsteMes} este mes`}
          icon={Users}
          descColor="text-[#7A9EC4]"
          cargando={cargandoStats}
        />
        <StatCard
          titulo="Activos Ahora"
          valor={stats.sesionesActivas}
          descripcion="Sesión abierta"
          icon={UserCheck}
          descColor="text-[#7A9EC4]"
          cargando={cargandoStats}
        />
        <StatCard
          titulo="Roles"
          valor={stats.totalRoles}
          descripcion="Roles totales"
          icon={ShieldCheck}
          descColor="text-[#7A9EC4]"
          cargando={cargandoStats}
        />
        {/* TODO: Bina 3 — conectar extensiones cuando el módulo esté disponible */}
        <StatCard
          titulo="Extensiones"
          valor={null}
          descripcion="Extensiones asignadas"
          icon={Phone}
          descColor="text-[#7A9EC4]"
          cargando={false}
        />
      </div>

      {/* ── Controles ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex gap-3 flex-1 min-w-0">

          {/* Búsqueda */}
          <div className="relative flex-1 max-w-xs">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C4E6D] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-2xl border border-[#0D2647] bg-[#061628] outline-none text-sm text-slate-200 placeholder:text-[#2C4E6D] focus:border-[#155EEF]"
            />
          </div>

          {/*
            Filtro por rol:
            - "Filtrar por rol" es una opción disabled + hidden → no aparece en el dropdown
            - "Ninguno" es la primera opción visible → al seleccionarla resetea el filtro
            - El color del select cambia entre placeholder (#2C4E6D) y valor seleccionado (blanco)
          */}
          <select
            value={rolFiltro}
            onChange={(e) => {
              const val = e.target.value
              // '__NINGUNO__' es un sentinel — al seleccionarlo reseteamos el filtro
              setRolFiltro(val === '__NINGUNO__' ? '' : val)
            }}
            className={`h-11 px-4 rounded-2xl border border-[#0D2647] bg-[#061628] outline-none text-sm focus:border-[#155EEF] shrink-0 ${
              rolFiltro === '' ? 'text-[#2C4E6D]' : 'text-slate-200'
            }`}
          >
            {/* Placeholder — visible cuando no hay selección, oculto en el dropdown */}
            <option value="" disabled hidden>Filtrar por rol</option>
            {/* Primera opción real — resetea el filtro */}
            <option value="__NINGUNO__" style={{ backgroundColor: '#061628', color: '#7A9EC4' }}>
              Ninguno
            </option>
            {roles.map((r) => (
              <option key={r.rolId} value={r.rolId} style={{ backgroundColor: '#061628', color: '#DAEBFF' }}>
                {r.nombre}
              </option>
            ))}
          </select>

        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => navigate('/roles')}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl border border-[#0D2647] bg-[#061628] text-[#7A9EC4] hover:border-[#155EEF] text-sm font-semibold transition"
          >
            <LayoutDashboard size={16} />Gestionar roles
          </button>
          <button
            onClick={() => setModalCrear(true)}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-[#1667F4] text-white text-sm font-bold hover:bg-[#155EEF] transition"
          >
            <Plus size={18} />Nuevo usuario
          </button>
        </div>
      </div>

      {/* Error global */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          <AlertCircle size={16} />{error}
          <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      {/* ── Tabla ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#0D2647] bg-[#061628]">
        <div className="px-5 py-4 border-b border-[#0D2647]">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-200">Lista de usuarios</h3>
          <p className="text-xs text-[#2C4E6D] mt-1">
            {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''}
            {(rolFiltro || busqueda) ? ' encontrado' + (usuariosFiltrados.length !== 1 ? 's' : '') : ' registrado' + (usuariosFiltrados.length !== 1 ? 's' : '')}
          </p>
        </div>

        <div className="overflow-x-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-[#155EEF] border-t-transparent animate-spin" />
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#2C4E6D]">
              <Users size={40} className="mb-3 opacity-30" />
              <p className="text-sm">{busqueda || rolFiltro ? 'No hay usuarios que coincidan con los filtros' : 'No hay usuarios registrados'}</p>
            </div>
          ) : (
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-[#0D2647] text-left">
                  <th className="px-5 py-4 text-xs uppercase tracking-[0.18em] text-[#2C4E6D]">Usuario</th>
                  <th className="px-5 py-4 text-xs uppercase tracking-[0.18em] text-[#2C4E6D]">Correo</th>
                  <th className="px-5 py-4 text-xs uppercase tracking-[0.18em] text-[#2C4E6D]">Rol</th>
                  <th className="px-5 py-4 text-xs uppercase tracking-[0.18em] text-[#2C4E6D]">Estado</th>
                  <th className="px-5 py-4 text-xs uppercase tracking-[0.18em] text-[#2C4E6D]">Extension</th>
                  <th className="px-5 py-4 text-xs uppercase tracking-[0.18em] text-[#2C4E6D]">Último acceso</th>
                  <th className="px-5 py-4 text-xs uppercase tracking-[0.18em] text-[#2C4E6D] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.usuarioId} className="border-b border-[#0D2647]/50 hover:bg-[#0A1E38]/40 transition">

                    {/* USUARIO — avatar con color determinista */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          usuarioId={u.usuarioId}
                          nombre={u.nombre}
                          size="md"
                          bloqueado={u.bloqueado}
                        />
                        <div>
                          <p className="font-semibold text-slate-100 text-sm">{u.nombre}</p>
                          <p className="text-xs text-[#2C4E6D]">@{u.usuario}</p>
                        </div>
                      </div>
                    </td>

                    {/* CORREO */}
                    <td className="px-5 py-4 text-xs text-[#7A9EC4] font-bold">{u.correo}</td>

                    {/* ROLES */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.length > 0
                          ? u.roles.map((r) => (
                              <span key={r.rolId} className="px-2 py-1 rounded-2xl bg-[#061628] text-[#7A9EC4] border border-[#7A9EC4] text-xs font-semibold">
                                {r.nombre}
                              </span>
                            ))
                          : <span className="text-xs text-[#2C4E6D]">Sin rol</span>}
                      </div>
                    </td>

                    {/* ESTADO */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${badgeEstado(u.estado)}`}>
                          {u.estado || 'Desconocido'}
                        </span>
                        {u.bloqueado && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-400/10 border border-rose-400/20 text-rose-300 text-xs font-bold">
                            <Lock size={10} />Bloqueado
                          </span>
                        )}
                      </div>
                    </td>

                    {/* EXTENSIÓN — TODO: Bina 3 */}
                    <td className="px-5 py-4 text-xs text-[#7A9EC4] font-bold">—</td>

                    {/* ÚLTIMO ACCESO */}
                    <td className="px-5 py-4 text-xs text-[#7A9EC4] font-bold">{formatFecha(u.ultimoAcceso)}</td>

                    {/* ACCIONES */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => abrirPanel(u)}
                          title="Ver detalle"
                          className="w-8 h-8 rounded-lg flex items-center border border-[#1A3A5C] justify-center text-[#2C4E6D] hover:text-[#155EEF] hover:border-[#155EEF] transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => abrirEditar(u)}
                          title="Editar usuario"
                          className="w-8 h-8 rounded-lg flex items-center border border-[#1A3A5C] justify-center text-[#2C4E6D] hover:text-[#155EEF] hover:border-[#155EEF] transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => abrirConfirmarEliminar(u)}
                          title="Eliminar usuario"
                          className="w-8 h-8 rounded-lg flex items-center border border-[#1A3A5C] justify-center text-[#D04444] hover:text-rose-300 hover:border-rose-400/60 transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Panel + Modales ───────────────────────────────────────────────────── */}

      {/*
        Panel de detalle:
        - El backdrop invisible (z-[39]) captura clicks fuera del panel
        - El panel (z-40) queda encima — clicks dentro no cierran el panel
        - Sin blur ni dimming — el fondo permanece visualmente intacto
      */}
      {panelAbierto && usuarioPanel && (
        <>
          <div
            className="fixed inset-0 z-[39]"
            onClick={cerrarPanel}
            aria-hidden="true"
          />
          <PanelDetalleUsuario
            usuario={usuarioPanel}
            onCerrar={cerrarPanel}
            onEditar={editarDesdePanel}
          />
        </>
      )}

      {modalCrear && (
        <ModalCrearUsuario
          roles={roles}
          sucursales={sucursales}
          departamentos={departamentos}
          onCerrar={() => setModalCrear(false)}
          onCreado={() => { cargarUsuarios(); cargarStats(); setModalCrear(false) }}
        />
      )}

      {modalEditar && usuarioAEditar && (
        <ModalEditarUsuario
          usuario={usuarioAEditar}
          roles={roles}
          sucursales={sucursales}
          departamentos={departamentos}
          estados={estados}
          onCerrar={() => { setModalEditar(false); setUsuarioAEditar(null) }}
          onActualizado={() => {
            cargarUsuarios(); cargarStats()
            setModalEditar(false); setUsuarioAEditar(null)
          }}
        />
      )}

      {confirmarEliminar && usuarioAEliminar && (
        <ConfirmModal
          icon={UserX}
          titulo="Eliminar Usuario"
          pregunta={`¿Estás seguro de que deseas eliminar a ${usuarioAEliminar.nombre}?`}
          advertencias={[
            'Esta acción no se puede deshacer.',
            'El usuario quedará inactivo.',
            'Todas sus sesiones activas serán cerradas.',
          ]}
          labelConfirmar="ELIMINAR USUARIO"
          onCerrar={() => { setConfirmarEliminar(false); setUsuarioAEliminar(null) }}
          onConfirmar={ejecutarEliminar}
          cargando={cargandoEliminar}
        />
      )}
    </div>
  )
}

// ─── ModalCrearUsuario ────────────────────────────────────────────────────────

function ModalCrearUsuario({ roles, sucursales, departamentos, onCerrar, onCreado }) {
  const { usuario: authUsuario } = useAuth()
  const esAdminSucursal = !!authUsuario?.sucursalId

  const [form, setForm] = useState({
    nombre: '', usuario: '', correo: '', password: '', confirmarPassword: '',
    extension: '', rolId: '', sucursalId: '', departamentoId: '',
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }))

  const handleCrear = async () => {
    setError('')
    if (!form.nombre || !form.usuario || !form.correo || !form.password) { setError('Nombre, usuario, correo y contraseña son obligatorios.'); return }
    if (form.password !== form.confirmarPassword) { setError('Las contraseñas no coinciden.'); return }
    setGuardando(true)
    try {
      await usuariosService.crear({
        nombre: form.nombre.trim(), usuario: form.usuario.trim(), correo: form.correo.trim(),
        password: form.password, sucursalId: esAdminSucursal ? null : (form.sucursalId || null),
      })
      onCreado()
    } catch (err) { setError(err.message) } finally { setGuardando(false) }
  }

  return (
    <FormModal icon={User} titulo="Nuevo Usuario" onCerrar={onCerrar} onConfirmar={handleCrear} labelConfirmar="CREAR USUARIO" cargando={guardando}>
      {error && <div className="mb-5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30"><p className="font-jetbrains font-bold text-[11px] text-[#EF4444]">{error}</p></div>}
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <FormField label="NOMBRE COMPLETO" placeholder="Ejemplo: Olivia Rivera" value={form.nombre} onChange={set('nombre')} autoComplete="name" />
          <FormField label="USUARIO" placeholder="Ejemplo: olivia.rivera" value={form.usuario} onChange={set('usuario')} autoComplete="username" />
        </div>
        <FormField label="CORREO ELECTRÓNICO" type="email" placeholder="Ejemplo: oliviarv-empresa@gmail.com" value={form.correo} onChange={set('correo')} hint="Correo destinado a comunicaciones internas." hintIcon={Mail} autoComplete="email" />
        <div className="grid grid-cols-2 gap-5">
          <FormField label="CONTRASEÑA" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} autoComplete="new-password" />
          <FormField label="CONFIRMAR CONTRASEÑA" type="password" placeholder="••••••••" value={form.confirmarPassword} onChange={set('confirmarPassword')} autoComplete="new-password" />
        </div>
        {/* TODO: Bina 3 — vincular con tabla usuario_extensiones */}
        <FormField label="EXTENSIÓN ASIGNADA" placeholder="Ejemplo: 1020" value={form.extension} onChange={set('extension')} />
        <div className="grid grid-cols-2 gap-5">
          <FormField label="ROL ASIGNADO" type="select" placeholder="Seleccionar un rol" value={form.rolId} onChange={set('rolId')} options={roles.map(r => ({ value: r.rolId, label: r.nombre }))} />
          {!esAdminSucursal
            ? <FormField label="SUCURSAL" type="select" placeholder="Seleccionar una sucursal" value={form.sucursalId} onChange={set('sucursalId')} options={sucursales.map(s => ({ value: s.id, label: s.nombre }))} />
            : <FormField label="DEPARTAMENTO" type="select" placeholder="Seleccionar un departamento" value={form.departamentoId} onChange={set('departamentoId')} options={departamentos.map(d => ({ value: d.id, label: d.nombre }))} />
          }
        </div>
      </div>
    </FormModal>
  )
}

// ─── ModalEditarUsuario ───────────────────────────────────────────────────────

function ModalEditarUsuario({ usuario: usuarioAEditar, roles, sucursales, departamentos, estados, onCerrar, onActualizado }) {
  const { usuario: authUsuario } = useAuth()
  const esAdminSucursal = !!authUsuario?.sucursalId

  const [form, setForm] = useState({
    nombre:            usuarioAEditar.nombre            || '',
    usuario:           usuarioAEditar.usuario           || '',
    correo:            usuarioAEditar.correo            || '',
    password:          '',
    confirmarPassword: '',
    extension:         '',  // TODO: Bina 3
    estadoUsuarioId:   usuarioAEditar.estadoUsuarioId   || '',
    rolId:             usuarioAEditar.roles?.[0]?.rolId || '',
    sucursalId:        usuarioAEditar.sucursalId        || '',
    departamentoId:    '',
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }))

  const handleGuardar = async () => {
    setError('')
    if (!form.nombre || !form.usuario || !form.correo) { setError('Nombre, usuario y correo son obligatorios.'); return }
    if (form.password && form.password !== form.confirmarPassword) { setError('Las contraseñas no coinciden.'); return }
    setGuardando(true)
    try {
      await usuariosService.editar(usuarioAEditar.usuarioId, {
        nombre: form.nombre.trim(), usuario: form.usuario.trim(), correo: form.correo.trim(),
        estadoUsuarioId: form.estadoUsuarioId || undefined,
        sucursalId: esAdminSucursal ? undefined : (form.sucursalId || null),
      })
      if (form.rolId) await usuariosService.asignarRoles(usuarioAEditar.usuarioId, [form.rolId])
      if (form.password) await usuariosService.cambiarPassword(usuarioAEditar.usuarioId, { passwordActual: '', passwordNueva: form.password })
      onActualizado()
    } catch (err) { setError(err.message) } finally { setGuardando(false) }
  }

  return (
    <FormModal icon={UserCog} titulo="Editar Usuario" onCerrar={onCerrar} onConfirmar={handleGuardar} labelConfirmar="GUARDAR CAMBIOS" iconoConfirmar={Save} cargando={guardando}>
      {error && <div className="mb-5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30"><p className="font-jetbrains font-bold text-[11px] text-[#EF4444]">{error}</p></div>}
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <FormField label="NOMBRE COMPLETO" placeholder="Ejemplo: Olivia Rivera" value={form.nombre} onChange={set('nombre')} />
          <FormField label="USUARIO" placeholder="Ejemplo: olivia.rivera" value={form.usuario} onChange={set('usuario')} autoComplete="off" />
        </div>
        <FormField label="CORREO ELECTRÓNICO" type="email" placeholder="Ejemplo: oliviarv-empresa@gmail.com" value={form.correo} onChange={set('correo')} hint="Correo destinado a comunicaciones internas." hintIcon={Mail} />
        <div className="grid grid-cols-2 gap-5">
          <FormField label="CONTRASEÑA" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} hint="Dejar vacío para no cambiar." autoComplete="new-password" />
          <FormField label="CONFIRMAR CONTRASEÑA" type="password" placeholder="••••••••" value={form.confirmarPassword} onChange={set('confirmarPassword')} autoComplete="new-password" />
        </div>
        <div className="grid grid-cols-2 gap-5">
          {/* TODO: Bina 3 — cargar extensión actual desde usuario_extensiones */}
          <FormField label="EXTENSIÓN ASIGNADA" placeholder="Ejemplo: 1020" value={form.extension} onChange={set('extension')} />
          <FormField label="ESTADO" type="select" placeholder="Seleccionar estado" value={form.estadoUsuarioId} onChange={set('estadoUsuarioId')} options={estados.map(e => ({ value: e.id, label: e.nombre }))} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <FormField label="ROL ASIGNADO" type="select" placeholder="Seleccionar un rol" value={form.rolId} onChange={set('rolId')} options={roles.map(r => ({ value: r.rolId, label: r.nombre }))} />
          {!esAdminSucursal
            ? <FormField label="SUCURSAL" type="select" placeholder="Seleccionar una sucursal" value={form.sucursalId} onChange={set('sucursalId')} options={sucursales.map(s => ({ value: s.id, label: s.nombre }))} />
            : <FormField label="DEPARTAMENTO" type="select" placeholder="Seleccionar un departamento" value={form.departamentoId} onChange={set('departamentoId')} options={departamentos.map(d => ({ value: d.id, label: d.nombre }))} />
          }
        </div>
      </div>
    </FormModal>
  )
}

export default Usuarios

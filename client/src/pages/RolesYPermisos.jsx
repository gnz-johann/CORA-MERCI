// src/pages/RolesYPermisos.jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { rolesService } from '../services/usuarios.service'
import ModalRol from '../components/ModalRol'
import ModalConfirmarEliminar from '../components/ModalConfirmarEliminar'
import { elegirColorRol } from '../utils/rolColor'

// RUTAS DE ÍCONOS — ver ICONOS-ROLESYPERMISOS.md para el listado completo
// (archivo + línea) y no omitir ninguno al reemplazar por los definitivos.
import IconPlus from '../assets/iconos_vistas/globales/crear.svg?react'
import IconUser from '../assets/iconos_vistas/administracion/usuario_chiquito.svg?react'
import IconTrash from '../assets/iconos_vistas/globales/icono_basura_rojo.svg?react'
import IconEdit from '../assets/iconos_vistas/administracion/editar_rol_boton.svg?react'
import IconSave from '../assets/iconos_vistas/globales/guardar.svg?react'
import IconSeguridad from '../assets/iconos_vistas/administracion/modulo_seguridad.svg?react'
import IconIA from '../assets/iconos_vistas/administracion/modulo_ia.svg?react'
import IconLlamadas from '../assets/iconos_vistas/administracion/modulo_llamadas.svg?react'
import IconDashboard from '../assets/iconos_vistas/administracion/modulo_dashboard.svg?react'
import IconTickets from '../assets/iconos_vistas/administracion/modulo_tickets.svg?react'
import IconTelefonia from '../assets/iconos_vistas/administracion/modulo_extensiones.svg?react'
import IconWorkflows from '../assets/iconos_vistas/administracion/modulo_workflows.svg?react'
import IconConocimiento from '../assets/iconos_vistas/administracion/modulo_conocimiento.svg?react'
import IconAuditoria from '../assets/iconos_vistas/administracion/modulo_auditoria.svg?react'

// ─── Triangulito (colapsar/expandir categoría) y palomita (checkbox) ─────────
// Dibujados INLINE a propósito (no son archivos .svg de la carpeta de assets):
// son formas geométricas simples, así que se generan directo en código en vez
// de depender de un ícono externo. Colorean vía `currentColor` — el color y
// tamaño se controlan igual que cualquier ícono, con className.

function ChevronIcon({ className }) {
  return (
    <svg viewBox="0 0 10 10" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon points="2.5,1.5 8,5 2.5,8.5" fill="currentColor" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 8.2L6.3 11.5L13 4.5"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Color de respaldo cuando el rol aún no tiene `color` persistido en BD
// (ver nota al fondo del archivo sobre el campo pendiente en backend).
const COLOR_FALLBACK = '#2C4E6D'

// Orden fijo de categorías (coincide con el script de permisos de la BD:
// 'Seguridad', 'IA', 'Llamadas', 'Dashboard', 'Tickets', 'Telefonía',
// 'Workflows', 'Conocimiento', 'Auditoría'). Si el backend agrega un módulo
// nuevo que no está aquí, se muestra igual al final (ver filter más abajo)
// para no perder permisos silenciosamente.
const ORDEN_CATEGORIAS = [
  'Seguridad', 'IA', 'Llamadas', 'Dashboard', 'Tickets',
  'Telefonía', 'Workflows', 'Conocimiento', 'Auditoría',
]

const CATEGORIA_ICONS = {
  Seguridad: IconSeguridad,
  IA: IconIA,
  Llamadas: IconLlamadas,
  Dashboard: IconDashboard,
  Tickets: IconTickets,
  Telefonía: IconTelefonia,
  Workflows: IconWorkflows,
  Conocimiento: IconConocimiento,
  Auditoría: IconAuditoria,
}

// Normaliza rol.permisos a un Set de permisoIds, sea que el backend mande
// un array de ids planos o un array de objetos { permisoId } / { id }.
// Ajustar aquí si el service/controller confirma un shape distinto.
function permisosIdsDeRol(rol) {
  const lista = rol?.permisos || []
  return new Set(
    lista.map((p) => (typeof p === 'object' ? (p.permisoId ?? p.id) : p))
  )
}

// Lee el conteo de usuarios de forma defensiva: el repository YA lo trae
// vía `_count.usuario_roles` (Prisma); si el service/controller lo remapea
// con otro nombre, cae a `totalUsuarios`. Si no encuentra ninguno, null.
function totalUsuariosDeRol(rol) {
  return rol?._count?.usuario_roles ?? rol?.totalUsuarios ?? null
}

export default function RolesYPermisos() {
  const [roles, setRoles] = useState([])
  const [allPermisos, setAllPermisos] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [rolSeleccionadoId, setRolSeleccionadoId] = useState(null)
  const [permisosPendientes, setPermisosPendientes] = useState(new Set())
  const [guardandoPermisos, setGuardandoPermisos] = useState(false)

  const [categoriasAbiertas, setCategoriasAbiertas] = useState({})

  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)

  const cargarRoles = useCallback(async () => {
    try {
      setCargando(true)
      const res = await rolesService.listar()
      setRoles(res.data.roles || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  const cargarPermisos = useCallback(async () => {
    try {
      const res = await rolesService.listarPermisos()
      setAllPermisos(res.data.permisos || {})
    } catch {
      /* no crítico para la vista de roles */
    }
  }, [])

  useEffect(() => { cargarRoles() }, [cargarRoles])
  useEffect(() => { cargarPermisos() }, [cargarPermisos])

  // Selecciona el primer rol de la lista por default al cargar
  useEffect(() => {
    if (!rolSeleccionadoId && roles.length > 0) {
      setRolSeleccionadoId(roles[0].rolId)
    }
  }, [roles, rolSeleccionadoId])

  const rolSeleccionado = useMemo(
    () => roles.find((r) => r.rolId === rolSeleccionadoId) || null,
    [roles, rolSeleccionadoId]
  )

  const permisosOriginales = useMemo(
    () => permisosIdsDeRol(rolSeleccionado),
    [rolSeleccionado]
  )

  // Sincroniza el set editable cada vez que cambia el rol seleccionado
  useEffect(() => {
    setPermisosPendientes(permisosOriginales)
  }, [permisosOriginales])

  const hayCambiosPendientes = useMemo(() => {
    if (permisosPendientes.size !== permisosOriginales.size) return true
    for (const id of permisosPendientes) {
      if (!permisosOriginales.has(id)) return true
    }
    return false
  }, [permisosPendientes, permisosOriginales])

  const toggleCategoria = (categoria) => {
    setCategoriasAbiertas((prev) => ({ ...prev, [categoria]: !(prev[categoria] ?? true) }))
  }

  const togglePermiso = (permisoId) => {
    setPermisosPendientes((prev) => {
      const next = new Set(prev)
      if (next.has(permisoId)) next.delete(permisoId)
      else next.add(permisoId)
      return next
    })
  }

  const descartarCambios = () => setPermisosPendientes(permisosOriginales)

  const guardarCambios = async () => {
    if (!rolSeleccionado) return
    setGuardandoPermisos(true)
    setError('')
    try {
      await rolesService.asignarPermisos(rolSeleccionado.rolId, Array.from(permisosPendientes))
      await cargarRoles()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardandoPermisos(false)
    }
  }

  const eliminarRolConfirmado = async () => {
    if (!rolSeleccionado) return

    await rolesService.eliminar(rolSeleccionado.rolId)

    setModalEliminarAbierto(false)
    setRolSeleccionadoId(null)

    cargarRoles()
  }

  const abrirModalCrear = () => { setModoModal('crear'); setModalAbierto(true) }
  const abrirModalEditar = () => { setModoModal('editar'); setModalAbierto(true) }

  const guardarModal = async ({ nombre, descripcion }) => {
    if (modoModal === 'crear') {
      const coloresEnUso = roles.map((r) => r.color).filter(Boolean)
      const color = elegirColorRol(coloresEnUso)
      // NOTA: `color` requiere que el backend lo reciba y persista en
      // catalogo_roles (ver comentario al final del archivo). Mientras eso
      // no esté, el color se ve bien al crear pero se pierde al recargar.
      const res = await rolesService.crear({ nombre, descripcion, color })
      await cargarRoles()
      // Defensivo: roles.repository.crear() selecciona el campo crudo `id` de
      // Prisma; no confirmado si el controller lo renombra a `rolId` como en
      // listar()/buscarPorId(). Se revisa primero `rolId` y se cae a `id`.
      const nuevoId = res?.data?.rol?.rolId ?? res?.data?.rol?.id
      if (nuevoId) setRolSeleccionadoId(nuevoId)
    } else {
      await rolesService.editar(rolSeleccionado.rolId, { nombre, descripcion })
      await cargarRoles()
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[#1667F4] border-t-transparent animate-spin" />
      </div>
    )
  }

  const categoriasAMostrar = [
    ...ORDEN_CATEGORIAS.filter((c) => allPermisos[c]?.length),
    ...Object.keys(allPermisos).filter((c) => !ORDEN_CATEGORIAS.includes(c)),
  ]

  return (
    <div>
      {/* Fila superior: solo el botón, pegado a la derecha */}
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={abrirModalCrear}
          className="w-40 h-[38px] rounded-[10px] bg-[#1667F4] flex items-center justify-center gap-2 font-jetbrains font-extrabold text-[13px] text-white hover:brightness-110 transition"
        >
          <IconPlus className="w-6 h-6" />
          NUEVO ROL
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444] font-montserrat">
          {error}
        </div>
      )}

      <div className="flex gap-6 items-start">

        {/* ── Columna izquierda: lista de roles ──────────────────────────── */}
        <div
          className="w-[360px] flex-shrink-0 flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-2
          [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#0D2647] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {roles.map((rol) => {
            const seleccionado = rol.rolId === rolSeleccionadoId
            const color = rol.color || COLOR_FALLBACK
            const totalUsuarios = totalUsuariosDeRol(rol)
            const totalPermisos = rol?.permisos?.length ?? rol?._count?.roles_permisos ?? 0

            return (
              <button
                key={rol.rolId}
                type="button"
                onClick={() => setRolSeleccionadoId(rol.rolId)}
                className={`relative w-full h-[111px] rounded-[20px] border text-left px-5 py-4 transition-colors ${
                  seleccionado
                    ? 'border-[#0D2647]'
                    : 'border-[#0D2647] bg-[#061628] hover:border-[#1A3A5C]'
                }`}
                style={
                  seleccionado
                    ? { background: 'linear-gradient(90deg, rgba(21, 94, 239, 0.2) 0%, rgba(0, 19, 56, 0.2) 100%)' }
                    : undefined
                }
              >
                {seleccionado && (
                  <span
                    className="absolute left-[7px] top-1/2 -translate-y-1/2 w-[2px] h-[46px] rounded-full bg-[#3B82F6]"
                    style={{ boxShadow: '0 0 8px #3B82F6' }}
                  />
                )}

                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-syne font-bold text-white text-base truncate">
                    {rol.nombre}
                  </span>
                </div>

                <p className="mt-1.5 font-montserrat font-bold text-[10px] text-[#7A9EC4] line-clamp-2">
                  {rol.descripcion || 'Sin descripción'}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <IconUser className="w-2.5 h-2.5 text-[#2C4E6D]" />
                    <span className="font-jetbrains font-bold text-[9px] text-[#2C4E6D]">
                      {totalUsuarios !== null
                        ? `${totalUsuarios} ${totalUsuarios === 1 ? 'usuario' : 'usuarios'}`
                        : '— usuarios'}
                    </span>
                  </div>
                  <span className="inline-flex items-center justify-center w-[66px] h-[15px] rounded-md border border-[#1667F4] bg-[#1667F4]/20 font-jetbrains font-bold text-[7px] text-[#1667F4]">
                    {totalPermisos} permisos
                  </span>
                </div>
              </button>
            )
          })}

          {roles.length === 0 && (
            <p className="font-montserrat text-sm text-[#7A9EC4] text-center py-8">
              No hay roles registrados todavía.
            </p>
          )}
        </div>

        {/* ── Columna derecha: detalle del rol ───────────────────────────── */}
        <div
          className="flex-1 min-w-0 rounded-[20px] border border-[#0D2647] bg-[#061628] flex flex-col overflow-hidden"
          style={{ minHeight: 600 }}
        >
          {!rolSeleccionado ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-montserrat text-sm text-[#7A9EC4]">
                Selecciona un rol para ver sus permisos.
              </p>
            </div>
          ) : (
            <>
              {/* Encabezado del panel */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: rolSeleccionado.color || COLOR_FALLBACK }}
                    />
                    <h2 className="font-syne font-extrabold text-white text-base">
                      {rolSeleccionado.nombre}
                    </h2>
                  </div>
                  <p className="mt-1 ml-5 font-jetbrains text-[10px] text-[#7A9EC4]">
                    {(() => {
                      const t = totalUsuariosDeRol(rolSeleccionado)
                      if (t === null) return '— usuarios'
                      return `${t} ${t === 1 ? 'usuario' : 'usuarios'}`
                    })()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={abrirModalEditar}
                  className="w-[95px] h-[30px] rounded-lg flex items-center justify-center gap-1.5 border border-[#1A3A5C] bg-[#2C4E6D]/10 font-jetbrains font-extrabold text-[10px] text-[#7A9EC4] hover:bg-[#2C4E6D]/50 transition-colors"
                >
                  <IconEdit className="w-3.5 h-3.5" />
                  EDITAR ROL
                </button>

                <button
                  type="button"
                  onClick={() => setModalEliminarAbierto(true)}
                  className="w-[95px] h-[30px] rounded-lg flex items-center justify-center gap-1.5 border border-[#642323] bg-[#642323]/30 font-jetbrains font-extrabold text-[10px] text-[#CE0000] hover:bg-[#642323]/50 transition-colors"
                >
                  <IconTrash className="w-3 h-3" />
                  ELIMINAR
                </button>
              </div>
              </div>

              <div className="h-px bg-[#1A3A5C]" />

              {/* Categorías de permisos */}
              <div
                className="flex-1 overflow-y-auto px-6 py-4 space-y-3
                [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#0D2647] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
              >
                {categoriasAMostrar.map((categoria) => {
                  const permisosCategoria = allPermisos[categoria] || []
                  const abierta = categoriasAbiertas[categoria] ?? true
                  const CategoriaIcon = CATEGORIA_ICONS[categoria]

                  return (
                    <div key={categoria}>
                      <button
                        type="button"
                        onClick={() => toggleCategoria(categoria)}
                        className="w-full h-[35px] rounded-xl bg-[#0A1E38] flex items-center gap-3 px-3"
                      >
                        <span className="w-[18px] h-[18px] rounded-md bg-[#1667F4]/15 border border-[#1667F4] flex items-center justify-center flex-shrink-0">
                          {CategoriaIcon
                            ? <CategoriaIcon className="w-3 h-3 text-[#1667F4]" />
                            : <span className="w-1.5 h-1.5 rounded-full bg-[#1667F4]" />}
                        </span>
                        <span className="font-jetbrains font-bold text-[11px] text-white">
                          {categoria}
                        </span>
                        <ChevronIcon
                          className={`w-3 h-3 text-[#2C4E6D] ml-auto transition-transform ${abierta ? 'rotate-90' : ''}`}
                        />
                      </button>

                      {abierta && (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 mt-3 mb-1 px-1">
                          {permisosCategoria.map((p) => {
                            const checked = permisosPendientes.has(p.permisoId)
                            return (
                              <label
                                key={p.permisoId}
                                className="flex items-center gap-2.5 cursor-pointer select-none"
                              >
                                <span
                                  onClick={(e) => { e.preventDefault(); togglePermiso(p.permisoId) }}
                                  className={`w-3.5 h-3.5 rounded-[4px] flex items-center justify-center flex-shrink-0 border-2 border-[#1667F4] ${
                                    checked ? 'bg-[#1667F4]' : 'bg-transparent'
                                  }`}
                                >
                                  {checked && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                                </span>
                                <span className="font-montserrat font-bold text-[10px] text-white">
                                  {p.nombre}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Barra fija de acciones */}
              <div className="h-[70px] rounded-b-[20px] bg-[#0A1E38] flex items-center justify-end gap-3 px-6 flex-shrink-0">
                <button
                  type="button"
                  onClick={descartarCambios}
                  disabled={!hayCambiosPendientes || guardandoPermisos}
                  className="w-[134px] h-[38px] rounded-lg border border-[#1A3A5C] font-jetbrains font-bold text-[9px] text-[#7A9EC4] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  DESCARTAR CAMBIOS
                </button>
                <button
                  type="button"
                  onClick={guardarCambios}
                  disabled={!hayCambiosPendientes || guardandoPermisos}
                  className="w-[134px] h-[38px] rounded-lg bg-[#1667F4] flex items-center justify-center gap-2 font-jetbrains font-bold text-[9px] text-white hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconSave className="w-3.5 h-3.5" />
                  {guardandoPermisos ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ModalRol
        isOpen={modalAbierto}
        modo={modoModal}
        rolInicial={modoModal === 'editar' ? rolSeleccionado : null}
        onClose={() => setModalAbierto(false)}
        onGuardar={guardarModal}
      />
      <ModalConfirmarEliminar
        isOpen={modalEliminarAbierto}
        nombre="Rol"
        genero="m"
        onClose={() => setModalEliminarAbierto(false)}
        onConfirmar={eliminarRolConfirmado}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   PENDIENTES DE BACKEND (no bloquean esta entrega, pero hay que resolverlos
   para que el color y el conteo de usuarios funcionen al 100%):

   1) Campo `color` en catalogo_roles — agregar al schema.prisma y a
      roles.repository.crear() (hoy solo persiste nombre/descripcion/es_global).
      Sin esto, el color se ve bien al crear un rol pero se pierde al recargar
      (cae al COLOR_FALLBACK definido arriba).

   2) Conteo de usuarios por rol — el repository YA lo trae vía
      `_count: { select: { usuario_roles: true } }` en listar()/buscarPorId().
      Este archivo lo lee de forma defensiva: `rol._count?.usuario_roles`,
      con fallback a `rol.totalUsuarios` por si el service/controller lo
      remapea con otro nombre, y muestra "— usuarios" si no encuentra ninguno.
      OJO: confirmar si `usuario_roles` tiene soft-delete (deleted_at) en
      schema.prisma — si lo tiene y no se filtra en el _count, el conteo
      podría incluir asignaciones de rol ya "eliminadas".
───────────────────────────────────────────────────────────────────────── */

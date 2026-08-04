// Panel lateral fijo (380px) que aparece desde el lado derecho al presionar
// el botón de ojo en la tabla de usuarios. No tiene overlay — el resto de la
// página permanece visible e interactivo.

import { useState, useEffect } from 'react'
import { X, Check, UserCog } from 'lucide-react'
import { rolesService } from '../services/usuarios.service'

// Helpers 

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatFechaCorta(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// Color del estado — mismo esquema que la tabla
const colorEstado = {
  Activo:     '#10B981',
  Inactivo:   '#64748B',
  Suspendido: '#F59E0B',
  Bloqueado:  '#EF4444',
}

// Componente 

export default function PanelDetalleUsuario({ usuario, onCerrar, onEditar }) {
  const [todosPermisos, setTodosPermisos] = useState([])
  const [cargandoPermisos, setCargandoPermisos] = useState(true)

  // Cargar catálogo completo de permisos del sistema
  useEffect(() => {
    rolesService.listarPermisos()
      .then((res) => {
        const agrupados = res.data.permisos || {}
        // Aplanar todos los módulos en un solo array
        const plano = Object.values(agrupados).flat()
        setTodosPermisos(plano)
      })
      .catch(() => { /* silencioso — el panel muestra vacío */ })
      .finally(() => setCargandoPermisos(false))
  }, [])

  // Set de claves que SÍ tiene este usuario (viene de GET /usuarios/:id)
  const permisosUsuarioSet = new Set(usuario.permisosUsuario || [])

  // Ordenar: primero los que SÍ tiene, luego los que NO tiene
  // Al partir el array en 2 mitades, cada columna queda con "tiene" arriba y "no tiene" abajo
  const permisosOrdenados = [
    ...todosPermisos.filter((p) => permisosUsuarioSet.has(p.clave)),
    ...todosPermisos.filter((p) => !permisosUsuarioSet.has(p.clave)),
  ].map((p) => ({ ...p, tiene: permisosUsuarioSet.has(p.clave) }))

  const mitad     = Math.ceil(permisosOrdenados.length / 2)
  const columna1  = permisosOrdenados.slice(0, mitad)
  const columna2  = permisosOrdenados.slice(mitad)

  // Iniciales del avatar
  const initials = usuario.nombre
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?'

  // Datos de la sección DATOS
  const filasDatos = [
    { label: 'Correo:',          value: usuario.correo,                              color: '#7A9EC4' },
    { label: 'Estado:',          value: usuario.estado,                              color: colorEstado[usuario.estado] || '#7A9EC4' },
    { label: 'Extensión:',       value: null, esTodo: true },  // : Bina 3
    { label: 'Último acceso:',   value: formatFecha(usuario.ultimoAcceso),           color: '#7A9EC4' },
    { label: 'Fecha registro:',  value: formatFechaCorta(usuario.fechaRegistro),     color: '#7A9EC4' },
  ]

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 flex flex-col border-l border-[#0D2647]"
      style={{ width: 380, backgroundColor: '#040F1E' }}
    >

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span
          className="font-syne font-bold text-white truncate mr-3"
          style={{ fontSize: 12 }}
        >
          {usuario.nombre}
        </span>
        <button
          type="button"
          onClick={onCerrar}
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 25, height: 25,
            borderRadius: 6,
            backgroundColor: '#0A1E38',
            border: '1px solid #1A3A5C',
          }}
        >
          <X size={12} className="text-[#7A9EC4]" />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#1A3A5C] flex-shrink-0" />

      {/*  Contenido scrollable  */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Avatar + nombre + @usuario */}
        <div className="flex flex-col items-center gap-2 pt-1 pb-1">
          <div
            className="rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center font-bold text-white flex-shrink-0"
            style={{ width: 70, height: 70, fontSize: 24 }}
          >
            {initials}
          </div>
          <p
            className="font-syne font-bold text-white text-center"
            style={{ fontSize: 12 }}
          >
            {usuario.nombre}
          </p>
          <p
            className="font-jetbrains font-bold text-center"
            style={{ fontSize: 8, color: '#7A9EC4' }}
          >
            @{usuario.usuario}
          </p>
        </div>

        {/*  DATOS  */}
        <div className="space-y-2">
          <p
            className="font-jetbrains font-bold"
            style={{ fontSize: 11, color: '#7A9EC4' }}
          >
            DATOS
          </p>

          {filasDatos.map(({ label, value, color, esTodo }) => (
            <div
              key={label}
              className="flex items-center justify-between px-3 mx-auto"
              style={{
                height: 28,
                borderRadius: 14,
                backgroundColor: '#0A1E38',
                border: '1px solid #0D2647',
              }}
            >
              <span
                className="font-jetbrains font-bold text-white flex-shrink-0"
                style={{ fontSize: 10 }}
              >
                {label}
              </span>
              <span
                className="font-jetbrains font-bold truncate ml-2 text-right"
                style={{
                  fontSize: 9,
                  color: esTodo ? '#2C4E6D' : (color || '#7A9EC4'),
                  maxWidth: '55%',
                }}
              >
                {/* Bina 3 — conectar extensión desde usuario_extensiones */}
                {esTodo ? '—' : (value || '—')}
              </span>
            </div>
          ))}
        </div>

        {/*  PERMISOS  */}
        <div className="space-y-2">
          <p
            className="font-jetbrains font-bold"
            style={{ fontSize: 11, color: '#7A9EC4' }}
          >
            PERMISOS
          </p>

          {cargandoPermisos ? (
            <div className="flex gap-1 items-center">
              <div className="w-3 h-3 rounded-full border border-[#7A9EC4] border-t-transparent animate-spin" />
              <span className="font-jetbrains font-bold" style={{ fontSize: 8, color: '#2C4E6D' }}>
                Cargando permisos...
              </span>
            </div>
          ) : permisosOrdenados.length === 0 ? (
            <span className="font-jetbrains font-bold" style={{ fontSize: 8, color: '#2C4E6D' }}>
              Sin permisos en el catálogo.
            </span>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">

              {/* Columna 1 */}
              <div className="flex flex-col gap-[5px]">
                {columna1.map((p) => (
                  <div key={p.permisoId} className="flex items-start gap-1">
                    {p.tiene
                      ? <Check size={8} strokeWidth={3} className="shrink-0 mt-[1px]" style={{ color: '#10974D' }} />
                      : <X     size={8} strokeWidth={3} className="shrink-0 mt-[1px]" style={{ color: '#2C4E6D' }} />
                    }
                    <span
                      className="font-jetbrains font-bold leading-tight"
                      style={{ fontSize: 8, color: p.tiene ? '#10974D' : '#2C4E6D' }}
                    >
                      {p.nombre}
                    </span>
                  </div>
                ))}
              </div>

              {/* Columna 2 */}
              <div className="flex flex-col gap-[5px]">
                {columna2.map((p) => (
                  <div key={p.permisoId} className="flex items-start gap-1">
                    {p.tiene
                      ? <Check size={8} strokeWidth={3} className="shrink-0 mt-[1px]" style={{ color: '#10974D' }} />
                      : <X     size={8} strokeWidth={3} className="shrink-0 mt-[1px]" style={{ color: '#2C4E6D' }} />
                    }
                    <span
                      className="font-jetbrains font-bold leading-tight"
                      style={{ fontSize: 8, color: p.tiene ? '#10974D' : '#2C4E6D' }}
                    >
                      {p.nombre}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Divider */}
      <div className="h-px bg-[#1A3A5C] flex-shrink-0" />

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">

        {/* Cerrar */}
        <button
          type="button"
          onClick={onCerrar}
          className="flex items-center justify-center font-jetbrains font-bold hover:opacity-80 transition-opacity"
          style={{
            width: 138, height: 34,
            borderRadius: 8,
            backgroundColor: '#061628',
            border: '1px solid #1A3A5C',
            fontSize: 13,
            color: '#2D547E',
          }}
        >
          CERRAR
        </button>

        {/* Editar usuario */}
        <button
          type="button"
          onClick={onEditar}
          className="flex items-center justify-center gap-2 font-jetbrains font-bold text-white hover:brightness-110 transition-all"
          style={{
            width: 138, height: 34,
            borderRadius: 8,
            backgroundColor: '#1667F4',
            border: '1px solid #1667F4',
            fontSize: 11,
          }}
        >
          <UserCog size={13} color="white" />
          EDITAR USUARIO
        </button>

      </div>
    </div>
  )
}

// src/components/ModalRol.jsx
// Modal reutilizable para CREAR y EDITAR el nombre/descripción de un rol.
// La edición de PERMISOS vive aparte, en el panel derecho de
// RolesYPermisos.jsx (checkboxes) — este modal solo toca nombre y
// descripción. El color se asigna afuera (en el padre) al crear, ver
// src/utils/rolColor.js.
//
// RUTAS DE ÍCONOS SIMULADAS — ver ICONOS-ROLESYPERMISOS.md para el listado
// completo (archivo + línea) y no omitir ninguno al reemplazar por los
// definitivos de tu carpeta de assets.
import { useState, useEffect } from 'react'
import IconShieldLock from '../assets/iconos_vistas/administracion/nuevo_rol.svg?react'
import IconClose from '../assets/iconos_vistas/globales/cerrar.svg?react'
import IconWarning from '../assets/iconos_vistas/globales/alerta_eliminar.svg?react'
import IconPlus from '../assets/iconos_vistas/globales/crear.svg?react'
import IconSave from '../assets/iconos_vistas/globales/guardar.svg?react'
import IconEdit from '../assets/iconos_vistas/administracion/editar_rol_boton.svg?react'

export default function ModalRol({ isOpen, modo = 'crear', rolInicial = null, onClose, onGuardar }) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const esEdicion = modo === 'editar'

  // Precarga los datos del rol al abrir en modo edición; limpia en modo creación.
  useEffect(() => {
    if (!isOpen) return
    setNombre(esEdicion ? (rolInicial?.nombre || '') : '')
    setDescripcion(esEdicion ? (rolInicial?.descripcion || '') : '')
    setError('')
  }, [isOpen, esEdicion, rolInicial])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre del rol es obligatorio.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      await onGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim() })
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el rol.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-[506px] rounded-[20px] border border-[#0D2647] bg-[#061628] shadow-2xl">

        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0A1E38] border border-[#1A3A5C] flex items-center justify-center">
              {esEdicion ? (
                <IconEdit className="w-[18px] h-[18px] text-[#1667F4]" />
              ) : (
                <IconShieldLock className="w-[18px] h-[18px] text-[#1667F4]" />
              )}
            </div>
            <h2 className="font-syne font-extrabold text-[#DAEBFF] text-xl">
              {esEdicion ? 'Editar Rol' : 'Nuevo Rol'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#1A3A5C] bg-[#0A1E38] flex items-center justify-center text-[#7A9EC4] hover:text-white hover:border-[#1667F4] transition-colors"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="justify-end gap-3 px-6 pb-2 space-y-4 py-5 border-t border-[#1A3A5C]">

            <div>
              <label className="block mb-2 font-jetbrains font-bold text-[11px] tracking-wider text-[#A6C6E8] uppercase">
                Nombre del rol
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Supervisor de Turno"
                className="w-full h-11 px-4 rounded-xl border border-[#1A3A5C] bg-[#040F1E] outline-none text-white text-sm font-mono font-bold placeholder:text-[#5D5D5D] placeholder:font-mono placeholder:font-bold focus:border-[#1667F4] transition-colors"
              />
            </div>

            <div>
              <label className="block mb-2 font-jetbrains font-bold text-[11px] tracking-wider text-[#A6C6E8] uppercase">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el propósito de este rol.."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[#1A3A5C] bg-[#040F1E] outline-none text-white text-sm font-bold font-mono placeholder:text-[#5D5D5D] placeholder:font-mono placeholder:font-bold focus:border-[#1667F4] transition-colors resize-none"
              />
            </div>

            {!esEdicion && (
              <div className="flex items-start gap-2.5 rounded-xl border border-[#0D2647] bg-[#0A1E38]/60 px-4 py-3">
                <IconWarning className="w-4 h-4 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                <p className="font-jetbrains text-[11px] leading-relaxed text-[#7A9EC4]">
                  Los roles nuevos son locales a tu empresa. Solo el Super Administrador puede crear roles globales.
                </p>
              </div>
            )}

            {error && (
              <p className="font-jetbrains text-[11px] text-[#EF4444]">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-5 mt-2 border-t border-[#1A3A5C]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl border border-[#1A3A5C] font-jetbrains font-bold text-[12px] text-[#2D547E] hover:text-[#5b7da1] hover:border-[#5b7da1] transition-colors"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="h-10 px-5 rounded-xl bg-[#1667F4] flex items-center gap-2 font-jetbrains font-bold text-[12px] text-white hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {esEdicion ? <IconSave className="w-4 h-4" /> : <IconPlus className="w-4 h-4" />}
              {guardando ? 'GUARDANDO...' : esEdicion ? 'GUARDAR CAMBIOS' : 'CREAR ROL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

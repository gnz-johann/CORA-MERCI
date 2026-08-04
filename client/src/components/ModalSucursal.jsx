// src/components/ModalSucursal.jsx
// Modal reutilizable para CREAR y EDITAR una sucursal. Mismo patrón visual
// que ModalRol.jsx (header con ícono + título, campos con label arriba,
// footer Cancelar/Guardar) para mantener consistencia entre módulos.
//
// RUTAS DE ÍCONOS SIMULADAS — reemplaza por tus archivos reales:
import IconSucursal from '../assets/iconos_vistas/administracion/crear_sucursal.svg?react'
import IconClose from '../assets/iconos_vistas/globales/cerrar.svg?react'
import IconPlus from '../assets/iconos_vistas/globales/crear.svg?react'
import IconSave from '../assets/iconos_vistas/globales/guardar.svg?react'

import { useState, useEffect } from 'react'

export default function ModalSucursal({ isOpen, modo = 'crear', sucursalInicial = null, onClose, onGuardar }) {
  const [form, setForm] = useState({ nombre: '', direccion: '', telefono: '', correo: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const esEdicion = modo === 'editar'

  useEffect(() => {
    if (!isOpen) return
    setForm({
      nombre: esEdicion ? (sucursalInicial?.nombre || '') : '',
      direccion: esEdicion ? (sucursalInicial?.direccion || '') : '',
      telefono: esEdicion ? (sucursalInicial?.telefono || '') : '',
      correo: esEdicion ? (sucursalInicial?.correo || '') : '',
    })
    setError('')
  }, [isOpen, esEdicion, sucursalInicial])

  if (!isOpen) return null

  const actualizarCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre de la sucursal es obligatorio.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      await onGuardar({
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        correo: form.correo.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la sucursal.')
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
              <IconSucursal className="w-[18px] h-[18px] text-[#1667F4]" />
            </div>
            <h2 className="font-syne font-extrabold text-white text-xl">
              {esEdicion ? 'Editar Sucursal' : 'Crear Sucursal'}
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
          <div className="px-6 pb-2 space-y-4">

            <div>
              <label className="block mb-2 font-jetbrains font-bold text-[11px] tracking-wider text-[#A6C6E8] uppercase">
                Nombre
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)}
                placeholder="Ej. Sucursal Centro"
                className="w-full h-11 px-4 rounded-xl border border-[#1A3A5C] bg-[#040F1E] outline-none text-white text-sm font-montserrat placeholder:text-[#5D5D5D] placeholder:font-bold placeholder:font-mono focus:border-[#1667F4] transition-colors"
              />
            </div>

            <div>
              <label className="block mb-2 font-jetbrains font-bold text-[11px] tracking-wider text-[#A6C6E8] uppercase">
                Dirección
              </label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => actualizarCampo('direccion', e.target.value)}
                placeholder="Ej. Av. Juárez 100, Centro (opcional)"
                className="w-full h-11 px-4 rounded-xl border border-[#1A3A5C] bg-[#040F1E] outline-none text-white text-sm font-montserrat placeholder:text-[#5D5D5D] placeholder:font-bold placeholder:font-mono focus:border-[#1667F4] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-jetbrains font-bold text-[11px] tracking-wider text-[#A6C6E8] uppercase">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => actualizarCampo('telefono', e.target.value)}
                  placeholder="Ej. 331 234 5678"
                  className="w-full h-11 px-4 rounded-xl border border-[#1A3A5C] bg-[#040F1E] outline-none text-white text-sm font-montserrat placeholder:text-[#5D5D5D] placeholder:font-bold placeholder:font-mono focus:border-[#1667F4] transition-colors"
                />
              </div>
              <div>
                <label className="block mb-2 font-jetbrains font-bold text-[11px] tracking-wider text-[#A6C6E8] uppercase">
                  Correo
                </label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) => actualizarCampo('correo', e.target.value)}
                  placeholder="Ej. sucursal@empresa.com"
                  className="w-full h-11 px-4 rounded-xl border border-[#1A3A5C] bg-[#040F1E] outline-none text-white text-sm font-montserrat placeholder:text-[#5D5D5D] placeholder:font-bold placeholder:font-mono focus:border-[#1667F4] transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="font-jetbrains text-[11px] text-[#EF4444]">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-5 mt-2 border-t border-[#0D2647]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl border border-[#1A3A5C] font-jetbrains font-bold text-[12px] text-[#7A9EC4] hover:text-white hover:border-[#3B82F6] transition-colors"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="h-10 px-5 rounded-xl bg-[#1667F4] flex items-center gap-2 font-jetbrains font-bold text-[12px] text-white hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {esEdicion ? <IconSave className="w-4 h-4" /> : <IconPlus className="w-4 h-4" />}
              {guardando ? 'GUARDANDO...' : esEdicion ? 'GUARDAR CAMBIOS' : 'CREAR SUCURSAL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

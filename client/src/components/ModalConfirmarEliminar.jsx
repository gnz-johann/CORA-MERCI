// src/components/ModalConfirmarEliminar.jsx
// Modal de confirmación de eliminación — reutilizable para CUALQUIER entidad
// (rol, sucursal, y lo que siga: usuario, departamento...). Mismo patrón
// visual que ModalRol.jsx/ModalSucursal.jsx (header ícono + título + X,
// footer con botones), pero en rojo/advertencia y sin formulario.
//
// Maneja el género gramatical del español ('m'/'f') para que el texto salga
// bien conjugado sin tener que escribir una oración distinta por entidad:
//   genero="m" → "este rol"       / "El rol será desactivado..."
//   genero="f" → "esta sucursal"  / "La sucursal será desactivada..."
//
// RUTAS DE ÍCONOS SIMULADAS — reemplaza por tus archivos reales:
import IconAdvertencia from '../assets/iconos_vistas/globales/alerta_eliminar.svg?react'
import IconClose from '../assets/iconos_vistas/globales/cerrar.svg?react'
import IconEliminar from '../assets/iconos_vistas/globales/icono_basura_blanco.svg?react'

import { useState } from 'react'

export default function ModalConfirmarEliminar({
  isOpen,
  nombre,        // Ej. "Rol", "Sucursal" — capitalizado, singular
  genero = 'm',  // 'm' | 'f' — controla "el/la", "este/esta", "-o/-a"
  onClose,
  onConfirmar,   // async () => void — dispara el eliminar real (llamada al service)
}) {
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const esFemenino = genero === 'f'
  const articulo = esFemenino ? 'La' : 'El'
  const demostrativo = esFemenino ? 'esta' : 'este'
  const participio = esFemenino ? 'desactivada' : 'desactivado'
  const nombreMinuscula = nombre.toLowerCase()

  const handleConfirmar = async () => {
    setEliminando(true)
    setError('')
    try {
      await onConfirmar()
      onClose()
    } catch (err) {
      setError(err.message || `No se pudo eliminar ${demostrativo} ${nombreMinuscula}.`)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-[506px] rounded-[20px] border border-[#0D2647] bg-[#061628] shadow-2xl">

        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#642323]/30 border border-[#642323] flex items-center justify-center">
              <IconAdvertencia className="w-[18px] h-[18px] text-[#EF4444]" />
            </div>
            <h2 className="font-syne font-extrabold text-white text-xl">
              Eliminar {nombre}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#0D2647] flex items-center justify-center text-[#7A9EC4] hover:text-white hover:border-[#1667F4] transition-colors"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-6 pb-2">
          <p className="font-syne font-bold text-white text-lg leading-snug">
            ¿Estás seguro de que deseas eliminar a {demostrativo} {nombreMinuscula}?
          </p>
          <p className="mt-2 font-jetbrains text-[12px] leading-relaxed text-[#7A9EC4]">
            {articulo} {nombre} será {participio} y dejará de estar disponible en el sistema.
          </p>

          {error && (
            <p className="mt-3 font-jetbrains text-[11px] text-[#EF4444]">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 mt-4 border-t border-[#0D2647]">
          <button
            type="button"
            onClick={onClose}
            disabled={eliminando}
            className="h-10 px-5 rounded-xl border border-[#1A3A5C] font-jetbrains font-bold text-[12px] text-[#7A9EC4] hover:text-white hover:border-[#3B82F6] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={eliminando}
            className="h-10 px-5 rounded-xl bg-[#642323] border border-[#8a2f2f] flex items-center gap-2 font-jetbrains font-bold text-[12px] text-white hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <IconEliminar className="w-4 h-4" />
            {eliminando ? 'ELIMINANDO...' : `ELIMINAR ${nombre.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}

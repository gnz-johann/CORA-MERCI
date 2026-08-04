// src/components/FormModal.jsx
import { X, Plus } from 'lucide-react'

/**
 * @param {Component}  icon            - Ícono Lucide para el header
 * @param {string}     titulo          - Título del formulario
 * @param {Function}   onCerrar        - Se llama al presionar X o Cancelar
 * @param {Function}   onConfirmar     - Se llama al presionar el botón de acción
 * @param {string}     labelConfirmar  - Texto del botón (default: "CONFIRMAR")
 * @param {Component}  iconoConfirmar  - Ícono del botón de acción (default: Plus)
 * @param {boolean}    cargando        - Desactiva botón y muestra "PROCESANDO..."
 * @param {number}     ancho           - Ancho en px (default: 618)
 * @param {number}     alto            - Alto en px (default: 747)
 * @param {ReactNode}  children        - Campos del formulario
 */
export default function FormModal({
  icon: Icon,
  titulo,
  onCerrar,
  onConfirmar,
  labelConfirmar  = 'CONFIRMAR',
  iconoConfirmar: IconoConfirmar = Plus,
  cargando = false,
  ancho = 618,
  alto  = 747,
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-5">
      <div
        className="flex flex-col rounded-2xl overflow-hidden border border-[#0D2647] bg-[#061628]"
        style={{ width: ancho, height: alto, maxHeight: 'calc(100vh - 40px)' }}
      >

        {/* Header  */}
        <div className="flex items-center gap-3 px-6 py-5 flex-shrink-0">
          <div
            className="flex items-center justify-center rounded-[8px] bg-[#0A1E38] border border-[#1A3A5C] flex-shrink-0"
            style={{ width: 41, height: 37 }}
          >
            {Icon && <Icon size={18} className="text-[#DAEBFF]" />}
          </div>
          <span
            className="flex-1 font-syne font-extrabold text-[#DAEBFF]"
            style={{ fontSize: 25 }}
          >
            {titulo}
          </span>
          <button
            type="button"
            onClick={onCerrar}
            className="flex items-center justify-center rounded-[8px] bg-[#0A1E38] border border-[#1A3A5C] hover:opacity-75 transition-opacity flex-shrink-0"
            style={{ width: 32, height: 30 }}
          >
            <X size={16} className="text-[#7A9EC4]" />
          </button>
        </div>

        {/* Divider superior */}
        <div className="h-px bg-[#1A3A5C] flex-shrink-0" />

        {/*  Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Divider inferior */}
        <div className="h-px bg-[#1A3A5C] flex-shrink-0" />

        {/*  Footer  */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0">

          <button
            type="button"
            onClick={onCerrar}
            className="flex items-center justify-center rounded-[8px] bg-[#061628] border border-[#1A3A5C] font-jetbrains font-bold text-[#2D547E] hover:opacity-80 transition-opacity"
            style={{ width: 103, height: 42, fontSize: 13 }}
          >
            CANCELAR
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className="flex items-center justify-center gap-2 rounded-[8px] bg-[#1667F4] font-jetbrains font-bold text-white hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ width: 143, height: 42, fontSize: 11 }}
          >
            {!cargando && <IconoConfirmar size={13} color="white" strokeWidth={2.5} />}
            {cargando ? 'PROCESANDO...' : labelConfirmar}
          </button>

        </div>
      </div>
    </div>
  )
}

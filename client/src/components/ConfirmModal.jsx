// Modal de confirmación reutilizable para acciones destructivas (eliminar, desactivar, etc.)
// Diseño consistente con FormModal: mismo header, mismos dividers, mismos botones base.

import { X, Trash2, AlertTriangle } from 'lucide-react'

/**
 * @param {Component}  icon           - Ícono Lucide para el header (ej. UserX, Trash2)
 * @param {string}     titulo         - Título del modal (ej. "Eliminar Usuario")
 * @param {string}     pregunta       - Pregunta principal (puede incluir el nombre de la entidad)
 * @param {string[]}   advertencias   - Líneas de advertencia mostradas debajo de la pregunta
 * @param {string}     labelConfirmar - Texto del botón destructivo (ej. "ELIMINAR USUARIO")
 * @param {Function}   onCerrar       - Se llama al presionar X o Cancelar
 * @param {Function}   onConfirmar    - Se llama al confirmar la acción destructiva
 * @param {boolean}    cargando       - Desactiva los botones y muestra "ELIMINANDO..."
 */
export default function ConfirmModal({
  icon: Icon,
  titulo,
  pregunta,
  advertencias = [],
  labelConfirmar = 'CONFIRMAR',
  onCerrar,
  onConfirmar,
  cargando = false,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-5">
      <div
        className="flex flex-col border border-[#0D2647] bg-[#061628]"
        style={{ width: 618, height: 339, borderRadius: 20 }}
      >

        {/* ── Header — idéntico al de FormModal ───────────────────────────── */}
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
            disabled={cargando}
            className="flex items-center justify-center rounded-[8px] bg-[#0A1E38] border border-[#1A3A5C] hover:opacity-75 transition-opacity flex-shrink-0 disabled:opacity-40"
            style={{ width: 32, height: 30 }}
          >
            <X size={16} className="text-[#7A9EC4]" />
          </button>

        </div>

        {/* Divider */}
        <div className="h-px bg-[#1A3A5C] flex-shrink-0" />

        {/* ── Cuerpo ──────────────────────────────────────────────────────── */}
        <div className="flex-1 px-6 py-5 flex flex-col justify-center gap-4">

          {/* Pregunta principal */}
          <p
            className="font-[Montserrat] font-extrabold text-[#DAEBFF]"
            style={{ fontSize: 19 }}
          >
            {pregunta}
          </p>

          {/* Bloque de advertencias */}
          {advertencias.length > 0 && (
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="text-[#2D547E] flex-shrink-0 mt-0.5"
                style={{ width: 20, height: 21 }}
              />
              <div className="flex flex-col gap-0.5">
                {advertencias.map((linea, i) => (
                  <p
                    key={i}
                    className="font-jetbrains font-bold text-[#2D547E]"
                    style={{ fontSize: 14 }}
                  >
                    {linea}
                  </p>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Divider */}
        <div className="h-px bg-[#1A3A5C] flex-shrink-0" />

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0">

          {/* Cancelar */}
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="flex items-center justify-center rounded-[8px] bg-[#061628] border border-[#1A3A5C] font-jetbrains font-bold text-[#2D547E] hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ width: 103, height: 42, fontSize: 13 }}
          >
            CANCELAR
          </button>

          {/* Eliminar / Confirmar */}
          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className="flex items-center justify-center gap-2 rounded-[8px] font-jetbrains font-bold text-white hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ width: 143, height: 42, fontSize: 10, backgroundColor: '#642323' }}
          >
            {!cargando && <Trash2 size={14} color="white" strokeWidth={2.5} />}
            {cargando ? 'ELIMINANDO...' : labelConfirmar}
          </button>

        </div>
      </div>
    </div>
  )
}

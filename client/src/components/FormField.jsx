// Campo de formulario reutilizable para todos los modales de MERCI.
// Soporta: text, email, password (con toggle ojo), select (con arrow custom).

import { useState } from 'react'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'

/**
 * @param {string}    label         - Etiqueta del campo (se muestra en MAYÚSCULAS)
 * @param {string}    type          - 'text' | 'email' | 'password' | 'select'
 * @param {string}    placeholder   - Texto placeholder
 * @param {string}    value         - Valor controlado
 * @param {Function}  onChange      - Handler: (e) => void
 * @param {Array}     options       - [{ value, label }] — solo para type="select"
 * @param {string}    hint          - Texto de ayuda debajo del campo (opcional)
 * @param {Component} hintIcon      - Ícono Lucide para el hint (opcional)
 * @param {string}    className     - Clases adicionales para el wrapper
 * @param {string}    name          - Atributo name del input
 * @param {string}    autoComplete  - Atributo autocomplete
 */
export default function FormField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  options = [],
  hint,
  hintIcon: HintIcon,
  className = '',
  name,
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false)

  // Clases base — compartidas por todos los inputs del sistema
  const base = [
    'w-full h-[42px] px-3',
    'rounded-[8px]',
    'bg-[#040F1E]',
    'border border-[#1A3A5C]',
    'font-jetbrains font-bold text-[10px]',
    'text-[#DAEBFF]',
    'placeholder:text-[#5D5D5D] placeholder:font-bold',
    'outline-none',
    'focus:border-[#1667F4]',
    'transition-colors duration-200',
  ].join(' ')

  return (
    <div className={`flex flex-col gap-[7px] ${className}`}>

      {/* Label */}
      <label className="font-jetbrains font-bold text-[13px] text-[#2D547E] uppercase tracking-wide">
        {label}
      </label>

      {/*  Password */}
      {type === 'password' && (
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder ?? '••••••••'}
            value={value}
            onChange={onChange}
            name={name}
            autoComplete={autoComplete ?? 'off'}
            className={`${base} pr-10`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D547E] hover:text-[#DAEBFF] transition-colors"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      )}

      {/* Select */}
      {type === 'select' && (
        <div className="relative">
          <select
            value={value}
            onChange={onChange}
            name={name}
            className={`${base} appearance-none pr-8 cursor-pointer`}
            style={{ colorScheme: 'dark' }}
          >
            <option
              value=""
              disabled
              style={{ backgroundColor: '#040F1E', color: '#5D5D5D' }}
            >
              {placeholder}
            </option>
            {options.map(opt => (
              <option
                key={opt.value}
                value={opt.value}
                style={{ backgroundColor: '#040F1E', color: '#DAEBFF' }}
              >
                {opt.label}
              </option>
            ))}
          </select>
          {/* Flecha custom — reemplaza la nativa */}
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D547E] pointer-events-none"
          />
        </div>
      )}

      {/* Text / Email */}
      {(type === 'text' || type === 'email') && (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
          autoComplete={autoComplete}
          className={base}
        />
      )}

      {/* Hint */}
      {hint && (
        <div className="flex items-center gap-1.5">
          {HintIcon && (
            <HintIcon size={15} className="text-[#2D547E] flex-shrink-0" />
          )}
          <span className="font-jetbrains font-bold text-[10px] text-[#2D547E]">
            {hint}
          </span>
        </div>
      )}

    </div>
  )
}

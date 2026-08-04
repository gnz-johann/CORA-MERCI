// Avatar de usuario con iniciales y color determinista.
// El mismo usuarioId → el mismo color siempre, en cualquier tabla o componente.

import { Lock } from 'lucide-react'
import { getAvatarGradient } from '../utils/avatarColor'

/**
 * @param {string}  usuarioId - UUID del usuario (determina el color)
 * @param {string}  nombre    - Nombre completo (determina las iniciales)
 * @param {string}  size      - 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} bloqueado - Muestra un ícono de candado si es true
 */
export default function UserAvatar({
  usuarioId,
  nombre,
  size     = 'md',
  bloqueado = false,
}) {
  // Iniciales: primera letra de cada palabra (máx. 2)
  const initials = nombre
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?'

  const gradient = getAvatarGradient(usuarioId)

  const sizeClasses = {
    sm: { wrapper: 'w-8 h-8 text-xs rounded-lg',    lock: 'w-3.5 h-3.5' },
    md: { wrapper: 'w-9 h-9 text-sm rounded-xl',    lock: 'w-4 h-4'     },
    lg: { wrapper: 'w-12 h-12 text-base rounded-2xl',lock: 'w-5 h-5'    },
    xl: { wrapper: 'w-[70px] h-[70px] text-2xl rounded-2xl', lock: 'w-5 h-5' },
  }

  const { wrapper, lock } = sizeClasses[size] || sizeClasses.md

  return (
    <div className="relative shrink-0">
        <div className={`${wrapper} relative overflow-hidden flex items-center justify-center font-bold text-white shadow-lg`}
        style={{background: `radial-gradient(circle at 30% 25%, ${gradient.light} 0%, ${gradient.base} 45%, ${gradient.dark} 100%)`,}}>
        <div
            className="absolute inset-0 opacity-20"
            style={{
            background:
                'linear-gradient(135deg, rgba(255,255,255,.45), transparent 55%)',
            }}
        />

        <span className="relative z-10">
            {initials}
        </span>
        </div>

      {bloqueado && (
        <div
          className={`absolute -bottom-1 -right-1 ${lock} rounded-full bg-rose-500 border-2 border-[#061628] flex items-center justify-center`}
        >
          <Lock size={8} className="text-white" />
        </div>
      )}
    </div>
  )
}

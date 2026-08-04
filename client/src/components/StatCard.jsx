// Card de métrica reutilizable para páginas con dashboards de estadísticas.
// Uso: Usuarios, Dashboard, Sucursales, y cualquier página con KPIs.

/**
 * @param {string}    titulo      - Etiqueta superior (en mayúsculas automáticamente)
 * @param {any}       valor       - Número principal. null/undefined → muestra "—"
 * @param {string}    descripcion - Texto inferior (ej. "+3 este mes", "Sesión abierta")
 * @param {Component} icon        - Ícono Lucide para mostrar en la esquina superior derecha
 * @param {string}    iconBg      - Clases Tailwind para el fondo del contenedor del ícono
 * @param {string}    iconColor   - Clase Tailwind para el color del ícono
 * @param {string}    descColor   - Clase Tailwind para el color de `descripcion`
 * @param {boolean}   cargando    - Muestra skeleton animado en lugar del valor
 */
export default function StatCard({
  titulo,
  valor,
  descripcion,
  icon: Icon,
  iconBg    = 'bg-[#0A1E38] border-[#1A3A5C]',
  iconColor = 'text-[#155EEF]',
  descColor = 'text-[#155EEF]',
  cargando  = false,
}) {
  const renderValor = () => {
    if (cargando) {
      return <div className="h-7 w-14 rounded-lg bg-[#0A1E38] animate-pulse" />
    }
    if (valor === null || valor === undefined) {
      return <span className="text-2xl font-bold text-[#2C4E6D] font-['JetBrains_Mono']">—</span>
    }
    return <span className="text-2xl font-bold text-slate-100 font-['JetBrains_Mono']">{valor}</span>
  }

  return (
    <div className="relative rounded-2xl border border-[#0D2647] bg-[#061628] p-4 overflow-hidden font-['JetBrains_Mono']">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#2C4E6D] font-bold leading-tight">
          {titulo}
        </p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
      </div>
      <div className="mt-2">{renderValor()}</div>
      <p className={`mt-1.5 text-xs font-semibold ${descColor}`}>{descripcion}</p>

      {/* Línea gradiente azul #155EEF, opacidad al 100% para más brillo */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#155EEF] to-transparent opacity-100" />
    </div>
  )
}
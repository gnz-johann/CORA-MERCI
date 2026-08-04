// src/pages/Sucursales.jsx
import { useState, useEffect, useCallback } from 'react'
import { sucursalesService } from '../services/usuarios.service'
import ModalSucursal from '../components/ModalSucursal'
import ModalConfirmarEliminar from '../components/ModalConfirmarEliminar'

// RUTAS DE ÍCONOS SIMULADAS — reemplaza por tus archivos reales de la carpeta:
import IconSearch from '../assets/iconos_vistas/administracion/icono_buscar.svg?react'
import IconPlus from '../assets/iconos_vistas/globales/crear.svg?react'
import IconSucursal from '../assets/iconos_vistas/administracion/sucursales.svg?react'
import IconPin from '../assets/iconos_vistas/administracion/ubicacion.svg?react'
import IconPhone from '../assets/iconos_vistas/administracion/modulo_extensiones.svg?react'
import IconMail from '../assets/iconos_vistas/administracion/correo.svg?react'
import IconEdit from '../assets/iconos_vistas/globales/boton_editar_crud.svg?react'
import IconEliminar from '../assets/iconos_vistas/globales/boton_eliminar_crud.svg?react'

function Sucursales() {
  const [sucursales, setSucursales] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [sucursalEnEdicion, setSucursalEnEdicion] = useState(null)
  const [sucursalAEliminarId, setSucursalAEliminarId] = useState(null)

  // ─── Carga de datos (sin cambios respecto al original) ──────────────────────

  const cargarSucursales = useCallback(async () => {
    try {
      setCargando(true)
      const res = await sucursalesService.listar(busqueda)
      setSucursales(res.data.sucursales || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [busqueda])

  useEffect(() => { cargarSucursales() }, [cargarSucursales])

  // ─── Acciones ────────────────────────────────────────────────────────────────

  const abrirModalCrear = () => {
    setModoModal('crear')
    setSucursalEnEdicion(null)
    setModalAbierto(true)
  }

  const abrirModalEditar = async (sucursal) => {
    try {
      // Se pide el detalle completo (igual que en el original) por si listar()
      // no trae todos los campos que sí necesita el formulario de edición.
      const res = await sucursalesService.obtener(sucursal.id)
      setSucursalEnEdicion(res.data.sucursal)
      setModoModal('editar')
      setModalAbierto(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const guardarModal = async (datos) => {
    if (modoModal === 'crear') {
      await sucursalesService.crear(datos)
    } else {
      await sucursalesService.editar(sucursalEnEdicion.id, datos)
    }
    await cargarSucursales()
  }

  const pedirEliminarSucursal = (id) => {
    setSucursalAEliminarId(id)
  }

  const eliminarSucursalConfirmado = async () => {
    if (!sucursalAEliminarId) return

    try {
      await sucursalesService.eliminar(sucursalAEliminarId)
      setSucursalAEliminarId(null)
      cargarSucursales()
    } catch (err) {
      setError(err.message)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Fila superior: buscador + contador + botón crear */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A9EC4]" />
          <input
            type="text"
            placeholder="Buscar sucursal..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#0D2647] bg-[#061628] outline-none text-sm text-white font-mono font-bold placeholder:text-[#2C4E6D] focus:border-[#1667F4] transition-colors"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 h-11 px-4 rounded-xl border border-[#0D2647] bg-[#061628] font-mono font-bold text-[11px] text-[#2C4E6D]">
          TOTAL SUCURSALES: <span className="text-[#2C4E6Ds] font-bold">{sucursales.length}</span>
        </div>

        <button
          type="button"
          onClick={abrirModalCrear}
          className="h-11 px-5 rounded-xl bg-[#1667F4] flex items-center gap-2 font-jetbrains font-extrabold text-[13px] text-white hover:brightness-110 transition"
        >
          <IconPlus className="w-5 h-5" />
          NUEVA SUCURSAL
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444] font-montserrat">
          {error}
        </div>
      )}

      {/* Lista de sucursales — cards apiladas */}
      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-[#1667F4] border-t-transparent animate-spin" />
        </div>
      ) : sucursales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#7A9EC4]">
          <IconSucursal className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-montserrat text-sm">
            {busqueda ? 'No hay sucursales que coincidan' : 'No hay sucursales registradas'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sucursales.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-[#0D2647] bg-[#061628] px-5 py-4 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-[#0A1E38] border border-[#1A3A5C] flex items-center justify-center flex-shrink-0">
                <IconSucursal className="w-5 h-5 text-[#1667F4]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-syne font-bold text-white text-base truncate">{s.nombre}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <IconPin className="w-3 h-3 text-[#1667F4] flex-shrink-0" />
                  <p className="font-mono font-bold text-[13px] text-[#2C4E6D] truncate">
                    {s.direccion || 'Sin dirección registrada'}
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 w-48 flex-shrink-0">
                <IconPhone className="w-3.5 h-3.5 text-[#1667F4] flex-shrink-0" />
                <p className="font-jetbrains text-[12px] text-[#3B82F6] truncate">
                  {s.telefono || '—'}
                </p>
              </div>

              <div className="hidden lg:flex items-center gap-2 w-56 flex-shrink-0">
                <IconMail className="w-3.5 h-3.5 text-[#1667F4] flex-shrink-0" />
                <p className="font-jetbrains text-[12px] text-[#3B82F6] truncate">
                  {s.correo || '—'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => abrirModalEditar(s)}
                  className="w-9 h-9 rounded-lg border border-[#0D2647] flex items-center justify-center text-[#1667F4] hover:border-[#1667F4] transition-colors"
                  title="Editar sucursal"
                >
                  <IconEdit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => pedirEliminarSucursal(s.id)}
                  className="w-9 h-9 rounded-lg border border-[#642323] bg-[#642323]/20 flex items-center justify-center text-[#CE0000] hover:bg-[#642323]/40 transition-colors"
                  title="Eliminar sucursal"
                >
                  <IconEliminar className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalSucursal
        isOpen={modalAbierto}
        modo={modoModal}
        sucursalInicial={sucursalEnEdicion}
        onClose={() => setModalAbierto(false)}
        onGuardar={guardarModal}
      />
      <ModalConfirmarEliminar
        isOpen={!!sucursalAEliminarId}
        nombre="Sucursal"
        genero="f"
        onClose={() => setSucursalAEliminarId(null)}
        onConfirmar={eliminarSucursalConfirmado}
      />
    </div>
  )
}

export default Sucursales

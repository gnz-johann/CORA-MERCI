import { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { tokenStorage } from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  // Restaurar sesión al recargar la página
  // Llama /me para obtener el usuario COMPLETO con permisos desde el JWT
  useEffect(() => {
    const restaurarSesion = async () => {
      const refreshToken = tokenStorage.getRefresh()
      if (!refreshToken) {
        setCargando(false)
        return
      }
      try {
        const res = await api.post('/auth/refresh', { refreshToken })
        tokenStorage.setAccess(res.data.accessToken)
        const meRes = await api.get('/auth/me')
        setUsuario(meRes.data.usuario) // incluye permisos, sucursalId, roles, esGlobal
      } catch {
        tokenStorage.clearAll()
      } finally {
        setCargando(false)
      }
    }
    restaurarSesion()
  }, [])

  // Manejar expiración de sesión (evento lanzado por api.js)
  useEffect(() => {
    const manejarExpiracion = () => {
      setUsuario(null)
      navigate('/login')
    }
    window.addEventListener('merci:sesion-expirada', manejarExpiracion)
    return () => window.removeEventListener('merci:sesion-expirada', manejarExpiracion)
  }, [navigate])

  /**
   * Login: guarda tokens y llama /me para obtener el usuario completo.
   * IMPORTANTE: el response de /login no incluye permisos — /me sí.
   * Sin este paso, el sidebar no puede filtrar por permisos.
   */
  const login = useCallback(async ({ usuario: nombreUsuario, password, codigoAcceso }) => {
    const res = await api.post('/auth/login', {
      usuario:      nombreUsuario,
      password,
      codigoAcceso: codigoAcceso || undefined,
    })
    tokenStorage.setAccess(res.data.accessToken)
    tokenStorage.setRefresh(res.data.refreshToken)

    // Obtener usuario completo con permisos desde /me
    const meRes = await api.get('/auth/me')
    const usuarioCompleto = meRes.data.usuario
    setUsuario(usuarioCompleto)
    return usuarioCompleto
  }, [])

  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefresh()
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch {
      // Si falla en servidor, limpiamos igual
    } finally {
      tokenStorage.clearAll()
      setUsuario(null)
      navigate('/login')
    }
  }, [navigate])

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

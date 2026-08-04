// src/services/api.js
// Cliente HTTP base para comunicarse con el backend MERCI.
// Maneja automáticamente:
//   - El header Authorization con el access token
//   - El reintento con refresh token si el servidor devuelve 401
//   - El formato de respuesta { ok, mensaje, data } del backend
//
// FIX: renovarToken usa un singleton promise para evitar la race condition
// donde múltiples requests simultáneos con 401 destruyen el token recién renovado.

const BASE_URL = '/api'

// ─── Almacenamiento de tokens ─────────────────────────────────────────────────

let accessToken = null

export const tokenStorage = {
  getAccess:    () => accessToken,
  setAccess:    (token) => { accessToken = token },
  clearAccess:  () => { accessToken = null },

  getRefresh: () => localStorage.getItem('merci_refresh'),
  setRefresh: (token) => localStorage.setItem('merci_refresh', token),
  clearRefresh: () => localStorage.removeItem('merci_refresh'),

  clearAll: () => {
    accessToken = null
    localStorage.removeItem('merci_refresh')
  },
}

// ─── Singleton de refresh ─────────────────────────────────────────────────────
// Solo un refresh por vez. Si ya hay uno en curso, todos los que lleguen
// esperan el mismo promise en lugar de lanzar requests adicionales al backend.
// Esto evita la race condition donde 4 requests simultáneos con 401
// destruyen el token que el primero acaba de obtener.

let refreshingPromise = null

async function renovarToken(refreshToken) {
  if (refreshingPromise) return refreshingPromise

  refreshingPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.ok && data.data?.accessToken) {
        tokenStorage.setAccess(data.data.accessToken)
        return true
      }
      return false
    })
    .catch(() => false)
    .finally(() => {
      // Liberar el lock para que futuros refreshes puedan ejecutarse
      refreshingPromise = null
    })

  return refreshingPromise
}

// ─── Función base de fetch ────────────────────────────────────────────────────

async function request(endpoint, options = {}, retry = true) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // 401 → intentar renovar sesión (solo en el primer intento, retry=true)
  if (response.status === 401 && retry) {
    const refreshToken = tokenStorage.getRefresh()

    if (refreshToken) {
      const renovado = await renovarToken(refreshToken)
      if (renovado) {
        // Reintentar con el nuevo token ya seteado en memoria
        return request(endpoint, options, false)
      }
    }

    // No se pudo renovar → sesión expirada
    tokenStorage.clearAll()
    window.dispatchEvent(new Event('merci:sesion-expirada'))
    throw new Error('Sesión expirada')
  }

  const data = await response.json()

  if (!data.ok) {
    const error = new Error(data.mensaje || 'Error desconocido')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// ─── Métodos HTTP públicos ────────────────────────────────────────────────────

export const api = {
  get: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body:   JSON.stringify(body),
    }),

  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'PUT',
      body:   JSON.stringify(body),
    }),

  patch: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'PATCH',
      body:   JSON.stringify(body),
    }),

  delete: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: 'DELETE' }),
}

export default api
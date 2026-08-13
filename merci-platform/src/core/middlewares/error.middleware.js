const AppError = require('../errors/AppError')

// Handler global — debe registrarse ÚLTIMO en app.js
// Atrapa cualquier error que llegue via next(error)
const errorHandler = (err, req, res, next) => {
    // Si es un error operacional conocido, mostrar el mensaje.
    // `categoria` solo la traen los errores de cloudUCMErrors.js
    // ('conexion'|'validacion'|'sistema') — se agrega si está presente, sin
    // afectar la forma de respuesta de ningún otro AppError existente.
    if (err instanceof AppError) {
        // Antes solo se logueaban los 500 no controlados de más abajo — un
        // AppError categorizado (ej. falla de conexión con CloudUCM) nunca
        // dejaba rastro en la terminal del servidor, aunque sí llegara bien
        // al cliente. Se loguea aparte de los AppError "normales" (404, 400
        // de validación, etc.) para no llenar la terminal de ruido en casos
        // esperados del día a día — solo los que ya vienen categorizados.
        if (err.categoria) {
        console.error(`Error categorizado (${err.categoria}):`, err.message, err)
        }

        return res.status(err.statusCode).json({
        ok: false,
        mensaje: err.message,
        ...(err.categoria && { categoria: err.categoria }),
        })
    }

    // Error de Prisma: registro no encontrado
    if (err.code === 'P2025') {
        return res.status(404).json({
        ok: false,
        mensaje: 'Registro no encontrado',
        })
    }

    // Error de Prisma: violación de constraint único
    if (err.code === 'P2002') {
        return res.status(409).json({
        ok: false,
        mensaje: 'Ya existe un registro con esos datos',
        })
    }

    // Error inesperado — no exponemos detalles al cliente
    if (process.env.NODE_ENV === 'development') {
        console.error('ERROR NO CONTROLADO:', err)
        return res.status(500).json({
        ok: false,
        mensaje: err.message,
        stack: err.stack,
        })
    }

    console.error('ERROR NO CONTROLADO:', err)
    return res.status(500).json({
        ok: false,
        mensaje: 'Error interno del servidor',
    })
}

module.exports = errorHandler
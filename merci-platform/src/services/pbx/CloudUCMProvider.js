const axios = require('axios')
const crypto = require('crypto')
const https = require('https')
const IPBXProvider = require('./IPBXProvider')
const prisma = require('../../config/database')
const { crearErrorCloudUCM } = require('./cloudUCMErrors')
const AppError = require('../../core/errors/AppError')
// Mismo mecanismo de cifrado que credenciales_ia — configuraciones_pbx.credenciales
// se guarda cifrado (ver pbx.repository.js), hay que descifrarlo aquí antes de usarlo.
const { descifrar } = require('../../core/utils/credencialesIA.crypto')

// Agente HTTPS que acepta certificados autofirmados
// CloudUCM en redes locales usa certificados no verificados
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

// Hash MD5 — función utilitaria
const md5 = (value) =>
    crypto.createHash('md5').update(value).digest('hex')

// ─── FIX [Fase 1]: migración de GET /cgi (legacy) a POST /api (formato oficial) ──
//
// DIAGNÓSTICO CONFIRMADO EN PRUEBAS REALES (2026-07-21):
//   El endpoint legacy GET /cgi?action=... respondía el "challenge" con status 0
//   para CUALQUIER usuario (incluso uno recién creado, con permisos "All",
//   contraseña verificada carácter por carácter contra el panel), pero el
//   "login" SIEMPRE fallaba con status -37 "Wrong account or password!".
//   Se probó exactamente el mismo usuario/contraseña/challenge con el formato
//   oficial de la documentación (POST + JSON a /api) y el login funcionó al
//   primer intento (status 0 + cookie real).
//
//   Conclusión: en CloudUCM hosted, los usuarios creados en
//   "Integrations > API Configuration > HTTPS API Settings (New)" solo se
//   validan contra el endpoint NUEVO (POST /api con body JSON). El endpoint
//   viejo (GET /cgi) es el mecanismo legacy y no los reconoce para login,
//   aunque sí responda el challenge de forma genérica.
//
// Por eso: todas las requests ahora son POST a `${baseUrl}/api` con el body
// envuelto en { request: {...} }, tal como documenta el manual oficial de
// Grandstream (IPPBX-HTTPS-API-Documentation-Center). Se agrega además el
// parámetro "version" en el challenge, tal como recomienda esa misma doc.
//
// La respuesta llega también en la forma { response: {...}, status: N },
// igual que antes — por eso el resto de los métodos (getExtensions, getCDR,
// etc.) no necesitaron cambios en cómo LEEN la respuesta, solo en cómo se
// ENVÍA la request.
const API_VERSION = '1.0'

class CloudUCMProvider extends IPBXProvider {
    constructor() {
        super()
        this.baseUrl = null
        this.usuario = null
        this.cookie = null   // Cookie de sesión activa
        this.expiresAt = null   // Timestamp de expiración de sesión
    }

    /**
     * Autenticación MD5 en dos pasos (formato oficial POST + JSON, verificado
     * contra UCM hosted real el 2026-07-21):
     * 1. POST /api  { request: { action: 'challenge', user, version } }
     * 2. POST /api  { request: { action: 'login', user, token } }
     *    donde token = MD5(challenge + password)
     *
     * Lee credenciales desde configuraciones_pbx en BD (Prisma)
     * @param {string} empresaId - UUID de la empresa
     */
    async connect(empresaId) {
        // Leer configuración PBX de la empresa desde BD
        const config = await prisma.configuraciones_pbx.findFirst({
        where: {
            empresa_id: empresaId,
            activo: true,
            deleted_at: null,
        },
        })

        // Ambos casos de abajo son fallas de conexión desde la perspectiva de
        // quien usa este provider (no hay forma de hablar con CloudUCM sin
        // esto) — se marcan con categoria: 'conexion', igual que los status
        // numéricos de CloudUCM, aunque no vengan de una respuesta de la API
        // (todavía no se llegó a llamarla).
        if (!config) {
        const err = new AppError('No existe configuración PBX activa para esta empresa. Configúrala en Configuración → PBX.', 502)
        err.categoria = 'conexion'
        throw err
        }

        this.baseUrl = config.api_url.replace(/\/$/, '')
        this.usuario = config.api_usuario

        // config.credenciales viene cifrado (AES-256-GCM, ver pbx.repository.js)
        // — descifrar antes de leer la contraseña. Si el descifrado falla
        // (dato corrupto o cifrado con una clave distinta a la actual), no se
        // debe dejar pasar en silencio: se trata como falla de conexión.
        let credencialesDescifradas
        try {
        credencialesDescifradas = descifrar(config.credenciales)
        } catch {
        const err = new AppError('No se pudieron leer las credenciales guardadas de la central telefónica. Reconfigura la conexión en Configuración → PBX.', 502)
        err.categoria = 'conexion'
        throw err
        }

        // Obtener password desde las credenciales ya descifradas
        const apiPassword = credencialesDescifradas?.password

        if (!apiPassword) {
        const err = new AppError('No se encontró la contraseña de la central telefónica en la configuración. Revísala en Configuración → PBX.', 502)
        err.categoria = 'conexion'
        throw err
        }

        // Paso 1: obtener challenge — POST + JSON a /api (formato oficial)
        const challengeRes = await axios.post(
        `${this.baseUrl}/api`,
        { request: { action: 'challenge', user: this.usuario, version: API_VERSION } },
        { httpsAgent }
        )

        // Nunca debe llegar un status crudo de CloudUCM hasta el controller —
        // se traduce a categoría + mensaje en español antes de lanzar.
        if (challengeRes.data?.status !== 0) {
        throw crearErrorCloudUCM(challengeRes.data?.status)
        }

        const challenge = challengeRes.data?.response?.challenge

        if (!challenge) {
        throw new Error('CloudUCM no devolvió challenge en la respuesta')
        }

        // Paso 2: login con token MD5(challenge + password) — POST + JSON a /api
        // NOTA: el orden correcto es challenge + password (confirmado contra
        // la documentación oficial de Grandstream y contra el UCM real)
        const token = md5(challenge + apiPassword)

        const loginRes = await axios.post(
        `${this.baseUrl}/api`,
        { request: { action: 'login', user: this.usuario, token } },
        { httpsAgent }
        )

        if (loginRes.data?.status !== 0) {
        throw crearErrorCloudUCM(loginRes.data?.status)
        }

        // Guardar cookie y tiempo de expiración
        // NOTA: la doc oficial indica que la cookie expira a los 10 minutos
        // (no 30). Se ajusta el margen a 9 min para renovar con colchón antes
        // de que el UCM la invalide.
        this.cookie    = loginRes.data?.response?.cookie
        this.expiresAt = Date.now() + (9 * 60 * 1000) // 9 minutos (cookie real expira en 10)

        return {
        status:   loginRes.data?.status,
        response: loginRes.data?.response,
        cookie:   this.cookie,
        }
    }

    /**
     * Reconecta si la sesión expiró
     * @param {string} empresaId
     */
    async _ensureSession(empresaId) {
        if (!this.cookie || Date.now() >= this.expiresAt) {
        await this.connect(empresaId)
        }
    }

    /**
     * Ejecuta una request autenticada contra CloudUCM — POST + JSON a /api,
     * incluyendo la cookie de sesión dentro del body (formato oficial),
     * no como header.
     *
     * Punto único de chequeo de status para todos los métodos que la usan
     * (getExtensions, getCDR, transferCall, ping, addSIPAccountAndUser,
     * applyChanges): si CloudUCM responde un status != 0, se traduce a
     * categoría + mensaje en español (cloudUCMErrors.js) y se lanza — nunca
     * se devuelve un status crudo de Grandstream a quien llamó.
     *
     * @param {string} action - acción a ejecutar (ej. 'listAccount', 'cdrapi')
     * @param {Object} params - parámetros adicionales de la acción
     */
    async _request(action, params = {}) {
        const res = await axios.post(
        `${this.baseUrl}/api`,
        { request: { action, cookie: this.cookie, ...params } },
        { httpsAgent }
        )

        if (res.data?.status !== 0) {
        // El error ya categorizado (cloudUCMErrors.js) es lo que se lanza,
        // pero antes de eso el dato crudo completo (acción, status, response)
        // siempre queda en el log del servidor — sin esto no había forma de
        // saber, viendo solo el mensaje traducido, qué mandó CloudUCM de
        // verdad.
        console.error('CloudUCM respondió status != 0:', {
            action,
            status:   res.data?.status,
            response: res.data?.response,
        })
        throw crearErrorCloudUCM(res.data?.status)
        }

        return res.data
    }

    /**
     * Lista extensiones registradas en el UCM
     * Equivalente a ucm.service.js → listarExtensionesUcm()
     * @param {string} empresaId
     */
    async getExtensions(empresaId) {
        await this._ensureSession(empresaId)

        const res = await this._request('listAccount')

        return {
        status:      res?.status,
        total:       res?.response?.account?.length || 0,
        extensiones: res?.response?.account || [],
        }
    }

    /**
     * Obtiene CDR (registros de llamadas) del UCM
     * Equivalente a ucm.service.js → obtenerCdr()
     * @param {string} empresaId
     * @param {Object} filtros - { numRecords, offset }
     */
    async getCDR(empresaId, filtros = {}) {
        await this._ensureSession(empresaId)

        const res = await this._request('cdrapi', {
        format:     'json',
        numRecords: filtros.numRecords || 50,
        offset:     filtros.offset    || 0,
        })

        return {
        status: res?.status,
        raw: res,
        registros: res?.response?.cdr_root
                    || res?.response?.cdr
                    || res?.cdr_root
                    || [],
        }
    }

    /**
     * Transfiere una llamada activa a una extensión
     * @param {string} empresaId
     * @param {string} callId   - ID de la llamada en UCM
     * @param {string} destino  - Extensión destino
     */
    async transferCall(empresaId, callId, destino) {
        await this._ensureSession(empresaId)
        return this._request('transfer', { callid: callId, to: destino })
    }

    /**
     * Obtiene grabación de una llamada bajo demanda (recapi)
     *
     * OJO [pendiente Fase 2]: la doc oficial de recapi (CDR/REC API Guide)
     * indica que los parámetros son `filedir` y `filename`, no `callid`.
     * Este método se deja funcionalmente igual que antes (por callId) porque
     * cambiar la firma es una decisión de Fase 2 (contrato real de grabación),
     * no de este fix de Fase 1 (formato del endpoint). Ver runbook.
     *
     * recapi además devuelve el binario directamente (no JSON), así que no
     * puede usar _request() (que asume JSON) — se mantiene con axios directo,
     * ahora vía POST /api en vez de GET /cgi.
     *
     * @param {string} empresaId
     * @param {string} callId
     * @returns {Promise<Buffer>}
     */
    async getRecording(empresaId, callId) {
        await this._ensureSession(empresaId)

        const res = await axios.post(
        `${this.baseUrl}/api`,
        { request: { action: 'recapi', cookie: this.cookie, callid: callId } },
        { httpsAgent, responseType: 'arraybuffer' }
        )

        // No puede usar _request() porque responseType es 'arraybuffer', no
        // JSON — pero si algo falla, CloudUCM responde JSON (con status != 0)
        // en vez del binario del audio. Hay que detectarlo antes de tratar la
        // respuesta como si fuera audio real.
        const contentType = res.headers?.['content-type'] || ''
        if (contentType.includes('application/json')) {
        const parseado = JSON.parse(Buffer.from(res.data).toString('utf8'))
        if (parseado?.status !== 0) {
            throw crearErrorCloudUCM(parseado?.status)
        }
        }

        return Buffer.from(res.data)
    }

    /**
     * Crea una extensión SIP nueva en CloudUCM (Extension → Add
     * SIPAccountAndUser de la doc oficial). Los parámetros soportados son
     * los mismos que `updateSIPAccount` — solo `extension` es obligatorio
     * (2-18 dígitos), el resto se pasa tal cual venga en `datos`.
     *
     * OJO: este método NO aplica los cambios — si CloudUCM responde
     * `need_apply: 'yes'`, hace falta llamar a `applyChanges()` con la misma
     * sesión para que el cambio tome efecto de verdad. Esa decisión es de
     * quien llama (ver extensiones.service.js), no de este método.
     *
     * @param {string} empresaId
     * @param {Object} datos - { extension, secret?, cidnumber?, permission?, ... }
     * @returns {Promise<{needApply: boolean}>}
     */
    async addSIPAccountAndUser(empresaId, datos) {
        await this._ensureSession(empresaId)

        if (!datos?.extension) {
        throw crearErrorCloudUCM(-1) // Invalid parameters — extension es obligatorio
        }

        const res = await this._request('addSIPAccountAndUser', datos)

        return { needApply: res?.response?.need_apply === 'yes' }
    }

    /**
     * Aplica los cambios pendientes en CloudUCM (equivalente al botón
     * "Apply" del panel). Necesario después de crear/editar una extensión
     * cuando la respuesta trae `need_apply: 'yes'` — sin esto el cambio
     * queda guardado en CloudUCM pero no activo.
     *
     * @param {string} empresaId
     */
    async applyChanges(empresaId) {
        await this._ensureSession(empresaId)
        await this._request('applyChanges')
        return true
    }

    /**
     * Verifica que la conexión sigue activa
     * @param {string} empresaId
     */
    async ping(empresaId) {
        try {
        await this._ensureSession(empresaId)
        const res = await this._request('getSystemStatus')
        return res?.status === 0
        } catch {
        return false
        }
    }
}

module.exports = CloudUCMProvider
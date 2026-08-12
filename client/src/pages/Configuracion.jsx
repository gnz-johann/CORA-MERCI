import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Cpu,
  Cloud,
  Key,
  Save,
  ChevronDown,
  Eye,
  EyeOff,
  AlertTriangle,
  AlertCircle,
  X,
  CheckCircle2,
  XCircle,
  User
} from 'lucide-react';
import { configuracionService } from '../services/configuracion.service';

// Config IA por defecto mientras carga o si la empresa todavía no configuró
// nada (GET /configuracion/empresa responde data: null en ese caso) — mismos
// valores por defecto que usa la columna en Postgres (schema.prisma), para
// que el primer guardado coincida con lo que se habría creado de todos modos.
const DEFAULT_CONFIG_IA = {
  vozIa: 'Femenina',
  idioma: 'es',
  timeoutSeg: 30,
  temperaturaModelo: 0.7,
  proveedorSttId: null,
  proveedorTtsId: null,
  proveedorLlmId: null,
};

// PBX (Central Telefónica) — defaults mientras carga o si la empresa nunca
// configuró nada (GET /configuracion/pbx responde 404 en ese caso, a
// diferencia de GET /configuracion/empresa que responde data: null).
// Nombres en snake_case a propósito: así es como los devuelve el GET real.
const DEFAULT_CONFIG_PBX = {
  api_url: '',
  api_usuario: '',
  auth_tipo: 'md5_token',
};

// Catálogo de voces — no existe tabla catálogo para esto en el schema
// (voz_ia es un varchar libre), así que la lista de opciones sigue siendo
// una lista fija del lado del cliente, no mock de datos de negocio.
const catalogoVoces = ['Femenina', 'Masculina'];
const catalogoAuth = ['md5_token', 'basic', 'oauth2'];

const TIPOS_PROVEEDOR = [
  { tipo: 'stt', etiqueta: 'STT', campo: 'proveedorSttId', descripcion: 'Convierte voz del cliente a texto' },
  { tipo: 'tts', etiqueta: 'TTS', campo: 'proveedorTtsId', descripcion: 'Convierte texto a voz para el cliente' },
  { tipo: 'llm', etiqueta: 'LLM', campo: 'proveedorLlmId', descripcion: 'Motor de lenguaje usado para razonar' },
];

export default function ConfiguracionView() {
  // Estados principales de configuración
  const [configIA, setConfigIA] = useState(DEFAULT_CONFIG_IA);
  const [configPBX, setConfigPBX] = useState(DEFAULT_CONFIG_PBX);
  const [proveedores, setProveedores] = useState([]);

  // Estados de carga/guardado de Configuración IA (GET/PUT /configuracion/empresa)
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [guardando, setGuardando] = useState(false);

  // PBX — pbxExiste distingue "todavía no hay fila en configuraciones_pbx"
  // (GET responde 404) de "sí existe, solo falta actualizar campos". Sin
  // esto, "Guardar Cambios" podría mandar un PUT sin credenciales sobre una
  // empresa que nunca configuró nada — el backend exige credenciales para
  // crear la fila la primera vez, así que ese PUT fallaría. El primer
  // guardado real siempre pasa por el modal de credenciales (manda todo
  // junto: URL, usuario y contraseña).
  const [pbxExiste, setPbxExiste] = useState(false);
  const [probandoConexion, setProbandoConexion] = useState(false);
  const [guardandoCredenciales, setGuardandoCredenciales] = useState(false);

  // Estados de UI
  const [isVozDropdownOpen, setIsVozDropdownOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const [proveedorDropdownAbierto, setProveedorDropdownAbierto] = useState(null); // 'stt' | 'tts' | 'llm' | null
  const [isModalCredencialesOpen, setIsModalCredencialesOpen] = useState(false);

  // Estados del Modal
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sistema de Notificaciones (Toasts)
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  // Carga inicial: catálogo de proveedores + configuración IA de la empresa.
  // Si la empresa todavía no configuró nada, GET /configuracion/empresa
  // responde data: null — en ese caso se dejan los defaults tal cual.
  const cargarConfiguracion = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const [resProveedores, resEmpresa] = await Promise.all([
        configuracionService.listarProveedoresIA(),
        configuracionService.obtener(),
      ]);
      setProveedores(resProveedores.data ?? []);
      if (resEmpresa.data) {
        setConfigIA({ ...DEFAULT_CONFIG_IA, ...resEmpresa.data });
      }
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo cargar la configuración desde el servidor.');
    } finally {
      setCargando(false);
    }

    // PBX aparte, con su propio try/catch: GET /configuracion/pbx responde
    // 404 (no data: null) cuando la empresa nunca configuró nada — eso es
    // el estado esperado antes del primer guardado, no un error de carga.
    // No debe activar el banner de error general de arriba.
    try {
      const resPbx = await configuracionService.obtenerPbx();
      if (resPbx.data) {
        setConfigPBX({
          api_url: resPbx.data.api_url || '',
          api_usuario: resPbx.data.api_usuario || '',
          auth_tipo: resPbx.data.auth_tipo || 'md5_token',
        });
        setPbxExiste(true);
      }
    } catch {
      setConfigPBX(DEFAULT_CONFIG_PBX);
      setPbxExiste(false);
    }
  }, []);

  useEffect(() => { cargarConfiguracion(); }, [cargarConfiguracion]);

  const nombreProveedor = (id) => proveedores.find((p) => p.id === id)?.nombre || '— Sin configurar —';
  const proveedoresDeTipo = (tipo) => proveedores.filter((p) => p.tipo === tipo);

  // Manejo de la temperatura
  const handleTemperaturaChange = (e) => {
    setConfigIA({ ...configIA, temperaturaModelo: parseFloat(e.target.value) });
  };

  // Mostrar notificación
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };

  // Acciones de botones
  const handleGuardarCambios = async () => {
    setGuardando(true);
    try {
      const llamadas = [configuracionService.actualizar(configIA)];
      // Solo se manda el PUT de PBX si ya existe una fila — si nunca se
      // configuró, el backend exige credenciales para crearla y este botón
      // no las tiene (esas se mandan juntas desde el modal). Ver nota en
      // el estado `pbxExiste`.
      if (pbxExiste) {
        llamadas.push(configuracionService.guardarPbx({
          apiUrl: configPBX.api_url,
          apiUsuario: configPBX.api_usuario,
          authTipo: configPBX.auth_tipo,
        }));
      }

      const [resEmpresa] = await Promise.all(llamadas);
      setConfigIA({ ...DEFAULT_CONFIG_IA, ...resEmpresa.data });
      showToast('success', 'Configuración guardada exitosamente.');
    } catch (err) {
      showToast('error', err.message || 'No se pudo guardar la configuración.');
    } finally {
      setGuardando(false);
    }
  };

  const handleProbarConexion = async () => {
    setProbandoConexion(true);
    try {
      const res = await configuracionService.probarConexionPbx();
      showToast('success', res.data?.mensaje || res.mensaje || 'Conexión establecida correctamente.');
    } catch (err) {
      // err.message ya trae el mensaje real (categorizado por
      // cloudUCMErrors.js cuando aplica, ej. usuario/contraseña incorrectos,
      // timeout, etc.) — no uno genérico inventado aquí.
      showToast('error', err.message || 'No se pudo conectar con la central telefónica.');
    } finally {
      setProbandoConexion(false);
    }
  };

  const handleGuardarCredenciales = async () => {
    if (!configPBX.api_url.trim() || !configPBX.api_usuario.trim()) {
      showToast('error', 'Completa URL y Usuario API antes de guardar las credenciales.');
      return;
    }
    if (!password) {
      showToast('error', 'Ingresa una contraseña.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', 'Las contraseñas no coinciden.');
      return;
    }

    setGuardandoCredenciales(true);
    try {
      // Se manda todo junto (URL/usuario/tipo de auth + credenciales) — es
      // el único camino que sirve tanto para crear la fila la primera vez
      // como para solo rotar la contraseña después.
      await configuracionService.guardarPbx({
        apiUrl: configPBX.api_url,
        apiUsuario: configPBX.api_usuario,
        authTipo: configPBX.auth_tipo,
        credenciales: { password },
      });
      setPbxExiste(true);
      setIsModalCredencialesOpen(false);
      setPassword('');
      setConfirmPassword('');
      showToast('success', 'Credenciales guardadas correctamente.');
    } catch (err) {
      showToast('error', err.message || 'No se pudieron guardar las credenciales.');
    } finally {
      setGuardandoCredenciales(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#030914] text-white p-6 font-sans relative">

      {/* HEADER DE LA VISTA */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-wide">Configuración</h1>
      </div>

      {/* AVISO — GET /configuracion/empresa o /configuracion/proveedores-ia fallaron */}
      {errorCarga && (
        <div className="flex items-center gap-3 mb-6 px-5 py-3.5 rounded-xl border border-[#E11D48]/30 bg-[#3B0711]/60 text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{errorCarga}</p>
          <button
            onClick={cargarConfiguracion}
            className="ml-auto text-xs font-bold uppercase tracking-wider text-[#FDA4AF] hover:text-white underline underline-offset-2 shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL: APILAMIENTO VERTICAL */}
      <div className="flex flex-col gap-6">

        {/* PANEL SUPERIOR: CONFIGURACIÓN IA (Ancho completo) */}
        <div className="w-full bg-[#07152B] border border-[#132A4A] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#0B1E36] p-2 rounded-lg border border-[#16335C]">
              <Settings className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">Configuración IA</h2>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Comportamiento general de los agentes de voz</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* VOZ IA con Dropdown personalizado */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="w-1/3">
                <label className="text-sm font-semibold text-slate-200">Voz IA</label>
                <p className="text-[10px] text-slate-500 font-mono">Timbre usado por los agentes al hablar</p>
              </div>
              <div className="relative w-full sm:w-2/3">
                <button
                  onClick={() => setIsVozDropdownOpen(!isVozDropdownOpen)}
                  disabled={cargando}
                  className="w-full flex items-center justify-between bg-[#0B1E36] border border-[#16335C] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#1667F4] transition-colors disabled:opacity-50"
                >
                  <span>{configIA.vozIa}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Menú Desplegable */}
                {isVozDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-[#0B1E36] border border-[#16335C] rounded-lg shadow-2xl overflow-hidden z-10">
                    {catalogoVoces.map((voz) => (
                      <div
                        key={voz}
                        onClick={() => {
                          setConfigIA({ ...configIA, vozIa: voz });
                          setIsVozDropdownOpen(false);
                        }}
                        className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                          configIA.vozIa === voz
                            ? 'bg-[#1667F4] text-white font-medium'
                            : 'text-slate-300 hover:bg-[#132A4A]'
                        }`}
                      >
                        {voz}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* IDIOMA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="w-1/3">
                <label className="text-sm font-semibold text-slate-200">Idioma</label>
                <p className="text-[10px] text-slate-500 font-mono">Idioma base para reconocimiento</p>
              </div>
              <input
                type="text"
                value={configIA.idioma}
                onChange={(e) => setConfigIA({ ...configIA, idioma: e.target.value })}
                disabled={cargando}
                className="w-full sm:w-2/3 bg-[#0B1E36] border border-[#16335C] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#1667F4] transition-colors disabled:opacity-50"
              />
            </div>

            {/* TIMEOUT DE RESPUESTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="w-1/3">
                <label className="text-sm font-semibold text-slate-200">Timeout de respuesta</label>
                <p className="text-[10px] text-slate-500 font-mono">Segundos de espera máximo</p>
              </div>
              <input
                type="number"
                value={configIA.timeoutSeg}
                onChange={(e) => setConfigIA({ ...configIA, timeoutSeg: Number(e.target.value) })}
                disabled={cargando}
                className="w-full sm:w-2/3 bg-[#0B1E36] border border-[#16335C] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#1667F4] transition-colors disabled:opacity-50"
              />
            </div>

            {/* TEMPERATURA (Slider interactivo) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
              <div className="w-1/3">
                <label className="text-sm font-semibold text-slate-200">Temperatura</label>
                <p className="text-[10px] text-slate-500 font-mono">Creatividad del modelo (0 a 1)</p>
              </div>
              <div className="w-full sm:w-2/3 flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={configIA.temperaturaModelo}
                  onChange={handleTemperaturaChange}
                  disabled={cargando}
                  className="w-full h-1.5 bg-[#16335C] rounded-lg appearance-none cursor-pointer accent-[#1667F4] disabled:opacity-50"
                  style={{
                    background: `linear-gradient(to right, #1667F4 0%, #1667F4 ${configIA.temperaturaModelo * 100}%, #16335C ${configIA.temperaturaModelo * 100}%, #16335C 100%)`
                  }}
                />
                <span className="text-xs font-mono font-bold w-6">{configIA.temperaturaModelo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PANELES INFERIORES: PROVEEDORES Y PBX (Grid de 2 columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

          {/* TARJETA PROVEEDORES IA */}
          <div className="bg-[#07152B] border border-[#132A4A] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#0B1E36] p-2 rounded-lg border border-[#16335C]">
                <Cpu className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">Proveedores IA</h2>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Motores de inteligencia artificial</p>
              </div>
            </div>

            <div className="space-y-4">
              {TIPOS_PROVEEDOR.map(({ tipo, etiqueta, campo, descripcion }) => (
                <div key={tipo} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="w-1/3">
                    <label className="text-sm font-semibold text-slate-200">{etiqueta}</label>
                    <p className="text-[9px] text-slate-500 font-mono leading-tight">{descripcion}</p>
                  </div>
                  <div className="relative w-full sm:w-2/3">
                    <button
                      onClick={() => setProveedorDropdownAbierto(proveedorDropdownAbierto === tipo ? null : tipo)}
                      disabled={cargando}
                      className="w-full flex items-center justify-between bg-[#0B1E36] border border-[#16335C] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#1667F4] transition-colors disabled:opacity-50"
                    >
                      <span>{nombreProveedor(configIA[campo])}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {proveedorDropdownAbierto === tipo && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-[#0B1E36] border border-[#16335C] rounded-lg shadow-2xl overflow-hidden z-10">
                        {proveedoresDeTipo(tipo).length === 0 && (
                          <div className="px-4 py-3 text-sm text-slate-500 italic">Sin proveedores en el catálogo</div>
                        )}
                        {proveedoresDeTipo(tipo).map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setConfigIA({ ...configIA, [campo]: p.id });
                              setProveedorDropdownAbierto(null);
                            }}
                            className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                              configIA[campo] === p.id
                                ? 'bg-[#1667F4] text-white font-medium'
                                : 'text-slate-300 hover:bg-[#132A4A]'
                            }`}
                          >
                            {p.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TARJETA CENTRAL TELEFÓNICA (PBX) */}
          <div className="bg-[#07152B] border border-[#132A4A] rounded-2xl p-6 shadow-xl flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#0B1E36] p-2 rounded-lg border border-[#16335C]">
                <Cloud className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">Central Telefónica (PBX)</h2>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Conexión con el servidor SIP</p>
              </div>
            </div>

            <div className="space-y-4">
              {!pbxExiste && !cargando && (
                <p className="text-[11px] text-amber-400/80 font-mono leading-relaxed -mt-1">
                  Todavía no hay conexión configurada. Llena URL y Usuario API, y usa
                  &quot;Configurar Credenciales&quot; para guardar todo junto la primera vez.
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">URL PBX</label>
                <input
                  type="text"
                  placeholder="Ej: https://cloud_ucm.acme.com"
                  value={configPBX.api_url}
                  onChange={(e) => setConfigPBX({...configPBX, api_url: e.target.value})}
                  disabled={cargando}
                  className="w-full bg-[#0B1E36] border border-[#16335C] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#1667F4] transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Usuario API</label>
                <input
                  type="text"
                  value={configPBX.api_usuario}
                  onChange={(e) => setConfigPBX({...configPBX, api_usuario: e.target.value})}
                  disabled={cargando}
                  className="w-full bg-[#0B1E36] border border-[#16335C] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#1667F4] transition-colors disabled:opacity-50"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Tipo de Autenticación</label>
                <button
                  onClick={() => setIsAuthDropdownOpen(!isAuthDropdownOpen)}
                  disabled={cargando}
                  className="w-full flex items-center justify-between bg-[#0B1E36] border border-[#16335C] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#1667F4] transition-colors disabled:opacity-50"
                >
                  <span>{configPBX.auth_tipo}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                {isAuthDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-[#0B1E36] border border-[#16335C] rounded-lg shadow-2xl overflow-hidden z-10">
                    {catalogoAuth.map((auth) => (
                      <div
                        key={auth}
                        onClick={() => {
                          setConfigPBX({...configPBX, auth_tipo: auth});
                          setIsAuthDropdownOpen(false);
                        }}
                        className="px-4 py-3 text-sm cursor-pointer transition-colors text-slate-300 hover:bg-[#132A4A]"
                      >
                        {auth}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsModalCredencialesOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#16335C] hover:bg-[#0B1E36] text-slate-300 mt-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-colors"
              >
                <Key className="w-4 h-4" />
                Configurar Credenciales
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN FLOTANTES */}
      <div className="flex items-center justify-end gap-4 mt-8">
        <button
          onClick={handleProbarConexion}
          disabled={probandoConexion || !pbxExiste}
          title={!pbxExiste ? 'Configura las credenciales primero' : undefined}
          className="bg-[#0B1E36] hover:bg-[#132A4A] border border-[#16335C] text-slate-300 px-6 py-3 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {probandoConexion ? 'Probando...' : 'Probar Conexión'}
        </button>
        <button
          onClick={handleGuardarCambios}
          disabled={cargando || guardando}
          className="flex items-center gap-2 bg-[#1667F4] hover:bg-[#1253c4] text-white px-6 py-3 rounded-xl font-mono text-xs font-bold tracking-wider uppercase shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* === MODAL: CONFIGURAR CREDENCIALES PBX === */}
      {isModalCredencialesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030914]/80 backdrop-blur-sm p-4">
          <div className="bg-[#07152B] border border-[#132A4A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="flex items-start justify-between p-6 border-b border-[#0F2647]">
              <div className="flex items-center gap-4">
                <div className="bg-[#0B1E36] p-3 rounded-xl border border-[#16335C]">
                  <User className="w-6 h-6 text-slate-300" />
                </div>
                <h2 className="text-xl font-bold leading-tight">Configurar<br/>Credenciales PBX</h2>
              </div>
              <button
                onClick={() => setIsModalCredencialesOpen(false)}
                className="p-1.5 bg-[#0B1E36] hover:bg-[#132A4A] border border-[#16335C] rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-[#0B1E36] border border-[#16335C] rounded-lg pl-4 pr-10 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#1667F4] transition-colors font-mono tracking-widest placeholder-slate-600"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Confirmar Contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-[#0B1E36] border border-[#16335C] rounded-lg pl-4 pr-10 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#1667F4] transition-colors font-mono tracking-widest placeholder-slate-600"
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 text-slate-400 bg-[#0B1E36]/50 p-4 rounded-xl border border-[#16335C]/50">
                <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-xs font-mono leading-relaxed">
                  Las credenciales se almacenan cifradas y no son visibles una vez guardadas.
                </p>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#0F2647] bg-[#050E1D]">
              <button
                onClick={() => setIsModalCredencialesOpen(false)}
                className="px-6 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-colors text-slate-400 hover:text-white hover:bg-[#132A4A]"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarCredenciales}
                disabled={guardandoCredenciales}
                className="flex items-center gap-2 bg-[#1667F4] hover:bg-[#1253c4] text-white px-6 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {guardandoCredenciales ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === SISTEMA DE TOASTS (NOTIFICACIONES EMERGENTES) === */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl max-w-sm ${
            toast.type === 'success'
              ? 'bg-[#003829] border-[#059669] text-[#10B981]'
              : 'bg-[#3B0711] border-[#E11D48] text-[#FDA4AF]'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-medium text-white">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}

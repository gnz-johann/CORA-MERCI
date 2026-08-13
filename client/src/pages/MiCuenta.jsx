import { useState, useEffect, useCallback } from 'react';
import { User, Lock, Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { usuariosService } from '../services/usuarios.service';
import { useAuth } from '../hooks/useAuth';

// Pantalla de cuenta personal — distinta de /configuracion (config de
// EMPRESA: IA/PBX, permiso empresa.configurar). Esta es de cualquier usuario
// autenticado sobre sí mismo, sin requerir ningún permiso especial — ver
// GET/PUT /api/usuarios/me y PATCH /api/usuarios/me/password del backend,
// que reusan el mismo servicio que ya usa el panel de administración de
// Usuarios, solo que forzando el id al del propio token.
export default function MiCuenta() {
  const { usuario: sesion } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [form, setForm] = useState({ nombre: '', usuario: '', correo: '' });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ passwordActual: '', passwordNueva: '', confirmar: '' });
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3500);
  };

  const cargarPerfil = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const res = await usuariosService.propio();
      const u = res.data?.usuario;
      setPerfil(u);
      setForm({ nombre: u?.nombre || '', usuario: u?.usuario || '', correo: u?.correo || '' });
    } catch (err) {
      setErrorCarga(err.message || 'No se pudo cargar tu perfil desde el servidor.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarPerfil(); }, [cargarPerfil]);

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    setGuardandoPerfil(true);
    try {
      await usuariosService.editarPropio({
        nombre:  form.nombre.trim() || undefined,
        usuario: form.usuario.trim() || undefined,
        correo:  form.correo.trim() || undefined,
      });
      showToast('success', 'Perfil actualizado correctamente.');
      cargarPerfil();
    } catch (err) {
      showToast('error', err.message || 'No se pudo actualizar el perfil.');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (passwordForm.passwordNueva !== passwordForm.confirmar) {
      showToast('error', 'La confirmación no coincide con la nueva contraseña.');
      return;
    }
    setCambiandoPassword(true);
    try {
      await usuariosService.cambiarPasswordPropio({
        passwordActual: passwordForm.passwordActual,
        passwordNueva:  passwordForm.passwordNueva,
      });
      showToast('success', 'Contraseña actualizada correctamente.');
      setPasswordForm({ passwordActual: '', passwordNueva: '', confirmar: '' });
    } catch (err) {
      showToast('error', err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setCambiandoPassword(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#020C18] text-[#DCE9FF] p-6 font-sans relative">
      <h1 className="text-xl font-semibold tracking-wide mb-6">Mi Cuenta</h1>

      {errorCarga && (
        <div className="flex items-center gap-3 mb-6 px-5 py-3.5 rounded-xl border border-[#E11D48]/30 bg-[#3B0711]/60 text-[#FDA4AF]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{errorCarga}</p>
          <button
            onClick={cargarPerfil}
            className="ml-auto text-xs font-bold uppercase tracking-wider text-[#FDA4AF] hover:text-white underline underline-offset-2 shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* PANEL: PERFIL */}
        <div className="bg-[#061628] border border-[#0D2647] rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#0D2647]">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0A1E38] border border-[#1A3A5C]">
              <User size={16} className="text-[#155EEF]" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest">Perfil</h2>
          </div>

          <form onSubmit={handleGuardarPerfil} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#7A9EC4] mb-1.5 uppercase tracking-wider">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                disabled={cargando}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full bg-[#0A1E38] border border-[#1A3A5C] rounded-lg px-4 py-2.5 text-sm text-[#DCE9FF] focus:outline-none focus:border-[#155EEF] transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7A9EC4] mb-1.5 uppercase tracking-wider">Usuario</label>
              <input
                type="text"
                value={form.usuario}
                disabled={cargando}
                onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                className="w-full bg-[#0A1E38] border border-[#1A3A5C] rounded-lg px-4 py-2.5 text-sm text-[#DCE9FF] focus:outline-none focus:border-[#155EEF] transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7A9EC4] mb-1.5 uppercase tracking-wider">Correo</label>
              <input
                type="email"
                value={form.correo}
                disabled={cargando}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                className="w-full bg-[#0A1E38] border border-[#1A3A5C] rounded-lg px-4 py-2.5 text-sm text-[#DCE9FF] focus:outline-none focus:border-[#155EEF] transition-colors disabled:opacity-50"
              />
            </div>

            {perfil && (
              <div className="flex items-center gap-2 pt-2 text-xs text-[#7A9EC4]">
                <Shield size={13} className="text-[#4A6A8C]" />
                {perfil.roles?.map((r) => r.nombre).join(', ') || (sesion?.esGlobal ? 'Super Admin' : 'Sin rol asignado')}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={guardandoPerfil || cargando}
                className="px-6 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-colors bg-[#155EEF] hover:bg-[#1253c4] text-white disabled:opacity-50"
              >
                {guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* PANEL: CONTRASEÑA */}
        <div className="bg-[#061628] border border-[#0D2647] rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#0D2647]">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0A1E38] border border-[#1A3A5C]">
              <Lock size={16} className="text-[#155EEF]" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest">Cambiar contraseña</h2>
          </div>

          <form onSubmit={handleCambiarPassword} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#7A9EC4] mb-1.5 uppercase tracking-wider">Contraseña actual</label>
              <input
                type="password"
                required
                value={passwordForm.passwordActual}
                onChange={(e) => setPasswordForm({ ...passwordForm, passwordActual: e.target.value })}
                className="w-full bg-[#0A1E38] border border-[#1A3A5C] rounded-lg px-4 py-2.5 text-sm text-[#DCE9FF] focus:outline-none focus:border-[#155EEF] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7A9EC4] mb-1.5 uppercase tracking-wider">Contraseña nueva</label>
              <input
                type="password"
                required
                value={passwordForm.passwordNueva}
                onChange={(e) => setPasswordForm({ ...passwordForm, passwordNueva: e.target.value })}
                className="w-full bg-[#0A1E38] border border-[#1A3A5C] rounded-lg px-4 py-2.5 text-sm text-[#DCE9FF] focus:outline-none focus:border-[#155EEF] transition-colors"
              />
              <p className="mt-1.5 text-[10px] text-[#2D547E] leading-snug">Mínimo 8 caracteres, al menos una mayúscula y un número.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7A9EC4] mb-1.5 uppercase tracking-wider">Confirmar contraseña nueva</label>
              <input
                type="password"
                required
                value={passwordForm.confirmar}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmar: e.target.value })}
                className="w-full bg-[#0A1E38] border border-[#1A3A5C] rounded-lg px-4 py-2.5 text-sm text-[#DCE9FF] focus:outline-none focus:border-[#155EEF] transition-colors"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={cambiandoPassword}
                className="px-6 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-colors bg-[#155EEF] hover:bg-[#1253c4] text-white disabled:opacity-50"
              >
                {cambiandoPassword ? 'Actualizando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[60]">
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

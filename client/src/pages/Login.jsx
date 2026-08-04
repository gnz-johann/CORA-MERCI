// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import OrbAI         from "../components/OrbAI";
import LoginMessages  from "../components/LoginMessages";
import LoginForm      from "../components/LoginForm";

function Login() {
  const navigate = useNavigate();
  const { login, usuario } = useAuth();

  // Redirigir si ya hay sesión activa
  useEffect(() => {
    if (usuario) navigate("/dashboard", { replace: true });
  }, [usuario, navigate]);

  const [codigoEmpresa, setCodigoEmpresa] = useState("");
  const [usuario_,      setUsuario]       = useState("");
  const [password,      setPassword]      = useState("");
  const [error,         setError]         = useState("");
  const [cargando,      setCargando]      = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!codigoEmpresa.trim() || !usuario_.trim() || !password.trim()) {
      setError("Todos los campos son requeridos.");
      return;
    }

    setCargando(true);
    try {
      await login({
        codigoAcceso: codigoEmpresa.trim().toUpperCase(),
        usuario:      usuario_.trim(),
        password,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Error al iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#000513] flex items-center justify-center overflow-hidden p-10">

      {/* Halo de luz detrás del contenedor */}
      <div className="absolute w-[1180px] h-[650px] rounded-[40px] bg-white/5 blur-[60px]" />

      {/* Contenedor principal */}
      <div
        className="
          relative z-10
          w-[1120px] h-[640px]
          rounded-[32px]
          border border-[#0D2647]
          bg-[#000513]
          overflow-hidden
        "
      >
        {/* Columna izquierda (Orb) más grande; derecha (formulario) más pequeña */}
        <div className="grid grid-cols-[56%_44%] h-full">

          {/* ── PANEL IZQUIERDO — OrbAI + mensajes ────────────────────────── */}
          <section
            className="
              rounded-[32px] overflow-hidden
              bg-[linear-gradient(180deg,#000513_0%,#00081F_73%,#001758_100%)]
              border border-[#0D2647]
            "
          >
            <OrbAI />
            <div className="pl-12 pb-10">
              <LoginMessages />
            </div>
          </section>

          {/* ── PANEL DERECHO — Formulario (sin recuadro propio, como el mockup) ── */}
          <section className="flex items-center justify-center">
            <LoginForm
              codigoEmpresa={codigoEmpresa}
              setCodigoEmpresa={setCodigoEmpresa}
              usuario={usuario_}
              setUsuario={setUsuario}
              password={password}
              setPassword={setPassword}
              error={error}
              cargando={cargando}
              onSubmit={manejarSubmit}
            />
          </section>

        </div>
      </div>

    </main>
  );
}

export default Login;

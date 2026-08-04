import { Building2, User, Lock } from "lucide-react";
import InputField from "./InputField";

export default function LoginForm({
  codigoEmpresa,
  setCodigoEmpresa,
  usuario,
  setUsuario,
  password,
  setPassword,
  error,
  cargando,
  onSubmit,
}) {
  return (
    <section className="w-[349px] mx-auto flex flex-col justify-center">

      <img src="/logoM.png" alt="MERCI" className="w-[46px] h-[46px]" />

      <h1 className="mt-5 text-[32px] font-bold font-montserrat leading-none">
        <span className="text-white">Inicia</span>
        {" "}
        <span className="bg-gradient-to-r from-[#05A1FB] via-[#037BD4] to-[#002981] bg-clip-text text-transparent">
          Sesión
        </span>
      </h1>

      <p className="mt-1 text-[14px] text-[#A2A2A2] font-medium leading-4 font-montserrat">
        Accede a tu cuenta de <strong>MERCI</strong> para continuar
      </p>

      {/* Error */}
      {error && (
        <div className="mt-4 px-4 py-2.5 rounded-[10px] border border-[#156BE7]/40 bg-[#156BE7]/10 text-white text-[13px] font-medium font-montserrat">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-5 space-y-3.5">

        <div>
          <label className="block mb-1.5 text-white text-[15px] font-semibold font-montserrat">
            Empresa
          </label>
          <InputField
            icon={Building2}
            placeholder="Código de empresa"
            value={codigoEmpresa}
            onChange={(e) => setCodigoEmpresa(e.target.value.toUpperCase())}
            name="codigoEmpresa"
            autoComplete="organization"
          />
        </div>

        <div>
          <label className="block mb-1.5 text-white text-[15px] font-semibold font-montserrat">
            Usuario
          </label>
          <InputField
            icon={User}
            placeholder="Nombre de usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            name="usuario"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block mb-1.5 text-white text-[15px] font-semibold font-montserrat">
            Contraseña
          </label>
          <InputField
            icon={Lock}
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            name="password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="
            mt-6 block
            w-full h-[42px]
            rounded-[12px]
            bg-[#156BE7]
            text-white text-[18px] font-bold font-montserrat
            hover:brightness-110
            transition-all duration-300
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {cargando ? "Verificando..." : "Inicia Sesión"}
        </button>

      </form>

      <div className="mt-4 flex flex-col items-center">
        <p className="font-montserrat text-[13px] text-[#A2A2A2] font-medium">
          ¿Tu empresa aún no tiene una cuenta?
        </p>
        <button
          type="button"
          onClick={() => {
            // TODO: navigate('/contacto') cuando la página esté creada
          }}
          className="
            mt-2 font-montserrat text-[15px] font-bold
            bg-gradient-to-r from-[#05A1FB] via-[#037BD4] to-[#002981]
            bg-clip-text text-transparent
            hover:brightness-125 transition-all duration-300
          "
        >
          Contáctanos
        </button>
      </div>

    </section>
  );
}

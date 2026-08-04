import { Link } from "react-router-dom";
import { Bot, PhoneCall, ShieldCheck } from "lucide-react";

function Landing() {
  return (
    <main className="min-h-screen bg-[#020817] text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#123b73_0%,transparent_35%),radial-gradient(circle_at_bottom_right,#0f766e_0%,transparent_30%)] opacity-30" />

      <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-5xl text-center">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center shadow-[0_0_35px_rgba(34,211,238,0.45)]">
            <Bot size={30} />
          </div>

          <h1 className="mt-8 text-4xl md:text-6xl font-black tracking-tight">
            MERCI
          </h1>

          <p className="mt-3 text-cyan-300 tracking-[0.3em] text-sm font-bold">
            AI VOICE ENGINE
          </p>

          <p className="mt-8 text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
            Plataforma SaaS para administrar agentes virtuales inteligentes,
            automatizar llamadas empresariales e integrar operaciones con Cloud UCM.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.45)] hover:bg-cyan-300 transition"
            >
              Iniciar sesión
            </Link>

            <a
              href="mailto:contacto@inttelec.com"
              className="rounded-2xl border border-cyan-400/20 px-6 py-3 text-sm font-bold text-cyan-300 hover:bg-cyan-400/10 transition"
            >
              Solicitar cuenta
            </a>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Feature icon={PhoneCall} title="Telefonía inteligente" />
            <Feature icon={Bot} title="Agentes virtuales IA" />
            <Feature icon={ShieldCheck} title="Acceso empresarial seguro" />
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon: Icon, title }) {
  return (
    <div className="rounded-3xl border border-cyan-400/10 bg-[#071426]/80 p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,0.07)]">
      <Icon className="mx-auto text-cyan-300" size={28} />
      <p className="mt-4 font-semibold">{title}</p>
    </div>
  );
}

export default Landing;
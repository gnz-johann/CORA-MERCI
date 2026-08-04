import { Bell, Menu, Moon, Search, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

function Header({ onOpenSidebar }) {
  const { usuario, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="relative h-16 lg:h-20 border-b border-cyan-400/10 bg-[#06111f]/90 px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden w-10 h-10 rounded-xl border border-cyan-400/20 flex items-center justify-center text-cyan-300 hover:bg-cyan-400/10"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="hidden md:block text-sm font-semibold tracking-wide text-slate-200">
            Dashboard Operativo
          </h1>
          <p className="hidden md:block text-xs text-cyan-400/70">
            Monitoreo inteligente en tiempo real
          </p>
        </div>

        <div className="relative w-full max-w-md md:ml-6">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300/60"
          />
          <input
            type="text"
            placeholder="Buscar llamadas, agentes, extensiones..."
            className="w-full h-10 lg:h-11 pl-11 pr-4 rounded-2xl border border-cyan-400/10 bg-[#0b1b31] outline-none text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/60 focus:shadow-[0_0_18px_rgba(34,211,238,0.16)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-3">
        <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold">
          <ShieldCheck size={15} />
          EN VIVO
        </div>

        <button className="w-10 h-10 rounded-full border border-cyan-400/15 flex items-center justify-center text-cyan-200 hover:bg-cyan-400/10">
          <Bell size={18} />
        </button>

        <button className="hidden sm:flex w-10 h-10 rounded-full border border-cyan-400/15 items-center justify-center text-cyan-200 hover:bg-cyan-400/10">
          <Moon size={18} />
        </button>

        <div className="hidden md:flex items-center gap-3 pl-3 border-l border-cyan-400/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center font-bold shadow-[0_0_18px_rgba(34,211,238,0.35)]">
            {usuario?.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-100">
              {usuario?.nombre || 'Usuario'}
            </p>
            <p className="text-xs text-cyan-300/60">
              {usuario?.esGlobal ? 'Super Admin' : 'Usuario'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="w-10 h-10 rounded-full border border-rose-400/15 flex items-center justify-center text-rose-300 hover:bg-rose-400/10 transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
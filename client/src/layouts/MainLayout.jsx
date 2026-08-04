import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 flex overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#123b73_0%,transparent_35%),radial-gradient(circle_at_bottom_right,#0f766e_0%,transparent_30%)] opacity-30 pointer-events-none" />

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={`relative flex-1 min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        }`}
      >
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="p-3 sm:p-4 lg:p-6">
          <div className="min-h-[calc(100vh-104px)] rounded-3xl border border-cyan-400/10 bg-[#071426]/80 shadow-[0_0_35px_rgba(34,211,238,0.08)] backdrop-blur-xl p-4 sm:p-5 lg:p-6 overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
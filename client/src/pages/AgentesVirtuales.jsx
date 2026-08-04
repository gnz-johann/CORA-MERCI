import React, { useState, useEffect } from 'react';

// --- DATOS SIMULADOS (MOCK DB) ---
const initialAgents = [
    { id: 1, name: "Aria", type: "Ventas", inNumber: "8800", status: "Disponible", versions: 6, branch: "Sucursal Guadalajara", dept: "Ventas" },
    { id: 2, name: "Atlas", type: "Soporte", inNumber: "8801", status: "Ocupado", versions: 4, branch: "Sucursal Guadalajara", dept: "Soporte" },
    { id: 3, name: "Nova", type: "Cobranza", inNumber: "8802", status: "Pausado", versions: 3, branch: "Sucursal Guadalajara", dept: "Cobranza" },
    { id: 4, name: "Kai", type: "Recepción", inNumber: "8803", status: "Fuera de servicio", versions: 10, branch: "Sucursal Guadalajara", dept: "Recepción" }
];

const mockPromptHistory = [
    { v: 4, active: true, note: "Refuerzo de reglas de escalamiento", date: "2026-07-13", content: "# Rol\nEres Kai, agente de voz de cobranza...\n\n# Objetivo\nRecordar al cliente su saldo...\n\n# Tono\n- Respetuoso, nunca amenazante." },
    { v: 3, active: false, note: "Nuevo guion de apertura", date: "2026-06-22", content: "# Rol\nEres Kai, agente...\n\n# Objetivo\nSaludar cordialmente y recordar..." },
    { v: 2, active: false, note: "Ajuste de tono", date: "2026-06-14", content: "Versión 2 de prueba..." },
    { v: 1, active: false, note: "Versión inicial", date: "2026-05-12", content: "Prompt inicial base..." }
];

export default function AgentesVirtuales() {
    // Estados principales
    const [agents, setAgents] = useState(initialAgents);
    const [activeModal, setActiveModal] = useState(null); // 'create', 'edit', 'delete', 'prompt', null
    const [toasts, setToasts] = useState([]);

    // Estados para formularios y selecciones
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [selectedPrompt, setSelectedPrompt] = useState(mockPromptHistory[0]);
    
    const [formData, setFormData] = useState({
        name: '', inNumber: '', type: 'Ventas', status: 'Disponible', branch: 'Sucursal Guadalajara', dept: 'Ventas'
    });

    // --- SISTEMA DE TOASTS ---
    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // --- MANEJADORES DE MODALES ---
    const closeModal = () => {
        setActiveModal(null);
        setSelectedAgent(null);
        setFormData({ name: '', inNumber: '', type: 'Ventas', status: 'Disponible', branch: 'Sucursal Guadalajara', dept: 'Ventas' });
    };

    // --- ACCIONES CRUD ---
    const handleCreate = () => {
        if (!formData.name || !formData.inNumber) {
            showToast('Completa los campos obligatorios', 'error');
            return;
        }
        const newAgent = { ...formData, id: Date.now(), versions: 1 };
        setAgents([...agents, newAgent]);
        closeModal();
        showToast('Agente creado correctamente');
    };

    const openEdit = (agent) => {
        setSelectedAgent(agent);
        setFormData({ ...agent });
        setActiveModal('edit');
    };

    const handleEdit = () => {
        setAgents(agents.map(a => a.id === selectedAgent.id ? { ...a, ...formData } : a));
        closeModal();
        showToast('Agente actualizado correctamente');
    };

    const openDelete = (agent) => {
        setSelectedAgent(agent);
        setActiveModal('delete');
    };

    const handleDelete = () => {
        setAgents(agents.filter(a => a.id !== selectedAgent.id));
        closeModal();
        showToast('Agente eliminado con éxito');
    };

    const openPrompt = (agent) => {
        setSelectedAgent(agent);
        setSelectedPrompt(mockPromptHistory[0]); // Por defecto la más reciente
        setActiveModal('prompt');
    };

    // --- RENDERIZADO DE BADGES ---
    const renderStatusBadge = (status) => {
        switch(status) {
            case 'Disponible': return <span className="px-2 py-1 text-[10px] rounded border border-green-500/50 text-green-400 bg-green-500/10"><i className="fa-solid fa-circle text-[8px] mr-1"></i>Disponible</span>;
            case 'Ocupado': return <span className="px-2 py-1 text-[10px] rounded border border-yellow-500/50 text-yellow-400 bg-yellow-500/10"><i className="fa-solid fa-circle text-[8px] mr-1"></i>Ocupado</span>;
            case 'Pausado': return <span className="px-2 py-1 text-[10px] rounded border border-blue-500/50 text-blue-400 bg-blue-500/10"><i className="fa-solid fa-circle text-[8px] mr-1"></i>Pausado</span>;
            case 'Fuera de servicio': return <span className="px-2 py-1 text-[10px] rounded border border-red-500/50 text-red-400 bg-red-500/10"><i className="fa-solid fa-circle text-[8px] mr-1"></i>Fuera de servicio</span>;
            default: return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen overflow-y-auto relative bg-[#0b131e] text-white">
            
            {/* HEADER */}
            <header className="flex justify-between items-center p-6 border-b border-[#1e3a5f] bg-[#111c2a]/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-2xl font-bold">Agentes Virtuales</h2>
                <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> EN VIVO
                    </span>
                    <div className="flex items-center gap-3 bg-[#111c2a] px-4 py-2 rounded-lg border border-[#1e3a5f]">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">FM</div>
                        <span className="text-sm text-gray-300">Ferchis M.<br/><span className="text-xs text-gray-500">Super Admin</span></span>
                    </div>
                </div>
            </header>

            {/* CONTENT */}
            <div className="p-6 space-y-6">
                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tarjeta 1 */}
                    <div className="bg-[#111c2a] p-6 rounded-xl border border-[#1e3a5f] hover:border-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.2)] transition relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                        <h3 className="text-gray-400 text-xs tracking-widest uppercase mb-2">Total Departamentos</h3>
                        <div className="text-4xl font-bold mb-2">6</div>
                        <p className="text-sm text-gray-500">Activos en la empresa</p>
                        <i className="fa-solid fa-layer-group absolute top-6 right-6 text-2xl text-blue-500/50"></i>
                    </div>
                    {/* Tarjeta 2 */}
                    <div className="bg-[#111c2a] p-6 rounded-xl border border-[#1e3a5f] hover:border-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.2)] transition relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                        <h3 className="text-gray-400 text-xs tracking-widest uppercase mb-2">Extensiones Asignadas</h3>
                        <div className="text-4xl font-bold mb-2">6</div>
                        <p className="text-sm text-gray-500">En uso actualmente</p>
                        <i className="fa-solid fa-phone absolute top-6 right-6 text-2xl text-blue-500/50"></i>
                    </div>
                    {/* Tarjeta 3 */}
                    <div className="bg-[#111c2a] p-6 rounded-xl border border-[#1e3a5f] hover:border-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.2)] transition relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                        <h3 className="text-gray-400 text-xs tracking-widest uppercase mb-2">Empleados Asignados</h3>
                        <div className="text-4xl font-bold mb-2">6</div>
                        <p className="text-sm text-gray-500">En departamentos</p>
                        <i className="fa-solid fa-users absolute top-6 right-6 text-2xl text-blue-500/50"></i>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-4 w-1/2">
                        <div className="relative w-full max-w-sm">
                            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input type="text" placeholder="Buscar grupo..." className="w-full bg-[#111c2a] border border-[#1e3a5f] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#2563eb] transition" />
                        </div>
                        <select className="bg-[#111c2a] border border-[#1e3a5f] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#2563eb] text-gray-300">
                            <option>Filtrar por todos los tipos</option>
                        </select>
                    </div>
                    <button onClick={() => setActiveModal('create')} className="bg-[#2563eb] hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-500/30">
                        <i className="fa-solid fa-plus mr-2"></i> NUEVO AGENTE
                    </button>
                </div>

                {/* AGENTS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {agents.map((agent) => (
                        <div key={agent.id} className="bg-[#111c2a] border border-[#1e3a5f] rounded-xl p-5 hover:border-[#2563eb] transition shadow-lg relative flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#0b131e] border border-[#1e3a5f] rounded-lg flex items-center justify-center text-gray-300">
                                        <i className="fa-solid fa-robot"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-md">{agent.name} - {agent.type}</h4>
                                        <p className="text-xs text-gray-500">Entrada: {agent.inNumber}</p>
                                    </div>
                                </div>
                                {renderStatusBadge(agent.status)}
                            </div>
                            
                            <div className="space-y-3 flex-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400 font-semibold tracking-wider">VERSIONES PROMPTS</span>
                                    <span className="font-mono text-white">{agent.versions}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400 font-semibold tracking-wider">SUCURSAL</span>
                                    <span className="text-white">{agent.branch}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400 font-semibold tracking-wider">DEPARTAMENTO</span>
                                    <span className="text-white">{agent.dept}</span>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-between items-center gap-2 pt-4 border-t border-[#1e3a5f]">
                                <button onClick={() => openEdit(agent)} className="w-8 h-8 rounded bg-[#0b131e] border border-[#1e3a5f] hover:bg-white/10 text-gray-400 flex items-center justify-center transition" title="Editar">
                                    <i className="fa-solid fa-pen text-xs"></i>
                                </button>
                                <button className="w-8 h-8 rounded bg-[#0b131e] border border-[#1e3a5f] hover:bg-white/10 text-gray-400 flex items-center justify-center transition" title="Apagar/Encender">
                                    <i className="fa-solid fa-power-off text-xs"></i>
                                </button>
                                <button onClick={() => openDelete(agent)} className="w-8 h-8 rounded bg-[#0b131e] border border-red-500/30 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition" title="Eliminar">
                                    <i className="fa-solid fa-trash text-xs"></i>
                                </button>
                                <button onClick={() => openPrompt(agent)} className="flex-1 bg-[#2563eb] hover:bg-blue-500 text-white rounded text-xs font-bold py-2 transition shadow shadow-blue-500/20">
                                    PROMPT
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODALES E OVERLAY */}
            {activeModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center">
                    
                    {/* CREAR / EDITAR AGENTE */}
                    {(activeModal === 'create' || activeModal === 'edit') && (
                        <div className="bg-[#111c2a] border border-[#1e3a5f] rounded-xl w-full max-w-2xl flex-col relative shadow-2xl">
                            <div className="flex justify-between items-center p-5 border-b border-[#1e3a5f]">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    {activeModal === 'create' ? <i className="fa-solid fa-building-user text-gray-400"></i> : <i className="fa-solid fa-pen text-gray-400"></i>} 
                                    {activeModal === 'create' ? 'Crear Agente Virtual' : 'Editar Agente Virtual'}
                                </h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-white bg-[#0b131e] w-8 h-8 rounded flex items-center justify-center"><i className="fa-solid fa-times"></i></button>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">NOMBRE</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0b131e] border border-[#1e3a5f] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#2563eb]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">NÚMERO DE ENTRADA</label>
                                    <input type="text" value={formData.inNumber} onChange={e => setFormData({...formData, inNumber: e.target.value})} className="w-full bg-[#0b131e] border border-[#1e3a5f] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#2563eb]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">TIPO</label>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#0b131e] border border-[#1e3a5f] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#2563eb]">
                                        <option>Ventas</option>
                                        <option>Soporte</option>
                                        <option>Cobranza</option>
                                        <option>Recepción</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">ESTADO</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#0b131e] border border-[#1e3a5f] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#2563eb]">
                                        <option value="Disponible">Disponible</option>
                                        <option value="Ocupado">Ocupado</option>
                                        <option value="Pausado">Pausado</option>
                                        <option value="Fuera de servicio">Fuera de servicio</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">SUCURSAL</label>
                                    <select value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="w-full bg-[#0b131e] border border-[#1e3a5f] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#2563eb]">
                                        <option>Sucursal Guadalajara</option>
                                        <option>Sucursal CDMX</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-2">DEPARTAMENTO</label>
                                    <select value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value})} className="w-full bg-[#0b131e] border border-[#1e3a5f] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#2563eb]">
                                        <option>Ventas</option>
                                        <option>Soporte</option>
                                        <option>Cobranza</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-5 border-t border-[#1e3a5f] flex justify-end gap-3 bg-[#0b131e]/50 rounded-b-xl">
                                <button onClick={closeModal} className="px-5 py-2 rounded-lg text-sm font-semibold border border-[#1e3a5f] hover:bg-white/5 transition">CANCELAR</button>
                                <button onClick={activeModal === 'create' ? handleCreate : handleEdit} className="bg-[#2563eb] hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition">
                                    <i className={`fa-solid ${activeModal === 'create' ? 'fa-plus' : 'fa-save'} mr-2`}></i> {activeModal === 'create' ? 'CREAR AGENTE' : 'GUARDAR CAMBIOS'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ELIMINAR AGENTE */}
                    {activeModal === 'delete' && (
                        <div className="bg-[#111c2a] border border-[#1e3a5f] rounded-xl w-full max-w-md flex-col relative shadow-2xl p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-2xl mx-auto mb-4 border border-red-500/30">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                            </div>
                            <h3 className="text-xl font-bold mb-2">¿Eliminar a {selectedAgent?.name}?</h3>
                            <p className="text-sm text-gray-400 mb-6">Esta acción es irreversible. Se perderán las configuraciones y el historial de prompts de este agente.</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={closeModal} className="px-5 py-2 rounded-lg text-sm font-semibold border border-[#1e3a5f] hover:bg-white/5 transition">CANCELAR</button>
                                <button onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition">SÍ, ELIMINAR</button>
                            </div>
                        </div>
                    )}

                    {/* HISTORIAL Y PROMPT */}
                    {activeModal === 'prompt' && (
                        <div className="bg-[#111c2a] border border-[#1e3a5f] rounded-xl w-full max-w-5xl h-[80vh] flex flex-col relative shadow-2xl">
                            <div className="flex justify-between items-center p-5 border-b border-[#1e3a5f]">
                                <h3 className="text-xl font-bold flex items-center gap-2"><i className="fa-solid fa-robot text-gray-400"></i> Prompt Agente Virtual: {selectedAgent?.name}</h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-white bg-[#0b131e] w-8 h-8 rounded flex items-center justify-center"><i className="fa-solid fa-times"></i></button>
                            </div>
                            <div className="flex flex-1 overflow-hidden">
                                {/* Sidebar Versiones */}
                                <div className="w-1/3 border-r border-[#1e3a5f] bg-[#0b131e]/50 flex flex-col">
                                    <div className="p-4 border-b border-[#1e3a5f] flex justify-between items-center text-sm font-semibold text-gray-400">
                                        VERSIONES <span className="bg-[#1e3a5f] text-white px-2 py-0.5 rounded-full text-xs">{mockPromptHistory.length}</span>
                                    </div>
                                    <div className="overflow-y-auto p-4 space-y-3">
                                        {mockPromptHistory.map(ver => (
                                            <div key={ver.v} onClick={() => setSelectedPrompt(ver)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedPrompt.v === ver.v ? 'border-[#2563eb] bg-blue-500/10' : 'border-[#1e3a5f] bg-[#0b131e] hover:border-gray-500'}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-white">v{ver.v}</span>
                                                    {ver.active && <span className="text-[9px] px-1.5 py-0.5 rounded border border-green-500/50 text-green-400 bg-green-500/10 flex items-center gap-1"><i className="fa-solid fa-circle text-[6px]"></i> Activa</span>}
                                                </div>
                                                <p className="text-xs text-gray-300 truncate">{ver.note}</p>
                                                <p className="text-[10px] text-gray-500 mt-2">{ver.date}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Contenido del Prompt */}
                                <div className="w-2/3 flex flex-col bg-[#111c2a] relative">
                                    <div className="p-6 flex-1 overflow-y-auto">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold">Versión {selectedPrompt.v}</h2>
                                            <div className="flex items-center gap-3">
                                                {selectedPrompt.active ? (
                                                    <span className="text-xs px-2 py-1 rounded border border-green-500/50 text-green-400 bg-green-500/10">● Activa</span>
                                                ) : (
                                                    <span className="text-xs px-2 py-1 rounded border border-gray-500/50 text-gray-400 bg-gray-500/10">Historial</span>
                                                )}
                                                <span className="text-sm text-gray-400">{selectedPrompt.date}</span>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-xs font-semibold text-gray-400 mb-2">Nota / descripción de la versión</label>
                                            <input type="text" value={selectedPrompt.note} readOnly className="w-full bg-[#0b131e] border border-[#1e3a5f] rounded-lg px-4 py-3 text-sm focus:outline-none text-gray-300" />
                                        </div>
                                        <div className="mb-2">
                                            <textarea value={selectedPrompt.content} readOnly className="w-full h-64 bg-[#0b131e] border border-[#1e3a5f] rounded-lg px-4 py-3 text-sm focus:outline-none font-mono resize-none leading-relaxed text-gray-300"></textarea>
                                        </div>
                                        {!selectedPrompt.active && (
                                            <div className="text-yellow-500 text-xs mt-2 flex items-center gap-2">
                                                <i className="fa-solid fa-triangle-exclamation"></i> Estás viendo una versión anterior. Guárdala como nueva versión para aplicar cambios.
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 border-t border-[#1e3a5f] bg-[#0b131e]/50 flex justify-between items-center">
                                        <button className="text-red-500 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
                                            <i className="fa-solid fa-trash"></i> ELIMINAR VERSIÓN
                                        </button>
                                        <div className="flex gap-3">
                                            <button disabled={selectedPrompt.active} className={`border border-[#1e3a5f] text-gray-400 px-4 py-2 rounded-lg text-sm font-semibold transition ${selectedPrompt.active ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}>
                                                ACTIVAR ESTA VERSIÓN
                                            </button>
                                            <button className="bg-[#2563eb] hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
                                                <i className="fa-solid fa-download"></i> GUARDAR COMO NUEVA VERSIÓN
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TOAST CONTAINER */}
            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
                {toasts.map(toast => (
                    <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md animate-[slideIn_0.3s_ease-out_forwards] ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>
                        <i className={`fa-solid ${toast.type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation'}`}></i> 
                        <span className="text-sm text-white">{toast.message}</span>
                    </div>
                ))}
            </div>

            {/* Para la animación de los toasts en React, puedes añadir esto a tu archivo global.css de Tailwind */}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>

        </div>
    );
}
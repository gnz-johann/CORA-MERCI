import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Pencil, 
  Play, 
  Pause, 
  Trash2, 
  X, 
  Lock, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

// ==========================================
// DATA INICIAL DE PRUEBA
// ==========================================
const initialRules = [
  {
    id: 'w1',
    title: 'Escalar por sentimiento negativo',
    priority: 'PRIORIDAD 1',
    status: 'Activo',
    ifCondition: 'sentimiento = Molesto',
    thenAction: 'sentimiento = Molesto'
  },
  {
    id: 'w2',
    title: 'Crear ticket por palabra clave "cancelar"',
    priority: 'PRIORIDAD 2',
    status: 'Pausada',
    ifCondition: 'palabra_clave = cancelar',
    thenAction: 'crear_ticket → Cobranza'
  },
  {
    id: 'w3',
    title: 'Escalar por sentimiento negativo',
    priority: 'PRIORIDAD 3',
    status: 'Deshabilitado',
    ifCondition: 'duracion => 5:00',
    thenAction: 'transferir → Soporte Nivel 2'
  }
];

const initialConditions = [
  { key: 'palabra_clave', name: 'Palabra clave', description: 'Coincide con texto en la transcripción', active: true },
  { key: 'sentimiento', name: 'Sentimiento', description: 'Sentimiento detectado por la IA', active: true },
  { key: 'estado_llamada', name: 'Estado de llamada', description: 'Estado actual de la llamada', active: true },
  { key: 'resultado_llamada', name: 'Resultado de llamada', description: 'Resultado final de la llamada', active: true },
  { key: 'horario', name: 'Horario', description: 'Dentro o fuera del horario', active: true }
];

const initialActions = [
  { key: 'transferir', name: 'Transferir', description: 'Deriva la llamada a un destino', active: true },
  { key: 'cerrar_ticket', name: 'Crear Ticket', description: 'Genera un ticket en un departamento', active: false },
  { key: 'escalar_humano', name: 'Escalar a Humano', description: 'Marca la llamada para atención humana', active: true },
  { key: 'colgar', name: 'Colgar', description: 'Finaliza la llamada', active: true }
];

export default function MerciWorkflowsModule() {
  const [workflowTab, setWorkflowTab] = useState('REGLAS'); // 'REGLAS' | 'TIPOS DISPONIBLES'

  const [rules, setRules] = useState(initialRules);
  const [conditions, setConditions] = useState(initialConditions);
  const [actions, setActions] = useState(initialActions);
  const [searchQuery, setSearchQuery] = useState('');

  const [toast, setToast] = useState(null); 
  const [deletingRuleId, setDeletingRuleId] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const [ruleFormData, setRuleFormData] = useState({
    id: null,
    title: '',
    priority: 'PRIORIDAD 1',
    ifCondition: '',
    thenAction: ''
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Activo':
        return 'bg-[#00271D] text-[#10B981] border-[#065F46]';
      case 'Pausada':
        return 'bg-[#291E04] text-[#F59E0B] border-[#78350F]';
      default:
        return 'bg-[#151D2A] text-[#64748B] border-[#334155]';
    }
  };

  const handleToggleRuleStatus = (id) => {
    setRules(prev => prev.map(rule => {
      if (rule.id === id) {
        const nextStatus = rule.status === 'Activo' ? 'Pausada' : 'Activo';
        showToast('success', nextStatus === 'Activo' ? 'Regla activada correctamente' : 'Regla pausada correctamente');
        return { ...rule, status: nextStatus };
      }
      return rule;
    }));
  };

  const handleConfirmDelete = () => {
    if (!deletingRuleId) return;
    setRules(prev => prev.filter(r => r.id !== deletingRuleId));
    setDeletingRuleId(null);
    showToast('success', 'Regla eliminada correctamente');
  };

  const handleSaveRule = (e) => {
    e.preventDefault();
    if (ruleFormData.id) {
      setRules(prev => prev.map(r => r.id === ruleFormData.id ? { ...r, ...ruleFormData } : r));
      showToast('success', 'Regla editada correctamente');
    } else {
      const newRule = { ...ruleFormData, id: `w_${Date.now()}`, status: 'Activo' };
      setRules(prev => [...prev, newRule]);
      showToast('success', 'Regla creada correctamente');
    }
    setIsItemModalOpen(false);
  };

  const handleToggleType = (key, type) => {
    if (type === 'condition') {
      setConditions(prev => prev.map(c => c.key === key ? { ...c, active: !c.active } : c));
    } else {
      setActions(prev => prev.map(a => a.key === key ? { ...a, active: !a.active } : a));
    }
    showToast('success', 'Estado actualizado correctamente');
  };

  const handleSaveTypeEdit = (e) => {
    e.preventDefault();
    if (editingType.category === 'condition') {
      setConditions(prev => prev.map(c => c.key === editingType.key ? editingType : c));
    } else {
      setActions(prev => prev.map(a => a.key === editingType.key ? editingType : a));
    }
    setEditingType(null);
    showToast('success', 'Clave actualizada correctamente');
  };

  return (
    <div className="w-full min-h-full bg-[#020813] text-slate-200 font-sans p-8 space-y-6 select-none relative">
      
      {/* ========================================== */}
      {/* BARRA DE ACCIONES Y PESTAÑAS              */}
      {/* ========================================== */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* BUSCADOR */}
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar regla..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#051124] border border-[#0D2445] rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* TABS */}
          <div className="bg-[#051124] p-1 rounded-xl border border-[#0D2445] flex items-center">
            <button
              onClick={() => setWorkflowTab('REGLAS')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                workflowTab === 'REGLAS' ? 'bg-[#0B254A] text-white border border-[#164887]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              REGLAS
            </button>
            <button
              onClick={() => setWorkflowTab('TIPOS DISPONIBLES')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                workflowTab === 'TIPOS DISPONIBLES' ? 'bg-[#0B254A] text-white border border-[#164887]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TIPOS DISPONIBLES
            </button>
          </div>
        </div>

        {/* BOTÓN NUEVA REGLA */}
        <button
          onClick={() => {
            setRuleFormData({ id: null, title: '', priority: 'PRIORIDAD 1', ifCondition: '', thenAction: '' });
            setIsItemModalOpen(true);
          }}
          className="bg-[#1667F4] hover:bg-[#1253c4] text-white px-5 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> NUEVA REGLA
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: REGLAS                              */}
      {/* ========================================== */}
      {workflowTab === 'REGLAS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules
            .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((rule) => (
              <div
                key={rule.id}
                className="bg-[#040E1E] border border-[#0B2242] hover:border-[#143B70] rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <h3 className="font-semibold text-xs text-slate-100 font-sans leading-snug">
                      {rule.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-mono text-slate-400 bg-[#071830] px-2 py-0.5 rounded border border-[#0F2F5B]">
                        {rule.priority}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusBadge(rule.status)}`}>
                        <span className="w-1 h-1 rounded-full bg-current" />
                        {rule.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 font-mono text-xs">
                    <div className="bg-[#07162E] border border-[#0E2C57] rounded-xl p-3 flex items-center gap-3">
                      <span className="bg-[#0E3566] text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">SI</span>
                      <span className="text-slate-300 text-[11px] truncate">{rule.ifCondition}</span>
                    </div>

                    <div className="bg-[#07162E] border border-[#0E2C57] rounded-xl p-3 flex items-center gap-3">
                      <span className="bg-[#003829] text-[#10B981] text-[9px] font-bold px-2 py-0.5 rounded uppercase">ENTONCES</span>
                      <span className="text-slate-300 text-[11px] truncate">{rule.thenAction}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#081B36]">
                  <button 
                    onClick={() => {
                      setRuleFormData(rule);
                      setIsItemModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-300 hover:text-white bg-[#071830] hover:bg-[#0E2C57] px-3 py-1.5 rounded-lg border border-[#0F2F5B] transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> EDITAR
                  </button>

                  <button 
                    onClick={() => handleToggleRuleStatus(rule.id)}
                    className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-300 hover:text-white bg-[#071830] hover:bg-[#0E2C57] px-3 py-1.5 rounded-lg border border-[#0F2F5B] transition-colors"
                  >
                    {rule.status === 'Activo' ? (
                      <><Pause className="w-3 h-3 text-amber-400" /> PAUSAR</>
                    ) : (
                      <><Play className="w-3 h-3 text-emerald-400" /> ACTIVAR</>
                    )}
                  </button>

                  <button 
                    onClick={() => setDeletingRuleId(rule.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 bg-[#071830] hover:bg-red-500/10 border border-[#0F2F5B] hover:border-red-500/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: TIPOS DISPONIBLES                  */}
      {/* ========================================== */}
      {workflowTab === 'TIPOS DISPONIBLES' && (
        <div className="space-y-6">
          
          <div className="bg-[#051124] border border-[#0D2445] rounded-2xl p-4 text-xs font-mono text-slate-400 flex items-start gap-3">
            <span className="text-amber-400 font-bold text-sm">!</span>
            <p>
              Tipos de condición y acción = catálogo cerrado. Las claves las define el sistema; aquí puedes activar/desactivar y renombrar, pero no crear claves nuevas — eso requiere un despliegue. Solo los tipos activos aparecen al crear una regla.
            </p>
          </div>

          {/* TABLA CONDICIONES */}
          <div className="bg-[#040E1E] border border-[#0B2242] rounded-2xl overflow-hidden shadow-xl font-mono text-xs">
            <div className="p-4 border-b border-[#081B36] flex items-center justify-between bg-[#051329]">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Condiciones disponibles
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Claves gestionadas por desarrollo
              </span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 border-b border-[#081B36] uppercase bg-[#030C1A]">
                  <th className="p-4">CLAVE</th>
                  <th className="p-4">NOMBRE VISIBLE</th>
                  <th className="p-4">DESCRIPCIÓN</th>
                  <th className="p-4 text-right">ACCIONES/ACTIVO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#081B36]">
                {conditions.map((item) => (
                  <tr key={item.key} className="hover:bg-[#071830]/40 transition-colors">
                    <td className="p-4 text-blue-400 font-bold">{item.key}</td>
                    <td className="p-4 text-slate-200">{item.name}</td>
                    <td className="p-4 text-slate-400">{item.description}</td>
                    <td className="p-4 flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setEditingType({ ...item, category: 'condition' })}
                        className="p-1.5 text-slate-400 hover:text-white bg-[#071830] border border-[#0F2F5B] rounded-lg"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleToggleType(item.key, 'condition')}
                        className={`w-9 h-5 rounded-full p-0.5 relative transition-colors ${item.active ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${item.active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABLA ACCIONES */}
          <div className="bg-[#040E1E] border border-[#0B2242] rounded-2xl overflow-hidden shadow-xl font-mono text-xs">
            <div className="p-4 border-b border-[#081B36] flex items-center justify-between bg-[#051329]">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Acciones disponibles
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Claves gestionadas por desarrollo
              </span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 border-b border-[#081B36] uppercase bg-[#030C1A]">
                  <th className="p-4">CLAVE</th>
                  <th className="p-4">NOMBRE VISIBLE</th>
                  <th className="p-4">DESCRIPCIÓN</th>
                  <th className="p-4 text-right">ACCIONES/ACTIVO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#081B36]">
                {actions.map((item) => (
                  <tr key={item.key} className="hover:bg-[#071830]/40 transition-colors">
                    <td className="p-4 text-blue-400 font-bold">{item.key}</td>
                    <td className="p-4 text-slate-200">{item.name}</td>
                    <td className="p-4 text-slate-400">{item.description}</td>
                    <td className="p-4 flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setEditingType({ ...item, category: 'action' })}
                        className="p-1.5 text-slate-400 hover:text-white bg-[#071830] border border-[#0F2F5B] rounded-lg"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleToggleType(item.key, 'action')}
                        className={`w-9 h-5 rounded-full p-0.5 relative transition-colors ${item.active ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${item.active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* MODALES & NOTIFICACIONES                   */}
      {/* ========================================== */}
      {deletingRuleId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="bg-[#040C1A] border border-[#0F284B] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-[#0A1A30] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-white tracking-wider">Eliminar Regla</h3>
              </div>
              <button onClick={() => setDeletingRuleId(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm font-bold text-slate-200">¿Estás seguro de que deseas eliminar esta regla?</p>
              <p className="text-xs text-slate-400 leading-relaxed">Esta acción no se puede deshacer.<br />La regla quedará eliminada.</p>
            </div>
            <div className="p-4 bg-[#030814] border-t border-[#0A1A30] flex items-center justify-end gap-3">
              <button onClick={() => setDeletingRuleId(null)} className="px-5 py-2 text-xs font-bold text-slate-300 hover:text-white border border-[#0F284B] rounded-xl hover:bg-[#07162E]">CANCELAR</button>
              <button onClick={handleConfirmDelete} className="px-5 py-2 text-xs font-bold bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-xl transition-all flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> ELIMINAR REGLA</button>
            </div>
          </div>
        </div>
      )}

      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="bg-[#040C1A] border border-[#0F284B] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#0A1A30] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{ruleFormData.id ? 'Editar Regla' : 'Nueva Regla'}</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveRule} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Título de la Regla</label>
                <input type="text" value={ruleFormData.title} onChange={(e) => setRuleFormData({ ...ruleFormData, title: e.target.value })} placeholder="Ej: Escalar por sentimiento negativo" className="w-full bg-[#07162E] border border-[#0F284B] rounded-xl p-3 text-xs text-slate-200 focus:border-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Prioridad</label>
                <select value={ruleFormData.priority} onChange={(e) => setRuleFormData({ ...ruleFormData, priority: e.target.value })} className="w-full bg-[#07162E] border border-[#0F284B] rounded-xl p-3 text-xs text-slate-200 focus:border-blue-500 outline-none">
                  <option value="PRIORIDAD 1">PRIORIDAD 1</option>
                  <option value="PRIORIDAD 2">PRIORIDAD 2</option>
                  <option value="PRIORIDAD 3">PRIORIDAD 3</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Condición (SI...)</label>
                <input type="text" value={ruleFormData.ifCondition} onChange={(e) => setRuleFormData({ ...ruleFormData, ifCondition: e.target.value })} placeholder="Ej: sentimiento = Molesto" className="w-full bg-[#07162E] border border-[#0F284B] rounded-xl p-3 text-xs text-slate-200 focus:border-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Acción (ENTONCES...)</label>
                <input type="text" value={ruleFormData.thenAction} onChange={(e) => setRuleFormData({ ...ruleFormData, thenAction: e.target.value })} placeholder="Ej: crear_ticket → Cobranza" className="w-full bg-[#07162E] border border-[#0F284B] rounded-xl p-3 text-xs text-slate-200 focus:border-blue-500 outline-none" required />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0A1A30]">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">CANCELAR</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold bg-[#1667F4] hover:bg-[#1253c4] text-white rounded-xl shadow-lg shadow-blue-500/20">GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="bg-[#040C1A] border border-[#0F284B] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#0A1A30] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Lock className="w-4 h-4 text-slate-500" /> Editar {editingType.category === 'condition' ? 'Condición' : 'Acción'}</h3>
              <button onClick={() => setEditingType(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveTypeEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Clave (Sistema)</label>
                <input type="text" value={editingType.key} disabled className="w-full bg-[#030A17] border border-[#0F233F] rounded-xl p-2.5 text-xs text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Nombre Visible</label>
                <input type="text" value={editingType.name} onChange={(e) => setEditingType({ ...editingType, name: e.target.value })} className="w-full bg-[#07162E] border border-[#0F284B] rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Descripción</label>
                <textarea rows={3} value={editingType.description} onChange={(e) => setEditingType({ ...editingType, description: e.target.value })} className="w-full bg-[#07162E] border border-[#0F284B] rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingType(null)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">CANCELAR</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold bg-[#1667F4] text-white rounded-xl hover:bg-[#1253c4]">ACTUALIZAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOASTS */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-3.5 rounded-2xl border flex items-center gap-3 shadow-2xl font-mono text-xs font-bold ${
          toast.type === 'success' 
            ? 'bg-[#00271D]/90 border-[#065F46] text-white shadow-emerald-900/20' 
            : 'bg-[#2A0808]/90 border-[#7F1D1D] text-white shadow-red-900/20'
        }`}>
          <span className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          </span>
          <span className="tracking-wide">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
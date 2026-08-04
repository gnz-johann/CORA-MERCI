import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, ChevronLeft, ChevronRight, FileText, AlertTriangle, Book, Trash2, MessageCircle, Tag } from 'lucide-react';

export default function ConocimientoIA() {
  const [activeTab, setActiveTab] = useState('productos'); 
  
  // ================= ESTADOS DE DATOS =================
  const [documentos, setDocumentos] = useState([]);
  const [temas, setTemas] = useState([]);
  
  // FAQs
  const [faqs, setFaqs] = useState([]);
  const [listas, setListas] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // Productos
  const [productos, setProductos] = useState([]);
  const [listasProd, setListasProd] = useState([]);
  const [categoriasProd, setCategoriasProd] = useState([]);

  // ================= ESTADOS UI =================
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const [formData, setFormData] = useState({
    // Documentos / Temas
    titulo: '', tipo: '', contenido: '', tema: '', descripcion: '',
    // FAQs & Listas Generales
    pregunta: '', respuesta: '', listaId: '', categoriaId: '',
    temaList: '', descList: '', nombreCategoria: '',
    // Productos
    marca: '', modelo: '', categoriaProdId: '', descripcionProd: '', precio: ''
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Función asíncrona preparada para consumir la API de la BD real
    const cargarDatosBD = async () => {
      try {
        // TODO: Reemplazar con la petición real a tu API:
        // const response = await fetch('/api/conocimiento');
        // const data = await response.json();
        
        // Simulación de retraso de red
        await new Promise(resolve => setTimeout(resolve, 600));

        // MOCK DATA (Reemplazar por los set correspondientes de la BD)
        setDocumentos([
          { id: 1, titulo: 'Política de devoluciones 2026', tipo: 'Política', contenido: 'El cliente cuenta con 30 días naturales para solicitar una devolución...', fecha: '02/05/2026' },
          { id: 2, titulo: 'Guion base de bienvenida', tipo: 'Guion IA', contenido: 'Hola, gracias por comunicarte a ACME S.A. Mi nombre...', fecha: '22/06/2026' },
          { id: 3, titulo: 'Manual de escalamiento a supervisor', tipo: 'Procedimiento', contenido: 'Cuando el sentimiento de la llamada sea "Molesto" du...', fecha: '22/06/2026' },
          { id: 4, titulo: 'Catálogo de garantías por producto', tipo: 'Referencia', contenido: 'Los teléfonos IP Grandstream cuentan con 12 meses de...', fecha: '02/07/2026' },
        ]);

        setTemas([
          { id: 1, tema: 'Horario de atención', descripcion: 'El contact center opera las 24 horas mediante agentes IA. El soporte humano atiende de lunes a sábado de 8:00 a 20:00.' },
          { id: 2, tema: 'Zonas de cobertura', descripcion: 'Cubrimos toda la república mexicana con envíos nacionales por paquetería estándar y exprés.' },
        ]);

        setListas([{ id: 1, tema: 'Preguntas Generales', descripcion: 'FAQs de uso general para todos los clientes' }]);
        setCategorias([{ id: 1, nombre: 'General' }, { id: 2, nombre: 'Facturación' }]);
        
        setFaqs([
          { id: 1, pregunta: '¿Cuál es el horario de atención?', respuesta: 'El contact center opera las 24 horas mediante agentes IA; el soporte humano atiende de lunes a sábado de 8:00 a 20:00.', listaId: 1, categoriaId: 1 },
          { id: 2, pregunta: '¿Cómo solicito la cancelación de un servicio?', respuesta: 'Deberás enviar un correo a soporte con tu número de cliente 15 días antes del corte.', listaId: 1, categoriaId: 2 },
        ]);

        setListasProd([{ id: 1, tema: 'CATÁLOGO-2026', descripcion: 'Catálogo general de equipos y licencias' }]);
        setCategoriasProd([
          { id: 1, nombre: 'Teléfonos IP' },
          { id: 2, nombre: 'Licencias' },
          { id: 3, nombre: 'Accesorios' }
        ]);
        
        setProductos([
          { id: 1, marca: 'Grandstream', modelo: 'GXP2135', categoriaId: 1, descripcion: 'Teléfono IP empresarial 8 líneas, pantalla color...', precio: '2,450.00' },
          { id: 2, marca: 'Grandstream', modelo: 'GXP2140', categoriaId: 1, descripcion: 'Teléfono IP empresarial 10 líneas, pantalla color...', precio: '3,450.00' },
          { id: 3, marca: 'Grandstream', modelo: 'WP810', categoriaId: 1, descripcion: 'Teléfono IP con Wi-Fi y Bluetooth integrado', precio: '3,100.00' },
          { id: 4, marca: 'UCM', modelo: 'Cloud PBX', categoriaId: 2, descripcion: 'Licencia mensual PBX en la nube, hasta 50 extensiones', precio: '1,890.00' },
        ]);
      } catch (error) {
        showNotification('Error de conexión al cargar datos', false);
      }
    };

    cargarDatosBD();
  }, []);

  const tabs = [
    { id: 'documentos', label: 'DOCUMENTOS' },
    { id: 'informacion', label: 'INFORMACIÓN DEL NEGOCIO' },
    { id: 'faqs', label: 'FAQs' },
    { id: 'productos', label: 'PRODUCTOS' }
  ];

  // ================= CONTROLADORES DE MODALES Y ALERTAS =================
  const openModal = (type, data = null) => {
    setModalState({ isOpen: true, type, data });
    
    if (type.includes('edit') && data) {
      if (type === 'edit' && activeTab === 'documentos') setFormData({ ...formData, titulo: data.titulo, tipo: data.tipo, contenido: data.contenido });
      else if (type === 'edit' && activeTab === 'informacion') setFormData({ ...formData, tema: data.tema, descripcion: data.descripcion });
      else if (type === 'edit_faq') setFormData({ ...formData, pregunta: data.pregunta, respuesta: data.respuesta, listaId: data.listaId, categoriaId: data.categoriaId });
      else if (type === 'edit_list') setFormData({ ...formData, temaList: data.tema, descList: data.descripcion });
      else if (type === 'edit_list_prod') setFormData({ ...formData, temaList: data.tema, descList: data.descripcion });
      else if (type === 'edit_product') setFormData({ ...formData, marca: data.marca, modelo: data.modelo, categoriaProdId: data.categoriaId, descripcionProd: data.descripcion, precio: data.precio });
    } else if (!type.includes('delete')) {
      setFormData({
        titulo: '', tipo: '', contenido: '', tema: '', descripcion: '',
        pregunta: '', respuesta: '', listaId: listas[0]?.id || '', categoriaId: categorias[0]?.id || '',
        temaList: '', descList: '', nombreCategoria: '',
        marca: '', modelo: '', categoriaProdId: categoriasProd[0]?.id || '', descripcionProd: '', precio: ''
      });
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
  };

  const showNotification = (message, isSuccess = true) => {
    setToast({ type: isSuccess ? 'success' : 'error', message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAction = (e) => {
    e.preventDefault();
    // Simulación de interacción con BD (90% de éxito)
    // TODO: Reemplazar por llamadas a API reales (POST, PUT, DELETE)
    const isSuccess = Math.random() > 0.1; 
    
    if (isSuccess) {
      if (modalState.type === 'create_list') {
        setListas([...listas, { id: Date.now(), tema: formData.temaList, descripcion: formData.descList }]);
      } else if (modalState.type === 'create_list_prod') {
        setListasProd([...listasProd, { id: Date.now(), tema: formData.temaList, descripcion: formData.descList }]);
      } else if (modalState.type === 'create_category') {
        setCategorias([...categorias, { id: Date.now(), nombre: formData.nombreCategoria }]);
      } else if (modalState.type === 'create_category_prod') {
        setCategoriasProd([...categoriasProd, { id: Date.now(), nombre: formData.nombreCategoria }]);
      } else if (modalState.type === 'create_faq') {
        setFaqs([...faqs, { id: Date.now(), pregunta: formData.pregunta, respuesta: formData.respuesta, listaId: formData.listaId, categoriaId: formData.categoriaId }]);
      } else if (modalState.type === 'create_product') {
        setProductos([...productos, { id: Date.now(), marca: formData.marca, modelo: formData.modelo, categoriaId: Number(formData.categoriaProdId), descripcion: formData.descripcionProd, precio: formData.precio }]);
      }

      const actionName = modalState.type.includes('delete') ? 'eliminado' : modalState.type.includes('edit') ? 'actualizado' : 'creado';
      showNotification(`Elemento ${actionName} correctamente`);
    } else {
      showNotification('Hubo un error al procesar la solicitud', false);
    }
    closeModal();
  };

  const deleteCategory = (id, type) => {
    // TODO: Eliminar categoría en base de datos
    const isSuccess = Math.random() > 0.1;
    if (isSuccess) {
      if (type === 'faq') setCategorias(categorias.filter(c => c.id !== id));
      if (type === 'prod') setCategoriasProd(categoriasProd.filter(c => c.id !== id));
      showNotification('Categoría eliminada');
    } else {
      showNotification('Error al eliminar categoría', false);
    }
  };

  const getCategoryName = (id) => {
    const cat = categoriasProd.find(c => c.id === id);
    return cat ? cat.nombre : 'Sin asignar';
  };

  return (
    <div className="p-8 w-full min-h-screen bg-[#020817] text-white flex flex-col relative">
      
      {/* ================= HEADER & TABS ================= */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-[#0D2647] p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2
                font-['JetBrains_Mono'] tracking-wide
                ${activeTab === tab.id 
                  ? 'bg-gradient-to-br from-[#155EEF]/20 to-transparent text-[#155EEF] border border-[#155EEF]/25 shadow-[0_0_8px_rgba(21,94,239,0.1)]' 
                  : 'text-slate-400 border border-transparent hover:text-white hover:bg-[#0A1E38]'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button 
          onClick={() => {
            if (activeTab === 'documentos') openModal('create');
            if (activeTab === 'informacion') openModal('create');
            if (activeTab === 'faqs') openModal('create_faq');
            if (activeTab === 'productos') openModal('create_product');
          }}
          className="flex items-center gap-2 bg-[#1667F4] text-[#FFFFFF] px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity font-['JetBrains_Mono'] font-medium shadow-lg shadow-[#1667F4]/20"
        >
          <Plus size={16} />
          {activeTab === 'informacion' && 'NUEVO TEMA'}
          {activeTab === 'documentos' && 'NUEVO DOCUMENTO'}
          {activeTab === 'faqs' && 'NUEVO FAQ'}
          {activeTab === 'productos' && 'NUEVO PRODUCTO'}
        </button>
      </div>

      {/* ================= VISTA: DOCUMENTOS ================= */}
      {activeTab === 'documentos' && (
        <div className="flex-1 flex flex-col bg-[#061628] border border-[#0D2647] rounded-2xl overflow-hidden shadow-lg animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#0D2647] text-[10px] uppercase tracking-widest text-[#2C4E6D]">
                  <th className="p-5 font-bold font-['JetBrains_Mono']">Título</th>
                  <th className="p-5 font-bold font-['JetBrains_Mono']">Tipo</th>
                  <th className="p-5 font-bold font-['JetBrains_Mono']">Contenido</th>
                  <th className="p-5 font-bold font-['JetBrains_Mono']">Fecha</th>
                  <th className="p-5 font-bold font-['JetBrains_Mono'] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-slate-300">
                {documentos.map((doc) => (
                  <tr key={doc.id} className="border-b border-[#0D2647]/50 hover:bg-[#0A1E38] transition-colors">
                    <td className="p-5 text-slate-100 font-['JetBrains_Mono']">{doc.titulo}</td>
                    <td className="p-5 font-['JetBrains_Mono']">{doc.tipo}</td>
                    <td className="p-5 truncate max-w-xs font-['JetBrains_Mono']">{doc.contenido}</td>
                    <td className="p-5 font-['JetBrains_Mono'] text-xs text-slate-400">{doc.fecha}</td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => openModal('edit', doc)}
                          className="p-1.5 rounded-md bg-[#0D2647] text-[#155EEF] hover:text-white transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => openModal('delete', doc)}
                          className="p-1.5 rounded-md bg-[#0D2647] text-red-500 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#0A1E38]/30 mt-auto border-t border-[#0D2647]">
            <span className="text-xs text-[#2C4E6D] font-bold font-['JetBrains_Mono']">
              Mostrando {documentos.length} de {documentos.length}
            </span>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-md bg-[#0D2647] text-slate-400 hover:text-white transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-md bg-[#1667F4] text-white text-xs font-bold font-['JetBrains_Mono']">
                1
              </button>
              <button className="p-1.5 rounded-md bg-[#0D2647] text-slate-400 hover:text-white transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VISTA: INFORMACIÓN DEL NEGOCIO ================= */}
      {activeTab === 'informacion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {temas.map((item) => (
            <div key={item.id} className="bg-[#061628] border border-[#0D2647] rounded-2xl p-6 shadow-lg flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#0A1E38] text-[#155EEF]">
                  <Book size={18} />
                </div>
                <h3 className="font-['Syne'] font-bold text-white text-lg tracking-wide">{item.tema}</h3>
              </div>
              <p className="font-['JetBrains_Mono'] text-xs text-slate-300 leading-relaxed flex-1 mb-6">
                {item.descripcion}
              </p>
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-[#0D2647]/60">
                <button 
                  onClick={() => openModal('edit', item)}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-transparent border border-[#0D2647] text-[#155EEF] text-xs font-bold font-['JetBrains_Mono'] hover:bg-[#0A1E38] transition-colors"
                >
                  <Edit2 size={12} />
                  EDITAR
                </button>
                <button 
                  onClick={() => openModal('delete', item)}
                  className="p-2 rounded-lg bg-transparent border border-[#0D2647] text-red-500 hover:bg-[#0A1E38] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= VISTA: FAQs ================= */}
      {activeTab === 'faqs' && (
        <div className="flex flex-col gap-6 animate-fade-in-up">
          
          <div className="bg-[#061628] border border-[#0D2647] rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-[11px] font-bold font-['Syne'] text-white uppercase tracking-widest mb-3">LISTA</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="bg-[#020817] border border-[#0D2647] rounded-lg px-4 py-3 font-['JetBrains_Mono'] text-sm text-slate-200 min-w-[280px]">
                  {listas[0]?.tema || 'Sin listas'}
                </div>
                <span className="font-['JetBrains_Mono'] text-xs text-slate-500">
                  {listas[0]?.descripcion || ''}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button onClick={() => openModal('create_list')} className="px-4 py-2 rounded-lg border border-[#0D2647] text-slate-300 text-[11px] font-bold font-['JetBrains_Mono'] hover:bg-[#0A1E38] hover:text-white transition-colors flex items-center gap-2 uppercase tracking-wide">
                <Plus size={14} /> NUEVA LISTA
              </button>
              {listas.length > 0 && (
                <button onClick={() => openModal('edit_list', listas[0])} className="px-4 py-2 rounded-lg border border-[#0D2647] text-slate-300 text-[11px] font-bold font-['JetBrains_Mono'] hover:bg-[#0A1E38] hover:text-white transition-colors flex items-center gap-2 uppercase tracking-wide">
                  <Edit2 size={14} /> EDITAR LISTA
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#061628] border border-[#0D2647] rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-[11px] font-bold font-['Syne'] text-white uppercase tracking-widest mb-3">CATEGORÍAS FAQ</h3>
              <div className="flex flex-wrap items-center gap-3">
                {categorias.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#0D2647] bg-[#020817] text-xs font-['JetBrains_Mono'] text-slate-300 transition-colors hover:border-[#2C4E6D]">
                    {cat.nombre}
                    <button onClick={() => deleteCategory(cat.id, 'faq')} className="text-[#2C4E6D] hover:text-red-400 transition-colors bg-[#0D2647] rounded-full p-0.5">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => openModal('create_category')} className="px-4 py-2 rounded-lg border border-[#0D2647] text-slate-300 text-[11px] font-bold font-['JetBrains_Mono'] hover:bg-[#0A1E38] hover:text-white transition-colors flex items-center gap-2 uppercase tracking-wide mt-4 md:mt-0">
              <Plus size={14} /> NUEVA CATEGORÍA
            </button>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {faqs.map(faq => (
              <div key={faq.id} className="bg-[#061628] border border-[#0D2647] rounded-2xl p-5 shadow-lg flex items-center justify-between hover:border-[#2C4E6D] transition-colors group">
                <div className="flex items-start gap-5">
                  <div className="p-3 rounded-xl bg-[#0D2647]/50 text-[#155EEF]">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-['Syne'] text-base font-bold text-white mb-2">{faq.pregunta}</h4>
                    <p className="font-['JetBrains_Mono'] text-xs text-slate-400 leading-relaxed max-w-4xl">{faq.respuesta}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-4 border-l border-transparent group-hover:border-[#0D2647] transition-all">
                  <button onClick={() => openModal('edit_faq', faq)} className="p-2 rounded-lg bg-transparent border border-[#0D2647] text-slate-400 hover:text-white hover:bg-[#0A1E38] transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => openModal('delete_faq', faq)} className="p-2 rounded-lg bg-transparent border border-[#0D2647] text-red-500 hover:text-red-400 hover:bg-[#0A1E38] transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= VISTA: PRODUCTOS ================= */}
      {activeTab === 'productos' && (
        <div className="flex flex-col gap-6 animate-fade-in-up">
          
          <div className="bg-[#061628] border border-[#0D2647] rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-[11px] font-bold font-['Syne'] text-white uppercase tracking-widest mb-3">LISTA <span className="text-slate-500 lowercase font-normal ml-2">{listasProd[0]?.descripcion}</span></h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="bg-[#020817] border border-[#0D2647] rounded-lg px-4 py-3 font-['JetBrains_Mono'] text-sm text-slate-200 min-w-[280px]">
                  {listasProd[0]?.tema || 'Sin listas'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button onClick={() => openModal('create_list_prod')} className="px-4 py-2 rounded-lg border border-[#0D2647] text-slate-300 text-[11px] font-bold font-['JetBrains_Mono'] hover:bg-[#0A1E38] hover:text-white transition-colors flex items-center gap-2 uppercase tracking-wide">
                <Plus size={14} /> NUEVA LISTA
              </button>
              {listasProd.length > 0 && (
                <button onClick={() => openModal('edit_list_prod', listasProd[0])} className="px-4 py-2 rounded-lg border border-[#0D2647] text-slate-300 text-[11px] font-bold font-['JetBrains_Mono'] hover:bg-[#0A1E38] hover:text-white transition-colors flex items-center gap-2 uppercase tracking-wide">
                  <Edit2 size={14} /> EDITAR LISTA
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#061628] border border-[#0D2647] rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-[11px] font-bold font-['Syne'] text-white uppercase tracking-widest mb-3">CATEGORÍAS DE PRODUCTOS</h3>
              <div className="flex flex-wrap items-center gap-3">
                {categoriasProd.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#0D2647] bg-[#020817] text-xs font-['JetBrains_Mono'] text-slate-300 transition-colors hover:border-[#2C4E6D]">
                    {cat.nombre}
                    <button onClick={() => deleteCategory(cat.id, 'prod')} className="text-[#2C4E6D] hover:text-red-400 transition-colors bg-[#0D2647] rounded-full p-0.5">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => openModal('create_category_prod')} className="px-4 py-2 rounded-lg border border-[#0D2647] text-slate-300 text-[11px] font-bold font-['JetBrains_Mono'] hover:bg-[#0A1E38] hover:text-white transition-colors flex items-center gap-2 uppercase tracking-wide mt-4 md:mt-0">
              <Plus size={14} /> NUEVA CATEGORÍA
            </button>
          </div>

          <div className="flex-1 flex flex-col bg-[#061628] border border-[#0D2647] rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#0D2647] text-[10px] uppercase tracking-widest text-[#2C4E6D]">
                    <th className="p-5 font-bold font-['JetBrains_Mono']">Título</th>
                    <th className="p-5 font-bold font-['JetBrains_Mono']">Modelo</th>
                    <th className="p-5 font-bold font-['JetBrains_Mono']">Categoría</th>
                    <th className="p-5 font-bold font-['JetBrains_Mono']">Descripción</th>
                    <th className="p-5 font-bold font-['JetBrains_Mono']">Precio</th>
                    <th className="p-5 font-bold font-['JetBrains_Mono'] text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-slate-300">
                  {productos.map((prod) => (
                    <tr key={prod.id} className="border-b border-[#0D2647]/50 hover:bg-[#0A1E38] transition-colors group">
                      <td className="p-5 text-slate-100 font-['JetBrains_Mono'] font-bold">{prod.marca}</td>
                      <td className="p-5 font-['JetBrains_Mono']">{prod.modelo}</td>
                      <td className="p-5 font-['JetBrains_Mono'] text-slate-400">{getCategoryName(prod.categoriaId)}</td>
                      <td className="p-5 truncate max-w-[200px] font-['JetBrains_Mono'] text-slate-400">{prod.descripcion}</td>
                      <td className="p-5 font-['JetBrains_Mono'] text-[#10B981] font-bold">${prod.precio} MXN</td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal('edit_product', prod)} className="p-1.5 rounded-md bg-[#0D2647] text-[#155EEF] hover:text-white transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => openModal('delete_product', prod)} className="p-1.5 rounded-md bg-[#0D2647] text-red-500 hover:text-red-400 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end p-4 bg-[#0A1E38]/30 mt-auto border-t border-[#0D2647]">
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-md bg-[#0D2647] text-slate-400 hover:text-white transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded-md bg-[#155EEF] text-white text-xs font-bold font-['JetBrains_Mono']">
                  1
                </button>
                <button className="p-1.5 rounded-md bg-[#0D2647] text-slate-400 hover:text-white transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODALES GLOBALES ===================== */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#061628] border border-[#0D2647] rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-[#0D2647]">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${modalState.type?.includes('delete') ? 'bg-red-500/10 text-red-500' : 'bg-[#0A1E38] text-white'}`}>
                  {(modalState.type?.includes('create') && !modalState.type?.includes('product')) && <FileText size={20} />}
                  {modalState.type?.includes('edit') && !modalState.type?.includes('product') && <Edit2 size={20} />}
                  {modalState.type?.includes('delete') && <AlertTriangle size={20} />}
                  {modalState.type?.includes('product') && !modalState.type?.includes('delete') && <Tag size={20} />}
                </div>
                <h2 className="text-xl font-bold font-['Syne'] text-white">
                  {modalState.type === 'create' && activeTab === 'documentos' && 'Crear Documento'}
                  {modalState.type === 'create' && activeTab === 'informacion' && 'Crear Tema'}
                  {modalState.type === 'edit' && activeTab === 'documentos' && 'Editar Documento'}
                  {modalState.type === 'edit' && activeTab === 'informacion' && 'Editar Tema'}
                  {modalState.type === 'delete' && activeTab === 'documentos' && 'Eliminar Documento'}
                  {modalState.type === 'delete' && activeTab === 'informacion' && 'Eliminar Tema'}
                  {modalState.type === 'create_faq' && 'Crear FAQ'}
                  {modalState.type === 'edit_faq' && 'Editar FAQ'}
                  {modalState.type === 'delete_faq' && 'Eliminar FAQ'}
                  {modalState.type === 'create_list' && 'Crear Lista'}
                  {modalState.type === 'create_list_prod' && 'Crear Lista de Productos'}
                  {modalState.type === 'edit_list' && 'Editar Lista'}
                  {modalState.type === 'edit_list_prod' && 'Editar Lista de Productos'}
                  {modalState.type === 'create_category' && 'Crear Categoría'}
                  {modalState.type === 'create_category_prod' && 'Crear Categoría de Producto'}
                  {modalState.type === 'create_product' && 'Crear Producto'}
                  {modalState.type === 'edit_product' && 'Editar Producto'}
                  {modalState.type === 'delete_product' && 'Eliminar Producto'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg bg-[#0A1E38] text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body del Modal */}
            <div className="p-6">
              
              {/* FORMS: Documentos */}
              {(modalState.type === 'create' || modalState.type === 'edit') && activeTab === 'documentos' && (
                <form id="global-form" onSubmit={handleAction} className="space-y-5 font-['JetBrains_Mono']">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Título</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Política de devoluciones 2026" 
                      value={formData.titulo} 
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})} 
                      className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Tipo de documento</label>
                    <input 
                      type="text" 
                      placeholder="Política" 
                      value={formData.tipo} 
                      onChange={(e) => setFormData({...formData, tipo: e.target.value})} 
                      className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Contenido</label>
                    <textarea 
                      placeholder="Escribe el contenido detallado aquí..." 
                      value={formData.contenido} 
                      onChange={(e) => setFormData({...formData, contenido: e.target.value})} 
                      className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors min-h-[120px] resize-none" 
                      required 
                    />
                  </div>
                </form>
              )}

              {/* FORMS: Información de Negocio */}
              {(modalState.type === 'create' || modalState.type === 'edit') && activeTab === 'informacion' && (
                <form id="global-form" onSubmit={handleAction} className="space-y-5 font-['JetBrains_Mono']">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Tema</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Horario de soporte técnico" 
                      value={formData.tema} 
                      onChange={(e) => setFormData({...formData, tema: e.target.value})} 
                      className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Descripción</label>
                    <textarea 
                      placeholder="Detalles del tema..." 
                      value={formData.descripcion} 
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
                      className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors min-h-[120px] resize-none" 
                      required 
                    />
                  </div>
                </form>
              )}

              {/* FORMS: FAQs */}
              {(modalState.type === 'create_faq' || modalState.type === 'edit_faq') && (
                <form id="global-form" onSubmit={handleAction} className="space-y-5 font-['JetBrains_Mono']">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Lista</label>
                      <select value={formData.listaId} onChange={(e) => setFormData({...formData, listaId: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" required>
                        <option value="">Seleccionar...</option>
                        {listas.map(l => <option key={l.id} value={l.id}>{l.tema}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Categoría</label>
                      <select value={formData.categoriaId} onChange={(e) => setFormData({...formData, categoriaId: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" required>
                        <option value="">Seleccionar...</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Pregunta</label>
                    <input type="text" placeholder="¿Cómo hago...?" value={formData.pregunta} onChange={(e) => setFormData({...formData, pregunta: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Respuesta</label>
                    <textarea placeholder="Para hacerlo debes..." value={formData.respuesta} onChange={(e) => setFormData({...formData, respuesta: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors min-h-[100px] resize-none" required />
                  </div>
                </form>
              )}

              {/* FORMS: Listas & Categorías Generales */}
              {(modalState.type.includes('create_list') || modalState.type.includes('edit_list')) && (
                <form id="global-form" onSubmit={handleAction} className="space-y-5 font-['JetBrains_Mono']">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Nombre de la Lista</label>
                    <input type="text" placeholder="Ej: Catálogo Principal" value={formData.temaList} onChange={(e) => setFormData({...formData, temaList: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Descripción</label>
                    <textarea placeholder="Breve descripción..." value={formData.descList} onChange={(e) => setFormData({...formData, descList: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors min-h-[100px] resize-none" />
                  </div>
                </form>
              )}

              {modalState.type.includes('create_category') && (
                <form id="global-form" onSubmit={handleAction} className="space-y-5 font-['JetBrains_Mono']">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Nombre de la Categoría</label>
                    <input type="text" placeholder="Ej: General, Ventas, etc." value={formData.nombreCategoria} onChange={(e) => setFormData({...formData, nombreCategoria: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" required />
                  </div>
                </form>
              )}

              {/* FORMS: Productos */}
              {(modalState.type === 'create_product' || modalState.type === 'edit_product') && (
                <form id="global-form" onSubmit={handleAction} className="space-y-5 font-['JetBrains_Mono']">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Marca / Título</label>
                      <input type="text" placeholder="Ej: Grandstream" value={formData.marca} onChange={(e) => setFormData({...formData, marca: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Modelo</label>
                      <input type="text" placeholder="Ej: GXP2135" value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Categoría</label>
                      <select value={formData.categoriaProdId} onChange={(e) => setFormData({...formData, categoriaProdId: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" required>
                        <option value="">Seleccionar...</option>
                        {categoriasProd.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Precio (MXN)</label>
                      <input type="text" placeholder="2,450.00" value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors" required />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-[#2C4E6D] uppercase tracking-widest">Descripción</label>
                    <textarea placeholder="Especificaciones del producto..." value={formData.descripcionProd} onChange={(e) => setFormData({...formData, descripcionProd: e.target.value})} className="w-full bg-[#020817] border border-[#0D2647] rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-[#155EEF] transition-colors min-h-[80px] resize-none" required />
                  </div>
                </form>
              )}

              {/* VISTA: Confirmación de Eliminación */}
              {modalState.type?.includes('delete') && (
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
                  <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-2">
                    <AlertTriangle size={48} />
                  </div>
                  <h3 className="text-lg font-bold font-['Syne'] text-white">¿Estás seguro de eliminar este elemento?</h3>
                  <p className="text-sm font-['JetBrains_Mono'] text-slate-400">Esta acción no se puede deshacer y los datos se perderán permanentemente de la base de datos.</p>
                </div>
              )}

            </div>

            {/* Footer del Modal (Botones) */}
            <div className="p-6 border-t border-[#0D2647] flex items-center justify-end gap-3 bg-[#0A1E38]/20">
              <button 
                onClick={closeModal} 
                className="px-5 py-2 rounded-lg text-sm font-bold font-['JetBrains_Mono'] text-slate-300 hover:text-white hover:bg-[#0D2647] transition-colors"
              >
                CANCELAR
              </button>
              
              {modalState.type?.includes('delete') ? (
                <button 
                  onClick={handleAction} 
                  className="px-5 py-2 rounded-lg bg-red-500 text-white text-sm font-bold font-['JetBrains_Mono'] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2"
                >
                  <Trash2 size={16} /> ELIMINAR
                </button>
              ) : (
                <button 
                  type="submit" 
                  form="global-form" 
                  className="px-5 py-2 rounded-lg bg-[#155EEF] text-white text-sm font-bold font-['JetBrains_Mono'] hover:opacity-90 transition-opacity shadow-lg shadow-[#155EEF]/20 flex items-center gap-2"
                >
                  GUARDAR CAMBIOS
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ===================== TOAST NOTIFICATION ===================== */}
      {toast && (
        <div className={`fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl z-50 animate-fade-in-up font-['JetBrains_Mono'] text-sm font-bold border ${
          toast.type === 'success' 
            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' 
            : 'bg-red-500/10 text-red-500 border-red-500/20'
        }`}>
          {toast.type === 'success' ? <div className="w-2 h-2 rounded-full bg-[#10B981]" /> : <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}
      
    </div>
  );
}
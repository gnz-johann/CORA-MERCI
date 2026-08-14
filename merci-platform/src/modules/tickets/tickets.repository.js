const prisma = require('../../config/database');

// 1. Obtener todos los tickets de una empresa
const obtenerTicketsPorEmpresaBD = async (empresa_id) => {
  return await prisma.tickets.findMany({
    where: {
      empresa_id: String(empresa_id),
      deleted_at: null
    },
    include: {
      clientes: {
        select: { id: true, nombre: true, apellido: true, empresa_cliente: true }
      },
      usuarios: {
        select: { id: true, nombre: true, correo: true }
      },
      catalogo_estado_ticket: true,
      catalogo_prioridad_ticket: true,
      departamentos: { select: { id: true, nombre: true } },
      llamadas: { select: { id: true, pbx_call_id: true, numero_origen: true } },
      ticket_comentarios: {
        include: {
          usuarios: { select: { id: true, nombre: true } }
        },
        orderBy: { fecha_registro: 'asc' }
      }
    },
    orderBy: {
      fecha_creacion: 'desc'
    }
  });
};

// 2. Obtener un ticket por ID — exige que pertenezca a la empresa que consulta
const obtenerTicketPorIdBD = async (id, empresa_id) => {
  return await prisma.tickets.findFirst({
    where: {
      id: String(id),
      empresa_id: String(empresa_id),
      deleted_at: null
    },
    include: {
      clientes: { select: { id: true, nombre: true, apellido: true } },
      usuarios: { select: { id: true, nombre: true, correo: true } },
      catalogo_estado_ticket: true,
      catalogo_prioridad_ticket: true,
      departamentos: { select: { id: true, nombre: true } },
      ticket_comentarios: {
        include: {
          usuarios: { select: { id: true, nombre: true } }
        },
        orderBy: { fecha_registro: 'asc' }
      }
    }
  });
};

// 3. Crear ticket
const crearTicketBD = async (datos) => {
  return await prisma.tickets.create({
    data: {
      empresa_id: String(datos.empresa_id),
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      prioridad_ticket_id: datos.prioridad_ticket_id ? String(datos.prioridad_ticket_id) : null,
      estado_ticket_id: datos.estado_ticket_id ? String(datos.estado_ticket_id) : null,
      departamento_id: datos.departamento_id ? String(datos.departamento_id) : null,
      cliente_id: datos.cliente_id ? String(datos.cliente_id) : null,
      usuario_responsable_id: datos.usuario_responsable_id ? String(datos.usuario_responsable_id) : null,
      llamada_id: datos.llamada_id ? String(datos.llamada_id) : null
    },
    include: {
      catalogo_estado_ticket: true,
      catalogo_prioridad_ticket: true,
      clientes: true
    }
  });
};

// 4. Actualizar ticket — Prisma no permite un `where` compuesto por id+empresa_id
// en `update` directo (empresa_id no es única), así que primero se verifica
// pertenencia con findFirst y luego se actualiza por id. Mismo patrón que ya
// usa agentes.service.js (obtenerPorId antes de actualizar/eliminar).
const actualizarTicketBD = async (id, empresa_id, datos) => {
  const existente = await prisma.tickets.findFirst({
    where: { id: String(id), empresa_id: String(empresa_id), deleted_at: null },
    select: { id: true }
  });
  if (!existente) return null;

  return await prisma.tickets.update({
    where: { id: String(id) },
    data: {
      ...(datos.titulo && { titulo: datos.titulo }),
      ...(datos.descripcion && { descripcion: datos.descripcion }),
      ...(datos.estado_ticket_id && { estado_ticket_id: String(datos.estado_ticket_id) }),
      ...(datos.prioridad_ticket_id && { prioridad_ticket_id: String(datos.prioridad_ticket_id) }),
      ...(datos.departamento_id && { departamento_id: String(datos.departamento_id) }),
      ...(datos.usuario_responsable_id && { usuario_responsable_id: String(datos.usuario_responsable_id) }),
      ...(datos.cliente_id && { cliente_id: String(datos.cliente_id) }),
      ...(datos.fecha_cierre && { fecha_cierre: datos.fecha_cierre })
    }
  });
};

// 5. Eliminar ticket (Soft Delete) — misma verificación de pertenencia que arriba
const eliminarTicketBD = async (id, empresa_id) => {
  const existente = await prisma.tickets.findFirst({
    where: { id: String(id), empresa_id: String(empresa_id), deleted_at: null },
    select: { id: true }
  });
  if (!existente) return null;

  return await prisma.tickets.update({
    where: { id: String(id) },
    data: { deleted_at: new Date() }
  });
};

// 6. Catálogos de estado/prioridad — catalogo_estado_ticket y
// catalogo_prioridad_ticket son globales (no llevan empresa_id), ya vienen
// sembrados vía db/merci_schema.sql. Sin orderBy a propósito: no hay columna
// de orden en el schema, y ordenar por nombre alfabético rompería la
// secuencia lógica del flujo (Abierto → En Proceso → Pendiente → Resuelto →
// Cerrado/Cancelado) — se deja el orden natural en el que Postgres las
// sembró.
const obtenerCatalogosBD = async () => {
  const [estados, prioridades] = await Promise.all([
    prisma.catalogo_estado_ticket.findMany({
      where: { deleted_at: null },
      select: { id: true, nombre: true }
    }),
    prisma.catalogo_prioridad_ticket.findMany({
      where: { deleted_at: null },
      select: { id: true, nombre: true }
    })
  ]);
  return { estados, prioridades };
};

// 7. Agregar comentario a un ticket — ticket_comentarios no tiene empresa_id
// propio (ver schema.prisma), la pertenencia a la empresa se valida en el
// controller antes de llamar acá, reusando obtenerTicketPorIdBD.
const crearComentarioBD = async (datos) => {
  return await prisma.ticket_comentarios.create({
    data: {
      ticket_id: String(datos.ticket_id),
      usuario_id: String(datos.usuario_id),
      comentario: datos.comentario
    },
    include: {
      usuarios: { select: { id: true, nombre: true } }
    }
  });
};

// Usado por la API interna (src/modules/internal/) para traducir la
// `prioridad` en texto que manda el puente de voz ('Baja'/'Media'/'Alta'/
// 'Crítica') al prioridad_ticket_id (UUID) que espera crearTicketBD.
const buscarPrioridadPorNombre = async (nombre) => {
  return prisma.catalogo_prioridad_ticket.findFirst({
    where: { nombre, deleted_at: null },
    select: { id: true }
  });
};

module.exports = {
  obtenerTicketsPorEmpresaBD,
  obtenerTicketPorIdBD,
  crearTicketBD,
  actualizarTicketBD,
  eliminarTicketBD,
  crearComentarioBD,
  obtenerCatalogosBD,
  buscarPrioridadPorNombre
};
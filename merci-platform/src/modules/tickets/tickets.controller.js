const {
  obtenerTicketsPorEmpresaBD,
  obtenerTicketPorIdBD,
  crearTicketBD,
  actualizarTicketBD,
  eliminarTicketBD,
  crearComentarioBD,
  obtenerCatalogosBD
} = require('./tickets.repository');

const obtenerTickets = async (req, res) => {
  try {
    // empresa_id sale del token (setTenant), ya no de req.query — un query param
    // lo puede mandar cualquiera, el token no.
    const tickets = await obtenerTicketsPorEmpresaBD(req.empresaId);
    res.json({ ok: true, data: tickets });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

const obtenerTicketPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await obtenerTicketPorIdBD(id, req.empresaId);
    if (!ticket) {
      return res.status(404).json({ ok: false, mensaje: 'Ticket no encontrado' });
    }
    res.json({ ok: true, data: ticket });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

const crearTicket = async (req, res) => {
  try {
    // empresa_id se fuerza desde el token, nunca desde req.body — evita que un
    // usuario cree un ticket a nombre de otra empresa mandando otro empresa_id.
    const ticketNuevo = await crearTicketBD({ ...req.body, empresa_id: req.empresaId });
    res.status(201).json({ ok: true, mensaje: 'Ticket creado exitosamente', data: ticketNuevo });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

const actualizarTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticketActualizado = await actualizarTicketBD(id, req.empresaId, req.body);
    if (!ticketActualizado) {
      return res.status(404).json({ ok: false, mensaje: 'Ticket no encontrado' });
    }
    res.json({ ok: true, mensaje: 'Ticket actualizado exitosamente', data: ticketActualizado });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

const eliminarTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await eliminarTicketBD(id, req.empresaId);
    if (!eliminado) {
      return res.status(404).json({ ok: false, mensaje: 'Ticket no encontrado' });
    }
    res.json({ ok: true, mensaje: 'Ticket eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

const agregarComentario = async (req, res) => {
  try {
    const { ticket_id, comentario } = req.body;
    if (!ticket_id || !comentario) {
      return res.status(400).json({ ok: false, mensaje: 'ticket_id y comentario son obligatorios' });
    }

    // ticket_comentarios no lleva empresa_id propio (ver schema.prisma) —
    // se valida pertenencia consultando el ticket con el mismo filtro de
    // empresa que ya usan actualizarTicket/eliminarTicket, para no permitir
    // comentar un ticket de otra empresa aunque se conozca su id.
    const ticket = await obtenerTicketPorIdBD(ticket_id, req.empresaId);
    if (!ticket) {
      return res.status(404).json({ ok: false, mensaje: 'Ticket no encontrado' });
    }

    const comentarioNuevo = await crearComentarioBD({
      ticket_id,
      usuario_id: req.user.usuarioId,
      comentario
    });
    res.status(201).json({ ok: true, mensaje: 'Comentario agregado correctamente', data: comentarioNuevo });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

const obtenerCatalogos = async (req, res) => {
  try {
    // Catálogos globales (no llevan empresa_id) — mismos para todas las
    // empresas, no hace falta req.empresaId aquí.
    const catalogos = await obtenerCatalogosBD();
    res.json({ ok: true, mensaje: 'Catálogos obtenidos', data: catalogos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

module.exports = {
  obtenerTickets,
  obtenerTicketPorId,
  crearTicket,
  actualizarTicket,
  eliminarTicket,
  agregarComentario,
  obtenerCatalogos
};
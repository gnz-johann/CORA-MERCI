// prisma/seed.js
// Bloque 3.2 del plan de estabilización — datos de prueba realistas para
// poder probar cada vista contra Postgres real, no contra mocks.
//
// No toca los datos ya existentes en la BD (2 empresas / 5 usuarios reales
// vistos antes de escribir esto): crea SU PROPIA empresa nueva, aislada,
// identificable por nombre_comercial ('Empresa Demo Estabilización'). Si ya
// existe (segunda corrida del seed), no duplica nada — sale temprano.
//
// Reutiliza los services/repositories reales del proyecto (empresasService,
// sucursalesService, usuariosService, agentesService) en vez de reescribir
// su lógica de negocio — mismo hash de password, misma creación de roles
// por defecto, misma validación, que si se creara por la API real.
//
// Uso: node prisma/seed.js  (o `npx prisma db seed`, configurado en package.json)

'use strict'

// El servidor completo (src/config/env.js) exige CREDENCIALES_IA_ENCRYPTION_KEY
// desde la Sección 2.4.3 — este seed no cifra nada, así que si la variable
// real todavía no está en .env, se usa un valor de relleno solo para pasar
// la validación de arranque (nunca se usa para cifrar nada de verdad aquí).
require('dotenv').config()
if (!process.env.CREDENCIALES_IA_ENCRYPTION_KEY) {
  process.env.CREDENCIALES_IA_ENCRYPTION_KEY = '0'.repeat(64)
}

const prisma = require('../src/config/database')
const empresasService = require('../src/modules/empresas/empresas.service')
const sucursalesService = require('../src/modules/sucursales/sucursales.service')
const usuariosService = require('../src/modules/usuarios/usuarios.service')
const agentesService = require('../src/modules/agentes/agentes.service')

const NOMBRE_EMPRESA_SEED = 'Empresa Demo Estabilización'
const CONTEXTO = { usuarioId: null, ip: '127.0.0.1' } // "sistema" — no hay admin todavía

async function obtenerIdCatalogo(modelo, nombre) {
  const fila = await prisma[modelo].findFirst({ where: { nombre } })
  if (!fila) throw new Error(`Catálogo ${modelo} no tiene sembrado '${nombre}' — revisar db/merci_schema.sql`)
  return fila.id
}

async function main() {
  const yaExiste = await prisma.empresas.findFirst({ where: { nombre_comercial: NOMBRE_EMPRESA_SEED } })
  if (yaExiste) {
    console.log(`Ya existe '${NOMBRE_EMPRESA_SEED}' (id ${yaExiste.id}) — el seed no duplica nada. Nada que hacer.`)
    return
  }

  // 1. Empresa — crea también los 2 roles por defecto (Administrador General
  //    y Administrador de Sucursal), vía empresasRepository.crearRolesDefault()
  const empresa = await empresasService.crear(
    {
      nombre_comercial: NOMBRE_EMPRESA_SEED,
      razon_social: 'Demo Estabilización S.A. de C.V.',
      rfc: 'DES010101AAA',
      telefono: '5555555555',
      correo: 'contacto@demo-estabilizacion.test',
    },
    CONTEXTO
  )
  console.log(`Empresa creada: ${empresa.id} (código de acceso: ${empresa.codigo_acceso})`)

  const [rolAdminGeneral, rolAdminSucursal] = await Promise.all([
    prisma.catalogo_roles.findFirst({ where: { empresa_id: empresa.id, nombre: 'Administrador General' } }),
    prisma.catalogo_roles.findFirst({ where: { empresa_id: empresa.id, nombre: 'Administrador de Sucursal' } }),
  ])

  // 2. Sucursal
  const sucursal = await sucursalesService.crearSucursal(
    { empresaId: empresa.id, nombre: 'Sucursal Centro', direccion: 'Av. Reforma 123', telefono: '5555550001' },
    { ...CONTEXTO, empresaId: empresa.id }
  )
  console.log(`Sucursal creada: ${sucursal.id}`)

  // 3. Usuarios — uno por rol, para poder probar el scoping real
  //    (Admin General ve toda la empresa, Admin Sucursal solo la suya)
  const adminGeneral = await usuariosService.crear(
    {
      empresaId: empresa.id, sucursalId: null,
      nombre: 'Admin General Demo', usuario: 'admin.general.demo', correo: 'admin.general@demo-estabilizacion.test',
      password: 'Demo1234',
    },
    CONTEXTO
  )
  const adminSucursal = await usuariosService.crear(
    {
      empresaId: empresa.id, sucursalId: sucursal.id,
      nombre: 'Admin Sucursal Demo', usuario: 'admin.sucursal.demo', correo: 'admin.sucursal@demo-estabilizacion.test',
      password: 'Demo1234',
    },
    CONTEXTO
  )
  console.log(`Usuarios creados: ${adminGeneral.usuarioId} (Admin General), ${adminSucursal.usuarioId} (Admin Sucursal)`)

  await usuariosService.asignarRoles(
    { usuarioId: adminGeneral.usuarioId, empresaId: empresa.id, rolesIds: [rolAdminGeneral.id] },
    CONTEXTO
  )
  await usuariosService.asignarRoles(
    { usuarioId: adminSucursal.usuarioId, empresaId: empresa.id, rolesIds: [rolAdminSucursal.id] },
    CONTEXTO
  )
  console.log('Roles asignados.')

  // 4. Agentes virtuales (algunos)
  const estadoDisponible = await obtenerIdCatalogo('catalogo_estado_agente', 'Disponible')
  const agentesData = [
    { nombre: 'Agente Ventas', descripcion: 'Atiende consultas de ventas y cotizaciones' },
    { nombre: 'Agente Soporte', descripcion: 'Atiende tickets de soporte técnico' },
    { nombre: 'Agente Recepción', descripcion: 'Enruta llamadas entrantes al departamento correcto' },
  ]
  const agentes = []
  for (const datos of agentesData) {
    const agente = await agentesService.crearAgente(
      empresa.id,
      { ...datos, estado_agente_id: estadoDisponible, sucursal_id: sucursal.id },
      adminGeneral.usuarioId
    )
    agentes.push(agente)
  }
  console.log(`Agentes creados: ${agentes.length}`)

  // 5. Llamadas (algunas) — creadas directo con Prisma (no hay un "crear"
  //    simple reutilizable: llamadas.repository solo expone upsertLlamada,
  //    pensado para eventos reales de CloudUCM, no para datos de prueba)
  const [estadoFinalizada, estadoEnProceso, resultadoExitosa, resultadoEscalada] = await Promise.all([
    obtenerIdCatalogo('catalogo_estado_llamada', 'Finalizada'),
    obtenerIdCatalogo('catalogo_estado_llamada', 'En Proceso'),
    obtenerIdCatalogo('catalogo_resultado_llamada', 'Exitosa'),
    obtenerIdCatalogo('catalogo_resultado_llamada', 'Escalada a Humano'),
  ])

  const ahora = Date.now()
  const llamadasData = [
    { agente: agentes[0], numero_origen: '5551110001', duracion_seg: 185, estado_llamada_id: estadoFinalizada, resultado_llamada_id: resultadoExitosa, clasificacion_ia: 'Consulta de precio' },
    { agente: agentes[0], numero_origen: '5551110002', duracion_seg: 302, estado_llamada_id: estadoFinalizada, resultado_llamada_id: resultadoEscalada, clasificacion_ia: 'Queja de servicio', escalada_humano: true },
    { agente: agentes[1], numero_origen: '5551110003', duracion_seg: 94,  estado_llamada_id: estadoFinalizada, resultado_llamada_id: resultadoExitosa, clasificacion_ia: 'Soporte técnico' },
    { agente: agentes[1], numero_origen: '5551110004', duracion_seg: 0,   estado_llamada_id: estadoEnProceso,  resultado_llamada_id: null, clasificacion_ia: null },
    { agente: agentes[2], numero_origen: '5551110005', duracion_seg: 45,  estado_llamada_id: estadoFinalizada, resultado_llamada_id: resultadoExitosa, clasificacion_ia: 'Enrutamiento' },
  ]

  const llamadas = []
  for (const [i, datos] of llamadasData.entries()) {
    const inicio = new Date(ahora - (llamadasData.length - i) * 3600_000)
    const llamada = await prisma.llamadas.create({
      data: {
        empresa_id: empresa.id,
        agente_id: datos.agente.id,
        numero_origen: datos.numero_origen,
        numero_destino: '5559990000',
        fecha_inicio: inicio,
        fecha_fin: datos.duracion_seg ? new Date(inicio.getTime() + datos.duracion_seg * 1000) : null,
        duracion_seg: datos.duracion_seg || null,
        estado_llamada_id: datos.estado_llamada_id,
        resultado_llamada_id: datos.resultado_llamada_id,
        clasificacion_ia: datos.clasificacion_ia,
        escalada_humano: datos.escalada_humano || false,
      },
    })
    llamadas.push(llamada)
  }
  console.log(`Llamadas creadas: ${llamadas.length}`)

  // 6. Tickets (algunos) — mismo shape que tickets.repository.crearTicketBD
  const [estadoAbierto, estadoTicketEnProceso, estadoResuelto, prioridadMedia, prioridadAlta] = await Promise.all([
    obtenerIdCatalogo('catalogo_estado_ticket', 'Abierto'),
    obtenerIdCatalogo('catalogo_estado_ticket', 'En Proceso'),
    obtenerIdCatalogo('catalogo_estado_ticket', 'Resuelto'),
    obtenerIdCatalogo('catalogo_prioridad_ticket', 'Media'),
    obtenerIdCatalogo('catalogo_prioridad_ticket', 'Alta'),
  ])

  // fecha_creacion se fija explícito (no el default now() de la BD) para
  // poder garantizar fecha_cierre > fecha_creacion en el ticket ya resuelto
  // — chk_ticket_fechas exige ese orden y un default server-side más un
  // `new Date()` calculado en el cliente unos milisegundos antes casi
  // siempre lo viola.
  const haceTresDias = new Date(ahora - 3 * 24 * 3600_000)
  const ticketsData = [
    { titulo: 'Cliente reporta corte de llamada', descripcion: 'La llamada se cortó a mitad de la consulta.', estado_ticket_id: estadoAbierto, prioridad_ticket_id: prioridadAlta, llamada_id: llamadas[1].id, fecha_creacion: haceTresDias },
    { titulo: 'Solicitud de cotización especial', descripcion: 'Cliente pide cotización para 50 licencias.', estado_ticket_id: estadoTicketEnProceso, prioridad_ticket_id: prioridadMedia, fecha_creacion: haceTresDias },
    { titulo: 'Duda de facturación resuelta', descripcion: 'Se aclaró el cobro duplicado del mes pasado.', estado_ticket_id: estadoResuelto, prioridad_ticket_id: prioridadMedia, fecha_creacion: haceTresDias, fecha_cierre: new Date(ahora) },
  ]

  const tickets = []
  for (const datos of ticketsData) {
    const ticket = await prisma.tickets.create({
      data: { empresa_id: empresa.id, usuario_responsable_id: adminGeneral.usuarioId, ...datos },
    })
    tickets.push(ticket)
  }
  console.log(`Tickets creados: ${tickets.length}`)

  console.log('\n── Seed completo ──')
  console.log(`Empresa:        ${empresa.id}  (código de acceso: ${empresa.codigo_acceso})`)
  console.log(`Admin General:  usuario=admin.general.demo  password=Demo1234`)
  console.log(`Admin Sucursal: usuario=admin.sucursal.demo password=Demo1234  (sucursal: ${sucursal.id})`)
}

main()
  .catch((err) => {
    console.error('ERROR en el seed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

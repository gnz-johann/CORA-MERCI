// test-add-invalid-extension.js — Diagnóstico para el error -25 en addSIPAccountAndUser.
//
// No crea nada: manda una extensión con formato inválido (un solo dígito,
// fuera del rango documentado "2-18 dígitos") a propósito. El objetivo es
// distinguir dos escenarios:
//   - Si CloudUCM responde -1 "Invalid parameters" (o similar, distinto a -25):
//     el handler de addSIPAccountAndUser SÍ valida datos reales antes de
//     escribir, así que -25 con datos válidos apunta a otra causa (permiso,
//     campo faltante, etc.), no a que la acción esté simplemente "no
//     implementada" en la superficie New API.
//   - Si vuelve a responder -25 "Failed to update data" igual que con
//     extensiones válidas (9999, 1099): sugiere que el handler nunca llega a
//     validar el formato — consistente con que addSIPAccountAndUser no esté
//     realmente conectado a la capa de escritura en esta superficie de API
//     (ninguna de las dos listas maestras de acciones soportadas de los PDFs
//     de Grandstream la incluye).
const CloudUCMProvider = require('../../src/services/pbx/CloudUCMProvider');
const prisma = require('../../src/config/database');

(async () => {
    const cfg = await prisma.configuraciones_pbx.findFirst({ where: { activo: true, deleted_at: null } });
    if (!cfg) { console.error('No hay configuraciones_pbx activa.'); process.exit(1); }

    const ucm = new CloudUCMProvider();
    try {
        const login = await ucm.connect(cfg.empresa_id);
        console.log('LOGIN:', login.status, '(status 0 = éxito)');

        console.log('Intentando addSIPAccountAndUser con extension inválida ("1", 1 dígito)...');
        const res = await ucm.addSIPAccountAndUser(cfg.empresa_id, {
            extension: '1',
            secret: 'Diagn0stico!Test',
        });
        console.log('RESPUESTA (inesperado que no lance error):', JSON.stringify(res));
    } catch (e) {
        console.error('FALLÓ (esperado) — mensaje categorizado:', e.message, '| categoria:', e.categoria);
        console.error('Ver arriba el log de _request() con el status/response crudo de CloudUCM.');
    } finally {
        process.exit(0);
    }
})();

// test-crear-extension-real.js — Prueba real de creación de extensión, con el
// logging nuevo de éxito (status 0) en CloudUCMProvider.js#_request() y de
// needApply/applyChanges en extensiones.service.js#crearExtension ya activos.
//
// Antes de crear, lista las extensiones actuales en CloudUCM para elegir un
// número que no esté ya en uso.
const CloudUCMProvider = require('../../src/services/pbx/CloudUCMProvider');
const extensionesService = require('../../src/modules/extensiones/extensiones.service');
const prisma = require('../../src/config/database');

(async () => {
    const cfg = await prisma.configuraciones_pbx.findFirst({ where: { activo: true, deleted_at: null } });
    if (!cfg) { console.error('No hay configuraciones_pbx activa.'); process.exit(1); }

    const ucm = new CloudUCMProvider();
    try {
        const login = await ucm.connect(cfg.empresa_id);
        console.log('LOGIN:', login.status, '(status 0 = éxito)');

        const actuales = await ucm.getExtensions(cfg.empresa_id);
        const numeros = actuales.extensiones.map((e) => e.account || e.extension || e.number);
        console.log('EXTENSIONES YA EXISTENTES EN CLOUDUCM:', numeros);

        let candidata = '1050';
        while (numeros.includes(candidata)) {
            candidata = String(Number(candidata) + 1);
        }
        console.log('EXTENSIÓN ELEGIDA (libre, dentro de 1000-6299):', candidata);

        // El secret se pasa por variable de entorno a propósito — no se
        // hardcodea una contraseña real en un archivo versionado.
        const secret = process.env.TEST_SIP_SECRET;
        if (!secret) {
            console.error('Falta TEST_SIP_SECRET en el entorno. Ej: TEST_SIP_SECRET=\'...\' node scripts/debug/test-crear-extension-real.js');
            process.exit(1);
        }

        console.log('--- Llamando a extensionesService.crearExtension() ---');
        const creada = await extensionesService.crearExtension(cfg.empresa_id, {
            extension: candidata,
            nombre:    'PRUEBA MERCI - borrar',
            secret,
        });
        console.log('ÉXITO — extensión reflejada en BD local:', JSON.stringify(creada, null, 2));
    } catch (e) {
        console.error('FALLÓ:', e.message, '| categoria:', e.categoria);
    } finally {
        process.exit(0);
    }
})();

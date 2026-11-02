// Comprovació del flux i dels permisos del magatzem de la demo: node check.js
const assert = require('assert');
const S = require('./store.js');
const post = (path, role, data = {}) => S.request(path, { method: 'POST', body: JSON.stringify({ ...data, actor_role: role }) });
const get = role => S.request(`/api/ncs?role=${role}`).ncs;
const denied = fn => assert.throws(fn);
const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

// Visibilitat: el tècnic només veu NC on té accions; l'auditor ho veu tot però no pot registrar.
assert.ok(get('accio').every(n => n.actions.some(a => [a.owner_id, a.owner2_id].includes(4))));
assert.strictEqual(get('auditor').length, 7);
denied(() => post('/api/ncs', 'auditor', { title: 'x', origin: 'intern', process: 'servei' }));

// Alta curta amb correcció immediata; abans d'activar només s'hi poden afegir correccions.
const nc = post('/api/ncs', 'proces', { title: 'Prova', origin: 'intern', process: 'servei', dept_target: 'servei', correction: 'Producte apartat' });
assert.strictEqual(nc.actions[0].type, 'correccio');
denied(() => post(`/api/ncs/${nc.id}/actions`, 'proces', { type: 'correctiva', text: 'x', owner_id: 4 }));
post(`/api/ncs/${nc.id}/update`, 'proces', { location: 'Taller', client: 'c1' });            // l'autor completa la fitxa
denied(() => post(`/api/ncs/${nc.id}/accept`, 'proces', { due_date: day(30) }));             // només qualitat activa
denied(() => post(`/api/ncs/${nc.id}/accept`, 'qualitat', {}));                               // caducitat obligatòria
post(`/api/ncs/${nc.id}/accept`, 'qualitat', { due_date: day(30) });
denied(() => post(`/api/ncs/${nc.id}/update`, 'compres', { location: 'x' }));                // compres no gestiona el dept. destí
post(`/api/ncs/${nc.id}/followups`, 'proces', { text: 'Recollint dades' });
post(`/api/ncs/${nc.id}/links`, 'proces', { create: true, type: 'millora', title: 'Millora derivada' });
post(`/api/ncs/${nc.id}/notify`, 'proces', { groups: ['autor', 'qualitat'], message: 'Revisa la fitxa' });
denied(() => post(`/api/ncs/${nc.id}/analysis`, 'proces', { root_cause: 'x', requirements: [], actions: [{ text: 'a', owner_id: 4 }] })); // cal requisit
let r = post(`/api/ncs/${nc.id}/analysis`, 'proces', { root_cause: 'x', requirements: ['iso9001-8.2'], actions: [{ text: 'a', owner_id: 4, type: 'correctiva' }] });
const aid = r.actions.find(a => a.type === 'correctiva').id;
post(`/api/ncs/${nc.id}/actions/${aid}/update`, 'proces', { owner2_id: 2, order: 5 });
denied(() => post(`/api/ncs/${nc.id}/verify`, 'qualitat', { effective: true, notes: 'n', reason: 'r' })); // accions pendents
denied(() => post(`/api/ncs/${nc.id}/actions/${aid}/followup`, 'compres', { text: 'x' }));
r = post(`/api/ncs/${nc.id}/actions/${aid}/followup`, 'accio', { text: 'feta', done: true });
assert.strictEqual(r.state, 'verificacio');
r = post(`/api/ncs/${nc.id}/verify`, 'qualitat', { effective: false, notes: 'Es repeteix' }); // no eficaç: es reobre
assert.strictEqual(r.state, 'analisi'); assert.strictEqual(r.cycle, 2);
r = post(`/api/ncs/${nc.id}/actions`, 'proces', { type: 'correctiva', text: 'b', owner_id: 2 });
r = post(`/api/ncs/${nc.id}/analysis`, 'proces', { root_cause: 'y', requirements: ['iso9001-8.2'], actions: [] });
post(`/api/ncs/${nc.id}/actions/${r.actions.at(-1).id}/followup`, 'proces', { text: 'feta', done: true });
denied(() => post(`/api/ncs/${nc.id}/verify`, 'qualitat', { effective: true, notes: 'OK' })); // cal motiu de tancament
r = post(`/api/ncs/${nc.id}/verify`, 'qualitat', { effective: true, notes: 'OK', reason: 'Eficaç', keyword: 'formacio' });
assert.strictEqual(r.state, 'tancada'); assert.ok(r.closing.reason);
denied(() => post(`/api/ncs/${nc.id}/followups`, 'qualitat', { text: 'x' }));               // tancada: només lectura

// Històric i esborrat.
denied(() => post('/api/ncs/historic', 'proces', { before: day(0) }));
assert.strictEqual(post('/api/ncs/historic', 'qualitat', { before: day(-100) }).moved, 1);
const tmp = post('/api/ncs', 'compres', { title: 'Error d’alta', origin: 'intern', process: 'compres' });
post(`/api/ncs/${tmp.id}/delete`, 'compres');
assert.ok(!get('qualitat').some(n => n.id === tmp.id));
// Visibilitat per departament: compres no veu les NC on no intervé.
assert.ok(!get('compres').some(n => n.number === 'NC-2026-011'));
// Configuració del mòdul per client.
denied(() => post('/api/settings', 'proces', { auto_activate: true }));
post('/api/settings', 'qualitat', { auto_activate: true, suborigin_required: true, extended_validation: true });
denied(() => post('/api/ncs', 'proces', { title: 'Sense suborigen', origin: 'intern', process: 'servei', root_cause: 'x' }));
denied(() => post('/api/ncs', 'proces', { title: 'Sense causa', origin: 'intern', suborigin: 'di_control', process: 'servei' }));
const auto = post('/api/ncs', 'proces', { title: 'Activada sola', origin: 'intern', suborigin: 'di_control', process: 'servei', root_cause: 'x', locations: ['taller'] });
assert.strictEqual(auto.state, 'analisi'); assert.ok(auto.due_date);
post('/api/settings', 'qualitat', { auto_activate: false, suborigin_required: false, extended_validation: false });
// Editar només els seguiments propis.
post(`/api/ncs/${auto.id}/followups`, 'proces', { text: 'Primer' });
post(`/api/ncs/${auto.id}/followups`, 'proces', { text: 'Corregit', edit: 0 });
denied(() => post(`/api/ncs/${auto.id}/followups`, 'qualitat', { text: 'No meu', edit: 0 }));
// Les auditories es relacionen però no es creen des de la NC.
denied(() => post(`/api/ncs/${auto.id}/links`, 'proces', { create: true, type: 'auditoria', title: 'x' }));
// Recordatoris automàtics d'accions vençudes.
assert.ok(get('qualitat').find(n => n.number === 'NC-2026-014').notifications.some(x => x.subject === 'Recordatori d’acció'));
// Esborrar històriques.
assert.strictEqual(post('/api/ncs/purge', 'qualitat', { before: day(0) }).deleted, 1);
// Procés, referència i subreferència són opcionals; sense procés, activar cau al responsable de l'origen.
const noProcess = post('/api/ncs', 'proces', { title: 'Sense procés', origin: 'reclamacio' });
assert.strictEqual(post(`/api/ncs/${noProcess.id}/accept`, 'qualitat', { due_date: day(30) }).owner_id, 2);
// Baixes de catàleg: el valor no es pot triar de nou però les NC que el tenen el conserven.
denied(() => post('/api/catalogs/retire', 'proces', { kind: 'origins', key: 'altres', date: day(0) }));
denied(() => post('/api/catalogs/retire', 'qualitat', { kind: 'users', key: '1', date: day(0) }));
denied(() => post('/api/ncs', 'proces', { title: 'Baixa', origin: 'auditoria_interna', suborigin: 'ai_14001' }));
post('/api/catalogs/retire', 'qualitat', { kind: 'references', key: 'ref_legal', date: day(1) });      // baixa futura: encara vàlid
const retiredRef = post('/api/ncs', 'proces', { title: 'Encara vigent', origin: 'intern', reference: 'ref_legal' });
post('/api/catalogs/retire', 'qualitat', { kind: 'references', key: 'ref_legal', date: day(0) });
denied(() => post('/api/ncs', 'proces', { title: 'Ja no', origin: 'intern', reference: 'ref_legal' }));
post(`/api/ncs/${retiredRef.id}/update`, 'proces', { reference: 'ref_legal', client: 'c1' });          // el conserva en editar
post('/api/catalogs/retire', 'qualitat', { kind: 'references', key: 'ref_legal', date: '' });
// Suborigen obligatori només si l'origen en té d'actius.
post('/api/settings', 'qualitat', { suborigin_required: true });
post('/api/ncs', 'proces', { title: 'Origen sense suborígens', origin: 'altres' });
post('/api/settings', 'qualitat', { suborigin_required: false });
// Numeració: format de l'entitat, número alliberat si s'esborra l'última i reinici anual.
const number = () => S.request('/api/settings?role=qualitat');
const year = new Date().getFullYear();
denied(() => post('/api/settings', 'qualitat', { number_format: 'SENSE-COMPTADOR', number_digits: 3 }));
denied(() => post('/api/settings', 'qualitat', { number_format: 'NC/{ANY}/{NUM}', number_digits: 4, next_number: 1 }));
assert.strictEqual(number().settings.number_format, 'NC-{ANY}-{NUM}');                                // l'error no desa res
post('/api/settings', 'qualitat', { number_format: 'NC/{ANY}/{NUM}', number_digits: 4, next_number: 40 });
const n40 = post('/api/ncs', 'proces', { title: 'Quaranta', origin: 'intern' }), n41 = post('/api/ncs', 'proces', { title: 'Quaranta-u', origin: 'intern' });
assert.strictEqual(n40.number, `NC/${year}/0040`);
post(`/api/ncs/${n41.id}/delete`, 'proces');                                                          // l'última: s'allibera
assert.strictEqual(number().next_number, 41);
const n41b = post('/api/ncs', 'proces', { title: 'Reutilitza', origin: 'intern' });
assert.strictEqual(n41b.number, `NC/${year}/0041`);
const n42 = post('/api/ncs', 'proces', { title: 'Següent', origin: 'intern' });
post(`/api/ncs/${n41b.id}/delete`, 'proces');                                                         // una del mig: forat
assert.strictEqual(number().next_number, 43);
const realNow = Date.now;
Date.now = () => Date.UTC(year + 1, 0, 15);
assert.strictEqual(post('/api/ncs', 'proces', { title: 'Any nou', origin: 'intern' }).number, `NC/${year + 1}/0001`);
Date.now = realNow;
// Notificació a externs sense usuari.
denied(() => post(`/api/ncs/${auto.id}/notify`, 'proces', { external: ['no-es-correu'], message: 'x' }));
assert.ok(post(`/api/ncs/${auto.id}/notify`, 'proces', { external: ['extern@exemple.com'], message: 'x' }).notifications.at(-1).recipient === 'extern@exemple.com');
// Històric individual: només tancades o desestimades, i només qualitat.
const closed = get('qualitat').find(n => n.number === 'NC-2026-012'), open = get('qualitat').find(n => n.number === 'NC-2026-016');
denied(() => post(`/api/ncs/${closed.id}/historic`, 'proces'));
denied(() => post(`/api/ncs/${open.id}/historic`, 'qualitat'));
assert.ok(post(`/api/ncs/${closed.id}/historic`, 'qualitat').historic);
console.log('OK: flux, accions, relacions, notificacions, històric, configuració, numeració, baixes i permisos');

// Comprovació del flux i dels permisos del magatzem de la demo: node check.js
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync(__dirname + '/demo-store.js', 'utf8') + ';DemoStore';
const memory = {};
const sessionStorage = { getItem: k => memory[k] ?? null, setItem: (k, v) => { memory[k] = v; }, removeItem: k => { delete memory[k]; } };
const boot = () => vm.runInNewContext(code, { window: { location: { href: 'http://demo/incidents/' } }, URL, sessionStorage });
let S = boot();
const post = (path, role, data = {}) => S.request(path, { method: 'POST', body: JSON.stringify({ ...data, actor_role: role }) });
const list = role => S.request(`/api/incidents?role=${role}`).incidents;
const denied = fn => assert.throws(fn);

// L'Ajuntament registra; la revisió i l'assignació també són seves.
const { id } = post('/api/municipal-incidents', 'municipal', { origin: 'telefon', origin_department: 'Atenció ciutadana', what: 'Llums apagats', where: 'c/Aribau 8' });
denied(() => post(`/api/incidents/${id}/assign`, 'brigada', {}));
denied(() => post(`/api/incidents/${id}/assign`, 'cap_brigada', {}));
post(`/api/incidents/${id}/assign`, 'municipal', { assignee_id: 4, target_department: 'Brigada municipal', action_instruction: 'Revisar la xarxa' });

// Només l'operari assignat el veu i el pot pretancar.
assert.ok(list('brigada').some(i => i.id === id));
assert.ok(!list('brigada_suport').some(i => i.id === id));
denied(() => post(`/api/incidents/${id}/preclose`, 'brigada_suport', { work_done: 'x' }));
denied(() => post(`/api/incidents/${id}/close`, 'municipal', { closure_reason: 'x' }));       // encara no està pretancada
post(`/api/incidents/${id}/preclose`, 'brigada', { work_done: 'Fet' });

// Validació: només l'Ajuntament tanca; el perfil antic de validació ja no existeix.
denied(() => post(`/api/incidents/${id}/close`, 'cap_brigada', { closure_reason: 'x' }));
denied(() => post(`/api/incidents/${id}/close`, 'validador', { closure_reason: 'x' }));
post(`/api/incidents/${id}/close`, 'municipal', { closure_reason: 'Comprovat' });

// Una recàrrega conserva la incidència tancada; reiniciar torna a la mostra.
S = boot();
assert.strictEqual(list('municipal').find(i => i.id === id).stage, 'Tancada');
S.reset(); S = boot();
assert.ok(!list('municipal').some(i => i.id === id));
console.log('OK');

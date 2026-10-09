const $ = id => document.getElementById(id);

const roles = {
  qualitat: { label: 'Qualitat', intro: 'Activa les NC, en segueix el pla d’accions i en verifica l’eficàcia abans de tancar-les.' },
  proces: { label: 'Responsable de procés', intro: 'Gestiona les NC del teu departament: anàlisi, accions, seguiments i documents.' },
  compres: { label: 'Compres', intro: 'Gestiona les NC de compres i proveïdors.' },
  accio: { label: 'Tècnic', intro: 'Veus les NC on tens accions. Registra’n el seguiment, les evidències i el tancament.' },
  direccio: { label: 'Direcció', intro: 'Consulta l’estat del sistema i les estadístiques per a la revisió per la direcció.' },
  auditor: { label: 'Auditor extern', intro: 'Accés temporal de només lectura per a l’auditoria de certificació.' }
};
const params = new URLSearchParams(location.search);
let role = roles[params.get('role')] ? params.get('role') : 'qualitat';
const stateClass = { registrada: 'review', analisi: 'work', accions: 'acting', verificacio: 'validation', tancada: 'closed', desestimada: 'closed' };
let cat, ncs = [], linkables = [], today = '', current = null, reqSelected = null, focusAction = null;

// --- Utilitats ---
function elem(tag, cls, value) { const e = document.createElement(tag); if (cls) e.className = cls; if (value !== undefined && value !== null) e.textContent = value; return e; }
function info(name, value) { const box = elem('div', 'info'); box.append(elem('small', '', name), elem('strong', '', value || '—')); return box; }
function section(title, ...body) { const box = elem('section', 'workflow-section'); box.append(elem('h3', '', title), ...body); return box; }
function paragraph(value, cls = '') { return elem('p', cls, value || '—'); }
function button(text, cls, fn) { const b = elem('button', cls, text); b.type = 'button'; b.addEventListener('click', fn); return b; }
function dateText(v) { if (!v) return '—'; const d = new Date(v); return Number.isNaN(d.valueOf()) ? v : d.toLocaleDateString('ca-ES'); }
const plusDays = n => new Date(Date.parse(today) + n * 864e5).toISOString().slice(0, 10);
const me = () => cat.users.find(u => u.role === role).id;
const isQ = () => role === 'qualitat';
const userName = id => cat.users.find(u => u.id === Number(id))?.name || '—';
const subLabel = v => Object.values(cat.suborigins).map(s => s[v]).find(Boolean);
const label = (kind, v) => !v ? '—' : kind === 'processes' ? cat.processes.find(p => p.id === v)?.name : kind === 'suborigins' ? subLabel(v) || v : cat[kind]?.[v] || v;
const person = id => { const u = cat.users.find(x => x.id === Number(id)); return u ? `${u.name} · ${u.position}` : '—'; };
const navByRole = { qualitat: ['list', 'actions', 'reqs', 'stats', 'config'], proces: ['list', 'actions', 'reqs', 'stats'], compres: ['list', 'actions', 'stats'],
  accio: ['actions', 'list'], direccio: ['stats', 'list', 'reqs'], auditor: ['reqs', 'list', 'stats'] };
const navLabels = { list: 'No conformitats', actions: 'Accions', reqs: 'Requisits', stats: 'Estadístiques', config: 'Configuració' };
const req = id => cat.requirements.find(r => r.id === id);
const isOpen = n => !['tancada', 'desestimada'].includes(n.state);
const expired = n => isOpen(n) && n.state !== 'registrada' && n.due_date && n.due_date < today;
const overdue = a => a.status === 'pendent' && a.due < today;
const owners = a => [a.owner_id, a.owner2_id].filter(Boolean);
const statePill = n => elem('span', 'pill ' + stateClass[n.state], cat.states[n.state]);
const actionPill = a => a.status === 'feta' ? elem('span', 'pill closed', 'Tancada') : overdue(a) ? elem('span', 'pill overdue', 'Vençuda') : elem('span', 'pill work', 'Pendent');
const typePill = a => elem('span', 'pill type-' + a.type, { correccio: 'Correcció', correctiva: 'Correctiva', preventiva: 'Preventiva' }[a.type]);
const people = () => cat.users.filter(u => u.role !== 'auditor').map(u => [u.id, `${u.name} · ${u.position}`]);
function optionsFor(kind) { return kind === 'people' ? people() : kind === 'processes' ? cat.processes.map(p => [p.id, p.name]) : kind === 'suborigins' ? Object.entries(cat.suborigins).flatMap(([o, s]) => Object.entries(s).map(([k, v]) => [k, `${cat.origins[o]} › ${v}`])) : Object.entries(cat[kind]); }
function options(select, entries, value, blank) { select.replaceChildren(...(blank ? [['', blank]] : []).concat(entries).map(([v, t]) => { const o = elem('option', '', t); o.value = v; return o; })); if (value !== undefined && value !== null) select.value = value; }

// L'API real farà fetch a les mateixes rutes; el rol sortirà del token, no del paràmetre.
async function api(path, options = {}) { return DemoStore.request(path, options); }
const post = (path, data = {}) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, actor_role: role }) });

async function load() {
  const r = await api(`/api/ncs?role=${role}`);
  ncs = r.ncs; linkables = r.linkables; today = r.today;
  route();
}

// --- Navegació ---
function go(hash) { if (location.hash === '#' + hash) route(); else location.hash = hash; }
function route() {
  let [view, id] = (location.hash.slice(1) || navByRole[role][0]).split('/');
  if (view !== 'nc' && !navByRole[role].includes(view)) { history.replaceState(null, '', '#' + navByRole[role][0]); view = navByRole[role][0]; }
  for (const s of document.querySelectorAll('.view')) s.hidden = s.id !== 'view-' + view;
  if (!document.querySelector('.view:not([hidden])')) $('view-list').hidden = false;
  for (const b of document.querySelectorAll('[data-go]')) b.classList.toggle('current', b.dataset.go === (view === 'nc' ? 'list' : view));
  if (view === 'nc') { current = ncs.find(n => n.id === Number(id)); renderNC(); if (!focusAction) scrollTo(0, 0); }
  else if (view === 'actions') renderActions();
  else if (view === 'reqs') renderReqs();
  else if (view === 'stats') renderStats();
  else if (view === 'config') renderConfig();
  else renderList();
}
window.addEventListener('hashchange', route);
function setRole(r) { role = r; params.set('role', r); history.replaceState(null, '', '?' + params + '#' + navByRole[r][0]); current = null; $('action-filters').mine.checked = r === 'accio'; renderRoles(); load(); }
function renderRoles() {
  $('roles').replaceChildren(...Object.entries(roles).map(([key, r]) => button(r.label, key === role ? 'active' : '', () => setRole(key))));
  const u = cat.users.find(x => x.role === role);
  $('role-intro').textContent = `${u.name} · ${u.position}. ${roles[role].intro}`;
  $('new-nc').hidden = ['direccio', 'auditor'].includes(role);
  $('open-historic').hidden = !isQ();
  const allowed = navByRole[role];
  for (const b of document.querySelectorAll('#nav [data-go]')) { b.hidden = !allowed.includes(b.dataset.go); b.textContent = role === 'accio' && b.dataset.go === 'actions' ? 'Les meves accions' : navLabels[b.dataset.go]; b.style.order = allowed.indexOf(b.dataset.go); }
  $('mobile-nav').replaceChildren(...allowed.map(v => button(role === 'accio' && v === 'actions' ? 'Les meves accions' : navLabels[v], 'secondary small', () => go(v))));
}

// --- Llistat ---
function filterValues() { return Object.fromEntries(new FormData($('filters')).entries()); }
function filtered() {
  const f = filterValues(), text = (f.text || '').toLowerCase();
  return ncs.filter(n => (f.historic || !n.historic)
    && (!f.state || (f.state === 'open' ? isOpen(n) : f.state === 'activa' ? ['analisi', 'accions'].includes(n.state) : n.state === f.state))
    && (!f.expired || (f.expired === 'yes') === expired(n))
    && (!f.number || n.number.toLowerCase().includes(f.number.toLowerCase()))
    && (!text || [n.title, n.description, label('origins', n.origin), n.origin_ref].join(' ').toLowerCase().includes(text))
    && ['origin', 'suborigin', 'dept_origin', 'dept_target', 'client', 'supplier', 'product', 'phase'].every(k => !f[k] || n[k] === f[k])
    && (!f.location || n.locations.includes(f.location))
    && (!f.owner_id || n.owner_id === Number(f.owner_id))
    && (!f.from || n.detected_at >= f.from) && (!f.to || n.detected_at <= f.to)
    && ((!f.action_from && !f.action_to) || n.actions.some(a => (!f.action_from || a.due >= f.action_from) && (!f.action_to || a.due <= f.action_to))));
}
function cell(tr, labelText, content, cls) { const td = elem('td', cls); td.dataset.label = labelText; if (content instanceof Node) td.append(content); else td.textContent = content ?? '—'; tr.append(td); return td; }
function renderList() {
  const open = ncs.filter(n => isOpen(n) && !n.historic);
  $('count-open').textContent = open.length; $('count-expired').textContent = open.filter(expired).length;
  $('count-overdue').textContent = open.flatMap(n => n.actions).filter(overdue).length; $('count-verify').textContent = open.filter(n => n.state === 'verificacio').length;
  const rows = filtered().sort((a, b) => b.detected_at.localeCompare(a.detected_at)), body = $('nc-table').tBodies[0];
  body.replaceChildren();
  const groups = filterValues().group ? Object.entries(rows.reduce((g, n) => ((g[n.owner_id ? userName(n.owner_id) : 'Sense responsable'] ||= []).push(n), g), {})) : [[null, rows]];
  for (const [name, list] of groups) {
    if (name) { const tr = elem('tr', 'group'); const td = elem('td', '', `${name} · ${list.length}`); td.colSpan = 10; tr.append(td); body.append(tr); }
    for (const n of list) {
      const tr = elem('tr', n.historic ? 'historic' : ''); tr.tabIndex = 0;
      tr.addEventListener('click', () => go('nc/' + n.id)); tr.addEventListener('keydown', e => { if (e.key === 'Enter') go('nc/' + n.id); });
      cell(tr, 'Núm. NC', n.number, 'mono'); cell(tr, 'Data', dateText(n.detected_at));
      const t = elem('div'); t.append(elem('b', '', n.title)); if (n.historic) t.append(elem('span', 'pill closed', 'Històric')); cell(tr, 'Problema', t);
      cell(tr, 'Origen', label('origins', n.origin)); cell(tr, 'Departaments', `${label('departments', n.dept_origin)} → ${label('departments', n.dept_target)}`);
      cell(tr, 'Responsable', n.owner_id ? userName(n.owner_id) : '—');
      cell(tr, 'Caducitat', n.due_date ? dateText(n.due_date) + (expired(n) ? ' · caducada' : '') : '—', expired(n) ? 'late' : '');
      const done = n.actions.filter(a => a.status === 'feta').length, late = n.actions.filter(overdue).length;
      cell(tr, 'Accions', `${done}/${n.actions.length}${late ? ` · ${late} vençuda${late > 1 ? 'es' : ''}` : ''}`, late ? 'late' : '');
      cell(tr, 'Estat', statePill(n));
      const quick = elem('td', 'no-print quick'); quick.dataset.label = '';
      if (n.can_follow) quick.append(button('Seguiment', 'secondary small', e => { e.stopPropagation(); current = n; openFollowup(null); }));
      tr.append(quick); body.append(tr);
    }
  }
  if (!rows.length) { const tr = elem('tr'); const td = elem('td', 'loading', 'No hi ha no conformitats amb aquests criteris.'); td.colSpan = 10; tr.append(td); body.append(tr); }
  $('list-count').textContent = `${rows.length} no conformitats.`;
}
function downloadCsv(name, header, rows) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob(['﻿' + [header, ...rows].map(r => r.map(esc).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = elem('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$('export-csv').addEventListener('click', () => downloadCsv('no-conformitats.csv',
  ['Núm. NC', 'Data', 'Problema', 'Origen', 'Referència', 'Dept. origen', 'Dept. destí', 'Responsable', 'Client', 'Proveïdor', 'Caducitat', 'Estat', 'Accions', 'Accions tancades', 'Causa', 'Data tancament', 'Motiu tancament', 'Eficàcia verificada'],
  filtered().map(n => [n.number, n.detected_at, n.title, label('origins', n.origin), n.origin_ref, label('departments', n.dept_origin), label('departments', n.dept_target),
    n.owner_id ? userName(n.owner_id) : '', label('clients', n.client), label('suppliers', n.supplier), n.due_date, cat.states[n.state], n.actions.length,
    n.actions.filter(a => a.status === 'feta').length, n.root_cause, n.closing?.date, n.closing?.reason, n.verification?.effective ? 'Sí' : 'No'])));
$('export-detail').addEventListener('click', () => downloadCsv('no-conformitats-detall.csv',
  ['Núm. NC', 'Data', 'Problema', 'Origen', 'Suborigen', 'Dept. origen', 'Dept. destí', 'Responsable NC', 'Estat', 'Causa', 'Ordre', 'Tipus acció', 'Acció', 'Responsable acció', 'Data límit', 'Tancament acció',
    'Seguiments de l’acció', 'Seguiments de la NC', 'Relacions', 'Temps previst', 'Temps real', 'Cost total', 'Verificació', 'Data tancament', 'Motiu tancament'],
  filtered().flatMap(n => (n.actions.length ? n.actions : [null]).map(a => [n.number, n.detected_at, n.title, label('origins', n.origin), label('suborigins', n.suborigin),
    label('departments', n.dept_origin), label('departments', n.dept_target), n.owner_id ? userName(n.owner_id) : '', cat.states[n.state], n.root_cause,
    a?.order, a && cat.actionTypes[a.type], a?.text, a && owners(a).map(userName).join(', '), a?.due, a?.done_at?.slice(0, 10), a?.followups.map(f => `${f.author}: ${f.text}`).join(' | '),
    n.followups.map(f => `${f.author}: ${f.text}`).join(' | '), n.links.map(l => l.ref).join(', '), n.cost.hours_planned, n.cost.hours_real,
    n.cost.items.reduce((s, i) => s + (Number(i.amount) || 0), 0) || '', n.verification?.notes, n.closing?.date, n.closing?.reason]))));
$('filters').addEventListener('input', renderList);
$('filters').addEventListener('reset', () => setTimeout(renderList));

// --- Fitxa ---
function stepText(n) {
  const pending = n.actions.filter(a => a.status === 'pendent');
  return { registrada: 'Pendent que qualitat l’activi, n’assigni el responsable i en fixi la caducitat. Mentrestant s’hi poden registrar correccions, seguiments i documents.',
    analisi: `${userName(n.owner_id)} ha d’analitzar la causa i planificar les accions${n.due_analysis ? ' abans del ' + dateText(n.due_analysis) : ''}.`,
    accions: `${pending.length} ${pending.length === 1 ? 'acció pendent' : 'accions pendents'}. Quan totes estiguin tancades, passarà a verificació.`,
    verificacio: `${userName(n.verifier_id)} ha de verificar l’eficàcia${n.verify_due ? ' (prevista el ' + dateText(n.verify_due) + ')' : ''} i tancar-la.`,
    tancada: `Tancada el ${dateText(n.closing?.date)} amb eficàcia verificada.`, desestimada: 'Desestimada: ' + (n.dismissed_reason || '') }[n.state];
}
function toolbar(n) {
  const bar = elem('div', 'toolbar no-print'), add = (group, ...btns) => { const g = elem('div', 'tool-group'); g.append(elem('span', 'tool-label', group), ...btns.filter(Boolean)); if (g.children.length > 1) bar.append(g); };
  const canDelete = isOpen(n) && (isQ() || (n.state === 'registrada' && me() === n.author_id)) && !n.actions.some(a => a.type !== 'correccio') && !n.followups.length;
  add('Flux',
    isQ() && n.state === 'registrada' && button('Activar o desestimar', 'primary', () => openAccept(n)),
    n.state === 'analisi' && n.can_edit && button(n.cycle > 1 ? 'Reanalitzar i planificar' : 'Anàlisi i pla d’accions', 'primary', () => openAnalysis(n)),
    n.state === 'verificacio' && (isQ() || me() === n.verifier_id) && button('Verificar i tancar', 'primary', () => openVerify(n)));
  add('Afegir',
    n.can_edit && button(n.state === 'registrada' ? '+ Correcció' : '+ Acció', 'secondary', () => openAction(n, null)),
    n.can_follow && button('+ Seguiment', 'secondary', () => openFollowup(null)),
    n.can_follow && button('+ Document', 'secondary', () => openDialog('docs-dialog')),
    n.can_edit && button('Relacionar / crear registre', 'secondary', openLink));
  add('Fitxa',
    n.can_edit && button('Editar fitxa', 'secondary', () => openEdit(n)),
    isOpen(n) && (n.can_follow || isQ()) && button('Enviar notificació', 'secondary', openNotify),
    button('Imprimir comunicat', 'secondary', () => print()),
    canDelete && button('Esborrar', 'danger', () => openDialog('delete-dialog')));
  return bar;
}
function actionNode(n, a) {
  const box = elem('div', 'action-row' + (focusAction === a.id ? ' highlight' : '')); box.id = `action-${a.id}`;
  const head = elem('div', 'action-head'), left = elem('div', 'action-tags');
  left.append(elem('b', '', `${a.order}.`), typePill(a)); head.append(left, actionPill(a));
  box.append(head, elem('p', '', a.text),
    elem('small', '', `${owners(a).map(userName).join(' i ')} · data límit ${dateText(a.due)}${a.done_at ? ' · tancament parcial ' + dateText(a.done_at) : ''}${a.cycle > 1 ? ' · cicle ' + a.cycle : ''}`));
  a.followups.forEach((f, i) => box.append(followNode(f, () => openEditFollowup(f, `/api/ncs/${n.id}/actions/${a.id}/editfollowup`, { index: i }))));
  if (isOpen(n) && a.status === 'pendent') {
    const btns = elem('div', 'row-actions no-print'), mine = owners(a).includes(me());
    if (mine || n.can_edit) btns.append(button('Seguiment', 'secondary small', () => openFollowup(a)));
    if (mine || isQ()) btns.append(button('Tancar acció', 'secondary small', () => openFollowup(a, true)));
    if (n.can_edit) btns.append(button('Editar', 'secondary small', () => openAction(n, a)));
    if (n.can_edit && !a.followups.length) btns.append(button('Eliminar', 'danger small', () => submitDirect(`/api/ncs/${n.id}/actions/${a.id}/delete`)));
    if (btns.children.length) box.append(btns);
  }
  return box;
}
function followNode(f, edit) {
  const fu = elem('div', 'followup'); fu.append(elem('span', '', `${f.author} · ${dateText(f.at)}${f.edited ? ' · editat' : ''}`), elem('p', '', f.text));
  for (const file of f.files || []) fu.append(fileLink(file));
  if (edit && isOpen(current) && f.author === userName(me())) fu.append(button('Editar', 'text-link no-print', edit));
  return fu;
}
function fileLink(file) { const link = elem(file.url ? 'a' : 'span', 'file', '📎 ' + file.name); if (file.url) { link.href = file.url; link.target = '_blank'; link.rel = 'noopener'; } return link; }
function reqChips(ids) {
  const box = elem('div', 'req-chips');
  if (!ids.length) box.append(paragraph('Pendent de vincular.', 'hint'));
  for (const id of ids) { const r = req(id), c = elem('span', 'req-chip ' + r.framework); c.append(elem('b', '', `${cat.frameworks[r.framework]} · ${r.code}`), elem('span', '', r.name)); box.append(c); }
  return box;
}
function grid(...pairs) { const g = elem('div', 'detail-grid three'); g.append(...pairs.map(([k, v]) => info(k, v))); return g; }
function renderNC() {
  const root = $('view-nc'); root.replaceChildren();
  const n = current;
  if (!n) { root.append(paragraph('Aquesta NC no existeix o no és visible amb aquest perfil.', 'empty'), button('← Tornar al llistat', 'secondary', () => go('list'))); return; }
  const head = elem('section', 'nc-head'), left = elem('div'), badges = elem('div', 'badge-stack');
  left.append(elem('div', 'eyebrow', `NO CONFORMITAT ${n.number}`), elem('h1', '', n.title), elem('div', 'detail-sub', `${label('origins', n.origin)}${n.origin_ref ? ' · ' + n.origin_ref : ''} · ${label('processes', n.process)}`));
  badges.append(statePill(n));
  if (expired(n)) badges.append(elem('span', 'pill overdue', 'Caducada'));
  if (n.historic) badges.append(elem('span', 'pill closed', 'Històric'));
  if (n.cycle > 1) badges.append(elem('span', isOpen(n) ? 'pill overdue' : 'pill closed', isOpen(n) ? `Reoberta · cicle ${n.cycle}` : `${n.cycle} cicles d’anàlisi`));
  head.append(left, badges);
  const layout = elem('div', 'nc-layout'), main = elem('div', 'nc-main'), side = elem('aside', 'nc-side');
  main.append(section('Dades generals', grid(['Núm. NC', n.number], ['Data', dateText(n.detected_at)], ['Autor', userName(n.author_id)],
    ['Suborigen', label('suborigins', n.suborigin)], ['Departament d’origen', label('departments', n.dept_origin)], ['Departament destí', label('departments', n.dept_target)], ['Àmbit / servei', label('scopes', n.scope)],
    ['Client', label('clients', n.client)], ['Proveïdor', label('suppliers', n.supplier)], ['Producte / servei', label('products', n.product)],
    ['Tipus de problema', label('phases', n.phase)], ['On es detecta', n.locations.map(l => label('locations', l)).join(', ') || '—'], ['Caducitat', dateText(n.due_date)])));
  const pc = elem('div', 'work-summary'); pc.append(info('Problema', n.description), info('Causa', n.root_cause || 'Pendent d’analitzar'), info('Causa primària', label('causes', n.cause_id)));
  main.append(section('Problema i causa', pc), section('Requisits afectats', reqChips(n.requirements)));
  const plan = elem('div');
  if (!n.actions.length) plan.append(paragraph('Encara no hi ha correccions ni accions.', 'hint'));
  for (const a of n.actions.slice().sort((x, y) => x.order - y.order)) plan.append(actionNode(n, a));
  main.append(section(`Correccions i accions (${n.actions.filter(a => a.status === 'feta').length}/${n.actions.length} tancades)`, plan));
  const fol = elem('div'); if (!n.followups.length) fol.append(paragraph('Cap seguiment global.', 'hint')); n.followups.map((f, i) => [f, i]).reverse().forEach(([f, i]) => fol.append(followNode(f, () => openEditFollowup(f, `/api/ncs/${n.id}/followups`, { edit: i }))));
  main.append(section('Seguiments de la NC', fol));
  const docs = elem('div', 'doc-list');
  if (!n.documents.length) docs.append(paragraph('Cap document annex.', 'hint'));
  n.documents.forEach((d, i) => { const row = elem('div', 'doc-row'); row.append(fileLink(d), elem('small', '', `${d.by} · ${dateText(d.at)}`)); if (n.can_edit) row.append(button('Esborrar', 'text-link no-print', () => submitDirect(`/api/ncs/${n.id}/documents`, { remove: i }))); docs.append(row); });
  main.append(section('Documents annexos', docs));
  const links = elem('div');
  for (const [type, name] of Object.entries(cat.linkTypes)) {
    const list = n.links.filter(l => l.type === type), g = elem('div', 'link-group'); g.append(elem('b', '', `${name} (${list.length})`));
    for (const l of list) { const row = elem('div', 'doc-row'); row.append(elem('span', 'mono', l.ref), elem('span', '', l.title)); if (n.can_edit) row.append(button('Eliminar relació', 'text-link no-print', () => submitDirect(`/api/ncs/${n.id}/links`, { ref: l.ref, remove: true }))); g.append(row); }
    links.append(g);
  }
  main.append(section('Relacions', links));
  const close = elem('div');
  close.append(grid(['Responsable de verificació', person(n.verifier_id)], ['Verificació prevista', dateText(n.verify_due)], ['Responsable de tancament', person(n.closer_id)]));
  for (const v of n.previous_verifications || []) close.append(elem('div', 'verify-box failed', `No eficaç · ${v.by} · ${dateText(v.at)} — ${v.notes}`));
  if (n.verification) close.append(elem('div', 'verify-box ok', `Eficàcia verificada · ${n.verification.by} · ${dateText(n.verification.at)} — ${n.verification.notes}`));
  if (n.closing) close.append(grid(['Data de tancament', dateText(n.closing.date)], ['Motiu', n.closing.reason], ['Paraula clau', label('keywords', n.closing.keyword)]));
  else if (isOpen(n)) close.append(paragraph('No es pot tancar fins que totes les accions estiguin tancades i se n’hagi verificat l’eficàcia.', 'hint'));
  const c = n.cost, total = c.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  close.append(elem('h4', 'sub-title', 'Costos de la no qualitat'), grid(['Temps previst (h)', c.hours_planned], ['Temps real (h)', c.hours_real], ['Equip', c.team],
    ...c.items.filter(i => i.supplier || i.amount).map(i => [i.supplier || 'Intern', i.amount ? `${i.amount} €` : '—']), ['Total', total ? `${total} €` : '—']));
  if (c.notes) close.append(paragraph(c.notes, 'hint'));
  main.append(section('Verificació i tancament', close));
  const timeline = elem('div'); for (const e of n.events.slice().reverse()) { const row = elem('div', 'timeline-row'); row.append(elem('strong', '', e.kind), elem('span', '', `${e.actor} · ${dateText(e.created_at)}`), elem('p', '', e.detail)); timeline.append(row); }
  main.append(section('Traça', timeline));
  if (role === 'auditor') side.append(elem('div', 'side-box readonly', 'Accés de només lectura per a l’auditoria. Totes les consultes queden registrades.'));
  const step = elem('div', 'side-box step'); step.append(elem('small', '', 'PAS ACTUAL'), elem('p', '', stepText(n))); side.append(step);
  const summary = elem('div', 'side-box'); summary.append(info('Responsable de la NC', n.owner_id ? person(n.owner_id) : 'Pendent d’assignar'), info('Caducitat', dateText(n.due_date)),
    info('Accions pendents', String(n.actions.filter(a => a.status === 'pendent').length)), info('Seguiments i documents', `${n.followups.length} · ${n.documents.length}`), info('Relacions', String(n.links.length)));
  side.append(summary);
  const notes = elem('div', 'side-box'); notes.append(elem('small', '', 'NOTIFICACIONS'));
  if (!n.notifications.length) notes.append(paragraph('Cap notificació.', 'hint'));
  for (const x of n.notifications.slice(-5).reverse()) { const row = elem('div', 'notification-row'); row.append(elem('b', '', `${x.subject || 'Correu'} → ${x.recipient}`), elem('small', '', x.status), elem('p', '', x.message)); notes.append(row); }
  side.append(notes);
  layout.append(main, side);
  root.append(button('← Tornar al llistat', 'text-link no-print back', () => go('list')), head, toolbar(n), layout);
  if (focusAction) { const id = focusAction; focusAction = null; requestAnimationFrame(() => $(`action-${id}`)?.scrollIntoView({ block: 'center' })); }
}

// --- Accions (llistat) ---
function renderActions() {
  const f = Object.fromEntries(new FormData($('action-filters')).entries()), body = $('action-table').tBodies[0]; body.replaceChildren();
  const rows = ncs.filter(n => !n.historic).flatMap(n => n.actions.map(a => ({ n, a })))
    .filter(({ a }) => (!f.pending || a.status === 'pendent') && (!f.mine || owners(a).includes(me())) && (!f.overdue || overdue(a)))
    .sort((x, y) => x.a.due.localeCompare(y.a.due));
  for (const { n, a } of rows) {
    const tr = elem('tr'); tr.tabIndex = 0; const open = () => { focusAction = a.id; go('nc/' + n.id); };
    tr.addEventListener('click', open); tr.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
    cell(tr, 'NC', n.number, 'mono'); cell(tr, 'Ordre', String(a.order)); cell(tr, 'Tipus', typePill(a)); cell(tr, 'Acció', a.text);
    cell(tr, 'Responsables', owners(a).map(userName).join(', ')); cell(tr, 'Data límit', dateText(a.due), overdue(a) ? 'late' : ''); cell(tr, 'Tancament', dateText(a.done_at)); cell(tr, 'Estat', actionPill(a));
    body.append(tr);
  }
  if (!rows.length) { const tr = elem('tr'); const td = elem('td', 'loading', 'No hi ha accions amb aquests criteris.'); td.colSpan = 8; tr.append(td); body.append(tr); }
}
$('action-filters').addEventListener('input', renderActions);

// --- Requisits ---
function renderReqs() {
  const host = $('req-list'); host.replaceChildren();
  reqSelected ||= cat.requirements[0].id;
  for (const r of cat.requirements) {
    const linked = ncs.filter(n => n.requirements.includes(r.id)), open = linked.filter(isOpen).length;
    const b = elem('button', 'incident-card req-card' + (r.id === reqSelected ? ' selected' : '')); b.type = 'button';
    const t = elem('span', 'card-copy'), m = elem('span', 'incident-meta'); m.append(elem('span', '', r.code), elem('span', 'pill ' + (open ? 'work' : 'closed'), `${linked.length} NC · ${open} obertes`));
    t.append(m, elem('span', 'incident-title', r.name), elem('span', 'incident-location', cat.frameworks[r.framework]));
    b.append(elem('span', 'thumb thumb-placeholder code-thumb', cat.frameworks[r.framework].split(' ')[0]), t);
    b.addEventListener('click', () => { reqSelected = r.id; renderReqs(); }); host.append(b);
  }
  const r = req(reqSelected), linked = ncs.filter(n => n.requirements.includes(r.id)), root = $('req-detail'); root.replaceChildren();
  const head = elem('div', 'detail-head'), left = elem('div'); left.append(elem('div', 'eyebrow', cat.frameworks[r.framework].toUpperCase()), elem('h2', '', `${r.code} · ${r.name}`)); head.append(left);
  const body = elem('div', 'detail-body'), g = elem('div', 'detail-grid');
  g.append(info('NC vinculades', String(linked.length)), info('Obertes', String(linked.filter(isOpen).length)), info('Accions', String(linked.reduce((s, n) => s + n.actions.length, 0))), info('Tancades amb eficàcia verificada', String(linked.filter(n => n.verification?.effective).length)));
  const list = elem('div', 'linked-list');
  if (!linked.length) list.append(paragraph('Cap NC vinculada a aquest requisit.', 'hint'));
  for (const n of linked) {
    const other = n.requirements.filter(id => id !== r.id).map(id => `${cat.frameworks[req(id).framework].split(' ')[0]} ${req(id).code}`);
    const b = elem('button', 'incident-card'); b.type = 'button'; const t = elem('span', 'card-copy'), m = elem('span', 'incident-meta');
    m.append(elem('span', '', n.number), statePill(n)); t.append(m, elem('span', 'incident-title', n.title), elem('span', 'incident-location', other.length ? 'També vinculada a ' + other.join(', ') : 'Només aquest requisit'));
    b.append(t); b.addEventListener('click', () => go('nc/' + n.id)); list.append(b);
  }
  body.append(g, section('No conformitats', list), section('Per què importa', paragraph('Una mateixa NC i les seves evidències poden respondre a requisits de diversos marcs sense duplicar-se. L’auditor de cada marc hi veu què s’ha detectat, què s’ha fet i si se n’ha verificat l’eficàcia.')));
  root.append(head, body);
}

// --- Estadístiques ---
let statsRows = [];
function renderStats() {
  const form = $('stats-filters'); if (!form.from.value) { form.from.value = (Number(today.slice(0, 4)) - 1) + '-01-01'; form.to.value = today; }
  const f = Object.fromEntries(new FormData(form).entries());
  const list = ncs.filter(n => (f.historic || !n.historic) && (!f.from || n.detected_at >= f.from) && (!f.to || n.detected_at <= f.to));
  const closed = list.filter(n => n.state === 'tancada'), actions = list.flatMap(n => n.actions);
  const days = closed.filter(n => n.closing?.date).map(n => (Date.parse(n.closing.date) - Date.parse(n.detected_at)) / 864e5);
  const cards = [['Total', list.length, 'NC del període'], ['Obertes', list.filter(isOpen).length, 'Inclou pendents d’activar'], ['Tancades', closed.length, `${list.filter(n => n.state === 'desestimada').length} desestimades`],
    ['Eficàcia verificada', closed.length ? Math.round(100 * closed.filter(n => n.verification?.effective).length / closed.length) + '%' : '—', 'De les tancades'],
    ['Temps mitjà de tancament', days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) + ' dies' : '—', 'Des de la detecció'],
    ['Accions vençudes', actions.filter(overdue).length, `${actions.filter(a => a.done_at && a.done_at.slice(0, 10) > a.due).length} tancades fora de termini`]];
  $('stats-cards').replaceChildren(...cards.map(([k, v, s]) => { const d = elem('div', 'stat'); d.append(elem('span', '', k), elem('strong', '', String(v)), elem('small', '', s)); return d; }));
  const dims = [['Per origen', n => label('origins', n.origin)], ['Per departament d’origen', n => label('departments', n.dept_origin)], ['Per client', n => label('clients', n.client)],
    ['Per proveïdor', n => label('suppliers', n.supplier)], ['Per autor', n => userName(n.author_id)], ['Per marc de referència', n => [...new Set(n.requirements.map(id => cat.frameworks[req(id).framework]))]]];
  statsRows = [];
  $('stats-tables').replaceChildren(...dims.map(([title, key]) => {
    const counts = {};
    for (const n of list) for (const k of [].concat(key(n) || '—')) { const c = counts[k] ||= { total: 0, open: 0, closed: 0, dismissed: 0 }; c.total++; c[isOpen(n) ? 'open' : n.state === 'tancada' ? 'closed' : 'dismissed']++; }
    const box = elem('section', 'stats-table'), max = Math.max(1, ...Object.values(counts).map(c => c.total)); box.append(elem('h3', '', title));
    const t = elem('table', 'grid compact'), th = elem('thead'), hr = elem('tr');
    for (const h of ['', 'Total', 'Obertes', 'Tancades', 'Desest.']) hr.append(elem('th', '', h)); th.append(hr); t.append(th); const tb = elem('tbody');
    for (const [k, c] of Object.entries(counts).sort((a, b) => b[1].total - a[1].total)) {
      statsRows.push([title, k, c.total, c.open, c.closed, c.dismissed]);
      const tr = elem('tr'), name = elem('td', 'name'), bar = elem('span', 'bar'); bar.style.width = `${100 * c.total / max}%`; name.append(elem('span', '', k), bar); tr.append(name);
      for (const v of [c.total, c.open, c.closed, c.dismissed]) tr.append(elem('td', 'num', String(v))); tb.append(tr);
    }
    if (!tb.children.length) { const tr = elem('tr'); const td = elem('td', 'hint', 'Cap NC en el període.'); td.colSpan = 5; tr.append(td); tb.append(tr); }
    t.append(tb); box.append(t); return box;
  }));
}
$('stats-filters').addEventListener('input', renderStats);
$('stats-csv').addEventListener('click', () => downloadCsv('estadistiques-nc.csv', ['Resum', 'Valor', 'Total', 'Obertes', 'Tancades', 'Desestimades'], statsRows));
$('stats-rd').addEventListener('click', () => { $('stats-status').textContent = 'Resum afegit a l’informe de revisió per la direcció (simulat).'; });

// --- Configuració ---
let settings = {};
async function loadSettings() { settings = (await api(`/api/settings?role=${role}`)).settings; }
async function renderConfig() {
  const r = await api(`/api/settings?role=${role}`), form = $('config-form'); settings = r.settings; form.replaceChildren(elem('h3', '', 'Comportament del mòdul'));
  for (const [k, name] of Object.entries(r.names)) {
    const l = elem('label', 'check'), c = elem('input'); c.type = 'checkbox'; c.checked = r.settings[k]; c.disabled = !isQ();
    c.addEventListener('change', async () => { await post('/api/settings', { [k]: c.checked }); settings[k] = c.checked; $('config-status').textContent = 'Configuració desada.'; });
    l.append(c, ' ' + name); form.append(l);
  }
  form.append(elem('p', 'hint', `Recordatoris d’acció: ${r.settings.reminder_days} dies abans de la data límit i quan vencen. Usuaris que no reben correus de NC: ${cat.users.filter(u => u.no_nc_mail).map(u => u.name).join(', ') || 'cap'}.`));
  const st = elem('p', 'hint'); st.id = 'config-status'; st.setAttribute('role', 'status'); form.append(st);
  const cats = [['Orígens i suborígens', Object.entries(cat.origins).map(([k, v]) => `${v}${cat.suborigins[k] ? ' › ' + Object.values(cat.suborigins[k]).join(', ') : ''} · responsables: ${(cat.originManagers[k] || []).map(userName).join(', ')}`)],
    ['Departaments i gestors', Object.entries(cat.departments).map(([k, v]) => `${v} · ${userName(cat.deptManagers[k])}`)], ['Llocs de detecció', Object.values(cat.locations)],
    ['Tipus de problema', Object.values(cat.phases)], ['Causes primàries', Object.values(cat.causes)], ['Paraules clau de tancament', Object.values(cat.keywords)]];
  $('config-catalogs').replaceChildren(...cats.map(([title, items]) => { const box = elem('div', 'side-box'); box.append(elem('small', '', title.toUpperCase())); const ul = elem('ul'); ul.append(...items.map(i => elem('li', '', i))); box.append(ul); return box; }));
}

// --- Diàlegs ---
let editFollow = null;
function openEditFollowup(f, path, extra) {
  editFollow = { path, extra }; openDialog('followup-dialog'); $('followup-title').textContent = 'Editar el seguiment'; $('followup-target').textContent = `${current.number} · ${f.author} · ${dateText(f.at)}`;
  $('followup-text').value = f.text; $('followup-done-label').hidden = true; followTarget = null;
}
function openDialog(id) { const d = $(id); d.querySelector('form').reset(); d.querySelector('[role=status]').textContent = ''; d.showModal(); return d; }
async function refresh() { const id = current?.id; await loadSettings(); await load(); if (id) { current = ncs.find(n => n.id === id) || null; if (location.hash.startsWith('#nc/')) renderNC(); } }
async function submit(form, fn) {
  const status = form.querySelector('[role=status]');
  try { await fn(); form.closest('dialog').close(); await refresh(); } catch (e) { status.textContent = e.message; }
}
async function submitDirect(path, data) { try { await post(path, data); await refresh(); } catch (e) { alertBox(e.message); } }
function alertBox(msg) { const anchor = $('view-nc').querySelector('.toolbar') || $('view-nc').firstChild; const p = elem('p', 'error-box', msg); anchor.after(p); setTimeout(() => p.remove(), 5000); }
function readFiles(input, max) {
  return Promise.all([...input.files].slice(0, max).map(f => new Promise((ok, ko) => {
    if (f.size > 5e6) return ko(Error(`${f.name} supera 5 MB.`));
    const r = new FileReader(); r.onload = () => ok({ name: f.name, content_type: f.type, data: String(r.result).split(',')[1] }); r.onerror = ko; r.readAsDataURL(f);
  })));
}
function reqPicker(host, chosen) {
  host.replaceChildren();
  for (const [fw, name] of Object.entries(cat.frameworks)) {
    const group = elem('div', 'req-group'); group.append(elem('b', '', name));
    for (const r of cat.requirements.filter(x => x.framework === fw)) { const l = elem('label', 'check'), c = elem('input'); c.type = 'checkbox'; c.value = r.id; c.checked = chosen.includes(r.id); l.append(c, ` ${r.code} · ${r.name}`); group.append(l); }
    host.append(group);
  }
}
const picked = host => [...host.querySelectorAll('input:checked')].map(c => c.value);
function field(host, key, text, kind, value) {
  const wrap = elem('div', kind === 'textarea' ? 'span-all' : ''), l = elem('label', '', text), id = 'f-' + key + '-' + host.childElementCount; l.htmlFor = id;
  let input;
  if (kind === 'textarea') { input = elem('textarea'); input.rows = 3; input.value = value || ''; }
  else if (['text', 'date', 'number'].includes(kind)) { input = elem('input'); input.type = kind; input.value = value ?? ''; }
  else { input = elem('select'); options(input, optionsFor(kind), value ?? '', '—'); }
  input.id = id; input.dataset.key = key; wrap.append(l, input); host.append(wrap); return input;
}
function costFields(host, c) {
  host.replaceChildren(); const g = elem('div', 'form-grid cost-grid');
  const hp = field(g, 'hours_planned', 'Temps previst (h)', 'number', c.hours_planned), hr = field(g, 'hours_real', 'Temps real (h)', 'number', c.hours_real), team = field(g, 'team', 'Equip', 'text', c.team);
  const items = c.items.map((it, i) => [field(g, `sup${i}`, `Proveïdor ${i + 1}`, 'text', it.supplier), field(g, `amt${i}`, `Cost ${i + 1} (€)`, 'number', it.amount)]);
  const notes = field(g, 'cost_notes', 'Observacions', 'textarea', c.notes); host.append(g);
  return () => ({ hours_planned: hp.value, hours_real: hr.value, team: team.value, items: items.map(([s, a]) => ({ supplier: s.value, amount: a.value })), notes: notes.value });
}

$('new-nc').addEventListener('click', () => {
  openDialog('new-dialog'); options($('new-origin'), optionsFor('origins')); newSuborigins(); options($('new-process'), optionsFor('processes')); options($('new-target'), optionsFor('departments'), '', '—'); $('new-date').value = today;
  checkList($('new-locations'), 'locations', []);
  $('new-target').required = settings.dept_target_required; $('new-suborigin').required = settings.suborigin_required; $('new-cause').required = settings.extended_validation;
  $('new-suborigin-label').textContent = 'Suborigen' + (settings.suborigin_required ? '' : ' (opcional)'); $('new-cause-label').textContent = settings.extended_validation ? 'Causa' : 'Causa, si es coneix';
});
function newSuborigins() { options($('new-suborigin'), Object.entries(cat.suborigins[$('new-origin').value] || {}), '', '—'); }
$('new-origin').addEventListener('change', newSuborigins);
function checkList(host, kind, chosen) { host.replaceChildren(...optionsFor(kind).map(([v, t]) => { const l = elem('label', 'check'), c = elem('input'); c.type = 'checkbox'; c.value = v; c.checked = chosen.includes(v); l.append(c, ' ' + t); return l; })); }
$('new-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, async () => {
  const files = await readFiles($('new-files'), 4);
  const n = await post('/api/ncs', { title: $('new-title').value, description: $('new-description').value, origin: $('new-origin').value, origin_ref: $('new-ref').value, process: $('new-process').value, suborigin: $('new-suborigin').value,
    dept_target: $('new-target').value, detected_at: $('new-date').value, locations: picked($('new-locations')), root_cause: $('new-cause').value, correction: $('new-correction').value, files });
  current = n; history.replaceState(null, '', '#nc/' + n.id);
}); });

const editSchema = [
  ['Identificació', [['title', 'Títol', 'text'], ['detected_at', 'Data', 'date'], ['origin', 'Origen', 'origins'], ['suborigin', 'Suborigen', 'suborigins'], ['origin_ref', 'Referència de l’origen', 'text'], ['scope', 'Àmbit / servei', 'scopes'], ['process', 'Procés', 'processes']]],
  ['Departaments, responsables i dates', [['dept_origin', 'Departament d’origen', 'departments'], ['dept_target', 'Departament destí', 'departments'], ['owner_id', 'Responsable de la NC', 'people'],
    ['verifier_id', 'Responsable de verificació', 'people'], ['closer_id', 'Responsable de tancament', 'people'], ['due_date', 'Data de caducitat', 'date']]],
  ['Dades relacionades', [['client', 'Client', 'clients'], ['supplier', 'Proveïdor', 'suppliers'], ['product', 'Producte / servei', 'products'], ['phase', 'Tipus de problema', 'phases']]],
  ['Problema i causa', [['description', 'Problema', 'textarea'], ['root_cause', 'Causa', 'textarea'], ['cause_id', 'Causa primària', 'causes']]]
];
let readCost = null, editReqHost = null, editLocHost = null;
function openEdit(n) {
  openDialog('edit-dialog'); const host = $('edit-fields'); host.replaceChildren();
  for (const [title, fields] of editSchema) { const fs = elem('fieldset', 'edit-block'); fs.append(elem('legend', '', title)); const g = elem('div', 'form-grid'); for (const [k, t, kind] of fields) field(g, k, t, kind, n[k]); fs.append(g); host.append(fs); }
  const lc = elem('fieldset', 'req-picker'); lc.append(elem('legend', '', 'On es detecta')); editLocHost = elem('div', 'check-cols'); lc.append(editLocHost); checkList(editLocHost, 'locations', n.locations); host.append(lc);
  const rq = elem('fieldset', 'req-picker'); rq.append(elem('legend', '', 'Requisits afectats')); editReqHost = elem('div'); rq.append(editReqHost); reqPicker(editReqHost, n.requirements); host.append(rq);
  const cf = elem('fieldset', 'edit-block cost-block'); cf.append(elem('legend', '', 'Costos de la no qualitat')); const ch = elem('div'); cf.append(ch); host.append(cf); readCost = costFields(ch, n.cost);
}
$('edit-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, () => {
  const d = Object.fromEntries([...$('edit-fields').querySelectorAll('.edit-block:not(.cost-block) [data-key]')].map(el => [el.dataset.key, el.value]));
  if (!d.cause_id) d.cause_id = null;
  return post(`/api/ncs/${current.id}/update`, { ...d, locations: picked(editLocHost), requirements: picked(editReqHost), cost: readCost() });
}); });

function openAccept(n) {
  openDialog('accept-dialog'); const owner = cat.processes.find(p => p.id === n.process).owner_id;
  options($('accept-owner'), people(), owner); options($('accept-verifier'), people(), n.verifier_id || 1); options($('accept-closer'), people(), owner);
  $('accept-due').value = plusDays(30); $('accept-analysis').value = plusDays(7); reqPicker($('accept-reqs'), n.requirements);
}
$('accept-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, () => e.submitter.value === 'dismiss'
  ? post(`/api/ncs/${current.id}/dismiss`, { reason: $('dismiss-reason').value })
  : post(`/api/ncs/${current.id}/accept`, { owner_id: $('accept-owner').value, due_date: $('accept-due').value, due_analysis: $('accept-analysis').value, verifier_id: $('accept-verifier').value, closer_id: $('accept-closer').value, requirements: picked($('accept-reqs')) })); });

function openAnalysis(n) {
  openDialog('analysis-dialog');
  $('an-root').value = n.root_cause || ''; options($('an-cause'), optionsFor('causes'), n.cause_id || '', 'Sense classificar'); reqPicker($('an-reqs'), n.requirements);
  const pending = n.actions.filter(a => a.status === 'pendent' && a.type !== 'correccio');
  $('an-existing').textContent = pending.length ? `Ja hi ha ${pending.length} ${pending.length === 1 ? 'acció pendent' : 'accions pendents'}; pots afegir-ne més.` : 'Cal almenys una acció correctiva o preventiva.';
  $('an-actions').replaceChildren(...[0, 1, 2].map(i => {
    const row = elem('div', 'plan-row'), type = elem('select'), text = elem('input'), owner = elem('select'), due = elem('input');
    options(type, [['correctiva', 'Correctiva'], ['preventiva', 'Preventiva']]); options(owner, people(), n.owner_id);
    text.placeholder = i ? 'Acció opcional' : 'Acció'; text.maxLength = 300; text.required = i === 0 && !pending.length; due.type = 'date'; due.value = plusDays(30);
    for (const [el, name] of [[type, 'type'], [text, 'text'], [owner, 'owner_id'], [due, 'due']]) { el.dataset.field = name; el.setAttribute('aria-label', `Acció ${i + 1}: ${name}`); }
    row.append(type, text, owner, due); return row;
  }));
}
$('analysis-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, () => post(`/api/ncs/${current.id}/analysis`, {
  cause_id: $('an-cause').value, root_cause: $('an-root').value, verify_days: $('an-verify').value, requirements: picked($('an-reqs')),
  actions: [...$('an-actions').children].map(row => Object.fromEntries([...row.querySelectorAll('[data-field]')].map(el => [el.dataset.field, el.value.trim()])))
})); });

let editingAction = null;
function openAction(n, a) {
  editingAction = a; openDialog('action-dialog'); $('action-title').textContent = a ? `Editar l’acció ${a.order}` : n.state === 'registrada' ? 'Nova correcció' : 'Nova acció';
  options($('act-type'), n.state === 'registrada' ? [['correccio', cat.actionTypes.correccio]] : Object.entries(cat.actionTypes), a?.type || (n.state === 'registrada' ? 'correccio' : 'correctiva'));
  options($('act-owner'), people(), a?.owner_id || n.owner_id || me()); options($('act-owner2'), people(), a?.owner2_id || '', '—');
  $('act-text').value = a?.text || ''; $('act-order').value = a?.order || n.actions.length + 1; $('act-due').value = a?.due || plusDays(30);
}
$('action-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, () => {
  const d = { type: $('act-type').value, order: $('act-order').value, text: $('act-text').value, owner_id: $('act-owner').value, owner2_id: $('act-owner2').value, due: $('act-due').value };
  return editingAction ? post(`/api/ncs/${current.id}/actions/${editingAction.id}/update`, d) : post(`/api/ncs/${current.id}/actions`, d);
}); });

let followTarget = null;
function openFollowup(a, done = false) {
  followTarget = a; editFollow = null; openDialog('followup-dialog');
  $('followup-title').textContent = a ? (done ? 'Tancar l’acció' : 'Seguiment de l’acció') : 'Nou seguiment global';
  $('followup-target').textContent = a ? `${current.number} · acció ${a.order}: ${a.text}` : `${current.number} · ${current.title}`;
  $('followup-done-label').hidden = !a; $('followup-done').checked = done;
}
$('followup-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, async () => {
  if (editFollow) return post(editFollow.path, { ...editFollow.extra, text: $('followup-text').value });
  const files = await readFiles($('followup-files'), 3), d = { text: $('followup-text').value, files };
  return followTarget ? post(`/api/ncs/${current.id}/actions/${followTarget.id}/followup`, { ...d, done: $('followup-done').checked }) : post(`/api/ncs/${current.id}/followups`, d);
}); });

$('docs-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, async () => post(`/api/ncs/${current.id}/documents`, { files: await readFiles($('docs-files'), 5) })); });

function openLink() { openDialog('link-dialog'); linkMode(); }
function linkMode() { const create = $('link-form').querySelector('[name=link-mode]:checked').value === 'create'; $('link-existing').hidden = create; $('link-create').hidden = !create;
  options($('link-type'), Object.entries(cat.linkTypes).filter(([k]) => !create || k !== 'auditoria')); linkRefs(); }
function linkRefs() { options($('link-ref'), linkables.filter(l => l.type === $('link-type').value && !current.links.some(x => x.ref === l.ref)).map(l => [l.ref, `${l.ref} · ${l.title}`]), undefined, 'Selecciona'); }
$('link-type').addEventListener('change', linkRefs);
for (const r of document.querySelectorAll('[name=link-mode]')) r.addEventListener('change', linkMode);
$('link-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, () => $('link-create').hidden
  ? post(`/api/ncs/${current.id}/links`, { ref: $('link-ref').value })
  : post(`/api/ncs/${current.id}/links`, { create: true, type: $('link-type').value, title: $('link-new-title').value })); });

function openNotify() {
  openDialog('notify-dialog'); const n = current, host = $('notify-groups'); host.replaceChildren();
  const who = { autor: [n.author_id], responsable: [n.owner_id], accions: n.actions.flatMap(owners), verificador: [n.verifier_id], tancament: [n.closer_id], origen: cat.originManagers[n.origin] || [],
    dept_origen: [cat.deptManagers[n.dept_origin]], dept_desti: [cat.deptManagers[n.dept_target]], qualitat: [1] };
  for (const [k, name] of Object.entries(cat.notifyGroups)) {
    const ids = [...new Set(who[k].filter(Boolean))]; if (!ids.length) continue;
    const l = elem('label', 'check'), c = elem('input'); c.type = 'checkbox'; c.value = k; c.checked = k === (n.owner_id ? 'responsable' : 'qualitat'); l.append(c, ` ${name}: ${ids.map(userName).join(', ')}`); host.append(l);
  }
  $('notify-subject').value = `Notificació de la no conformitat ${n.number}`;
}
$('notify-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, () => post(`/api/ncs/${current.id}/notify`, { groups: picked($('notify-groups')), subject: $('notify-subject').value, message: $('notify-message').value })); });

let readVerifyCost = null;
function openVerify(n) { openDialog('verify-dialog'); options($('verify-keyword'), optionsFor('keywords'), '', 'Sense paraula clau'); $('verify-date').value = today; readVerifyCost = costFields($('verify-cost'), n.cost); }
$('verify-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, () => post(`/api/ncs/${current.id}/verify`, {
  effective: e.submitter.value === 'yes', notes: $('verify-notes').value, reason: $('verify-reason').value, keyword: $('verify-keyword').value, close_date: $('verify-date').value, cost: readVerifyCost() })); });

$('open-historic').addEventListener('click', () => { openDialog('historic-dialog'); $('historic-before').value = today.slice(0, 4) + '-01-01'; });
$('historic-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, async () => {
  if (e.submitter.value === 'purge') { const r = await post('/api/ncs/purge', { before: $('historic-before').value }); if (!r.deleted) throw Error('No hi ha NC històriques anteriors a la data.'); return; }
  const r = await post('/api/ncs/historic', { before: $('historic-before').value, states: picked(e.target.querySelector('fieldset')) });
  if (!r.moved) throw Error('Cap NC compleix els criteris.');
}); });

$('delete-form').addEventListener('submit', e => { e.preventDefault(); submit(e.target, async () => { await post(`/api/ncs/${current.id}/delete`); current = null; history.replaceState(null, '', '#list'); }); });

for (const b of document.querySelectorAll('[data-close]')) b.addEventListener('click', () => b.closest('dialog').close());
for (const b of document.querySelectorAll('[data-print]')) b.addEventListener('click', () => print());
for (const b of document.querySelectorAll('[data-go]')) b.addEventListener('click', () => go(b.dataset.go));

(async () => {
  cat = await api(`/api/catalogs?role=${role}`);
  for (const s of document.querySelectorAll('#filters [data-cat]')) options(s, optionsFor(s.dataset.cat), '', 'Tots');
  await loadSettings(); $('action-filters').mine.checked = role === 'accio'; renderRoles(); load();
})();

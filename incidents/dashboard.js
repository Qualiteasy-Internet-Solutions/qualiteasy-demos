const $ = id => document.getElementById(id);

const allowedRoles = ['municipal', 'brigada', 'brigada_suport', 'cap_brigada', 'responsable_servei'];
const params = new URLSearchParams(location.search);
let role = allowedRoles.includes(params.get('role')) ? params.get('role') : 'municipal';
const requestedIncident = Number(params.get('incident') || 0);
const roleNames = { municipal: 'Ajuntament', brigada: 'Operari Prova · brigada', brigada_suport: 'Operari Suport Prova · brigada', cap_brigada: 'Cap de Brigada', responsable_servei: 'Responsable del servei' };
const roleOwnerIds = { brigada: 4, brigada_suport: 6 };
const roleIntro = {
  municipal: 'Registra l’avís, el revisa i assigna la feina; quan la brigada pretanca, valida el resultat i tanca o retorna.',
  brigada: 'Veu només les feines assignades a Operari Prova: hi deixa seguiments i en fa el pretancament amb fotografies.',
  brigada_suport: 'Veu només les feines assignades a Operari Suport Prova: hi deixa seguiments i en fa el pretancament amb fotografies.',
  cap_brigada: 'Segueix les feines de brigada i els avisos d’activació. Vista de consulta de la demo.',
  responsable_servei: 'Segueix les incidències activades al servei i els avisos rebuts. Vista de consulta de la demo.'
};
const originNames = { telefon: 'Trucada rebuda', correu: 'Correu rebut', whatsapp: 'WhatsApp',
  web_municipal: 'Web municipal', ajuntament: 'Detecció interna', brigada: 'Operari de brigada',
  intern: 'Gestió interna', altres: 'Altres' };
const categoryNames = { via_publica: 'Via pública', edificis: 'Edificis', actes: 'Actes', altres: 'Altres' };
const stageClasses = { 9: 'review', 7: 'work', 8: 'validation', 4: 'closed' };
let incidents = [], selectedId = requestedIncident || null, view = requestedIncident ? 'all' : role === 'municipal' ? 'showcase' : 'active';
let municipalPoint = null, searchTimer = null;

function elem(tag, cls, value) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (value !== undefined) e.textContent = value;
  return e;
}
function title(i) { return String(i.title || '').replace(/^\[MOSTRA ALELLA · NC \d+\]\s*/, '').replace(/^\[MOSTRA ALELLA\]\s*/, '').replace(/^\[DEMO\]\s*/, ''); }
function historical(i) { return (i.title || '').match(/\[MOSTRA ALELLA · NC (\d+)\]/)?.[1]; }
function dateText(value) { if (!value) return 'Pendent'; const d = new Date(value); return Number.isNaN(d.valueOf()) ? value : d.toLocaleDateString('ca-ES'); }
function stagePill(i) { return elem('span', 'pill ' + (stageClasses[i.state_id] || ''), i.stage); }
function info(name, value) { const box = elem('div', 'info'); box.append(elem('small', '', name), elem('strong', '', value || 'Pendent')); return box; }
function section(titleText, body) { const box = elem('section', 'workflow-section'); box.append(elem('h3', '', titleText), body); return box; }
function paragraph(value, cls = '') { return elem('p', cls, value || 'Pendent'); }
function button(text, cls, fn) { const b = elem('button', cls, text); b.type = 'button'; b.addEventListener('click', fn); return b; }
async function api(path, options = {}) {
  return DemoStore.request(path, options);
}

async function postAction(id, action, data) {
  return api(`/api/incidents/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Demo': 'true' },
    body: JSON.stringify({ ...data, actor_role: role }) });
}
function updateTabs() {
  for (const tab of document.querySelectorAll('.tab')) tab.classList.toggle('selected', tab.dataset.view === view);
}
function visible() {
  let rows = incidents.slice();
  if (view === 'showcase') rows = rows.filter(i => i.title.startsWith('[MOSTRA ALELLA'));
  if (view === 'active') rows = rows.filter(i => ![4, 5].includes(i.state_id));
  return rows.sort((a, b) => view === 'showcase' ? a.id - b.id : b.id - a.id);
}
async function load() {
  try {
    const result = await api(`/api/incidents?role=${role}`);
    incidents = result.incidents;
    render();
  } catch (e) {
    $('incidents').replaceChildren(paragraph(e.message, 'loading'));
    $('detail').replaceChildren(paragraph('No es poden mostrar les incidències.', 'empty'));
  }
}
function render() {
  const active = incidents.filter(i => ![4, 5].includes(i.state_id));
  $('count-active').textContent = active.length;
  $('count-review').textContent = active.filter(i => i.state_id === 9).length;
  $('count-work').textContent = active.filter(i => i.state_id === 7).length;
  $('count-validation').textContent = active.filter(i => i.state_id === 8).length;
  const rows = visible();
  if (!rows.some(i => i.id === selectedId)) selectedId = rows[0]?.id || null;
  renderList(rows);
  const selected = rows.find(i => i.id === selectedId);
  if (selected) renderDetail(selected);
  else $('detail').replaceChildren(paragraph('No hi ha incidències en aquesta vista. Canvia el filtre o crea una incidència.', 'empty'));
}
function renderList(rows) {
  const host = $('incidents'); host.replaceChildren();
  if (!rows.length) return host.append(paragraph('No hi ha incidències en aquesta vista.', 'loading'));
  for (const i of rows) {
    const b = elem('button', 'incident-card' + (i.id === selectedId ? ' selected' : '')); b.type = 'button';
    const image = i.photo ? elem('img', 'thumb') : elem('span', 'thumb thumb-placeholder', '◉');
    if (i.photo) { image.src = i.photo; image.alt = 'Imatge adjunta'; }
    const text = elem('span', 'card-copy'), meta = elem('span', 'incident-meta');
    meta.append(elem('span', '', `#${i.number}`), stagePill(i));
    text.append(meta, elem('span', 'incident-title', title(i)), elem('span', 'incident-location', i.location || 'Ubicació pendent'));
    b.append(image, text);
    b.addEventListener('click', () => { selectedId = i.id; renderList(rows); renderDetail(i); });
    host.append(b);
  }
}
function mapNode(i) {
  const box = elem('div'), head = elem('div', 'map-title'); head.append(elem('h3', '', 'Ubicació'));
  const lat = Number(i.lat), lon = Number(i.lon);
  const valid = Number.isFinite(lat) && Number.isFinite(lon) && lat > 41.45 && lat < 41.53 && lon > 2.25 && lon < 2.35;
  if (valid) {
    const a = elem('a', '', 'Obre el mapa ↗');
    a.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
    a.target = '_blank'; a.rel = 'noopener noreferrer'; head.append(a);
  }
  box.append(head);
  if (valid) {
    const canvas = elem('div', 'map-canvas'); canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Mapa de la ubicació aproximada a Alella');
    box.append(canvas, paragraph('Punt aproximat. Cal confirmar la posició exacta sobre el terreny.', 'map-note'));
    requestAnimationFrame(() => paintTiles(canvas, lat, lon));
  } else box.append(elem('div', 'map-empty', 'Encara no hi ha un punt verificat. L’adreça consta a la fitxa.'));
  return box;
}
function paintTiles(map, lat, lon) {
  const z = 16, n = 2 ** z, w = map.clientWidth || 800, h = map.clientHeight || 220;
  const cx = (lon + 180) / 360 * n * 256;
  const cy = (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n * 256;
  for (let x = Math.floor((cx - w / 2) / 256); x <= Math.floor((cx + w / 2) / 256); x++)
    for (let y = Math.floor((cy - h / 2) / 256); y <= Math.floor((cy + h / 2) / 256); y++) {
      const tile = elem('img', 'map-tile'); tile.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      tile.alt = ''; tile.loading = 'lazy';
      tile.style.left = `${Math.round(x * 256 - cx + w / 2)}px`;
      tile.style.top = `${Math.round(y * 256 - cy + h / 2)}px`; map.append(tile);
    }
  map.append(elem('div', 'map-marker'));
  const a = elem('a', 'map-attribution', '© OpenStreetMap contributors');
  a.href = 'https://www.openstreetmap.org/copyright'; a.target = '_blank'; a.rel = 'noopener noreferrer'; map.append(a);
}
function renderDetail(i) {
  const root = $('detail'); root.replaceChildren();
  const m = i.metadata || {};
  const head = elem('div', 'detail-head'), left = elem('div'), badges = elem('div', 'badge-stack');
  left.append(elem('div', 'eyebrow', `INCIDÈNCIA #${i.number}`), elem('h2', '', title(i)));
  const legacy = historical(i);
  left.append(elem('div', 'detail-sub', legacy ? `Registre històric «noconf» ${legacy}; tractat com a incidència en aquesta prova.` : 'Seguiment municipal'));
  badges.append(stagePill(i));
  if (i.nc) badges.append(elem('span', 'pill nc', i.nc.reference));
  else if (i.nc_pending) badges.append(elem('span', 'pill nc', 'Proposta NC antiga'));
  head.append(left, badges); root.append(head);
  const gallery = elem('div', 'photo-box');
  if (i.photos?.length) {
    const hero = elem('img', 'hero-photo'); hero.src = i.photos[0].url; hero.alt = 'Fotografia de la incidència';
    hero.addEventListener('click', () => openPhoto(i.photos[0])); gallery.append(hero);
    if (i.synthetic_photo) gallery.append(elem('span', 'synthetic-label', 'IMATGE SINTÈTICA · DEMO'));
    if (i.photos.length > 1) {
      const row = elem('div', 'photo-strip');
      for (const photo of i.photos) {
        const b = button(photo.phase, 'photo-thumb', () => openPhoto(photo));
        const img = elem('img'); img.src = photo.url; img.alt = photo.name; b.prepend(img); row.append(b);
      }
      gallery.append(row);
    }
  } else gallery.append(elem('div', 'photo-empty', 'Sense fotografia adjunta'));
  root.append(gallery);
  const body = elem('div', 'detail-body'), grid = elem('div', 'detail-grid');
  grid.append(info('Canal d’entrada', originNames[i.origin] || i.origin),
    info('Departament d’origen', m.origin_department),
    info('Autor / càrrec', [m.reporter_name, m.reporter_position].filter(Boolean).join(' · ')),
    info('Data', dateText(i.created_at)),
    info('Departament destí', m.target_department || (i.group_id === 2 ? 'Pendent d’assignació' : 'Serveis municipals')),
    info('Àmbit · antic «Proveïdor»', categoryNames[m.category || i.category]),
    info('Ubicació', i.location), info('Causa coneguda', m.cause));
  body.append(grid);
  const work = elem('div', 'work-summary');
  work.append(info('Acció immediata / feina encomanada', m.action_instruction),
    info('Responsable d’execució / càrrec', [m.assignee_name, m.assignee_position].filter(Boolean).join(' · ')),
    info('Data límit', m.due_date), info('Prioritat', m.priority === 'urgent' ? 'Urgent' : m.priority === 'normal' ? 'Normal' : 'Per definir'));
  body.append(section('Assignació i ordre de treball', work));
  if (m.preclosed_at || m.closed_at) {
    const closure = elem('div', 'detail-grid');
    closure.append(info('Pretancament · responsable / càrrec', [m.preclosed_by, m.preclosed_position].filter(Boolean).join(' · ')),
      info('Data de pretancament', dateText(m.preclosed_at)),
      info('Feina executada', m.work_done),
      info('Tancament · responsable / càrrec', [m.closed_by, m.closed_position].filter(Boolean).join(' · ')),
      info('Data de tancament', dateText(m.closed_at)), info('Motiu de tancament', m.closure_reason));
    body.append(section('Pretancament i validació', closure));
  }
  const follow = elem('div');
  if (i.followups?.length) for (const f of i.followups) {
    const row = elem('div', 'timeline-row'); row.append(elem('strong', '', f.author), elem('span', '', dateText(f.at)), paragraph(f.text));
    for (const file of f.files || []) { const a = elem('a', '', file.name); a.href = file.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; row.append(a); }
    follow.append(row);
  } else follow.append(paragraph('Encara no hi ha seguiments. Els responsables i l’operari assignat poden deixar constància de com va la feina sense pretancar-la.', 'hint'));
  body.append(section('Seguiments', follow));
  if (i.attachments?.length) {
    const items = elem('ul', 'attachment-list');
    for (const file of i.attachments) {
      const li = elem('li'); const link = elem('a', '', `${file.phase}: ${file.name}${file.image ? ' · imatge' : ''}`);
      link.href = file.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; li.append(link); items.append(li);
    }
    body.append(section('Documents annexos i fotografies', items));
  }
  body.append(mapNode(i));
  if (i.nc) {
    const box = elem('div', 'nc-linked');
    box.append(elem('strong', '', `${i.nc.reference} · ${i.nc.status}`), paragraph(`Motiu: ${i.nc.reason}`),
      paragraph('Registre de NC local de demostració, vinculat a la incidència. El seguiment i el tancament de la NC es fan al mòdul de no conformitats.', 'hint'));
    const link = elem('a', '', 'Veure la demo de no conformitats ↗'); link.href = '../no-conformitats/'; link.target = '_blank'; box.append(link);
    body.append(section('No conformitat vinculada', box));
  }
  const actions = elem('div', 'actions');
  if (role === 'municipal' && i.state_id === 9)
    actions.append(button('Revisar i assignar a brigada', 'primary', () => openAssign(i)));
  if (roleOwnerIds[role] && i.state_id === 7 && i.owner_id === roleOwnerIds[role])
    actions.append(button('Pretancar amb fotografies', 'primary', () => openPreclose(i)));
  if (role === 'municipal' && i.state_id === 8)
    actions.append(button('Validar o retornar', 'primary', () => openValidate(i)));
  const assignedHere = roleOwnerIds[role] && i.owner_id === roleOwnerIds[role];
  if (i.state_id !== 4 && (['municipal', 'cap_brigada', 'responsable_servei'].includes(role) || assignedHere))
    actions.append(button('Afegir seguiment', 'secondary', () => openFollowup(i)));
  if (role === 'municipal' && i.state_id !== 4)
    actions.append(button('Editar dades', 'secondary', () => openEdit(i)));
  if (i.state_id !== 9) {
    actions.append(button('Veure / imprimir ordre de treball', 'secondary', () => printOrder(i)));
  }
  if (role === 'municipal' && !i.nc)
    actions.append(button('Derivar a NC', 'secondary', () => openNc(i)));

  body.append(actions);
  const timeline = elem('div', 'timeline');
  if (i.events?.length) for (const event of i.events) {
    const row = elem('div', 'timeline-row'); row.append(elem('strong', '', event.kind), elem('span', '', `${event.actor} · ${dateText(event.created_at)}`), paragraph(event.detail)); timeline.append(row);
  } else timeline.append(paragraph('La mostra històrica no inclou esdeveniments operatius reals. Fes una acció de prova per veure’n la traça.', 'hint'));
  body.append(section('Historial del flux', timeline));
  const recipientFragment = { brigada: 'Operari Prova', brigada_suport: 'Operari Suport Prova',
    cap_brigada: 'Cap de Brigada', responsable_servei: 'Responsable del servei' }[role];
  const shownNotifications = (i.notifications || []).filter(n => !recipientFragment || n.recipient.includes(recipientFragment));
  if (shownNotifications.length) {
    const previews = elem('div', 'notification-list');
    for (const n of shownNotifications) {
      const row = elem('div', 'notification-row');
      row.append(elem('b', '', `${n.channel} → ${n.recipient}`), elem('small', '', n.status), paragraph(n.message)); previews.append(row);
    }
    body.append(section('Avisos d’assignació i validació · simulació', previews));
  }
  root.append(body);
}
function openPhoto(file) {
  $('full-photo').src = file.url;
  $('photo-caption').textContent = `${file.phase} · ${file.name}${file.name.includes('sintetica') ? ' · Imatge sintètica de demostració' : ''}`;
  $('photo-dialog').showModal();
}
const departments = ['Atenció ciutadana', 'Brigada municipal', 'Serveis municipals', 'Urbanisme', 'Medi ambient', 'Policia local', 'Altres'];
for (const s of document.querySelectorAll('[data-departments]')) s.append(...departments.map(d => new Option(d)));
$('reset-demo').addEventListener('click', () => { DemoStore.reset(); location.reload(); });
function openAssign(i) {
  selectedId = i.id; const m = i.metadata || {};
  $('assign-executor').value = String(m.assignee_id || 4);
  $('assign-origin-department').value = m.origin_department || (i.origin === 'brigada' ? 'Brigada municipal' : '');
  $('assign-target-department').value = m.target_department || 'Serveis municipals';
  $('assign-category').value = m.category || i.category || '';
  $('assign-priority').value = m.priority || 'normal';
  $('assign-cause').value = m.cause || '';
  $('assign-action').value = m.action_instruction || '';
  const week = new Date(); week.setDate(week.getDate() + 7);
  $('assign-due').value = m.due_date || week.toISOString().slice(0, 10);
  $('assign-brigade-lead').value = m.brigade_lead || 'Cap de Brigada (prova)';
  $('assign-service-lead').value = m.service_lead || 'Responsable del servei (prova)';
  $('assign-status').textContent = ''; $('assign-dialog').showModal();
}
function openEdit(i) {
  selectedId = i.id; const m = i.metadata || {};
  $('edit-what').value = title(i); $('edit-where').value = i.location || ''; $('edit-origin').value = i.origin || 'ajuntament';
  $('edit-origin-department').value = m.origin_department || ''; $('edit-target-department').value = m.target_department || '';
  $('edit-category').value = m.category || i.category || ''; $('edit-priority').value = m.priority || ''; $('edit-cause').value = m.cause || '';
  $('edit-status').textContent = ''; $('edit-dialog').showModal();
}
function openFollowup(i) { selectedId = i.id; $('followup-form').reset(); $('followup-status').textContent = ''; $('followup-dialog').showModal(); }
function openPreclose(i) { selectedId = i.id; $('preclose-form').reset(); $('preclose-status').textContent = ''; $('preclose-dialog').showModal(); }
function openValidate(i) { selectedId = i.id; $('validate-form').reset(); $('validation-status').textContent = ''; $('validate-dialog').showModal(); }
function openNc(i) { selectedId = i.id; $('nc-form').reset(); $('nc-status').textContent = ''; $('nc-dialog').showModal(); }
async function filePayload(file) {
  if (file.size > 8 * 1024 * 1024) throw Error(`«${file.name}» supera els 8 MB.`);
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject; reader.readAsDataURL(file);
  });
  return { name: file.name, content_type: file.type, data };
}
async function submit(form, statusId, action) {
  const status = $(statusId), controls = [...form.querySelectorAll('button[type=submit]')];
  controls.forEach(b => b.disabled = true); status.textContent = 'Aplicant a la demo…';
  try {
    const result = await action();
    status.textContent = 'Acció simulada.';
    if (result?.id) { selectedId = result.id; view = 'all'; updateTabs(); }
    form.closest('dialog').close(); await load();
  } catch (e) { status.textContent = e.message; }
  finally { controls.forEach(b => b.disabled = false); }
}
for (const tab of document.querySelectorAll('.tab')) tab.addEventListener('click', () => {
  view = tab.dataset.view; updateTabs(); selectedId = null; render();
});
for (const b of document.querySelectorAll('[data-role]')) {
  b.classList.toggle('active', b.dataset.role === role);
  b.addEventListener('click', () => showDashboard(b.dataset.role));
}
$('page-title').textContent = roleNames[role]; $('role-intro').textContent = roleIntro[role];
$('new-incident').hidden = role !== 'municipal';
$('new-incident').addEventListener('click', () => $('new-dialog').showModal());
for (const b of document.querySelectorAll('[data-close]')) b.addEventListener('click', () => $(b.dataset.close).close());
updateTabs();
$('municipal-where').addEventListener('input', () => {
  municipalPoint = null; clearTimeout(searchTimer);
  const q = $('municipal-where').value.trim(), list = $('municipal-suggestions');
  if (q.length < 3) { list.hidden = true; return; }
  searchTimer = setTimeout(async () => {
    try {
      const matches = await api('/api/streets?q=' + encodeURIComponent(q)); list.replaceChildren();
      for (const match of matches) {
        const b = button(match.label, '', () => {
          $('municipal-where').value = match.label; municipalPoint = { lat: match.lat, lon: match.lon }; list.hidden = true;
          $('municipal-location-note').textContent = 'Punt aproximat seleccionat. Revisa l’adreça abans de registrar.';
        }); list.append(b);
      }
      list.hidden = !matches.length;
    } catch { list.hidden = true; }
  }, 350);
});
$('municipal-form').addEventListener('submit', e => {
  e.preventDefault(); submit(e.target, 'form-status', async () => {
    const files = [...$('municipal-files').files];
    if (files.length > 4) throw Error('Pots adjuntar fins a quatre fitxers.');
    const data = { origin: $('origin').value, origin_department: $('municipal-department').value,
      category: $('municipal-category').value, what: $('municipal-what').value,
      where: $('municipal-where').value, point: municipalPoint, files: await Promise.all(files.map(filePayload)) };
    return api('/api/municipal-incidents', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Demo': 'true' }, body: JSON.stringify(data) });
  });
});
$('assign-form').addEventListener('submit', e => {
  e.preventDefault(); submit(e.target, 'assign-status', () => postAction(selectedId, 'assign', {
    origin_department: $('assign-origin-department').value, target_department: $('assign-target-department').value,
    category: $('assign-category').value, priority: $('assign-priority').value,
    assignee_id: Number($('assign-executor').value),
    cause: $('assign-cause').value, action_instruction: $('assign-action').value,
    due_date: $('assign-due').value, brigade_lead: $('assign-brigade-lead').value,
    service_lead: $('assign-service-lead').value
  }));
});
$('preclose-form').addEventListener('submit', e => {
  e.preventDefault(); submit(e.target, 'preclose-status', async () => {
    const files = [...$('preclose-photos').files];
    if (files.length > 3) throw Error('Pots adjuntar fins a tres fotografies.');
    return postAction(selectedId, 'preclose', { work_done: $('work-done').value,
      photos: await Promise.all(files.map(filePayload)) });
  });
});
$('validate-form').addEventListener('submit', e => {
  e.preventDefault(); const action = e.submitter?.dataset.validation || 'close';
  submit(e.target, 'validation-status', async () => {
    if (action === 'return') return postAction(selectedId, 'return', { return_reason: $('validation-reason').value });
    const files = [...$('validation-files').files];
    if (files.length > 4) throw Error('Pots adjuntar fins a quatre fitxers.');
    return postAction(selectedId, 'close', { closure_reason: $('validation-reason').value,
      files: await Promise.all(files.map(filePayload)) });
  });
});
$('edit-form').addEventListener('submit', e => {
  e.preventDefault(); submit(e.target, 'edit-status', () => postAction(selectedId, 'update', {
    what: $('edit-what').value.trim(), where: $('edit-where').value.trim(), origin: $('edit-origin').value,
    origin_department: $('edit-origin-department').value, target_department: $('edit-target-department').value,
    category: $('edit-category').value, priority: $('edit-priority').value, cause: $('edit-cause').value }));
});
$('followup-form').addEventListener('submit', e => {
  e.preventDefault(); submit(e.target, 'followup-status', async () => {
    const files = [...$('followup-files').files];
    if (files.length > 3) throw Error('Pots adjuntar fins a tres fitxers.');
    return postAction(selectedId, 'followup', { text: $('followup-text').value, files: await Promise.all(files.map(filePayload)) });
  });
});
$('municipal-gps').addEventListener('click', () => {
  const note = $('municipal-location-note');
  if (!navigator.geolocation) { note.textContent = 'Aquest navegador no ofereix GPS.'; return; }
  note.textContent = 'Buscant la posició…';
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude: lat, longitude: lon, accuracy } = position.coords;
    municipalPoint = { lat, lon };
    if (!$('municipal-where').value.trim()) $('municipal-where').value = `Posició GPS ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    note.textContent = `Posició aproximada (±${Math.round(accuracy)} m). Escriu o comprova el carrer.`;
  }, () => { note.textContent = 'No s’ha pogut obtenir la posició. Escriu el carrer manualment.'; },
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
});
$('nc-form').addEventListener('submit', e => {
  e.preventDefault(); submit(e.target, 'nc-status', () => postAction(selectedId, 'nc',
    { reason: $('nc-reason').value, cause: $('nc-cause').value }));
});
load();

function showDashboard(nextRole = role, incidentId = null) {
  role = allowedRoles.includes(nextRole) ? nextRole : 'municipal';
  if (incidentId) { selectedId = incidentId; view = 'all'; }
  else { selectedId = null; view = role === 'municipal' ? 'showcase' : 'active'; }
  $('intake-view').hidden = true;
  $('dashboard-view').hidden = false;
  document.querySelectorAll('[data-role]').forEach(b => b.classList.toggle('active', b.dataset.role === role));
  document.querySelectorAll('[data-view-target]').forEach(b => b.classList.toggle('current', b.dataset.viewTarget === 'dashboard'));
  $('page-title').textContent = roleNames[role];
  $('role-intro').textContent = roleIntro[role];
  $('new-incident').hidden = role !== 'municipal';
  updateTabs(); load(); window.scrollTo(0, 0);
}
function showIntake() {
  $('dashboard-view').hidden = true;
  $('intake-view').hidden = false;
  document.querySelectorAll('[data-view-target]').forEach(b => b.classList.toggle('current', b.dataset.viewTarget === 'intake'));
  window.scrollTo(0, 0);
}
for (const b of document.querySelectorAll('[data-view-target]')) {
  b.addEventListener('click', () => b.dataset.viewTarget === 'intake' ? showIntake() : showDashboard(role));
}
window.demoShowDashboard = showDashboard;
const orderEscape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function printOrder(i) {
  const m = i.metadata || {};
  const win = window.open('', '_blank');
  if (!win) { alert('Permet les finestres emergents per obrir l’ordre de treball.'); return; }
  const row = (label, value) => `<div class="row"><b>${orderEscape(label)}</b><span>${orderEscape(value || 'Pendent')}</span></div>`;
  win.document.write(`<!doctype html><html lang="ca"><meta charset="utf-8"><title>Ordre de treball ${orderEscape(i.number)}</title><style>body{font:16px system-ui;color:#243326;max-width:760px;margin:36px auto;padding:0 20px}header{border-bottom:5px solid #b8d317;padding-bottom:16px}h1{font-size:2rem}.row{display:grid;grid-template-columns:210px 1fr;border-bottom:1px solid #ddd;padding:12px 0;gap:12px}.note{color:#667;font-size:.85rem}.actions{margin:24px 0}button{background:#367b2f;color:white;border:0;border-radius:8px;padding:12px 18px;cursor:pointer}@media print{.actions{display:none}}</style><header><strong>QUALITEASY · ALELLA</strong><h1>Ordre de treball · ${orderEscape(i.number)}</h1><p class="note">Document de demostració. No és una ordre operativa.</p></header>${row('Incidència',title(i))}${row('Ubicació',i.location)}${row('Data',dateText(i.created_at))}${row('Departament d’origen',m.origin_department)}${row('Departament destí',m.target_department)}${row('Àmbit',categoryNames[m.category || i.category])}${row('Causa',m.cause)}${row('Acció encomanada',m.action_instruction)}${row('Responsable',m.assignee_name)}${row('Data límit',m.due_date)}${row('Feina executada',m.work_done)}<div class="actions"><button onclick="window.print()">Imprimeix / desa en PDF</button></div></html>`);
  win.document.close();
}

/* Dades fictícies i estat volàtil de la demostració. Cap dada no s'envia ni es desa. */
const DemoStore = (() => {
  const now = () => new Date().toISOString();
  const assets = './assets/';
  const streets = [
    { label: 'Carrer Major, Alella', lat: 41.4921, lon: 2.2942 },
    { label: 'Carrer de les Escoles Pies, Alella', lat: 41.4929, lon: 2.2934 },
    { label: 'Passeig de la Creu de Pedra, Alella', lat: 41.4934, lon: 2.2983 },
    { label: 'Rambla d’Àngel Guimerà, Alella', lat: 41.4938, lon: 2.2948 },
    { label: 'Carrer del Mig, Alella', lat: 41.4918, lon: 2.2933 }
  ];
  const picture = (name, phase = 'Avís') => ({ name, phase, image: true, url: assets + name });
  const initial = [
    {
      id: 1, number: 'DEMO-001', title: '[MOSTRA ALELLA] Font amb fuita d’aigua',
      stage: 'Pendent de revisió', state_id: 9, group_id: 2, owner_id: null,
      origin: 'brigada', category: '', location: streets[0].label, lat: streets[0].lat, lon: streets[0].lon,
      created_at: '2026-10-07T08:15:00', photo: assets + 'font-fonol-sintetica.png',
      photos: [picture('font-fonol-sintetica.png')], synthetic_photo: true,
      attachments: [picture('font-fonol-sintetica.png')],
      metadata: { origin_department: 'Brigada municipal', reporter_name: 'Operari Prova', reporter_position: 'Operari de brigada' },
      events: [{ kind: 'Avís de brigada', actor: 'Operari Prova', created_at: '2026-10-07T08:15:00', detail: 'Avís i fotografia de demostració rebuts. Pendent de revisió municipal.' }],
      notifications: [], nc: null
    },
    {
      id: 2, number: 'DEMO-002', title: '[MOSTRA ALELLA] Fitó retirat de la vorera',
      stage: 'En execució', state_id: 7, group_id: 3, owner_id: 4,
      origin: 'telefon', category: 'via_publica', location: streets[2].label, lat: streets[2].lat, lon: streets[2].lon,
      created_at: '2026-10-06T10:20:00', photo: assets + 'fito-pujades-sintetica.png',
      photos: [picture('fito-pujades-sintetica.png')], synthetic_photo: true,
      attachments: [picture('fito-pujades-sintetica.png')],
      metadata: { origin_department: 'Atenció ciutadana', reporter_name: 'Usuària Municipal Prova', reporter_position: 'Administrativa', target_department: 'Serveis municipals', category: 'via_publica', priority: 'normal', action_instruction: 'Comprovar l’accés i reposar el fitó. Documentar el resultat amb fotografies.', assignee_id: 4, assignee_name: 'Operari Prova', assignee_position: 'Operari de brigada', brigade_lead: 'Cap de Brigada (prova)', service_lead: 'Responsable del servei (prova)', due_date: '2026-10-14' },
      events: [{ kind: 'Avís registrat', actor: 'Ajuntament · recepció', created_at: '2026-10-06T10:20:00', detail: 'Trucada rebuda i incidència registrada.' }, { kind: 'Assignació a SSMM', actor: 'Ajuntament · recepció', created_at: '2026-10-06T11:00:00', detail: 'Feina assignada a Operari Prova.' }],
      notifications: [{ channel: 'correu', recipient: 'Cap de Brigada (prova)', status: 'Previsualització · no enviat', message: 'S’ha activat la incidència DEMO-002.' }, { channel: 'WhatsApp', recipient: 'Responsable del servei (prova)', status: 'Previsualització · no enviat', message: 'S’ha activat la incidència DEMO-002.' }, { channel: 'WhatsApp', recipient: 'Operari Prova', status: 'Previsualització · no enviat', message: 'Tens assignada la incidència DEMO-002.' }], nc: null
    },
    {
      id: 3, number: 'DEMO-003', title: '[MOSTRA ALELLA] Frontissa del parc malmesa',
      stage: 'Pendent de validació', state_id: 8, group_id: 3, owner_id: 4,
      origin: 'web_municipal', category: 'via_publica', location: streets[1].label, lat: streets[1].lat, lon: streets[1].lon,
      created_at: '2026-10-03T12:40:00', photo: assets + 'frontissa-parc-sintetica.png',
      photos: [picture('frontissa-parc-sintetica.png'), picture('frontissa-parc-sintetica.png', 'Pretancament')], synthetic_photo: true,
      attachments: [picture('frontissa-parc-sintetica.png'), picture('frontissa-parc-sintetica.png', 'Pretancament')],
      metadata: { origin_department: 'Serveis municipals', reporter_name: 'Usuària Municipal Prova', reporter_position: 'Administrativa', target_department: 'Serveis municipals', category: 'via_publica', priority: 'normal', action_instruction: 'Revisar la porta del parc i substituir la frontissa.', assignee_id: 4, assignee_name: 'Operari Prova', assignee_position: 'Operari de brigada', due_date: '2026-10-10', work_done: 'Frontissa substituïda i porta revisada.', preclosed_at: '2026-10-07T15:00:00', preclosed_by: 'Operari Prova', preclosed_position: 'Operari de brigada' },
      events: [{ kind: 'Assignació a SSMM', actor: 'Ajuntament · recepció', created_at: '2026-10-04T09:00:00', detail: 'Feina assignada a brigada.' }, { kind: 'Pretancament', actor: 'Operari Prova', created_at: '2026-10-07T15:00:00', detail: 'Frontissa substituïda. Fotografia adjunta.' }],
      notifications: [{ channel: 'correu', recipient: 'Validador Prova', status: 'Previsualització · no enviat', message: 'La incidència DEMO-003 espera validació.' }], nc: null
    },
    {
      id: 4, number: 'DEMO-004', title: '[MOSTRA ALELLA] Fitó reposat a la vorera',
      stage: 'Tancada', state_id: 4, group_id: 3, owner_id: 6,
      origin: 'whatsapp', category: 'via_publica', location: streets[3].label, lat: streets[3].lat, lon: streets[3].lon,
      created_at: '2026-09-28T09:30:00', photo: assets + 'fito-pujades-sintetica.png',
      photos: [picture('fito-pujades-sintetica.png')], synthetic_photo: true,
      attachments: [picture('fito-pujades-sintetica.png')],
      metadata: { origin_department: 'Atenció ciutadana', reporter_name: 'Usuària Municipal Prova', reporter_position: 'Administrativa', target_department: 'Serveis municipals', category: 'via_publica', priority: 'normal', action_instruction: 'Inspeccionar i reparar la zona.', assignee_id: 6, assignee_name: 'Operari Suport Prova', assignee_position: 'Operari de brigada', due_date: '2026-10-03', work_done: 'Zona reparada i senyalització retirada.', preclosed_at: '2026-10-02T16:00:00', preclosed_by: 'Operari Suport Prova', preclosed_position: 'Operari de brigada', closed_at: '2026-10-03T10:00:00', closed_by: 'Validador Prova', closed_position: 'Responsable municipal', closure_reason: 'Treball comprovat i acceptat.' },
      events: [{ kind: 'Avís rebut', actor: 'Ajuntament · recepció', created_at: '2026-09-28T09:30:00', detail: 'Avís rebut pel canal ciutadà de WhatsApp.' }, { kind: 'Pretancament', actor: 'Operari Suport Prova', created_at: '2026-10-02T16:00:00', detail: 'Feina finalitzada.' }, { kind: 'Tancament validat', actor: 'Validador Prova', created_at: '2026-10-03T10:00:00', detail: 'Treball comprovat i acceptat.' }],
      notifications: [], nc: null
    }
  ];
  let cases = initial;
  let nextId = 5;
  let nextNc = 1;
  const read = options => options.body ? JSON.parse(options.body) : {};
  const urlFor = file => `data:${file.content_type || 'application/octet-stream'};base64,${file.data}`;
  const makeFiles = (files, phase) => (files || []).map(file => ({ name: file.name, phase, image: (file.content_type || '').startsWith('image/'), url: urlFor(file) }));
  const actor = role => ({ brigada: 'Operari Prova', brigada_suport: 'Operari Suport Prova', municipal: 'Ajuntament · recepció', validador: 'Validador Prova' }[role] || 'Ajuntament');
  const addEvent = (item, kind, who, detail) => item.events.push({ kind, actor: who, detail, created_at: now() });
  function create(data, brigade) {
    const files = brigade ? makeFiles(data.photo ? [data.photo] : [], 'Avís') : makeFiles(data.files, 'Avís');
    const point = data.gps || data.point;
    const id = nextId++;
    const item = { id, number: `DEMO-${String(id).padStart(3, '0')}`, title: '[MOSTRA ALELLA] ' + data.what,
      stage: 'Pendent de revisió', state_id: 9, group_id: 2, owner_id: null,
      origin: brigade ? 'brigada' : data.origin, category: data.category || '', location: data.where,
      lat: point?.lat ?? null, lon: point?.lon ?? null, created_at: now(), photo: files.find(f => f.image)?.url || null,
      photos: files.filter(f => f.image), attachments: files, synthetic_photo: false,
      metadata: { origin_department: brigade ? 'Brigada municipal' : data.origin_department, reporter_name: brigade ? 'Operari Prova' : 'Usuària Municipal Prova', reporter_position: brigade ? 'Operari de brigada' : 'Administrativa', category: data.category || '' },
      events: [], notifications: [], nc: null };
    addEvent(item, brigade ? 'Avís de brigada' : 'Avís municipal', brigade ? 'Operari Prova' : 'Ajuntament · recepció', 'Incidència creada en aquesta sessió de demostració.');
    cases.unshift(item);
    return { id, number: item.number };
  }
  function action(item, kind, data) {
    const role = data.actor_role;
    if (kind === 'assign') {
      if (role !== 'municipal' || item.state_id !== 9) throw Error('Aquesta acció requereix recepció municipal i una incidència pendent de revisió.');
      Object.assign(item.metadata, data, { assignee_name: data.assignee_id === 6 ? 'Operari Suport Prova' : 'Operari Prova', assignee_position: 'Operari de brigada' });
      item.category = data.category; item.owner_id = data.assignee_id; item.group_id = 3; item.state_id = 7; item.stage = 'En execució';
      addEvent(item, 'Validació i assignació a SSMM', actor(role), `Assignada a ${item.metadata.assignee_name}.`);
      item.notifications.push({ channel: 'correu', recipient: 'Cap de Brigada (prova)', status: 'Previsualització · no enviat', message: `Activació de ${item.number}.` }, { channel: 'WhatsApp', recipient: 'Responsable del servei (prova)', status: 'Previsualització · no enviat', message: `Activació de ${item.number}.` }, { channel: 'WhatsApp', recipient: item.metadata.assignee_name, status: 'Previsualització · no enviat', message: `Feina assignada: ${item.number}.` });
    } else if (kind === 'preclose') {
      if (item.state_id !== 7 || item.owner_id !== ({ brigada: 4, brigada_suport: 6 }[role])) throw Error('Només l’operari assignat pot pretancar una feina en execució.');
      Object.assign(item.metadata, { work_done: data.work_done, preclosed_at: now(), preclosed_by: actor(role), preclosed_position: 'Operari de brigada' });
      const files = makeFiles(data.photos, 'Pretancament'); item.attachments.push(...files); item.photos.push(...files.filter(f => f.image));
      if (!item.photo) item.photo = item.photos[0]?.url || null;
      item.state_id = 8; item.stage = 'Pendent de validació';
      addEvent(item, 'Pretancament', actor(role), data.work_done);
      item.notifications.push({ channel: 'correu', recipient: 'Validador Prova', status: 'Previsualització · no enviat', message: `${item.number} espera validació.` });
    } else if (kind === 'return' || kind === 'close') {
      if (!['municipal', 'validador'].includes(role) || item.state_id !== 8) throw Error('Només l’Ajuntament pot validar o retornar un pretancament.');
      if (kind === 'return') {
        item.state_id = 7; item.stage = 'En execució'; item.metadata.return_reason = data.return_reason;
        addEvent(item, 'Retorn a brigada', actor(role), data.return_reason);
      } else {
        item.state_id = 4; item.stage = 'Tancada';
        Object.assign(item.metadata, { closed_at: now(), closed_by: actor(role), closed_position: 'Responsable municipal', closure_reason: data.closure_reason });
        const files = makeFiles(data.files, 'Tancament'); item.attachments.push(...files); item.photos.push(...files.filter(f => f.image));
        addEvent(item, 'Tancament validat', actor(role), data.closure_reason);
      }
    } else if (kind === 'nc') {
      if (!['municipal', 'validador'].includes(role) || item.nc) throw Error('La NC ja existeix o el perfil no la pot crear.');
      item.nc = { reference: `NC-DEMO-${String(nextNc++).padStart(3, '0')}`, status: 'Oberta · demostració', reason: data.reason, cause: data.cause };
      addEvent(item, 'Derivació a NC', actor(role), data.reason);
    } else throw Error('Acció desconeguda.');
    return { id: item.id };
  }
  function request(path, options = {}) {
    const url = new URL(path, window.location.href);
    if (url.pathname === '/api/streets') {
      const q = (url.searchParams.get('q') || '').toLocaleLowerCase('ca');
      return streets.filter(s => s.label.toLocaleLowerCase('ca').includes(q));
    }
    if (url.pathname === '/api/incidents' && !options.method) {
      const role = url.searchParams.get('role');
      const found = cases.filter(i => role === 'brigada' ? i.owner_id === 4 : role === 'brigada_suport' ? i.owner_id === 6 : true);
      return { incidents: found };
    }
    if (url.pathname === '/api/incidents' && options.method === 'POST') return create(read(options), true);
    if (url.pathname === '/api/municipal-incidents' && options.method === 'POST') return create(read(options), false);
    const match = url.pathname.match(/^\/api\/incidents\/(\d+)\/(assign|preclose|return|close|nc)$/);
    if (match && options.method === 'POST') {
      const item = cases.find(i => i.id === Number(match[1]));
      if (!item) throw Error('Incidència no trobada.');
      return action(item, match[2], read(options));
    }
    throw Error('Funció no disponible en aquesta demo estàtica.');
  }
  return { request, streets: q => streets.filter(s => s.label.toLocaleLowerCase('ca').includes(q.toLocaleLowerCase('ca'))) };
})();

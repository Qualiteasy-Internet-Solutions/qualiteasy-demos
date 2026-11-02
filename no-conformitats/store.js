/* Dades fictícies i estat volàtil de la demo de qualitat. Cap dada no s'envia ni es desa.
   request(path, options) imita l'API real: quan hi hagi backend, la funció api() de app.js farà fetch
   a les mateixes rutes. A l'API real el rol NO arriba per paràmetre: surt del token Keycloak.
   Funcions equivalents al mòdul de NC de Web35 (NoConformidadesF/L/C/Seguimientos/Cierre/Imprimir/TraspasoHistorico). */
const DemoStore = (() => {
  const DAY = 864e5;
  const now = () => new Date().toISOString();
  const day = n => new Date(Date.now() + n * DAY).toISOString().slice(0, 10);
  const at = n => new Date(Date.now() + n * DAY).toISOString();

  const users = [
    { id: 1, name: 'Elena Mas', position: 'Responsable de qualitat', role: 'qualitat', dept: 'qualitat' },
    { id: 2, name: 'Jordi Soler', position: 'Responsable de prestació del servei', role: 'proces', dept: 'servei' },
    { id: 3, name: 'Laia Ferrer', position: 'Responsable de compres', role: 'compres', dept: 'compres' },
    { id: 4, name: 'Pau Roca', position: 'Tècnic de manteniment', role: 'accio', dept: 'manteniment' },
    { id: 5, name: 'Núria Vidal', position: 'Directora general', role: 'direccio', dept: 'direccio', no_nc_mail: true }, // NORecibirCorreoNC
    { id: 6, name: 'Auditor extern', position: 'Entitat de certificació · accés temporal', role: 'auditor', dept: null }
  ];
  const roleUser = Object.fromEntries(users.map(u => [u.role, u.id]));
  const userName = id => users.find(u => u.id === Number(id))?.name || '—';

  // Catàlegs configurables per client (a Web35: departaments, origenes, productos, clientes, proveedores, FasesProceso...).
  const catalogs = {
    departments: { qualitat: 'Qualitat', compres: 'Compres', servei: 'Prestació del servei', manteniment: 'Manteniment', administracio: 'Administració', direccio: 'Direcció' },
    deptManagers: { qualitat: 1, compres: 3, servei: 2, manteniment: 2, administracio: 1, direccio: 5 }, // gestor de cada departament
    processes: [
      { id: 'compres', name: 'Compres i proveïdors', owner_id: 3 }, { id: 'servei', name: 'Prestació del servei', owner_id: 2 },
      { id: 'persones', name: 'Persones i formació', owner_id: 1 }, { id: 'infra', name: 'Manteniment i infraestructura', owner_id: 2 },
      { id: 'seginfo', name: 'Seguretat de la informació', owner_id: 1 }
    ],
    origins: { auditoria_interna: 'Auditoria interna', auditoria_externa: 'Auditoria externa i inspeccions', reclamacio: 'Reclamació de client', proveidor: 'Proveïdor', incidencia: 'Incidència', intern: 'Detecció interna', altres: 'Altres' },
    // Origen amb suborígens (arbre d'origenes a Web35) i responsables per origen (origenes.ResponsableNC).
    suborigins: { auditoria_interna: { ai_9001: 'ISO 9001', ai_ens: 'ENS', ai_14001: 'ISO 14001' }, auditoria_externa: { ae_cert: 'Certificació', ae_insp: 'Inspecció de l’Administració', ae_client: 'Auditoria de client' },
      reclamacio: { rc_formal: 'Reclamació formal', rc_enquesta: 'Enquesta de satisfacció' }, proveidor: { pr_recepcio: 'Recepció', pr_servei: 'Servei subcontractat' },
      incidencia: { in_operativa: 'Incidència operativa', in_seguretat: 'Incident de seguretat' }, intern: { di_control: 'Control intern', di_personal: 'Comunicació del personal' } },
    // Referència (ReferenciasAcciones) i subreferència (sc_ReferenciasAcciones): opcionals. Sense files filles, el camp no surt.
    references: { ref_sg: 'Sistema de gestió', ref_clients: 'Clients', ref_compres: 'Compres', ref_legal: 'Compliment legal' },
    subreferences: { ref_sg: { sg_docs: 'Documentació', sg_personal: 'Personal i formació' }, ref_clients: { cl_entregues: 'Entregues', cl_qualitat: 'Qualitat del servei' }, ref_compres: { cp_recepcio: 'Recepció de material', cp_avaluacio: 'Avaluació de proveïdors' } },
    // Baixes amb data, «catàleg:clau». Web35 només té el camp borrado, sense data.
    retired: { 'suborigins:ai_14001': day(-60) },
    originManagers: { auditoria_interna: [1], auditoria_externa: [1], reclamacio: [2], proveidor: [3], incidencia: [1], intern: [2] },
    // On es detecta: catàleg de selecció múltiple (DeteccionIncidencias a Web35).
    locations: { moll: 'Moll de recepció', magatzem: 'Magatzem', taller: 'Taller', control: 'Control final', obra: 'Obra / instal·lacions del client', oficines: 'Oficines', sistemes: 'Sistemes d’informació' },
    scopes: { taller: 'Taller', magatzem: 'Magatzem', oficines: 'Oficines', obra: 'Obra / instal·lacions del client', sistemes: 'Sistemes d’informació' },
    clients: { c1: 'Client Demo A, SA', c2: 'Client Demo B, SL', c3: 'Ajuntament de mostra' },
    suppliers: { p1: 'Proveïdor de mostra, SL', p2: 'Transports Demo, SA', p3: 'Subministres Exemple, SL' },
    supplierEmails: { p1: 'qualitat@proveidor-mostra.example', p2: 'operacions@transports-demo.example' },
    products: { s1: 'Servei de manteniment', s2: 'Peça mecanitzada X-20', s3: 'Servei de transport' },
    phases: { recepcio: 'Recepció', produccio: 'Producció / prestació', control: 'Control final', lliurament: 'Lliurament', postvenda: 'Postvenda' },
    causes: { metode: 'Mètode', persones: 'Mà d’obra / persones', material: 'Material', equip: 'Màquina / equip', mesura: 'Mesura', entorn: 'Entorn' },
    keywords: { formacio: 'Formació', procediment: 'Canvi de procediment', proveidor: 'Acció amb proveïdor', equip: 'Millora d’equip', control: 'Nou control', altres: 'Altres' },
    actionTypes: { correccio: 'Correcció (acció immediata)', correctiva: 'Acció correctiva', preventiva: 'Acció preventiva' },
    linkTypes: { acap: 'Acció correctiva/preventiva', millora: 'Acció de millora', incidencia: 'Incidència', auditoria: 'Auditoria' },
    // Grups de destinataris de les notificacions (els de Web35).
    notifyGroups: { autor: 'Autor de la NC', responsable: 'Responsable de la NC', accions: 'Responsables de les accions', verificador: 'Responsable de verificació',
      tancament: 'Responsable de tancament', origen: 'Responsables de l’origen', dept_origen: 'Gestor del departament d’origen', dept_desti: 'Gestor del departament destí', qualitat: 'Administradors (qualitat)' },
    frameworks: { iso9001: 'ISO 9001:2015', ens: 'ENS · RD 311/2022', legal: 'Requisits legals' },
    // Identificadors i títols breus propis; el text íntegre de les normes ISO no es reprodueix.
    requirements: [
      { id: 'iso9001-7.1.5', framework: 'iso9001', code: '7.1.5', name: 'Recursos de seguiment i mesura' },
      { id: 'iso9001-7.2', framework: 'iso9001', code: '7.2', name: 'Competència' },
      { id: 'iso9001-7.5.3', framework: 'iso9001', code: '7.5.3', name: 'Control de la informació documentada' },
      { id: 'iso9001-8.2', framework: 'iso9001', code: '8.2', name: 'Requisits per als productes i serveis' },
      { id: 'iso9001-8.4', framework: 'iso9001', code: '8.4', name: 'Control dels processos i proveïdors externs' },
      { id: 'iso9001-8.5.1', framework: 'iso9001', code: '8.5.1', name: 'Control de la prestació del servei' },
      { id: 'iso9001-9.1.2', framework: 'iso9001', code: '9.1.2', name: 'Satisfacció del client' },
      { id: 'ens-op.acc.4', framework: 'ens', code: 'op.acc.4', name: 'Gestió de drets d’accés' },
      { id: 'ens-op.exp.7', framework: 'ens', code: 'op.exp.7', name: 'Gestió d’incidents' },
      { id: 'ens-mp.per.3', framework: 'ens', code: 'mp.per.3', name: 'Conscienciació' },
      // Registre de requisits legals aplicables: és l'ús real de la taula Norma_iso de Web35.
      { id: 'legal-rgpd-32', framework: 'legal', code: 'RGPD art. 32', name: 'Seguretat del tractament de dades personals' },
      { id: 'legal-prl', framework: 'legal', code: 'Llei 31/1995', name: 'Prevenció de riscos laborals' }
    ],
    states: { registrada: 'Pendent d’activar', analisi: 'Activa · en anàlisi', accions: 'Activa · accions en curs', verificacio: 'Pendent de verificació', tancada: 'Tancada', desestimada: 'Desestimada' }
  };
  // Configuració del mòdul per client (paràmetres reals de Web35).
  let settings = { auto_activate: false, dept_target_required: false, suborigin_required: false, extended_validation: false, costs: true, reminder_days: 3, number_format: 'NC-{ANY}-{NUM}', number_digits: 3 };
  const settingNames = { auto_activate: 'Activar automàticament les NC en donar-les d’alta (ActivarAutomaticamenteNCCPAMINC)',
    dept_target_required: 'Departament destí obligatori (DepartamentoDestinoObligatorio)', suborigin_required: 'Suborigen obligatori (OrigenesSuborigenesObligatorios)',
    extended_validation: 'Validació ampliada: causa obligatòria a l’alta (ValidacionExtendidaNCCPAM)', costs: 'Costos de la no qualitat a la fitxa i al tancament' };
  let linkables = [
    { type: 'auditoria', ref: 'AUD-2026-01', title: 'Auditoria interna ISO 9001 · 2026' }, { type: 'auditoria', ref: 'AUD-2026-02', title: 'Auditoria externa de seguiment' },
    { type: 'incidencia', ref: 'INC-0142', title: 'Accés no autoritzat a carpeta compartida' }, { type: 'incidencia', ref: 'INC-0157', title: 'Entrega fora de termini' },
    { type: 'millora', ref: 'AM-2026-004', title: 'Digitalitzar la inspecció de recepció' }, { type: 'millora', ref: 'AM-2026-006', title: 'Pla d’acollida per a personal nou' },
    { type: 'acap', ref: 'ACAP-2026-003', title: 'Revisió del procediment de compres' }
  ];
  const prefix = { acap: 'ACAP', millora: 'AM', incidencia: 'INC', auditoria: 'AUD' };
  // Camps de la fitxa editables mentre la NC és oberta.
  const editable = ['title', 'description', 'origin', 'suborigin', 'reference', 'subreference', 'origin_ref', 'process', 'scope', 'dept_origin', 'dept_target', 'client', 'supplier', 'product', 'phase',
    'locations', 'detected_at', 'due_date', 'root_cause', 'cause_id', 'requirements', 'owner_id', 'verifier_id', 'closer_id', 'cost'];
  const numeric = ['owner_id', 'verifier_id', 'closer_id'];
  // Camps que apunten a un catàleg amb baixes. Les NC que ja tenen el valor el conserven.
  const fieldCatalog = { origin: 'origins', suborigin: 'suborigins', reference: 'references', subreference: 'subreferences', dept_target: 'departments', dept_origin: 'departments', phase: 'phases', cause_id: 'causes' };

  const ev = (kind, actor, detail, when) => ({ kind, actor, detail, created_at: when });
  const note = (recipient, message, subject) => ({ channel: 'correu', recipient, subject: subject || '', status: 'Previsualització · no enviat', message });
  const base = () => ({ scope: '', dept_origin: '', dept_target: '', client: '', supplier: '', product: '', phase: '', locations: [], suborigin: '', reference: '', subreference: '', due_date: '', origin_ref: '', deleted: false,
    root_cause: '', cause_id: null, owner_id: null, verifier_id: 1, closer_id: 1, historic: false, cycle: 1, verify_days: 60, requirements: [], actions: [],
    cost: { hours_planned: '', hours_real: '', team: '', items: [{ supplier: '', amount: '' }, { supplier: '', amount: '' }, { supplier: '', amount: '' }], notes: '' },
    followups: [], documents: [], links: [], notifications: [], events: [] });
  const action = (id, order, type, text, owner_id, due, done, extra = {}) => ({ id, order, type, text, owner_id, owner2_id: null, due, status: done ? 'feta' : 'pendent', done_at: done ? at(done) : null, cycle: 1, followups: [], ...extra });

  let ncs = [
    { ...base(), id: 1, number: 'NC-2026-014', title: 'Lot de material rebut fora d’especificació', state: 'accions', author_id: 2, owner_id: 3,
      description: 'Inspecció de recepció: 3 de 20 unitats del lot presenten dimensions fora de toleràncies.', origin: 'proveidor', origin_ref: 'Albarà 4471', process: 'compres',
      scope: 'magatzem', dept_origin: 'servei', dept_target: 'compres', supplier: 'p1', product: 's2', phase: 'recepcio', locations: ['moll', 'magatzem'], suborigin: 'pr_recepcio', reference: 'ref_compres', subreference: 'cp_recepcio',
      detected_at: day(-21), due_date: day(20), root_cause: 'El proveïdor va canviar d’utillatge sense comunicar-ho i la recepció no preveu mostreig dimensional.',
      cause_id: 'material', requirements: ['iso9001-8.4', 'iso9001-8.5.1'], verifier_id: 1, closer_id: 3,
      cost: { hours_planned: '6', hours_real: '4', team: 'Recepció', items: [{ supplier: 'Transports Demo, SA', amount: '180' }, { supplier: '', amount: '' }, { supplier: '', amount: '' }], notes: 'Hores d’inspecció i transport de retorn.' },
      actions: [
        action(1, 1, 'correccio', 'Bloquejar el lot i separar-lo a la zona de no conformes.', 2, day(-21), -21, { followups: [{ author: 'Jordi Soler', at: at(-21), text: 'Lot bloquejat i etiquetat.', files: [] }] }),
        action(2, 2, 'correctiva', 'Retornar el lot i obtenir del proveïdor l’anàlisi de causes.', 3, day(-6), -8, { followups: [{ author: 'Laia Ferrer', at: at(-8), text: 'Lot retornat. El proveïdor confirma el canvi d’utillatge i n’envia l’informe.', files: [{ name: 'informe-proveidor.pdf' }] }] }),
        action(3, 3, 'correctiva', 'Afegir mostreig dimensional a la pauta de recepció d’aquest material.', 4, day(-3), null, { owner2_id: 3 })
      ],
      followups: [{ author: 'Laia Ferrer', at: at(-12), text: 'Trucada amb el proveïdor: accepten el retorn i reposaran el lot en 10 dies.', files: [] }],
      documents: [{ name: 'fotos-lot-4471.jpg', by: 'Jordi Soler', at: at(-21) }, { name: 'informe-inspeccio-recepcio.pdf', by: 'Jordi Soler', at: at(-21) }],
      links: [{ type: 'millora', ref: 'AM-2026-004', title: 'Digitalitzar la inspecció de recepció' }],
      events: [ev('Alta', 'Jordi Soler', 'NC detectada a la recepció de material.', at(-21)), ev('Activació', 'Elena Mas', 'Activada i assignada a Laia Ferrer. Caducitat ' + day(20) + '.', at(-20)),
        ev('Anàlisi i pla d’accions', 'Laia Ferrer', '2 accions correctives planificades.', at(-15)), ev('Seguiment', 'Laia Ferrer', 'Trucada amb el proveïdor.', at(-12)),
        ev('Acció tancada', 'Laia Ferrer', 'Retornar el lot i obtenir del proveïdor l’anàlisi de causes.', at(-8))],
      notifications: [note('Pau Roca', 'Tens assignada una acció de NC-2026-014 amb data límit ' + day(-3) + '.', 'Activació de la no conformitat')]
    },
    { ...base(), id: 2, number: 'NC-2026-015', title: 'Registres de formació incomplets', state: 'registrada', author_id: 1,
      description: 'Auditoria interna: 2 de 6 tècnics mostrejats no tenen evidència de la formació inicial en el lloc de treball.',
      origin: 'auditoria_interna', suborigin: 'ai_9001', reference: 'ref_sg', subreference: 'sg_personal', origin_ref: 'Troballa 3', process: 'persones', dept_origin: 'qualitat', dept_target: 'servei', detected_at: day(-2), requirements: ['iso9001-7.2'],
      links: [{ type: 'auditoria', ref: 'AUD-2026-01', title: 'Auditoria interna ISO 9001 · 2026' }],
      events: [ev('Alta', 'Elena Mas', 'Troballa d’auditoria registrada com a NC.', at(-2))]
    },
    { ...base(), id: 3, number: 'NC-2026-016', title: 'Retard reiterat en les entregues a un client', state: 'analisi', author_id: 1, owner_id: 2,
      description: 'El client ha presentat una reclamació formal per tres entregues fora de termini aquest trimestre.',
      origin: 'reclamacio', suborigin: 'rc_formal', reference: 'ref_clients', subreference: 'cl_entregues', origin_ref: 'Reclamació R-2026-031', locations: ['obra'], process: 'servei', dept_origin: 'qualitat', dept_target: 'servei', client: 'c2', product: 's3', phase: 'lliurament',
      detected_at: day(-6), due_date: day(30), due_analysis: day(4), requirements: ['iso9001-8.2', 'iso9001-9.1.2'], closer_id: 2,
      actions: [action(1, 1, 'correccio', 'Replanificar les entregues pendents i confirmar-les amb el client.', 2, day(-5), -5)],
      followups: [{ author: 'Jordi Soler', at: at(-3), text: 'Recollides les dades de les 3 entregues: totes depenien de la mateixa ruta i transportista.', files: [{ name: 'entregues-T3.xlsx' }] }],
      documents: [{ name: 'reclamacio-R-2026-031.pdf', by: 'Elena Mas', at: at(-6) }],
      links: [{ type: 'incidencia', ref: 'INC-0157', title: 'Entrega fora de termini' }],
      events: [ev('Alta', 'Elena Mas', 'Reclamació registrada.', at(-6)), ev('Activació', 'Elena Mas', 'Activada i assignada a Jordi Soler. Caducitat ' + day(30) + '.', at(-6)),
        ev('Seguiment', 'Jordi Soler', 'Dades de les entregues recollides.', at(-3))],
      notifications: [note('Jordi Soler', 'Tens la NC-2026-016 per analitzar abans del ' + day(4) + '.', 'Activació de la no conformitat')]
    },
    { ...base(), id: 4, number: 'NC-2026-011', title: 'Accés no autoritzat a una carpeta compartida', state: 'verificacio', author_id: 1, owner_id: 1,
      description: 'Un usuari d’un altre departament tenia permís d’edició sobre la carpeta de contractes després d’un canvi de lloc.',
      origin: 'incidencia', suborigin: 'in_seguretat', reference: 'ref_legal', origin_ref: 'INC-0142', process: 'seginfo', locations: ['sistemes'], scope: 'sistemes', dept_origin: 'administracio', dept_target: 'qualitat',
      detected_at: day(-40), due_date: day(-1), root_cause: 'El procediment de canvi de lloc no inclou la revisió de permisos de carpetes compartides.',
      cause_id: 'metode', requirements: ['iso9001-7.5.3', 'ens-op.acc.4', 'ens-op.exp.7', 'legal-rgpd-32'], verify_days: 30, verify_due: day(2),
      actions: [
        action(1, 1, 'correccio', 'Retirar el permís i revisar el registre d’accessos.', 1, day(-40), -40, { followups: [{ author: 'Elena Mas', at: at(-40), text: 'Permís retirat. Sense descàrregues al registre.', files: [] }] }),
        action(2, 2, 'correctiva', 'Afegir la revisió de permisos al procediment de canvi de lloc i baixa.', 1, day(-20), -22, { followups: [{ author: 'Elena Mas', at: at(-22), text: 'Procediment PR-07 revisat (versió 4) i aprovat.', files: [{ name: 'PR-07-v4.pdf' }] }] }),
        action(3, 3, 'preventiva', 'Revisió trimestral automàtica de permisos de les carpetes sensibles.', 4, day(-12), -13, { followups: [{ author: 'Pau Roca', at: at(-13), text: 'Informe trimestral programat. Primera execució sense desviacions.', files: [] }] })
      ],
      links: [{ type: 'incidencia', ref: 'INC-0142', title: 'Accés no autoritzat a carpeta compartida' }],
      events: [ev('Alta', 'Elena Mas', 'Derivada de la incidència INC-0142 per decisió de qualitat.', at(-40)), ev('Anàlisi i pla d’accions', 'Elena Mas', '1 acció correctiva i 1 preventiva.', at(-38)),
        ev('Totes les accions tancades', 'Sistema', 'Verificació d’eficàcia prevista el ' + day(2) + '.', at(-13))],
      notifications: [note('Elena Mas', 'NC-2026-011: verificació d’eficàcia prevista el ' + day(2) + '.')]
    },
    { ...base(), id: 5, number: 'NC-2026-007', title: 'Calibratge vençut d’un equip de mesura', state: 'tancada', author_id: 4, owner_id: 2,
      description: 'Es va utilitzar un calibre amb el calibratge vençut fa 15 dies en controls finals.', origin: 'intern', suborigin: 'di_control', process: 'infra', scope: 'taller', locations: ['taller', 'control'],
      dept_origin: 'manteniment', dept_target: 'servei', phase: 'control', detected_at: day(-95), due_date: day(-30), closer_id: 2,
      root_cause: 'L’avís de calibratge depenia d’un full de càlcul que ningú no revisava.', cause_id: 'mesura', requirements: ['iso9001-7.1.5'],
      cost: { hours_planned: '8', hours_real: '11', team: 'Control de qualitat', items: [{ supplier: '', amount: '' }, { supplier: '', amount: '' }, { supplier: '', amount: '' }], notes: 'Repetició de controls finals.' },
      actions: [action(1, 1, 'correccio', 'Retirar l’equip i repetir els controls amb un equip calibrat.', 4, day(-94), -94),
        action(2, 2, 'correctiva', 'Passar el pla de calibratge a l’aplicació amb avisos automàtics.', 4, day(-70), -72, { followups: [{ author: 'Pau Roca', at: at(-72), text: 'Pla de calibratge carregat amb avís 30 dies abans.', files: [] }] })],
      verification: { effective: true, notes: 'Dos mesos sense cap equip vençut; avisos rebuts correctament.', by: 'Elena Mas', at: at(-10) },
      closing: { date: day(-10), reason: 'Accions eficaces. Equip i pla de calibratge al dia.', keyword: 'control', by: 'Jordi Soler' },
      events: [ev('Alta', 'Pau Roca', 'Detectat en un control final.', at(-95)), ev('Verificació i tancament', 'Elena Mas', 'Eficaç. NC tancada.', at(-10))]
    },
    { ...base(), id: 6, number: 'NC-2026-012', title: 'Etiquetatge incorrecte d’una comanda', state: 'desestimada', author_id: 2,
      description: 'Una comanda va sortir amb l’etiqueta d’un altre client.', origin: 'intern', process: 'servei', dept_origin: 'servei', dept_target: 'servei', detected_at: day(-30),
      dismissed_reason: 'Duplicada de la incidència INC-0157, que ja la tracta.', events: [ev('Alta', 'Jordi Soler', 'Registre.', at(-30)), ev('Desestimada', 'Elena Mas', 'Duplicada.', at(-29))]
    },
    { ...base(), id: 7, number: 'NC-2025-041', title: 'Proveïdor de transport sense assegurança vigent', state: 'tancada', author_id: 3, owner_id: 3,
      description: 'Revisió anual de proveïdors: el certificat d’assegurança havia caducat.', origin: 'proveidor', process: 'compres', dept_origin: 'compres', dept_target: 'compres',
      supplier: 'p2', detected_at: day(-300), due_date: day(-240), root_cause: 'L’alta de proveïdors no preveia el control de documents amb caducitat.', closer_id: 3,
      requirements: ['iso9001-8.4', 'legal-prl'],
      actions: [action(1, 1, 'correctiva', 'Afegir la caducitat de documents a la fitxa de proveïdor amb avís.', 3, day(-260), -262)],
      verification: { effective: true, notes: 'Revisió semestral: tots els certificats vigents.', by: 'Elena Mas', at: at(-190) },
      closing: { date: day(-190), reason: 'Control implantat i eficaç.', keyword: 'proveidor', by: 'Laia Ferrer' },
      events: [ev('Alta', 'Laia Ferrer', 'Revisió de proveïdors.', at(-300)), ev('Verificació i tancament', 'Elena Mas', 'Eficaç.', at(-190))]
    }
  ];
  let nextId = 8;
  // Web35 només té un comptador (Contadores.Num_NC). Aquí hi ha un comptador per any si el format porta {ANY}, i per això torna a 1 cada gener.
  const counters = { 2026: 16, tot: 16 };
  const counterKey = () => settings.number_format.includes('{ANY}') ? day(0).slice(0, 4) : 'tot';
  const nextSeq = () => (counters[counterKey()] || 0) + 1;
  const numberFor = seq => settings.number_format.replaceAll('{ANY}', day(0).slice(0, 4)).replaceAll('{NUM}', String(seq).padStart(settings.number_digits, '0'));
  const settingsView = () => clone({ settings, names: settingNames, next_number: nextSeq(), next_preview: numberFor(nextSeq()) });

  const fail = msg => { throw Error(msg); };
  const find = id => ncs.find(n => n.id === id) || fail('No s’ha trobat la NC.');
  const clone = v => JSON.parse(JSON.stringify(v));
  const body = options => options.body ? JSON.parse(options.body) : {};
  const files = list => (list || []).map(f => ({ name: f.name, url: f.data ? `data:${f.content_type};base64,${f.data}` : null }));
  const isQuality = uid => uid === 1;
  const retired = (kind, key) => catalogs.retired[`${kind}:${key}`] <= day(0);
  const activeChildren = (kind, parent) => Object.keys(catalogs[kind][parent] || {}).filter(k => !retired(kind, k));
  const checkActive = (d, keys) => { for (const k of keys) if (fieldCatalog[k] && d[k] && retired(fieldCatalog[k], d[k])) fail('Hi ha un valor donat de baixa al catàleg.'); };
  const defaultOwner = n => catalogs.processes.find(p => p.id === n.process)?.owner_id || catalogs.originManagers[n.origin]?.[0] || 1;
  const isOpen = n => !['tancada', 'desestimada'].includes(n.state);
  const managers = n => [catalogs.deptManagers[n.dept_origin], catalogs.deptManagers[n.dept_target]];
  const actionOwners = n => n.actions.flatMap(a => [a.owner_id, a.owner2_id]);
  // Visibilitat (CrearWhere de NoConformidadesL): qualitat, direcció i auditor ho veuen tot; la resta, les NC on intervé o dels departaments que gestiona.
  const canSee = (uid, n) => !n.deleted && ([1, 5, 6].includes(uid) || [n.author_id, n.owner_id].includes(uid) || actionOwners(n).includes(uid) || managers(n).includes(uid));
  // Equivalents a PermisoEdicionNC (admin o gestor del departament d'origen/destí) i PermisoSeguimientoNC (+ autor i responsables d'accions).
  const canEdit = (uid, n) => isOpen(n) && !n.historic && (isQuality(uid) || uid === n.owner_id || managers(n).includes(uid) || (n.state === 'registrada' && uid === n.author_id));
  const canFollow = (uid, n) => isOpen(n) && !n.historic && (canEdit(uid, n) || uid === n.author_id || actionOwners(n).includes(uid));
  const log = (n, kind, uid, detail) => n.events.push(ev(kind, userName(uid), detail, now()));
  const recipients = (n, groups) => [...new Set(groups.flatMap(g => ({ autor: [n.author_id], responsable: [n.owner_id], accions: actionOwners(n), verificador: [n.verifier_id],
    tancament: [n.closer_id], origen: catalogs.originManagers[n.origin] || [], dept_origen: [catalogs.deptManagers[n.dept_origin]], dept_desti: [catalogs.deptManagers[n.dept_target]], qualitat: [1] }[g] || [])))].filter(Boolean);
  const mailOff = id => users.find(u => u.id === id)?.no_nc_mail;
  const notifyGroups = (n, groups, subject, message) => { for (const id of recipients(n, groups)) n.notifications.push(mailOff(id) ? { ...note(userName(id), message, subject), status: 'No enviat · l’usuari no rep correus de NC' } : note(userName(id), message, subject)); };
  const newAction = (n, a) => ({ id: Math.max(0, ...n.actions.map(x => x.id)) + 1, order: Number(a.order) || n.actions.length + 1, type: a.type || 'correctiva', text: a.text,
    owner_id: Number(a.owner_id), owner2_id: Number(a.owner2_id) || null, due: a.due || day(30), status: 'pendent', done_at: null, cycle: n.cycle, followups: [] });
  function checkAllDone(n, uid) {
    if (n.state === 'accions' && n.actions.length && n.actions.every(x => x.status === 'feta')) {
      n.state = 'verificacio'; n.verify_due = day(n.verify_days || 60);
      log(n, 'Totes les accions tancades', uid, `Verificació d’eficàcia prevista el ${n.verify_due}.`);
      notifyGroups(n, ['verificador'], 'Verificació d’eficàcia', `${n.number}: totes les accions tancades. Verificació prevista el ${n.verify_due}.`);
    }
  }

  function create(d, uid) {
    if ([5, 6].includes(uid)) fail('Aquest perfil només pot consultar.');
    if (!d.title || !d.origin) fail('Falten el resum del problema o l’origen.');
    checkActive(d, Object.keys(fieldCatalog));
    if (settings.dept_target_required && !d.dept_target) fail('Has de seleccionar el departament de destí.');
    if (settings.suborigin_required && activeChildren('suborigins', d.origin).length && !d.suborigin) fail('Has de seleccionar un suborigen.');
    if (settings.extended_validation && !d.root_cause) fail('Has d’informar de la causa.');
    const n = { ...base(), id: nextId++, seq: counters[counterKey()] = nextSeq(), counter: counterKey(), title: d.title, description: d.description || '', state: 'registrada',
      origin: d.origin, origin_ref: d.origin_ref || '', reference: d.reference || '', subreference: d.subreference || '', process: d.process || '', author_id: uid, detected_at: d.detected_at || day(0),
      dept_origin: users.find(u => u.id === uid).dept || '', dept_target: d.dept_target || '', suborigin: d.suborigin || '', locations: d.locations || [], root_cause: d.root_cause || '' };
    n.number = numberFor(n.seq);
    if (d.correction) { const a = newAction(n, { type: 'correccio', text: d.correction, owner_id: uid, due: day(0) }); a.status = 'feta'; a.done_at = now(); n.actions.push(a); }
    for (const f of files(d.files)) n.documents.push({ ...f, by: userName(uid), at: now() });
    log(n, 'Alta', uid, 'NC registrada. Pendent d’activar per qualitat; la fitxa es pot completar després.');
    notifyGroups(n, ['qualitat'], 'Notificació de la no conformitat', `Nova NC ${n.number} pendent d’activar.`);
    ncs.unshift(n);
    if (settings.auto_activate) handlers.accept(n, { due_date: day(30) }, 1, true);
    return clone(n);
  }

  const handlers = {
    accept(n, d, uid, auto) { // Activar (ActivarNoConformitats)
      if (!(isQuality(uid) || auto) || n.state !== 'registrada') fail('Només qualitat pot activar una NC pendent d’activar.');
      if (!d.due_date) fail('La data de caducitat és obligatòria en activar la NC.');
      const owner = Number(d.owner_id) || defaultOwner(n);
      Object.assign(n, { state: 'analisi', owner_id: owner, due_date: d.due_date, due_analysis: d.due_analysis || day(7), requirements: d.requirements || n.requirements,
        verifier_id: Number(d.verifier_id) || n.verifier_id, closer_id: Number(d.closer_id) || owner });
      log(n, 'Activació', uid, `${auto ? 'Activada automàticament' : 'Activada'} i assignada a ${userName(owner)}. Caducitat ${n.due_date}.`);
      notifyGroups(n, ['responsable', 'autor', 'dept_desti'], 'Activació de la no conformitat', `${n.number} activada. Anàlisi abans del ${n.due_analysis}; caducitat ${n.due_date}.`);
    },
    dismiss(n, d, uid) {
      if (!isQuality(uid) || !['registrada', 'analisi'].includes(n.state)) fail('Només qualitat pot desestimar una NC abans de planificar-ne les accions.');
      if (!d.reason) fail('Cal indicar el motiu.');
      Object.assign(n, { state: 'desestimada', dismissed_reason: d.reason });
      log(n, 'Desestimada', uid, d.reason);
      notifyGroups(n, ['autor', 'responsable'], 'Desestimar no conformitat', `${n.number} desestimada: ${d.reason}`);
    },
    analysis(n, d, uid) {
      if (n.state !== 'analisi' || !canEdit(uid, n)) fail('Només el responsable, el gestor del departament o qualitat poden fer l’anàlisi.');
      const planned = (d.actions || []).filter(a => a.text);
      if (!d.root_cause) fail('Cal la causa.');
      if (!planned.length && !n.actions.some(a => a.status === 'pendent' && a.type !== 'correccio')) fail('Cal almenys una acció correctiva o preventiva.');
      if (!(d.requirements || []).length) fail('Cal vincular almenys un requisit.');
      const added = planned.map(a => { const x = newAction(n, a); n.actions.push(x); return x; });
      Object.assign(n, { state: 'accions', root_cause: d.root_cause, cause_id: d.cause_id || null, requirements: d.requirements, verify_days: Number(d.verify_days) || 60 });
      log(n, 'Anàlisi i pla d’accions', uid, `${added.length} ${added.length === 1 ? 'acció planificada' : 'accions planificades'}.`);
      for (const a of added) n.notifications.push(note(userName(a.owner_id), `Acció assignada a ${n.number} amb data límit ${a.due}.`, 'Actualització de la no conformitat'));
      checkAllDone(n, uid);
    },
    verify(n, d, uid) { // Verificació d'eficàcia + tancament (secció Tancament de la fitxa i NoConformidadesCierre)
      if (n.state !== 'verificacio' || !(isQuality(uid) || uid === n.verifier_id)) fail('Només el responsable de verificació o qualitat poden verificar, i quan totes les accions estan tancades.');
      if (!d.notes) fail('Cal descriure l’evidència de la verificació.');
      if (d.effective) {
        if (!d.reason) fail('Cal el motiu de tancament.');
        Object.assign(n, { state: 'tancada', verification: { effective: true, notes: d.notes, by: userName(uid), at: now() },
          closing: { date: d.close_date || day(0), reason: d.reason, keyword: d.keyword || null, by: userName(n.closer_id || uid) } });
        if (d.cost) n.cost = d.cost;
        log(n, 'Verificació i tancament', uid, 'Eficaç. NC tancada.');
        notifyGroups(n, ['autor', 'responsable', 'accions'], 'Tancament de la no conformitat', `${n.number} tancada: ${d.reason}`);
      } else {
        n.previous_verifications = (n.previous_verifications || []).concat({ effective: false, notes: d.notes, by: userName(uid), at: now() });
        Object.assign(n, { state: 'analisi', cycle: n.cycle + 1, due_analysis: day(7), verify_due: null });
        log(n, 'Verificació d’eficàcia', uid, 'No eficaç: es reobre l’anàlisi. ' + d.notes);
        notifyGroups(n, ['responsable'], 'Actualització de la no conformitat', `${n.number} reoberta: les accions no han estat eficaces.`);
      }
    },
    update(n, d, uid) {
      if (!canEdit(uid, n)) fail('No tens permís per editar aquesta fitxa.');
      if (d.title === '') fail('El resum del problema no pot quedar buit.');
      if (n.state !== 'registrada' && 'due_date' in d && !d.due_date) fail('Una NC activa ha de tenir data de caducitat.');
      if (settings.dept_target_required && 'dept_target' in d && !d.dept_target) fail('Has de seleccionar el departament de destí.');
      const changed = editable.filter(k => k in d && JSON.stringify(d[k]) !== JSON.stringify(n[k]));
      checkActive(d, changed);
      for (const k of changed) n[k] = numeric.includes(k) ? Number(d[k]) || null : d[k];
      log(n, 'Fitxa actualitzada', uid, changed.length ? `${changed.length} ${changed.length === 1 ? 'camp modificat' : 'camps modificats'}.` : 'Sense canvis.');
    },
    actions(n, d, uid) {
      if (!canEdit(uid, n)) fail('No tens permís per afegir accions a aquesta NC.');
      if (!d.text || !d.owner_id) fail('Cal la descripció i el responsable de l’acció.');
      if (n.state === 'registrada' && d.type !== 'correccio') fail('Abans d’activar la NC només es poden registrar correccions.');
      const a = newAction(n, d); n.actions.push(a);
      if (n.state === 'verificacio') { n.state = 'accions'; n.verify_due = null; }
      log(n, 'Acció afegida', uid, `${catalogs.actionTypes[a.type]}: ${a.text} (${userName(a.owner_id)}, ${a.due}).`);
      n.notifications.push(note(userName(a.owner_id), `Acció assignada a ${n.number} amb data límit ${a.due}.`, 'Actualització de la no conformitat'));
    },
    followups(n, d, uid) {
      if (!canFollow(uid, n)) fail('No tens permís de seguiment en aquesta NC.');
      if (d.edit !== undefined) { const f = n.followups[Number(d.edit)] || fail('Seguiment no trobat.'); if (f.author !== userName(uid)) fail('Només pots editar els teus seguiments.'); if (!d.text) fail('Cal el text.'); f.text = d.text; f.edited = now(); log(n, 'Seguiment editat', uid, d.text); return; }
      if (!d.text) fail((d.files || []).length ? 'Has adjuntat fitxers a un seguiment, però no has escrit el text.' : 'Cal escriure el seguiment.');
      n.followups.push({ author: userName(uid), at: now(), text: d.text, files: files(d.files) });
      log(n, 'Seguiment global', uid, d.text);
    },
    documents(n, d, uid) {
      if (!canFollow(uid, n)) fail('No tens permís per adjuntar documents a aquesta NC.');
      if (d.remove !== undefined) { if (!canEdit(uid, n)) fail('Només qui pot editar la fitxa pot esborrar documents.'); const [doc] = n.documents.splice(Number(d.remove), 1); log(n, 'Document esborrat', uid, doc?.name || ''); return; }
      if (!(d.files || []).length) fail('Cal triar almenys un fitxer.');
      for (const f of files(d.files)) n.documents.push({ ...f, by: userName(uid), at: now() });
      log(n, 'Document annex', uid, d.files.map(f => f.name).join(', '));
    },
    links(n, d, uid) {
      if (!canEdit(uid, n) && !(isQuality(uid) && !n.historic)) fail('No tens permís per relacionar registres amb aquesta NC.');
      if (d.create) { // "Entrar acció C/P", "Entrar acció de millora", "Entrar incidència" des de la fitxa
        if (!['acap', 'millora', 'incidencia'].includes(d.type) || !d.title) fail('Des de la NC es poden crear accions C/P, accions de millora o incidències, amb títol.');
        const l = { type: d.type, ref: `${prefix[d.type]}-2026-${String(100 + linkables.length).padStart(3, '0')}`, title: d.title };
        linkables.push(l); n.links.push(l); log(n, 'Registre creat i relacionat', uid, `${l.ref} · ${l.title}`); return;
      }
      const l = linkables.find(x => x.ref === d.ref) || fail('Registre no trobat.');
      if (d.remove) { n.links = n.links.filter(x => x.ref !== l.ref); log(n, 'Relació eliminada', uid, `${l.ref} · ${l.title}`); }
      else if (!n.links.some(x => x.ref === l.ref)) { n.links.push(l); log(n, 'Relació afegida', uid, `${l.ref} · ${l.title}`); }
    },
    notify(n, d, uid) {
      if (!canFollow(uid, n) && !isQuality(uid)) fail('No tens permís per enviar notificacions d’aquesta NC.');
      const to = recipients(n, d.groups || []), external = d.external || [];
      if ((!to.length && !external.length) || !d.message) fail('Cal triar destinataris i escriure el missatge.');
      if (external.some(e => !/^\S+@\S+\.\S+$/.test(e))) fail('Hi ha una adreça externa incorrecta.');
      for (const id of to) n.notifications.push(note(userName(id), d.message, d.subject || `Notificació de la no conformitat ${n.number}`));
      for (const e of external) n.notifications.push({ ...note(e, d.message, d.subject || `Notificació de la no conformitat ${n.number}`), status: 'Previsualització · no enviat · extern sense accés al Qualiteasy' });
      log(n, 'Notificació enviada', uid, `A ${[...to.map(userName), ...external].join(', ')}.`);
    },
    delete(n, d, uid) {
      if (!(isQuality(uid) || (n.state === 'registrada' && uid === n.author_id))) fail('Només qualitat, o l’autor abans de l’activació, poden esborrar la NC.');
      if (n.actions.some(a => a.type !== 'correccio') || n.followups.length) fail('No es pot esborrar una NC amb accions o seguiments: desestima-la.');
      // ponytail: només s'allibera l'últim número; un número del mig queda com a forat perquè no es reassigni mai un número ja comunicat.
      const released = n.seq === counters[n.counter];
      if (released) counters[n.counter]--;
      n.deleted = true; log(n, 'Esborrada', uid, `Marcada com a esborrada (es conserva a la base de dades). ${released ? 'Número alliberat.' : 'El número queda sense reutilitzar.'}`);
    },
    historic(n, d, uid) { // Pas individual; el massiu és historic() per data i estats.
      if (!isQuality(uid)) fail('Només qualitat pot passar NC a l’històric.');
      if (isOpen(n) || n.historic) fail('Només es poden passar a l’històric NC tancades o desestimades.');
      n.historic = true; log(n, 'Passada a històric', uid, 'Pas individual.');
    }
  };

  function actionOp(n, aid, op, d, uid) {
    const a = n.actions.find(x => x.id === aid) || fail('No s’ha trobat l’acció.');
    if (op === 'followup') {
      if (!isOpen(n) || a.status !== 'pendent') fail('L’acció no admet seguiments.');
      if (![a.owner_id, a.owner2_id, n.owner_id].includes(uid) && !canEdit(uid, n)) fail('Només els responsables de l’acció, el de la NC o qualitat poden fer-ne el seguiment.');
      if (!d.text) fail('Cal escriure el seguiment.');
      if (d.done && ![a.owner_id, a.owner2_id].includes(uid) && !isQuality(uid)) fail('Només els responsables de l’acció o qualitat la poden tancar.');
      a.followups.push({ author: userName(uid), at: now(), text: d.text, files: files(d.files) });
      if (d.done) { a.status = 'feta'; a.done_at = now(); log(n, 'Acció tancada', uid, a.text); } else log(n, 'Seguiment d’acció', uid, d.text);
      checkAllDone(n, uid);
    } else if (op === 'editfollowup') {
      const f = a.followups[Number(d.index)] || fail('Seguiment no trobat.');
      if (f.author !== userName(uid) || !isOpen(n)) fail('Només pots editar els teus seguiments d’una NC oberta.');
      if (!d.text) fail('Cal el text.'); f.text = d.text; f.edited = now(); log(n, 'Seguiment d’acció editat', uid, d.text);
    } else if (op === 'update') {
      if (!canEdit(uid, n) || a.status !== 'pendent') fail('Només es poden editar accions pendents, amb permís d’edició.');
      Object.assign(a, { text: d.text || a.text, type: d.type || a.type, owner_id: Number(d.owner_id) || a.owner_id, owner2_id: Number(d.owner2_id) || null, due: d.due || a.due, order: Number(d.order) || a.order });
      log(n, 'Acció modificada', uid, a.text);
    } else if (op === 'delete') {
      if (!canEdit(uid, n) || a.status !== 'pendent' || a.followups.length) fail('Només es poden eliminar accions pendents i sense seguiments.');
      n.actions = n.actions.filter(x => x !== a); log(n, 'Acció eliminada', uid, a.text); checkAllDone(n, uid);
    } else fail('Operació desconeguda.');
  }

  function historic(d, uid) { // NoConformidadesTraspasoHistorico
    if (!isQuality(uid)) fail('Només qualitat pot passar NC a l’històric.');
    if (!d.before) fail('Cal la data.');
    const states = d.states?.length ? d.states : ['tancada', 'desestimada'];
    const moved = ncs.filter(n => !n.historic && states.includes(n.state) && n.detected_at < d.before);
    for (const n of moved) { n.historic = true; log(n, 'Passada a històric', uid, `Anterior a ${d.before}.`); }
    return { moved: moved.length };
  }
  function purge(d, uid) { // NoConformidadesBorrarObsoletas
    if (!isQuality(uid)) fail('Només qualitat pot esborrar NC històriques.');
    if (!d.before) fail('Cal la data.');
    const gone = ncs.filter(n => n.historic && !n.deleted && n.detected_at < d.before);
    for (const n of gone) { n.deleted = true; log(n, 'Esborrada de l’històric', uid, `Anterior a ${d.before}.`); }
    return { deleted: gone.length };
  }
  function retire(d, uid) {
    if (!isQuality(uid)) fail('Només qualitat pot donar de baixa valors dels catàlegs.');
    if (!Object.values(fieldCatalog).concat('locations', 'keywords').includes(d.kind)) fail('Catàleg desconegut.');
    const keys = Object.entries(catalogs[d.kind]).flatMap(([k, v]) => typeof v === 'string' ? [k] : Object.keys(v));
    if (!keys.includes(d.key)) fail('Valor de catàleg desconegut.');
    if (d.date) catalogs.retired[`${d.kind}:${d.key}`] = d.date; else delete catalogs.retired[`${d.kind}:${d.key}`];
    return clone({ retired: catalogs.retired });
  }
  function saveNumbering(d) {
    const digits = Number(d.number_digits), next = Number(d.next_number), previous = nextSeq(), { number_format, number_digits } = settings;
    if (!d.number_format?.includes('{NUM}')) fail('El format ha de portar {NUM}.');
    if (!(digits >= 1 && digits <= 8)) fail('Els dígits han d’estar entre 1 i 8.');
    Object.assign(settings, { number_format: d.number_format, number_digits: digits });
    if (next && next !== previous) {
      if (next < nextSeq()) { Object.assign(settings, { number_format, number_digits }); fail('El comptador no pot baixar: es repetirien números.'); }
      counters[counterKey()] = next - 1;
    }
  }
  // Recordatoris de termini als responsables d'accions (FechaAlertaResponsable a Web35).
  function reminders() {
    const limit = day(settings.reminder_days);
    for (const n of ncs) if (!n.deleted && !['tancada', 'desestimada'].includes(n.state)) for (const a of n.actions)
      if (a.status === 'pendent' && a.due <= limit && !a.reminded) {
        a.reminded = now();
        for (const id of [a.owner_id, a.owner2_id].filter(Boolean)) n.notifications.push(note(userName(id), `${a.due < day(0) ? 'Acció vençuda' : 'L’acció venç aviat'}: «${a.text}» (${n.number}, data límit ${a.due}).`, 'Recordatori d’acció'));
      }
  }

  function request(path, options = {}) {
    const url = new URL(path, 'https://demo.local/');
    const d = body(options);
    const uid = roleUser[url.searchParams.get('role') || d.actor_role] || fail('Perfil desconegut.');
    if (url.pathname === '/api/catalogs') return clone({ users, ...catalogs, linkables });
    if (url.pathname === '/api/catalogs/retire' && options.method === 'POST') return retire(d, uid);
    if (url.pathname === '/api/settings' && !options.method) return settingsView();
    if (url.pathname === '/api/settings' && options.method === 'POST') { if (!isQuality(uid)) fail('Només qualitat pot canviar la configuració.'); for (const k of Object.keys(settingNames)) if (k in d) settings[k] = !!d[k]; if ('number_format' in d) saveNumbering(d); return settingsView(); }
    if (url.pathname === '/api/ncs/purge' && options.method === 'POST') return purge(d, uid);
    if (url.pathname === '/api/ncs' && !options.method) reminders();
    if (url.pathname === '/api/ncs' && !options.method)
      return { ncs: clone(ncs.filter(n => canSee(uid, n)).map(n => ({ ...n, can_edit: canEdit(uid, n), can_follow: canFollow(uid, n) }))), linkables: clone(linkables), today: day(0) };
    if (url.pathname === '/api/ncs' && options.method === 'POST') return create(d, uid);
    if (url.pathname === '/api/ncs/historic' && options.method === 'POST') return historic(d, uid);
    const m = url.pathname.match(/^\/api\/ncs\/(\d+)\/([a-z]+)$/);
    if (m && options.method === 'POST' && handlers[m[2]]) { const n = find(Number(m[1])); handlers[m[2]](n, d, uid); return clone(n); }
    const f = url.pathname.match(/^\/api\/ncs\/(\d+)\/actions\/(\d+)\/(followup|update|delete|editfollowup)$/);
    if (f && options.method === 'POST') { const n = find(Number(f[1])); actionOp(n, Number(f[2]), f[3], d, uid); return clone(n); }
    fail('Ruta no disponible a la demo.');
  }
  return { request };
})();
if (typeof module !== 'undefined') module.exports = DemoStore;

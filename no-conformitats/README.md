# Demo Qualiteasy · No conformitats i accions

Demostració estàtica del mòdul de no conformitats (NC) d’un sistema de gestió ISO 9001 + ENS + requisits legals. Reprodueix les funcions del mòdul de NC de Web35 (`NoConformidadesF/L/C/Listado/Seguimientos/Cierre/Imprimir/TraspasoHistorico` i estadístiques) amb el flux millorat del producte nou. És independent de la demo d’incidències d’Alella i en reutilitza l’aspecte. Organització, persones i dades fictícies; sense backend ni persistència.

## Obrir-la

```sh
python3 -m http.server 8765 --bind 127.0.0.1
# http://127.0.0.1:8765/?role=qualitat
```

Perfils: `qualitat`, `proces`, `compres`, `accio` (tècnic), `direccio`, `auditor`.

## Què hi ha

| Pantalla | Funcions | Equivalent a Web35 |
|---|---|---|
| **Llistat** | Filtres (text, número, estat, inclosos «en anàlisi» i «accions en curs», caducades, origen, referència i subreferència, departament d’origen i destí, responsable, client, proveïdor, producte, tipus de problema, dates de detecció i de límit d’acció, històric), agrupació per responsable, exportació a Excel (CSV), impressió, seguiment ràpid per fila, pas a històric. | `NoConformidadesL`, `NoConformidadesC`, `NoConformidadesListado(XLS)`, `TraspasoHistorico` |
| **Alta** | Curta: resum del problema, problema, origen, referència i subreferència (opcionals), procés (opcional), departament destí, data, lloc, correcció immediata feta i fotos. El suborigen i la subreferència només surten si tenen dades a la taula lateral. La resta es completa a la fitxa. | `NoConformidadesF` (alta) |
| **Fitxa** | Dades generals, problema i causa, requisits, correccions i accions, seguiments globals, documents annexos, relacions, verificació i tancament amb costos, traça i notificacions. Barra d’accions segons permisos: activar/desestimar, anàlisi, + acció, + seguiment, + document, relacionar o crear registre (ACAP, acció de millora, incidència, auditoria), editar fitxa, enviar notificació per grups i a externs, imprimir NC, passar a històric, esborrar, verificar i tancar. | `NoConformidadesF`, `uctAccion`, `NoConformidadesSeguimientos(NC)`, `NoConformidadesCierre`, `NoConformidadesImprimir` |
| **Accions** | Totes les correccions i accions amb termini; filtres de text, responsable, tipus, data límit, pendents, pròpies i vençudes; agrupació per responsable. | Columnes d’accions de `NoConformidadesL` |
| **Requisits** | NC per requisit i marc (ISO 9001, ENS, requisits legals). | Nou |
| **Estadístiques** | Per període: totals, obertes, tancades, desestimades, % d’eficàcia verificada, temps mitjà de tancament, accions vençudes; resums per origen, departament, client, proveïdor, autor i marc; Excel, impressió i «afegir a la revisió per la direcció». | `EstadistiquesNoConformidades`, `RDEstadistiquesNoConformidades` |

**Accions dins la NC** (com `uctAccion`): es creen sempre des de la fitxa amb «+ Acció». Tipus (correcció/acció immediata, correctiva, preventiva), ordre, responsable i segon responsable, data límit, seguiments amb documents, tancament parcial, edició i eliminació si no té seguiments.

**Canvis respecte a Web35:**
- Abans d’activar la NC només s’hi poden registrar correccions; activar-la exigeix responsable i data de caducitat (com Web35).
- No es pot tancar amb accions obertes ni sense verificar l’eficàcia (Web35 ho permet amb una casella; als clients analitzats és la pràctica habitual).
- Si la verificació no és eficaç, la NC es reobre en un cicle nou d’anàlisi.
- Causa primària i paraula clau són opcionals: cap dels clients analitzats no en té els catàlegs configurats.
- Estats actius: *en anàlisi* (hi ha responsable, falta la causa i el pla d’accions) i *accions en curs* (anàlisi feta, accions pendents). Quan totes les accions es tanquen, passa a verificació.
- Històric: només NC tancades o desestimades, amb pas massiu (per data i estats) o individual (des de la fitxa). Queden de només lectura i es consulten amb «Inclou l’històric».

Permisos per objecte inspirats en `clsPermisos.vb`: edita qualitat, el responsable de la NC o el gestor del departament d’origen o destí (l’autor, mentre no està activada); fa seguiment, a més, l’autor i els responsables de les accions; el tècnic només veu les NC on té accions; direcció i auditor extern només consulten.

**Perfils i menú:** cada perfil veu les seves pestanyes i entra a la que li toca: qualitat (totes, més Configuració), responsable de procés i compres (NC, accions, requisits/estadístiques), tècnic («Les meves accions»), direcció (estadístiques) i auditor extern (requisits). Visibilitat com `CrearWhere` de Web35: qualitat, direcció i auditor ho veuen tot; la resta, les NC on intervenen o dels departaments que gestionen.

**Configuració per client** (pantalla *Configuració*, paràmetres reals de Web35): `ActivarAutomaticamenteNCCPAMINC`, `DepartamentoDestinoObligatorio`, `OrigenesSuborigenesObligatorios`, `ValidacionExtendidaNCCPAM`; recordatoris d’acció (`FechaAlertaResponsable`); usuaris que no reben correus de NC (`NORecibirCorreoNC`); costos de la no qualitat activables (paràmetre nou); numeració amb format, dígits i proper número; taules laterals en ús amb la data de baixa de cada valor (orígens i suborígens, referències i subreferències, departaments, llocs de detecció…).

Numeració: `{ANY}` i `{NUM}` al format. Amb `{ANY}`, el comptador torna a 1 cada gener. Esborrar l’última NC n’allibera el número; esborrar-ne una d’anterior deixa el forat, perquè no es reassigni un número ja comunicat. Web35 només té un comptador global editable (`Contadores.Num_NC`).

### Revisat a Web35 i encara no inclòs a la demo

| Funció de Web35 | Ús als clients analitzats | Proposta |
|---|---|---|
| Mòduls separats d’accions correctives/preventives (`AccionesCorrPrev*`) i de millora (`AccionesMejora*`) | Actius (Díaz Álvarez 84 i 75, Mecman 78 i 95) | Demo pròpia; aquí només es relacionen o es creen des de la NC. |
| Permís d’activar NC per usuari (`PuedeActivarNC`) i desactivar una NC activa | — | A la demo només activa qualitat. |
| Xarxa de centres (`QEXarxa`) | Clients multicentre | Multicentre al model de clients (auditoria, §2). |
| Opcions de llistat (`GestorPuedeVisualizarDepartamentoDestino`, `MostrarReferenciaEnGridGestion`, `OcultarDepartamentoEnGridAcciones`) i tria manual o automàtica de destinataris (`SeleccionarDestinatariosCorreosNCCPAMINC`) | Per instal·lació | Paràmetres de configuració. |
| Editor de text enriquit per a problema, causa i seguiments; informes Crystal | — | Text amb format i impressió web. |

## Contracte d’API

`app.js` fa totes les crides amb `api(path, options)`; avui responen des de `store.js`. Canviant aquesta funció per `fetch` es connecta a un backend real. A l’API real el perfil **no** arriba per paràmetre (`?role=`, `actor_role`): surt del token Keycloak.

| Crida | Ús |
|---|---|
| `GET /api/catalogs` | Usuaris, departaments, processos, orígens, referències, baixes, clients, proveïdors, productes, tipus de problema, causes, paraules clau, tipus d’acció, grups de notificació, marcs i requisits. |
| `GET /api/ncs` | NC visibles, amb `can_edit` i `can_follow` per a l’usuari. |
| `POST /api/ncs` | Alta. |
| `POST /api/ncs/historic` · `purge` | Pas massiu a històric per data i estats; esborrat de les històriques anteriors a una data. |
| `POST /api/ncs/{id}/historic` | Pas individual a històric. |
| `GET/POST /api/settings` | Configuració del mòdul per client, inclosa la numeració. |
| `POST /api/catalogs/retire` | Data de baixa d’un valor de catàleg (buida per reactivar-lo). |
| `POST /api/ncs/{id}/accept` · `dismiss` | Activar (responsable, caducitat, verificador, tancament, requisits) o desestimar. |
| `POST /api/ncs/{id}/update` | Editar la fitxa, inclosos responsables i costos. |
| `POST /api/ncs/{id}/analysis` | Causa, causa primària, requisits i accions noves. |
| `POST /api/ncs/{id}/actions` | Afegir correcció o acció en qualsevol moment. |
| `POST /api/ncs/{id}/actions/{aid}/followup` · `update` · `delete` | Seguiment i tancament de l’acció, edició, eliminació. |
| `POST /api/ncs/{id}/followups` | Seguiment global amb documents. |
| `POST /api/ncs/{id}/documents` | Afegir o esborrar documents annexos. |
| `POST /api/ncs/{id}/links` | Relacionar, crear o eliminar registres relacionats. |
| `POST /api/ncs/{id}/notify` | Notificació per grups de destinataris i a adreces externes. |
| `POST /api/ncs/{id}/verify` | Verificació d’eficàcia i tancament (motiu, paraula clau, data, costos) o reobertura. |
| `POST /api/ncs/{id}/delete` | Esborrar una alta errònia. |

## Comprovació

```sh
node check.js
```

Recorre el cicle complet, les operacions de la fitxa, la reobertura per no eficàcia, l’històric, l’esborrat, la numeració, les baixes de catàleg i les denegacions de permisos.

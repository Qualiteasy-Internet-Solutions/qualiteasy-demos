const intakeForm = document.getElementById('incident');
const intakeWhat = document.getElementById('what');
const intakeWhere = document.getElementById('where');
const intakePhoto = document.getElementById('photo');
const intakeMessage = document.getElementById('message');
const intakeSuggestions = document.getElementById('suggestions');
const intakeNote = document.getElementById('location-note');
let intakePoint = null;
let intakeSearchTimer = null;
function intakeStatus(value, error = false) {
  intakeMessage.textContent = value;
  intakeMessage.className = error ? 'error' : 'success';
}
intakeWhere.addEventListener('input', () => {
  intakePoint = null;
  intakeNote.textContent = 'Ubicació escrita manualment.';
  clearTimeout(intakeSearchTimer);
  const query = intakeWhere.value.trim();
  if (query.length < 3) { intakeSuggestions.hidden = true; return; }
  intakeSearchTimer = setTimeout(() => {
    const matches = DemoStore.streets(query);
    intakeSuggestions.replaceChildren();
    for (const place of matches) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = place.label;
      button.addEventListener('click', () => {
        intakeWhere.value = place.label;
        intakePoint = { lat: place.lat, lon: place.lon };
        intakeSuggestions.hidden = true;
        intakeNote.textContent = 'Punt aproximat seleccionat. Revisa l’adreça abans d’enviar.';
      });
      intakeSuggestions.append(button);
    }
    intakeSuggestions.hidden = !matches.length;
  }, 180);
});
document.getElementById('gps').addEventListener('click', () => {
  if (!navigator.geolocation) { intakeStatus('Aquest navegador no ofereix GPS.', true); return; }
  intakeNote.textContent = 'Buscant la posició…';
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude: lat, longitude: lon, accuracy } = position.coords;
    intakePoint = { lat, lon };
    if (!intakeWhere.value.trim()) intakeWhere.value = `Posició GPS ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    intakeNote.textContent = `Posició aproximada (±${Math.round(accuracy)} m). Escriu o comprova el carrer.`;
  }, () => { intakeNote.textContent = 'No s’ha pogut obtenir la posició. Escriu el carrer manualment.'; },
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
});
intakePhoto.addEventListener('change', () => {
  const preview = document.getElementById('preview');
  preview.replaceChildren();
  const file = intakePhoto.files[0];
  if (!file) return;
  const image = document.createElement('img');
  image.src = URL.createObjectURL(file);
  image.alt = 'Previsualització de la fotografia';
  image.addEventListener('load', () => URL.revokeObjectURL(image.src), { once: true });
  preview.append(image);
});
intakeForm.addEventListener('submit', async event => {
  event.preventDefault();
  const file = intakePhoto.files[0];
  if (!file) { intakeStatus('Afegeix una fotografia.', true); return; }
  if (file.size > 8 * 1024 * 1024) { intakeStatus('La fotografia supera els 8 MB.', true); return; }
  const send = document.getElementById('send');
  send.disabled = true;
  intakeStatus('Afegint l’avís a la demo…');
  try {
    const encoded = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const result = await DemoStore.request('/api/incidents', { method: 'POST', body: JSON.stringify({
      what: intakeWhat.value.trim(), where: intakeWhere.value.trim(),
      photo: { name: file.name, content_type: file.type, data: encoded }, gps: intakePoint
    }) });
    intakeForm.reset();
    intakePoint = null;
    document.getElementById('preview').replaceChildren();
    intakeStatus(`${result.number} afegida a la demo. Ara l’Ajuntament la revisa.`);
    window.demoShowDashboard('municipal', result.id);
  } catch (error) { intakeStatus(error.message, true); }
  finally { send.disabled = false; }
});

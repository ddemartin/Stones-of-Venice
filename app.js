// URL del deployment Apps Script JSON
const JSON_URL = 'https://script.google.com/macros/s/AKfycbyt2cEYGcsimAsPRB-tG2fCy-qDCkMvqV5QZmI1pV5r0VLE2L4a571PaYwa7S-o4SnY/exec';

// Base URL per le immagini
const BASE_PHOTO_URL = 'https://res.cloudinary.com/dzkq1canb/image/upload/';

let allData = [];
let currentTerm = '';
let currentMode = '';
let selectedS = '';
let selectedP = '';
let selectedA = '';
let currentList = [];
let currentIndex = -1;

// Definisce il nome file delle immagini in base a Codice e Data del foglio
function getImageFilename(o) {
  const datePart = (o['Data miglior foto'] || '').slice(0, 10);
  return `${o.Codice}-${datePart}.jpg`;
}

// Evidenziazione dei termini trovati
function highlight(text, term) {
  if (!term) return text;
  const escaped = term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Formatta data ISO in GG mese AAAA (italiano)
function formatDateISO(isoStr) {
  if (!isoStr) return '';
  const [year, month, day] = isoStr.split('T')[0].split('-'); // estrae solo la parte "2024-04-11"
  const months = [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
  ];
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
}

// Renderizza link "Torna indietro" nel menu
function renderBackLink() {
  const backContainer = document.getElementById('sidebar-back');
  backContainer.innerHTML = '';
  if (!selectedS && !selectedP && !selectedA) return;
  const link = document.createElement('a');
  link.href = '#';
  link.textContent = '← Torna indietro';
  link.style.display = 'block';
  link.style.marginBottom = '0.5em';
  link.onclick = e => { e.preventDefault(); goBack(); };
  backContainer.appendChild(link);
}

// Gestisce il ritorno al livello precedente
function goBack() {
  if (selectedA) {
    selectedA = '';
    selectParrocchia(selectedP);
  } else if (selectedP) {
    selectedP = '';
    selectSestiere(selectedS);
  } else if (selectedS) {
    selectedS = '';
    showModeMenu();
  }
}

// Inizializza l'app al caricamento del DOM
window.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.style.display = 'none';
    backBtn.onclick = () => showModeMenu();
  }
  fetchData();
});

// Fetch dei dati e avvio del menu iniziale
async function fetchData() {
  try {
    const res = await fetch(JSON_URL);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    allData = await res.json();
    showModeMenu();
  } catch (err) {
    console.error('Errore caricamento JSON:', err);
    document.getElementById('sidebar').innerHTML = '<p style="color:red">Impossibile caricare i dati.</p>';
  }
}

// Pulisce il menu finale
function clearSidebar() {
  document.getElementById('sidebar').innerHTML =
    '<div class="sidebar-header">Menu di navigazione</div><div id="sidebar-back"></div>';
}

// Pulisce l'area dei contenuti
function clearContent() {
  document.getElementById('content').innerHTML = '';
}

// Mostra il menu iniziale: scelta tra Sestiere e Tipo
function showModeMenu() {
  currentMode = '';
  selectedS = selectedP = selectedA = '';
  clearSidebar();
  clearContent();
  renderBackLink();
  buildMenuList(['Sestiere', 'Tipo'], selectMode);
}

// Seleziona la modalità di navigazione
function selectMode(mode) {
  currentMode = mode;
  clearSidebar();
  clearContent();
  renderBackLink();
  if (mode === 'Sestiere') buildSestiereFlow();
  else buildTipoFlow();
}

// Costruisce un menu di voci nel sidebar
function buildMenuList(items, handler) {
  const sidebar = document.getElementById('sidebar');
  const ul = document.createElement('ul');
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = highlight(item, currentTerm);
    li.onclick = () => handler(item);
    ul.appendChild(li);
  });
  sidebar.appendChild(ul);
  renderBackLink();
}

// Flusso Sestiere → Parrocchia → Indirizzo
function buildSestiereFlow() {
  renderCards(allData);
  clearSidebar();
  const sestieri = [...new Set(allData.map(o => o.Sestiere))].sort();
  buildMenuList(sestieri, selectSestiere);
}

function selectSestiere(s) {
  selectedS = s;
  selectedP = selectedA = '';
  clearSidebar();
  const sb = document.getElementById('sidebar');
  const title = document.createElement('div');
  title.className = 'sidebar-selected';
  title.innerHTML = `<strong>${selectedS}</strong><div>Ora scegli tra le parrocchie</div>`;
  sb.appendChild(title);
  renderBackLink();
  const filtered = allData.filter(o => o.Sestiere === s);
  renderCards(filtered);
  buildMenuList([...new Set(filtered.map(o => o.Parrocchia))].sort(), selectParrocchia);
}

function selectParrocchia(p) {
  selectedP = p;
  selectedA = '';
  clearSidebar();
  const sb = document.getElementById('sidebar');
  const selS = document.createElement('div'); selS.className = 'sidebar-selected'; selS.textContent = selectedS;
  const title = document.createElement('div'); title.className = 'sidebar-selected';
  title.innerHTML = `<strong>${selectedP}</strong><div>Ora scegli tra gli indirizzi</div>`;
  sb.appendChild(selS);
  sb.appendChild(title);
  renderBackLink();
  const filtered = allData.filter(o => o.Parrocchia === p);
  renderCards(filtered);
  buildMenuList([...new Set(filtered.map(o => o.Indirizzo))].sort(), selectIndirizzo);
}

function selectIndirizzo(a) {
  selectedA = a;
  clearSidebar();
  const sb = document.getElementById('sidebar');
  const selS = document.createElement('div'); selS.className = 'sidebar-selected'; selS.textContent = selectedS;
  const selP = document.createElement('div'); selP.className = 'sidebar-selected'; selP.textContent = selectedP;
  const title = document.createElement('div'); title.className = 'sidebar-selected'; title.textContent = selectedA;
  sb.appendChild(selS);
  sb.appendChild(selP);
  sb.appendChild(title);
  renderBackLink();
  const filtered = allData.filter(o => o.Indirizzo === a);
  renderCards(filtered);
}

// Flusso Tipo di opera
function buildTipoFlow() {
  renderCards(allData);
  clearSidebar();
  const tipi = [...new Set(allData.map(o => o.Tipo))].sort();
  buildMenuList(tipi, selectTipo);
}

function selectTipo(t) {
  clearSidebar();
  const sb = document.getElementById('sidebar');
  const title = document.createElement('div'); title.className = 'sidebar-selected';
  title.innerHTML = `<strong>${t}</strong><div>Ora scegli le opere</div>`;
  sb.appendChild(title);
  renderBackLink();
  renderCards(allData.filter(o => o.Tipo === t));
}

// Rende le card di elenco con thumbnail
function renderCards(data) {
  currentList = data;
  clearContent();
  const content = document.getElementById('content');

  data.forEach(o => {
    const card = document.createElement('div');
    card.className = 'card';

   card.innerHTML = `
      <div class="title">${highlight(`${o.Codice} – ${o.Sestiere}`, currentTerm)}</div>
      <div class="subtitle">${highlight(`${o.Indirizzo}, ${o.Civico}`, currentTerm)}</div>
      <div class="type">${highlight(o.Tipo, currentTerm)}</div>
    `;

    card.onclick = () => renderDetail(o);
    content.appendChild(card);
  });
}

// Rende la vista dettaglio senza cancellare il menu
function renderDetail(o) {
  const backBtn = document.getElementById('back-btn'); if (backBtn) backBtn.style.display = 'block';
  clearContent(); const content = document.getElementById('content');
  currentIndex = currentList.findIndex(item => item.Codice === o.Codice);
  updateNavButtons();
  const title    = highlight(`${o.Codice} – ${o.Sestiere}`, currentTerm);
  const subtitle = highlight(`${o.Indirizzo}, ${o.Civico}`, currentTerm);
  const type     = highlight(o.Tipo, currentTerm);
  const colloc   = highlight(o.Collocazione, currentTerm);
  const descr    = highlight(o.Descrizione, currentTerm);
  const iscr     = highlight(o.Iscrizione || 'Nessuna.', currentTerm);
  const cond     = highlight(o.Conservazione, currentTerm);
  const bibl     = highlight(o.Bibliografia, currentTerm);
  const isoDate  = o['Data miglior foto'] || '';
  const dataFoto = highlight(isoDate ? formatDateISO(isoDate) : '', currentTerm);
  const notes    = highlight(o.Note, currentTerm);
  const filename = getImageFilename(o);
  const photoUrl = BASE_PHOTO_URL + (filename);
  const lat      = parseFloat(o.Latitudine);
  const lng      = parseFloat(o.Longitudine);
  content.innerHTML = `
    <div class="detail-card">
      <div class="title">${title}</div>
      <div class="subtitle">${subtitle}</div>
      <div class="type">${type}</div>
      <div class="collocazione">${colloc}</div>
      <div class="coords"><strong>Coordinate WGS84:</strong> ${o['Coordinate WGS84'] || ''}</div>
      <div class="datazione"><strong>Datazione:</strong> ${o.Datazione || ''}</div>
      <div class="materiale"><strong>Materiale:</strong> ${o.Materiale || ''}</div>
      <div class="dimensioni"><strong>Dimensioni cm:</strong> ${o['Dimensioni cm'] || ''}</div>
      <img
         src="${photoUrl}"
         class="detail-photo"
         onerror="handleImageError(this)"
         alt="Foto ${o.Codice}"
      />
      <div class="descrizione"><strong>Descrizione:</strong> ${descr}</div>
      <div class="iscrizione"><strong>Iscrizione:</strong> ${iscr}</div>
      <div class="condizioni"><strong>Condizioni:</strong> ${cond}</div>
      <div class="bibliografia"><strong>Bibliografia:</strong> ${bibl}</div>
      <div class="datafoto"><strong>Data foto:</strong> ${dataFoto}</div>
      <div class="note"><strong>Note:</strong> ${notes}</div>
      <div id="map"></div>
    </div>
  `;
  const map = L.map('map').setView([lat, lng], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'&copy; OpenStreetMap' }).addTo(map);
  L.marker([lat, lng]).addTo(map);
}

function handleImageError(imgElement) {
  imgElement.onerror = null; // evita loop infiniti
  imgElement.src = 'https://via.placeholder.com/600x400?text=Immagine+non+disponibile';
  const errorText = document.createElement('div');
  errorText.style.color = 'red';
  errorText.style.marginTop = '10px';
  errorText.style.fontSize = '1.2em';
  errorText.style.textAlign = 'center';
  errorText.textContent = 'Immagine non disponibile.';
  imgElement.parentNode.appendChild(errorText);
}
// Aggiorna lo stato dei pulsanti di navigazione
function updateNavButtons() {
  const prev = document.getElementById('prev-btn');
  const next = document.getElementById('next-btn');
  prev.disabled = currentIndex <= 0;
  next.disabled = currentIndex >= currentList.length - 1;
}

document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentIndex > 0) renderDetail(currentList[currentIndex - 1]);
});
document.getElementById('next-btn').addEventListener('click', () => {
  if (currentIndex < currentList.length - 1) renderDetail(currentList[currentIndex + 1]);
});

// URL del deployment Apps Script JSON
const JSON_URL = 'https://script.google.com/macros/s/AKfycbyt2cEYGcsimAsPRB-tG2fCy-qDCkMvqV5QZmI1pV5r0VLE2L4a571PaYwa7S-o4SnY/exec';

let allData = [];
let currentTerm = '';
let currentMode = '';

// Evidenziazione dei termini trovati
function highlight(text, term) {
  if (!term) return text;
  const escaped = term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Inizializzazione: attendi caricamento DOM, poi setup
window.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.style.display = 'none';
    backBtn.addEventListener('click', () => {
      backBtn.style.display = 'none';
      showModeMenu();
    });
  }
  fetchData();
});

// Fetch JSON e mostra menu iniziale
async function fetchData() {
  try {
    const res = await fetch(JSON_URL);
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    allData = await res.json();
    showModeMenu();
  } catch (err) {
    console.error('Errore caricamento JSON:', err);
    const sb = document.getElementById('sidebar');
    if (sb) sb.innerHTML = '<p style="color:red">Impossibile caricare i dati.</p>';
  }
}

// Menu iniziale: scegli modalità
function showModeMenu() {
  document.getElementById('back-btn').style.display = 'none';
  currentMode = '';
  clearSidebar();
  clearContent();
  buildMenuList('sidebar', ['Sestiere', 'Tipo'], mode => selectMode(mode.toLowerCase()));
}

// Seleziona modalità e avvia flusso
function selectMode(mode) {
  currentMode = mode;
  document.getElementById('back-btn').style.display = 'none';
  clearSidebar();
  clearContent();
  if (mode === 'sestiere') buildSestiereFlow();
  else if (mode === 'tipo') buildTipoFlow();
}

// Costruisce menu generico
function buildMenuList(containerId, items, handler) {
  const ctr = document.getElementById(containerId);
  if (!ctr) return;
  ctr.innerHTML = '';
  const ul = document.createElement('ul');
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = highlight(item, currentTerm);
    li.onclick = () => handler(item);
    ul.appendChild(li);
  });
  ctr.appendChild(ul);
}

// Flusso Sestiere → Parrocchia → Indirizzo
function buildSestiereFlow() {
  renderCards(allData);
  const sestieri = [...new Set(allData.map(o => o.Sestiere))].sort();
  buildMenuList('sidebar', sestieri, selectSestiere);
}
function selectSestiere(s) {
  renderCards(allData.filter(o => o.Sestiere === s));
  const filtered = allData.filter(o => o.Sestiere === s);
  const parrocchie = [...new Set(filtered.map(o => o.Parrocchia))].sort();
  buildMenuList('sidebar', parrocchie, selectParrocchia);
}
function selectParrocchia(p) {
  renderCards(allData.filter(o => o.Parrocchia === p));
  const filtered = allData.filter(o => o.Parrocchia === p);
  const indirizzi = [...new Set(filtered.map(o => o.Indirizzo))].sort();
  buildMenuList('sidebar', indirizzi, selectIndirizzo);
}
function selectIndirizzo(a) {
  renderCards(allData.filter(o => o.Indirizzo === a));
}

// Flusso Tipo di opera
function buildTipoFlow() {
  renderCards(allData);
  const tipi = [...new Set(allData.map(o => o.Tipo))].sort();
  buildMenuList('sidebar', tipi, selectTipo);
}
function selectTipo(t) {
  renderCards(allData.filter(o => o.Tipo === t));
}

// Render elenco card
function renderCards(data) {
  clearContent();
  const content = document.getElementById('content');
  if (!content) return;
  data.forEach(o => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="title">${highlight(`${o.Codice} – ${o.Sestiere}`, currentTerm)}</div>
      <div class="subtitle">${highlight(`${o.Indirizzo}, ${o.Civico}`, currentTerm)}</div>
      <div class="type">${highlight(o.Tipo, currentTerm)}</div>
      <div class="collocazione">${highlight(o.Collocazione, currentTerm)}</div>
      <div class="descrizione">${highlight(o.Descrizione, currentTerm)}</div>
    `;
    card.onclick = () => renderDetail(o);
    content.appendChild(card);
  });
}

// Render dettaglio card
function renderDetail(o) {
  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.style.display = 'block';
  clearSidebar();
  clearContent();
  const content = document.getElementById('content');

  const title    = highlight(`${o.Codice} – ${o.Sestiere}`, currentTerm);
  const subtitle = highlight(`${o.Indirizzo}, ${o.Civico}`, currentTerm);
  const type     = highlight(o.Tipo, currentTerm);
  const colloc   = highlight(o.Collocazione, currentTerm);
  const descr    = highlight(o.Descrizione, currentTerm);
  const iscr     = highlight(o.Iscrizione, currentTerm);
  const cond     = highlight(o.Conservazione, currentTerm);
  const bibl     = highlight(o.Bibliografia, currentTerm);
  const dataFoto = highlight(o['Data miglior foto'], currentTerm);
  const notes    = highlight(o.Note, currentTerm);

  const rawUrl    = o['URL foto'] || '';
  const photoUrl  = rawUrl.replace(/^"+|"+$/g, '').trim();
  const cleanUrl  = photoUrl.replace(/^https?:\/\//, '');
  const proxyUrl  = 'https://images.weserv.nl/?url=' + encodeURIComponent(cleanUrl);
  const lat       = parseFloat(o.Latitudine);
  const lng       = parseFloat(o.Longitudine);

  content.innerHTML = `
    <div class="detail-card">
      <div class="title">${title}</div>
      <div class="subtitle">${subtitle}</div>
      <div class="type">${type}</div>
      <div class="collocazione">${colloc}</div>
      <img src="${proxyUrl}" class="detail-photo" loading="lazy" onerror="this.src='https://via.placeholder.com/600x400?text=Foto+non+disponibile'" />
      <div class="descrizione"><strong>Descrizione:</strong> ${descr}</div>
      <div class="iscrizione"><strong>Iscrizione:</strong> ${iscr}</div>
      <div class="condizioni"><strong>Condizioni:</strong> ${cond}</div>
      <div id="map"></div>
      <div class="bibliografia"><strong>Bibliografia:</strong> ${bibl}</div>
      <div class="datafoto"><strong>Data foto:</strong> ${dataFoto}</div>
      <div class="note"><strong>Note:</strong> ${notes}</div>
    </div>
  `;

  const map = L.map('map').setView([lat, lng], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
  L.marker([lat, lng]).addTo(map);
}

// Utility per pulire sidebar e content
function clearSidebar() {
  const sb = document.getElementById('sidebar'); if (sb) sb.innerHTML = '';
}
function clearContent() {
  const ct = document.getElementById('content'); if (ct) ct.innerHTML = '';
}

// Barra di ricerca con debounce
const searchInput = document.getElementById('search');
let debounceTimeout;
searchInput.addEventListener('input', e => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    currentTerm = e.target.value.trim().toLowerCase();
    if (!currentTerm) return showModeMenu();
    const results = allData.filter(r => Object.values(r).some(v => v && v.toString().toLowerCase().includes(currentTerm)));
    renderCards(results);
  }, 100);
});

// URL del deployment Apps Script JSON
const JSON_URL = 'https://script.google.com/macros/s/AKfycbyt2cEYGcsimAsPRB-tG2fCy-qDCkMvqV5QZmI1pV5r0VLE2L4a571PaYwa7S-o4SnY/exec';

let allData = [];
let currentTerm = '';
let currentMode = '';
let selectedS = '';
let selectedP = '';
let selectedA = '';
let currentList = [];
let currentIndex = -1;

// Evidenziazione dei termini trovati
function highlight(text, term) {
  if (!term) return text;
  const escaped = term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Formatta data ISO in GG mese AAAA (italiano)
function formatDateISO(isoStr) {
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
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
    selectParrocchia(selectedP, false);
  } else if (selectedP) {
    selectedP = '';
    selectSestiere(selectedS, false);
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

// Fetch dei dati e mostra menu iniziale
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

// Pulisce il menu, mantenendo intestazione e container per il back link
function clearSidebar() {
  document.getElementById('sidebar').innerHTML =
    '<div class="sidebar-header">Menu di navigazione</div>' +
    '<div id="sidebar-back"></div>';
}

// Pulisce l'area dei contenuti
function clearContent() {
  document.getElementById('content').innerHTML = '';
}

// Mostra il menu iniziale (scelta Sestiere o Tipo)
function showModeMenu() {
  currentMode = '';
  selectedS = selectedP = selectedA = '';
  clearSidebar();
  clearContent();
  renderBackLink();
  buildMenuList(['Sestiere', 'Tipo'], mode => selectMode(mode));
}

// Selezione della modalità di navigazione
function selectMode(mode) {
  currentMode = mode;
  clearSidebar();
  clearContent();
  renderBackLink();
  if (mode === 'Sestiere') buildSestiereFlow();
  else buildTipoFlow();
}

// Costruisce una lista di voci nel menu
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
  clearSidebar();
  const sestieri = [...new Set(allData.map(o => o.Sestiere))].sort();
  buildMenuList(sestieri, selectSestiere);
}

function selectSestiere(s, emitLink = true) {
  selectedS = s; selectedP = selectedA = '';
  clearSidebar();
  const sb = document.getElementById('sidebar');
  const title = document.createElement('div'); title.className = 'sidebar-selected';
  title.innerHTML = `<strong>${selectedS}</strong><div>Ora scegli tra le parrocchie</div>`;
  sb.appendChild(title);
  renderBackLink();
  const filtered = allData.filter(o => o.Sestiere === s);
  renderCards(filtered);
  buildMenuList([...new Set(filtered.map(o=>o.Parrocchia))].sort(), selectParrocchia);
}

function selectParrocchia(p, emitLink = true) {
  selectedP = p; selectedA = '';
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
  buildMenuList([...new Set(filtered.map(o=>o.Indirizzo))].sort(), selectIndirizzo);
}

function selectIndirizzo(a, emitLink = true) {
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

function selectTipo(t, emitLink = true) {
  clearSidebar();
  const sb = document.getElementById('sidebar');
  const title = document.createElement('div'); title.className = 'sidebar-selected';
  title.innerHTML = `<strong>${t}</strong><div>Ora scegli le opere</div>`;
  sb.appendChild(title);
  renderBackLink();
  renderCards(allData.filter(o => o.Tipo === t));
}

// Rende le card di elenco con titolo, sottotitolo e tipo
function renderCards(data) {
  currentList = data;
  clearContent();
  const content = document.getElementById('content'); if (!content) return;
  data.forEach(o => {
    const card = document.createElement('div'); card.className = 'card';
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

  // Aggiorna indice e btn nav
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
  const rawUrl   = o['URL foto'] || '';
  const proxyUrl = 'https://images.weserv.nl/?url=' + encodeURIComponent(rawUrl.replace(/^"+|"+$/g,'').replace(/^https?:\/\//,''));
  const lat      = parseFloat(o.Latitudine);
  const lng      = parseFloat(o.Longitudine);

  content.innerHTML = `
    <div class="detail-card">
      <div class="title">${title}</div>
      <div class="subtitle">${subtitle}</div>
      <div class="collocazione">${colloc}</div>
      <div class="coords"><strong>Coordinate:</strong> ${o['Coordinate WGS84'] || ''}</div>
      <div class="type">${type}</div>
      <img src="${proxyUrl}" class="detail-photo" onerror="this.src='https://via.placeholder.com/600x400?text=Foto+non+disponibile'" />
      <div class="datazione"><strong>Datazione:</strong> ${o.Datazione || ''}</div>
      <div class="materiale"><strong>Materiale:</strong> ${o.Materiale || ''}</div>
      <div class="dimensioni"><strong>Dimensioni cm:</strong> ${o['Dimensioni cm'] || ''}</div>
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
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'&copy; OpenStreetMap' }).addTo(map);
  L.marker([lat, lng]).addTo(map);
}

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

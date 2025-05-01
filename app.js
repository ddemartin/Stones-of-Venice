// URL del deployment Apps Script JSON
const JSON_URL = 'https://script.google.com/macros/s/AKfycbyt2cEYGcsimAsPRB-tG2fCy-qDCkMvqV5QZmI1pV5r0VLE2L4a571PaYwa7S-o4SnY/exec';

// Base URL per le immagini
const BASE_PHOTOS_URL = 'https://res.cloudinary.com/dzkq1canb/image/upload/Assets_Stones-of-Venice/images/';
const BASE_THUMBS_URL = 'https://res.cloudinary.com/dzkq1canb/image/upload/Assets_Stones-of-Venice/thumbs/';

let allData = [];
let currentTerm = '';
let currentMode = '';
let cameFromSearch = false;
let selectedS = '';
let selectedP = '';
let selectedA = '';
let selectedTipo = '';
let currentList = [];
let currentIndex = -1;
let previousMapZoom = 13;
let previousZoom = null;

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

function fitHomeMapBounds() {
  if (homeMarkers.length > 0) {
    const group = L.featureGroup(homeMarkers);
    homeMap.fitBounds(group.getBounds(), { padding: [30, 30] });
  }
}

// Renderizza link "Torna indietro" nel menu
function renderBackLink() {
  const backContainer = document.getElementById('sidebar-back');
  backContainer.innerHTML = '';

  const startLink = document.createElement('a');
  startLink.textContent = '← Torna alla pagina iniziale';
  startLink.style.display = 'block';
  startLink.style.marginBottom = '0.5em';
  startLink.href = '#';

  if (!selectedS && !selectedP && !selectedA && !selectedTipo && !currentMode && !cameFromSearch) {
    startLink.style.pointerEvents = 'none';
    startLink.style.color = '#888';
    startLink.style.textDecoration = 'none';
  } else {
    startLink.onclick = e => {
      e.preventDefault();
      showModeMenu();
    };
  }

  backContainer.appendChild(startLink);

  if (selectedS || selectedP || selectedA || selectedTipo) {
    const backLink = document.createElement('a');
    backLink.textContent = '← Torna al menu precedente';
    backLink.href = '#';
    backLink.style.display = 'block';
    backLink.style.marginTop = '1em';
    backLink.onclick = e => {
      e.preventDefault();
      goBack();
    };
    backContainer.appendChild(backLink);
  }
}

// Gestisce il ritorno al livello precedente
function goBack() {
  document.body.classList.remove('detail-mode');

  const mapContainer = document.getElementById('map-container');
  if (mapContainer) mapContainer.style.height = '400px';

  let filtered = allData;

  if (selectedA) {
    selectedA = '';
    filtered = allData.filter(o => o.Parrocchia === selectedP);
    currentList = filtered;
    clearSidebar();
    buildMenuList([...new Set(filtered.map(o => o.Indirizzo))].sort(), selectIndirizzo);
    renderCards(filtered);
  const nav = document.getElementById('nav-arrows');
  if (nav) nav.style.display = 'none';

  } else if (selectedP) {
    selectedP = '';
    filtered = allData.filter(o => o.Sestiere === selectedS);
    currentList = filtered;
    clearSidebar();
    buildMenuList([...new Set(filtered.map(o => o.Parrocchia))].sort(), selectParrocchia);
    renderCards(filtered);
  } else if (selectedS) {
    selectedS = '';
    currentList = allData;
    clearSidebar();
    const sestieri = [...new Set(filtered.map(o => o.Sestiere))].sort();
    buildMenuList(sestieri, selectSestiere);
    renderCards(filtered);
  } else if (selectedTipo) {
    selectedTipo = '';
    currentList = allData;
    clearSidebar();
    buildTipoFlow(); // torna alla lista dei tipi
    renderCards(filtered);
  } else {
    showModeMenu();
    updateBreadcrumb();
    return;
  }

  updateBreadcrumb();

  setTimeout(() => {
    if (homeMap) {
      updateHomeMapMarkers(filtered);
      fitMapToMarkers(filtered);
      homeMap.invalidateSize();
    }
  }, 550); // aspetta la transizione di height (.5s)
}

// Inizializza l'app al caricamento del DOM
window.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.style.display = 'none';
    backBtn.onclick = () => showModeMenu();
  }

  cameFromSearch = false; // <-- assicurati che all'avvio sia falso
  fetchData();
});

// Fetch dei dati e avvio del menu iniziale
async function fetchData() {
  try {
    document.getElementById('sidebar').innerHTML = '<p style="padding:1em; text-align:center; color:#555;">Caricamento dei dati in corso, attendere...</p>';

    const res = await fetch(JSON_URL);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    allData = await res.json();
    showModeMenu();
  } catch (err) {
    console.error('Errore caricamento JSON:', err);
    document.getElementById('sidebar').innerHTML = '<p style="color:red; padding:1em;">Impossibile caricare i dati.</p>';
  }
}

// Funzione di ricerca migliorata
cameFromSearch = true;
document.getElementById('search').addEventListener('input', function () {
  currentTerm = this.value.trim().toLowerCase();
  if (!currentTerm) {
    if (currentMode === 'Sestiere') buildSestiereFlow();
    else if (currentMode === 'Tipo') buildTipoFlow();
    else showModeMenu();
    return;
  }

  const filtered = allData.filter(o => {
    return (
      (o.Codice && o.Codice.toLowerCase().includes(currentTerm)) ||
      (o.Sestiere && o.Sestiere.toLowerCase().includes(currentTerm)) ||
      (o.Parrocchia && o.Parrocchia.toLowerCase().includes(currentTerm)) ||
      (o.Indirizzo && o.Indirizzo.toLowerCase().includes(currentTerm)) ||
      (o.Civico && o.Civico.toLowerCase().includes(currentTerm)) ||
      (o.Tipo && o.Tipo.toLowerCase().includes(currentTerm)) ||
      (o.Descrizione && o.Descrizione.toLowerCase().includes(currentTerm))
    );
  });

  clearSidebar();
  clearContent();
  buildMenuList(['Risultati ricerca'], () => {});

  if (filtered.length > 0) {
    renderCards(filtered);
  } else {
    document.getElementById('content').innerHTML = `
      <p style="color: #888; font-size: 1.2em; text-align: center; margin-top: 2em;">
        Nessun risultato trovato.
      </p>
    `;
  }
});

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
  document.body.classList.remove('detail-mode');
  currentMode = '';
  selectedS = selectedP = selectedA = '';
  cameFromSearch = false;
  clearSidebar();
  clearContent();
  renderBackLink();
  buildMenuList(['Sestiere', 'Tipo'], selectMode);
  initHomeMap();
  renderCards(allData);
  const nav = document.getElementById('nav-arrows');
  if (nav) nav.style.display = 'none';
 // ✅ mostra subito tutte le cards
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
    li.innerHTML = (item === 'Risultati ricerca') ? item : highlight(item, currentTerm);
    li.onclick = () => handler(item);
    ul.appendChild(li);
  });
  sidebar.appendChild(ul);
  renderBackLink();
}

function fitMapToMarkers(data) {
  if (!data || !data.length || !homeMap) return;
  const bounds = L.latLngBounds(data.map(o => [parseFloat(o.Latitudine), parseFloat(o.Longitudine)]));
  homeMap.fitBounds(bounds, { padding: [20, 20] });
}

// Flusso Sestiere → Parrocchia → Indirizzo
function buildSestiereFlow() {
  renderCards(allData);
  const nav = document.getElementById('nav-arrows');
  if (nav) nav.style.display = 'none';

  clearSidebar();
  const sestieri = [...new Set(allData.map(o => o.Sestiere))].sort();
  buildMenuList(sestieri, selectSestiere);
}

function selectSestiere(s) {
  selectedS = s;
  selectedP = selectedA = '';
  clearSidebar();
  updateBreadcrumb();
  const sb = document.getElementById('sidebar');
  const title = document.createElement('div');
  title.className = 'sidebar-selected';
  title.innerHTML = `<strong>${selectedS}</strong><div>Ora scegli tra le parrocchie</div>`;
  sb.appendChild(title);
  renderBackLink();
  const filtered = allData.filter(o => o.Sestiere === s);
  renderCards(filtered);
  updateHomeMapMarkers(filtered);
  buildMenuList([...new Set(filtered.map(o => o.Parrocchia))].sort(), selectParrocchia);
}

function selectParrocchia(p) {
  selectedP = p;
  selectedA = '';
  clearSidebar();
  updateBreadcrumb();
  const sb = document.getElementById('sidebar');
  const selS = document.createElement('div'); selS.className = 'sidebar-selected'; selS.textContent = selectedS;
  const title = document.createElement('div'); title.className = 'sidebar-selected';
  title.innerHTML = `<strong>${selectedP}</strong><div>Ora scegli tra gli indirizzi</div>`;
  sb.appendChild(selS);
  sb.appendChild(title);
  renderBackLink();
  const filtered = allData.filter(o => o.Parrocchia === p);
  renderCards(filtered);
  updateHomeMapMarkers(filtered);
  buildMenuList([...new Set(filtered.map(o => o.Indirizzo))].sort(), selectIndirizzo);
}

function selectIndirizzo(a) {
  selectedA = a;
  clearSidebar();
  updateBreadcrumb();
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
  updateHomeMapMarkers(filtered);
}

// Flusso Tipo di opera
function buildTipoFlow() {
  renderCards(allData);
  const nav = document.getElementById('nav-arrows');
  if (nav) nav.style.display = 'none';

  clearSidebar();
  const tipi = [...new Set(allData.map(o => o.Tipo))].sort();
  buildMenuList(tipi, selectTipo);
}

function selectTipo(t) {
  selectedTipo = t;
  currentMode = 'Tipo'; // <<--- fondamentale
  clearSidebar();
  const sb = document.getElementById('sidebar');
  const title = document.createElement('div');
  title.className = 'sidebar-selected';
  title.innerHTML = `<strong>${t}</strong><div>Ora scegli le opere</div>`;
  sb.appendChild(title);

  renderBackLink(); // <-- importantissimo!
  
  const filtered = allData.filter(o => o.Tipo === t);
  renderCards(filtered);
  updateHomeMapMarkers(filtered);
  fitMapToMarkers(filtered);
  updateBreadcrumb();
}

//Mappa di ricerca
let homeMap = null;
let homeMarkers = [];
const smallMarkerIcon = L.divIcon({
  className: 'custom-marker',
  iconSize: [12, 12]
});

function initHomeMap() {
  clearContent();
  
  if (!document.getElementById('home-map')) return;
  
  if (homeMap) {
    homeMap.remove(); // Distrugge la mappa se già esiste
    homeMap = null;
  }
  
  homeMap = L.map('home-map').setView([45.4371908, 12.3345898], 13); // Centro Venezia
  const mapContainer = document.getElementById('home-map');
if (mapContainer) {
  const resizeObserver = new ResizeObserver(() => {
    if (homeMap) homeMap.invalidateSize();
  });
  resizeObserver.observe(mapContainer);
}

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(homeMap);

  homeMarkers = [];

  allData.forEach(o => {
    const lat = parseFloat(o.Latitudine);
    const lng = parseFloat(o.Longitudine);

    if (!isNaN(lat) && !isNaN(lng)) {
      const marker = L.marker([lat, lng], { icon: smallMarkerIcon });
      
      marker.on('click', () => renderDetail(o));

      marker.addTo(homeMap);
      homeMarkers.push(marker);
    }
  });

  // Fit automatico di tutti i marker
  if (homeMarkers.length > 0) {
    const group = L.featureGroup(homeMarkers);
    homeMap.fitBounds(group.getBounds(), { padding: [30, 30] });
  }
}

//Aggiorna mappa secondo il filtro
function updateHomeMapMarkers(dataFiltrata) {
  if (!homeMap) return;

  // Rimuove tutti i marker precedenti
  homeMarkers.forEach(marker => homeMap.removeLayer(marker));
  homeMarkers = [];

  dataFiltrata.forEach(o => {
    if (!o || !o.Codice || !o['Latitudine'] || !o['Longitudine']) return; // Skippa se mancano dati essenziali
  
    const lat = parseFloat(o.Latitudine);
    const lng = parseFloat(o.Longitudine);
  
    if (!isNaN(lat) && !isNaN(lng)) {
      const marker = L.marker([lat, lng], { icon: smallMarkerIcon });
      marker.on('click', () => renderDetail(o));
      marker.addTo(homeMap);
      homeMarkers.push(marker);
    }
  });

  if (homeMarkers.length > 0) {
    const group = L.featureGroup(homeMarkers);
    homeMap.fitBounds(group.getBounds(), { padding: [30, 30] });
  }
}

// Rende le card di elenco con thumbnail
function renderCards(data) {
  const nav = document.getElementById('nav-arrows');
  if (nav) nav.style.display = 'none';
  if (!data || data.length === 0) {
    clearContent();
    const content = document.getElementById('content');
    const noResult = document.createElement('div');
    noResult.style.padding = '2em';
    noResult.style.textAlign = 'center';
    noResult.style.color = '#666';
    noResult.innerHTML = '<strong>Nessun risultato trovato.</strong><br>Prova a cambiare criterio di ricerca.';
    content.appendChild(noResult);
    return;
  }

  currentList = data;
  clearContent();
  const content = document.getElementById('content');

  // ✅ Wrapper che contiene contatore + cards
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '1em';
  content.appendChild(wrapper);

  // ✅ Contatore
  const counter = document.createElement('div');
  counter.style.fontSize = '1.1em';
  counter.style.color = '#666';
  counter.textContent = data.length === 1
    ? '1 risultato trovato'
    : `${data.length} risultati trovati`;
  wrapper.appendChild(counter);

  // ✅ Container delle cards
  const cardsContainer = document.createElement('div');
  cardsContainer.id = 'cards-container';
  wrapper.appendChild(cardsContainer);

  // ✅ Popola cards
  data.forEach(o => {
    if (!o || !o.Codice || !o['Indirizzo']) return;
    const card = document.createElement('div');
    card.className = 'card';
    const filename = getImageFilename(o);
    const thumbUrl = BASE_THUMBS_URL + filename;

    card.innerHTML = `
      <div style="display: flex; align-items: center;">
        <img 
          data-src="${thumbUrl}" 
          alt="Anteprima ${o.Codice}" 
          class="lazyload"
          style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; margin-right: 1em;"
          onerror="this.onerror=null;this.src='https://via.placeholder.com/80x80?text=N/A';"
        />
        <div>
          <div class="title">${highlight(`${o.Codice} – ${o.Sestiere}`, currentTerm)}</div>
          <div class="subtitle">${highlight(`${o.Indirizzo}, ${o.Civico}`, currentTerm)}</div>
          <div class="type">${highlight(o.Tipo, currentTerm)}</div>
        </div>
      </div>
    `;
    card.onclick = () => renderDetail(o);
    cardsContainer.appendChild(card);
  });
}

// Rende la vista dettaglio senza cancellare il menu
function renderDetail(o) {
  document.body.classList.add('detail-mode'); // 🔥 aggiunge la classe
  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.style.display = 'none';
  clearContent();
  
  // tutto il resto del render...  
  const content = document.getElementById('content');
  currentIndex = currentList.findIndex(item => item.Codice === o.Codice);
  updateNavButtons();

  const title    = highlight(`${o.Codice} – ${o.Sestiere}, ${o.Parrocchia}`, currentTerm);
  const subtitle = highlight(`${o.Indirizzo}, ${o.Civico}`, currentTerm);
  const type     = highlight(o.Tipo, currentTerm);
  const colloc   = highlight(o.Collocazione, currentTerm);
  const descr    = highlight(o.Descrizione, currentTerm);
  const iscr     = highlight(o.Iscrizione || 'nessuna.', currentTerm);
  const cond     = highlight(o.Conservazione, currentTerm);
  const bibl     = highlight(o.Bibliografia, currentTerm);
  const isoDate  = o['Data miglior foto'] || '';
  const dataFoto = highlight(isoDate ? formatDateISO(isoDate) : '', currentTerm);
  const notes    = highlight(o.Note, currentTerm);
  const filename = getImageFilename(o);
  const photoUrl = BASE_PHOTOS_URL + (filename);
  
  const lat = parseFloat(o.Latitudine);
  const lng = parseFloat(o.Longitudine);

  content.innerHTML = `
    <div class="detail-card">
  <img
    src="${photoUrl}"
    class="detail-photo"
    onerror="handleImageError(this)"
    alt="Foto ${o.Codice}"
  />
  <div class="detail-info">
    <div class="title">${title}</div>
    <div class="subtitle">${subtitle}</div>
    <div class="collocazione"><strong>Collocazione:</strong> ${colloc}</div>
    <div class="coords"><strong>Coordinate:</strong> ${o['Coordinate WGS84'] || ''}</div>
    <div class="type">${type}</div>
    <div class="datazione"><strong>Datazione:</strong> ${o.Datazione || ''}</div>
    <div class="materiale"><strong>Materiale:</strong> ${o.Materiale || ''}</div>
    <div class="dimensioni"><strong>Dimensioni cm:</strong> ${o['Dimensioni cm'] || ''}</div>
    <div class="descrizione"><strong>Descrizione:</strong> ${descr}</div>
    <div class="iscrizione"><strong>Iscrizione:</strong> ${iscr}</div>
    <div class="condizioni"><strong>Condizioni:</strong> ${cond}</div>
    <div class="bibliografia"><strong>Bibliografia:</strong> ${bibl}</div>
    <div class="datafoto"><strong>Data della fotografia:</strong> ${dataFoto}</div>
    <div class="note"><strong>Note:</strong> ${notes}</div>
  </div>
</div>
  `;

  
  

  // Mostra i bottoni
  const nav = document.getElementById('nav-arrows');
  if (nav) nav.style.display = 'flex';

  // Fissa currentIndex se mancante
  if (!currentList || !Array.isArray(currentList) || currentList.length === 0) {
    currentList = allData;
  }
  if (currentIndex === -1 || !currentList.some(item => item.Codice === o.Codice)) {
    currentIndex = currentList.findIndex(item => item.Codice === o.Codice);
  }

  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (prevBtn && nextBtn) {
    prevBtn.style.display = 'inline-block';
    nextBtn.style.display = 'inline-block';
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= currentList.length - 1;
    prevBtn.onclick = () => {
      if (currentIndex > 0) renderDetail(currentList[currentIndex - 1]);
    };
    nextBtn.onclick = () => {
      if (currentIndex < currentList.length - 1) renderDetail(currentList[currentIndex + 1]);
    };
  }
// Riutilizza la mappa home ma con un solo marker
  if (homeMap && !isNaN(lat) && !isNaN(lng)) {
    previousMapZoom = homeMap.getZoom(); // salva lo zoom attuale

    homeMarkers.forEach(marker => homeMap.removeLayer(marker));
    homeMarkers = [];

    const marker = L.marker([lat, lng], { icon: smallMarkerIcon }).addTo(homeMap);
    homeMarkers.push(marker);

    setTimeout(() => {
      homeMap.invalidateSize(); // forza il ridisegno
      homeMap.setView([lat, lng], previousMapZoom); // centra correttamente
    }, 500); // tempo sufficiente per completare l'animazione CSS
  }
  }  
  
  // Mappa Leaflet
  const map = L.map('map').setView([lat, lng], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

L.marker([lat, lng]).addTo(map);

function updateBreadcrumb() {
  const breadcrumb = document.getElementById('breadcrumb');
  if (!breadcrumb) return;

  // Se siamo in modalità dettaglio, non mostrare nulla
  if (document.body.classList.contains('detail-mode')) {
    breadcrumb.innerHTML = '';
    return;
  }

  const parts = [];
  if (selectedS) parts.push(`Sestiere di ${selectedS}`);
  if (selectedP) parts.push(`Parrocchia di ${selectedP}`);
  if (selectedA) parts.push(`${selectedA}`);
  breadcrumb.innerHTML = parts.join(' ➔ ');
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



// URL del CSV pubblicato
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSocQMJvjtvawDY2L32nAhiFGrteCsXFbLDFeFrgSrKNmkYNXLyk9v67anOqM0LZlTk4AvMBo1v8dES/pub?gid=1127452838&single=true&output=csv';

let allData = [], filtered = [];

const JSON_URL = 'https://script.google.com/macros/s/AKfycbwJxB3tZkYe1Bj-SyrvQSMMaTvEiXOYWB1U9K9yi4Vy9sFT-pnRMEc-GtDYQHDwoPp5hg/exec';

async function fetchData() {
  try {
    const res = await fetch(JSON_URL);
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    allData = await res.json();        // array di oggetti già pronti
    buildMenuSestieri();
  } catch (err) {
    console.error('Errore caricamento JSON:', err);
    document.getElementById('sidebar').innerHTML =
      '<p style="color:red">Impossibile caricare i dati.</p>';
  }
}


function buildMenuSestieri() {
  const ul = document.getElementById('list-sestieri');
  const sestieri = [...new Set(allData.map(o=>o.Sestiere))].sort();
  sestieri.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    li.onclick = () => selectSestiere(s);
    ul.appendChild(li);
  });
}

function selectSestiere(s) {
  filtered = allData.filter(o => o.Sestiere === s);
  document.getElementById('menu-parrocchie').style.display = '';
  buildMenu('list-parrocchie', [...new Set(filtered.map(o=>o.Parrocchia))].sort(), selectParrocchia);
}

function selectParrocchia(p) {
  filtered = filtered.filter(o => o.Parrocchia === p);
  document.getElementById('menu-indirizzi').style.display = '';
  buildMenu('list-indirizzi', [...new Set(filtered.map(o=>o.Indirizzo))].sort(), selectIndirizzo);
}

function selectIndirizzo(a) {
  filtered = filtered.filter(o => o.Indirizzo === a);
  renderCards(filtered);
}

function buildMenu(listId, items, handler) {
  const ul = document.getElementById(listId);
  ul.innerHTML = '';
  items.forEach(i => {
    const li = document.createElement('li');
    li.textContent = i;
    li.onclick = () => handler(i);
    ul.appendChild(li);
  });
}

function renderCards(data) {
  const content = document.getElementById('content');
  content.innerHTML = '';
  data.forEach(o => {
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = `
      <div class="title">${o['Codice']} – ${o['Sestiere']}</div>
      <div class="subtitle">${o['Indirizzo']}, ${o['Civico']}</div>
                  <img src="${o['URL thumbnail']}" class="thumb">
    `;
    d.onclick = () => renderDetail(o);
    content.appendChild(d);
  });
}

function renderDetail(o) {
  // Estrai e pulisci l'URL originale
  const rawUrl   = o['URL foto'] || '';
  const photoUrl = rawUrl.replace(/^\"+|\"+$/g, '').trim();

  // Costruisci l'URL proxy
  // Rimuove 'https://' o 'http://' dal photoUrl
  const cleanUrl = photoUrl.replace(/^https?:\/\//, '');
  const proxyUrl = 'https://images.weserv.nl/?url=' + encodeURIComponent(cleanUrl);
  const lat      = parseFloat(o['Latitudine']);
  const lng      = parseFloat(o['Longitudine']);
  const coordsStr= (o['Coordinate WGS84'] || '').trim() || `${lat}, ${lng}`;
  const content = document.getElementById('content');
  content.innerHTML = `
    <button onclick="location.reload()">← Reset</button>

    <div class="detail-card">
      <div class="title">${o['Codice']} – ${o['Sestiere']}</div>
      <div class="subtitle">${o['Indirizzo']}, ${o['Civico']}</div>
      <div class="collocazione">${o['Collocazione']}</div>
      <div class="coords">${coordsStr}</div>

      ${photoUrl
        ? `<img
             src="${proxyUrl}"
             alt="Foto opera ${o['Codice']}"
             class="detail-photo"
             loading="lazy"
			 onerror="this.src='https://via.placeholder.com/600x400?text=Foto+non+disponibile'"
           >`
        : `<p style="color:red">Foto non disponibile</p>`
      }

      <div class="descrizione"><strong>Descrizione:</strong> ${o['Descrizione']}</div>
      <div class="iscrizione"><strong>Iscrizione:</strong> ${o['Iscrizione']}</div>
      <div class="condizioni"><strong>Condizioni:</strong> ${o['Conservazione']}</div>

      <div id="map"></div>

      <div class="bibliografia"><strong>Bibliografia:</strong> ${o['Bibliografia']}</div>
      <div class="datafoto"><strong>Data foto:</strong> ${o['Data miglior foto']}</div>
      <div class="note"><strong>Note:</strong> ${o['Note']}</div>
    </div>
  `;

  const map = L.map('map').setView([lat, lng], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  L.marker([lat, lng]).addTo(map);
}


document.getElementById('search').oninput = (e) => {
  filtered = allData.filter(o =>
    o.Codice.includes(e.target.value) ||
    o.Descrizione.toLowerCase().includes(e.target.value.toLowerCase())
  );
  renderCards(filtered);
};

fetchData();

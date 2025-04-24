// URL del CSV pubblicato
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSocQMJvjtvawDY2L32nAhiFGrteCsXFbLDFeFrgSrKNmkYNXLyk9v67anOqM0LZlTk4AvMBo1v8dES/pub?gid=1127452838&single=true&output=csv';

let allData = [], filtered = [];

Papa.parse(CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    // results.data è un array di oggetti chiave=colonna
    allData = results.data;
    buildMenuSestieri();
  },
  error: function(err) {
    console.error('PapaParse error:', err);
    document.getElementById('sidebar').innerHTML =
      '<p style="color:red">Impossibile leggere il CSV (controlla la Console).</p>';
  }
});


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
      <h4>${o['Codice']} – ${o['Sestiere']} – ${o['Parrocchia']} – ${o['Indirizzo']}, ${o['Civico']}</h4>
      <img src="${o['URL thumbnail']}" class="thumb">
    `;
    d.onclick = () => renderDetail(o);
    content.appendChild(d);
  });
}

function renderDetail(o) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <button onclick="location.reload()">← Reset</button>
    <h1>${o.Collocazione}</h1>
    <img src="${o['URL foto']}" style="max-width:100%">
    <p><strong>Descrizione:</strong> ${o['Descrizione']}</p>
    <div id="map"></div>
  `;
  const lat = parseFloat(o['Latitudine']);
  const lng = parseFloat(o['Longitudine']);
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

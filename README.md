# Archivio Fotografico delle Sculture Erratiche – Venezia

Questa è una web app per consultare un **archivio fotografico delle sculture erratiche all'aperto** presenti a Venezia e nella sua laguna. È stata progettata per essere **intuitiva**, **mobile-friendly** e **navigabile sia da mappa che da ricerca libera**.

---

## ✅ Funzionalità principali

### 🔎 Ricerca
- Campo di ricerca con placeholder "Cerca..."
- Ricerca full-text su Codice, Sestiere, Parrocchia, Indirizzo, Civico, Tipo, Descrizione
- Evidenziazione dei termini trovati
- Conteggio risultati
- Funziona anche da URL con `?q=termine`

### 🗺️ Mappa
- Mappa interattiva di Leaflet con marker per ogni opera geolocalizzata
- Ridimensionamento automatico per mostrare tutti i marker visibili
- Visualizzazione ridotta della mappa in modalità dettaglio

### 🧭 Navigazione
- Esplora per:
  - Sestiere → Parrocchia → Indirizzo
  - Tipo → Opera
- Navigazione avanti/indietro tra opere correlate

### 📄 Scheda di dettaglio
- Mostra: codice, indirizzo, tipo, collocazione, coordinate, materiale, dimensioni, descrizione, iscrizioni, condizioni, bibliografia, data foto, note
- Immagine a piena larghezza (con fallback in caso di errore)
- Map marker per l’opera

### 🔁 Ritorno ai risultati
- Quando si entra da una ricerca, viene mostrato un link:
  - **← Torna ai risultati della ricerca**
- Ritorna esattamente alla lista filtrata
- Mantiene il termine nel campo di ricerca
- Rimette il focus automatico sul campo

### 🔗 Deep Linking
- Supporta:
  - `?q=termine` → ricerca diretta
  - `?id=CODICE` → apre direttamente la scheda
- Comodo per condivisione o link da email/articoli

---

## 📁 Struttura file

- `index.html` — Struttura e layout della pagina
- `app.js` — Logica interattiva della web app
- `style` — Inline nel file HTML
- Leaflet per mappa interattiva (CDN)
- Cloudinary per immagini

---

## 🛠️ Requisiti
- Qualsiasi browser moderno (Chrome, Firefox, Safari, Edge)
- Connessione Internet per caricare dati da Google Apps Script e immagini da Cloudinary

---

## 📥 Hosting & Deploy
- Può essere ospitato su GitHub Pages, Netlify, Vercel o qualsiasi server statico
- Nessun backend necessario

---

## ✍️ Autore
**Davide De Martin**

Script realizzato con l’assistenza di **ChatGPT CodeGPT**  

# Archivio Fotografico delle Sculture Erratiche di Venezia e della sua Laguna

**A cura di Davide De Martin**

---

## 📚 Descrizione

Questo progetto è un'applicazione web che permette di navigare un archivio fotografico delle sculture erratiche situate all'aperto a Venezia e nella sua laguna.  
Gli utenti possono esplorare le opere per sestiere, tipo, indirizzo e visualizzare dettagliate fotografie e informazioni.

---

## 🗂️ Struttura del Progetto

- **Frontend**: HTML, CSS, JavaScript Vanilla
- **Backend dati**: Google Sheets + Google Apps Script per generare un JSON accessibile pubblicamente
- **Hosting immagini**: Cloudinary (versione gratuita)
- **Mappa interattiva**: Leaflet.js + OpenStreetMap
- **Hosting**: GitHub Pages (o altro server statico)

---

## 📦 Risorse Utilizzate

| Tipo | Servizio / Tecnologie | Note |
|:----|:----------------------|:----|
| **Web App** | HTML + JS | Applicazione front-end |
| **Hosting Web** | GitHub Pages | Sito statico |
| **Dati JSON** | Google Apps Script | API JSON basata su Google Sheets |
| **Hosting Immagini** | Cloudinary | Immagini ad alta risoluzione |
| **Thumbnail immagini** | GitHub Pages (assets/thumbs) | (non attualmente usate) |
| **Placeholder immagini** | Placeholder.com | Immagini mancanti |
| **Mappe** | Leaflet.js + OpenStreetMap | Visualizzazione geografica |

---

## 🔗 Collegamenti principali

- **Dati JSON**: [Google Apps Script API](https://script.google.com/macros/s/AKfycbyt2cEYGcsimAsPRB-tG2fCy-qDCkMvqV5QZmI1pV5r0VLE2L4a571PaYwa7S-o4SnY/exec)
- **Immagini Cloudinary**: `https://res.cloudinary.com/dzkq1canb/image/upload/`
- **Thumbs immagini (GitHub Pages)**: `https://ddemartin.github.io/venezia-arte-pubblica/assets/thumbs/`

---

## ⚙️ Tecnologie aggiuntive

- **Leaflet.js**: per le mappe geografiche.
- **Placeholder.com**: per immagini non disponibili.
- **OpenStreetMap Tiles**: come base cartografica.

---

## 📋 To-Do / Idee future

- Lazy loading delle immagini
- Ricerca intelligente delle opere
- Ottimizzazione mobile (responsive)
- Mappa globale con tutte le opere
- Barra di filtro avanzato
- Backup automatico del JSON

---

## ✍️ Autore

Davide De Martin  
Supporto tecnico: ChatGPT OpenAI - assistenza alla progettazione e sviluppo.

---


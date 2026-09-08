# 📄 BlasPDF

![Tauri 2.0](https://img.shields.io/badge/Tauri-2.0-blue.svg)
![Rust](https://img.shields.io/badge/Rust-2021-orange.svg)
![PDF.js](https://img.shields.io/badge/PDF.js-Mozilla-red.svg)
![PDF-Lib](https://img.shields.io/badge/pdf--lib-1.17-brightgreen.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Zero-Terminal](https://img.shields.io/badge/Zero--Terminal-100%25%20Compliant-brightgreen.svg)
![Local-First](https://img.shields.io/badge/Local--First-100%25%20Offline-blueviolet.svg)

**BlasPDF** è una suite desktop moderna, nativa, ultra-leggera e rigorosamente conforme ai principi **Local-First & Zero-Terminal** dell'ecosistema **[BlasOpen](../../COSTITUZIONE.md)**, dedicata alla manipolazione, correzione, redazione e assistenza AI su documenti PDF senza alcun costo di abbonamento.

Sviluppata con un backend nativo in **Rust** su architettura **Tauri 2.0** e un'interfaccia reattiva accelerata via Canvas, garantisce consumi di RAM minimi (~40-60 MB), avvio istantaneo e rispetto totale della privacy: nessun documento o dato personale lascia mai il tuo computer.

---

## ✨ Caratteristiche Principali (v1.0.0)

* **🚫 Lotta agli Abbonamenti:** Completa alternativa libera e gratuita ai costosi canoni mensili di Adobe Acrobat Pro.
* **⚡ Regola Zero-Terminal:** Avvio istantaneo con doppio clic su `BlasPDF.app` o tramite `./blaspdf`. Nessun interprete esterno o comando richiesto all'utente finale.
* **📑 Gestione e Riordino Pagine:** Unione di più PDF (Merge), divisione (Split), estrazione pagine singole, eliminazione sicura e riordino visuale Drag & Drop con rotazione continua (90° / 180°).
* **🖍️ Correzione & Bianchetto (Redaction):** Cancellazione e oscuramento indelebile di testo o dati sensibili con rettangolo bianco o nero (tenendo premuto `Shift` o `Alt`).
* **✍️ Modifica Testo Intelligente (In-Place):** Clicca su qualsiasi parola del documento originale per rilevarla all'istante, coprirla con bianchetto automatico e modificarla con menu fluttuante di stile (Font *Helvetica, Times, Courier*, dimensione, grassetto e palette colori).
* **✒️ Firma Grafica HiDPI:** Disegno a mano libera con pennino fluido su canvas ad alta risoluzione Retina, con esportazione in PNG trasparente e trascinamento visuale sul foglio.
* **↩️ Undo/Redo & Protezione Chiusura:** Cronologia completa annulla/ripristina (`Cmd+Z` / `Cmd+Shift+Z`) e intercettazione nativa della chiusura finestra con avviso salvataggio per modifiche pendenti.

---

## 🗺️ Roadmap & Prossime Versioni (v1.1.0 / v2.0.0)

Consulta il documento di specifica tecnica dettagliata [docs/prossime_implementazioni.md](docs/prossime_implementazioni.md) per i dettagli su:
1. **🖼️ Inserimento Immagini Multi-formato:** Timbri, loghi e firme esterne (PNG, JPG, WebP, SVG, BMP) con ridimensionamento proporzionale.
2. **🔄 Centro Conversioni Offline (Stile iLovePDF):** Batch Immagini ➔ PDF, PDF ➔ Immagini alta risoluzione, PDF ➔ Testo puro, Ottimizzazione stream COS.
3. **🤖 Assistente AI Locale (Local-First):** Integrazione con Ollama (`localhost:11434`) per Q&A e riassunti con streaming in tempo reale a zero violazioni della privacy.

---

## 🚀 Download e Utilizzo (Zero-Terminal)

### 🍏 macOS
1. Scarica `BlasPDF_universal.dmg` o apri direttamente `BlasPDF.app`.
2. Trascina l'applicazione nella cartella **Applicazioni**.
3. Doppio clic per avviare ed inizia a trascinare i tuoi file PDF nell'editor!

### 🪟 Windows & 🐧 Linux
* Eseguibile compatto standalone `.exe` per Windows e `.AppImage` / `.deb` per distribuzioni Linux.

---

## 🛠️ Per gli Sviluppatori

```bash
# 1. Installa le dipendenze
npm install

# 2. Avvia in modalità sviluppo con hot-reload
npm run dev

# 3. Compila i binari di produzione nativi
npm run build
```

---

## 🏛️ Costituzione e Didattica BlasOpen

BlasPDF rispetta rigorosamente:
* 📜 **[Costituzione Generale BlasOpen](../../COSTITUZIONE.md)**
* 📜 **[Regole AI e Limite 150 Righe (AGENTS.md)](AGENTS.md)**
* 📚 **[Documentazione Didattica e Teoria (docs/)](docs/)**
  * [01. Anatomia e Struttura a Basso Livello del Formato PDF](docs/01_struttura_file_pdf.md)
  * [02. Rendering Vettoriale su Canvas e Gestione HiDPI Retina](docs/02_rendering_canvas.md)
  * [03. Manipolazione Pagine: Merge, Split, Rotazione e Albero COS](docs/03_manipolazione_pagine.md)
  * [04. Strumenti di Correzione, Redazione e Coordinate Vettoriali](docs/04_redazione_e_overlay.md)
  * [Tecnologie Utilizzate e Scelte Architetturali](docs/tecnologie_utilizzate.md)
  * [Specifiche Tecniche Prossime Implementazioni (Roadmap)](docs/prossime_implementazioni.md)
* 📖 **[Manuale Utente Ufficiale (docs/manuali/manuale_utente.md)](docs/manuali/manuale_utente.md)**

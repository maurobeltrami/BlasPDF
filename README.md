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

## ✨ Caratteristiche Principali (v1.1.0)

* **🚫 Lotta agli Abbonamenti:** Completa alternativa libera e gratuita ai costosi canoni mensili di Adobe Acrobat Pro.
* **⚡ Regola Zero-Terminal:** Avvio istantaneo con doppio clic su `BlasPDF.app` o tramite `./blaspdf`. Nessun interprete esterno o comando richiesto all'utente finale.
* **🎨 Nuova Icona Punk Stencil "B":** Identità visiva graffiante con monogramma "B" di BlasOpen, banner rosso spray PDF e trasparenza nativa anti-aliasata a 32-bit.
* **📑 Gestione e Riordino Pagine:** Unione di più PDF (Merge), divisione (Split), estrazione pagine singole, eliminazione sicura e riordino visuale Drag & Drop con rotazione continua (90° / 180°).
* **🖍️ Correzione & Bianchetto Seamless:** Cancellazione e oscuramento indelebile di testo o dati sensibili con rettangolo bianco o nero (con `Shift` o `Alt`), completamente privo di riquadri o ombre artificiali.
* **✍️ Modifica Testo Intelligente (In-Place):** Clicca su qualsiasi parola del documento originale per rilevarla all'istante, coprirla con bianchetto automatico e modificarla con menu fluttuante di stile (Font *Helvetica, Times, Courier*, dimensione, grassetto e palette colori).
* **🖼️ Inserimento Immagini & Timbri:** Aggiungi loghi, timbri o grafiche (PNG, JPG, WebP, SVG, BMP, GIF) con maniglie angolari di ridimensionamento proporzionale, eliminazione rapida e baking permanente.
* **🔄 Centro Conversioni Offline (Stile iLovePDF):** Suite batch 100% locale per:
  * Immagini ➔ PDF (multi-pagina con orientamento automatico)
  * PDF ➔ Immagini Hi-Res (150 DPI per stampa o digitale)
  * PDF ➔ Testo (.txt e .md strutturato)
  * Ottimizzazione e compressione stream COS (`useObjectStreams`)
* **✒️ Firma Grafica HiDPI:** Disegno a mano libera con pennino fluido su canvas ad alta risoluzione Retina, con esportazione in PNG trasparente e trascinamento visuale sul foglio.
* **↩️ Undo/Redo & Protezione Chiusura:** Cronologia completa annulla/ripristina (`Cmd+Z` / `Cmd+Shift+Z`) e intercettazione nativa della chiusura finestra con avviso salvataggio per modifiche pendenti.

---

## 🗺️ Roadmap Prossime Versioni (v2.0.0)

Le funzionalità della versione **v1.1.0** (immagini multi-formato e centro conversioni offline) sono state interamente completate. La prossima milestone architetturale è:
* **🤖 Assistente AI Locale (Local-First):** Integrazione con Ollama (`localhost:11434`) per Q&A, sintesi documentale ed estrazione clausole chiave con streaming in tempo reale e riservatezza assoluta. Consulta [docs/05_agenti_ai_local_first.md](docs/05_agenti_ai_local_first.md) e [docs/prossime_implementazioni.md](docs/prossime_implementazioni.md).

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
  * [04. Strumenti di Correzione, Redazione, Immagini e Coordinate Vettoriali](docs/04_redazione_e_overlay.md)
  * [05. Agenti AI Local-First, Integrazione Ollama e Privacy](docs/05_agenti_ai_local_first.md)
  * [Tecnologie Utilizzate e Scelte Architetturali](docs/tecnologie_utilizzate.md)
  * [Specifiche Tecniche Prossime Implementazioni (Roadmap)](docs/prossime_implementazioni.md)
* 📖 **[Manuali Utente Ufficiali (docs/manuali/)](docs/manuali/)**
  * [Manuale Utente Ufficiale](docs/manuali/manuale_utente.md)
  * [Guida Inserimento Immagini & Centro Conversioni Offline](docs/manuali/guida_centro_conversioni_e_immagini.md)

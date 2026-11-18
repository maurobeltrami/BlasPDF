# 🛠️ Tecnologie Utilizzate in BlasPDF

Questo documento censisce, illustra e documenta formalmente tutte le tecnologie, i framework, le librerie e i pattern architetturali impiegati nello sviluppo di **BlasPDF**, in conformità all'Articolo 4 della Costituzione di BlasOpen.

---

## 🏛️ 1. Architettura Desktop Nativa

### 🦀 Rust (Edizione 2021)
* **Ruolo:** Backend di sistema, gestione memoria a costo zero, I/O rapido su file system locale.
* **Perché è stato scelto:** Garantisce sicurezza della memoria senza Garbage Collector, eliminando crash da memory leak e assicurando tempi di avvio nell'ordine dei millisecondi.

### ⚡ Tauri 2.0 (`tauri-apps`)
* **Ruolo:** Framework multi-processo per applicazioni desktop native.
* **Perché è stato scelto:** A differenza di Electron (che ingloba un'intera copia di Chromium e NodeJS consumando oltre 250 MB di RAM), Tauri sfrutta il motore Web nativo del sistema operativo (WebKit su macOS, WebView2 su Windows, WebKitGTK su Linux). Questo consente a BlasPDF di consumare appena **30-50 MB di RAM**.
* **Gestione Nativa del Ciclo di Vita Finestra:**
  * Intercettazione a basso livello dell'evento `WindowEvent::CloseRequested` nel backend Rust con `api.prevent_close()`.
  * Dialogo bidirezionale via eventi IPC (`request_close_window` e `close_app`) per salvaguardare modifiche non salvate prima della chiusura.
* **Plugin e Crate Native:**
  * `rfd`: Dialoghi nativi per selezione e salvataggio file singoli e batch (`pick_file`, `pick_files`, `save_file`).
  * `tauri-plugin-dialog`: Finestre di dialogo native di apertura/salvataggio file.
  * `tauri-plugin-fs`: Accesso al file system protetto e controllato da permessi.

---

## 📄 2. Motori PDF & Elaborazione Grafica

### 🔴 Mozilla PDF.js (v4.10)
* **Ruolo:** Motore di rasterizzazione e parsing di documenti PDF.
* **Architettura:** Funzionamento disaccoppiato tramite Web Worker dedicato (`pdf.worker.min.mjs`), che garantisce il rendering continuo a 60 FPS senza bloccare i thread dell'interfaccia.
* **Estrazione Baseline Testuale (Text Layer):** Parsing dell'albero dei token tramite `page.getTextContent()`. Calcolo geometrico della linea di base del font e della matrice affine di trasformazione:
  $$\text{topDomY} = (ph - ty) - (\text{fontSize} \times 0.85)$$
* **Rendering Hi-Res per Conversione Immagini:** Supporto a moltiplicatori DPI personalizzati (150 e 300 DPI) per l'esportazione tipografica di pagine in PNG o JPEG.
* **Integrazione Local-First:** Incluso direttamente nella directory `src/vendor/` per consentire il funzionamento al 100% offline, senza dipendenze da server o CDN esterni.

### 🟢 PDF-Lib (v1.17)
* **Ruolo:** Motore di manipolazione vettoriale e mutazione dell'albero COS delle pagine.
* **Funzionalità:** Unione di più PDF, divisione in fogli separati, estrazione, rotazione e inserimento permanente di rettangoli (bianchetto/redazione), testi vettoriali, firme grafiche e immagini/timbri (`embedPng`, `embedJpg`).
* **Font Vettoriali Standard ISO Type 1:** Utilizzo di `StandardFonts` (`Helvetica`, `TimesRoman`, `Courier` e varianti Bold).
* **Ottimizzazione Stream COS:** Ricompressione e pulizia oggetti orfani abilitando `useObjectStreams: true`.

### 🖼️ Transcodifica Grafica in Memoria (OffscreenCanvas)
* **Ruolo:** Normalizzazione automatica dei formati WebP, SVG, BMP e GIF in bitmap compatibili con PDF-Lib senza dipendenze esterne.

---

## 🎨 3. Frontend & Design System

### 🌐 Vanilla JavaScript (ES2022 Modules)
* **Ruolo:** Logica applicativa dell'interfaccia utente.
* **Pattern Adottati:**
  * *Single Responsibility Principle (SRP):* Ogni modulo ha un unico compito specifico e non supera mai le 150 righe di codice.
  * *Observer Pattern (State Manager):* Gestione reattiva centralizzata dello stato applicativo (`State`).
  * *Zero Frameworks:* Nessun framework monolitico (React, Vue, Angular), massima velocità e totale trasparenza didattica.

### 🖌️ CSS3 Modulare & Custom Properties
* **Ruolo:** Stile grafico e Design System Dark Modern in stile BlasOpen.
* **Organizzazione:** Suddivisione per responsabilità (`variables.css`, `layout.css`, `toast.css`, `thumbnails.css`, `toolbar.css`, `tools.css`, `textTool.css`, `imageTool.css`, `converter.css`, `themes/modern.css`).

### 🔄 Disaccoppiamento Centro Conversioni
* **Organizzazione:** Vista a schede e dashboard separate in `converterManager.js`, mentre i flussi batch locali (`Immagini ➔ PDF`, `PDF ➔ Immagini`, `PDF ➔ Testo`, `Ottimizza PDF`) sono isolati in `converterActions.js` nel rispetto del limite di 150 righe.

---

## 🤖 4. Motore di Intelligenza Artificiale (Pianificato per v2.0.0)

### 🦙 Ollama (Modalità Locale on-device)
* **Ruolo:** Inferenza locale on-device per l'Agente AI senza trasmissione cloud.

# 🗺️ Specifiche Tecniche — Prossime Implementazioni (v1.1.0 & v2.0.0)

Questo documento definisce in modo dettagliato i requisiti architetturali, i flussi utente e le specifiche tecniche delle funzionalità di **BlasPDF**, nel pieno rispetto della **Costituzione di BlasOpen** (Art. 1 Local-First, Art. 4 limite $\le 150$ righe per file, Art. 5 didattica e Art. 6 privacy AI).

---

## ✅ 1. Inserimento Immagini Multi-formato (COMPLETATO v1.1.0)
* **Formati Supportati:** `.png` (con trasparenza 32-bit), `.jpg`/`.jpeg`, `.webp`, `.svg`, `.bmp`, `.gif`.
* **Transcodifica in Memoria:** Normalizzazione automatica via `OffscreenCanvas` in `imageTool.js`.
* **Manipolazione & Ridimensionamento:** Maniglie d'angolo `.resize-handle` per scaling proporzionale con aspect-ratio locking e barra comandi contestuale fluttuante in `imageToolbar.js`.
* **Baking Vettoriale Permanente:** Incorporamento nativo con `pdf-lib` via `doc.embedPng` e `doc.embedJpg` in `annotationBake.js`.

---

## ✅ 2. Centro Conversioni Locale (COMPLETATO v1.1.0)
* **Navigazione a Schede:** Switch istantaneo tra `[ 📄 Editor ]` e `[ 🔄 Conversioni ]` gestito da `converterManager.js` con azioni batch isolate in `converterActions.js`.
* **A. 🖼️ Immagini ➔ PDF:** Batch conversione immagini con orientamento configurabile in `imagesToPdf.js`.
* **B. 📸 PDF ➔ Immagini:** Rasterizzazione ad alta definizione (150 DPI) in PNG con `pdfToImages.js`.
* **C. 📝 PDF ➔ Testo:** Estrazione massiva strutturata in `.txt` / `.md` con `pdfToText.js`.
* **D. 🗜️ Ottimizzazione PDF:** Compressione stream di oggetti COS con `useObjectStreams` in `pdfOptimizer.js`.

---

## 🤖 3. Agente AI Locale & Privacy (Roadmap Futura v2.0.0)

### Obiettivo
Integrare un assistente intelligente conversazionale in grado di analizzare, riassumere e rispondere a domande sul documento aperto, nel rigoroso rispetto dell'**Art. 6 della Costituzione di BlasPDF**.

### Architettura Dual-Mode

#### Modalità Locale di Default (Ollama on-device)
* **Endpoint:** `http://localhost:11434/api` (REST API).
* **Rilevamento Automatico:** Al caricamento, interroga `GET /api/tags` per verificare lo stato di Ollama e popolare l'elenco dei modelli installati (es. `llama3.2`, `mistral`, `qwen2.5`, `phi3`).
* **Streaming in Tempo Reale:** Utilizza `ReadableStream` con decoder UTF-8 per mostrare le parole generate.
* **Privacy Assoluta:** 100% offline, nessun dato lascia la macchina dell'utente, zero telemetria.

#### Modalità Cloud Opzionale (con Disclaimer Obbligatorio)
* Per gli utenti sprovvisti di GPU o RAM sufficiente a eseguire modelli on-device.
* Schermata di avviso visivo obbligatorio e conferma esplicita prima di qualsiasi trasmissione di token verso server terzi.

### Azioni Rapide con un Clic
* **📝 Riassumi Pagina:** Formula una sintesi chiara dei concetti chiave della pagina visualizzata.
* **🔍 Estrai Punti Chiave:** Elenco puntato di scadenze, cifre, clausole contrattuali e nomi.
* **💡 Spiega Concetto:** Spiega in parole semplici termini tecnici o clausole legali.
* **💬 Chat Libera:** Domande aperte con memoria contestuale del documento.

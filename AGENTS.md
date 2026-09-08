# 📜 Costituzione del Progetto BlasPDF (Regole per l'Intelligenza Artificiale)

Questo documento definisce le regole di sviluppo, didattica e struttura del codice che l'Intelligenza Artificiale deve **tassativamente rispettare** durante l'intero ciclo di vita del progetto **BlasPDF**, in armonia con la **Costituzione Generale di BlasOpen**.

---

## 1. Didattica Approfondita e Teoria Obbligatoria
- L'AI **non deve mai** limitarsi a fornire codice pronto senza spiegarlo didatticamente.
- Ogni concetto (albero delle pagine PDF, dizionari COS, cross-reference table XRef, rendering rasterizzato su Canvas HiDPI con PDF.js, stream vettoriali di modifica con pdf-lib, inferenza AI locale con Ollama e sovranità dei dati) deve essere accompagnato da una **spiegazione teorica dettagliata**.

---

## 2. Commenti Dettagliati in Italiano nel Codice
- Tutti i file di codice sorgente proprietario (Rust `.rs`, JavaScript `.js`, CSS `.css`, HTML `.html`) **devono essere commentati rigorosamente in lingua italiana** in modo chiaro, preciso ed esaustivo.
- Ogni modulo, funzione, comando IPC, struttura dati e gestore eventi deve contenere commenti esplicativi che ne illustrino lo scopo teorico e pratico.

---

## 3. Documentazione e Struttura dei Manuali (`docs/` e `docs/manuali/`)
- **Teoria**: Per ogni nuovo modulo o funzionalità sviluppata, l'AI **ha l'obbligo** di creare o aggiornare i file di teoria dedicati in `docs/`:
  - `docs/01_struttura_file_pdf.md`: Oggetti COS, XRef table e stream di contenuto.
  - `docs/02_rendering_canvas.md`: Viewport, rasterizzazione e gestione schermi Retina/HiDPI.
  - `docs/03_manipolazione_pagine.md`: Algoritmi di merge, split, riordino e rotazione.
  - `docs/04_redazione_e_overlay.md`: Meccaniche di bianchetto permanente e overlay testo/firme.
  - `docs/05_agenti_ai_local_first.md`: Architettura RAG locale, integrazione Ollama e privacy.
- **Manuali**: Tutti i manuali utente risiedono nella sottocartella `docs/manuali/`:
  - `docs/manuali/manuale_utente.md`: Guida illustrata passo-passo per l'utente finale.
- **Tecnologie**: Il file `docs/tecnologie_utilizzate.md` deve censire e descrivere tutti gli strumenti impiegati.

---

## 4. Modularizzazione e Limite Tassativo delle 150 Righe di Codice
- Il codice deve essere fortemente **modulare**, organizzato in file con responsabilità singola (Single Responsibility Principle).
- **Limite Tassativo delle 150 Righe**: Nessun file sorgente proprietario scritto da noi (`.rs`, `.js`, `.css`, `.html`) deve superare le 150 righe di codice.
- **Avviso Automatico**: Ogni volta che un file sorgente proprietario si avvicina o supera le **150 righe di codice**, l'AI **deve notificarlo esplicitamente all'utente** e procedere alla suddivisione del file in sottomoduli.
- **Eccezione per Librerie Esterne**: I file minificati di terze parti (come `pdf.min.js`, `pdf-lib.min.js`) posizionati in `src/vendor/` non sono soggetti a questo limite.

---

## 5. Regola Zero-Terminal e Architettura Local-First
- **Nessun obbligo di terminale**: L'utente finale deve poter avviare l'applicazione semplicemente con un doppio clic sul bundle `BlasPDF.app` o tramite lo script launcher `./blaspdf`.
- **Local-First & Privacy Assoluta**: Tutti i file elaborati rimangono esclusivamente nella memoria volatile o sul disco locale del computer dell'utente. Nessun file PDF viene caricato o trasmesso a server cloud.

---

## 6. Agente AI a Doppia Modalità (Ollama Default & Cloud con Avviso)
- **Modalità Locale di Default**: L'assistente AI deve connettersi prioritariamente all'istanza locale di Ollama (`http://localhost:11434`), garantendo zero telemetria e massima riservatezza dei documenti.
- **Modalità Cloud Opzionale**: È ammessa una modalità cloud per chi non dispone di GPU locale, ma **deve essere accompagnata da un avviso visivo esplicito e ben visibile** che informi l'utente prima di qualsiasi trasmissione di testo verso server esterni.

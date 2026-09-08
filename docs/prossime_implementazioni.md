# 🗺️ Specifiche Tecniche — Prossime Implementazioni (v1.1.0 & v2.0.0)

Questo documento definisce in modo dettagliato i requisiti architetturali, i flussi utente e le specifiche tecniche delle funzionalità pianificate per le prossime versioni di **BlasPDF**, a completamento della suite locale e nel pieno rispetto della **Costituzione di BlasOpen** (Art. 1 Local-First, Art. 4 limite $\le 150$ righe per file, Art. 5 didattica e Art. 6 privacy AI).

---

## 🖼️ 1. Inserimento Immagini Multi-formato (Timbri, Loghi e Firme Esterne)

### Obiettivo
Consentire all'utente di arricchire o timbrare le pagine del documento PDF inserendo immagini grafiche in qualunque formato comune, preservando la trasparenza (canale Alpha) e le proporzioni geometriche originali.

### Formati Supportati
* **Nativi PDF-Lib:** `.png` (con trasparenza a 32-bit), `.jpg` / `.jpeg`.
* **Formati Moderni e Vettoriali con Transcodifica in Memoria:** `.webp`, `.svg`, `.bmp`, `.gif`.
  * *Meccanismo di Normalizzazione:* Se l'utente carica un file WebP o SVG, l'applicazione lo carica in un elemento `new Image()` in memoria e lo rasterizza su un `OffscreenCanvas` trasparente, estraendone il `dataUrl` PNG senza toccare il disco né inviare dati a server esterni.

### Esperienza Utente & Interfaccia
1. **Pulsante dedicato:** `🖼️ Immagine` nella barra degli strumenti (accanto allo strumento Firma).
2. **Dialogo di Selezione:** Apertura file nativa tramite `pick_file` di Tauri con filtri estensioni immagini.
3. **Posizionamento e Manipolazione:**
   - L'immagine viene collocata al centro del foglio mantenendo le proporzioni corrette (*aspect-ratio*).
   - Con lo strumento `👆 Cursore`, l'immagine può essere trascinata ovunque sulla pagina.
   - Maniglie agli angoli per il ridimensionamento proporzionale (*bounding box scaling*).
4. **Baking Vettoriale Permanente:**
   - In `bakeAnnotationsToPdf`, `doc.embedPng(dataUrl)` o `doc.embedJpg(dataUrl)` incorpora il flusso binario compresso nel dizionario `/XObject` della pagina con coordinate Cartesiane corrette:
     $$\text{pdfY} = \text{pageHeight} - (\text{normY} \times \text{pageHeight}) - \text{boxHeight}$$

### Moduli da Creare
* `src/js/tools/imageTool.js` ($\le 150$ righe): Gestione caricamento, transcodifica canvas e creazione annotazione.
* `src/css/imageTool.css` ($\le 150$ righe): Maniglie di ridimensionamento e stili perimetrali.

---

## 🔄 2. Centro Conversioni Locale (Stile iLovePDF Offline)

### Obiettivo
Offrire una schermata dedicata e moderna ispirata all'esperienza d'uso di *iLovePDF*, operante interamente in memoria locale sul computer dell'utente (100% offline, zero upload, zero abbonamenti).

### Navigazione a Schede (Multi-View)
Nella barra superiore viene inserito un selettore di vista:
```text
+-----------------------------------------------------------------------+
| BlasPDF  |  [ 📄 Editor Documento ]   [ 🔄 Centro Conversioni ]       |
+-----------------------------------------------------------------------+
```
Il clic su **Centro Conversioni** alterna la vista corrente a una dashboard a schede moderne (*Dashboard Grid*).

### Gli Strumenti del Centro Conversioni

#### A. 🖼️ Immagini ➔ PDF (Batch Image to PDF)
* **Descrizione:** Seleziona o trascina una serie di immagini (anche di formati diversi: PNG, JPG, WebP).
* **Funzionamento:**
  1. L'utente può riordinare la sequenza delle immagini con trascinamento.
  2. Può scegliere l'orientamento della pagina (Verticale A4, Orizzontale o formato nativo immagine).
  3. Il motore `imagesToPdf.js` crea un nuovo `PDFDocument`, incorpora le immagini e genera un unico PDF compatto.
  4. Salvataggio istantaneo su disco con `pick_and_save_pdf`.

#### B. 📸 PDF ➔ Immagini (PDF to High-Res Images)
* **Descrizione:** Estrae ogni pagina di un documento PDF come immagine autonoma in formato **PNG** o **JPEG**.
* **Funzionamento:**
  1. L'utente sceglie la risoluzione desiderata (150 DPI per visualizzazione web, 300 DPI per stampa tipografica Retina).
  2. Il motore `pdfToImages.js` itera le pagine, effettua il rendering con PDF.js a scala maggiorata e converte i canvas in blob di immagini.
  3. Esporta le immagini in una cartella locale o permette il download singolo/cumulativo.

#### C. 📝 PDF ➔ Testo (.txt / .md)
* **Descrizione:** Estrae il testo puro strutturato del documento per archiviazione, copia rapida o elaborazione con linguaggi di programmazione.
* **Funzionamento:**
  1. `pdfToText.js` esegue `page.getTextContent()` per ogni foglio.
  2. Ricostruisce i paragrafi separando le pagine con intestazioni pulite (`--- Pagina 1 ---`).
  3. Salva un file `.txt` o `.md` leggero e consultabile su qualsiasi computer.

#### D. 🗜️ Ottimizzazione & Compressione PDF
* **Descrizione:** Analizza lo stream COS del documento, rimuovendo metadati ridondanti, oggetti orfani e ricampionando immagini interne ad alto peso.

### Moduli da Creare
* `src/css/converter.css` ($\le 150$ righe): Stili griglia responsive, card hover e drop-zone conversioni.
* `src/js/converter/converterManager.js` ($\le 150$ righe): Gestione switch di vista ed eventi card.
* `src/js/converter/imagesToPdf.js` ($\le 150$ righe): Motore conversione batch immagini.
* `src/js/converter/pdfToImages.js` ($\le 150$ righe): Rasterizzazione ad alta definizione ed export immagini.
* `src/js/converter/pdfToText.js` ($\le 150$ righe): Estrazione testuale massiva.

---

## 🤖 3. Agente AI Locale & Privacy (Local-First Document Assistant)

### Obiettivo
Integrare un assistente intelligente conversazionale in grado di analizzare, riassumere e rispondere a domande sul documento aperto, nel rigoroso rispetto dell'**Art. 6 della Costituzione di BlasPDF**.

### Architettura Dual-Mode

#### Modalità Locale di Default (Ollama on-device)
* **Endpoint:** `http://localhost:11434/api` (REST API).
* **Rilevamento Automatico:** Al caricamento, interroga `GET /api/tags` per verificare lo stato di Ollama e popolare l'elenco dei modelli installati (es. `llama3.2`, `mistral`, `qwen2.5`, `phi3`).
* **Streaming in Tempo Reale:** Utilizza `ReadableStream` con decoder UTF-8 per mostrare le parole man mano che vengono generate dal modello, senza attese a vuoto.
* **Privacy Assoluta:** 100% offline, nessun dato lascia la macchina dell'utente, zero telemetria.

#### Modalità Cloud Opzionale (con Disclaimer Obbligatorio)
* Per gli utenti sprovvisti di GPU o RAM sufficiente a eseguire modelli on-device:
* Schermata di avviso visivo obbligatorio e conferma esplicita prima di qualsiasi trasmissione di token verso server terzi:
  > *"Avviso di Privacy: L'utilizzo di un provider cloud trasmette il testo della pagina selezionata a server esterni. Assicurati che il documento non contenga dati protetti da segreto professionale o GDPR prima di procedere."*

### Azioni Rapide con un Clic
* **📝 Riassumi Pagina:** Formula una sintesi chiara dei concetti chiave della pagina visualizzata.
* **🔍 Estrai Punti Chiave:** Elenco puntato di scadenze, cifre, clausole contrattuali e nomi.
* **💡 Spiega Concetto:** Spiega in parole semplici termini tecnici, formule o clausole legali.
* **💬 Chat Libera:** Domande aperte con memoria contestuale del documento.

### Moduli da Creare
* `src/css/ai.css` ($\le 150$ righe): Stili chat laterale, fumetti utente/assistente e badge di stato.
* `src/js/ai/pdfTextExtractor.js` ($\le 150$ righe): Estrazione del testo da PDF.js per la pagina o l'intero file.
* `src/js/ai/ollamaClient.js` ($\le 150$ righe): Client HTTP con streaming per Ollama locale.
* `src/js/ai/aiPanelManager.js` ($\le 150$ righe): Gestore interfaccia chat, cronologia e chip veloci.
* `docs/05_agenti_ai_local_first.md`: Capitolo teorico didattico su RAG desktop e sovranità del dato.

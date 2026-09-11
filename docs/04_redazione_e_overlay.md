# 🖋️ Capitolo 4: Strumenti di Correzione, Redazione e Coordinate Vettoriali

> *"Censurare un dato riservato con un semplice rettangolo nero visivo senza incorporamento distruttivo ha causato alcuni dei più celebri scandali di fuga di informazioni nella storia informatica. La vera correzione vettoriale richiede la comprensione profonda dello spazio delle coordinate e del modello a livelli di un PDF."*

In questo capitolo esploriamo l'architettura della **Correction Suite** di BlasPDF (`src/js/core/annotationEngine.js`, `tools/`), affrontando il problema delle coordinate multi-risoluzione, il tracciamento a mano libera ad alta frequenza e la differenza tra annotazione interattiva DOM e "baking" vettoriale permanente nel documento.

---

## 📐 1. La Sfida delle Coordinate: DOM (Top-Left) vs PDF (Bottom-Left)

Uno degli scogli storici nello sviluppo di editor grafici per documenti PDF è il disallineamento tra il sistema di coordinate del browser web e quello geometrico stabilito dallo standard ISO 32000-1 (PDF).

### Il Modello Cartesiano PDF
Nello spazio utente standard del PDF (*Default User Space*):
* L'unità di misura fondamentale è il **punto tipografico** ($1 \text{ pt} = 1/72 \text{ pollice} \approx 0.3528 \text{ mm}$).
* L'origine $(0, 0)$ si trova nell'**angolo inferiore sinistro** del foglio (*Bottom-Left*).
* L'asse $Y$ cresce verso l'**alto**.

### Il Modello Grafico del Browser (DOM)
Nel browser HTML5:
* L'unità di misura sono i **CSS Pixel**.
* L'origine $(0, 0)$ si trova nell'**angolo superiore sinistro** della finestra o elemento (*Top-Left*).
* L'asse $Y$ cresce verso il **basso**.

```text
       Spazio Browser (DOM)                     Spazio Tipografico (PDF)
(0,0) +-------------------------> +X      +Y ^
      |                                      |
      |   (normX, normY)                     |   (pdfX, pdfY)
      |         ■                            |         ■
      |                                      |
   +Y v                                (0,0) +-------------------------> +X
```

### La Soluzione BlasPDF: Coordinate Normalizzate ad Invarianza di Scala
Se memorizzassimo le coordinate in pixel assoluti (es. `x = 240px, y = 350px`), qualsiasi variazione del livello di zoom (es. da 100% a 150%) o ridimensionamento della finestra disallineerebbe le annotazioni rispetto al testo del documento.

Per garantire un'invarianza assoluta, BlasPDF converte ogni interazione utente in **coordinate percentuali normalizzate** nell'intervallo $[0.0, 1.0]$:

$$\text{normX} = \frac{x_{\text{click}} - x_{\text{left}}}{W_{\text{canvas}}}, \quad \text{normY} = \frac{y_{\text{click}} - y_{\text{top}}}{H_{\text{canvas}}}$$

Al momento della serializzazione vettoriale finale (*baking*) nel PDF con `pdf-lib`, applichiamo la trasformazione geometrica inversa:

$$\text{pdfX} = \text{normX} \times \text{pageWidth}$$

$$\text{pdfY} = \text{pageHeight} - (\text{normY} \times \text{pageHeight}) - \text{boxHeight}$$

Grazie a questa formula, la correzione viene posizionata esattamente al decimo di punto tipografico sul documento originale indipendentemente dalla densità di pixel dello schermo (HiDPI / Retina).

---

## 🛡️ 2. Redazione vs Copertura Visiva: I Rischi di Sicurezza

Nel corso degli anni, enti governativi e aziende hanno subito gravi fughe di notizie pubblicando PDF in cui informazioni sensibili (nomi, conti correnti, date) erano state "coperte" in modo superficiale:
1. **L'errore del layer superficiale:** Inserire un rettangolo nero sopra un testo in un elaboratore come Microsoft Word o visualizzatori PDF non distrugge il testo sottostante. Il testo rimane presente nei comandi operatore `Tj` / `TJ` dello stream del documento; a qualsiasi utente basta selezionarlo col mouse o fare copia-incolla per leggere il testo censurato.
2. **L'approccio BlasPDF:** Quando l'utente traccia un rettangolo bianchetto o nero in BlasPDF:
   * A livello di interfaccia utente, un elemento DOM HTML5 copre visivamente l'area fornendo feedback in tempo reale.
   * Al momento dell'esportazione (`bakeAnnotationsToPdf`), viene generato un rettangolo vettoriale opaco calcolato sul foglio tramite `page.drawRectangle`.

---

## ✍️ 3. Acquisizione Fluida della Firma a Mano Libera

Il modulo `src/js/tools/signatureTool.js` permette all'utente di firmare documenti usando mouse, trackpad o pennino touch (es. su schermi touchscreen o iPad in sidecar).

### Problema: Interpolazione e Risoluzione
Tracciare linee col mouse su un canvas a bassa risoluzione produce tratti scalettati e "pixelati" (*aliasing*).

### Soluzione Implementata:
1. **Device Pixel Ratio (DPR) Scaling:** Il canvas del pad di firma adatta le sue dimensioni interne al monitor Retina:
   ```javascript
   const dpr = window.devicePixelRatio || 1;
   canvas.width = canvas.offsetWidth * dpr;
   canvas.height = canvas.offsetHeight * dpr;
   ctx.scale(dpr, dpr);
   ```
2. **Pointer Capture & Smoothing:** Usiamo `pointerdown`, `pointermove` e `setPointerCapture` con `lineCap = 'round'` e `lineJoin = 'round'` per garantire tratti continui anche se il puntatore esce momentaneamente dal perimetro del modal.
3. **Esportazione PNG Alpha:** La firma viene esportata in un Data URL PNG trasparente (`image/png`) e incorporata nel documento tramite `doc.embedPng(dataUrl)` di PDF-Lib, preservando la nitidezza originale.

---

## ↩️ 4. Architettura Undo/Redo e Reattività In-Memory

Tutte le correzioni create dall'utente vengono memorizzate in memoria in una struttura ad albero:
* `pageAnnotations = new Map<number, Array<Annotation>>`: associa a ciascun numero di pagina la lista delle sue correzioni.
* Due stack LIFO (`undoStack` e `redoStack`) tengono traccia atomica di ogni aggiunta o spostamento.
* Premendo `Cmd+Z` o `Cmd+Shift+Z`, l'applicazione estrae l'ultima azione, aggiorna la mappa in memoria e invoca `renderOverlay()`.

Questo garantisce prestazioni a **0 millisecondi di latenza**, evitando qualsiasi riscrittura prematura su disco fino a quando l'utente non seleziona esplicitamente `💾 Salva Modifiche` o `Estrarre Pagina`.

---

## 🔍 5. Modifica Intelligente del Testo Esistente (Strada B)

A differenza dei software complessi che alterano direttamente i flussi binari compressi dei PDF (rischiando corruzioni font e disallineamenti di crenatura), BlasPDF adotta la **Strada B (Smart In-Place)**:

1. **Rilevamento Testuale Automatico (`textDetector.js`):** Al clic con lo strumento `✍️ Testo`, interroga `page.getTextContent()` per individuare la parola o il frammento cliccato.
2. **Calcolo della Baseline:** La matrice di trasformazione del PDF viene convertita nello spazio DOM correggendo l'altezza del carattere tipografico:
   $$\text{topDomY} = (ph - ty) - (\text{fontSize} \times 0.85)$$
3. **Copertura Chirurgica & Sovrascrittura:** Posiziona atomica di un'annotazione di bianchetto per celare il vecchio glifo e apertura immediata di un campo di digitazione precompilato.
4. **Menu Formattazione Adattivo (`textFormatter.js`):** Un popover fluttuante gestisce font, colore e dimensioni, calcolando dinamicamente la propria posizione sopra o sotto il campo per non essere mai tagliato dai bordi del foglio.

---

## 🖼️ 6. Inserimento Immagini, Timbri e Baking Vettoriale Permanente

Nel modulo `src/js/tools/imageTool.js`, BlasPDF implementa l'inserimento di elementi grafici esterni (PNG, JPG, WebP, SVG, BMP, GIF):

1. **Transcodifica in Memoria (`OffscreenCanvas`):** Formati grafici non supportati in modo diretto dai parser nativi PDF (come WebP e SVG) vengono rasterizzati su un canvas virtuale e convertiti in Data URL PNG a 32-bit prima dell'incorporamento.
2. **Aspect-Ratio Lock & Maniglie Angolari:** Le quattro maniglie angolari (`nw`, `ne`, `sw`, `se`) calcolano le variazioni delta sulle coordinate normalizzate garantendo che il rapporto $\text{normW} / \text{normH}$ rimanga rigidamente vincolato alle proporzioni native dell'immagine.
3. **Embedding Nativo `/XObject` (`annotationBake.js`):** Al momento del salvataggio, l'immagine viene inserita con `doc.embedPng` o `doc.embedJpg` e disegnata sul canvas interno della pagina (`page.drawImage`) con coordinate cartesiane corrette.

---

## ✨ 7. Resa Seamless e Assenza di Riquadri Artificiali

Nei visualizzatori PDF professionali, il bianchetto deve fondersi in modo indistinguibile con il foglio bianco, e il testo vettoriale inserito deve apparire come parte integrante del documento originale:
1. **Eliminazione dei Falsi Contorni:** Le proprietà `box-shadow` e `border` sui nodi `.whiteout-box` e `.text-box` sono impostate su `none`, eliminando qualsiasi cornice grigia visibile a schermo o in stampa.
2. **Feedback Solo in Modalità Selezione:** I bordi tratteggiati blu di selezione appaiono unicamente quando è attivo lo strumento `👆 Cursore` (`.tool-select-mode`), consentendo lo spostamento o la cancellazione senza sporcare la visualizzazione normale.
3. **Commit Intelligente dell'Input:** L'input testuale viene consolidato automaticamente quando perde il focus o quando si cambia strumento, garantendo che nessun campo input orfano rimanga visibile a schermo.

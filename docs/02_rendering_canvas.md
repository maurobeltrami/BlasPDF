# 🎨 Capitolo 2: Rendering Vettoriale su Canvas e Gestione HiDPI Retina

> *"Visualizzare un PDF non significa semplicemente mostrare un'immagine: significa interpretare un intero motore di disegno vettoriale ed eseguirlo a 60 FPS senza rallentare l'interfaccia."*

In questo capitolo esploriamo l'architettura teorica e pratica adottata in **BlasPDF** per convertire gli stream vettoriali del formato PDF in pixel ad altissima risoluzione sullo schermo, sfruttando il motore **PDF.js** e l'API Canvas di HTML5 accelerata via hardware.

---

## 🧵 1. Architettura Multi-Thread: L'uso dei Web Worker

Il parsing di un documento PDF richiede operazioni computazionalmente gravose:
* Decompressione di stream zlib/flate (`/FlateDecode`).
* Decodifica binaria di immagini incorporate (JPEG, CCITT, JBIG2, JPX).
* Interpretazione di font Type 1, TrueType e OpenType.
* Ricostruzione della tabella XRef.

Se queste operazioni avvenissero nel thread principale dell'applicazione (Main UI Thread), la finestra si bloccherebbe ad ogni cambio pagina, producendo fastidiosi freeze dell'interfaccia.

```text
+--------------------------------------------------------------------+
|                         MAIN UI THREAD (60 FPS)                    |
| - Gestione eventi utente (Click, Drag & Drop, Zoom)               |
| - Rendering su elemento <canvas id="pdfCanvas">                    |
| - Ricezione comandi di disegno trasformati                         |
+---------------------------------+----------------------------------+
                                  | PostMessage (Canale IPC interno)
                                  v
+---------------------------------+----------------------------------+
|                    WEB WORKER (pdf.worker.min.mjs)                 |
| - Decompressione Flate / Zlib in background                        |
| - Decodifica vettoriale e parsing oggetti COS                      |
| - Compilazione delle istruzioni di disegno (Draw Operations)       |
+--------------------------------------------------------------------+
```

Per questo motivo, in `src/js/core/pdfRenderer.js` abbiamo configurato il worker locale dedicato:
```javascript
pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.mjs';
```
Questo garantisce che l'interfaccia utente rimanga sempre fluida e reattiva a 60 fotogrammi al secondo.

---

## 📐 2. Geometria e Sistemi di Coordinate: PDF vs Web Canvas

Uno degli ostacoli teorici più frequenti nella manipolazione di PDF è la divergenza tra i sistemi di riferimento geometrico:

| Proprietà | Sistema PDF Originario | Sistema Canvas / Schermo |
| :--- | :--- | :--- |
| **Origine $(0,0)$** | **In basso a sinistra** del foglio | **In alto a sinistra** dello schermo |
| **Asse Y** | Cresce verso l'**alto** | Cresce verso il **basso** |
| **Unità di Misura** | Punti tipografici ($1\text{ pt} = \frac{1}{72}\text{ in}$) | Pixel logici (CSS Pixels) |

Per proiettare il documento sul canvas, PDF.js calcola un oggetto **`Viewport`** che applica una matrice di trasformazione affine $3 \times 3$:

$$\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \begin{bmatrix} s & 0 & 0 \\ 0 & -s & h \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix}$$

Dove $s$ rappresenta il fattore di zoom (`userScale`) e $h$ è l'altezza totale della pagina in pixel. Questo ribalta l'asse verticale senza deformare testi e grafica.

---

## 🔍 3. Il Problema della Sfocatura: Schermi HiDPI e Retina

Sui moderni computer (inclusi i display Retina di macOS o monitor 4K Windows), un singolo "pixel logico CSS" corrisponde in realtà a **4 o 9 pixel fisici** sulla matrice hardware dello schermo ($2\times$ o $3\times$ densità).

Se creassimo un canvas delle dimensioni logiche (es. $800 \times 600$), il sistema operativo eseguirebbe un upscale bicubico della texture, rendendo il testo del PDF sgranato e poco professionale.

### La Soluzione Adottata in BlasPDF:
In `pdfRenderer.js` separiamo rigorosamente la dimensione fisica del buffer di rendering dalla dimensione visiva CSS:

```javascript
const pixelRatio = window.devicePixelRatio || 1;
const viewport = page.getViewport({ scale: userScale });

// 1. Buffer di rendering fisico (moltiplicato per 2x o 3x)
canvas.width = Math.floor(viewport.width * pixelRatio);
canvas.height = Math.floor(viewport.height * pixelRatio);

// 2. Dimensione visiva a schermo (stile CSS invariato)
canvas.style.width = `${Math.floor(viewport.width)}px`;
canvas.style.height = `${Math.floor(viewport.height)}px`;

// 3. Adattamento della matrice di disegno del contesto 2D
context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
```
Grazie a questa formula, i testi, i diagrammi tecnici e le immagini rasterizzate appaiono con una nitidezza straordinaria su qualsiasi schermo Retina o HiDPI.

---

## 🛑 4. Gestione della Concorrenza: Il Pattern di Cancellazione

Cosa accade se un utente preme rapidamente i tasti freccia per sfogliare 5 pagine di fila in mezzo secondo?
Se non gestito, il browser avvierebbe 5 render concorrenti sullo stesso canvas, producendo sfarfallii (flickering) e memory leak.

Per prevenire questo fenomeno, manteniamo una variabile globale `activeRenderTask`. Prima di ogni nuovo rendering:
```javascript
if (activeRenderTask) {
    try { 
        activeRenderTask.cancel(); 
    } catch (_) {}
}
```
Se un'operazione precedente è ancora in corso, viene abortita istantaneamente via segnale di interruzione, lasciando il canvas pulito e pronto per la pagina più recente richiesta dall'utente.

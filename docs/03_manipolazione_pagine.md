# 📑 Capitolo 3: Manipolazione dell'Albero delle Pagine (Merge, Split, Rotazione e Riordino)

> *"In un PDF le pagine non sono semplici file affiancati, ma nodi di un albero gerarchico di oggetti vettoriali. Manipolare le pagine significa mutare questo grafo senza rompere i riferimenti interni."*

In questo capitolo analizziamo i fondamenti teorici e gli algoritmi implementati in `src/js/core/pdfModifier.js` tramite la libreria **PDF-Lib** per ruotare, eliminare, unire, dividere e riordinare i fogli di un documento PDF in modo 100% locale, lossless (senza perdita di qualità) e istantaneo.

---

## 🌳 1. L'Albero delle Pagine e il Dizionario `/Pages`

Come introdotto nel Capitolo 1, la struttura fisica di un documento PDF organizza le pagine in un albero bilanciato:

```text
               +-------------------+
               |  Root (Catalog)   |
               +---------+---------+
                         |
                         v
               +-------------------+
               |  Pages (Parent)   |  << /Type /Pages /Count 3 /Kids [ 2 0 R, 3 0 R, 4 0 R ] >>
               +----+----+----+----+
                    |    |    |
        +-----------+    |    +-----------+
        v                v                v
+---------------+ +---------------+ +---------------+
| Page 1 (Leaf) | | Page 2 (Leaf) | | Page 3 (Leaf) |
+---------------+ +---------------+ +---------------+
```

Ogni operazione di manipolazione strutturale agisce su questo albero:
* **`/Kids`:** Array ordinato di riferimenti a oggetti indiretti che rappresentano i fogli.
* **`/Count`:** Numero intero di pagine discendenti.

---

## ⟳ 2. Rotazione Lossless a Costo Computazionale Zero (`/Rotate`)

Nei programmi di grafica tradizionali, ruotare un'immagine comporta la ricalcolazione dei pixel (con potenziale sfocatura per interpolazione) e una ricodifica JPEG pesante.

Nel formato PDF, invece, **la rotazione di una pagina è un'operazione vettoriale pura a costo zero**:
1. Non viene toccato né ricalcolato alcun byte del testo o delle immagini nello stream `/Contents`.
2. Viene semplicemente inserita o aggiornata una chiave intera nel dizionario della pagina:
   ```text
   <<
     /Type /Page
     /Rotate 90     <-- Angolo in gradi in senso orario (0, 90, 180, 270)
     /MediaBox [0 0 595 842]
   >>
   ```
3. Qualsiasi visualizzatore PDF (o browser) leggerà il valore di `/Rotate` ed applicherà istantaneamente la rotazione geometrica durante la fase di rasterizzazione a schermo o in stampa.

In `pdfModifier.js`:
```javascript
const currentAngle = page.getRotation().angle || 0;
const newAngle = (currentAngle + angleDelta + 360) % 360;
page.setRotation(degrees(newAngle));
```

---

## 🗑️ 3. Eliminazione di una Pagina e Coerenza del Documento

Quando eliminiamo una pagina:
1. Il riferimento dell'oggetto indiretto della pagina viene rimosso dall'array `/Kids` del nodo genitore `/Pages`.
2. Il contatore `/Count` viene decrementato di 1.
3. In `pdf-lib`, l'oggetto orfano viene dereferenziato e non verrà incluso nella nuova tabella XRef al momento del salvataggio (`doc.save()`), riducendo la dimensione complessiva del file sul disco.

---

## 🔀 4. La Sfida del Riordino e dell'Unione (Merge): Collisione degli ID

Cosa accade quando vogliamo unire due PDF diversi o riordinare le pagine?

Un file PDF assegna identificatori numerici agli oggetti (`1 0 obj`, `2 0 obj`, `3 0 obj`...). Se prendessimo semplicemente i byte della pagina 1 del Documento B e li incollassimo nel Documento A, si verificherebbe una catastrofica **collisione di identificatori**, perché entrambi i file contengono già un oggetto `1 0 obj` o font con lo stesso nome!

### L'Algoritmo di Clonazione e Re-Indexing:
Per risolvere questo problema, la funzione `copyPages` di PDF-Lib esegue un traversal approfondito del grafo di oggetti:
1. Individua tutti gli oggetti referenziati dalla pagina sorgente (immagini, font Type0, stream vettoriali, dizionari di risorse).
2. Genera nuovi identificatori numerici non utilizzati nel documento di destinazione.
3. Riscrive tutti i riferimenti interni (`IndirectReference`) mappandoli sui nuovi ID.
4. Inserisce la pagina nel nuovo albero senza alcun rischio di conflitti o corruzioni.

```javascript
// Esempio di clonazione pulita senza collisioni in pdfModifier.js:
const newDoc = await PDFDocument.create();
const copiedPages = await newDoc.copyPages(srcDoc, indices);
copiedPages.forEach(p => newDoc.addPage(p));
return await newDoc.save();
```

---

## ✂️ 5. Estrazione Pagine (Split)

L'estrazione funziona con la medesima eleganza matematica:
1. Viene creato un documento PDF completamente nuovo e vuoto (`PDFDocument.create()`).
2. Vengono clonate esclusivamente le pagine selezionate (es. solo la pagina 2).
3. Il nuovo documento conterrà una tabella XRef minimale, un nuovo catalogo `/Root` e un unico albero `/Pages` con `/Count 1`, pronto per essere scaricato o inviato localmente senza tracce delle pagine rimosse.

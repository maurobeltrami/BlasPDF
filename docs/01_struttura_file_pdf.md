# 📚 Capitolo 1: Anatomia e Struttura a Basso Livello del Formato PDF

> *"Per manipolare un documento senza dipendere da software proprietari a pagamento, è fondamentale comprendere come i byte sono organizzati all'interno del formato PDF."*

Il formato **PDF (Portable Document Format)**, standardizzato a livello internazionale come **ISO 32000**, è stato concepito per rappresentare documenti in modo del tutto indipendente dall'hardware, dal sistema operativo o dai font installati sul dispositivo di lettura.

A differenza dei formati basati su flusso di testo (come HTML o EPUB), un file PDF è un **linguaggio di descrizione visiva a coordinate fisse**, derivato dal linguaggio PostScript.

---

## 🏛️ 1. Le 4 Sezioni Fondamentali di un File PDF

Se apriamo un qualsiasi file `.pdf` con un editor esadecimale o testuale, notiamo che è strutturato in 4 macro-sezioni ordinate:

```text
+--------------------------------------------------+
| 1. HEADER (%PDF-1.7)                            |  <-- Versione della specifica PDF
+--------------------------------------------------+
| 2. BODY (Oggetti COS)                            |
|    1 0 obj ... endobj                            |  <-- Informazioni su pagine, font,
|    2 0 obj ... endobj                            |      immagini e stream grafici
|    3 0 obj ... endobj                            |
+--------------------------------------------------+
| 3. CROSS-REFERENCE TABLE (xref)                  |
|    0 4                                           |  <-- Tabella degli offset in byte
|    0000000000 65535 f                            |      per accesso casuale istantaneo O(1)
|    0000000015 00000 n                            |
+--------------------------------------------------+
| 4. TRAILER                                       |
|    trailer << /Size 4 /Root 1 0 R >>             |  <-- Punto di ingresso, radice Catalog
|    startxref 542                                 |      e posizione della tabella xref
|    %%EOF                                         |  <-- Marcatore di fine file
+--------------------------------------------------+
```

---

## 🧱 2. L'Architettura COS e i Tipi di Dati

Il livello di base del PDF è chiamato **COS (Carousel Object System)**. Tutto all'interno del PDF è un oggetto appartenente a uno dei seguenti 8 tipi primitivi:

1. **Booleani:** `true` o `false`.
2. **Numeri:** Interi (`42`) o a virgola mobile (`3.1415`).
3. **Stringhe:** Racchiuse tra parentesi tonde `(Ciao Mondo)` o in esadecimale `<4369616F>`.
4. **Nomi:** Identificatori univoci che iniziano con uno slash `/` (es. `/Type`, `/Page`, `/Font`).
5. **Array:** Sequenze ordinate di oggetti racchiuse tra parentesi quadre: `[ 1 0 0 1 50 100 ]`.
6. **Dizionari:** Coppie chiave-valore delimitate da `<<` e `>>`:
   ```text
   <<
     /Type /Page
     /Parent 2 0 R
     /MediaBox [ 0 0 595.28 841.89 ]
   >>
   ```
7. **Stream:** Blocchi contigui di dati binari (testo compresso, immagini JPEG, font incorporati):
   ```text
   3 0 obj
   << /Length 58 /Filter /FlateDecode >>
   stream
   ... (dati binari compressi con Deflate / Zlib) ...
   endstream
   endobj
   ```
8. **Oggetti Indiretti:** Numerati univocamente con identificatore numerico e generazione: `id gen obj ... endobj` (es. `12 0 obj`). Possono essere richiamati da qualsiasi punto del documento tramite un riferimento `12 0 R`.

---

## 🌳 3. L'Albero delle Pagine (Page Tree)

Un documento PDF non contiene una semplice lista di pagine, bensì una **struttura ad albero gerarchica** per consentire una navigazione rapida anche su documenti di migliaia di fogli:

1. Il **Trailer** punta alla radice **`/Root`** (chiamata `Catalog`).
2. Il `Catalog` punta al nodo principale **`/Pages`**.
3. Il nodo `/Pages` può contenere altri nodi intermedi o direttamente le foglie **`/Page`**.
4. Ciascuna pagina `/Page` definisce:
   * **`/MediaBox`**: Le dimensioni fisiche del foglio in punti tipografici ($1\text{ pt} = \frac{1}{72}\text{ pollice}$). Un foglio A4 è $595.28 \times 841.89\text{ pt}$.
   * **`/Resources`**: Font, palette colori e immagini utilizzate nella pagina.
   * **`/Contents`**: Il flusso di istruzioni grafiche vettoriali che disegna la pagina.

---

## ⚡ 4. La Tabella XRef: Accesso O(1) e Modifiche Incrementali

La vera forza del formato PDF risiede nella tabella **XRef (Cross-Reference)** posizionata alla fine del file. 

Quando un lettore come **BlasPDF** apre un file da 1 GB:
1. Legge gli ultimi byte del file per trovare il marcatore `%%EOF` e l'offset `startxref`.
2. Salta all'istante alla tabella `xref`, che contiene l'esatto byte-offset di ogni oggetto nel disco.
3. Può caricare **solo la pagina richiesta** senza dover decomprimere l'intero documento in RAM!

### Perché questa teoria è fondamentale per la nostra Suite:
Nelle fasi successive (Manipolazione, Bianchetto, Testo), **BlasPDF** sfrutterà la libreria `pdf-lib` per riscrivere o iniettare stream vettoriali direttamente in questo albero di oggetti, garantendo che le modifiche siano permanenti, vettoriali e non semplici sovrapposizioni visive superficiali.

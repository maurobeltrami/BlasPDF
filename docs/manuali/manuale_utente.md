# 📖 Manuale Utente — BlasPDF

Benvenuto nel **Manuale Utente Ufficiale** di **BlasPDF**, la suite desktop libera e priva di abbonamenti per visualizzare, correggere e manipolare documenti PDF in totale sicurezza e riservatezza.

---

## 🚀 1. Primo Avvio (Regola Zero-Terminal)

BlasPDF è stato progettato per chiunque, inclusi gli utenti non esperti di informatica. Non devi digitare comandi né configurare ambienti di programmazione:

* **🍏 Su macOS:** Fai semplicemente doppio clic sull'applicazione `BlasPDF.app` (o avvia lo script `./blaspdf`).
* **🪟 Su Windows:** Avvia l'eseguibile `BlasPDF.exe` con un doppio clic.
* **🐧 Su Linux:** Fai doppio clic sul file `BlasPDF.AppImage`.

All'avvio, l'applicazione si apre istantaneamente mostrando la schermata principale scura con l'area di rilascio documenti.

---

## 📂 2. Come Aprire un Documento PDF

Puoi caricare un file PDF in tre modalità immediate:

1. **Trascinamento (Drag & Drop):** Trascina qualsiasi file `.pdf` dalla scrivania o dal Finder/Esplora Risorse direttamente all'interno della finestra del programma.
2. **Pulsante della Barra:** Fai clic sul pulsante **`📂 Apri PDF`** posizionato in alto a sinistra. Si aprirà la finestra di dialogo del computer per scegliere il file.
3. **Pulsante Dimostrativo:** Se stai provando il programma per la prima volta, fai clic su **`📄 Prova Esempio`** al centro della schermata per caricare all'istante il documento di test a 3 pagine incorporato.

---

## 📑 3. Navigazione tra le Pagine

BlasPDF offre molteplici modi comodi per sfogliare i documenti:

* **Barra delle Miniature (Sidebar Sinistra):** Mostra l'anteprima grafica in scala di ogni pagina. Fai semplicemente clic sulla miniatura desiderata per visualizzarla all'istante al centro dello schermo.
* **Pulsanti di Navigazione:** Usa i tasti **`◀`** (precedente) e **`▶`** (successiva) nella barra superiore. L'indicatore al centro ti mostrerà sempre la posizione esatta (es. `Pagina 2 / 3`).
* **Scorciatoie da Tastiera:**
  * `Freccia Destra` oppure `Page Down`: Avanza alla pagina successiva.
  * `Freccia Sinistra` oppure `Page Up`: Torna alla pagina precedente.

---

## 🔍 4. Regolazione dello Zoom

Per garantire la massima leggibilità anche di testi piccoli, fatture o planimetrie:

* Fai clic sui pulsanti **`-`** e **`+`** posizionati accanto all'indicatore percentuale (es. `100%`).
* **Scorciatoie da Tastiera:**
  * Tasto `+` (o `=`): Ingrandisci il documento.
  * Tasto `-`: Riduci le dimensioni.

Grazie al motore di rendering ad alta risoluzione, i caratteri e le linee rimarranno sempre perfettamente nitidi e privi di sgranature, anche con zoom elevati su monitor Retina e 4K.

---

---

## 📑 5. Manipolazione e Riordino delle Pagine (Fase 3)

BlasPDF ti permette di organizzare i tuoi documenti con la massima semplicità, senza ricorrere a costosi software ad abbonamento:

* **Riordino delle Pagine con Drag & Drop:**
  * Nella barra laterale a sinistra, fai clic e tieni premuto su qualsiasi miniatura di pagina.
  * Trascinala nella nuova posizione desiderata e rilasciala: l'ordine delle pagine del documento verrà aggiornato istantaneamente!
* **Rotazione Pagine (90°):**
  * Passa il cursore sulla miniatura della pagina desiderata e clicca sull'icona circolare **`⟳`**, oppure fai clic sul pulsante **`⟳ Ruota`** nella barra superiore (o premi il tasto **`R`** sulla tastiera). Ogni clic ruota la pagina di 90 gradi in senso orario senza alcuna perdita di qualità visiva.
* **Eliminazione di Pagine:**
  * Clicca sull'icona del cestino **`🗑️`** in alto a destra sulla miniatura della pagina, oppure sul pulsante **`🗑️ Elimina`** nella barra. Ti verrà richiesta una rapida conferma di sicurezza per evitare cancellazioni involontarie.
* **Unione di più PDF (Merge):**
  * Fai clic sul pulsante **`➕ Unisci PDF`** nella barra superiore e seleziona un secondo file PDF dal tuo computer: tutte le sue pagine verranno accodate automaticamente alla fine del documento attivo.
* **Estrazione Pagine (Split):**
  * Fai clic sul pulsante **`✂️ Estrai`** per generare all'istante un nuovo documento PDF autonomo contenente esclusivamente la pagina correntemente visualizzata.

---

## 🛠️ 6. Suite di Correzione e Modifica Intelligente (Fase 4)

BlasPDF integra una suite completa per correggere e annotare i documenti:

* **🖍️ Bianchetto & Oscuramento (Redaction):**
  * Seleziona lo strumento **`🖍️ Bianchetto`** e trascina un rettangolo sull'area da cancellare.
  * Tieni premuto il tasto **`Shift`** o **`Alt`** durante il trascinamento per creare un rettangolo di censura **nero opaco**, ideale per dati riservati o oscuramento di fatture.
* **✍️ Testo & Modifica Intelligente del Testo Esistente:**
  * Seleziona lo strumento **`✍️ Testo`**.
  * **Modifica testo esistente (Smart In-Place):** Fai semplicemente clic su una parola o frase del documento originale. BlasPDF individua automaticamente le coordinate esatte, applica un bianchetto di fondo invisibile e apre un campo di digitazione con il testo già selezionato e un menu fluttuante di formattazione.
  * **Nuovo testo:** Fai clic su un punto vuoto del foglio per inserire un'annotazione ex novo.
  * **Menu Formattazione Fluttuante:** Consente di scegliere la Famiglia di Caratteri (*Helvetica, Times-Roman, Courier*), la dimensione (10-48 pt), il grassetto (**B**) e la tavolozza colori (*Nero, Blu, Rosso, Verde, Bianco*). Conferma con **`✓ Salva`** o annulla con **`✕ Annulla`** (oppure premi `Invio` o `Esc`).
* **✒️ Firma Grafica a Mano Libera:**
  * Fai clic su **`✒️ Firma`** per aprire la finestra di tracciamento ad alta precisione (HiDPI Retina).
  * Firma con mouse, trackpad o penna touch, premi **`Pulisci`** per cancellare o **`Usa Firma`** per incollarla sul foglio con trasparenza nativa.
* **👆 Cursore & Spostamento:**
  * Con lo strumento **`👆 Cursore`** attivo, puoi cliccare e trascinare qualsiasi firma o elemento inserito per riposizionarlo millimetricamente.
* **↩ Annulla & ↪ Ripristina:**
  * Fai clic sui pulsanti **`↩ Annulla`** e **`↪ Ripristina`** nella barra o usa le scorciatoie **`Cmd+Z`** / **`Cmd+Shift+Z`** (`Ctrl+Z` su Windows/Linux) per viaggiare nella cronologia delle modifiche.

---

## 💾 7. Salvataggio e Protezione Chiusura Finestra

* **Salvataggio Documento:** Fai clic su **`💾 Salva PDF`** nella barra superiore per esportare il documento definitivo. Tutte le correzioni, firme e testi vengono integrati (*baked*) in formato vettoriale ad alta definizione.
* **Chiusura Protetta con Rilevamento Modifiche:** Se provi a chiudere la finestra con modifiche non salvate, BlasPDF blocca la chiusura immediata e mostra una finestra di dialogo di sicurezza con tre scelte:
  1. **`💾 Salva ed Esci`**: salva il file su disco e chiude l'app.
  2. **`Non Salvare`**: chiude l'applicazione scartando le modifiche.
  3. **`Annulla`**: torna all'editor per proseguire il lavoro.

---

## 🖼️ 8. Inserimento di Immagini e Timbri (Novità v1.1.0)

Puoi inserire timbri, loghi o immagini grafiche direttamente sopra le pagine del documento:
* **Formati Accettati:** PNG (anche con trasparenza alpha), JPG/JPEG, WebP, SVG, BMP e GIF.
* **Come Inserire:** Clicca sul pulsante **`🖼️ Immagine`** nella barra superiore e seleziona il file desiderato.
* **Spostamento e Ridimensionamento:**
  * Seleziona lo strumento **`👆 Cursore`** per posizionare l'immagine con precisione millimetrica sul foglio.
  * Usa le 4 **maniglie d'angolo** per ridimensionare l'immagine preservando rigorosamente le proporzioni originali senza alcuna distorsione (*aspect-ratio lock*).
* **Barra Comandi Rapidi Fluttuante:**
  Quando l'immagine è selezionata, compare una comoda barra superiore con comandi rapidi:
  * **↔️ Centra Orizzontalmente:** allinea l'immagine al centro dell'asse X della pagina.
  * **↕️ Centra Verticalmente:** allinea l'immagine al centro dell'asse Y della pagina.
  * **🎯 Centra nella Pagina:** combina la centratura orizzontale e verticale.
  * **📏 Adatta Larghezza:** allarga l'immagine al 90% della larghezza del foglio preservando il rapporto di forma.
  * **🔍 Dimensione 100%:** ripristina la scala proporzionale standard dell'immagine.
  * **🔄 Ruota 90°:** ruota i pixel dell'immagine in senso orario riadattando il riquadro di selezione.
  * **🪞 Capovolgi Orizzontale:** specchia l'immagine a specchio sull'asse orizzontale.
  * **📑 Duplica:** crea istantaneamente una copia esatta dell'immagine posizionata leggermente sfalsata.
  * **✕ Elimina:** rimuove l'immagine (disponibile anche tramite tasto `Canc` / `Backspace`).
* **Anteprima Reattiva nella Barra Laterale Sinistra:**
  * Qualsiasi immagine inserita, spostata, ridimensionata o ruotata viene renderizzata istantaneamente in miniatura anche nella colonna delle anteprime di pagina a sinistra.
* **Conferma nell'Anteprima (Clic Fuori):**
  * Quando hai posizionato e dimensionato l'immagine, **fai clic in un punto qualsiasi fuori da essa** (sul foglio o sullo sfondo): i quadratini di ridimensionamento e la toolbar scompariranno. L'immagine rimarrà perfettamente confermata ed inglobata nel documento (puoi anche premere il tasto `Esc`).
* **Riapertura della Modifica (Clic sull'Immagine):**
  * Facendo clic sopra l'immagine confermata con lo strumento Cursore attivo, la sessione di modifica si riapre all'istante ripristinando maniglie e toolbar comandi.
* **Baking Vettoriale:** Al momento del salvataggio con `💾 Salva`, l'immagine viene incorporata nativamente nella struttura interna del PDF come oggetto `/XObject`.

---

## 🔄 9. Centro Conversioni Offline (Stile iLovePDF Locale - Novità v1.1.0)

Nella barra superiore, fai clic sulla scheda **`[ 🔄 Conversioni ]`** per accedere alla dashboard batch degli strumenti di trasformazione documenti:
* **🖼️ Immagini ➔ PDF:** Raggruppa e trasforma un pacchetto di immagini in un unico documento PDF multi-pagina con orientamento automatico.
* **📸 PDF ➔ Immagini (Hi-Res Retina):** Esporta le pagine del documento in immagini PNG ad alta definizione tipografica (150 DPI per uso digitale o 300 DPI per stampa).
* **📝 PDF ➔ Testo (.txt / .md):** Estrae tutto il testo strutturato con separatori di pagina per consentire copie rapide, archiviazione o elaborazioni testuali offline.
* **🗜️ Ottimizza PDF:** Analizza il documento ed elimina elementi orfani abilitando la compressione degli stream di oggetti COS (*Object Streams*), con visualizzazione immediata della percentuale di spazio risparmiato.
*(Per la guida approfondita, consulta [Guida Centro Conversioni e Immagini](guida_centro_conversioni_e_immagini.md)).*

---

## 🔒 10. Privacy e Sovranità dei Dati

Tutti i documenti caricati in BlasPDF risiedono **esclusivamente nella memoria locale del tuo computer**. Nessun file o metadato viene inviato a server cloud, garantendo la totale conformità con la normativa sulla privacy e la massima protezione del segreto professionale.

---

## 🗺️ 11. Prossime Novità (Roadmap v2.0.0)

La prossima grande release di BlasPDF introdurrà l'**Assistente AI Locale** integrato con Ollama on-device per l'analisi intelligente, il riassunto e la chat contestuale sui documenti. Per tutti i dettagli architetturali, consulta [docs/05_agenti_ai_local_first.md](../05_agenti_ai_local_first.md) e [Specifiche Tecniche Prossime Implementazioni](../prossime_implementazioni.md).

# 📖 Manuale Utente: Inserimento Immagini & Centro Conversioni Offline

Questo manuale illustra le funzionalità introdotte nella versione **v1.1.0** di **BlasPDF**, dedicate all'arricchimento visuale dei documenti tramite immagini/timbri e alle conversioni batch multi-formato operate al 100% in locale sul tuo computer.

---

## 🖼️ 1. Inserimento di Immagini e Timbri nel Documento

Puoi inserire timbri digitali, loghi aziendali, firme esterne o qualsiasi immagine grafica direttamente sulle pagine del PDF:

1. **Apertura Strumento:**
   - Clicca sull'icona `🖼️ Immagine` nella barra degli strumenti superiore.
2. **Selezione File:**
   - Si aprirà la finestra di dialogo nativa per selezionare l'immagine desiderata.
   - Sono supportati tutti i principali formati: **PNG** (con canale alpha di trasparenza), **JPG/JPEG**, **WebP**, **SVG**, **BMP** e **GIF**.
3. **Posizionamento e Ridimensionamento:**
   - L'immagine viene collocata al centro del foglio preservando le proporzioni originali.
   - Attiva lo strumento `👆 Cursore` per trascinare l'immagine in qualsiasi punto della pagina.
   - Trascina le **maniglie d'angolo** per ingrandire o rimpicciolire l'immagine senza mai deformarla (*aspect ratio lock*).
4. **Salvataggio Permanente (Baking Vettoriale):**
   - Cliccando su `💾 Salva`, l'immagine viene incorporata in modo indelebile nel PDF finale come oggetto grafico `/XObject` ad alta fedeltà visiva.

---

## 🔄 2. Il Centro Conversioni Offline (Stile iLovePDF Locale)

Nella parte sinistra della barra superiore troverai il selettore a schede:
- `[ 📄 Editor ]` — per la visualizzazione e correzione delle pagine del documento.
- `[ 🔄 Conversioni ]` — per accedere alla dashboard degli strumenti di trasformazione batch.

Tutte le operazioni avvengono interamente nella memoria RAM del tuo dispositivo: **nessun file viene inviato a server cloud**.

### A. 🖼️ Immagini ➔ PDF (Batch Image to PDF)
- **Cosa fa:** Raggruppa e converte una serie di immagini in un unico documento PDF multi-pagina.
- **Come usarlo:** Clicca sulla card, seleziona una o più immagini dal tuo computer e il documento PDF verrà generato all'istante e salvato nella cartella scelta.

### B. 📸 PDF ➔ Immagini (Hi-Res Retina)
- **Cosa fa:** Esporta ciascuna pagina del PDF come immagine ad alta definizione a 150 DPI in formato PNG o JPEG.
- **Come usarlo:** Clicca sulla card; se hai già un documento aperto nell'editor verrà convertito direttamente, altrimenti potrai selezionare qualsiasi PDF dal disco.

### C. 📝 PDF ➔ Testo (.txt / .md)
- **Cosa fa:** Estrae tutto il contenuto testuale del documento preservando la divisione per righe e pagine (`--- PAGINA X ---`).
- **Come usarlo:** Clicca sulla card per salvare il file di testo `.txt` o `.md`, perfetto per archiviazione, copia rapida o analisi offline.

### D. 🗜️ Ottimizza PDF
- **Cosa fa:** Analizza la struttura COS del PDF, eliminando elementi ridondanti e abilitando la compressione degli stream di oggetti (*Object Streams*).
- **Come usarlo:** Clicca sulla card per comprimere il file e visualizzare il report del risparmio di spazio ottenuto (in percentuale e KB).

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
* **Plugin Utilizzati:**
  * `tauri-plugin-dialog`: Finestre di dialogo native di apertura/salvataggio file.
  * `tauri-plugin-fs`: Accesso al file system protetto e controllato da permessi.

---

## 📄 2. Motori PDF & Elaborazione Grafica

### 🔴 Mozilla PDF.js (v4.10)
* **Ruolo:** Motore di rasterizzazione e parsing di documenti PDF.
* **Architettura:** Funzionamento disaccoppiato tramite Web Worker dedicato (`pdf.worker.min.mjs`), che garantisce il rendering continuo a 60 FPS senza bloccare i thread dell'interfaccia.
* **Integrazione Local-First:** Incluso direttamente nella directory `src/vendor/` per consentire il funzionamento al 100% offline, senza dipendenze da server o CDN esterni.

### 🟢 PDF-Lib (v1.17)
* **Ruolo:** Motore di manipolazione vettoriale e mutazione dell'albero COS delle pagine.
* **Funzionalità:** Unione di più PDF, divisione in fogli separati, estrazione, rotazione e inserimento permanente di rettangoli (bianchetto/redazione) e testi vettoriali.

---

## 🎨 3. Frontend & Design System

### 🌐 Vanilla JavaScript (ES2022 Modules)
* **Ruolo:** Logica applicativa dell'interfaccia utente.
* **Pattern Adottati:**
  * *Single Responsibility Principle (SRP):* Ogni modulo ha un unico compito specifico.
  * *Observer Pattern (State Manager):* Gestione reattiva centralizzata dello stato applicativo (`State`), con notifiche automatiche ai componenti registrati.
  * *Zero Frameworks:* Nessun framework monolitico (React, Vue, Angular). Il codice sorgente rimane snello, direttamente ispezionabile e privo di layer di astrazione superflui.

### 🖌️ CSS3 Modulare & Custom Properties
* **Ruolo:** Stile grafico e Design System Dark Modern in stile BlasOpen.
* **Organizzazione:** Suddivisione per responsabilità (`variables.css`, `layout.css`, `toolbar.css`, `themes/modern.css`).

---

## 🤖 4. Motore di Intelligenza Artificiale (Dual-Mode)

### 🦙 Ollama (Modalità Locale di Default)
* **Ruolo:** Inferenza locale on-device per l'Agente AI.
* **Protocollo:** Connessione HTTP REST all'endpoint locale `http://localhost:11434/v1` compatibile con le API standard.
* **Etica e Privacy:** Nessun byte di testo o dato del documento lascia il computer dell'utente. Massima sovranità e conformità GDPR per documenti confidenziali.

### ☁️ Provider Cloud (Modalità Opzionale con Avviso)
* **Ruolo:** Supporto per utenti sprovvisti di GPU locale per eseguire modelli on-device.
* **Sicurezza:** Schermata di avviso visivo obbligatorio e conferma esplicita prima di inviare qualsiasi porzione di testo a server esterni.

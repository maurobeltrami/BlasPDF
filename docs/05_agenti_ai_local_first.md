# 🤖 Capitolo 5: Agenti AI Local-First, Integrazione Ollama e Privacy

> *"L'Intelligenza Artificiale non deve trasformarsi in una lente d'ingrandimento sui documenti privati dell'utente. La sovranità dei dati impone che l'elaborazione avvenga sul silicio del proprio dispositivo, offline e sotto il totale controllo dell'utente."*

Questo capitolo definisce i fondamenti teorici, architetturali e operativi per l'integrazione dell'**Agente AI Local-First** in **BlasPDF**, nel rigoroso rispetto dell'Articolo 1 della **Costituzione di BlasOpen** e dell'Articolo 6 di **AGENTS.md**.

---

## 🏛️ 1. Principi di Sovranità e Privacy dei Dati

Nella manipolazione di documenti PDF (contratti, dichiarazioni dei redditi, referti medici, fatture, tesi di laurea), la privacy non è un optional:
1. **Zero Cloud di Default:** Nessun frammento di testo o metadato del documento deve essere trasmesso a endpoint cloud non autorizzati.
2. **Inferenza On-Device:** L'elaborazione del linguaggio naturale avviene tramite Large Language Model eseguiti localmente dall'utente sfruttando la GPU o la CPU del computer.
3. **Trasparenza Totale:** Nel caso in cui l'utente scelga esplicitamente una modalità remota per assenza di hardware idoneo, l'applicazione deve mostrare un avviso visivo chiaro e richiedere conferma preventiva prima di inviare dati.

---

## 🦙 2. Architettura di Connessione: Ollama su `localhost:11434`

BlasPDF adotta **Ollama** come motore standard di inferenza locale:
* **Interfaccia REST Locale:** Ollama espone un server HTTP leggero su `http://localhost:11434`.
* **Discovery Automatica dei Modelli:** All'apertura della scheda AI, l'applicazione interroga `GET /api/tags` per rilevare i modelli presenti (es. `llama3.2`, `mistral`, `qwen2.5`, `phi3`).
* **Generazione in Streaming:** La richiesta di inferenza viene inviata a `POST /api/generate` o `POST /api/chat` abilitando `"stream": true`. Il frontend legge la risposta progressiva tramite l'API standard `ReadableStream` e `TextDecoder`, aggiornando il testo in tempo reale con feedback immediato a 60 FPS.

---

## 📚 3. Retrieval-Augmented Generation (RAG) Locale e Chunking

Per consentire a modelli compatti (1B - 7B parametri) di rispondere con precisione a domande su documenti estesi:
1. **Estrazione Strutturata del Testo:** Con Mozilla PDF.js (`page.getTextContent()`), il testo viene estratto preservando l'ordine di lettura e i separatori di pagina.
2. **Chunking Semantico:** Il testo viene suddiviso in blocchi (*chunks*) di circa 500-1000 token con una sovrapposizione (*overlap*) del 10% per evitare perdite di contesto ai bordi dei paragrafi.
3. **Iniezione Contestuale:** Durante la formulazione di un prompt (es. *"Riassumi la pagina 3"* o *"Quali sono i termini di pagamento?"*), il chunk rilevante viene iniettato nel blocco di contesto del prompt di sistema.

---

## ⚡ 4. Azioni Rapide a Singolo Clic (Prompt Predefiniti)

L'interfaccia utente metterà a disposizione pulsanti dedicati:
* **📝 Riassumi Pagina:** Fornisce una sintesi concisa dei punti chiave del foglio attivo.
* **🔍 Estrai Dati Chiave:** Elenca automaticamente scadenze, importi economici, clausole vincolanti e nominativi.
* **💡 Spiega Concetto:** Traduce in linguaggio divulgativo clausole burocratiche o tecnicismi complessi.
* **💬 Chat Contestuale:** Interazione conversazionale libera con memoria della sessione di lavoro corrente.

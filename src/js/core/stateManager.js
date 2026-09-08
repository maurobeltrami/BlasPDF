// stateManager.js - Gestione reattiva e centralizzata dello stato applicativo
export const State = {
    pdfDoc: null,
    pdfBytes: null,
    fileName: null,
    filePath: null,
    currentPage: 1,
    totalPages: 0,
    zoomScale: 1.0,
    activeTool: 'select', // 'select' | 'whiteout' | 'text' | 'sign'
    isAiOpen: false,
    modifications: {}, // Pagine modificate con annotazioni/bianchetto
};

const listeners = new Set();

/**
 * Registra un osservatore per essere notificato ai cambiamenti di stato
 * @param {Function} callback Funzione da invocare con il nuovo stato
 */
export function subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

/**
 * Notifica tutti gli osservatori registrati
 * @param {string} property Proprietà aggiornata
 */
function notify(property) {
    listeners.forEach(fn => fn(State, property));
}

/**
 * Aggiorna una proprietà dello stato ed emette una notifica
 * @param {string} key Chiave di stato
 * @param {any} value Nuovo valore
 */
export function setProperty(key, value) {
    if (State[key] !== value) {
        State[key] = value;
        notify(key);
    }
}

/**
 * Imposta un nuovo documento PDF caricato
 * @param {Object} docInfo Dati del file e delle pagine
 */
export function setLoadedDocument({ fileName, filePath, pdfBytes, totalPages }) {
    State.fileName = fileName;
    State.filePath = filePath;
    State.pdfBytes = pdfBytes;
    State.totalPages = totalPages;
    State.currentPage = 1;
    State.zoomScale = 1.0;
    notify('documentLoaded');
}

/**
 * Cambia pagina attiva
 * @param {number} pageNum Numero di pagina (1-based)
 */
export function setCurrentPage(pageNum) {
    if (pageNum >= 1 && pageNum <= State.totalPages) {
        State.currentPage = pageNum;
        notify('currentPage');
    }
}

/**
 * Modifica il fattore di zoom
 * @param {number} delta Variazione zoom (es. +0.15 o -0.15)
 */
export function adjustZoom(delta) {
    const newZoom = Math.min(Math.max(State.zoomScale + delta, 0.4), 3.0);
    State.zoomScale = parseFloat(newZoom.toFixed(2));
    notify('zoomScale');
}

/**
 * Seleziona lo strumento attivo di modifica
 * @param {string} tool Nome strumento
 */
export function setActiveTool(tool) {
    State.activeTool = tool;
    notify('activeTool');
}

/**
 * Mostra o nasconde il pannello dell'Agente AI
 */
export function toggleAiPanel() {
    State.isAiOpen = !State.isAiOpen;
    notify('isAiOpen');
}

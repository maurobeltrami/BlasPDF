// pageActions.js - Gestione comandi della barra superiore per manipolazione pagine
import { State, updateDocumentBytes } from '../core/stateManager.js';
import { loadPdf, renderPage } from '../core/pdfRenderer.js';
import { rotatePage, deletePage, mergePdfs, extractPages } from '../core/pdfModifier.js';
import { generateThumbnails } from '../ui/pageThumbnails.js';
import { base64ToUint8Array, uint8ArrayToBase64 } from './exportManager.js';

function ensureDocumentLoaded() {
    if (!State.pdfBytes || State.totalPages === 0) {
        alert("Apri prima un file PDF per utilizzare questa funzione.");
        return false;
    }
    return true;
}

/**
 * Ruota di 90 gradi orari la pagina attualmente visualizzata
 */
export async function rotateCurrentPage() {
    if (!ensureDocumentLoaded()) return;
    try {
        const newBytes = await rotatePage(State.pdfBytes, State.currentPage, 90);
        await reloadDocument(newBytes, State.currentPage);
    } catch (err) {
        console.error("Errore rotazione pagina:", err);
        alert(`Impossibile ruotare la pagina: ${err.message || err}`);
    }
}

/**
 * Elimina la pagina attualmente visualizzata
 */
export async function deleteCurrentPage() {
    if (!ensureDocumentLoaded()) return;
    if (State.totalPages <= 1) return alert("Impossibile eliminare l'unica pagina del documento.");
    if (!confirm(`Confermi l'eliminazione definitiva della Pagina ${State.currentPage}?`)) return;

    try {
        const pageToDelete = State.currentPage;
        const newBytes = await deletePage(State.pdfBytes, pageToDelete);
        const newTotal = State.totalPages - 1;
        const targetPage = Math.min(pageToDelete, newTotal);
        await reloadDocument(newBytes, targetPage, newTotal);
    } catch (err) {
        console.error("Errore eliminazione pagina:", err);
        alert(`Impossibile eliminare la pagina: ${err.message || err}`);
    }
}

/**
 * Avvia il flusso di unione PDF (nativo Tauri o tramite input file web)
 */
export async function handleMergePdf() {
    if (!ensureDocumentLoaded()) return;
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (invoke) {
        try {
            const res = await invoke('pick_and_read_pdf');
            if (res) await executeMerge(base64ToUint8Array(res.base64_data));
            return;
        } catch (err) {
            console.warn('Fallback a input web per unione PDF:', err);
        }
    }
    document.getElementById('mergeFileInput')?.click();
}

/**
 * Esegue l'unione effettiva di un buffer binario al documento corrente
 */
async function executeMerge(appendBytes) {
    try {
        const newBytes = await mergePdfs(State.pdfBytes, appendBytes);
        const appendDoc = await loadPdf(appendBytes);
        const addedPages = appendDoc.numPages;
        const newTotal = State.totalPages + addedPages;
        await reloadDocument(newBytes, State.currentPage, newTotal);
        alert(`Unione completata! Aggiunte ${addedPages} nuove pagine.`);
    } catch (err) {
        console.error("Errore durante l'unione del PDF:", err);
        alert("Impossibile unire il file PDF selezionato.");
    }
}

/**
 * Unisce un file PDF proveniente da input HTML5
 */
export async function mergeSecondaryPdf(file) {
    if (!ensureDocumentLoaded() || !file) return;
    try {
        const appendBuffer = await file.arrayBuffer();
        await executeMerge(new Uint8Array(appendBuffer));
    } catch (err) {
        console.error("Errore durante la lettura del file per unione:", err);
    }
}

/**
 * Estrae la pagina corrente e la salva come nuovo file PDF autonomo (Split)
 */
export async function extractCurrentPage() {
    if (!ensureDocumentLoaded()) return;
    try {
        const pageIdx = State.currentPage - 1;
        const newBytes = await extractPages(State.pdfBytes, [pageIdx]);
        const suggestedName = `${(State.fileName || 'documento').replace(/\.pdf$/i, '')}_pagina_${State.currentPage}.pdf`;

        // 1. Percorso Nativo Desktop tramite dialogo di sistema macOS
        const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
        if (invoke) {
            const base64 = uint8ArrayToBase64(newBytes);
            const savedPath = await invoke('pick_and_save_pdf', {
                suggestedName,
                base64Data: base64
            });
            if (savedPath) {
                alert(`Pagina ${State.currentPage} estratta e salvata in:\n${savedPath}`);
            }
            return;
        }

        // 2. Fallback Browser Web
        const blob = new Blob([newBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = Object.assign(document.createElement('a'), { href: url, download: suggestedName });
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
        console.error("Errore durante l'estrazione della pagina:", err);
        alert(`Impossibile estrarre la pagina: ${err.message || err}`);
    }
}

/**
 * Ricarica il documento modificato nel visualizzatore e rinfresca le miniature
 */
async function reloadDocument(newBytes, targetPage, newTotal = State.totalPages) {
    const safeBytes = new Uint8Array(newBytes);
    await loadPdf(safeBytes);
    updateDocumentBytes(safeBytes, { totalPages: newTotal, targetPage });
    const pdfCanvas = document.getElementById('pdfCanvas');
    if (pdfCanvas) await renderPage(State.currentPage, pdfCanvas, State.zoomScale);
    const thumbnailsList = document.getElementById('thumbnailsList');
    if (thumbnailsList) generateThumbnails(thumbnailsList);
}

// fileLoader.js - Gestore del caricamento dei documenti PDF (nativo Tauri e Web)
import { setLoadedDocument } from '../core/stateManager.js';
import { loadPdf, renderPage } from '../core/pdfRenderer.js';
import { generateThumbnails } from '../ui/pageThumbnails.js';
import { base64ToUint8Array } from './exportManager.js';
import { SAMPLE_PDF_BASE64 } from '../data/samplePdfData.js';

/**
 * Apre il file picker nativo (Tauri) o standard browser per selezionare un PDF
 */
export async function openPdfFile() {
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (invoke) {
        try {
            const res = await invoke('pick_and_read_pdf');
            if (res) {
                const bytes = base64ToUint8Array(res.base64_data);
                await processPdfBuffer(bytes, res.file_name, res.file_path);
            }
            return;
        } catch (err) {
            console.warn('Fallback a input web dopo errore dialogo Tauri:', err);
        }
    }
    document.getElementById('hiddenFileInput')?.click();
}

/**
 * Carica il documento dimostrativo locale incorporato
 */
export async function loadSamplePdf() {
    try {
        const resp = await fetch('./assets/sample.pdf');
        if (resp.ok) {
            const buffer = await resp.arrayBuffer();
            await processPdfBuffer(new Uint8Array(buffer), 'sample.pdf', 'assets/sample.pdf');
            return;
        }
    } catch (_) {}
    // Fallback garantito a 0ms tramite buffer Base64 offline
    const bytes = base64ToUint8Array(SAMPLE_PDF_BASE64);
    await processPdfBuffer(bytes, 'sample.pdf', 'assets/sample.pdf');
}

/**
 * Verifica se un oggetto File è un PDF (anche se macOS non imposta il MIME type)
 */
export function isPdfFile(file) {
    if (!file) return false;
    if (file.type === 'application/pdf') return true;
    if (typeof file.name === 'string' && file.name.toLowerCase().endsWith('.pdf')) return true;
    return false;
}

/**
 * Elabora un oggetto File HTML5
 */
export async function handleFileSelection(file) {
    if (!isPdfFile(file)) {
        alert('Seleziona un file in formato PDF valido (.pdf).');
        return;
    }
    try {
        const arrayBuffer = await file.arrayBuffer();
        await processPdfBuffer(new Uint8Array(arrayBuffer), file.name, null);
    } catch (err) {
        console.error('Errore lettura file PDF:', err);
        alert('Impossibile aprire il file selezionato.');
    }
}

/**
 * Elabora i byte del PDF, preservando una copia intatta dello stream e avviando la visualizzazione
 */
export async function processPdfBuffer(pdfBytes, fileName, filePath = null) {
    // Clona il buffer originale per impedire che PDF.js lo azzeri durante il trasferimento al Worker
    const safeBytes = new Uint8Array(pdfBytes.slice(0));
    const workerCopy = new Uint8Array(pdfBytes.slice(0));

    const pdfDoc = await loadPdf(workerCopy);
    const totalPages = pdfDoc.numPages;

    setLoadedDocument({ fileName, filePath, pdfBytes: safeBytes, totalPages });

    const emptyState = document.getElementById('emptyDropState');
    const canvasWrapper = document.getElementById('pdfCanvasWrapper');
    const pdfCanvas = document.getElementById('pdfCanvas');
    const thumbnailsList = document.getElementById('thumbnailsList');

    if (emptyState) emptyState.style.display = 'none';
    if (canvasWrapper) canvasWrapper.style.display = 'block';

    if (pdfCanvas) await renderPage(1, pdfCanvas, 1.0);
    if (thumbnailsList) generateThumbnails(thumbnailsList);
}

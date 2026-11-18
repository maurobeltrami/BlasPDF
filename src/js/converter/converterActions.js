// converterActions.js - Gestori delle operazioni batch offline del Centro Conversioni
import { State } from '../core/stateManager.js';
import { convertImagesToPdf } from './imagesToPdf.js';
import { convertPdfToImages, saveRenderedImage } from './pdfToImages.js';
import { extractTextFromPdf, saveExtractedText } from './pdfToText.js';
import { optimizePdf, saveOptimizedPdf } from './pdfOptimizer.js';
import { base64ToUint8Array } from '../events/exportManager.js';
import { showToast } from '../ui/toast.js';

let isConverting = false;

/**
 * Esegue una conversione in mutua esclusione gestendo stato visuale della card e notifiche
 */
async function runConversionTask(cardId, taskFn) {
    if (isConverting) return;
    const card = document.getElementById(cardId);
    try {
        isConverting = true;
        card?.classList.add('processing');
        await taskFn();
    } catch (err) {
        console.error(`Errore task conversione (${cardId}):`, err);
        showToast(`Errore: ${err.message || err}`, 'error');
    } finally {
        isConverting = false;
        card?.classList.remove('processing');
    }
}

/**
 * Restituisce una copia isolata dei byte del PDF attivo o chiede di selezionarne uno da disco
 */
async function getTargetPdfBytes() {
    if (State.pdfBytes && State.totalPages > 0 && State.pdfBytes.byteLength > 0) {
        return State.pdfBytes.slice(0);
    }
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (!invoke) return null;
    const res = await invoke('pick_and_read_pdf');
    return res ? base64ToUint8Array(res.base64_data) : null;
}

/**
 * Risolve i byte sorgente distinguendo tra documento già aperto in PDF.js (null) o file esterno
 */
async function resolveSourcePdfInput() {
    if (State.pdfBytes && State.totalPages > 0) return { cancelled: false, bytes: null };
    const bytes = await getTargetPdfBytes();
    return bytes ? { cancelled: false, bytes } : { cancelled: true, bytes: null };
}

/**
 * Procedura batch di selezione e unione di immagini in un unico documento PDF
 */
export async function handleImagesToPdf() {
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (!invoke) {
        showToast('Seleziona le immagini tramite l\'applicazione desktop nativa.', 'warning');
        return;
    }

    await runConversionTask('cardImagesToPdf', async () => {
        const list = await invoke('pick_and_read_images');
        if (!list || list.length === 0) return;
        const formatted = list.map(img => ({ dataUrl: `data:${img.mime_type};base64,${img.base64_data}` }));
        const saved = await convertImagesToPdf(formatted, 'portrait');
        if (saved) showToast(`PDF generato con successo da ${list.length} immagini!`, 'success');
    });
}

/**
 * Esporta ciascuna pagina del documento PDF come immagine PNG ad alta risoluzione (150 DPI)
 */
export async function handlePdfToImages() {
    await runConversionTask('cardPdfToImages', async () => {
        const source = await resolveSourcePdfInput();
        if (source.cancelled) return;
        const images = await convertPdfToImages(source.bytes, { dpi: 150, format: 'image/png' });
        if (!images || images.length === 0) return;
        const baseName = State.fileName ? State.fileName.replace(/\.pdf$/i, '') : 'pagina';
        for (const img of images) await saveRenderedImage(img, baseName);
        showToast(`Esportate ${images.length} pagine come immagini PNG con successo.`, 'success');
    });
}

/**
 * Estrae il contenuto testuale strutturato del documento e lo salva su file .txt
 */
export async function handlePdfToText() {
    await runConversionTask('cardPdfToText', async () => {
        const source = await resolveSourcePdfInput();
        if (source.cancelled) return;
        const text = await extractTextFromPdf(source.bytes, false);
        if (!text && text !== '') return;
        const defaultName = State.fileName ? `${State.fileName.replace(/\.pdf$/i, '')}_testo` : 'testo_estratto';
        const res = await saveExtractedText(text, 'txt', defaultName);
        if (res?.success) showToast('Testo estratto e salvato con successo!', 'success');
    });
}

/**
 * Ottimizza gli stream COS del PDF riducendo la dimensione finale su disco
 */
export async function handleOptimizePdf() {
    await runConversionTask('cardOptimizePdf', async () => {
        const bytes = await getTargetPdfBytes();
        if (!bytes) return;
        const res = await optimizePdf(bytes);
        const defaultName = State.fileName ? `ottimizzato_${State.fileName}` : 'documento_ottimizzato.pdf';
        await saveOptimizedPdf(res.optimizedBytes, defaultName);
        showToast(
            `Documento ottimizzato con successo!\nRisparmio spazio: ${res.percentSaved}% (${Math.round(res.savedBytes / 1024)} KB)`,
            'success'
        );
    });
}

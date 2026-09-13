// pdfToImages.js - Esportazione di pagine PDF come immagini ad alta risoluzione (150 / 300 DPI)
import * as pdfjsLib from '../../vendor/pdf.min.mjs';
import { getCurrentDoc } from '../core/pdfRenderer.js';
import { uint8ArrayToBase64 } from '../events/exportManager.js';

/**
 * Converte le pagine di un documento PDF in immagini PNG o JPEG ad alta densità
 */
export async function convertPdfToImages(pdfBytes = null, options = { dpi: 150, format: 'image/png' }, onProgress = null) {
    let pdfDoc = null;
    let isTemporaryDoc = false;

    const currentDoc = getCurrentDoc();
    if (!pdfBytes && currentDoc) {
        pdfDoc = currentDoc;
    } else if (pdfBytes) {
        if (!pdfBytes || pdfBytes.byteLength === 0) {
            throw new Error('Il buffer del file PDF è vuoto o non valido.');
        }
        const safeData = new Uint8Array(pdfBytes.slice(0));
        try {
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdf.worker.min.mjs', import.meta.url).href;
            }
        } catch (_) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.mjs';
        }
        const loadingTask = pdfjsLib.getDocument({ data: safeData });
        pdfDoc = await loadingTask.promise;
        isTemporaryDoc = true;
    } else if (currentDoc) {
        pdfDoc = currentDoc;
    } else {
        throw new Error('Nessun documento PDF disponibile per la conversione in immagini.');
    }

    try {
        const total = pdfDoc.numPages;
        const results = [];
        const scale = (options.dpi || 150) / 72; // Calcolo moltiplicatore DPI

        for (let i = 1; i <= total; i++) {
            if (onProgress) onProgress(i, total);
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            await page.render({ canvasContext: ctx, viewport }).promise;

            const dataUrl = canvas.toDataURL(options.format || 'image/png', 0.92);
            results.push({
                pageNumber: i,
                dataUrl,
                format: options.format === 'image/jpeg' ? 'jpg' : 'png'
            });
        }

        return results;
    } finally {
        if (isTemporaryDoc && pdfDoc) {
            try { await pdfDoc.destroy(); } catch (_) {}
        }
    }
}


/**
 * Salva una singola immagine generata su disco
 */
export async function saveRenderedImage(imgItem, baseName = 'pagina') {
    const fileName = `${baseName}_pag_${imgItem.pageNumber}.${imgItem.format}`;
    const b64 = imgItem.dataUrl.split(',')[1];
    const ext = imgItem.format;

    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (invoke) {
        try {
            return await invoke('pick_and_save_any_file', {
                suggestedName: fileName,
                filterName: ext.toUpperCase(),
                filterExt: ext,
                base64Data: b64
            });
        } catch (err) {
            console.error('Errore salvataggio immagine nativo:', err);
        }
    }

    const a = document.createElement('a');
    a.href = imgItem.dataUrl;
    a.download = fileName;
    a.click();
    return fileName;
}

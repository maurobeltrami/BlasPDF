// pdfToText.js - Estrazione del testo strutturato da documenti PDF in formato TXT o Markdown
import * as pdfjsLib from '../../vendor/pdf.min.mjs';
import { getCurrentDoc } from '../core/pdfRenderer.js';
import { uint8ArrayToBase64 } from '../events/exportManager.js';

/**
 * Estrae il contenuto testuale di ogni pagina ricostruendo righe e paragrafi
 */
export async function extractTextFromPdf(pdfBytes = null, asMarkdown = false, onProgress = null) {
    let doc = null;
    let isTemporaryDoc = false;

    const currentDoc = getCurrentDoc();
    if (!pdfBytes && currentDoc) {
        doc = currentDoc;
    } else if (pdfBytes) {
        if (!pdfBytes || pdfBytes.byteLength === 0) {
            throw new Error('Il buffer del file PDF è vuoto o non valido.');
        }
        // Clona sempre una copia isolata del buffer prima del passaggio a PDF.js per proteggerlo dal detach del Worker
        const safeData = new Uint8Array(pdfBytes.slice(0));
        try {
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdf.worker.min.mjs', import.meta.url).href;
            }
        } catch (_) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.mjs';
        }
        const loadingTask = pdfjsLib.getDocument({ data: safeData });
        doc = await loadingTask.promise;
        isTemporaryDoc = true;
    } else if (currentDoc) {
        doc = currentDoc;
    } else {
        throw new Error('Nessun documento PDF disponibile per l\'estrazione.');
    }

    try {
        let output = '';
        const total = doc.numPages;

        for (let i = 1; i <= total; i++) {
            if (onProgress) onProgress(i, total);
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();

            const separator = asMarkdown
                ? `\n\n## 📄 Pagina ${i}\n\n`
                : `\n\n--- PAGINA ${i} ---\n\n`;

            output += separator;

            // Raggruppa frammenti con stessa coordinata Y per formare le righe
            let lastY = null;
            let line = '';

            for (const item of textContent.items) {
                if (!item || typeof item.str !== 'string') continue;
                const currentY = item.transform ? Math.round(item.transform[5]) : null;
                if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
                    output += line.trim() + '\n';
                    line = '';
                }
                line += item.str + ' ';
                if (currentY !== null) lastY = currentY;
            }
            if (line.trim()) output += line.trim() + '\n';
        }

        return output.trim();
    } finally {
        if (isTemporaryDoc && doc) {
            try { await doc.destroy(); } catch (_) {}
        }
    }
}

/**
 * Salva il testo estratto come file .txt o .md sul computer locale
 */
export async function saveExtractedText(textContent, format = 'txt', defaultName = 'testo_estratto') {
    const fileName = `${defaultName}.${format}`;
    const encoder = new TextEncoder();
    const bytes = encoder.encode(textContent);
    const b64 = uint8ArrayToBase64(bytes);

    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (invoke) {
        try {
            const savedPath = await invoke('pick_and_save_any_file', {
                suggestedName: fileName,
                filterName: format.toUpperCase(),
                filterExt: format,
                base64Data: b64
            });
            return savedPath ? { success: true, path: savedPath } : { success: false, cancelled: true };
        } catch (err) {
            console.error('Errore salvataggio testo nativo:', err);
            throw err;
        }
    }

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true, path: fileName };
}


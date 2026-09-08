// pdfRenderer.js - Motore di rendering PDF HiDPI ad alte prestazioni con PDF.js
import * as pdfjsLib from '../../vendor/pdf.min.mjs';

// Configura il worker locale isolato con URL assoluto garantito
try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdf.worker.min.mjs', import.meta.url).href;
} catch (_) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.mjs';
}

let currentPdfDoc = null;
let activeMainRender = null;
const thumbTasks = new Map();

/**
 * Carica un documento PDF da un buffer binario (ArrayBuffer / Uint8Array)
 */
export async function loadPdf(dataBuffer) {
    if (activeMainRender) {
        try {
            activeMainRender.cancel();
            await activeMainRender.promise.catch(() => {});
        } catch (_) {}
        activeMainRender = null;
    }
    thumbTasks.forEach(task => {
        try { task.cancel(); } catch (_) {}
    });
    thumbTasks.clear();

    // Clona il buffer prima del passaggio al worker per proteggere l'originale
    const workerBuffer = dataBuffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({ data: workerBuffer });
    currentPdfDoc = await loadingTask.promise;
    return currentPdfDoc;
}

/**
 * Restituisce il documento attualmente caricato
 */
export function getCurrentDoc() {
    return currentPdfDoc;
}

/**
 * Effettua il rendering della pagina sul Canvas principale HiDPI
 */
export async function renderPage(pageNum, canvas, userScale = 1.0) {
    if (!currentPdfDoc || !canvas) return null;
    if (activeMainRender) {
        try {
            activeMainRender.cancel();
            await activeMainRender.promise.catch(() => {});
        } catch (_) {}
        activeMainRender = null;
    }

    try {
        const page = await currentPdfDoc.getPage(pageNum);
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: userScale });

        const context = canvas.getContext('2d');
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderTask = page.render({
            canvasContext: context,
            viewport: viewport
        });
        activeMainRender = renderTask;
        await renderTask.promise;
        activeMainRender = null;
        return viewport;
    } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
            console.error('Errore rendering pagina PDF:', err);
        }
        return null;
    }
}

/**
 * Renderizza una miniatura isolata cancellando compiti precedenti sullo stesso canvas
 */
export async function renderThumbnail(pageNum, canvas, targetWidth = 150) {
    if (!currentPdfDoc || !canvas) return;
    if (thumbTasks.has(canvas)) {
        try {
            const old = thumbTasks.get(canvas);
            old.cancel();
            await old.promise.catch(() => {});
        } catch (_) {}
        thumbTasks.delete(canvas);
    }

    try {
        const page = await currentPdfDoc.getPage(pageNum);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const ctx = canvas.getContext('2d');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const task = page.render({ canvasContext: ctx, viewport });
        thumbTasks.set(canvas, task);
        await task.promise;
    } catch (err) {
        // Ignora compiti annullati volontariamente
    } finally {
        thumbTasks.delete(canvas);
    }
}

/**
 * Estrae il testo grezzo da una pagina (fondamenta per l'Agente AI)
 */
export async function extractPageText(pageNum) {
    if (!currentPdfDoc) return '';
    const page = await currentPdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    return textContent.items.map(item => item.str).join(' ');
}

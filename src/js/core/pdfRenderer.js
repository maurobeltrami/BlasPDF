// pdfRenderer.js - Motore di rendering PDF HiDPI ad alte prestazioni con PDF.js
import * as pdfjsLib from '../../vendor/pdf.min.mjs';
import { getPageAnnotations } from './annotationEngine.js';

try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdf.worker.min.mjs', import.meta.url).href;
} catch (_) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.mjs';
}

let currentPdfDoc = null;
let activeMainRender = null;
const thumbTasks = new Map();

export async function loadPdf(dataBuffer) {
    if (activeMainRender) {
        try { activeMainRender.cancel(); await activeMainRender.promise.catch(() => {}); } catch (_) {}
        activeMainRender = null;
    }
    thumbTasks.forEach(task => { try { task.cancel(); } catch (_) {} });
    thumbTasks.clear();
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer.slice(0) });
    currentPdfDoc = await loadingTask.promise;
    return currentPdfDoc;
}

export function getCurrentDoc() { return currentPdfDoc; }

export async function renderPage(pageNum, canvas, userScale = 1.0) {
    if (!currentPdfDoc || !canvas) return null;
    if (activeMainRender) {
        try { activeMainRender.cancel(); await activeMainRender.promise.catch(() => {}); } catch (_) {}
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

        const renderTask = page.render({ canvasContext: context, viewport });
        activeMainRender = renderTask;
        await renderTask.promise;
        activeMainRender = null;
        return viewport;
    } catch (err) {
        if (err?.name !== 'RenderingCancelledException') console.error('Errore rendering PDF:', err);
        return null;
    }
}

/**
 * Renderizza una miniatura isolata disegnando la pagina e le relative annotazioni (immagini, firme, bianchetti)
 */
export async function renderThumbnail(pageNum, canvas, targetWidth = 150) {
    if (!currentPdfDoc || !canvas) return;
    if (thumbTasks.has(canvas)) {
        try { const old = thumbTasks.get(canvas); old.cancel(); await old.promise.catch(() => {}); } catch (_) {}
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

        // Disegna le annotazioni sulla miniatura per aggiornare l'anteprima visiva della barra laterale
        const items = getPageAnnotations(pageNum);
        for (const a of items) {
            const ax = a.normX * canvas.width, ay = a.normY * canvas.height;
            const aw = (a.normW || 0.1) * canvas.width, ah = (a.normH || 0.05) * canvas.height;
            if (a.type === 'whiteout') {
                ctx.fillStyle = a.color || '#ffffff';
                ctx.fillRect(ax, ay, aw, ah);
            } else if ((a.type === 'image' || a.type === 'signature') && a.dataUrl) {
                const img = new Image();
                img.src = a.dataUrl;
                if (!img.complete) await new Promise(r => { img.onload = r; img.onerror = r; });
                try { ctx.drawImage(img, ax, ay, aw, ah); } catch (_) {}
            } else if (a.type === 'text') {
                ctx.fillStyle = a.color || '#000000';
                ctx.font = `${Math.max(3, (a.fontSize || 14) * scale)}px sans-serif`;
                ctx.fillText(a.text, ax, ay + (a.fontSize || 14) * scale);
            }
        }
    } catch (_) {
    } finally {
        thumbTasks.delete(canvas);
    }
}

export async function extractPageText(pageNum) {
    if (!currentPdfDoc) return '';
    const page = await currentPdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    return textContent.items.map(item => item.str).join(' ');
}

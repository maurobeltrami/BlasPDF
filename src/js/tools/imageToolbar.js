// imageToolbar.js - Barra comandi contestuale fluttuante per immagini (Allineamento, Trasformazioni e CRUD)
import { State, setIsModified } from '../core/stateManager.js';
import { deleteAnnotation, addAnnotation } from '../core/annotationEngine.js';
import { refreshPageThumbnail } from '../ui/pageThumbnails.js';

/**
 * Crea e associa la barra comandi fluttuante sopra l'immagine attiva
 */
export function attachImageToolbar(el, ann, onUpdate) {
    const bar = document.createElement('div');
    bar.className = 'image-toolbar-floating';
    bar.innerHTML = `
        <button type="button" class="img-tb-btn" data-act="center-h" title="Centra orizzontalmente">↔️</button>
        <button type="button" class="img-tb-btn" data-act="center-v" title="Centra verticalmente">↕️</button>
        <button type="button" class="img-tb-btn" data-act="center-both" title="Centra nella pagina">🎯</button>
        <span class="img-tb-sep"></span>
        <button type="button" class="img-tb-btn" data-act="fit-w" title="Adatta alla larghezza del foglio">📏</button>
        <button type="button" class="img-tb-btn" data-act="reset-100" title="Reimposta dimensione originale (100%)">🔍</button>
        <span class="img-tb-sep"></span>
        <button type="button" class="img-tb-btn" data-act="rotate-90" title="Ruota di 90° in senso orario">🔄</button>
        <button type="button" class="img-tb-btn" data-act="flip-h" title="Capovolgi orizzontalmente">🪞</button>
        <button type="button" class="img-tb-btn" data-act="duplicate" title="Duplica immagine">📑</button>
        <span class="img-tb-sep"></span>
        <button type="button" class="img-tb-btn btn-del" data-act="delete" title="Elimina immagine (Canc)">✕</button>
    `;

    ['mousedown', 'click', 'pointerdown'].forEach(evt => {
        bar.addEventListener(evt, (e) => e.stopPropagation());
    });

    bar.addEventListener('click', async (e) => {
        const btn = e.target.closest('.img-tb-btn');
        if (!btn) return;
        const act = btn.dataset.act;
        const overlay = document.getElementById('annotationOverlay');
        const pageAspect = (overlay?.clientWidth || 595) / (overlay?.clientHeight || 842);

        if (act === 'center-h') {
            ann.normX = Math.max(0, (1 - ann.normW) / 2);
        } else if (act === 'center-v') {
            ann.normY = Math.max(0, (1 - ann.normH) / 2);
        } else if (act === 'center-both') {
            ann.normX = Math.max(0, (1 - ann.normW) / 2);
            ann.normY = Math.max(0, (1 - ann.normH) / 2);
        } else if (act === 'fit-w') {
            ann.normW = 0.90;
            ann.normH = Math.min(0.90, (ann.normW * pageAspect) / (ann.aspectRatio || 1));
            ann.normX = 0.05;
            ann.normY = Math.max(0, (1 - ann.normH) / 2);
        } else if (act === 'reset-100') {
            ann.normW = 0.30;
            ann.normH = (ann.normW * pageAspect) / (ann.aspectRatio || 1);
            ann.normX = Math.max(0, (1 - ann.normW) / 2);
            ann.normY = Math.max(0, (1 - ann.normH) / 2);
        } else if (act === 'rotate-90') {
            await rotateImagePixels(ann, 90, pageAspect);
        } else if (act === 'flip-h') {
            await flipImagePixels(ann);
        } else if (act === 'duplicate') {
            duplicateImageAnnotation(ann);
            return;
        } else if (act === 'delete') {
            deleteAnnotation(State.currentPage, ann.id);
            refreshPageThumbnail(State.currentPage);
            return;
        }

        setIsModified(true);
        if (onUpdate) onUpdate();
        refreshPageThumbnail(State.currentPage);
    });

    el.appendChild(bar);
}

/**
 * Ruota i pixel dell'immagine nativamente tramite OffscreenCanvas per garantire compatibilità pdf-lib
 */
async function rotateImagePixels(ann, degrees, pageAspect) {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = ann.dataUrl; });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalHeight;
    canvas.height = img.naturalWidth;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((degrees * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    ann.dataUrl = canvas.toDataURL('image/png');
    ann.aspectRatio = (canvas.width || 1) / (canvas.height || 1);

    // Adatta le dimensioni normalizzate ruotate
    ann.normW = Math.min(0.9, ann.normH * pageAspect);
    ann.normH = (ann.normW * pageAspect) / ann.aspectRatio;
    ann.normX = Math.min(Math.max(0, ann.normX), 1 - ann.normW);
    ann.normY = Math.min(Math.max(0, ann.normY), 1 - ann.normH);
}

/**
 * Specchia orizzontalmente i pixel dell'immagine
 */
async function flipImagePixels(ann) {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = ann.dataUrl; });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ann.dataUrl = canvas.toDataURL('image/png');
}

/**
 * Crea una copia identica dell'immagine posizionata con un leggero offset
 */
function duplicateImageAnnotation(ann) {
    addAnnotation(State.currentPage, {
        type: 'image',
        dataUrl: ann.dataUrl,
        normX: Math.min(0.95 - ann.normW, ann.normX + 0.04),
        normY: Math.min(0.95 - ann.normH, ann.normY + 0.04),
        normW: ann.normW,
        normH: ann.normH,
        aspectRatio: ann.aspectRatio,
        fileName: ann.fileName ? `copia_${ann.fileName}` : 'copia_immagine.png'
    });
    refreshPageThumbnail(State.currentPage);
}

// whiteoutTool.js - Strumento interattivo Bianchetto e Redaction oscurante
import { State } from '../core/stateManager.js';
import { addAnnotation } from '../core/annotationEngine.js';

let isDrawing = false;
let startX = 0, startY = 0;
let previewEl = null;

export function initWhiteoutTool(overlayEl) {
    if (!overlayEl) return;

    overlayEl.addEventListener('mousedown', (e) => {
        if (State.activeTool !== 'whiteout' || e.button !== 0) return;
        const rect = overlayEl.getBoundingClientRect();
        isDrawing = true;
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;

        previewEl = document.createElement('div');
        previewEl.className = 'draw-preview-rect';
        previewEl.style.left = `${startX}px`;
        previewEl.style.top = `${startY}px`;
        overlayEl.appendChild(previewEl);
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDrawing || !previewEl) return;
        const rect = overlayEl.getBoundingClientRect();
        const curX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const curY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        const left = Math.min(startX, curX);
        const top = Math.min(startY, curY);
        const width = Math.abs(curX - startX);
        const height = Math.abs(curY - startY);

        previewEl.style.left = `${left}px`;
        previewEl.style.top = `${top}px`;
        previewEl.style.width = `${width}px`;
        previewEl.style.height = `${height}px`;
    });

    window.addEventListener('mouseup', (e) => {
        if (!isDrawing) return;
        isDrawing = false;
        if (!previewEl) return;

        const rect = overlayEl.getBoundingClientRect();
        const curX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const curY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        previewEl.remove();
        previewEl = null;

        const left = Math.min(startX, curX);
        const top = Math.min(startY, curY);
        const width = Math.abs(curX - startX);
        const height = Math.abs(curY - startY);

        if (width > 6 && height > 6 && rect.width > 0 && rect.height > 0) {
            const isBlack = e.shiftKey || e.altKey;
            addAnnotation(State.currentPage, {
                type: 'whiteout',
                normX: left / rect.width,
                normY: top / rect.height,
                normW: width / rect.width,
                normH: height / rect.height,
                color: isBlack ? '#000000' : '#ffffff'
            });
        }
    });
}

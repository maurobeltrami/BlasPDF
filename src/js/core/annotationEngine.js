// annotationEngine.js - Gestione reattiva annotazioni, Undo/Redo e overlay visuale
import { State, setIsModified } from './stateManager.js';
import { bakeAnnotations } from './annotationBake.js';

const pageAnnotations = new Map();
const undoStack = [];
const redoStack = [];

export function getPageAnnotations(p) { return pageAnnotations.get(p) || []; }

export function addAnnotation(p, ann) {
    if (!pageAnnotations.has(p)) pageAnnotations.set(p, []);
    ann.id = ann.id || 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    pageAnnotations.get(p).push(ann);
    undoStack.push({ type: 'add', page: p, item: ann });
    redoStack.length = 0;
    setIsModified(true);
    renderOverlay();
}

export function undo() {
    const act = undoStack.pop();
    if (!act) return;
    const list = pageAnnotations.get(act.page) || [];
    if (act.type === 'add') {
        pageAnnotations.set(act.page, list.filter(a => a.id !== act.item.id));
        redoStack.push(act);
    }
    setIsModified(true);
    renderOverlay();
}

export function redo() {
    const act = redoStack.pop();
    if (!act) return;
    if (act.type === 'add') {
        if (!pageAnnotations.has(act.page)) pageAnnotations.set(act.page, []);
        pageAnnotations.get(act.page).push(act.item);
        undoStack.push(act);
    }
    setIsModified(true);
    renderOverlay();
}

export function renderOverlay() {
    const overlay = document.getElementById('annotationOverlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    const items = getPageAnnotations(State.currentPage);

    items.forEach(a => {
        const el = document.createElement('div');
        el.className = `annotation-item ${a.type}-box ${a.color === '#000000' ? 'black' : 'white'}`;
        el.style.left = `${a.normX * 100}%`;
        el.style.top = `${a.normY * 100}%`;
        if (a.type === 'whiteout' || a.type === 'signature' || a.type === 'image') {
            el.style.width = `${a.normW * 100}%`;
            el.style.height = `${a.normH * 100}%`;
        }
        if ((a.type === 'signature' || a.type === 'image') && a.dataUrl) {
            el.innerHTML = `<img src="${a.dataUrl}" alt="${a.type}" draggable="false" />`;
            if (a.type === 'image') {
                el.innerHTML += `
                    <div class="resize-handle nw" data-handle="nw"></div>
                    <div class="resize-handle ne" data-handle="ne"></div>
                    <div class="resize-handle sw" data-handle="sw"></div>
                    <div class="resize-handle se" data-handle="se"></div>
                `;
            }
        } else if (a.type === 'text') {
            el.textContent = a.text;
            el.style.fontSize = `${(a.fontSize || 14) * (State.zoomScale || 1.0)}px`;
            el.style.fontFamily = a.fontFamily || 'Helvetica';
            el.style.fontWeight = a.bold ? 'bold' : 'normal';
            el.style.color = a.color || '#000000';
        }
        attachItemDrag(el, a, overlay);
        overlay.appendChild(el);
    });
}

function attachItemDrag(el, ann, overlay) {
    el.addEventListener('mousedown', (e) => {
        if (State.activeTool !== 'select' || e.button !== 0) return;
        const handle = e.target.getAttribute('data-handle');
        e.stopPropagation();
        const rect = overlay.getBoundingClientRect();
        const startX = e.clientX, startY = e.clientY;
        const origX = ann.normX, origY = ann.normY;
        const origW = ann.normW, origH = ann.normH;
        const ratio = ann.aspectRatio || (origW / origH);

        const onMove = (ev) => {
            if (!rect.width || !rect.height) return;
            const dx = (ev.clientX - startX) / rect.width;
            const dy = (ev.clientY - startY) / rect.height;

            if (handle) {
                // Ridimensionamento proporzionale mantenendo il rapporto d'aspetto
                let newW = origW;
                if (handle.includes('e')) newW = Math.max(0.04, Math.min(1 - origX, origW + dx));
                if (handle.includes('w')) {
                    const maxW = origX + origW;
                    newW = Math.max(0.04, Math.min(maxW, origW - dx));
                    ann.normX = origX + (origW - newW);
                }
                ann.normW = newW;
                ann.normH = newW / ratio;
                if (handle.includes('n')) ann.normY = origY + (origH - ann.normH);
                el.style.width = `${ann.normW * 100}%`;
                el.style.height = `${ann.normH * 100}%`;
            } else {
                ann.normX = Math.max(0, Math.min(1 - (ann.normW || 0.05), origX + dx));
                ann.normY = Math.max(0, Math.min(1 - (ann.normH || 0.05), origY + dy));
            }
            el.style.left = `${ann.normX * 100}%`;
            el.style.top = `${ann.normY * 100}%`;
            setIsModified(true);
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    });
}

/**
 * Funzione ponte retrocompatibile per il salvataggio vettoriale
 */
export async function bakeAnnotationsToPdf(pdfBytes) {
    return await bakeAnnotations(pdfBytes, pageAnnotations);
}

// annotationEngine.js - Gestione reattiva annotazioni, Undo/Redo, selezione e ciclo di vita overlay
import { State, setIsModified } from './stateManager.js';
import { bakeAnnotations } from './annotationBake.js';
import { attachItemDrag } from './annotationDrag.js';
import { attachImageToolbar } from '../tools/imageToolbar.js';
import { refreshPageThumbnail } from '../ui/pageThumbnails.js';

const pageAnnotations = new Map();
const undoStack = [];
const redoStack = [];
let selectedAnnotationId = null;

export function getPageAnnotations(p) { return pageAnnotations.get(p) || []; }

export function setSelectedAnnotationId(id) {
    selectedAnnotationId = id;
    const overlay = document.getElementById('annotationOverlay');
    if (!overlay) return;
    overlay.querySelectorAll('.annotation-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-ann-id') === id);
    });
}

export function clearSelection() {
    if (!selectedAnnotationId) return;
    selectedAnnotationId = null;
    const overlay = document.getElementById('annotationOverlay');
    if (overlay) overlay.querySelectorAll('.annotation-item').forEach(el => el.classList.remove('active'));
}

export function addAnnotation(p, ann) {
    if (!pageAnnotations.has(p)) pageAnnotations.set(p, []);
    ann.id = ann.id || 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    pageAnnotations.get(p).push(ann);
    undoStack.push({ type: 'add', page: p, item: ann });
    redoStack.length = 0;
    selectedAnnotationId = ann.id;
    setIsModified(true);
    renderOverlay();
    refreshPageThumbnail(p);
}

export function deleteAnnotation(p, id) {
    const list = pageAnnotations.get(p) || [];
    const item = list.find(a => a.id === id);
    if (!item) return;
    pageAnnotations.set(p, list.filter(a => a.id !== id));
    undoStack.push({ type: 'delete', page: p, item });
    redoStack.length = 0;
    if (selectedAnnotationId === id) selectedAnnotationId = null;
    setIsModified(true);
    renderOverlay();
    refreshPageThumbnail(p);
}

export function undo() {
    const act = undoStack.pop();
    if (!act) return;
    const list = pageAnnotations.get(act.page) || [];
    if (act.type === 'add') {
        pageAnnotations.set(act.page, list.filter(a => a.id !== act.item.id));
    } else if (act.type === 'delete') {
        if (!pageAnnotations.has(act.page)) pageAnnotations.set(act.page, []);
        pageAnnotations.get(act.page).push(act.item);
    }
    redoStack.push(act);
    setIsModified(true);
    renderOverlay();
    refreshPageThumbnail(act.page);
}

export function redo() {
    const act = redoStack.pop();
    if (!act) return;
    if (act.type === 'add') {
        if (!pageAnnotations.has(act.page)) pageAnnotations.set(act.page, []);
        pageAnnotations.get(act.page).push(act.item);
    } else if (act.type === 'delete') {
        const list = pageAnnotations.get(act.page) || [];
        pageAnnotations.set(act.page, list.filter(a => a.id !== act.item.id));
    }
    undoStack.push(act);
    setIsModified(true);
    renderOverlay();
    refreshPageThumbnail(act.page);
}

export function renderOverlay() {
    const overlay = document.getElementById('annotationOverlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    const items = getPageAnnotations(State.currentPage);
    if (selectedAnnotationId && !items.some(a => a.id === selectedAnnotationId)) selectedAnnotationId = null;

    items.forEach(a => {
        const el = document.createElement('div');
        const isSelected = a.id === selectedAnnotationId;
        el.className = `annotation-item ${a.type}-box ${a.color === '#000000' ? 'black' : 'white'} ${isSelected ? 'active' : ''}`;
        el.setAttribute('data-ann-id', a.id);
        el.style.left = `${a.normX * 100}%`;
        el.style.top = `${a.normY * 100}%`;
        if (a.type === 'whiteout' || a.type === 'signature' || a.type === 'image') {
            el.style.width = `${a.normW * 100}%`;
            el.style.height = `${a.normH * 100}%`;
        }
        if ((a.type === 'signature' || a.type === 'image') && a.dataUrl) {
            el.innerHTML = `<img src="${a.dataUrl}" alt="${a.type}" draggable="false" />`;
            if (a.type === 'image') {
                el.innerHTML += `<div class="resize-handle nw" data-handle="nw"></div><div class="resize-handle ne" data-handle="ne"></div><div class="resize-handle sw" data-handle="sw"></div><div class="resize-handle se" data-handle="se"></div>`;
                attachImageToolbar(el, a, () => renderOverlay());
            }
        } else if (a.type === 'text') {
            el.textContent = a.text;
            el.style.fontSize = `${(a.fontSize || 14) * (State.zoomScale || 1.0)}px`;
            el.style.fontFamily = a.fontFamily || 'Helvetica';
            el.style.fontWeight = a.bold ? 'bold' : 'normal';
            el.style.color = a.color || '#000000';
        }
        attachItemDrag(el, a, overlay, (id) => setSelectedAnnotationId(id), () => { renderOverlay(); refreshPageThumbnail(State.currentPage); });
        overlay.appendChild(el);
    });
}

// Deseleziona quando si clicca all'esterno delle annotazioni (conferma nell'anteprima)
window.addEventListener('mousedown', (e) => {
    if (!selectedAnnotationId) return;
    if (e.target.closest('.annotation-item') || e.target.closest('.text-formatter-popover') || e.target.closest('.image-toolbar-floating')) return;
    if (e.target.closest('#btnUndo') || e.target.closest('#btnRedo')) return;
    clearSelection();
});

// Scorciatoie da tastiera per eliminare o deselezionare l'annotazione
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        e.preventDefault();
        deleteAnnotation(State.currentPage, selectedAnnotationId);
    } else if (e.key === 'Escape' && selectedAnnotationId) {
        clearSelection();
    }
});

export async function bakeAnnotationsToPdf(pdfBytes) { return await bakeAnnotations(pdfBytes, pageAnnotations); }

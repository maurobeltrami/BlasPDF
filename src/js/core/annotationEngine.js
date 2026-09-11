// annotationEngine.js - Gestione reattiva annotazioni, Undo/Redo, CRUD ed overlay visuale
import { State, setIsModified } from './stateManager.js';
import { bakeAnnotations } from './annotationBake.js';
import { attachItemDrag } from './annotationDrag.js';

const pageAnnotations = new Map();
const undoStack = [];
const redoStack = [];
let selectedAnnotationId = null;

export function getPageAnnotations(p) { return pageAnnotations.get(p) || []; }

export function addAnnotation(p, ann) {
    if (!pageAnnotations.has(p)) pageAnnotations.set(p, []);
    ann.id = ann.id || 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    pageAnnotations.get(p).push(ann);
    undoStack.push({ type: 'add', page: p, item: ann });
    redoStack.length = 0;
    selectedAnnotationId = ann.id;
    setIsModified(true);
    renderOverlay();
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
}

export function redo() {
    const act = redoStack.pop();
    if (!act) return;
    const list = pageAnnotations.get(act.page) || [];
    if (act.type === 'add') {
        if (!pageAnnotations.has(act.page)) pageAnnotations.set(act.page, []);
        pageAnnotations.get(act.page).push(act.item);
    } else if (act.type === 'delete') {
        pageAnnotations.set(act.page, list.filter(a => a.id !== act.item.id));
    }
    undoStack.push(act);
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
        const isSelected = a.id === selectedAnnotationId;
        el.className = `annotation-item ${a.type}-box ${a.color === '#000000' ? 'black' : 'white'} ${isSelected ? 'active' : ''}`;
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
                    <button class="ann-del-btn" title="Elimina immagine (Canc)">✕</button>
                `;
                el.querySelector('.ann-del-btn')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteAnnotation(State.currentPage, a.id);
                });
            }
        } else if (a.type === 'text') {
            el.textContent = a.text;
            el.style.fontSize = `${(a.fontSize || 14) * (State.zoomScale || 1.0)}px`;
            el.style.fontFamily = a.fontFamily || 'Helvetica';
            el.style.fontWeight = a.bold ? 'bold' : 'normal';
            el.style.color = a.color || '#000000';
        }
        attachItemDrag(el, a, overlay, (id) => { selectedAnnotationId = id; }, () => renderOverlay());
        overlay.appendChild(el);
    });
}

// Scorciatoia da tastiera per eliminare l'annotazione/immagine selezionata
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        e.preventDefault();
        deleteAnnotation(State.currentPage, selectedAnnotationId);
    }
});

export async function bakeAnnotationsToPdf(pdfBytes) {
    return await bakeAnnotations(pdfBytes, pageAnnotations);
}

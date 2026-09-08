// annotationEngine.js - Gestione reattiva annotazioni, Undo/Redo e baking vettoriale
import { State, setIsModified } from './stateManager.js';
import { PDFDocument, rgb, StandardFonts } from '../../vendor/pdf-lib.esm.min.js';

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
        if (a.type === 'whiteout' || a.type === 'signature') {
            el.style.width = `${a.normW * 100}%`;
            el.style.height = `${a.normH * 100}%`;
        }
        if (a.type === 'signature' && a.dataUrl) {
            el.innerHTML = `<img src="${a.dataUrl}" alt="Firma" />`;
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
        e.stopPropagation();
        const rect = overlay.getBoundingClientRect();
        const startX = e.clientX, startY = e.clientY;
        const origX = ann.normX, origY = ann.normY;

        const onMove = (ev) => {
            if (!rect.width || !rect.height) return;
            ann.normX = Math.max(0, Math.min(1 - (ann.normW || 0.05), origX + (ev.clientX - startX) / rect.width));
            ann.normY = Math.max(0, Math.min(1 - (ann.normH || 0.05), origY + (ev.clientY - startY) / rect.height));
            el.style.left = `${ann.normX * 100}%`;
            el.style.top = `${ann.normY * 100}%`;
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    });
}

function parseColor(hex) {
    if (!hex || hex === '#000000') return rgb(0, 0, 0);
    if (hex === '#ffffff') return rgb(1, 1, 1);
    if (hex.startsWith('#') && hex.length === 7) {
        return rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
    }
    return rgb(0, 0, 0);
}

export async function bakeAnnotationsToPdf(pdfBytes) {
    if (pageAnnotations.size === 0) return pdfBytes;
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const fonts = new Map();

    const getFont = async (fam, bold) => {
        const k = `${fam}_${bold}`;
        if (fonts.has(k)) return fonts.get(k);
        let fn = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
        if (fam === 'Times-Roman') fn = bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman;
        if (fam === 'Courier') fn = bold ? StandardFonts.CourierBold : StandardFonts.Courier;
        const embedded = await doc.embedFont(fn);
        fonts.set(k, embedded);
        return embedded;
    };

    for (const [pageNum, items] of pageAnnotations.entries()) {
        if (pageNum > doc.getPageCount()) continue;
        const page = doc.getPage(pageNum - 1);
        const pw = page.getWidth(), ph = page.getHeight();

        for (const a of items) {
            const x = a.normX * pw, width = (a.normW || 0.1) * pw, height = (a.normH || 0.05) * ph;
            const y = ph - (a.normY * ph) - height;

            if (a.type === 'whiteout') {
                page.drawRectangle({ x, y, width, height, color: a.color === '#000000' ? rgb(0, 0, 0) : rgb(1, 1, 1) });
            } else if (a.type === 'text') {
                const f = await getFont(a.fontFamily, a.bold);
                page.drawText(a.text, { x, y: ph - (a.normY * ph) - (a.fontSize || 14), size: a.fontSize || 14, font: f, color: parseColor(a.color) });
            } else if (a.type === 'signature' && a.dataUrl) {
                try {
                    const img = await doc.embedPng(a.dataUrl);
                    page.drawImage(img, { x, y, width, height });
                } catch (_) {}
            }
        }
    }
    return await doc.save();
}

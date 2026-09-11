// annotationDrag.js - Gestione del trascinamento e ridimensionamento proporzionale delle annotazioni
import { State, setIsModified } from './stateManager.js';

export function attachItemDrag(el, ann, overlay, onSelect, onUpdate) {
    el.addEventListener('mousedown', (e) => {
        if (State.activeTool !== 'select' || e.button !== 0) return;
        if (e.target.classList.contains('ann-del-btn')) return;
        if (onSelect) onSelect(ann.id);
        const handle = e.target.getAttribute('data-handle');
        e.stopPropagation();

        const rect = overlay.getBoundingClientRect();
        const startX = e.clientX, startY = e.clientY;
        const origX = ann.normX, origY = ann.normY, origW = ann.normW, origH = ann.normH;
        const ratio = ann.aspectRatio || (origW / origH);

        const onMove = (ev) => {
            if (!rect.width || !rect.height) return;
            const dx = (ev.clientX - startX) / rect.width, dy = (ev.clientY - startY) / rect.height;
            if (handle) {
                let newW = origW;
                if (handle.includes('e')) newW = Math.max(0.04, Math.min(1 - origX, origW + dx));
                if (handle.includes('w')) {
                    newW = Math.max(0.04, Math.min(origX + origW, origW - dx));
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
            if (onUpdate) onUpdate();
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    });
}

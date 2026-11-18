// annotationDrag.js - Gestione del trascinamento e ridimensionamento proporzionale delle annotazioni
import { State, setIsModified } from './stateManager.js';

/**
 * Associa i gestori di trascinamento (drag) e ridimensionamento (resize) proporzionale
 * mantenendo bloccato l'Aspect Ratio senza alcuna distorsione geometrica.
 */
export function attachItemDrag(el, ann, overlay, onSelect, onUpdate) {
    el.addEventListener('mousedown', (e) => {
        if (State.activeTool !== 'select' || e.button !== 0) return;
        e.stopPropagation();

        if (e.target.classList.contains('ann-del-btn')) return;
        if (onSelect) onSelect(ann.id);

        const handle = e.target.getAttribute('data-handle');
        const rect = overlay.getBoundingClientRect();
        const startX = e.clientX, startY = e.clientY;
        const origX = ann.normX, origY = ann.normY, origW = ann.normW, origH = ann.normH;

        // Rapporto tra altezza normalizzata e larghezza normalizzata per preservare l'aspetto geometrico
        const normHtoW = (origW > 0 && origH > 0) ? (origH / origW) : 1;

        const onMove = (ev) => {
            if (!rect.width || !rect.height) return;
            const dx = (ev.clientX - startX) / rect.width;
            const dy = (ev.clientY - startY) / rect.height;

            if (handle) {
                let newW = origW;
                if (handle.includes('e')) newW = origW + dx;
                if (handle.includes('w')) newW = origW - dx;

                // Limite minimo di dimensione: almeno il 3% del foglio o 20 pixel
                const minW = Math.max(0.03, 20 / (rect.width || 595));
                newW = Math.max(minW, newW);
                let newH = newW * normHtoW;

                let newX = origX;
                let newY = origY;

                if (handle.includes('w')) newX = origX + (origW - newW);
                if (handle.includes('n')) newY = origY + (origH - newH);

                // Vincoli di sicurezza per non oltrepassare i margini della pagina PDF [0, 1]
                if (newX < 0) {
                    newW = origX + origW;
                    newH = newW * normHtoW;
                    newX = 0;
                    if (handle.includes('n')) newY = origY + (origH - newH);
                }
                if (newX + newW > 1) {
                    newW = 1 - newX;
                    newH = newW * normHtoW;
                }
                if (newY < 0) {
                    newH = origY + origH;
                    newW = newH / normHtoW;
                    newY = 0;
                    if (handle.includes('w')) newX = origX + (origW - newW);
                }
                if (newY + newH > 1) {
                    newH = 1 - newY;
                    newW = newH / normHtoW;
                }

                ann.normX = newX;
                ann.normY = newY;
                ann.normW = newW;
                ann.normH = newH;

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

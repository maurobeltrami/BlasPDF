// textTool.js - Inserimento ed editing in-place di testo vettoriale e smart edit (Strada B)
import { State } from '../core/stateManager.js';
import { addAnnotation, undo } from '../core/annotationEngine.js';
import { findTextAtPosition } from './textDetector.js';
import { createFormattingPopover, removeFormattingPopover, getFormatState, setFormatState } from './textFormatter.js';

let activeInput = null;
let currentCommitHandler = null;

export function commitActiveText() {
    if (activeInput && currentCommitHandler) {
        currentCommitHandler();
    }
}

export function initTextTool(overlayEl) {
    if (!overlayEl) return;

    overlayEl.addEventListener('click', async (e) => {
        if (State.activeTool !== 'text') return;
        if (e.target.closest('.text-formatter-popover') || e.target.classList.contains('smart-edit-input')) return;
        if (activeInput) {
            commitActiveText();
            return;
        }

        const rect = overlayEl.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const normClickX = clickX / rect.width;
        const normClickY = clickY / rect.height;

        // 1. Rilevamento testo esistente sotto il cursore (Strada B)
        const hit = await findTextAtPosition(normClickX, normClickY, State.currentPage);
        let tempWhiteoutAdded = false;

        let posX = clickX, posY = clickY;
        let targetNormX = normClickX, targetNormY = normClickY;
        let initialText = '';

        if (hit) {
            addAnnotation(State.currentPage, {
                type: 'whiteout',
                normX: hit.box.normX,
                normY: hit.box.normY,
                normW: hit.box.normW,
                normH: hit.box.normH,
                color: '#ffffff'
            });
            tempWhiteoutAdded = true;
            posX = hit.box.normX * rect.width;
            posY = hit.box.normY * rect.height;
            targetNormX = hit.box.normX;
            targetNormY = hit.box.normY;
            initialText = hit.text;
            setFormatState({ fontSize: hit.fontSize || 14 });
        }

        // 2. Creazione input e aggiunta immediata al DOM
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'text-box smart-edit-input';
        input.value = initialText;
        input.placeholder = 'Digita testo...';
        input.style.position = 'absolute';
        input.style.left = `${posX}px`;
        input.style.top = `${posY}px`;
        input.style.zIndex = '500';

        const applyStyle = (fmt) => {
            input.style.fontFamily = fmt.fontFamily;
            input.style.fontSize = `${fmt.fontSize * (State.zoomScale || 1.0)}px`;
            input.style.fontWeight = fmt.isBold ? 'bold' : 'normal';
            input.style.color = fmt.color;
        };

        applyStyle(getFormatState());
        overlayEl.appendChild(input);
        activeInput = input;

        // 3. Gestori di completamento o annullamento
        let committed = false;
        const commitText = () => {
            if (committed) return;
            committed = true;
            const val = input.value.trim();
            const fmt = getFormatState();

            if (val) {
                addAnnotation(State.currentPage, {
                    type: 'text',
                    normX: targetNormX,
                    normY: targetNormY,
                    text: val,
                    fontFamily: fmt.fontFamily,
                    fontSize: fmt.fontSize,
                    bold: fmt.isBold,
                    color: fmt.color
                });
            } else if (tempWhiteoutAdded) {
                undo();
            }

            removeFormattingPopover();
            input.remove();
            activeInput = null;
            currentCommitHandler = null;
        };

        const cancelText = () => {
            if (committed) return;
            committed = true;
            if (tempWhiteoutAdded) undo();
            removeFormattingPopover();
            input.remove();
            activeInput = null;
            currentCommitHandler = null;
        };

        currentCommitHandler = commitText;

        // 4. Apertura popover di formattazione
        createFormattingPopover(input, overlayEl, commitText, cancelText, applyStyle);

        input.addEventListener('keydown', (ke) => {
            if (ke.key === 'Enter') { ke.preventDefault(); commitText(); }
            if (ke.key === 'Escape') { ke.preventDefault(); cancelText(); }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (activeInput === input && !document.activeElement?.closest('.text-formatter-popover')) {
                    commitText();
                }
            }, 150);
        });

        input.focus();
        if (initialText) input.select();
    });
}

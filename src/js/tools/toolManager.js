// toolManager.js - Coordinamento strumenti di correzione (Bianchetto, Testo, Firma) e Undo/Redo
import { State, setActiveTool } from '../core/stateManager.js';
import { undo, redo, renderOverlay } from '../core/annotationEngine.js';
import { initWhiteoutTool } from './whiteoutTool.js';
import { initTextTool } from './textTool.js';
import { initSignatureTool, openSignatureDialog } from './signatureTool.js';

export function initToolManager() {
    const overlay = document.getElementById('annotationOverlay');
    initWhiteoutTool(overlay);
    initTextTool(overlay);
    initSignatureTool();

    // 1. Strumenti barra superiore
    const tools = {
        select: document.getElementById('toolSelect'),
        whiteout: document.getElementById('toolWhiteout'),
        text: document.getElementById('toolText'),
        sign: document.getElementById('toolSign')
    };

    Object.entries(tools).forEach(([name, btn]) => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            setActiveTool(name);
            if (name === 'sign') openSignatureDialog();
        });
    });

    // 2. Pulsanti Undo / Redo
    document.getElementById('btnUndo')?.addEventListener('click', undo);
    document.getElementById('btnRedo')?.addEventListener('click', redo);

    // 3. Scorciatoie da tastiera dedicate
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
        }
    });
}

export function updateToolUi(activeTool) {
    const tools = ['select', 'whiteout', 'text', 'sign'];
    tools.forEach(name => {
        const id = 'tool' + name.charAt(0).toUpperCase() + name.slice(1);
        document.getElementById(id)?.classList.toggle('active', name === activeTool);
    });

    const overlay = document.getElementById('annotationOverlay');
    if (overlay) {
        overlay.style.cursor = activeTool === 'whiteout' ? 'crosshair' : (activeTool === 'text' ? 'text' : (activeTool === 'sign' ? 'pointer' : 'default'));
        overlay.classList.toggle('tool-select-mode', activeTool === 'select');
    }
}

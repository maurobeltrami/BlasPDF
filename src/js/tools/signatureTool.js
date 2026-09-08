// signatureTool.js - Modale di disegno a mano libera per apposizione firma grafica
import { State, setActiveTool } from '../core/stateManager.js';
import { addAnnotation } from '../core/annotationEngine.js';

let isDrawing = false;
let hasStrokes = false;
let lastX = 0, lastY = 0;

export function initSignatureTool() {
    const modal = document.getElementById('signatureModal');
    const canvas = document.getElementById('signaturePad');
    const btnClear = document.getElementById('btnClearSig');
    const btnClose = document.getElementById('btnCloseSigModal');
    const btnApply = document.getElementById('btnApplySig');
    if (!modal || !canvas) return;

    const ctx = canvas.getContext('2d');

    function resetPad() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        hasStrokes = false;
    }

    function getCoords(e) {
        const r = canvas.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    }

    canvas.addEventListener('pointerdown', (e) => {
        isDrawing = true;
        hasStrokes = true;
        [lastX, lastY] = getCoords(e);
        canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!isDrawing) return;
        const [x, y] = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        [lastX, lastY] = [x, y];
    });

    const stopDrawing = () => { isDrawing = false; };
    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointercancel', stopDrawing);

    btnClear?.addEventListener('click', resetPad);
    btnClose?.addEventListener('click', () => {
        modal.style.display = 'none';
        setActiveTool('select');
    });

    btnApply?.addEventListener('click', () => {
        if (!hasStrokes) {
            alert('Traccia prima una firma con il mouse o trackpad.');
            return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        addAnnotation(State.currentPage, {
            type: 'signature',
            normX: 0.35,
            normY: 0.70,
            normW: 0.28,
            normH: 0.12,
            dataUrl
        });
        modal.style.display = 'none';
        setActiveTool('select');
    });
}

export function openSignatureDialog() {
    const modal = document.getElementById('signatureModal');
    const canvas = document.getElementById('signaturePad');
    if (!modal || !canvas) return;
    modal.style.display = 'flex';
    setTimeout(() => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, 50);
}

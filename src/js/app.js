// app.js - Punto di ingresso dell'interfaccia frontend e ascolto eventi
import { State, subscribe, setCurrentPage, adjustZoom, setActiveTool, toggleAiPanel } from './core/stateManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Collegamento pulsanti della barra degli strumenti
    const btnOpen = document.getElementById('btnOpen');
    const btnSave = document.getElementById('btnSave');
    const btnPrevPage = document.getElementById('btnPrevPage');
    const btnNextPage = document.getElementById('btnNextPage');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnToggleAi = document.getElementById('btnToggleAi');
    const dropZone = document.getElementById('dropZoneTrigger');
    const fileInput = document.getElementById('hiddenFileInput');

    // 2. Strumenti di modifica
    const tools = {
        select: document.getElementById('toolSelect'),
        whiteout: document.getElementById('toolWhiteout'),
        text: document.getElementById('toolText'),
        sign: document.getElementById('toolSign')
    };

    Object.entries(tools).forEach(([name, btn]) => {
        if (btn) btn.addEventListener('click', () => setActiveTool(name));
    });

    // 3. Navigazione e Zoom
    btnPrevPage?.addEventListener('click', () => setCurrentPage(State.currentPage - 1));
    btnNextPage?.addEventListener('click', () => setCurrentPage(State.currentPage + 1));
    btnZoomOut?.addEventListener('click', () => adjustZoom(-0.15));
    btnZoomIn?.addEventListener('click', () => adjustZoom(0.15));
    btnToggleAi?.addEventListener('click', () => toggleAiPanel());

    // 4. Apertura File
    const triggerFileOpen = () => fileInput?.click();
    btnOpen?.addEventListener('click', triggerFileOpen);
    dropZone?.addEventListener('click', triggerFileOpen);

    // 5. Drag & Drop nativo
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (files && files.length > 0 && files[0].type === 'application/pdf') {
            console.log('File trascinato con successo:', files[0].name);
        }
    });

    // 6. Sottoscrizione ai cambiamenti di stato per aggiornare la UI
    subscribe((state, property) => {
        if (property === 'currentPage' || property === 'documentLoaded') {
            const pageInd = document.getElementById('pageIndicator');
            if (pageInd) pageInd.textContent = state.totalPages > 0 
                ? `Pagina ${state.currentPage} / ${state.totalPages}` 
                : '- / -';
        }

        if (property === 'zoomScale') {
            const zoomInd = document.getElementById('zoomIndicator');
            if (zoomInd) zoomInd.textContent = `${Math.round(state.zoomScale * 100)}%`;
        }

        if (property === 'activeTool') {
            Object.entries(tools).forEach(([name, btn]) => {
                if (btn) btn.classList.toggle('active', name === state.activeTool);
            });
        }

        if (property === 'isAiOpen') {
            const aiPanel = document.getElementById('aiSidePanel');
            aiPanel?.classList.toggle('collapsed', !state.isAiOpen);
            btnToggleAi?.classList.toggle('active', state.isAiOpen);
        }
    });

    console.log('BlasPDF v1.0.0 inizializzato con successo. Modalità Local-First attiva.');
});

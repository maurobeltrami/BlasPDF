// app.js - Coordinamento eventi, strumenti della barra e comandi desktop
import { State, subscribe, setCurrentPage, adjustZoom, setActiveTool, toggleAiPanel } from './core/stateManager.js';
import { renderPage } from './core/pdfRenderer.js';
import { updateActiveThumbnail } from './ui/pageThumbnails.js';
import { openPdfFile, loadSamplePdf, handleFileSelection, isPdfFile, processPdfBuffer } from './events/fileLoader.js';
import { saveCurrentPdf, base64ToUint8Array } from './events/exportManager.js';
import { rotateCurrentPage, deleteCurrentPage, extractCurrentPage, handleMergePdf, mergeSecondaryPdf } from './events/pageActions.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Elementi interfaccia
    const btnOpen = document.getElementById('btnOpen');
    const btnSave = document.getElementById('btnSave');
    const btnPrevPage = document.getElementById('btnPrevPage');
    const btnNextPage = document.getElementById('btnNextPage');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnToggleAi = document.getElementById('btnToggleAi');
    const pdfCanvas = document.getElementById('pdfCanvas');
    const mergeInput = document.getElementById('mergeFileInput');
    const fileInput = document.getElementById('hiddenFileInput');

    // 2. Apertura e Salvataggio (Nativo Tauri + Fallback Web)
    btnOpen?.addEventListener('click', openPdfFile);
    btnSave?.addEventListener('click', saveCurrentPdf);
    document.getElementById('btnBrowseEmpty')?.addEventListener('click', openPdfFile);
    document.getElementById('btnLoadSample')?.addEventListener('click', loadSamplePdf);

    fileInput?.addEventListener('change', (e) => {
        if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
    });

    // 3. Strumenti manipolazione pagine (Reattività diretta senza ritardi)
    document.getElementById('btnRotatePage')?.addEventListener('click', rotateCurrentPage);
    document.getElementById('btnDeletePage')?.addEventListener('click', deleteCurrentPage);
    document.getElementById('btnExtractPage')?.addEventListener('click', extractCurrentPage);
    document.getElementById('btnMergePdf')?.addEventListener('click', handleMergePdf);
    mergeInput?.addEventListener('change', (e) => {
        if (e.target.files?.[0]) mergeSecondaryPdf(e.target.files[0]);
    });

    // 4. Strumenti barra superiore e cambio cursore
    const tools = {
        select: document.getElementById('toolSelect'),
        whiteout: document.getElementById('toolWhiteout'),
        text: document.getElementById('toolText'),
        sign: document.getElementById('toolSign')
    };
    Object.entries(tools).forEach(([name, btn]) => {
        if (btn) btn.addEventListener('click', () => setActiveTool(name));
    });

    // 5. Navigazione e Zoom
    btnPrevPage?.addEventListener('click', () => setCurrentPage(State.currentPage - 1));
    btnNextPage?.addEventListener('click', () => setCurrentPage(State.currentPage + 1));
    btnZoomOut?.addEventListener('click', () => adjustZoom(-0.15));
    btnZoomIn?.addEventListener('click', () => adjustZoom(0.15));
    btnToggleAi?.addEventListener('click', () => toggleAiPanel());

    // 6. Drag & Drop Universale (Nativo macOS Finder + WebKit HTML5)
    ['dragenter', 'dragover'].forEach(evt => {
        window.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (isPdfFile(file)) handleFileSelection(file);
    });

    // Ascolto eventi di rilascio file nativi di Tauri da Finder macOS
    const tauriEvent = window.__TAURI__?.event;
    if (tauriEvent?.listen) {
        const onNativeDrop = async (e) => {
            const paths = e.payload?.paths || e.payload;
            if (Array.isArray(paths) && paths.length > 0) {
                const path = paths[0];
                if (typeof path === 'string' && path.toLowerCase().endsWith('.pdf')) {
                    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
                    if (invoke) {
                        try {
                            const res = await invoke('read_pdf_file', { filePath: path });
                            if (res) {
                                const bytes = base64ToUint8Array(res.base64_data);
                                await processPdfBuffer(bytes, res.file_name, res.file_path);
                            }
                        } catch (err) {
                            console.error('Errore caricamento drop nativo:', err);
                        }
                    }
                }
            }
        };
        tauriEvent.listen('tauri://drag-drop', onNativeDrop);
        tauriEvent.listen('tauri://file-drop', onNativeDrop);
    }

    // 7. Scorciatoie da tastiera intuitive (Zero-Terminal)
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown') setCurrentPage(State.currentPage + 1);
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') setCurrentPage(State.currentPage - 1);
        if (e.key === '+' || e.key === '=') adjustZoom(0.15);
        if (e.key === '-') adjustZoom(-0.15);
        if (e.key === 'r' || e.key === 'R') rotateCurrentPage();
        if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveCurrentPdf(); }
        if ((e.metaKey || e.ctrlKey) && e.key === 'o') { e.preventDefault(); openPdfFile(); }
    });

    // 8. Reattività UI su mutazione stato
    subscribe(async (state, property) => {
        if (property === 'currentPage' || property === 'zoomScale') {
            if (pdfCanvas && state.totalPages > 0) {
                await renderPage(state.currentPage, pdfCanvas, state.zoomScale);
            }
            if (property === 'currentPage') updateActiveThumbnail(state.currentPage);
        }

        if (property === 'currentPage' || property === 'documentLoaded') {
            const pageInd = document.getElementById('pageIndicator');
            if (pageInd) {
                pageInd.textContent = state.totalPages > 0 ? `Pagina ${state.currentPage} / ${state.totalPages}` : '- / -';
            }
        }

        if (property === 'zoomScale') {
            const zoomInd = document.getElementById('zoomIndicator');
            if (zoomInd) zoomInd.textContent = `${Math.round(state.zoomScale * 100)}%`;
        }

        if (property === 'activeTool') {
            Object.entries(tools).forEach(([name, btn]) => {
                if (btn) btn.classList.toggle('active', name === state.activeTool);
            });
            const wrapper = document.getElementById('pdfCanvasWrapper');
            if (wrapper) {
                wrapper.style.cursor = state.activeTool === 'whiteout' ? 'crosshair' : (state.activeTool === 'text' ? 'text' : 'default');
            }
        }

        if (property === 'isAiOpen') {
            document.getElementById('aiSidePanel')?.classList.toggle('collapsed', !state.isAiOpen);
            btnToggleAi?.classList.toggle('active', state.isAiOpen);
        }
    });

    console.log('BlasPDF: Interfaccia e controlli desktop operativi al 100%.');
});

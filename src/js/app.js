// app.js - Coordinamento eventi, strumenti della barra, Centro Conversioni e comandi desktop
import { State, subscribe, setCurrentPage, adjustZoom } from './core/stateManager.js';
import { renderPage } from './core/pdfRenderer.js';
import { updateActiveThumbnail } from './ui/pageThumbnails.js';
import { openPdfFile, loadSamplePdf, handleFileSelection, isPdfFile, processPdfBuffer } from './events/fileLoader.js';
import { saveCurrentPdf, base64ToUint8Array } from './events/exportManager.js';
import { rotateCurrentPage, deleteCurrentPage, extractCurrentPage, handleMergePdf, mergeSecondaryPdf } from './events/pageActions.js';
import { initToolManager, updateToolUi } from './tools/toolManager.js';
import { renderOverlay } from './core/annotationEngine.js';
import { initCloseHandler } from './events/closeHandler.js';
import { initConverterManager } from './converter/converterManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const pdfCanvas = document.getElementById('pdfCanvas');
    const mergeInput = document.getElementById('mergeFileInput');
    const fileInput = document.getElementById('hiddenFileInput');

    // 1. Inizializza gestori strumenti, conversioni e protezione chiusura
    initToolManager();
    initCloseHandler();
    initConverterManager();

    // 2. Apertura e Salvataggio (Nativo Tauri + Fallback Web)
    document.getElementById('btnOpen')?.addEventListener('click', openPdfFile);
    document.getElementById('btnSave')?.addEventListener('click', saveCurrentPdf);
    document.getElementById('btnBrowseEmpty')?.addEventListener('click', openPdfFile);
    document.getElementById('btnLoadSample')?.addEventListener('click', loadSamplePdf);
    fileInput?.addEventListener('change', (e) => {
        if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
    });

    // 3. Strumenti manipolazione pagine
    document.getElementById('btnRotatePage')?.addEventListener('click', rotateCurrentPage);
    document.getElementById('btnDeletePage')?.addEventListener('click', deleteCurrentPage);
    document.getElementById('btnExtractPage')?.addEventListener('click', extractCurrentPage);
    document.getElementById('btnMergePdf')?.addEventListener('click', handleMergePdf);
    mergeInput?.addEventListener('change', (e) => {
        if (e.target.files?.[0]) mergeSecondaryPdf(e.target.files[0]);
    });

    // 4. Navigazione e Zoom
    document.getElementById('btnPrevPage')?.addEventListener('click', () => setCurrentPage(State.currentPage - 1));
    document.getElementById('btnNextPage')?.addEventListener('click', () => setCurrentPage(State.currentPage + 1));
    document.getElementById('btnZoomOut')?.addEventListener('click', () => adjustZoom(-0.15));
    document.getElementById('btnZoomIn')?.addEventListener('click', () => adjustZoom(0.15));

    // 5. Drag & Drop Universale
    ['dragenter', 'dragover'].forEach(evt => {
        window.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
    });
    window.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (isPdfFile(file)) handleFileSelection(file);
    });

    // Rilascio file nativo Tauri da Finder macOS
    const tauriEvent = window.__TAURI__?.event;
    if (tauriEvent?.listen) {
        const onNativeDrop = async (e) => {
            const paths = e.payload?.paths || e.payload;
            if (Array.isArray(paths) && paths.length > 0 && typeof paths[0] === 'string' && paths[0].toLowerCase().endsWith('.pdf')) {
                const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
                if (invoke) {
                    try {
                        const res = await invoke('read_pdf_file', { filePath: paths[0] });
                        if (res) {
                            const bytes = base64ToUint8Array(res.base64_data);
                            await processPdfBuffer(bytes, res.file_name, res.file_path);
                        }
                    } catch (err) { console.error('Errore drop nativo:', err); }
                }
            }
        };
        tauriEvent.listen('tauri://drag-drop', onNativeDrop);
        tauriEvent.listen('tauri://file-drop', onNativeDrop);
    }

    // 6. Scorciatoie da tastiera intuitive
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

    // 7. Reattività UI su mutazione stato
    subscribe(async (state, property) => {
        if (property === 'currentPage' || property === 'zoomScale' || property === 'documentModified') {
            if (pdfCanvas && state.totalPages > 0) {
                await renderPage(state.currentPage, pdfCanvas, state.zoomScale);
                renderOverlay();
            }
            if (property === 'currentPage' || property === 'documentModified') updateActiveThumbnail(state.currentPage);
        }

        if (property === 'currentPage' || property === 'documentLoaded') {
            const pageInd = document.getElementById('pageIndicator');
            if (pageInd) pageInd.textContent = state.totalPages > 0 ? `Pagina ${state.currentPage} / ${state.totalPages}` : '- / -';
            if (property === 'documentLoaded') renderOverlay();
        }

        if (property === 'zoomScale') {
            const zoomInd = document.getElementById('zoomIndicator');
            if (zoomInd) zoomInd.textContent = `${Math.round(state.zoomScale * 100)}%`;
        }

        if (property === 'activeTool') updateToolUi(state.activeTool);
    });

    console.log('BlasPDF: Interfaccia, strumenti e Centro Conversioni operativi al 100%.');
});

// pageThumbnails.js - Generazione asincrona ultra-rapida miniature e riordino Drag & Drop
import { State, setCurrentPage, updateDocumentBytes } from '../core/stateManager.js';
import { renderThumbnail, loadPdf, renderPage } from '../core/pdfRenderer.js';
import { rotatePage, deletePage, reorderPage } from '../core/pdfModifier.js';

let currentGenToken = 0;

/**
 * Inizializza la lista delle miniature: crea i box istantaneamente e rasterizza in background
 */
export async function generateThumbnails(containerElement) {
    if (!containerElement) return;
    const token = ++currentGenToken;
    containerElement.innerHTML = '';

    // 1. Creazione istantanea di tutte le schede (Feedback UI a 0ms)
    const cards = [];
    for (let i = 1; i <= State.totalPages; i++) {
        const card = createThumbnailCard(i, containerElement);
        containerElement.appendChild(card);
        cards.push(card);
    }

    // 2. Rendering prioritario della pagina attiva, poi le altre in sequenza fluida
    const renderQueue = [State.currentPage, ...Array.from({ length: State.totalPages }, (_, i) => i + 1).filter(p => p !== State.currentPage)];

    for (const p of renderQueue) {
        if (token !== currentGenToken) break; // Interrompi se è subentrata una nuova generazione
        const card = cards[p - 1];
        if (!card) continue;
        const canvas = card.querySelector('.thumbnail-canvas');
        if (canvas) {
            try {
                await renderThumbnail(p, canvas, 140);
            } catch (_) {}
        }
        await new Promise(r => setTimeout(r, 16)); // Cede il controllo al thread grafico (60fps)
    }
}

/**
 * Crea la scheda miniatura con comandi veloci e Drag & Drop
 */
function createThumbnailCard(pageNum, container) {
    const card = document.createElement('div');
    card.className = `thumbnail-card ${pageNum === State.currentPage ? 'active' : ''}`;
    card.dataset.pageNum = pageNum;
    card.draggable = true;

    card.innerHTML = `
        <div class="thumbnail-actions">
            <button class="thumb-btn btn-rotate" title="Ruota pagina 90°">⟳</button>
            <button class="thumb-btn btn-delete" title="Elimina pagina">🗑️</button>
        </div>
        <canvas class="thumbnail-canvas"></canvas>
        <div class="thumbnail-label">Pagina ${pageNum}</div>
    `;

    card.addEventListener('click', (e) => {
        if (!e.target.closest('.thumb-btn')) setCurrentPage(pageNum);
    });

    card.querySelector('.btn-rotate').addEventListener('click', async (e) => {
        e.stopPropagation();
        await handleRotateFast(pageNum, card);
    });
    card.querySelector('.btn-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        await handleDeleteFast(pageNum, container);
    });

    // Eventi Drag & Drop
    card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', String(pageNum - 1)); card.classList.add('dragging'); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', async (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(fromIdx) && fromIdx !== pageNum - 1) {
            try {
                const newBytes = await reorderPage(State.pdfBytes, fromIdx, pageNum - 1);
                const safeBytes = new Uint8Array(newBytes);
                await loadPdf(safeBytes);
                updateDocumentBytes(safeBytes, { targetPage: pageNum });
                generateThumbnails(container);
            } catch (err) {
                console.error("Errore riordino pagine:", err);
            }
        }
    });

    return card;
}

/**
 * Rotazione chirurgica: aggiorna solo la pagina corrente e la sua miniatura senza ricreare tutto
 */
async function handleRotateFast(pageNum, card) {
    try {
        const newBytes = await rotatePage(State.pdfBytes, pageNum, 90);
        const safeBytes = new Uint8Array(newBytes);
        await loadPdf(safeBytes);
        updateDocumentBytes(safeBytes, { targetPage: pageNum });
        const pdfCanvas = document.getElementById('pdfCanvas');
        if (pdfCanvas) await renderPage(State.currentPage, pdfCanvas, State.zoomScale);
        const canvas = card.querySelector('.thumbnail-canvas');
        if (canvas) await renderThumbnail(pageNum, canvas, 140);
    } catch (err) {
        console.error("Errore rotazione rapida:", err);
        alert(`Impossibile ruotare: ${err.message || err}`);
    }
}

/**
 * Eliminazione veloce con ricarica
 */
async function handleDeleteFast(pageNum, container) {
    if (State.totalPages <= 1) {
        alert("Impossibile eliminare l'unica pagina del documento.");
        return;
    }
    if (!confirm(`Confermi l'eliminazione della Pagina ${pageNum}?`)) return;
    try {
        const newBytes = await deletePage(State.pdfBytes, pageNum);
        const newTotal = State.totalPages - 1;
        const targetPage = Math.min(pageNum, newTotal);
        const safeBytes = new Uint8Array(newBytes);
        await loadPdf(safeBytes);
        updateDocumentBytes(safeBytes, { totalPages: newTotal, targetPage });
        const pdfCanvas = document.getElementById('pdfCanvas');
        if (pdfCanvas) await renderPage(State.currentPage, pdfCanvas, State.zoomScale);
        generateThumbnails(container);
    } catch (err) {
        console.error("Errore eliminazione rapida:", err);
        alert(`Impossibile eliminare: ${err.message || err}`);
    }
}

/**
 * Evidenzia visivamente la miniatura attiva
 */
export function updateActiveThumbnail(activePageNum) {
    document.querySelectorAll('.thumbnail-card').forEach(card => {
        const isActive = parseInt(card.dataset.pageNum, 10) === activePageNum;
        card.classList.toggle('active', isActive);
        if (isActive) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

// converterManager.js - Gestione dashboard e flusso operativo del Centro Conversioni Locale
import { State } from '../core/stateManager.js';
import { convertImagesToPdf } from './imagesToPdf.js';
import { convertPdfToImages, saveRenderedImage } from './pdfToImages.js';
import { extractTextFromPdf, saveExtractedText } from './pdfToText.js';
import { optimizePdf, saveOptimizedPdf } from './pdfOptimizer.js';
import { base64ToUint8Array } from '../events/exportManager.js';

/**
 * Inizializza il selettore di vista a schede e gli eventi del Centro Conversioni
 */
export function initConverterManager() {
    const tabEditor = document.getElementById('tabEditor');
    const tabConverter = document.getElementById('tabConverter');
    const appContainer = document.querySelector('.app-container');
    const convContainer = document.getElementById('converterContainer');

    const switchView = (view) => {
        const isConv = view === 'converter';
        if (tabEditor) tabEditor.classList.toggle('active', !isConv);
        if (tabConverter) tabConverter.classList.toggle('active', isConv);
        if (appContainer) appContainer.style.display = isConv ? 'none' : 'flex';
        if (convContainer) {
            convContainer.style.display = isConv ? 'flex' : 'none';
            if (isConv && !convContainer.hasChildNodes()) renderConverterDashboard(convContainer);
        }
    };

    tabEditor?.addEventListener('click', () => switchView('editor'));
    tabConverter?.addEventListener('click', () => switchView('converter'));
}

/**
 * Genera la griglia a card per i 4 strumenti di conversione locale
 */
function renderConverterDashboard(container) {
    container.innerHTML = `
        <div class="converter-header">
            <h2>🔄 Centro Conversioni Offline</h2>
            <p>Elaborazione rapida di documenti e immagini al 100% in memoria locale sul tuo computer, nel rispetto totale della privacy e senza abbonamenti.</p>
        </div>
        <div class="converter-grid">
            <div class="converter-card" id="cardImagesToPdf">
                <div class="converter-card-icon">🖼️</div>
                <div class="converter-card-title">Immagini ➔ PDF</div>
                <div class="converter-card-desc">Unisci foto e scansioni (PNG, JPG, WebP, SVG) in un unico file PDF ordinato.</div>
                <span class="converter-card-badge">Batch Locale</span>
            </div>
            <div class="converter-card" id="cardPdfToImages">
                <div class="converter-card-icon">📸</div>
                <div class="converter-card-title">PDF ➔ Immagini</div>
                <div class="converter-card-desc">Estrai ogni pagina come immagine ad alta risoluzione (150 DPI) in formato PNG.</div>
                <span class="converter-card-badge">Hi-Res Retina</span>
            </div>
            <div class="converter-card" id="cardPdfToText">
                <div class="converter-card-icon">📝</div>
                <div class="converter-card-title">PDF ➔ Testo</div>
                <div class="converter-card-desc">Estrai tutto il testo del documento preservando paragrafi e capitoli in .txt o .md.</div>
                <span class="converter-card-badge">Strutturato</span>
            </div>
            <div class="converter-card" id="cardOptimizePdf">
                <div class="converter-card-icon">🗜️</div>
                <div class="converter-card-title">Ottimizza PDF</div>
                <div class="converter-card-desc">Comprimi gli stream di oggetti interni COS per ridurre il peso del file.</div>
                <span class="converter-card-badge">Lossless</span>
            </div>
        </div>
    `;

    document.getElementById('cardImagesToPdf')?.addEventListener('click', handleImagesToPdf);
    document.getElementById('cardPdfToImages')?.addEventListener('click', handlePdfToImages);
    document.getElementById('cardPdfToText')?.addEventListener('click', handlePdfToText);
    document.getElementById('cardOptimizePdf')?.addEventListener('click', handleOptimizePdf);
}

/**
 * Procedura di selezione e conversione immagini in PDF
 */
async function handleImagesToPdf() {
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (invoke) {
        try {
            const list = await invoke('pick_and_read_images');
            if (list && list.length > 0) {
                const formatted = list.map(img => ({ dataUrl: `data:${img.mime_type};base64,${img.base64_data}` }));
                const saved = await convertImagesToPdf(formatted, 'portrait');
                if (saved) alert(`PDF generato con successo da ${list.length} immagini!`);
            }
        } catch (err) { alert(`Errore conversione: ${err}`); }
    } else {
        alert('Seleziona le immagini tramite l\'applicazione desktop nativa.');
    }
}

/**
 * Ottiene il buffer PDF attuale o chiede di aprirne uno nativamente
 */
async function getTargetPdfBytes() {
    if (State.pdfBytes && State.totalPages > 0) return State.pdfBytes;
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (invoke) {
        const res = await invoke('pick_and_read_pdf');
        if (res) return base64ToUint8Array(res.base64_data);
    }
    return null;
}

async function handlePdfToImages() {
    try {
        const bytes = await getTargetPdfBytes();
        if (!bytes) return;
        const images = await convertPdfToImages(bytes, { dpi: 150, format: 'image/png' });
        for (const img of images) await saveRenderedImage(img, 'pagina');
        alert(`Esportate ${images.length} pagine come immagini PNG.`);
    } catch (err) { alert(`Errore: ${err}`); }
}

async function handlePdfToText() {
    try {
        const bytes = await getTargetPdfBytes();
        if (!bytes) return;
        const text = await extractTextFromPdf(bytes, false);
        await saveExtractedText(text, 'txt', 'testo_estratto');
    } catch (err) { alert(`Errore: ${err}`); }
}

async function handleOptimizePdf() {
    try {
        const bytes = await getTargetPdfBytes();
        if (!bytes) return;
        const res = await optimizePdf(bytes);
        await saveOptimizedPdf(res.optimizedBytes, 'ottimizzato.pdf');
        alert(`Documento ottimizzato con successo!\nRisparmio spazio: ${res.percentSaved}% (${Math.round(res.savedBytes / 1024)} KB)`);
    } catch (err) { alert(`Errore: ${err}`); }
}

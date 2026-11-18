// converterManager.js - Gestione schede vista e dashboard grafica del Centro Conversioni Locale
import {
    handleImagesToPdf,
    handlePdfToImages,
    handlePdfToText,
    handleOptimizePdf
} from './converterActions.js';

/**
 * Inizializza il selettore di vista a schede tra Editor PDF e Centro Conversioni
 */
export function initConverterManager() {
    const tabEditor = document.getElementById('tabEditor');
    const tabConverter = document.getElementById('tabConverter');
    const appContainer = document.querySelector('.app-container');
    const convContainer = document.getElementById('converterContainer');

    const switchView = (view) => {
        const isConv = view === 'converter';
        tabEditor?.classList.toggle('active', !isConv);
        tabConverter?.classList.toggle('active', isConv);
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
 * Genera la griglia a card per i 4 strumenti di conversione locale e associa gli handler
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

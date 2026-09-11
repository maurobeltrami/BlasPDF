// imageTool.js - Inserimento immagini e timbri multi-formato con normalizzazione Canvas
import { State, setActiveTool } from '../core/stateManager.js';
import { addAnnotation } from '../core/annotationEngine.js';

let hiddenImageInput = null;

/**
 * Inizializza lo strumento immagine e associa il fallback input file
 */
export function initImageTool() {
    hiddenImageInput = document.getElementById('hiddenImageInput');
    if (hiddenImageInput) {
        hiddenImageInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = '';
        });
    }
}

/**
 * Apre il selettore immagine: dialogo nativo Tauri o fallback input HTML
 */
export async function openImageDialog() {
    if (!State.pdfBytes || State.totalPages === 0) {
        alert('Apri prima un documento PDF per inserire un\'immagine o timbro.');
        return;
    }

    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (invoke) {
        try {
            const res = await invoke('pick_and_read_image');
            if (res) {
                const dataUrl = `data:${res.mime_type};base64,${res.base64_data}`;
                await placeImageOnPage(dataUrl, res.file_name);
                return;
            }
        } catch (err) {
            console.error('Errore selezione immagine nativa:', err);
        }
    }

    if (hiddenImageInput) hiddenImageInput.click();
}

/**
 * Gestisce il file selezionato dal browser
 */
async function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const rawDataUrl = e.target.result;
        await placeImageOnPage(rawDataUrl, file.name);
    };
    reader.readAsDataURL(file);
}

/**
 * Normalizza l'immagine su Canvas (per SVG/WebP/BMP) e la posiziona al centro della pagina
 */
async function placeImageOnPage(dataUrl, fileName = 'timbro.png') {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
    });

    // Se il formato non è JPEG o PNG nativo, transcodifica su Canvas per compatibilità pdf-lib
    let finalDataUrl = dataUrl;
    const isStandard = dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/jpeg');
    if (!isStandard) {
        const offscreen = document.createElement('canvas');
        offscreen.width = img.naturalWidth || 400;
        offscreen.height = img.naturalHeight || 300;
        const ctx = offscreen.getContext('2d');
        ctx.drawImage(img, 0, 0);
        finalDataUrl = offscreen.toDataURL('image/png');
    }

    const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
    const normW = 0.25;
    const normH = normW / aspect;
    const normX = Math.max(0, (1 - normW) / 2);
    const normY = Math.max(0, (1 - normH) / 2);

    addAnnotation(State.currentPage, {
        type: 'image',
        dataUrl: finalDataUrl,
        normX,
        normY,
        normW,
        normH,
        aspectRatio: aspect,
        fileName
    });

    setActiveTool('select');
}

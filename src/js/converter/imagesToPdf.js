// imagesToPdf.js - Conversione batch di immagini in un unico documento PDF compatto
import { PDFDocument, PageSizes } from '../../vendor/pdf-lib.esm.min.js';
import { uint8ArrayToBase64 } from '../events/exportManager.js';

/**
 * Normalizza un dataUrl su canvas ed estrae PNG/JPEG conforme a pdf-lib
 */
async function loadAndPrepareImage(dataUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });

    const isJpg = dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg');
    const isPng = dataUrl.startsWith('data:image/png');

    if (isJpg || isPng) {
        return { dataUrl, isJpg, width: img.naturalWidth, height: img.naturalHeight };
    }

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 600;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return {
        dataUrl: canvas.toDataURL('image/png'),
        isJpg: false,
        width: canvas.width,
        height: canvas.height
    };
}

/**
 * Converte una serie di immagini in un unico PDF con orientamento configurabile
 */
export async function convertImagesToPdf(imageList, orientation = 'portrait') {
    if (!imageList || imageList.length === 0) throw new Error('Nessuna immagine fornita.');
    const doc = await PDFDocument.create();

    for (const item of imageList) {
        const prep = await loadAndPrepareImage(item.dataUrl);
        const embedded = prep.isJpg ? await doc.embedJpg(prep.dataUrl) : await doc.embedPng(prep.dataUrl);

        let pw, ph;
        if (orientation === 'landscape') {
            [pw, ph] = [PageSizes.A4[1], PageSizes.A4[0]]; // 841.89 x 595.28 pt
        } else if (orientation === 'portrait') {
            [pw, ph] = PageSizes.A4; // 595.28 x 841.89 pt
        } else {
            // Formato nativo adattivo in base alle proporzioni dell'immagine
            [pw, ph] = [prep.width * 0.75, prep.height * 0.75];
        }

        const page = doc.addPage([pw, ph]);
        const scale = Math.min(pw / prep.width, ph / prep.height) * 0.92;
        const dw = prep.width * scale;
        const dh = prep.height * scale;
        const dx = (pw - dw) / 2;
        const dy = (ph - dh) / 2;

        page.drawImage(embedded, { x: dx, y: dy, width: dw, height: dh });
    }

    const pdfBytes = await doc.save();
    return await saveGeneratedPdf(pdfBytes, 'immagini_unite.pdf');
}

/**
 * Salva il PDF generato su disco (Tauri o Download Web)
 */
async function saveGeneratedPdf(bytes, suggestedName) {
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (invoke) {
        try {
            const b64 = uint8ArrayToBase64(bytes);
            return await invoke('pick_and_save_pdf', { suggestedName, base64Data: b64 });
        } catch (err) {
            console.error('Errore salvataggio nativo:', err);
        }
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);
    return suggestedName;
}

// textDetector.js - Rilevamento coordinate e bounding box del testo esistente (Strada B)
import { getCurrentDoc } from '../core/pdfRenderer.js';

/**
 * Individua se il click dell'utente corrisponde a un elemento di testo preesistente
 * @param {number} normX Coordinata X normalizzata [0.0, 1.0]
 * @param {number} normY Coordinata Y normalizzata [0.0, 1.0]
 * @param {number} pageNum Numero di pagina (1-based)
 * @returns {Promise<Object|null>} Dati dell'elemento trovato o null
 */
export async function findTextAtPosition(normX, normY, pageNum) {
    const doc = getCurrentDoc();
    if (!doc || pageNum < 1 || pageNum > doc.numPages) return null;

    try {
        const page = await doc.getPage(pageNum);
        const vp = page.getViewport({ scale: 1.0 });
        const pw = vp.width;
        const ph = vp.height;
        const content = await page.getTextContent();

        for (const item of content.items) {
            const raw = item.str;
            if (!raw || !raw.trim()) continue;

            const tx = item.transform[4];
            const ty = item.transform[5];
            const scaleY = Math.hypot(item.transform[2], item.transform[3]) || item.height || 12;
            const itemH = item.height || scaleY;
            const itemW = item.width;

            // (tx, ty) è la baseline del testo: convertiamo in coordinate top-left DOM
            const baselineDomY = ph - ty;
            const topDomY = baselineDomY - (itemH * 0.85);
            const totalH = itemH * 1.25;

            const itemNormX = tx / pw;
            const itemNormW = itemW / pw;
            const itemNormY = Math.max(0, topDomY / ph);
            const itemNormH = Math.min(1.0, totalH / ph);

            const marginX = 0.008;
            const marginY = 0.012;

            const isInside = (
                normX >= (itemNormX - marginX) &&
                normX <= (itemNormX + itemNormW + marginX) &&
                normY >= (itemNormY - marginY) &&
                normY <= (itemNormY + itemNormH + marginY)
            );

            if (isInside) {
                return {
                    hit: true,
                    text: raw,
                    fontSize: Math.round(scaleY),
                    box: {
                        normX: Math.max(0, itemNormX - 0.003),
                        normY: Math.max(0, itemNormY - 0.003),
                        normW: Math.min(1.0, itemNormW + 0.006),
                        normH: Math.min(1.0, itemNormH + 0.006)
                    }
                };
            }
        }
    } catch (err) {
        console.warn("Errore rilevamento testo nel documento:", err);
    }
    return null;
}

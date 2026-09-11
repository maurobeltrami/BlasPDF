// annotationBake.js - Baking vettoriale permanente delle annotazioni su stream PDF
import { PDFDocument, rgb, StandardFonts } from '../../vendor/pdf-lib.esm.min.js';

/**
 * Converte una stringa colore esadecimale (#RRGGBB) in componente colore pdf-lib
 */
function parseColor(hex) {
    if (!hex || hex === '#000000') return rgb(0, 0, 0);
    if (hex === '#ffffff') return rgb(1, 1, 1);
    if (hex.startsWith('#') && hex.length === 7) {
        return rgb(
            parseInt(hex.slice(1, 3), 16) / 255,
            parseInt(hex.slice(3, 5), 16) / 255,
            parseInt(hex.slice(5, 7), 16) / 255
        );
    }
    return rgb(0, 0, 0);
}

/**
 * Applica tutte le annotazioni accumulate direttamente nel dizionario binario del PDF
 */
export async function bakeAnnotations(pdfBytes, pageAnnotations) {
    if (!pageAnnotations || pageAnnotations.size === 0) return pdfBytes;
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const fonts = new Map();

    const getFont = async (fam, bold) => {
        const k = `${fam}_${bold}`;
        if (fonts.has(k)) return fonts.get(k);
        let fn = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
        if (fam === 'Times-Roman') fn = bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman;
        if (fam === 'Courier') fn = bold ? StandardFonts.CourierBold : StandardFonts.Courier;
        const embedded = await doc.embedFont(fn);
        fonts.set(k, embedded);
        return embedded;
    };

    for (const [pageNum, items] of pageAnnotations.entries()) {
        if (pageNum > doc.getPageCount()) continue;
        const page = doc.getPage(pageNum - 1);
        const pw = page.getWidth(), ph = page.getHeight();

        for (const a of items) {
            const x = a.normX * pw;
            const width = (a.normW || 0.1) * pw;
            const height = (a.normH || 0.05) * ph;
            const y = ph - (a.normY * ph) - height;

            if (a.type === 'whiteout') {
                page.drawRectangle({
                    x, y, width, height,
                    color: a.color === '#000000' ? rgb(0, 0, 0) : rgb(1, 1, 1)
                });
            } else if (a.type === 'text') {
                const f = await getFont(a.fontFamily, a.bold);
                page.drawText(a.text, {
                    x,
                    y: ph - (a.normY * ph) - (a.fontSize || 14),
                    size: a.fontSize || 14,
                    font: f,
                    color: parseColor(a.color)
                });
            } else if ((a.type === 'signature' || a.type === 'image') && a.dataUrl) {
                try {
                    const isJpg = a.dataUrl.startsWith('data:image/jpeg') || a.dataUrl.startsWith('data:image/jpg');
                    const img = isJpg ? await doc.embedJpg(a.dataUrl) : await doc.embedPng(a.dataUrl);
                    page.drawImage(img, { x, y, width, height });
                } catch (err) {
                    console.error('Errore embedding immagine nel PDF:', err);
                }
            }
        }
    }
    return await doc.save();
}

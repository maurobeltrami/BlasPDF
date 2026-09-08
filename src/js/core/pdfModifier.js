// pdfModifier.js - Motore di manipolazione vettoriale delle pagine con PDF-Lib
import { PDFDocument, degrees } from '../../vendor/pdf-lib.esm.min.js';

function safeBuffer(data) {
    if (!data || data.byteLength === 0) {
        throw new Error("Buffer del documento PDF non valido o vuoto.");
    }
    return data instanceof Uint8Array ? data : new Uint8Array(data);
}

/**
 * Ruota una specifica pagina di un angolo dato (es. 90, 180, 270 gradi)
 * @param {Uint8Array} pdfBytes Buffer binario del documento
 * @param {number} pageNum Numero pagina (1-based)
 * @param {number} angleDelta Variazione angolo (predefinito 90)
 * @returns {Promise<Uint8Array>} Nuovo buffer binario modificato
 */
export async function rotatePage(pdfBytes, pageNum, angleDelta = 90) {
    const bytes = safeBuffer(pdfBytes);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const page = doc.getPage(pageNum - 1);
    const currentAngle = page.getRotation().angle || 0;
    const newAngle = (currentAngle + angleDelta + 360) % 360;
    page.setRotation(degrees(newAngle));
    return await doc.save();
}

/**
 * Rimuove una pagina specifica dal documento
 * @param {Uint8Array} pdfBytes Buffer binario
 * @param {number} pageNum Numero pagina da eliminare (1-based)
 * @returns {Promise<Uint8Array>} Nuovo buffer binario
 */
export async function deletePage(pdfBytes, pageNum) {
    const bytes = safeBuffer(pdfBytes);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    if (doc.getPageCount() <= 1) {
        throw new Error("Impossibile eliminare l'unica pagina rimasta del documento.");
    }
    doc.removePage(pageNum - 1);
    return await doc.save();
}

/**
 * Sposta una pagina da una posizione a un'altra all'interno del documento
 * @param {Uint8Array} pdfBytes Buffer binario
 * @param {number} fromIndex Indice di partenza (0-based)
 * @param {number} toIndex Indice di destinazione (0-based)
 * @returns {Promise<Uint8Array>} Nuovo buffer binario con pagine riordinate
 */
export async function reorderPage(pdfBytes, fromIndex, toIndex) {
    const bytes = safeBuffer(pdfBytes);
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= totalPages || toIndex >= totalPages) {
        return pdfBytes;
    }

    // Costruisce il nuovo array di indici delle pagine
    const indices = Array.from({ length: totalPages }, (_, i) => i);
    const [moved] = indices.splice(fromIndex, 1);
    indices.splice(toIndex, 0, moved);

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, indices);
    copiedPages.forEach(p => newDoc.addPage(p));

    return await newDoc.save();
}

/**
 * Unisce un secondo documento PDF in coda a quello principale (Merge)
 * @param {Uint8Array} baseBytes Documento base
 * @param {Uint8Array} appendBytes Documento da accodare
 * @returns {Promise<Uint8Array>} Buffer del documento unificato
 */
export async function mergePdfs(baseBytes, appendBytes) {
    const bBytes = safeBuffer(baseBytes);
    const aBytes = safeBuffer(appendBytes);
    const baseDoc = await PDFDocument.load(bBytes, { ignoreEncryption: true });
    const appendDoc = await PDFDocument.load(aBytes, { ignoreEncryption: true });

    const pageCount = appendDoc.getPageCount();
    const indices = Array.from({ length: pageCount }, (_, i) => i);
    const copiedPages = await baseDoc.copyPages(appendDoc, indices);

    copiedPages.forEach(p => baseDoc.addPage(p));
    return await baseDoc.save();
}

/**
 * Estrae una o più pagine generando un nuovo documento autonomo (Split)
 * @param {Uint8Array} pdfBytes Buffer del documento originale
 * @param {number[]} pageIndices Indici delle pagine da estrarre (0-based)
 * @returns {Promise<Uint8Array>} Buffer del nuovo documento estratto
 */
export async function extractPages(pdfBytes, pageIndices) {
    const bytes = safeBuffer(pdfBytes);
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);

    copiedPages.forEach(p => newDoc.addPage(p));
    return await newDoc.save();
}

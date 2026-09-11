// pdfOptimizer.js - Ottimizzazione e ricompressione degli stream COS di documenti PDF
import { PDFDocument } from '../../vendor/pdf-lib.esm.min.js';
import { uint8ArrayToBase64 } from '../events/exportManager.js';

/**
 * Ottimizza un documento PDF ricomprimendo gli stream di oggetti COS
 */
export async function optimizePdf(pdfBytes) {
    if (!pdfBytes || pdfBytes.length === 0) throw new Error('Buffer PDF non valido.');

    const originalSize = pdfBytes.length;
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    // Salva abilitando la compressione degli stream di oggetti (Object Streams)
    const optimizedBytes = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false
    });

    const newSize = optimizedBytes.length;
    const savedBytes = originalSize - newSize;
    const percentSaved = Math.max(0, Math.round((savedBytes / originalSize) * 100));

    return {
        originalSize,
        newSize,
        savedBytes,
        percentSaved,
        optimizedBytes
    };
}

/**
 * Salva il documento PDF ottimizzato su disco locale
 */
export async function saveOptimizedPdf(optimizedBytes, suggestedName = 'documento_ottimizzato.pdf') {
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (invoke) {
        try {
            const b64 = uint8ArrayToBase64(optimizedBytes);
            return await invoke('pick_and_save_pdf', {
                suggestedName,
                base64Data: b64
            });
        } catch (err) {
            console.error('Errore salvataggio PDF ottimizzato nativo:', err);
        }
    }

    const blob = new Blob([optimizedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);
    return suggestedName;
}

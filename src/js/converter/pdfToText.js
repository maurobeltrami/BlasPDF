// pdfToText.js - Estrazione del testo strutturato da documenti PDF in formato TXT o Markdown
import { uint8ArrayToBase64 } from '../events/exportManager.js';

/**
 * Estrae il contenuto testuale di ogni pagina ricostruendo righe e paragrafi
 */
export async function extractTextFromPdf(pdfBytes, asMarkdown = false, onProgress = null) {
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) throw new Error('PDF.js non disponibile.');

    const doc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    let output = '';

    for (let i = 1; i <= doc.numPages; i++) {
        if (onProgress) onProgress(i, doc.numPages);
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();

        const separator = asMarkdown
            ? `\n\n## 📄 Pagina ${i}\n\n`
            : `\n\n--- PAGINA ${i} ---\n\n`;

        output += separator;

        // Raggruppa frammenti con stessa coordinata Y per formare le righe
        let lastY = null;
        let line = '';

        for (const item of textContent.items) {
            const currentY = Math.round(item.transform[5]);
            if (lastY !== null && Math.abs(currentY - lastY) > 4) {
                output += line.trim() + '\n';
                line = '';
            }
            line += item.str + ' ';
            lastY = currentY;
        }
        if (line.trim()) output += line.trim() + '\n';
    }

    return output.trim();
}

/**
 * Salva il testo estratto come file .txt o .md sul computer locale
 */
export async function saveExtractedText(textContent, format = 'txt', defaultName = 'testo_estratto') {
    const fileName = `${defaultName}.${format}`;
    const encoder = new TextEncoder();
    const bytes = encoder.encode(textContent);
    const b64 = uint8ArrayToBase64(bytes);

    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (invoke) {
        try {
            return await invoke('pick_and_save_any_file', {
                suggestedName: fileName,
                filterName: format.toUpperCase(),
                filterExt: format,
                base64Data: b64
            });
        } catch (err) {
            console.error('Errore salvataggio testo nativo:', err);
        }
    }

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return fileName;
}

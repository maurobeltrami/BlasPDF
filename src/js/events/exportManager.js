// exportManager.js - Gestore del salvataggio ed esportazione file PDF (nativo Tauri e Web)
import { State } from '../core/stateManager.js';

/**
 * Converte un buffer Uint8Array in stringa Base64
 */
export function uint8ArrayToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Converte una stringa Base64 in buffer Uint8Array
 */
export function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Salva il documento PDF modificato su disco (dialogo nativo Tauri o download browser)
 */
export async function saveCurrentPdf() {
    if (!State.pdfBytes || State.totalPages === 0) {
        alert('Nessun documento PDF aperto da salvare.');
        return;
    }

    const defaultName = State.fileName ? `modificato_${State.fileName}` : 'documento_modificato.pdf';

    // 1. Percorso Nativo Desktop (Tauri 2)
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (invoke) {
        try {
            const base64 = uint8ArrayToBase64(State.pdfBytes);
            const savedPath = await invoke('pick_and_save_pdf', {
                suggestedName: defaultName,
                base64Data: base64
            });
            if (savedPath) {
                alert(`File salvato con successo:\n${savedPath}`);
            }
            return;
        } catch (err) {
            console.error('Errore salvataggio nativo Tauri:', err);
        }
    }

    // 2. Fallback Browser Standard (Blob Download)
    const blob = new Blob([State.pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultName;
    link.click();
    URL.revokeObjectURL(url);
}

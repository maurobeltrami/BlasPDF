// closeHandler.js - Intercettazione chiusura finestra con verifica modifiche non salvate
import { State } from '../core/stateManager.js';
import { saveCurrentPdf } from './exportManager.js';

/**
 * Inizializza l'ascolto degli eventi di chiusura finestra desktop e browser
 */
export function initCloseHandler() {
    const modal = document.getElementById('unsavedModal');
    const btnCancel = document.getElementById('btnUnsavedCancel');
    const btnDiscard = document.getElementById('btnUnsavedDiscard');
    const btnSave = document.getElementById('btnUnsavedSave');

    async function exitApp() {
        const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
        if (invoke) {
            try {
                await invoke('close_app');
            } catch (_) {
                window.close();
            }
        } else {
            window.close();
        }
    }

    btnCancel?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
    });

    btnDiscard?.addEventListener('click', async () => {
        if (modal) modal.style.display = 'none';
        await exitApp();
    });

    btnSave?.addEventListener('click', async () => {
        const saved = await saveCurrentPdf();
        if (saved) {
            if (modal) modal.style.display = 'none';
            await exitApp();
        }
    });

    // Ascolto evento richiesta di chiusura inviato da Rust
    const tauriEvent = window.__TAURI__?.event;
    if (tauriEvent?.listen) {
        tauriEvent.listen('request_close_window', async () => {
            if (!State.isModified) {
                await exitApp();
            } else if (modal) {
                modal.style.display = 'flex';
            }
        });
    }
}

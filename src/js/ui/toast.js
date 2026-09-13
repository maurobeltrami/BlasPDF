// toast.js - Sistema di notifiche in-app moderno e non bloccante per BlasPDF
let toastContainer = null;

function ensureToastContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'blasToastContainer';
        toastContainer.className = 'blas-toast-container';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

/**
 * Mostra una notifica toast elegante e non bloccante
 * @param {string} message Testo della notifica
 * @param {'info' | 'success' | 'warning' | 'error'} type Tipo di notifica
 * @param {number} duration Durata in millisecondi (default 3500ms)
 */
export function showToast(message, type = 'info', duration = 3500) {
    const container = ensureToastContainer();

    const toast = document.createElement('div');
    toast.className = `blas-toast blas-toast-${type}`;

    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };

    const iconSpan = document.createElement('span');
    iconSpan.className = 'blas-toast-icon';
    iconSpan.textContent = icons[type] || 'ℹ️';

    const textSpan = document.createElement('span');
    textSpan.className = 'blas-toast-text';
    textSpan.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'blas-toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => dismissToast(toast);

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    // Animazione di ingresso
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    if (duration > 0) {
        setTimeout(() => {
            dismissToast(toast);
        }, duration);
    }

    return toast;
}

function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove('visible');
    toast.classList.add('hiding');
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 250);
}

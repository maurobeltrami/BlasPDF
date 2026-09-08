// textFormatter.js - Menu galleggiante di formattazione testo (Font, Dimensione, Stile, Colore)
let currentPopover = null;
const state = {
    fontFamily: 'Helvetica',
    fontSize: 14,
    isBold: false,
    color: '#000000'
};

const COLORS = ['#000000', '#3a86ff', '#e63946', '#2ec4b6', '#ffffff'];
const SIZES = [10, 12, 14, 16, 18, 24, 32, 48];

export function getFormatState() { return { ...state }; }
export function setFormatState(props = {}) { Object.assign(state, props); }

export function createFormattingPopover(targetInput, container, onCommit, onCancel, onChange) {
    removeFormattingPopover();
    const popover = document.createElement('div');
    popover.className = 'text-formatter-popover';

    // Evita la propagazione degli eventi verso l'overlay o la perdita del focus
    ['mousedown', 'click', 'pointerdown'].forEach(evt => {
        popover.addEventListener(evt, (e) => e.stopPropagation());
    });

    // 1. Selettore Font Family
    const fontSel = document.createElement('select');
    ['Helvetica', 'Times-Roman', 'Courier'].forEach(f => {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        if (f === state.fontFamily) opt.selected = true;
        fontSel.appendChild(opt);
    });
    fontSel.addEventListener('change', () => {
        state.fontFamily = fontSel.value;
        onChange?.(getFormatState());
    });

    // 2. Selettore Dimensione
    const sizeSel = document.createElement('select');
    SIZES.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = `${s}pt`;
        if (s === state.fontSize) opt.selected = true;
        sizeSel.appendChild(opt);
    });
    sizeSel.addEventListener('change', () => {
        state.fontSize = parseInt(sizeSel.value, 10);
        onChange?.(getFormatState());
    });

    // 3. Grassetto
    const boldBtn = document.createElement('button');
    boldBtn.type = 'button';
    boldBtn.className = `fmt-btn ${state.isBold ? 'active' : ''}`;
    boldBtn.textContent = 'B';
    boldBtn.style.fontWeight = 'bold';
    boldBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.isBold = !state.isBold;
        boldBtn.classList.toggle('active', state.isBold);
        onChange?.(getFormatState());
    });

    // 4. Colori
    const palette = document.createElement('div');
    palette.className = 'fmt-color-palette';
    COLORS.forEach(c => {
        const dot = document.createElement('div');
        dot.className = `fmt-color-dot ${c === state.color ? 'active' : ''}`;
        dot.style.backgroundColor = c;
        if (c === '#ffffff') dot.style.border = '1px solid #666';
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            state.color = c;
            palette.querySelectorAll('.fmt-color-dot').forEach(d => d.classList.toggle('active', d === dot));
            onChange?.(getFormatState());
        });
        palette.appendChild(dot);
    });

    // 5. Pulsanti Conferma e Annulla
    const btnConfirm = document.createElement('button');
    btnConfirm.type = 'button';
    btnConfirm.className = 'fmt-btn fmt-btn-confirm';
    btnConfirm.textContent = '✓';
    btnConfirm.title = 'Conferma testo (Invio)';
    btnConfirm.addEventListener('click', (e) => { e.preventDefault(); onCommit?.(); });

    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.className = 'fmt-btn fmt-btn-cancel';
    btnCancel.textContent = '✕';
    btnCancel.title = 'Annulla (Esc)';
    btnCancel.addEventListener('click', (e) => { e.preventDefault(); onCancel?.(); });

    popover.appendChild(fontSel);
    popover.appendChild(sizeSel);
    popover.appendChild(boldBtn);
    popover.appendChild(palette);
    popover.appendChild(btnConfirm);
    popover.appendChild(btnCancel);

    container.appendChild(popover);
    currentPopover = popover;

    // Posizionamento intelligente con calcolo dei bordi del foglio
    const containerW = container.clientWidth || 800;
    const popoverW = popover.offsetWidth || 340;
    let left = targetInput.offsetLeft;
    if (left + popoverW > containerW - 10) {
        left = Math.max(10, containerW - popoverW - 10);
    }
    if (left < 10) left = 10;

    const inputTop = targetInput.offsetTop;
    const inputH = targetInput.offsetHeight || 28;
    const placeBelow = inputTop < 60;

    if (placeBelow) {
        popover.style.transform = 'none';
        popover.style.top = `${inputTop + inputH + 8}px`;
    } else {
        popover.style.transform = 'translateY(-100%) translateY(-8px)';
        popover.style.top = `${inputTop}px`;
    }
    popover.style.left = `${left}px`;

    return popover;
}

export function removeFormattingPopover() {
    if (currentPopover) {
        currentPopover.remove();
        currentPopover = null;
    }
}

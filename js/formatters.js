/**
 * js/formatters.js - Input Masking, Formatting & Text Auto-Fit Engine
 * Handles real-time currency formatting, cursor preservation, rate/period validation,
 * calculation target state toggling, and canvas-based dynamic text fitting.
 */

(function () {
    'use strict';

function formatCurrencyInput(input) {
    if (!input) return;

    let selectionStart = 0;
    try {
        selectionStart = input.selectionStart || 0;
    } catch (e) {
        // Some input types (like number) don't support selectionStart
    }
    
    let oldVal = input.value;
    let raw = oldVal.replace(/[^0-9.]/g, '');

    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');

    let newVal = "";
    if (raw !== "") {
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? "." + parts[1] : "";

        let formattedInt = "";
        if (integerPart) {
            // Strip leading zeros so e.g. deleting '1' from '1,000,000'
            // leaves '' (empty) instead of collapsing '000000' → 0.
            const stripped = integerPart.replace(/^0+/, '');
            if (stripped === '') {
                // All zeros — only show '0' when there IS a decimal part
                formattedInt = decimalPart ? '0' : '';
            } else {
                // Use Intl.NumberFormat to avoid ReDoS vulnerability (CWE-1333)
                // BigInt handles arbitrary precision for large loan amounts
                try {
                    formattedInt = new Intl.NumberFormat('en-US').format(BigInt(stripped));
                } catch (e) {
                    console.warn('Currency formatting error:', e);
                    formattedInt = stripped; // Fallback
                }
            }
        }

        newVal = formattedInt + decimalPart;

    }

    if (oldVal !== newVal) {
        input.value = newVal;
        restoreCursorPosition(input, oldVal, newVal, selectionStart);
    }
}

/**
 * Helper to restore cursor position after formatting
 */
function restoreCursorPosition(input, oldVal, newVal, selectionStart) {
    // If cursor was at the very end of old string, put it at the very end of new string
    if (selectionStart >= oldVal.length) {
        try {
            input.setSelectionRange(newVal.length, newVal.length);
        } catch (e) {}
        return;
    }

    // Number of commas before the cursor in the old string
    let oldCommas = (oldVal.slice(0, selectionStart).match(/,/g) || []).length;
    
    // We want the cursor to stay after the same number of non-comma characters.
    let targetNonCommas = selectionStart - oldCommas;
    
    let newPos = 0;
    let nonCommaCount = 0;
    while (newPos < newVal.length && nonCommaCount < targetNonCommas) {
        if (newVal[newPos] !== ',') {
            nonCommaCount++;
        }
        newPos++;
    }
    
    try { 
        input.setSelectionRange(newPos, newPos); 
    } catch (e) { 
        /* Ignore */ 
    }
}

function formatRateInputBlur(input) {
    if (!input) return;
    let val = input.value.trim();
    if (val === '') return;

    if (!isNaN(parseFloat(val))) {
        if (!val.includes('.')) {
            input.value = val + ".00";
        } else if (val.endsWith('.')) {
            input.value = val + "00";
        } else if (val.split('.')[1].length === 1) {
            input.value = val + "0";
        }
    }
}

function validatePeriodInput(input) {
    if (!input) return;
    let val = input.value.replace(/[^0-9]/g, '');
    input.value = val;
}

function validateRateInput(input) {
    if (!input) return;
    let val = input.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    val = val.replace(/^0+(?=\d)/, '');
    if (val.startsWith('.')) {
        val = '0' + val;
    }
    input.value = val;
}

/* ================= DATE INPUT ================= */
/* All date input code has been moved to js/dateinput.js for isolation.
 * Do NOT add date-related functions here — edit dateinput.js instead. */

/**
 * Updates input field states based on active calculation target
 * @param {Object} inputGroups - DOM elements for input groups
 * @param {Object} inputs - Input field elements
 * @param {Object} errors - Error label elements
 * @param {string} activeKey - Currently active calculation key
 * @param {string} lang - Current language code
 */
function updateInputState(inputGroups, inputs, errors, activeKey, lang) {
    Object.keys(inputGroups).forEach(key => {
        if (!inputGroups[key]) return;

        inputGroups[key].classList.remove('error-state');
        if (errors[key]) errors[key].classList.add('hidden');

        // Find the radio button corresponding to this group
        const radio = inputGroups[key].querySelector(`input[type="radio"][value="${key}"]`);

        if (key === activeKey) {
            inputGroups[key].classList.add('active-target');
            if (inputs[key]) {
                inputs[key].readOnly = true;
                inputs[key].placeholder = t(lang, 'willBeCalculated');
            }
            // Ensure visual sync: check the radio if it exists
            if (radio) radio.checked = true;
        } else {
            inputGroups[key].classList.remove('active-target');
            if (inputs[key]) {
                inputs[key].readOnly = false;
                inputs[key].placeholder = t(lang, 'inputPlaceholder');
            }
            if (radio) radio.checked = false;
        }
    });
}
/**
 * Automatically adjusts the font size of an input element so that its text
 * (or placeholder if value is empty) fits inside its available width.
 * Maintains an accessible minimum font size floor (default 10.5px).
 *
 * @param {HTMLInputElement} input - The input element to adjust.
 * @param {number} [maxFontSize=13] - Maximum font size in px.
 * @param {number} [minFontSize=10.5] - Minimum font size floor in px.
 */
function autoFitInputText(input, maxFontSize = null, minFontSize = null) {
    if (!input || !(input instanceof HTMLElement)) return;

    const max = maxFontSize !== null ? maxFontSize : (parseFloat(input.dataset?.autofitMax) || 13);
    const min = minFontSize !== null ? minFontSize : (parseFloat(input.dataset?.autofitMin) || 10);

    // Reset font size to measure at maxFontSize
    input.style.fontSize = `${max}px`;

    const text = input.value || input.placeholder || '';
    if (!text) return;

    // Calculate available horizontal space inside the input
    const style = window.getComputedStyle(input);
    const pl = parseFloat(style.paddingLeft) || 0;
    const pr = parseFloat(style.paddingRight) || 0;
    const availWidth = input.clientWidth - pl - pr;

    if (availWidth <= 0) return;

    if (!autoFitInputText._ctx) {
        const canvas = document.createElement('canvas');
        autoFitInputText._ctx = canvas.getContext('2d');
    }

    const ctx = autoFitInputText._ctx;
    const fontFamily = style.fontFamily || 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    const fontWeight = style.fontWeight || '400';
    ctx.font = `${fontWeight} ${max}px ${fontFamily}`;

    const textWidth = ctx.measureText(text).width;
    if (textWidth > availWidth) {
        const scale = availWidth / textWidth;
        const fittedSize = Math.max(min, Math.floor(max * scale * 10) / 10);
        input.style.fontSize = `${fittedSize}px`;
    }
}
window.autoFitInputText = autoFitInputText;

/**
 * Auto-fits all elements marked with .autofit-input or [data-autofit="true"].
 * @param {HTMLElement|Document} [scope=document]
 */
function autoFitAllInputs(scope = document) {
    if (!scope || typeof scope.querySelectorAll !== 'function') return;
    const inputs = scope.querySelectorAll('.autofit-input, [data-autofit="true"]');
    inputs.forEach(inp => {
        const max = parseFloat(inp.dataset.autofitMax) || 13;
        const min = parseFloat(inp.dataset.autofitMin) || 10;
        autoFitInputText(inp, max, min);
    });
}
window.autoFitAllInputs = autoFitAllInputs;

// Event delegation for live typing in any autofit input
if (typeof document !== 'undefined') {
    document.addEventListener('input', (e) => {
        if (e.target && (e.target.classList.contains('autofit-input') || e.target.getAttribute('data-autofit') === 'true')) {
            const max = parseFloat(e.target.dataset.autofitMax) || 13;
            const min = parseFloat(e.target.dataset.autofitMin) || 10.5;
            autoFitInputText(e.target, max, min);
        }
    }, { passive: true });
}

// Debounced viewport resize listener for auto-fitting inputs
if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
        if (window._autofitResizeTimer) cancelAnimationFrame(window._autofitResizeTimer);
        window._autofitResizeTimer = requestAnimationFrame(() => {
            autoFitAllInputs();
        });
    }, { passive: true });
}


    // Public API exposure
    window.formatCurrencyInput = formatCurrencyInput;
    window.formatRateInputBlur = formatRateInputBlur;
    window.validatePeriodInput = validatePeriodInput;
    window.validateRateInput = validateRateInput;
    window.updateInputState = updateInputState;
    window.autoFitInputText = autoFitInputText;
    window.autoFitAllInputs = autoFitAllInputs;

    window.Formatters = {
        formatCurrency: formatCurrencyInput,
        formatRateBlur: formatRateInputBlur,
        validatePeriod: validatePeriodInput,
        validateRate: validateRateInput,
        updateState: updateInputState,
        autoFit: autoFitInputText,
        autoFitAll: autoFitAllInputs
    };
})();

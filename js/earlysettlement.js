// js/earlysettlement.js - Early Settlement Calculator
// PROTECTED: Do NOT modify unless explicitly requested.
// Extracted from app.js for isolation — all early settlement UI logic lives here.

/* ================= EARLY SETTLEMENT MODULE ================= */

/**
 * Module-level references set during init.
 * These bridge the app.js IIFE scope to this global module.
 */
let _esAppState = null;
let _esFormInputs = null;
let _esFormatDate = null;

/**
 * Initialize early settlement mode: wire toggle, date picker, fee input,
 * and calc button. Must be called once from app.js setupEventListeners.
 *
 * @param {Object} appState - AppState from app.js
 * @param {Object} formInputs - formInputs from app.js
 * @param {Function} animateToggleBounce - bounce animation helper
 * @param {Function} formatDateFn - formatDate helper from app.js
 */
function initEarlySettlement(appState, formInputs, animateToggleBounce, formatDateFn) {
    _esAppState = appState;
    _esFormInputs = formInputs;
    _esFormatDate = formatDateFn;

    const earlySettlementToggle = document.getElementById('early-settlement-toggle');
    const earlySettlementSection = document.getElementById('early-settlement-section');
    const settlementDateDisplay = document.getElementById('settlement-date-display');
    const settlementDateNative = document.getElementById('settlement-date-native');
    const settlementFeeInput = document.getElementById('early-settlement-fee');
    const settlementDatePickerBtn = document.getElementById('settlement-date-picker-btn');

    // --- Toggle expand/collapse ---
    if (earlySettlementToggle && earlySettlementSection) {
        earlySettlementToggle.addEventListener('change', (e) => {
            if (typeof haptic !== 'undefined') haptic('medium');
            animateToggleBounce(e.target);

            if (e.target.checked) {
                earlySettlementSection.classList.remove('max-h-0', 'opacity-0');
                earlySettlementSection.style.maxHeight = '800px';
                earlySettlementSection.classList.add('opacity-100');

                // Reset error state
                const esError = document.getElementById('error-early-settlement');
                if (esError) esError.classList.add('hidden');

                // Set default settlement date to today if empty
                if (settlementDateNative && !settlementDateNative.value) {
                    settlementDateNative.valueAsDate = new Date();
                    if (settlementDateDisplay) settlementDateDisplay.value = formatDateFn(new Date());
                }

            } else {
                earlySettlementSection.classList.add('max-h-0', 'opacity-0');
                earlySettlementSection.style.maxHeight = '0';
                earlySettlementSection.classList.remove('opacity-100');
            }
        });
    }

    // --- Initialize settlement date input ---
    if (settlementDateDisplay && settlementDateNative) {
        if (typeof initDateInput === 'function') {
            initDateInput(settlementDateDisplay, settlementDateNative);
        }

        // Date picker button
        if (settlementDatePickerBtn) {
            settlementDatePickerBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                if (typeof openDatePicker === 'function') {
                    openDatePicker(settlementDateDisplay, _esAppState.lang, (selectedDate) => {
                        if (selectedDate) {
                            settlementDateDisplay.value = formatDateFn(selectedDate);
                            const y = selectedDate.getFullYear();
                            const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                            const d = String(selectedDate.getDate()).padStart(2, '0');
                            settlementDateNative.value = `${y}-${m}-${d}`;
                            settlementDateNative.dispatchEvent(new Event('change'));
                        }
                    });
                } else {
                    settlementDateNative.showPicker();
                }
            });
        }

        // Calculate Button
        const esCalcBtn = document.getElementById('early-settlement-calc-btn');
        if (esCalcBtn) {
            esCalcBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                if (earlySettlementToggle?.checked) updateEarlySettlement(true);
            });
        }
    }

    // --- Settlement fee input handler - with max 100% validation ---
    if (settlementFeeInput) {
        settlementFeeInput.addEventListener('input', () => {
            if (typeof validateRateInput === 'function') validateRateInput(settlementFeeInput);
            const val = parseFloat(settlementFeeInput.value);
            if (!isNaN(val) && val > 100) settlementFeeInput.parentElement.classList.add('error-state');
            else settlementFeeInput.parentElement.classList.remove('error-state');
        });
        settlementFeeInput.addEventListener('blur', () => {
            if (typeof formatRateInputBlur === 'function') formatRateInputBlur(settlementFeeInput);
        });
    }
}

/**
 * Core early settlement calculation and UI update.
 * Called on calc button press.
 *
 * @param {boolean} showError - Whether to show error messages
 */
function updateEarlySettlement(showError = false) {
    const resultsPanel = document.getElementById('settlement-results');
    const settlementDateNative = document.getElementById('settlement-date-native');
    const settlementFeeInput = document.getElementById('early-settlement-fee');

    const errorEl = document.getElementById('error-early-settlement');

    if (!resultsPanel) return;

    if (showError && errorEl) errorEl.classList.add('hidden'); // Reset error state

    // 1. Check if we have a valid main loan calculation (schedule exists)
    if (!_esAppState.schedule || _esAppState.schedule.length === 0) {
        resultsPanel.classList.add('opacity-0', 'max-h-0');
        resultsPanel.classList.remove('opacity-100', 'max-h-96');
        if (errorEl && showError) {
            // Show specific 'Loan not calculated' error
            errorEl.textContent = t(_esAppState.lang, 'errorLoanNotCalculated');
            errorEl.classList.remove('hidden');
        }
        return;
    }

    // 2. Check if local inputs are valid
    // Fees must be filled (can be 0, but not empty)
    const feeVal = settlementFeeInput?.value.trim();
    if (!settlementDateNative?.value || feeVal === '' || feeVal === undefined) {
        resultsPanel.classList.add('opacity-0', 'max-h-0');
        resultsPanel.classList.remove('opacity-100', 'max-h-96');
        if (errorEl && showError) {
            // Show standard 'Check inputs' error
            errorEl.textContent = t(_esAppState.lang, 'errorCheckInputs');
            errorEl.classList.remove('hidden');
        }
        return;
    }

    if (errorEl) errorEl.classList.add('hidden');

    const [y, m, d] = settlementDateNative.value.split('-');
    const settlementDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));

    // Get fee percentage
    const feePercentage = parseFloat((settlementFeeInput?.value || '0').replace(/,/g, '')) || 0;

    // Get annual rate
    const annualRate = parseFloat((_esFormInputs.rate?.value || '0').replace(/,/g, '')) || 0;

    // Get stamp rate
    const stampRateInput = document.getElementById('stamp-rate');
    const stampRate = parseFloat((stampRateInput?.value || '0').replace(/,/g, '')) || 0;

    // Calculate
    if (typeof calculateEarlySettlement !== 'function') {
        console.error('calculateEarlySettlement not found');
        return;
    }

    const result = calculateEarlySettlement(_esAppState.schedule, settlementDate, feePercentage, annualRate, stampRate);

    if (!result.valid) {
        resultsPanel.classList.add('opacity-0', 'max-h-0');
        resultsPanel.classList.remove('opacity-100', 'max-h-96');
        return;
    }

    // Update UI - animate in
    resultsPanel.classList.remove('opacity-0', 'max-h-0');
    resultsPanel.classList.add('opacity-100', 'max-h-96');

    // Last paid installment
    const lastPaidEl = document.getElementById('settlement-last-paid');
    if (lastPaidEl) {
        if (result.lastPaidDate) {
            lastPaidEl.textContent = `#${result.lastPaidInstallment} (${_esFormatDate(result.lastPaidDate)})`;
        } else {
            lastPaidEl.textContent = '-';
        }
    }

    // Principal balance
    const principalEl = document.getElementById('settlement-principal');
    if (principalEl) {
        principalEl.textContent = fmt(result.principalBalance);
    }

    // Fee
    const feeEl = document.getElementById('settlement-fee');
    if (feeEl) {
        feeEl.textContent = fmt(result.fee);
    }

    // Accrued interest with days
    const daysEl = document.getElementById('settlement-days');
    if (daysEl) {
        daysEl.textContent = `(${result.daysElapsed} ${t(_esAppState.lang, 'days')})`;
    }

    const interestEl = document.getElementById('settlement-interest');
    if (interestEl) {
        interestEl.textContent = fmt(result.accruedInterest);
    }

    // Settlement before stamp = principal + fee + accrued interest
    const beforeStamp = result.principalBalance + result.fee + result.accruedInterest;
    const beforeStampEl = document.getElementById('settlement-before-stamp');
    if (beforeStampEl) {
        beforeStampEl.textContent = fmt(beforeStamp);
    }


    // Stamp on settlement amount row
    const stampOnTotalEl = document.getElementById('settlement-stamp-on-total');
    const stampOnTotalRow = document.getElementById('settlement-stamp-total-row');
    if (stampOnTotalEl && stampOnTotalRow) {
        if (result.settlementStamp > 0) {
            stampOnTotalEl.textContent = fmt(result.settlementStamp);
            stampOnTotalRow.classList.remove('hidden');
        } else {
            stampOnTotalRow.classList.add('hidden');
        }
    }

    // Total (with stamp)
    const totalEl = document.getElementById('settlement-total');
    if (totalEl) {
        totalEl.textContent = fmt(result.totalSettlement);
    }
}

/**
 * Show subsidiary error messages when main calculation fails.
 * Called from appCalculate() on error path.
 */
function updateSubsidiaryErrors() {
    // 1. Early Settlement Error
    const esToggle = document.getElementById('early-settlement-toggle');
    const esResults = document.getElementById('settlement-results');
    const esError = document.getElementById('error-early-settlement');

    if (esToggle && esToggle.checked) {
        if (esResults) {
            esResults.classList.add('opacity-0', 'max-h-0');
            esResults.classList.remove('opacity-100', 'max-h-96');
        }
        if (esError) esError.classList.remove('hidden');
    } else {
        if (esError) esError.classList.add('hidden');
    }

    // 2. Self-Sufficient Error
    const ssToggle = document.getElementById('self-sufficient-toggle');
    const ssResults = document.getElementById('self-sufficient-results');
    const ssError = document.getElementById('error-self-sufficient');

    if (ssToggle && ssToggle.checked) {
        if (ssResults) {
            ssResults.classList.add('opacity-0');
            ssResults.classList.remove('opacity-100');
            ssResults.style.maxHeight = '0';
        }
        if (ssError) ssError.classList.remove('hidden');
    } else {
        if (ssError) ssError.classList.add('hidden');
    }
}

/**
 * Reset early settlement fields and UI to default state.
 * Called from resetApp in app.js.
 */
function resetEarlySettlement() {
    const earlySettlementToggle = document.getElementById('early-settlement-toggle');
    if (earlySettlementToggle) {
        earlySettlementToggle.checked = false;
        earlySettlementToggle.dispatchEvent(new Event('change'));
    }
    document.getElementById('early-settlement-fee').value = '';
    document.getElementById('settlement-results')?.classList.add('hidden');
}

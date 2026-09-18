// js/selfsufficient.js - Self-Sufficient TD Doubling Mode
// PROTECTED: Do NOT modify unless explicitly requested.
// Extracted from app.js for isolation — all self-sufficient UI logic lives here.

/* ================= SELF-SUFFICIENT MODULE ================= */

/**
 * Module-level references set during init.
 * These bridge the app.js IIFE scope to this global module.
 */
let _ssAppState = null;
let _ssDateInputs = null;
let _ssFormInputs = null;
let _ssAppCalculate = null;
let _ssLastSolution = null;
let _ssLastInputs = null;

/**
 * Compute the default CD interest accrual date from a booking date.
 * Rule: take (bookingDate + 1 day), adjust Friday → Sunday / Saturday → Sunday,
 * then place that day-of-month into the NEXT calendar month.
 * Weekend: Friday = day 5, Saturday = day 6 (Egyptian banking week).
 *
 * @param {Date} bookingDate
 * @returns {Date}
 */
function ssDefaultCdInterestDate(bookingDate) {
    // Step 1: advance by 1 day
    const next = new Date(bookingDate);
    next.setDate(next.getDate() + 1);

    // Step 2: weekend adjustment — the only possible weekend hit is Friday (day 5),
    // which occurs when bookingDate is Thursday. No CD is ever booked on Fri/Sat,
    // so booking+1 can only land on Mon–Fri. Fri → +2 to land on Sunday.
    if (next.getDay() === 5) next.setDate(next.getDate() + 2);

    // Step 3: put that day-of-month in the next calendar month after booking
    return new Date(bookingDate.getFullYear(), bookingDate.getMonth() + 1, next.getDate());
}

/**
 * Compute the default CD maturity date from a booking date.
 * Default is 3 years (36 months) from booking.
 *
 * @param {Date} bookingDate
 * @returns {Date}
 */
function ssDefaultCdMaturityDate(bookingDate, cdInterestDate = null) {
    if (!bookingDate) bookingDate = new Date();
    const targetYear = bookingDate.getFullYear() + 3;
    const targetMonth = bookingDate.getMonth();
    const targetDay = cdInterestDate ? cdInterestDate.getDate() : ssDefaultCdInterestDate(bookingDate).getDate();
    const mat = new Date(targetYear, targetMonth, targetDay);
    if (mat.getMonth() !== targetMonth) mat.setDate(0);
    return mat;
}

/**
 * Calculate remaining full months between booking date and maturity date.
 *
 * @param {Date} bookingDate
 * @param {Date} maturityDate
 * @returns {number}
 */
function ssCalculateRemainingMonths(bookingDate, maturityDate) {
    if (!bookingDate || !maturityDate) return 0;
    let months = (maturityDate.getFullYear() - bookingDate.getFullYear()) * 12 + (maturityDate.getMonth() - bookingDate.getMonth());
    if (maturityDate.getDate() < bookingDate.getDate()) {
        months -= 1;
    }
    return Math.max(0, months);
}

/**
 * Update the remaining tenor badge on a CD1 card element.
 *
 * @param {Object} cd
 * @param {HTMLElement} cardEl
 */
function updateRemainingBadge(cd, cardEl) {
    if (!cardEl) return;
    const badge = cardEl.querySelector('.ss-cd-remaining-badge');
    if (!badge) return;
    const bkISO = document.getElementById('ss-booking-date-native')?.value;
    const bkDate = bkISO ? _ssParseNativeDate(bkISO) : new Date();
    const matDate = cd.maturityISO ? _ssParseNativeDate(cd.maturityISO) : null;
    const lang = _ssAppState?.lang || 'en';
    if (matDate && bkDate) {
        const months = ssCalculateRemainingMonths(bkDate, matDate);
        badge.textContent = t(lang, 'remainingTenorLabel').replace('{n}', months);
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

/**
 * Update Quick Match button and Tenor Advisory banner based on CD1 maturities and loan period.
 *
 * @param {number} loanPeriod
 */
function updateTenorAdvisoryAndMatchButton(loanPeriod) {
    const bkISO = document.getElementById('ss-booking-date-native')?.value;
    const bkDate = bkISO ? _ssParseNativeDate(bkISO) : new Date();

    // Keep Loan End Date display synchronized
    ssUpdateLoanEndDateDisplay(bkDate, loanPeriod);

    const candidateTenors = ssCd1List
        .map(c => {
            const matDate = c.maturityISO ? _ssParseNativeDate(c.maturityISO) : null;
            return matDate ? ssCalculateRemainingMonths(bkDate, matDate) : null;
        })
        .filter(m => m !== null && m > 0);

    const matchBtn = document.getElementById('ss-match-cd1-btn');
    const matchText = document.getElementById('ss-match-cd1-text');
    const advisoryBox = document.getElementById('ss-tenor-advisory');
    const advisoryIcon = document.getElementById('ss-tenor-advisory-icon');
    const advisoryText = document.getElementById('ss-tenor-advisory-text');
    const lang = _ssAppState?.lang || 'en';

    if (candidateTenors.length > 0) {
        const minMaturity = Math.min(...candidateTenors);
        if (matchBtn && matchText) {
            matchBtn.classList.remove('hidden');
            matchText.textContent = t(lang, 'matchCd1TenorBtn').replace('{n}', minMaturity);
        }

        if (advisoryBox && advisoryIcon && advisoryText && loanPeriod > 0) {
            advisoryBox.classList.remove('hidden');
            if (loanPeriod > minMaturity) {
                // Advisory warning style
                advisoryBox.className = 'col-span-2 p-2.5 rounded-lg text-xs leading-snug border transition-all bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300';
                advisoryIcon.textContent = '⚠️';
                advisoryText.className = 'font-medium text-amber-900 dark:text-amber-200';
                advisoryText.textContent = t(lang, 'advisoryMaturityExceeded')
                    .replace('{loan}', loanPeriod)
                    .replace('{cd}', minMaturity);
            } else {
                // Reassurance horizon style
                advisoryBox.className = 'col-span-2 p-2.5 rounded-lg text-xs leading-snug border transition-all bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800/60 text-green-800 dark:text-green-300';
                advisoryIcon.textContent = '✅';
                advisoryText.className = 'font-medium text-green-900 dark:text-green-200';
                advisoryText.textContent = t(lang, 'reassuranceMaturityMatched');
            }
        }
    } else {
        if (matchBtn) matchBtn.classList.add('hidden');
        if (advisoryBox) advisoryBox.classList.add('hidden');
    }
}

/**
 * Seed and display an SS CD-interest date field from a Date object.
 * @param {Date}   dateObj
 * @param {HTMLElement} nativeEl
 * @param {HTMLElement} displayEl
 */
function _ssSeedCdDateField(dateObj, nativeEl, displayEl) {
    if (!dateObj || !nativeEl) return;
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    nativeEl.value = iso;
    if (displayEl) {
        displayEl.value = (typeof dateBuildValue === 'function')
            ? dateBuildValue(d, m, String(y), false)
            : `${d}/${m}/${y}`;
        displayEl.dataset.iso = iso;
    }
}

/**
 * Parse an ISO-format native date input value into a Date, or null.
 */
function _ssParseNativeDate(isoStr) {
    if (!isoStr) return null;
    const parts = isoStr.split('-');
    if (parts.length !== 3) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Initialize self-sufficient mode: wire toggle, calc button, auto-populate
 * fields, and set defaults. Must be called once from app.js setupEventListeners.
 *
 * @param {Object} appState - AppState from app.js
 * @param {Object} dateInputs - dateInputs from app.js
 * @param {Object} formInputs - formInputs from app.js
 * @param {Function} animateToggleBounce - bounce animation helper
 * @param {Function} appCalculateFn - the appCalculate function for use after solver
 */
/**
 * Derive the first installment date: 5th of second month after booking date.
 * @param {Date} bookingDate
 * @returns {Date}
 */
function ssGetFirstInstallmentDate(bookingDate) {
    if (!bookingDate) bookingDate = new Date();
    return new Date(bookingDate.getFullYear(), bookingDate.getMonth() + 2, 5);
}

/**
 * Update the visible First Installment Date display in the Loan Terms card.
 * @param {Date} [bookingDate]
 */
function ssUpdateFirstInstDateDisplay(bookingDate) {
    const displayEl = document.getElementById('ss-first-inst-date-display');
    if (!displayEl) return;
    if (!bookingDate) {
        const ssBDNative = document.getElementById('ss-booking-date-native');
        bookingDate = ssBDNative?.value ? _ssParseNativeDate(ssBDNative.value) : new Date();
    }
    const m1 = ssGetFirstInstallmentDate(bookingDate);
    const d = String(m1.getDate()).padStart(2, '0');
    const m = String(m1.getMonth() + 1).padStart(2, '0');
    const y = m1.getFullYear();
    displayEl.textContent = (typeof dateBuildValue === 'function')
        ? dateBuildValue(d, m, String(y), false)
        : `${d}/${m}/${y}`;
}

/**
 * Calculate the loan end date (final installment date).
 * @param {Date} [bookingDate]
 * @param {number} [loanPeriod]
 * @param {number} [freq=1]
 * @returns {Date|null}
 */
function ssCalculateLoanEndDate(bookingDate, loanPeriod, freq = 1) {
    if (!bookingDate) {
        const ssBDNative = document.getElementById('ss-booking-date-native');
        bookingDate = ssBDNative?.value ? _ssParseNativeDate(ssBDNative.value) : new Date();
    }
    const p = (typeof loanPeriod === 'number' && loanPeriod > 0)
        ? loanPeriod
        : (parseInt(document.getElementById('ss-loan-period')?.value) || 0);
    if (!p || p <= 0) return null;
    const m1 = ssGetFirstInstallmentDate(bookingDate);
    if (!m1) return null;
    const d = new Date(m1.getTime());
    d.setMonth(m1.getMonth() + (p - 1) * freq);
    if (d.getDate() !== m1.getDate()) {
        d.setDate(0);
    }
    return d;
}

/**
 * Update the visible Loan End Date display in the Loan Terms card.
 * @param {Date} [bookingDate]
 * @param {number} [loanPeriod]
 */
function ssUpdateLoanEndDateDisplay(bookingDate, loanPeriod) {
    const displayEl = document.getElementById('ss-loan-end-date-display');
    if (!displayEl) return;
    const endDate = ssCalculateLoanEndDate(bookingDate, loanPeriod);
    if (endDate) {
        const d = String(endDate.getDate()).padStart(2, '0');
        const m = String(endDate.getMonth() + 1).padStart(2, '0');
        const y = endDate.getFullYear();
        displayEl.textContent = (typeof dateBuildValue === 'function')
            ? dateBuildValue(d, m, String(y), false)
            : `${d}/${m}/${y}`;
    } else {
        displayEl.textContent = '-';
    }
}

/**
 * Auto-fill loan rate to highest CD1 rate + 2.0% unless manually overridden.
 */
function ssAutoFillLoanRate() {
    if (ssLoanRateManuallyEdited) return;
    const loanRateInput = document.getElementById('ss-loan-rate');
    if (!loanRateInput) return;

    const cd1Rates = ssCd1List
        .map(c => safeParseFloat(c.rate))
        .filter(r => !isNaN(r) && r > 0);

    if (cd1Rates.length === 0) {
        loanRateInput.value = '';
        return;
    }
    const maxCd1 = Math.max(...cd1Rates);
    const suggestedRate = maxCd1 + 2.0;
    loanRateInput.value = suggestedRate.toFixed(2);
}

let ssCd1List = [
    { id: 1, amount: '', redemption: '', rate: '', dateISO: '', maturityISO: '' }
];
let nextSsCd1Id = 2;
let ssTd2RateManuallyEdited = false;
let ssLoanRateManuallyEdited = false;

function renderSsCd1List(newIdToAnimate = null) {
    const listEl = document.getElementById('ss-cd1-list');
    if (!listEl) return;

    const lang = _ssAppState?.lang || 'en';
    const bkISO = document.getElementById('ss-booking-date-native')?.value;
    const bkDate = bkISO ? _ssParseNativeDate(bkISO) : new Date();

    listEl.innerHTML = '';
    ssCd1List.forEach((cd, index) => {
        const row = document.createElement('div');
        row.id = `ss-cd1-card-${cd.id}`;
        row.className = `ss-cd-card p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-900/60 shadow-xs transition-all space-y-2.5 ${cd.id === newIdToAnimate ? 'item-enter' : ''}`;

        const cdLabel = `CD₁ #${index + 1}`;

        row.innerHTML = `
            <!-- Card Header: Title & Action Button -->
            <div class="flex items-center justify-between pb-1.5 border-b border-green-100 dark:border-green-900/40">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-green-900 dark:text-green-200">${cdLabel}</span>
                    <span class="ss-cd-remaining-badge hidden text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/70 text-green-800 dark:text-green-300 text-center whitespace-nowrap"></span>
                </div>
                <div>
                    ${ssCd1List.length > 1 ? `
                    <button type="button" class="ss-cd-remove-btn flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-red-500 dark:hover:text-red-400 py-0.5 px-1.5 rounded transition-colors" data-id="${cd.id}" title="${t(lang, 'removeCollateralBtn')}" aria-label="${t(lang, 'removeCollateralBtn')}">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span>${t(lang, 'removeCollateralBtn')}</span>
                    </button>
                    ` : `
                    <button type="button" class="ss-cd-clear-btn flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 py-0.5 px-1.5 rounded transition-colors" data-id="${cd.id}" title="${t(lang, 'clearCollateralBtn')}" aria-label="${t(lang, 'clearCollateralBtn')}">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        <span>${t(lang, 'clearCollateralBtn')}</span>
                    </button>
                    `}
                </div>
            </div>

            <!-- Row 1: Core Financial Values with Dedicated Field Labels -->
            <div class="grid grid-cols-12 gap-2 items-end">
                <div class="col-span-4">
                    <label class="block text-[10.5px] sm:text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1 whitespace-nowrap truncate" data-lang-key="collateralNominalLabel">${t(lang, 'collateralNominalLabel')}</label>
                    <div class="input-group py-1 px-1.5">
                        <input type="text" inputmode="decimal" class="text-input select-text ss-cd-amount p-0 text-center tracking-tight" style="font-size: 11px !important;" data-id="${cd.id}" placeholder="100,000" aria-label="${t(lang, 'collateralNominalLabel')}" title="${t(lang, 'collateralNominalLabel')}">
                    </div>
                </div>
                <div class="col-span-5">
                    <label class="block text-[10.5px] sm:text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1 whitespace-nowrap truncate" data-lang-key="collateralRedemptionLabel">${t(lang, 'collateralRedemptionLabel')}</label>
                    <div class="input-group py-1 px-1.5">
                        <input type="text" inputmode="decimal" class="text-input select-text ss-cd-redemption p-0 text-center tracking-tight" style="font-size: 11px !important;" data-id="${cd.id}" placeholder="90,000" aria-label="${t(lang, 'collateralRedemptionLabel')}" title="${t(lang, 'collateralRedemptionLabel')}">
                    </div>
                </div>
                <div class="col-span-3">
                    <label class="block text-[10.5px] sm:text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1 whitespace-nowrap truncate" data-lang-key="colHeaderRate">${t(lang, 'colHeaderRate')}</label>
                    <div class="input-group py-1 px-1.5">
                        <input type="text" inputmode="decimal" class="text-input select-text ss-cd-rate p-0 text-center" style="font-size: 11px !important;" data-id="${cd.id}" placeholder="19.0" aria-label="${t(lang, 'colHeaderRate')}" title="${t(lang, 'colHeaderRate')}">
                    </div>
                </div>
            </div>

            <!-- Row 2: Date Fields with Dedicated Field Labels -->
            <div class="pt-2 border-t border-green-100/80 dark:border-green-900/40 grid grid-cols-12 gap-2 items-end">
                <div class="col-span-6">
                    <label class="block text-[10.5px] sm:text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1 whitespace-nowrap truncate" data-lang-key="maturityDateLabel">${t(lang, 'maturityDateLabel')}</label>
                    <div class="input-group relative py-1 px-1 flex items-center gap-0.5" title="${t(lang, 'maturityDateLabel')}">
                        <input type="text" inputmode="numeric" class="text-input flex-1 min-w-0 select-text z-10 ss-cd-maturity-display p-0 text-center tracking-tight" style="font-size: 11px !important;" data-id="${cd.id}" placeholder="DD/MM/YYYY" maxlength="10" autocomplete="off" aria-label="${t(lang, 'maturityDateLabel')}" title="${t(lang, 'maturityDateLabel')}">
                        <button type="button" class="ss-cd-maturity-picker-btn flex-shrink-0 w-4.5 h-4.5 p-0.5 flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded z-20 transition-colors relative" data-id="${cd.id}" aria-label="Open maturity date picker">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="text-gray-400 pointer-events-none">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <input type="date" class="ss-cd-maturity-native absolute inset-0 opacity-0 w-full h-full pointer-events-none" tabindex="-1" data-id="${cd.id}">
                        </button>
                    </div>
                </div>
                <div class="col-span-6">
                    <label class="block text-[10.5px] sm:text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1 whitespace-nowrap truncate" data-lang-key="nextCouponDateLabel">${t(lang, 'nextCouponDateLabel')}</label>
                    <div class="input-group relative py-1 px-1 flex items-center gap-0.5" title="${t(lang, 'nextCouponDateLabel')}">
                        <input type="text" inputmode="numeric" class="text-input flex-1 min-w-0 select-text z-10 ss-cd-date-display p-0 text-center tracking-tight" style="font-size: 11px !important;" data-id="${cd.id}" placeholder="DD/MM/YYYY" maxlength="10" autocomplete="off" aria-label="${t(lang, 'nextCouponDateLabel')}" title="${t(lang, 'nextCouponDateLabel')}">
                        <button type="button" class="ss-cd-picker-btn flex-shrink-0 w-4.5 h-4.5 p-0.5 flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded z-20 transition-colors relative" data-id="${cd.id}" aria-label="Open date picker">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="text-gray-400 pointer-events-none">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <input type="date" class="ss-cd-date-native absolute inset-0 opacity-0 w-full h-full pointer-events-none" tabindex="-1" data-id="${cd.id}">
                        </button>
                    </div>
                </div>
            </div>
        `;

        const amountInput = row.querySelector('.ss-cd-amount');
        const redemptionInput = row.querySelector('.ss-cd-redemption');
        const rateInput = row.querySelector('.ss-cd-rate');
        const dateDisplay = row.querySelector('.ss-cd-date-display');
        const dateNative = row.querySelector('.ss-cd-date-native');
        const pickerBtn = row.querySelector('.ss-cd-picker-btn');
        const matDisplay = row.querySelector('.ss-cd-maturity-display');
        const matNative = row.querySelector('.ss-cd-maturity-native');
        const matPickerBtn = row.querySelector('.ss-cd-maturity-picker-btn');
        const removeBtn = row.querySelector('.ss-cd-remove-btn');
        const clearBtn = row.querySelector('.ss-cd-clear-btn');

        if (amountInput) amountInput.value = cd.amount || '';
        if (redemptionInput) redemptionInput.value = cd.redemption || '';
        if (rateInput) rateInput.value = cd.rate || '';

        const adjustAmountFontSize = (input) => {
            if (!input) return;
            const len = input.value.length;
            if (len >= 12) input.style.fontSize = '10px';
            else input.style.fontSize = '11px';
        };

        // Seed Next Coupon date if available
        if (cd.dateISO && dateNative) {
            dateNative.value = cd.dateISO;
            const p = cd.dateISO.split('-');
            if (p.length === 3 && dateDisplay) {
                dateDisplay.value = (typeof dateBuildValue === 'function')
                    ? dateBuildValue(p[2], p[1], p[0], false)
                    : `${p[2]}/${p[1]}/${p[0]}`;
                dateDisplay.dataset.iso = cd.dateISO;
            }
        }

        // Seed Maturity date if available
        if (cd.maturityISO && matNative) {
            matNative.value = cd.maturityISO;
            const p = cd.maturityISO.split('-');
            if (p.length === 3 && matDisplay) {
                matDisplay.value = (typeof dateBuildValue === 'function')
                    ? dateBuildValue(p[2], p[1], p[0], false)
                    : `${p[2]}/${p[1]}/${p[0]}`;
                matDisplay.dataset.iso = cd.maturityISO;
            }
        }

        // Initial badge update
        updateRemainingBadge(cd, row);

        if (amountInput) {
            adjustAmountFontSize(amountInput);
            amountInput.addEventListener('input', (e) => {
                if (typeof formatCurrencyInput === 'function') formatCurrencyInput(e.target);
                adjustAmountFontSize(e.target);
                cd.amount = e.target.value;
                const p = parseInt(document.getElementById('ss-loan-period')?.value) || 36;
                updateTenorAdvisoryAndMatchButton(p);
            });
        }

        if (redemptionInput) {
            adjustAmountFontSize(redemptionInput);
            redemptionInput.addEventListener('input', (e) => {
                if (typeof formatCurrencyInput === 'function') formatCurrencyInput(e.target);
                adjustAmountFontSize(e.target);
                cd.redemption = e.target.value;
            });
        }

        if (rateInput) {
            rateInput.addEventListener('input', (e) => {
                if (typeof validateRateInput === 'function') validateRateInput(e.target);
                cd.rate = e.target.value;
                ssAutoFillLoanRate();
            });
            rateInput.addEventListener('blur', (e) => {
                if (typeof formatRateInputBlur === 'function') formatRateInputBlur(e.target);
                cd.rate = e.target.value;
                ssAutoFillLoanRate();
            });
        }

        const syncInterestDateFromMaturityDate = (maturityIsoStr) => {
            if (!maturityIsoStr) return;
            const mParts = maturityIsoStr.split('-');
            if (mParts.length !== 3) return;
            const mDay = parseInt(mParts[2], 10);
            if (!mDay || isNaN(mDay)) return;

            const bkISO = document.getElementById('ss-booking-date-native')?.value;
            const bkDate = bkISO ? _ssParseNativeDate(bkISO) : new Date();

            let targetYear = bkDate.getFullYear();
            let targetMonth = bkDate.getMonth() + 1;
            if (targetMonth > 11) {
                targetYear += Math.floor(targetMonth / 12);
                targetMonth = targetMonth % 12;
            }
            const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
            const validDay = Math.min(mDay, maxDays);
            const yStr = String(targetYear);
            const mStr = String(targetMonth + 1).padStart(2, '0');
            const dStr = String(validDay).padStart(2, '0');
            cd.dateISO = `${yStr}-${mStr}-${dStr}`;

            if (dateNative) dateNative.value = cd.dateISO;
            if (dateDisplay) {
                dateDisplay.value = (typeof dateBuildValue === 'function')
                    ? dateBuildValue(dStr, mStr, yStr, false)
                    : `${dStr}/${mStr}/${yStr}`;
                dateDisplay.dataset.iso = cd.dateISO;
                dateDisplay.classList.remove('text-red-500');
            }
            if (typeof updateSelfSufficient === 'function') updateSelfSufficient();
        };

        if (matDisplay && matNative && typeof initDateInput === 'function') {
            initDateInput(matDisplay, matNative);
            matNative.addEventListener('change', () => {
                cd.maturityISO = matNative.value;
                syncInterestDateFromMaturityDate(cd.maturityISO);
                updateRemainingBadge(cd, row);
                const p = parseInt(document.getElementById('ss-loan-period')?.value) || 36;
                updateTenorAdvisoryAndMatchButton(p);
            });
        }

        if (matPickerBtn && matDisplay && matNative) {
            matPickerBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                if (typeof openDatePicker === 'function') {
                    openDatePicker(matDisplay, _ssAppState?.lang || 'en', (selectedDate) => {
                        if (selectedDate) {
                            const y = selectedDate.getFullYear();
                            const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                            const d = String(selectedDate.getDate()).padStart(2, '0');
                            matDisplay.value = (typeof dateBuildValue === 'function')
                                ? dateBuildValue(d, m, String(y), false)
                                : `${d}/${m}/${y}`;
                            matNative.value = `${y}-${m}-${d}`;
                            cd.maturityISO = matNative.value;
                            syncInterestDateFromMaturityDate(cd.maturityISO);
                            updateRemainingBadge(cd, row);
                            const p = parseInt(document.getElementById('ss-loan-period')?.value) || 36;
                            updateTenorAdvisoryAndMatchButton(p);
                        }
                    });
                } else {
                    matNative.showPicker();
                }
            });
        }

        if (dateDisplay && dateNative && typeof initDateInput === 'function') {
            initDateInput(dateDisplay, dateNative);
            dateNative.addEventListener('change', () => {
                cd.dateISO = dateNative.value;
                if (typeof updateSelfSufficient === 'function') updateSelfSufficient();
            });
        }

        if (pickerBtn && dateDisplay && dateNative) {
            pickerBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                if (typeof openDatePicker === 'function') {
                    openDatePicker(dateDisplay, _ssAppState?.lang || 'en', (selectedDate) => {
                        if (selectedDate) {
                            const y = selectedDate.getFullYear();
                            const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                            const d = String(selectedDate.getDate()).padStart(2, '0');
                            dateDisplay.value = (typeof dateBuildValue === 'function')
                                ? dateBuildValue(d, m, String(y), false)
                                : `${d}/${m}/${y}`;
                            dateNative.value = `${y}-${m}-${d}`;
                            cd.dateISO = dateNative.value;
                            if (typeof updateSelfSufficient === 'function') updateSelfSufficient();
                        }
                    });
                } else {
                    dateNative.showPicker();
                }
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                row.classList.remove('item-enter');
                row.classList.add('item-exit');
                setTimeout(() => {
                    ssCd1List = ssCd1List.filter(c => c.id !== cd.id);
                    renderSsCd1List();
                    const p = parseInt(document.getElementById('ss-loan-period')?.value) || 36;
                    updateTenorAdvisoryAndMatchButton(p);
                    ssAutoFillLoanRate();
                }, 240);
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                cd.amount = '';
                cd.redemption = '';
                cd.rate = '';

                // Reset dates to defaults from booking date
                const bkISO = document.getElementById('ss-booking-date-native')?.value;
                const bkDate = bkISO ? _ssParseNativeDate(bkISO) : new Date();
                const defaultDate = bkDate ? ssDefaultCdInterestDate(bkDate) : new Date();
                const defaultMat = bkDate ? ssDefaultCdMaturityDate(bkDate, defaultDate) : new Date();
                const y = defaultDate.getFullYear();
                const m = String(defaultDate.getMonth() + 1).padStart(2, '0');
                const d = String(defaultDate.getDate()).padStart(2, '0');
                const my = defaultMat.getFullYear();
                const mm = String(defaultMat.getMonth() + 1).padStart(2, '0');
                const md = String(defaultMat.getDate()).padStart(2, '0');
                cd.dateISO = `${y}-${m}-${d}`;
                cd.maturityISO = `${my}-${mm}-${md}`;

                renderSsCd1List();
                const p = parseInt(document.getElementById('ss-loan-period')?.value) || 36;
                updateTenorAdvisoryAndMatchButton(p);
                ssAutoFillLoanRate();
                if (typeof updateSelfSufficient === 'function') updateSelfSufficient();
            });
        }

        listEl.appendChild(row);
    });
}

/**
 * Initialize self-sufficient mode: wire toggle, calc button, auto-populate
 * fields, and set defaults. Must be called once from app.js setupEventListeners.
 */
function initSelfSufficient(appState, dateInputs, formInputs, animateToggleBounce, appCalculateFn) {
    _ssAppState = appState;
    _ssDateInputs = dateInputs;
    _ssFormInputs = formInputs;
    _ssAppCalculate = appCalculateFn;

    // --- Toggle expand/collapse ---
    const ssToggle = document.getElementById('self-sufficient-toggle');
    if (ssToggle) {
        const ssSection = document.getElementById('self-sufficient-section');
        ssToggle.addEventListener('change', (e) => {
            if (typeof haptic !== 'undefined') haptic('medium');
            animateToggleBounce(e.target);

            if (e.target.checked) {
                ssSection.classList.remove('max-h-0', 'opacity-0');
                ssSection.style.maxHeight = '2400px';
                ssSection.classList.add('opacity-100');

                // Self-Sufficient mode is inherently a Secured Loan
                if (typeof window.setLoanType === 'function') {
                    window.setLoanType('secured');
                } else {
                    const securedBtn = document.getElementById('loan-type-secured-btn');
                    if (securedBtn) securedBtn.click();
                }
            } else {
                ssSection.classList.add('max-h-0', 'opacity-0');
                ssSection.style.maxHeight = '0';
                ssSection.classList.remove('opacity-100');
            }
        });
    }

    // --- Calc button ---
    const ssCalcBtn = document.getElementById('self-sufficient-calc-btn');
    if (ssCalcBtn) {
        ssCalcBtn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('light');
            updateSelfSufficient(true);
        });
    }

    // --- Offer Action Buttons (Copy & Print) ---
    const ssCopyBtn = document.getElementById('ss-copy-btn');
    if (ssCopyBtn) {
        ssCopyBtn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('light');
            copySelfSufficientOffer();
        });
    }

    const ssPrintBtn = document.getElementById('ss-print-btn');
    if (ssPrintBtn) {
        ssPrintBtn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('light');
            printSelfSufficientOffer();
        });
    }

    // --- Add CD1 Button ---
    const addCd1Btn = document.getElementById('ss-add-cd-btn');
    if (addCd1Btn) {
        addCd1Btn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('light');
            const bkISO = document.getElementById('ss-booking-date-native')?.value;
            const bkDate = bkISO ? _ssParseNativeDate(bkISO) : new Date();
            const defaultDate = bkDate ? ssDefaultCdInterestDate(bkDate) : new Date();
            const y = defaultDate.getFullYear();
            const m = String(defaultDate.getMonth() + 1).padStart(2, '0');
            const d = String(defaultDate.getDate()).padStart(2, '0');
            
            const defaultMat = bkDate ? ssDefaultCdMaturityDate(bkDate, defaultDate) : new Date();
            const my = defaultMat.getFullYear();
            const mm = String(defaultMat.getMonth() + 1).padStart(2, '0');
            const md = String(defaultMat.getDate()).padStart(2, '0');

            const newId = nextSsCd1Id++;
            ssCd1List.push({
                id: newId,
                amount: '',
                redemption: '',
                rate: '',
                dateISO: `${y}-${m}-${d}`,
                maturityISO: `${my}-${mm}-${md}`
            });
            renderSsCd1List(newId);
            const p = parseInt(document.getElementById('ss-loan-period')?.value) || 36;
            updateTenorAdvisoryAndMatchButton(p);
        });
    }

    // --- Clear All CD1 Button ---
    const clearCd1Btn = document.getElementById('ss-clear-cd-btn');
    if (clearCd1Btn) {
        clearCd1Btn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('medium');
            const bkISO = document.getElementById('ss-booking-date-native')?.value;
            const bkDate = bkISO ? _ssParseNativeDate(bkISO) : new Date();
            const defaultDate = bkDate ? ssDefaultCdInterestDate(bkDate) : new Date();
            const y = defaultDate.getFullYear();
            const m = String(defaultDate.getMonth() + 1).padStart(2, '0');
            const d = String(defaultDate.getDate()).padStart(2, '0');

            const defaultMat = bkDate ? ssDefaultCdMaturityDate(bkDate, defaultDate) : new Date();
            const my = defaultMat.getFullYear();
            const mm = String(defaultMat.getMonth() + 1).padStart(2, '0');
            const md = String(defaultMat.getDate()).padStart(2, '0');

            ssCd1List = [{
                id: 1,
                amount: '',
                redemption: '',
                rate: '',
                dateISO: `${y}-${m}-${d}`,
                maturityISO: `${my}-${mm}-${md}`
            }];
            nextSsCd1Id = 2;
            renderSsCd1List();
            const p = parseInt(document.getElementById('ss-loan-period')?.value) || 36;
            updateTenorAdvisoryAndMatchButton(p);
            ssAutoFillLoanRate();
            if (typeof updateSelfSufficient === 'function') updateSelfSufficient();
        });
    }

    // Track manual edits on CD2 Rate and Loan Rate
    const ssTd2RateInput = document.getElementById('td2-rate');
    if (ssTd2RateInput) {
        ssTd2RateInput.addEventListener('input', () => {
            ssTd2RateManuallyEdited = true;
        });
    }
    const ssLoanRateInput = document.getElementById('ss-loan-rate');
    if (ssLoanRateInput) {
        ssLoanRateInput.addEventListener('input', (e) => {
            if (!e.target.value || e.target.value.trim() === '') {
                ssLoanRateManuallyEdited = false;
                ssAutoFillLoanRate();
            } else {
                ssLoanRateManuallyEdited = true;
            }
        });
    }

    // --- Set defaults: Period, Admin Fees, Stamp Rate ---
    const ssLoanPeriodInput = document.getElementById('ss-loan-period');
    const ssAdminFeesInput = document.getElementById('ss-admin-fees');
    const ssStampRateInput = document.getElementById('ss-stamp-rate');
    if (ssLoanPeriodInput && !ssLoanPeriodInput.value) ssLoanPeriodInput.value = '36';
    if (ssAdminFeesInput && !ssAdminFeesInput.value) ssAdminFeesInput.value = '1';
    if (ssStampRateInput && !ssStampRateInput.value) ssStampRateInput.value = '0.2';

    if (ssLoanPeriodInput) {
        ssLoanPeriodInput.addEventListener('input', () => {
            const p = parseInt(ssLoanPeriodInput.value) || 0;
            updateTenorAdvisoryAndMatchButton(p);
        });
    }

    // --- Quick Match CD1 Tenor Button ---
    const matchCd1Btn = document.getElementById('ss-match-cd1-btn');
    if (matchCd1Btn) {
        matchCd1Btn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('light');
            const bkISO = document.getElementById('ss-booking-date-native')?.value;
            const bkDate = bkISO ? _ssParseNativeDate(bkISO) : new Date();

            const candidateTenors = ssCd1List
                .map(c => {
                    const matDate = c.maturityISO ? _ssParseNativeDate(c.maturityISO) : null;
                    return matDate ? ssCalculateRemainingMonths(bkDate, matDate) : null;
                })
                .filter(m => m !== null && m > 0);

            if (candidateTenors.length > 0) {
                const minMaturity = Math.min(...candidateTenors);
                const periodInput = document.getElementById('ss-loan-period');
                if (periodInput) {
                    periodInput.value = String(minMaturity);
                    updateTenorAdvisoryAndMatchButton(minMaturity);
                    if (typeof updateSelfSufficient === 'function') updateSelfSufficient();
                }
            }
        });
    }

    // --- SS Booking Date: seed with today, wire text input & picker ---
    const ssBDDisplay = document.getElementById('ss-booking-date-display');
    const ssBDNative  = document.getElementById('ss-booking-date-native');

    if (ssBDNative && !ssBDNative.value) {
        const today = new Date();
        const ty = today.getFullYear();
        const tm = String(today.getMonth() + 1).padStart(2, '0');
        const td = String(today.getDate()).padStart(2, '0');
        const todayISO = `${ty}-${tm}-${td}`;
        ssBDNative.value = todayISO;
        if (ssBDDisplay) {
            ssBDDisplay.value = (typeof dateBuildValue === 'function')
                ? dateBuildValue(td, tm, String(ty), false)
                : `${td}/${tm}/${ty}`;
            ssBDDisplay.dataset.iso = todayISO;
        }
    }

    if (ssBDDisplay && ssBDNative && typeof initDateInput === 'function') {
        initDateInput(ssBDDisplay, ssBDNative);
    }

    const ssBDPickerBtn = document.getElementById('ss-booking-date-picker-btn');
    if (ssBDPickerBtn && ssBDDisplay && ssBDNative) {
        ssBDPickerBtn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('light');
            if (typeof openDatePicker === 'function') {
                openDatePicker(ssBDDisplay, _ssAppState.lang, (selectedDate) => {
                    if (selectedDate) {
                        const y = selectedDate.getFullYear();
                        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const d = String(selectedDate.getDate()).padStart(2, '0');
                        ssBDDisplay.value = (typeof dateBuildValue === 'function')
                            ? dateBuildValue(d, m, String(y), false)
                            : `${d}/${m}/${y}`;
                        ssBDNative.value = `${y}-${m}-${d}`;
                        ssBDNative.dispatchEvent(new Event('change'));
                    }
                });
            } else {
                ssBDNative.showPicker();
            }
        });
    }

    // --- CD₂ Interest Date field ---
    const ssCD2Display = document.getElementById('ss-cd2-interest-date-display');
    const ssCD2Native  = document.getElementById('ss-cd2-interest-date-native');

    function seedCd2DateFromBooking(bkDate) {
        const cdDate = ssDefaultCdInterestDate(bkDate);
        if (ssCD2Native && !ssCD2Native.value) _ssSeedCdDateField(cdDate, ssCD2Native, ssCD2Display);
    }

    if (ssBDNative && ssBDNative.value) {
        const bd = _ssParseNativeDate(ssBDNative.value);
        if (bd) seedCd2DateFromBooking(bd);
    }

    if (ssBDNative) {
        ssBDNative.addEventListener('change', () => {
            const bd = _ssParseNativeDate(ssBDNative.value);
            if (!bd) return;
            const cdDate = ssDefaultCdInterestDate(bd);
            _ssSeedCdDateField(cdDate, ssCD2Native, ssCD2Display);

            const matDate = ssDefaultCdMaturityDate(bd, cdDate);
            const my = matDate.getFullYear();
            const mm = String(matDate.getMonth() + 1).padStart(2, '0');
            const md = String(matDate.getDate()).padStart(2, '0');

            // Also re-seed unedited CD1 dates
            const y = cdDate.getFullYear();
            const m = String(cdDate.getMonth() + 1).padStart(2, '0');
            const d = String(cdDate.getDate()).padStart(2, '0');
            ssCd1List.forEach(c => {
                if (!c.dateISO || c.dateISO === '') c.dateISO = `${y}-${m}-${d}`;
                if (!c.maturityISO || c.maturityISO === '') c.maturityISO = `${my}-${mm}-${md}`;
            });
            renderSsCd1List();
            const p = parseInt(document.getElementById('ss-loan-period')?.value) || 36;
            updateTenorAdvisoryAndMatchButton(p);
            ssUpdateFirstInstDateDisplay(bd);
        });
    }

    if (ssCD2Display && ssCD2Native && typeof initDateInput === 'function') initDateInput(ssCD2Display, ssCD2Native);

    const ssCD2PickerBtn = document.getElementById('ss-cd2-interest-date-picker-btn');
    if (ssCD2PickerBtn && ssCD2Display && ssCD2Native) {
        ssCD2PickerBtn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('light');
            if (typeof openDatePicker === 'function') {
                openDatePicker(ssCD2Display, _ssAppState.lang, (selectedDate) => {
                    if (selectedDate) {
                        const y = selectedDate.getFullYear();
                        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const d = String(selectedDate.getDate()).padStart(2, '0');
                        ssCD2Display.value = (typeof dateBuildValue === 'function')
                            ? dateBuildValue(d, m, String(y), false)
                            : `${d}/${m}/${y}`;
                        ssCD2Native.value = `${y}-${m}-${d}`;
                        ssCD2Native.dispatchEvent(new Event('change'));
                    }
                });
            } else {
                ssCD2Native.showPicker();
            }
        });
    }

    // Initial render of CD1 list with default dates
    const initialBkDate = (ssBDNative && ssBDNative.value) ? _ssParseNativeDate(ssBDNative.value) : new Date();
    const initialCdDate = initialBkDate ? ssDefaultCdInterestDate(initialBkDate) : new Date();
    const iy = initialCdDate.getFullYear();
    const im = String(initialCdDate.getMonth() + 1).padStart(2, '0');
    const id = String(initialCdDate.getDate()).padStart(2, '0');
    ssCd1List[0].dateISO = `${iy}-${im}-${id}`;

    const initialMatDate = initialBkDate ? ssDefaultCdMaturityDate(initialBkDate, initialCdDate) : new Date();
    const my = initialMatDate.getFullYear();
    const mm = String(initialMatDate.getMonth() + 1).padStart(2, '0');
    const md = String(initialMatDate.getDate()).padStart(2, '0');
    ssCd1List[0].maturityISO = `${my}-${mm}-${md}`;

    renderSsCd1List();
    updateTenorAdvisoryAndMatchButton(36);
    ssUpdateFirstInstDateDisplay(initialBkDate);
    ssAutoFillLoanRate();
}

/**
 * Core self-sufficient calculation and UI update.
 */
function updateSelfSufficient(showError = false) {
    if (!document.getElementById('self-sufficient-toggle').checked) return;
    if (updateSelfSufficient._fromSolver) return;

    const ssResults = document.getElementById('self-sufficient-results');
    const ssError = document.getElementById('error-self-sufficient');
    const td2RateInput = document.getElementById('td2-rate');
    const ssLoanRateInput = document.getElementById('ss-loan-rate');
    const ssLoanPeriodInput = document.getElementById('ss-loan-period');

    const td2R = safeParseFloat(td2RateInput?.value);
    const loanRate = safeParseFloat(ssLoanRateInput?.value);
    const loanPeriod = parseInt(ssLoanPeriodInput?.value) || 0;

    // Update tenor advisory and match button for current period
    updateTenorAdvisoryAndMatchButton(loanPeriod);

    // 1. Validate CD1 collaterals
    const validCd1s = ssCd1List
        .map(c => ({
            amount: safeParseFloat(c.amount) || 0,
            redemption: safeParseFloat(c.redemption) || 0,
            rate: safeParseFloat(c.rate) || 0,
            date: c.dateISO ? _ssParseNativeDate(c.dateISO) : null
        }))
        .filter(c => c.amount > 0 && c.rate > 0);

    if (validCd1s.length === 0 || isNaN(loanRate) || loanRate <= 0 || isNaN(loanPeriod) || loanPeriod <= 0 || isNaN(td2R) || td2R <= 0) {
        _ssLastSolution = null;
        _ssLastInputs = null;
        if (ssResults) {
            ssResults.classList.add('opacity-0');
            ssResults.classList.remove('opacity-100');
            ssResults.style.maxHeight = '0';
        }
        if (showError && ssError) {
            ssError.textContent = t(_ssAppState.lang, 'errorCheckInputs');
            ssError.classList.remove('hidden');
        }
        return;
    }

    const maxCd1Rate = Math.max(...validCd1s.map(c => c.rate));

    // 2. Build dates
    const isAdvanced = true;
    let bookingDate = new Date();
    const ssBDNative = document.getElementById('ss-booking-date-native');
    if (ssBDNative && ssBDNative.value) {
        const parts = ssBDNative.value.split('-');
        bookingDate = new Date(parts[0], parts[1] - 1, parts[2]);
    }

    const m1_Date = ssGetFirstInstallmentDate(bookingDate);

    const stampRate = parseFloat(document.getElementById('ss-stamp-rate').value) || 0;
    const adminFees = parseFloat(document.getElementById('ss-admin-fees').value) || 0;
    const freq = parseInt(document.getElementById('installment-freq')?.value) || 1;

    // 3. Call solver with multi-CD1 array
    if (typeof solveTdLoan !== 'function') {
        console.error('solveTdLoan not found');
        return;
    }

    const cd1FirstDate = validCd1s[0]?.date || null;
    const cd2FirstDate = _ssParseNativeDate(document.getElementById('ss-cd2-interest-date-native')?.value);

    const solution = solveTdLoan(
        validCd1s, maxCd1Rate, loanRate, loanPeriod,
        { bookingDate, m1_Date, isAdvanced },
        stampRate, adminFees, td2R, freq,
        cd1FirstDate, cd2FirstDate
    );

    if (!solution.valid) {
        _ssLastSolution = null;
        _ssLastInputs = null;
        if (ssResults) {
            ssResults.classList.add('opacity-0');
            ssResults.classList.remove('opacity-100');
            ssResults.style.maxHeight = '0';
        }
        if (showError && ssError) {
            ssError.textContent = t(_ssAppState.lang, 'ssErrorNoSolution');
            ssError.classList.remove('hidden');
        }
        return;
    }

    if (solution.exceedsCollateralLimit) {
        _ssLastSolution = null;
        _ssLastInputs = null;
        if (ssResults) {
            ssResults.classList.add('opacity-0');
            ssResults.classList.remove('opacity-100');
            ssResults.style.maxHeight = '0';
        }
        if (showError && ssError) {
            const rawMsg = t(_ssAppState.lang, 'ssErrorExceeds90Collateral');
            const msg = rawMsg
                .replace('{max}', fmt(solution.maxAllowedLoan))
                .replace('{gross}', fmt(solution.grossLoan));
            ssError.textContent = msg;
            ssError.classList.remove('hidden');
        }
        return;
    }

    // 4. Save state & Display results
    _ssLastSolution = solution;
    _ssLastInputs = {
        validCd1s,
        maxCd1Rate,
        loanRate,
        loanPeriod,
        td2R,
        bookingDate,
        freq
    };

    if (ssResults) {
        ssResults.classList.remove('opacity-0');
        ssResults.classList.add('opacity-100');
        ssResults.style.maxHeight = '1000px';
    }
    if (ssError) ssError.classList.add('hidden');

    document.getElementById('ss-gross-loan-display').textContent = fmt(solution.grossLoan);
    document.getElementById('ss-td2-display').textContent = fmt(solution.td2);
    document.getElementById('ss-admin-fees-display').textContent = fmt(solution.adminFeesAmount);

    const cdBeforeM1El = document.getElementById('ss-cd-interest-before-m1-display');
    if (cdBeforeM1El) cdBeforeM1El.textContent = fmt(solution.availableCdInterest || 0);

    document.getElementById('ss-monthly-interest-display').textContent = fmt(solution.monthlyTdInterest);
    document.getElementById('ss-installment-display').textContent = fmt(solution.installment);

    const surplusEl = document.getElementById('ss-monthly-surplus-display');
    surplusEl.textContent = fmt(solution.monthlySurplus);
    surplusEl.className = `font-bold select-text ${solution.monthlySurplus >= 0 ? 'text-green-600' : 'text-red-600'}`;

    const bufferRow = document.getElementById('ss-first-inst-buffer-row');
    const bufferDisplay = document.getElementById('ss-first-inst-buffer-display');
    if (bufferRow && bufferDisplay) {
        const buf = solution.firstInstBuffer || 0;
        if (buf > 0) {
            bufferDisplay.textContent = fmt(buf);
            bufferRow.classList.remove('hidden');
        } else {
            bufferDisplay.textContent = '-';
            bufferRow.classList.add('hidden');
        }
    }

    const leftoverRow = document.getElementById('ss-net-leftover-row');
    const leftoverDisplay = document.getElementById('ss-net-leftover-display');
    if (leftoverRow && leftoverDisplay) {
        const lft = solution.netLeftover || 0;
        if (lft > 0.005) {
            leftoverDisplay.textContent = fmt(lft);
            leftoverRow.classList.remove('hidden');
        } else {
            leftoverDisplay.textContent = '-';
            leftoverRow.classList.add('hidden');
        }
    }

    document.getElementById('ss-total-stamp-display').textContent = fmt(solution.totalStamp);
    document.getElementById('ss-total-tds-display').textContent = fmt(solution.totalTdsAtEnd);
    document.getElementById('ss-simple-alt-display').textContent = fmt(solution.simpleInterestAlt);

    const benefitEl = document.getElementById('ss-net-benefit-display');
    benefitEl.textContent = fmt(solution.netBenefit);
    benefitEl.className = `font-bold text-base select-text ${solution.netBenefit >= 0 ? 'text-green-600' : 'text-red-600'}`;

    const vsLabel = _ssAppState.lang === 'ar' ? 'مقابل' : 'vs';
    document.getElementById('ss-effective-rate-display').textContent = solution.effectiveRate.toFixed(2) + '%  (' + vsLabel + ' ' + maxCd1Rate.toFixed(2) + '%)';

    // 5. Auto-fill gross loan into main calculator when user clicked SS Calculate button
    if (showError) {
        _ssFormInputs.rate.value = String(loanRate);
        _ssFormInputs.period.value = String(loanPeriod);

        const ssBDNativeSync = document.getElementById('ss-booking-date-native');
        if (ssBDNativeSync && ssBDNativeSync.value && _ssDateInputs.startNative) {
            _ssDateInputs.startNative.value = ssBDNativeSync.value;
            _ssDateInputs.startNative.dispatchEvent(new Event('change'));
        }
        const currentAmount = safeParseFloat(_ssFormInputs.amount.value);
        if (currentAmount !== solution.grossLoan) {
            _ssFormInputs.amount.value = String(solution.grossLoan);
            if (typeof formatCurrencyInput === 'function') formatCurrencyInput(_ssFormInputs.amount);
        }

        // Auto-fill CD1 into main collaterals table
        if (typeof window.setMainCollateralsFromCd1 === 'function') {
            window.setMainCollateralsFromCd1(validCd1s);
        }

        updateSelfSufficient._fromSolver = true;
        try {
            const mainAdminFees = document.getElementById('admin-fees');
            const mainStampRate = document.getElementById('stamp-rate');
            if (mainAdminFees) mainAdminFees.value = adminFees > 0 ? String(adminFees) : '';
            if (mainStampRate) mainStampRate.value = stampRate > 0 ? String(stampRate) : '';
            const advToggle = document.getElementById('advanced-toggle');
            if (advToggle && !advToggle.checked) {
                advToggle.checked = true;
                advToggle.dispatchEvent(new Event('change'));
            }
            _ssAppCalculate();
        } finally {
            updateSelfSufficient._fromSolver = false;
        }

        if (ssResults) {
            const doScroll = () => {
                const navEl = document.querySelector('nav');
                const navH  = navEl ? navEl.offsetHeight : 0;
                const toastEl = document.getElementById('message-box');
                const toastVisible = toastEl && !toastEl.classList.contains('hidden') && toastEl.classList.contains('opacity-100');
                const toastBottom = toastVisible ? toastEl.getBoundingClientRect().bottom + 8 : 0;
                const clearance = Math.max(navH + 8, toastBottom);
                const top = ssResults.getBoundingClientRect().top + window.scrollY - clearance;
                window.scrollTo({ top, behavior: 'smooth' });
            };
            setTimeout(doScroll, 300);
        }
    }
}

/**
 * Reset self-sufficient fields and UI to default state.
 * Called from resetApp in app.js.
 */
function resetSelfSufficient() {
    const ssTd2RateInput = document.getElementById('td2-rate');
    const ssLoanRateInput = document.getElementById('ss-loan-rate');
    const ssLoanPeriodInput = document.getElementById('ss-loan-period');
    const ssAdminFeesInput = document.getElementById('ss-admin-fees');
    const ssStampRateInput = document.getElementById('ss-stamp-rate');

    if (ssTd2RateInput) ssTd2RateInput.value = '';
    if (ssLoanRateInput) ssLoanRateInput.value = '';
    if (ssLoanPeriodInput) ssLoanPeriodInput.value = '36';
    if (ssAdminFeesInput) ssAdminFeesInput.value = '1';
    if (ssStampRateInput) ssStampRateInput.value = '0.2';

    ssTd2RateManuallyEdited = false;
    ssLoanRateManuallyEdited = false;

    // Re-seed SS booking date with today
    const ssBDNative  = document.getElementById('ss-booking-date-native');
    const ssBDDisplay = document.getElementById('ss-booking-date-display');
    const today = new Date();
    const ty = today.getFullYear();
    const tm = String(today.getMonth() + 1).padStart(2, '0');
    const td = String(today.getDate()).padStart(2, '0');
    const todayISO = `${ty}-${tm}-${td}`;
    if (ssBDNative)  ssBDNative.value  = todayISO;
    if (ssBDDisplay) {
        ssBDDisplay.value = (typeof dateBuildValue === 'function')
            ? dateBuildValue(td, tm, String(ty), false)
            : `${td}/${tm}/${ty}`;
        ssBDDisplay.dataset.iso = todayISO;
    }

    // Re-seed CD2 interest date field from today's booking date
    const cdDate = ssDefaultCdInterestDate(today);
    const cy = cdDate.getFullYear();
    const cm = String(cdDate.getMonth() + 1).padStart(2, '0');
    const cd = String(cdDate.getDate()).padStart(2, '0');
    _ssSeedCdDateField(cdDate, document.getElementById('ss-cd2-interest-date-native'), document.getElementById('ss-cd2-interest-date-display'));

    // Reset CD1 list to 1 empty item seeded with default dates
    const matDate = ssDefaultCdMaturityDate(today, cdDate);
    const my = matDate.getFullYear();
    const mm = String(matDate.getMonth() + 1).padStart(2, '0');
    const md = String(matDate.getDate()).padStart(2, '0');

    ssCd1List = [
        { id: 1, amount: '', redemption: '', rate: '', dateISO: `${cy}-${cm}-${cd}`, maturityISO: `${my}-${mm}-${md}` }
    ];
    nextSsCd1Id = 2;
    renderSsCd1List();
    ssUpdateFirstInstDateDisplay(today);
    ssAutoFillLoanRate();

    const matchBtn = document.getElementById('ss-match-cd1-btn');
    if (matchBtn) matchBtn.classList.add('hidden');
    const advisoryBox = document.getElementById('ss-tenor-advisory');
    if (advisoryBox) advisoryBox.classList.add('hidden');

    document.getElementById('self-sufficient-toggle').checked = false;
    document.getElementById('self-sufficient-toggle').dispatchEvent(new Event('change'));

    ['ss-gross-loan-display', 'ss-td2-display', 'ss-monthly-interest-display',
        'ss-installment-display', 'ss-monthly-surplus-display', 'ss-total-stamp-display',
        'ss-admin-fees-display', 'ss-total-tds-display', 'ss-simple-alt-display',
        'ss-net-benefit-display', 'ss-effective-rate-display',
        'ss-first-inst-buffer-display', 'ss-net-leftover-display'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '-';
        });

    const bufferRow = document.getElementById('ss-first-inst-buffer-row');
    if (bufferRow) bufferRow.classList.add('hidden');
    const leftoverRow = document.getElementById('ss-net-leftover-row');
    if (leftoverRow) leftoverRow.classList.add('hidden');

    _ssLastSolution = null;
    _ssLastInputs = null;
}

/**
 * Copy formatted client offer to clipboard (WhatsApp/Email friendly)
 */
function copySelfSufficientOffer() {
    if (!_ssLastSolution || !_ssLastInputs) {
        if (typeof showToast === 'function') {
            showToast(t(_ssAppState?.lang || 'en', 'errorCheckInputs'), 'error');
        }
        return;
    }

    const sol = _ssLastSolution;
    const inp = _ssLastInputs;
    const lang = _ssAppState?.lang || 'en';
    const isAr = lang === 'ar';
    const curr = isAr ? 'ج.م' : 'EGP';

    const cd1Total = inp.validCd1s.reduce((sum, c) => sum + (c.amount || 0), 0);
    const cd1Rate = inp.maxCd1Rate || 0;
    const td2 = sol.td2 || 0;
    const td2Rate = inp.td2R || 0;
    const totalTds = sol.totalTdsAtEnd || 0;
    const months = inp.loanPeriod || 36;
    const monthlyReturn = sol.monthlyTdInterest || 0;
    const installment = sol.installment || 0;
    const surplus = sol.monthlySurplus || 0;
    const simpleAlt = sol.simpleInterestAlt || 0;
    const netBenefit = sol.netBenefit || 0;
    const effectiveRate = sol.effectiveRate || 0;

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    let text = '';
    if (isAr) {
        text = `📌 *عرض تمويل استثماري (برنامج التضاعف الذاتي)*
📅 التاريخ: ${dateStr}

1️⃣ *الخطة الاستثمارية:*
• شهادتك الحالية (CD₁): ${fmt(cd1Total)} ${curr} (${cd1Rate.toFixed(2)}%)
• الشهادة الجديدة المضافة (CD₂): ${fmt(td2)} ${curr} (${td2Rate.toFixed(2)}%)
⭐ *إجمالي شهاداتك:* ${fmt(totalTds)} ${curr}
⏳ المدة: ${months} شهر

2️⃣ *الموقف الشهري (بدون دفع أي مبالغ):*
• عائد الشهادات شهرياً: ${fmt(monthlyReturn)} ${curr}
• قسط القرض الشهري: ${fmt(installment)} ${curr}
💰 *الفائض النقدي في حسابك:* +${fmt(surplus)} ${curr} / شهرياً
✔ لا تدفع أي مليم من جيبك (القسط مغطى بالكامل من عوائد الشهادات تلقائياً)

3️⃣ *أرباحك في نهاية المدة:*
• إجمالي أموالك بالبرنامج: ${fmt(totalTds)} ${curr}
• في حال عدم الاشتراك: ${fmt(simpleAlt)} ${curr}
🎯 *صافي الربح الإضافي لك:* +${fmt(netBenefit)} ${curr}
📈 العائد الفعلي المحقق: ${effectiveRate.toFixed(2)}% (مقابل ${cd1Rate.toFixed(2)}%)

*العرض استرشادي طبقاً لأسعار العوائد والتعريفة المصرفية السارية.`;
    } else {
        text = `📌 *Investment Loan Proposal (Self-Sufficient Program)*
📅 Date: ${dateStr}

1️⃣ *The Investment Plan:*
• Your Existing Certificate (CD₁): ${fmt(cd1Total)} ${curr} (${cd1Rate.toFixed(2)}%)
• New Certificate Added (CD₂): ${fmt(td2)} ${curr} (${td2Rate.toFixed(2)}%)
⭐ *Total Certificates Owned:* ${fmt(totalTds)} ${curr}
⏳ Duration: ${months} Months

2️⃣ *Monthly Cashflow (0 Out-of-Pocket):*
• Monthly Returns from Certificates: ${fmt(monthlyReturn)} ${curr}
• Monthly Loan Installment: ${fmt(installment)} ${curr}
💰 *Cash Surplus in Your Account:* +${fmt(surplus)} ${curr} / Month
✔ You pay 0.00 EGP out-of-pocket (Installment is 100% covered by CD returns)

3️⃣ *Your Net Benefit at Maturity:*
• Total Value with this Program: ${fmt(totalTds)} ${curr}
• Total Value without Program: ${fmt(simpleAlt)} ${curr}
🎯 *Net Extra Profit:* +${fmt(netBenefit)} ${curr}
📈 Effective Return: ${effectiveRate.toFixed(2)}% (vs. ${cd1Rate.toFixed(2)}%)

*Indicative proposal based on prevailing bank interest rates and tariffs.`;
    }

    const copyBtn = document.getElementById('ss-copy-btn');
    const copyIcon = copyBtn?.querySelector('.ss-copy-icon');
    const checkIcon = copyBtn?.querySelector('.ss-check-icon');
    const textSpan = copyBtn?.querySelector('.ss-copy-text');

    const onSuccess = () => {
        if (copyIcon && checkIcon) {
            copyIcon.classList.add('hidden');
            checkIcon.classList.remove('hidden');
        }
        if (textSpan) {
            textSpan.textContent = isAr ? 'تم النسخ!' : 'Copied!';
        }
        if (typeof showToast === 'function') {
            showToast(t(lang, 'ssOfferCopied'), 'success');
        }
        if (typeof haptic !== 'undefined') haptic('light');

        setTimeout(() => {
            if (copyIcon && checkIcon) {
                copyIcon.classList.remove('hidden');
                checkIcon.classList.add('hidden');
            }
            if (textSpan) {
                textSpan.textContent = t(lang, 'ssCopyOfferBtn');
            }
        }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
            fallbackCopyText(text, onSuccess);
        });
    } else {
        fallbackCopyText(text, onSuccess);
    }
}

function fallbackCopyText(text, callback) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
        document.execCommand('copy');
        if (callback) callback();
    } catch (e) {
        console.error('Copy failed:', e);
    }
    document.body.removeChild(ta);
}

/**
 * Print simplified 1-page A4 client offer sheet
 */
function printSelfSufficientOffer() {
    if (!_ssLastSolution || !_ssLastInputs) {
        if (typeof showToast === 'function') {
            showToast(t(_ssAppState?.lang || 'en', 'errorCheckInputs'), 'error');
        }
        return;
    }

    const printBtn = document.getElementById('ss-print-btn');
    const spinner = printBtn?.querySelector('.ss-print-spinner');
    const icon = printBtn?.querySelector('.ss-print-icon');
    const textSpan = printBtn?.querySelector('.ss-print-text');
    const lang = _ssAppState?.lang || 'en';
    const isAr = lang === 'ar';
    const curr = isAr ? 'ج.م' : 'EGP';

    const setSsPrintLoading = (loading) => {
        if (!printBtn) return;
        printBtn.disabled = loading;
        printBtn.setAttribute('aria-busy', loading ? 'true' : 'false');
        if (spinner) spinner.classList.toggle('hidden', !loading);
        if (icon) icon.classList.toggle('hidden', loading);
        if (textSpan) textSpan.textContent = loading ? t(lang, 'ssPrintingOffer') : t(lang, 'ssPrintOfferBtn');
    };

    setSsPrintLoading(true);
    if (typeof showToast === 'function') {
        showToast(t(lang, 'ssPrintOfferStarting'));
    }
    if (typeof announceExportStatus === 'function') {
        announceExportStatus(t(lang, 'ssPrintOfferStarting'));
    }

    try {
        let frame = document.getElementById('print-frame');
        if (!frame) {
            frame = document.createElement('iframe');
            frame.id = 'print-frame';
            frame.style.cssText = 'position:absolute; width:0; height:0; border:0; visibility:hidden;';
            document.body.appendChild(frame);
        }

        const sol = _ssLastSolution;
        const inp = _ssLastInputs;

    const cd1Total = inp.validCd1s.reduce((sum, c) => sum + (c.amount || 0), 0);
    const cd1Rate = inp.maxCd1Rate || 0;
    const td2 = sol.td2 || 0;
    const td2Rate = inp.td2R || 0;
    const totalTds = sol.totalTdsAtEnd || 0;
    const months = inp.loanPeriod || 36;
    const years = (months / 12).toFixed(months % 12 === 0 ? 0 : 1);
    const monthlyReturn = sol.monthlyTdInterest || 0;
    const installment = sol.installment || 0;
    const surplus = sol.monthlySurplus || 0;
    const simpleAlt = sol.simpleInterestAlt || 0;
    const netBenefit = sol.netBenefit || 0;
    const effectiveRate = sol.effectiveRate || 0;

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    const doc = frame.contentWindow.document;
    doc.open();
    doc.write('<!DOCTYPE html><html><head></head><body></body></html>');
    doc.close();

    const html = doc.documentElement;
    html.lang = isAr ? 'ar' : 'en';
    html.dir = isAr ? 'rtl' : 'ltr';

    const head = doc.head;
    const meta = doc.createElement('meta');
    meta.charset = 'UTF-8';
    head.appendChild(meta);

    const title = doc.createElement('title');
    title.textContent = isAr ? 'عرض تمويل استثماري' : 'Investment Loan Proposal';
    head.appendChild(title);

    const style = doc.createElement('style');
    style.textContent = `
        @page {
            size: A4 portrait;
            margin: 12mm 15mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", "Segoe UI Arabic", sans-serif;
            color: #111827;
            background: #fff;
            padding: 10px;
            font-size: 13px;
            line-height: 1.4;
        }
        .offer-container {
            max-width: 720px;
            margin: 0 auto;
            border: 2px solid #059669;
            border-radius: 12px;
            padding: 20px 24px;
            background: #fff;
        }
        .header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 14px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header-title h1 {
            font-size: 18px;
            font-weight: 800;
            color: #065f46;
            margin-bottom: 3px;
        }
        .header-title p {
            font-size: 13px;
            color: #4b5563;
            font-weight: 600;
        }
        .header-date {
            text-align: ${isAr ? 'left' : 'right'};
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
        }
        .section-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 14px;
        }
        .section-title {
            font-size: 13px;
            font-weight: 800;
            color: #065f46;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
            font-size: 13px;
        }
        .item-label {
            color: #374151;
            font-weight: 500;
        }
        .item-value {
            font-weight: 700;
            color: #111827;
        }
        .highlight-box {
            background: #ecfdf5;
            border: 1.5px solid #a7f3d0;
            border-radius: 8px;
            padding: 8px 12px;
            margin-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .highlight-label {
            font-weight: 800;
            color: #065f46;
            font-size: 13.5px;
        }
        .highlight-value {
            font-weight: 800;
            color: #047857;
            font-size: 15px;
        }
        .note-badge {
            background: #f0fdf4;
            color: #166534;
            border-left: 3px solid #16a34a;
            padding: 6px 10px;
            margin-top: 8px;
            font-size: 11.5px;
            font-weight: 600;
            border-radius: 0 6px 6px 0;
        }
        html[dir="rtl"] .note-badge {
            border-left: none;
            border-right: 3px solid #16a34a;
            border-radius: 6px 0 0 6px;
        }
        .disclaimer {
            margin-top: 14px;
            padding-top: 10px;
            border-top: 1px dashed #d1d5db;
            font-size: 10.5px;
            color: #6b7280;
            text-align: center;
            line-height: 1.4;
        }
    `;
    head.appendChild(style);

    const body = doc.body;

    const planTitle = isAr ? '1️⃣ الخطة الاستثمارية' : '1️⃣ THE INVESTMENT PLAN';
    const existingCdLabel = isAr ? 'شهادتك الحالية (CD₁):' : 'Your Existing Certificate (CD₁):';
    const newCdLabel = isAr ? 'الشهادة الجديدة المضافة (CD₂):' : 'New Certificate Added (CD₂):';
    const totalCdsLabel = isAr ? 'إجمالي شهاداتك الجديدة:' : 'Total Certificates Owned:';
    const durationLabel = isAr ? 'مدة الاستثمار:' : 'Duration:';
    const durationVal = isAr ? `${months} شهر (${years} سنوات)` : `${months} Months (${years} Years)`;

    const cashflowTitle = isAr ? '2️⃣ الموقف الشهري (بدون دفع أي مبالغ)' : '2️⃣ MONTHLY CASHFLOW (0 OUT-OF-POCKET)';
    const monthlyReturnsLabel = isAr ? 'عائد الشهادات شهرياً:' : 'Monthly Returns from Certificates:';
    const loanInstallmentLabel = isAr ? 'قسط القرض الشهري:' : 'Monthly Loan Installment:';
    const cashSurplusLabel = isAr ? 'الفائض الشهري في حسابك:' : 'Net Monthly Cash Surplus:';
    const surplusVal = `+${fmt(surplus)} ${curr} ${isAr ? '/ شهرياً' : '/ Month'}`;
    const zeroCostNote = isAr
        ? '✔ لا تدفع أي مليم من جيبك (القسط الشهري مغطى بالكامل من عوائد الشهادات تلقائياً)'
        : '✔ You pay 0.00 EGP out-of-pocket (Installment is 100% covered by CD returns automatically)';

    const benefitTitle = isAr ? '3️⃣ أرباحك في نهاية المدة' : '3️⃣ NET BENEFIT AT MATURITY';
    const valWithProgramLabel = isAr ? 'إجمالي أموالك بالبرنامج:' : 'Total Assets with this Program:';
    const valWithoutProgramLabel = isAr ? 'في حال عدم الاشتراك (الشهادة فقط):' : 'Total Assets without Program:';
    const netProfitLabel = isAr ? 'صافي الربح الإضافي لك:' : 'Net Extra Profit:';
    const effectiveReturnLabel = isAr ? 'العائد الفعلي المحقق:' : 'Effective Return Rate:';
    const effectiveVal = `${effectiveRate.toFixed(2)}% (${isAr ? 'مقابل' : 'vs'} ${cd1Rate.toFixed(2)}%)`;

    const disclaimerText = isAr
        ? '* هذا العرض استرشادي وخاضع لأسعار العوائد والتعريفة المصرفية السارية وقت التنفيذ.'
        : '* Indicative proposal based on prevailing bank interest rates and tariffs at the time of execution.';

    body.innerHTML = `
        <div class="offer-container">
            <div class="header">
                <div class="header-title">
                    <h1>${isAr ? 'عرض تمويل استثماري (برنامج التضاعف الذاتي)' : 'Investment Loan Proposal (Self-Sufficient Program)'}</h1>
                    <p>${isAr ? 'تضاعف الأوعية الادخارية بدون أعباء سداد شهرية' : 'Certificate of Deposit Doubling with Zero Monthly Burden'}</p>
                </div>
                <div class="header-date">
                    <div><strong>${isAr ? 'التاريخ:' : 'Date:'}</strong> ${dateStr}</div>
                </div>
            </div>

            <!-- Section 1 -->
            <div class="section-card">
                <div class="section-title">${planTitle}</div>
                <div class="item-row">
                    <span class="item-label">${existingCdLabel}</span>
                    <span class="item-value">${fmt(cd1Total)} ${curr} (${cd1Rate.toFixed(2)}%)</span>
                </div>
                <div class="item-row">
                    <span class="item-label">${newCdLabel}</span>
                    <span class="item-value">${fmt(td2)} ${curr} (${td2Rate.toFixed(2)}%)</span>
                </div>
                <div class="item-row">
                    <span class="item-label">${durationLabel}</span>
                    <span class="item-value">${durationVal}</span>
                </div>
                <div class="highlight-box">
                    <span class="highlight-label">⭐ ${totalCdsLabel}</span>
                    <span class="highlight-value">${fmt(totalTds)} ${curr}</span>
                </div>
            </div>

            <!-- Section 2 -->
            <div class="section-card">
                <div class="section-title">${cashflowTitle}</div>
                <div class="item-row">
                    <span class="item-label">${monthlyReturnsLabel}</span>
                    <span class="item-value">${fmt(monthlyReturn)} ${curr}</span>
                </div>
                <div class="item-row">
                    <span class="item-label">${loanInstallmentLabel}</span>
                    <span class="item-value">-${fmt(installment)} ${curr}</span>
                </div>
                <div class="highlight-box">
                    <span class="highlight-label">💰 ${cashSurplusLabel}</span>
                    <span class="highlight-value" style="color:#059669;">${surplusVal}</span>
                </div>
                <div class="note-badge">${zeroCostNote}</div>
            </div>

            <!-- Section 3 -->
            <div class="section-card" style="margin-bottom: 6px;">
                <div class="section-title">${benefitTitle}</div>
                <div class="item-row">
                    <span class="item-label">${valWithProgramLabel}</span>
                    <span class="item-value">${fmt(totalTds)} ${curr}</span>
                </div>
                <div class="item-row">
                    <span class="item-label">${valWithoutProgramLabel}</span>
                    <span class="item-value">${fmt(simpleAlt)} ${curr}</span>
                </div>
                <div class="item-row">
                    <span class="item-label">${effectiveReturnLabel}</span>
                    <span class="item-value" style="color:#047857;">${effectiveVal}</span>
                </div>
                <div class="highlight-box">
                    <span class="highlight-label">🎯 ${netProfitLabel}</span>
                    <span class="highlight-value" style="color:#047857;">+${fmt(netBenefit)} ${curr}</span>
                </div>
            </div>

            <div class="disclaimer">${disclaimerText}</div>
        </div>
    `;

        // Trigger print from inside iframe context to prevent freezing parent window JS event loop
        const printScript = doc.createElement('script');
        printScript.textContent = 'setTimeout(() => { window.focus(); window.print(); }, 400);';
        body.appendChild(printScript);

        // Restore button after print has been handed to browser print dialog (identical to loan summary print)
        setTimeout(() => {
            setSsPrintLoading(false);
            if (typeof showToast === 'function') {
                showToast(isAr ? 'تم تجهيز العرض للطباعة.' : 'Client offer ready for print.', 'success');
            }
            if (typeof announceExportStatus === 'function') {
                announceExportStatus(isAr ? 'تم تجهيز العرض للطباعة.' : 'Client offer ready for print.');
            }
        }, 1200);
    } catch (e) {
        console.error('Error generating print offer:', e);
        setSsPrintLoading(false);
        if (typeof showToast === 'function') {
            showToast(t(lang, 'exportPdfError'), 'error');
        }
    }
}

// Expose globals for external module coordination
window.renderSsCd1List = renderSsCd1List;
window.updateSelfSufficient = updateSelfSufficient;
window.updateTenorAdvisoryAndMatchButton = updateTenorAdvisoryAndMatchButton;
window.ssUpdateFirstInstDateDisplay = ssUpdateFirstInstDateDisplay;
window.ssCalculateLoanEndDate = ssCalculateLoanEndDate;
window.ssUpdateLoanEndDateDisplay = ssUpdateLoanEndDateDisplay;
window.copySelfSufficientOffer = copySelfSufficientOffer;
window.printSelfSufficientOffer = printSelfSufficientOffer;


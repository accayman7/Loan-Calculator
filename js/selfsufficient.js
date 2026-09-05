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
let ssCd1List = [
    { id: 1, amount: '', rate: '', dateISO: '' }
];
let nextSsCd1Id = 2;
let ssTd2RateManuallyEdited = false;
let ssLoanRateManuallyEdited = false;

function renderSsCd1List(newIdToAnimate = null) {
    const listEl = document.getElementById('ss-cd1-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    ssCd1List.forEach((cd, index) => {
        const row = document.createElement('div');
        row.id = `ss-cd1-card-${cd.id}`;
        row.className = `grid grid-cols-12 gap-1.5 items-center p-2 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-900/60 transition-all ${cd.id === newIdToAnimate ? 'item-enter' : ''}`;

        const cdLabel = `CD₁ #${index + 1}`;

        row.innerHTML = `
            <div class="col-span-2 flex items-center justify-center gap-1 text-[11px] font-bold text-green-800 dark:text-green-300 text-center">
                <span>${cdLabel}</span>
                ${ssCd1List.length > 1 ? `
                <button type="button" class="ss-cd-remove-btn text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded transition-colors" data-id="${cd.id}" title="${t(_ssAppState?.lang || 'en', 'removeCollateralBtn')}" aria-label="${t(_ssAppState?.lang || 'en', 'removeCollateralBtn')}">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                ` : ''}
            </div>
            <div class="col-span-4">
                <div class="input-group py-1 px-1">
                    <input type="text" inputmode="decimal" class="text-input text-[11px] sm:text-xs select-text ss-cd-amount p-0 text-center tracking-tight" data-id="${cd.id}" placeholder="100,000" value="${cd.amount}">
                </div>
            </div>
            <div class="col-span-2">
                <div class="input-group py-1 px-1">
                    <input type="text" inputmode="decimal" class="text-input text-xs select-text ss-cd-rate p-0 text-center" data-id="${cd.id}" placeholder="19.0" value="${cd.rate}">
                </div>
            </div>
            <div class="col-span-4">
                <div class="input-group relative py-1 px-1">
                    <input type="text" inputmode="numeric" class="text-input text-[11px] sm:text-xs select-text z-10 ss-cd-date-display p-0 text-center" style="padding-inline-end: 22px !important; padding-inline-start: 2px !important;" data-id="${cd.id}" placeholder="DD/MM/YYYY" maxlength="10" autocomplete="off">
                    <button type="button" class="ss-cd-picker-btn absolute end-0.5 top-0.5 bottom-0.5 w-6 flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded z-20 transition-colors" data-id="${cd.id}" aria-label="Open date picker">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="text-gray-400 pointer-events-none">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <input type="date" class="ss-cd-date-native absolute inset-0 opacity-0 w-full h-full pointer-events-none" tabindex="-1" data-id="${cd.id}">
                    </button>
                </div>
            </div>
        `;

        const amountInput = row.querySelector('.ss-cd-amount');
        const rateInput = row.querySelector('.ss-cd-rate');
        const dateDisplay = row.querySelector('.ss-cd-date-display');
        const dateNative = row.querySelector('.ss-cd-date-native');
        const pickerBtn = row.querySelector('.ss-cd-picker-btn');
        const removeBtn = row.querySelector('.ss-cd-remove-btn');

        const adjustAmountFontSize = (input) => {
            if (!input) return;
            const len = input.value.length;
            if (len >= 12) input.style.fontSize = '10px';
            else if (len >= 10) input.style.fontSize = '11px';
            else input.style.fontSize = '';
        };

        // Seed date if available
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

        if (amountInput) {
            adjustAmountFontSize(amountInput);
            amountInput.addEventListener('input', (e) => {
                if (typeof formatCurrencyInput === 'function') formatCurrencyInput(e.target);
                adjustAmountFontSize(e.target);
                cd.amount = e.target.value;
            });
        }

        if (rateInput) {
            rateInput.addEventListener('input', (e) => {
                if (typeof validateRateInput === 'function') validateRateInput(e.target);
                cd.rate = e.target.value;
            });
            rateInput.addEventListener('blur', (e) => {
                if (typeof formatRateInputBlur === 'function') formatRateInputBlur(e.target);
                cd.rate = e.target.value;
            });
        }

        if (dateDisplay && dateNative && typeof initDateInput === 'function') {
            initDateInput(dateDisplay, dateNative);
            dateNative.addEventListener('change', () => {
                cd.dateISO = dateNative.value;
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
                }, 240);
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
            
            const newId = nextSsCd1Id++;
            ssCd1List.push({ id: newId, amount: '', rate: '', dateISO: `${y}-${m}-${d}` });
            renderSsCd1List(newId);
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
        ssLoanRateInput.addEventListener('input', () => {
            ssLoanRateManuallyEdited = true;
        });
    }

    // --- Set defaults: Period, Admin Fees, Stamp Rate ---
    const ssLoanPeriodInput = document.getElementById('ss-loan-period');
    const ssAdminFeesInput = document.getElementById('ss-admin-fees');
    const ssStampRateInput = document.getElementById('ss-stamp-rate');
    if (ssLoanPeriodInput && !ssLoanPeriodInput.value) ssLoanPeriodInput.value = '36';
    if (ssAdminFeesInput && !ssAdminFeesInput.value) ssAdminFeesInput.value = '1';
    if (ssStampRateInput && !ssStampRateInput.value) ssStampRateInput.value = '0.2';

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

            // Also re-seed unedited CD1 dates
            const y = cdDate.getFullYear();
            const m = String(cdDate.getMonth() + 1).padStart(2, '0');
            const d = String(cdDate.getDate()).padStart(2, '0');
            ssCd1List.forEach(c => {
                if (!c.dateISO || c.dateISO === '') c.dateISO = `${y}-${m}-${d}`;
            });
            renderSsCd1List();
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

    // Initial render of CD1 list with default date
    const initialBkDate = (ssBDNative && ssBDNative.value) ? _ssParseNativeDate(ssBDNative.value) : new Date();
    const initialCdDate = initialBkDate ? ssDefaultCdInterestDate(initialBkDate) : new Date();
    const iy = initialCdDate.getFullYear();
    const im = String(initialCdDate.getMonth() + 1).padStart(2, '0');
    const id = String(initialCdDate.getDate()).padStart(2, '0');
    ssCd1List[0].dateISO = `${iy}-${im}-${id}`;
    renderSsCd1List();
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
    const loanPeriod = parseInt(ssLoanPeriodInput?.value);

    // 1. Validate CD1 collaterals
    const validCd1s = ssCd1List
        .map(c => ({
            amount: safeParseFloat(c.amount) || 0,
            rate: safeParseFloat(c.rate) || 0,
            date: c.dateISO ? _ssParseNativeDate(c.dateISO) : null
        }))
        .filter(c => c.amount > 0 && c.rate > 0);

    if (validCd1s.length === 0 || isNaN(loanRate) || loanRate <= 0 || isNaN(loanPeriod) || loanPeriod <= 0 || isNaN(td2R) || td2R <= 0) {
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

    let m1_Date;
    if (_ssDateInputs.firstNative.value) {
        const parts = _ssDateInputs.firstNative.value.split('-');
        m1_Date = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
        m1_Date = new Date(bookingDate.getFullYear(), bookingDate.getMonth() + 2, 5);
    }

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
        if (ssResults) {
            ssResults.classList.add('opacity-0');
            ssResults.classList.remove('opacity-100');
            ssResults.style.maxHeight = '0';
        }
        if (showError && ssError) {
            ssError.textContent = t(_ssAppState.lang, 'ssErrorExceeds90Collateral');
            ssError.classList.remove('hidden');
        }
        return;
    }

    // 4. Display results
    if (ssResults) {
        ssResults.classList.remove('opacity-0');
        ssResults.classList.add('opacity-100');
        ssResults.style.maxHeight = '800px';
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

    // Reset CD1 list to 1 empty item seeded with default date
    ssCd1List = [
        { id: 1, amount: '', rate: '', dateISO: `${cy}-${cm}-${cd}` }
    ];
    nextSsCd1Id = 2;
    renderSsCd1List();

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
}

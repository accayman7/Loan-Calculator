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
function initSelfSufficient(appState, dateInputs, formInputs, animateToggleBounce, appCalculateFn) {
    _ssAppState = appState;
    _ssDateInputs = dateInputs;
    _ssFormInputs = formInputs;
    _ssAppCalculate = appCalculateFn;

    const tdRateInput = document.getElementById('td-rate');

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

    // --- Auto-populate TD₂ Rate from TD₁ Rate ---
    const ssTd2RateInput = document.getElementById('td2-rate');
    let td2RateManuallyEdited = false;
    if (tdRateInput && ssTd2RateInput) {
        tdRateInput.addEventListener('input', () => {
            if (!td2RateManuallyEdited) {
                ssTd2RateInput.value = tdRateInput.value;
            }
        });
        ssTd2RateInput.addEventListener('input', () => {
            td2RateManuallyEdited = true;
        });
    }

    // --- Auto-populate SS Loan Rate = TD₁ Rate + 2% ---
    const ssLoanRateInput = document.getElementById('ss-loan-rate');
    let ssLoanRateManuallyEdited = false;
    if (tdRateInput && ssLoanRateInput) {
        tdRateInput.addEventListener('input', () => {
            if (!ssLoanRateManuallyEdited) {
                const tdVal = parseFloat(tdRateInput.value);
                if (!isNaN(tdVal) && tdVal > 0) {
                    ssLoanRateInput.value = String(tdVal + 2);
                }
            }
        });
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

    // Wire the text input (DD/MM/YYYY parsing)
    if (ssBDDisplay && ssBDNative && typeof initDateInput === 'function') {
        initDateInput(ssBDDisplay, ssBDNative);
    }

    // Wire calendar picker button
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

    // --- CD₁ & CD₂ Interest Date fields ---
    const ssCD1Display = document.getElementById('ss-cd1-interest-date-display');
    const ssCD1Native  = document.getElementById('ss-cd1-interest-date-native');
    const ssCD2Display = document.getElementById('ss-cd2-interest-date-display');
    const ssCD2Native  = document.getElementById('ss-cd2-interest-date-native');

    // Helper: seed both CD interest dates from a given booking Date object
    function seedCdDatesFromBooking(bkDate) {
        const cdDate = ssDefaultCdInterestDate(bkDate);
        if (ssCD1Native && !ssCD1Native.value) _ssSeedCdDateField(cdDate, ssCD1Native, ssCD1Display);
        if (ssCD2Native && !ssCD2Native.value) _ssSeedCdDateField(cdDate, ssCD2Native, ssCD2Display);
    }

    // Seed on init from current booking date
    if (ssBDNative && ssBDNative.value) {
        const bd = _ssParseNativeDate(ssBDNative.value);
        if (bd) seedCdDatesFromBooking(bd);
    }

    // Re-seed (only if not manually edited) whenever booking date changes
    if (ssBDNative) {
        ssBDNative.addEventListener('change', () => {
            const bd = _ssParseNativeDate(ssBDNative.value);
            if (!bd) return;
            // Always re-seed both CD dates when booking date changes
            const cdDate = ssDefaultCdInterestDate(bd);
            _ssSeedCdDateField(cdDate, ssCD1Native, ssCD1Display);
            _ssSeedCdDateField(cdDate, ssCD2Native, ssCD2Display);
        });
    }

    // Wire text inputs (DD/MM/YYYY parsing)
    if (ssCD1Display && ssCD1Native && typeof initDateInput === 'function') initDateInput(ssCD1Display, ssCD1Native);
    if (ssCD2Display && ssCD2Native && typeof initDateInput === 'function') initDateInput(ssCD2Display, ssCD2Native);

    // Wire picker buttons
    function wirePickerBtn(btnId, displayEl, nativeEl) {
        const btn = document.getElementById(btnId);
        if (!btn || !displayEl || !nativeEl) return;
        btn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('light');
            if (typeof openDatePicker === 'function') {
                openDatePicker(displayEl, _ssAppState.lang, (selectedDate) => {
                    if (selectedDate) {
                        const y = selectedDate.getFullYear();
                        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const d = String(selectedDate.getDate()).padStart(2, '0');
                        displayEl.value = (typeof dateBuildValue === 'function')
                            ? dateBuildValue(d, m, String(y), false)
                            : `${d}/${m}/${y}`;
                        nativeEl.value = `${y}-${m}-${d}`;
                        nativeEl.dispatchEvent(new Event('change'));
                    }
                });
            } else {
                nativeEl.showPicker();
            }
        });
    }
    wirePickerBtn('ss-booking-date-picker-btn', ssBDDisplay, ssBDNative);
    wirePickerBtn('ss-cd1-interest-date-picker-btn', ssCD1Display, ssCD1Native);
    wirePickerBtn('ss-cd2-interest-date-picker-btn', ssCD2Display, ssCD2Native);
}

/**
 * Core self-sufficient calculation and UI update.
 * Called on calc button press and after main appCalculate.
 *
 * @param {boolean} showError - Whether to show error messages
 */
function updateSelfSufficient(showError = false) {
    if (!document.getElementById('self-sufficient-toggle').checked) return;
    // Skip if called from appCalculate triggered by the solver (prevents hiding results)
    if (updateSelfSufficient._fromSolver) return;

    const ssResults = document.getElementById('self-sufficient-results');
    const ssError = document.getElementById('error-self-sufficient');
    const tdRateInput = document.getElementById('td-rate');
    const tdAmountInput = document.getElementById('td-amount');
    const td2RateInput = document.getElementById('td2-rate');
    const ssLoanRateInput = document.getElementById('ss-loan-rate');
    const ssLoanPeriodInput = document.getElementById('ss-loan-period');

    const tdR = safeParseFloat(tdRateInput.value);
    const td1 = safeParseFloat(tdAmountInput.value);
    const td2R = safeParseFloat(td2RateInput.value);

    // 1. Read loan parameters from self-sufficient local fields
    const loanRate = safeParseFloat(ssLoanRateInput.value);
    const loanPeriod = parseInt(ssLoanPeriodInput.value);

    // 2. Validate loan rate & period
    if (isNaN(loanRate) || loanRate <= 0 || isNaN(loanPeriod) || loanPeriod <= 0) {
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

    // 3. Check TD rates
    if (tdRateInput.value === '' || tdR <= 0 || td2RateInput.value === '' || td2R <= 0) {
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

    // 4. Check TD amount (required for solver)
    if (tdAmountInput.value === '' || isNaN(td1) || td1 <= 0) {
        if (ssResults) {
            ssResults.classList.add('opacity-0');
            ssResults.classList.remove('opacity-100');
            ssResults.style.maxHeight = '0';
        }
        if (showError && ssError) {
            ssError.textContent = t(_ssAppState.lang, 'ssErrorTdRequired');
            ssError.classList.remove('hidden');
        }
        return;
    }

    // 5. Build dates - always use advanced (real dates) for accurate results
    const isAdvanced = true;

    // Booking date: prefer SS-local field, then main startNative, then today
    let bookingDate = new Date();
    const ssBDNative = document.getElementById('ss-booking-date-native');
    if (ssBDNative && ssBDNative.value) {
        const parts = ssBDNative.value.split('-');
        bookingDate = new Date(parts[0], parts[1] - 1, parts[2]);
    } else if (_ssDateInputs.startNative.value) {
        const parts = _ssDateInputs.startNative.value.split('-');
        bookingDate = new Date(parts[0], parts[1] - 1, parts[2]);
    }

    // 1st installment date: use main firstNative if set, else 5th of 2nd month after booking
    let m1_Date;
    if (_ssDateInputs.firstNative.value) {
        const parts = _ssDateInputs.firstNative.value.split('-');
        m1_Date = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
        m1_Date = new Date(bookingDate.getFullYear(), bookingDate.getMonth() + 2, 5);
    }

    const stampRate = parseFloat(document.getElementById('ss-stamp-rate').value) || 0;
    const adminFees = parseFloat(document.getElementById('ss-admin-fees').value) || 0;
    const freq = parseInt(document.getElementById('installment-freq').value) || 1;

    // 6. Call solver
    if (typeof solveTdLoan !== 'function') {
        console.error('solveTdLoan not found');
        return;
    }

    const solution = solveTdLoan(
        td1, tdR, loanRate, loanPeriod,
        { bookingDate, m1_Date, isAdvanced },
        stampRate, adminFees, td2R, freq,
        _ssParseNativeDate(document.getElementById('ss-cd1-interest-date-native')?.value),
        _ssParseNativeDate(document.getElementById('ss-cd2-interest-date-native')?.value)
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

    // 7. Display results
    if (ssResults) {
        ssResults.classList.remove('opacity-0');
        ssResults.classList.add('opacity-100');
        ssResults.style.maxHeight = '800px';
    }
    if (ssError) ssError.classList.add('hidden');

    document.getElementById('ss-gross-loan-display').textContent = fmt(solution.grossLoan);
    document.getElementById('ss-td2-display').textContent = fmt(solution.td2);
    document.getElementById('ss-admin-fees-display').textContent = fmt(solution.adminFeesAmount);

    // CD interest received before first installment
    const cdBeforeM1El = document.getElementById('ss-cd-interest-before-m1-display');
    if (cdBeforeM1El) cdBeforeM1El.textContent = fmt(solution.availableCdInterest || 0);

    document.getElementById('ss-monthly-interest-display').textContent = fmt(solution.monthlyTdInterest);
    document.getElementById('ss-installment-display').textContent = fmt(solution.installment);

    const surplusEl = document.getElementById('ss-monthly-surplus-display');
    surplusEl.textContent = fmt(solution.monthlySurplus);
    surplusEl.className = `font-bold select-text ${solution.monthlySurplus >= 0 ? 'text-green-600' : 'text-red-600'}`;

    // First Installment Reserve (buffer held from loan to cover month 1 extra)
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

    // Net Leftover: cash remaining after admin fees, buffer, and CD₂ are deducted
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

    // Total stamp cost over the loan term
    document.getElementById('ss-total-stamp-display').textContent = fmt(solution.totalStamp);

    document.getElementById('ss-total-tds-display').textContent = fmt(solution.totalTdsAtEnd);
    document.getElementById('ss-simple-alt-display').textContent = fmt(solution.simpleInterestAlt);

    const benefitEl = document.getElementById('ss-net-benefit-display');
    benefitEl.textContent = fmt(solution.netBenefit);
    benefitEl.className = `font-bold text-base select-text ${solution.netBenefit >= 0 ? 'text-green-600' : 'text-red-600'}`;

    // Show effective rate vs simple TD rate
    const vsLabel = _ssAppState.lang === 'ar' ? 'مقابل' : 'vs';
    document.getElementById('ss-effective-rate-display').textContent = solution.effectiveRate.toFixed(2) + '%  (' + vsLabel + ' ' + tdR.toFixed(2) + '%)';

    // 8. Auto-fill gross loan into main calculator and trigger full calculation
    //    Only when the user explicitly clicks the SS Calculate button (showError=true).
    //    When called passively from appCalculate (showError=false), skip auto-fill
    //    so manually-edited loan details are not overwritten.
    if (showError) {
        _ssFormInputs.rate.value = String(loanRate);
        _ssFormInputs.period.value = String(loanPeriod);

        // Sync SS booking date → main Start Date so the full amortization
        // schedule uses the correct booking date (triggers firstNative auto-update)
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
        // Trigger main calculation with guard to prevent recursive SS update
        // Must set _fromSolver BEFORE advToggle dispatch, because the toggle's
        // change handler calls appCalculate() synchronously
        updateSelfSufficient._fromSolver = true;
        try {
            // Also sync admin fees and stamp rate to main calculator
            const mainAdminFees = document.getElementById('admin-fees');
            const mainStampRate = document.getElementById('stamp-rate');
            if (mainAdminFees) mainAdminFees.value = adminFees > 0 ? String(adminFees) : '';
            if (mainStampRate) mainStampRate.value = stampRate > 0 ? String(stampRate) : '';
            // Enable advanced options so main calculator uses same dates/fees
            const advToggle = document.getElementById('advanced-toggle');
            if (advToggle && !advToggle.checked) {
                advToggle.checked = true;
                advToggle.dispatchEvent(new Event('change'));
            }
            _ssAppCalculate();
        } finally {
            updateSelfSufficient._fromSolver = false;
        }

        // After appCalculate fills the main form inputs, the browser may scroll
        // to the focused loan-amount field (top of page). Restore focus to the
        // SS results panel so the user stays where they were on mobile.
        //
        // When the soft keyboard was open, it dismisses on calculate and causes
        // a visualViewport resize. If we scroll before the keyboard is fully gone
        // the viewport is still compressed and scrollIntoView lands in the middle.
        // Strategy: if keyboard is visible, debounce on visualViewport resize events
        // and scroll only once the keyboard has fully closed (resize settles).
        if (ssResults) {
            const doScroll = () => {
                // Compute clearance: fixed nav height + 8px gap.
                // If the success toast is currently visible, extend the offset
                // so the results appear below it rather than behind it.
                const navEl = document.querySelector('nav');
                const navH  = navEl ? navEl.offsetHeight : 0;

                const toastEl = document.getElementById('message-box');
                const toastVisible = toastEl &&
                    !toastEl.classList.contains('hidden') &&
                    toastEl.classList.contains('opacity-100');
                const toastBottom = toastVisible
                    ? toastEl.getBoundingClientRect().bottom + 8
                    : 0;

                const clearance = Math.max(navH + 8, toastBottom);
                const top = ssResults.getBoundingClientRect().top + window.scrollY - clearance;
                window.scrollTo({ top, behavior: 'smooth' });
            };

            const vv = window.visualViewport;
            const keyboardHeight = vv ? (window.innerHeight - vv.height) : 0;

            if (vv && keyboardHeight > 100) {
                // Keyboard is open — wait for it to fully close before scrolling.
                // visualViewport fires resize continuously as the keyboard animates.
                // We debounce with 80 ms to catch the "settled" moment.
                let debounceTimer;
                const onVVResize = () => {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        vv.removeEventListener('resize', onVVResize);
                        doScroll();
                    }, 80);
                };
                vv.addEventListener('resize', onVVResize);

                // Safety: scroll unconditionally after 750 ms in case
                // the resize event never fires (e.g. keyboard already gone).
                setTimeout(() => {
                    vv.removeEventListener('resize', onVVResize);
                    clearTimeout(debounceTimer);
                    doScroll();
                }, 750);
            } else {
                // No keyboard visible (desktop or mobile without keyboard).
                // Use a 300 ms delay instead of requestAnimationFrame so we fire
                // AFTER appCalculate's async smooth-scroll to the summary section.
                setTimeout(doScroll, 300);
            }
        }
    }
}

/**
 * Reset self-sufficient fields and UI to default state.
 * Called from resetApp in app.js.
 */
function resetSelfSufficient() {
    document.getElementById('td-rate').value = '';
    document.getElementById('td-amount').value = '';
    document.getElementById('td2-rate').value = '';
    document.getElementById('ss-loan-rate').value = '';
    document.getElementById('ss-loan-period').value = '36';
    document.getElementById('ss-admin-fees').value = '1';
    document.getElementById('ss-stamp-rate').value = '0.2';

    // Clear SS booking date — will be re-seeded with today on next initSelfSufficient call
    const ssBDNative  = document.getElementById('ss-booking-date-native');
    const ssBDDisplay = document.getElementById('ss-booking-date-display');
    if (ssBDNative)  ssBDNative.value  = '';
    if (ssBDDisplay) ssBDDisplay.value = '';

    // Clear CD interest date fields
    ['ss-cd1-interest-date-native', 'ss-cd2-interest-date-native'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    ['ss-cd1-interest-date-display', 'ss-cd2-interest-date-display'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });

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

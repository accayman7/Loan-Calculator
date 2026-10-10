/**
 * js/collaterals.js - Multi-Collateral System & Cashflow Analysis Module
 * Handles secured loan certificate-of-deposit (CD) cards, dynamic validation,
 * collateral metrics, and self-covering loan amount calculations.
 * Fully compatible with vanilla desktop file:// and offline PWA environments.
 */

(function () {
    // Multi-collateral system state
    let collaterals = [
        { id: 1, amount: '', redemption: '', rate: '', period: '' }
    ];
    let nextCollateralId = 2;

    let _options = {
        getLang: () => document.documentElement.lang || 'en',
        getLoanType: () => 'unsecured',
        getFormInputs: () => ({}),
        getLastResult: () => ({}),
        onRecalcRequired: () => {},
        validateInput: (key) => {}
    };

    /**
     * Dispatch polite screen-reader announcements to dedicated live regions
     */
    function announceCollateralStatus(message) {
        if (!message) return;
        const liveRegion = document.getElementById('collateral-live-region');
        if (!liveRegion) return;
        liveRegion.textContent = '';
        setTimeout(() => {
            liveRegion.textContent = message;
        }, 50);
    }

    const safeEscapeHtml = (str) => {
        if (typeof escapeHtml === 'function') return escapeHtml(str);
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    const displayFmt = (n) => (typeof fmt === 'function') ? fmt(n) : Number(n).toFixed(2);

    /**
     * Get clean array of collateral objects with parsed numbers
     * @returns {Array<{amount: number, redemption: number, rate: number}>}
     */
    function getCollaterals() {
        return collaterals.map(c => ({
            amount: (typeof safeParseFloat === 'function' ? safeParseFloat(c.amount) : parseFloat(c.amount)) || 0,
            redemption: (typeof safeParseFloat === 'function' ? safeParseFloat(c.redemption) : parseFloat(c.redemption)) || 0,
            rate: (typeof safeParseFloat === 'function' ? safeParseFloat(c.rate) : parseFloat(c.rate)) || 0
        }));
    }

    /**
     * Set collaterals from CD1 list (Self-Sufficient bridge)
     * @param {Array} cd1List
     */
    function setMainCollateralsFromCd1(cd1List) {
        if (!Array.isArray(cd1List) || cd1List.length === 0) return;
        collaterals = cd1List.map((c, idx) => {
            const rawAmt = typeof safeParseFloat === 'function' ? safeParseFloat(c.amount) : parseFloat(c.amount);
            const rawRed = typeof safeParseFloat === 'function' ? safeParseFloat(c.redemption) : parseFloat(c.redemption);
            const rawRate = typeof safeParseFloat === 'function' ? safeParseFloat(c.rate) : parseFloat(c.rate);
            return {
                id: idx + 1,
                amount: !isNaN(rawAmt) && rawAmt > 0 ? (typeof fmt === 'function' ? fmt(rawAmt) : String(rawAmt)) : '',
                redemption: !isNaN(rawRed) && rawRed > 0 ? (typeof fmt === 'function' ? fmt(rawRed) : String(rawRed)) : '',
                rate: !isNaN(rawRate) && rawRate > 0 ? (rawRate % 1 === 0 ? rawRate.toFixed(1) : String(rawRate)) : ''
            };
        });
        nextCollateralId = collaterals.length + 1;
        renderCollaterals();
        recalcCollateralMetrics(false);
    }

    /**
     * Render collateral cards in DOM
     * @param {number|null} newIdToAnimate
     */
    function renderCollaterals(newIdToAnimate = null) {
        const listEl = document.getElementById('collaterals-list');
        if (!listEl) return;

        const lang = _options.getLang();
        listEl.innerHTML = '';
        const fragment = document.createDocumentFragment();

        collaterals.forEach((col, index) => {
            const row = document.createElement('div');
            row.id = `col-row-${col.id}`;
            row.className = `p-2.5 sm:p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2.5 transition-all shadow-sm ${col.id === newIdToAnimate ? 'item-enter' : ''}`;

            const colIndex = index + 1;
            const badgePrefix = (typeof t === 'function' ? t(lang, 'collateralBadge') : null) || 'CD';
            const colLabel = safeEscapeHtml(`${badgePrefix} #${colIndex}`);
            const colItemName = safeEscapeHtml(`${typeof t === 'function' ? t(lang, 'collateralItemLabel') : 'Collateral'} ${colIndex}`);

            row.innerHTML = `
                <!-- Card Header: Title & Action Button -->
                <div class="flex items-center justify-between pb-1.5 border-b border-indigo-100 dark:border-indigo-900/50">
                    <div class="flex items-center gap-1.5 min-w-0">
                        <span class="text-xs font-bold text-indigo-900 dark:text-indigo-200" id="col-label-${col.id}">${colLabel}</span>
                    </div>
                    <div>
                        ${collaterals.length > 1 ? `
                        <button type="button" class="col-remove-btn flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-red-500 dark:hover:text-red-400 py-0.5 px-1.5 rounded transition-colors" data-id="${col.id}" data-col-index="${colIndex}" data-lang-title="removeCollateralBtn" data-lang-aria-label="removeCollateralBtn" title="${typeof t === 'function' ? t(lang, 'removeCollateralBtn') : 'Remove'} (${colItemName})" aria-label="${typeof t === 'function' ? t(lang, 'removeCollateralBtn') : 'Remove'} (${colItemName})">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            <span>${typeof t === 'function' ? t(lang, 'removeCollateralBtn') : 'Remove'}</span>
                        </button>
                        ` : `
                        <button type="button" class="col-clear-btn flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 py-0.5 px-1.5 rounded transition-colors" data-id="${col.id}" data-col-index="${colIndex}" data-lang-title="clearCollateralBtn" data-lang-aria-label="clearCollateralBtn" title="${typeof t === 'function' ? t(lang, 'clearCollateralBtn') : 'Clear'} (${colItemName})" aria-label="${typeof t === 'function' ? t(lang, 'clearCollateralBtn') : 'Clear'} (${colItemName})">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            <span>${typeof t === 'function' ? t(lang, 'clearCollateralBtn') : 'Clear'}</span>
                        </button>
                        `}
                    </div>
                </div>

                <!-- Inputs Row: 3 Columns with Dedicated Field Labels -->
                <div class="grid grid-cols-12 gap-2 items-end">
                    <div class="col-span-5 min-w-0">
                        <label class="block text-[10.5px] sm:text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1 whitespace-nowrap truncate" data-lang-key="colHeaderNominal" data-lang-title="collateralNominalLabel" title="${typeof t === 'function' ? t(lang, 'collateralNominalLabel') : 'Nominal Value'}">${typeof t === 'function' ? t(lang, 'colHeaderNominal') : 'Nominal'}</label>
                        <div class="input-group py-1 px-1.5">
                            <input type="text" dir="ltr" inputmode="decimal" class="text-input text-xs sm:text-sm font-semibold select-text col-amount-input autofit-input p-0 text-center tracking-tight" data-id="${col.id}" data-col-index="${colIndex}" data-autofit="true" data-autofit-max="14" data-autofit-min="10" data-lang-aria-label="collateralNominalLabel" data-lang-title="collateralNominalLabel" placeholder="100,000" aria-label="${typeof t === 'function' ? t(lang, 'collateralNominalLabel') : 'Nominal'} (${colItemName})" title="${typeof t === 'function' ? t(lang, 'collateralNominalLabel') : 'Nominal'} (${colItemName})">
                        </div>
                    </div>
                    <div class="col-span-4 min-w-0">
                        <label class="block text-[10.5px] sm:text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1 whitespace-nowrap truncate" data-lang-key="colHeaderRedemption" data-lang-title="collateralRedemptionLabel" title="${typeof t === 'function' ? t(lang, 'collateralRedemptionLabel') : 'Redemption Value'}">${typeof t === 'function' ? t(lang, 'colHeaderRedemption') : 'Redemption'}</label>
                        <div class="input-group py-1 px-1.5">
                            <input type="text" dir="ltr" inputmode="decimal" class="text-input text-xs sm:text-sm font-semibold select-text col-redemption-input autofit-input p-0 text-center tracking-tight" data-id="${col.id}" data-col-index="${colIndex}" data-autofit="true" data-autofit-max="14" data-autofit-min="10" data-lang-aria-label="collateralRedemptionLabel" data-lang-title="collateralRedemptionLabel" placeholder="90,000" aria-label="${typeof t === 'function' ? t(lang, 'collateralRedemptionLabel') : 'Redemption'} (${colItemName})" title="${typeof t === 'function' ? t(lang, 'collateralRedemptionLabel') : 'Redemption'} (${colItemName})">
                        </div>
                    </div>
                    <div class="col-span-3 min-w-0">
                        <label class="block text-[10.5px] sm:text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1 whitespace-nowrap truncate" data-lang-key="colHeaderRate" data-lang-title="collateralRateLabel" title="${typeof t === 'function' ? t(lang, 'collateralRateLabel') : 'Interest Rate (%)'}">${typeof t === 'function' ? t(lang, 'colHeaderRate') : 'Rate'}</label>
                        <div class="input-group py-1 px-1.5">
                            <input type="text" dir="ltr" inputmode="decimal" class="text-input text-xs sm:text-sm font-semibold select-text col-rate-input autofit-input p-0 text-center tracking-tight" data-id="${col.id}" data-col-index="${colIndex}" data-autofit="true" data-autofit-max="14" data-autofit-min="10" data-lang-aria-label="collateralRateLabel" data-lang-title="collateralRateLabel" placeholder="19.0" aria-label="${typeof t === 'function' ? t(lang, 'collateralRateLabel') : 'Rate'} (${colItemName})" title="${typeof t === 'function' ? t(lang, 'collateralRateLabel') : 'Rate'} (${colItemName})">
                        </div>
                    </div>
                </div>
                <span id="col-amount-error-${col.id}" class="sr-only" role="alert"></span>
                <span id="col-redemption-error-${col.id}" class="sr-only" role="alert"></span>
                <span id="col-rate-error-${col.id}" class="sr-only" role="alert"></span>
            `;

            const amountInput = row.querySelector('.col-amount-input');
            const redemptionInput = row.querySelector('.col-redemption-input');
            const rateInput = row.querySelector('.col-rate-input');
            const removeBtn = row.querySelector('.col-remove-btn');
            const clearBtn = row.querySelector('.col-clear-btn');

            if (amountInput) {
                amountInput.value = col.amount || '';
                if (typeof autoFitInputText === 'function') autoFitInputText(amountInput, 14, 10);
            }
            if (redemptionInput) {
                redemptionInput.value = col.redemption || '';
                if (typeof autoFitInputText === 'function') autoFitInputText(redemptionInput, 14, 10);
            }
            if (rateInput) {
                rateInput.value = col.rate || '';
                if (typeof autoFitInputText === 'function') autoFitInputText(rateInput, 14, 10);
            }

            const validateColRedemption = () => {
                const a = typeof safeParseFloat === 'function' ? safeParseFloat(amountInput?.value) : parseFloat(amountInput?.value);
                const red = typeof safeParseFloat === 'function' ? safeParseFloat(redemptionInput?.value) : parseFloat(redemptionInput?.value);
                const grp = redemptionInput?.parentElement;
                const errEl = row.querySelector(`#col-redemption-error-${col.id}`);
                if (!isNaN(a) && a > 0 && !isNaN(red) && red > a) {
                    if (grp) grp.classList.add('error-state');
                    if (redemptionInput) {
                        redemptionInput.setAttribute('aria-invalid', 'true');
                        redemptionInput.setAttribute('aria-describedby', `col-redemption-error-${col.id}`);
                        redemptionInput.title = typeof t === 'function' ? t(lang, 'errorRedemptionExceedsNominal') : '';
                    }
                    if (errEl) errEl.textContent = `${colItemName}: ${typeof t === 'function' ? t(lang, 'errorRedemptionExceedsNominal') : ''}`;
                } else {
                    if (grp) grp.classList.remove('error-state');
                    if (redemptionInput) {
                        redemptionInput.removeAttribute('aria-invalid');
                        redemptionInput.removeAttribute('aria-describedby');
                        redemptionInput.title = `${typeof t === 'function' ? t(lang, 'collateralRedemptionLabel') : ''} (${colItemName})`;
                    }
                    if (errEl) errEl.textContent = '';
                }
            };

            const validateColRate = () => {
                const r = typeof safeParseFloat === 'function' ? safeParseFloat(rateInput?.value) : parseFloat(rateInput?.value);
                const grp = rateInput?.parentElement;
                const errEl = row.querySelector(`#col-rate-error-${col.id}`);
                if (!isNaN(r) && r > 100) {
                    if (grp) grp.classList.add('error-state');
                    if (rateInput) {
                        rateInput.setAttribute('aria-invalid', 'true');
                        rateInput.setAttribute('aria-describedby', `col-rate-error-${col.id}`);
                        rateInput.title = typeof t === 'function' ? t(lang, 'maxRate') : '';
                    }
                    if (errEl) errEl.textContent = `${colItemName}: ${typeof t === 'function' ? t(lang, 'maxRate') : ''}`;
                } else {
                    if (grp) grp.classList.remove('error-state');
                    if (rateInput) {
                        rateInput.removeAttribute('aria-invalid');
                        rateInput.removeAttribute('aria-describedby');
                        rateInput.title = `${typeof t === 'function' ? t(lang, 'collateralRateLabel') : ''} (${colItemName})`;
                    }
                    if (errEl) errEl.textContent = '';
                }
            };

            if (amountInput) {
                amountInput.addEventListener('input', (e) => {
                    if (typeof formatCurrencyInput === 'function') formatCurrencyInput(e.target);
                    col.amount = e.target.value;
                    validateColRedemption();
                    recalcCollateralMetrics();
                    if (typeof autoFitInputText === 'function') autoFitInputText(e.target, 14, 10);
                });
            }

            if (redemptionInput) {
                redemptionInput.addEventListener('input', (e) => {
                    if (typeof formatCurrencyInput === 'function') formatCurrencyInput(e.target);
                    col.redemption = e.target.value;
                    validateColRedemption();
                    recalcCollateralMetrics();
                    if (typeof autoFitInputText === 'function') autoFitInputText(e.target, 14, 10);
                });
            }

            if (rateInput) {
                rateInput.addEventListener('input', (e) => {
                    if (typeof validateRateInput === 'function') validateRateInput(e.target);
                    col.rate = e.target.value;
                    validateColRate();
                    recalcCollateralMetrics(true);
                    if (typeof autoFitInputText === 'function') autoFitInputText(e.target, 14, 10);
                });
                rateInput.addEventListener('blur', (e) => {
                    if (typeof formatRateInputBlur === 'function') formatRateInputBlur(e.target);
                    col.rate = e.target.value;
                    validateColRate();
                    recalcCollateralMetrics();
                    if (typeof autoFitInputText === 'function') autoFitInputText(e.target, 14, 10);
                });
            }

            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    if (typeof haptic !== 'undefined') haptic('light');
                    row.classList.remove('item-enter');
                    row.classList.add('item-exit');
                    setTimeout(() => {
                        collaterals = collaterals.filter(c => c.id !== col.id);
                        renderCollaterals();
                        recalcCollateralMetrics();
                        announceCollateralStatus((typeof t === 'function' ? t(lang, 'collateralRemoved') : 'Collateral removed').replace('{index}', colIndex));
                    }, 240);
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (typeof haptic !== 'undefined') haptic('light');
                    col.amount = '';
                    col.redemption = '';
                    col.rate = '';
                    if (amountInput) {
                        amountInput.value = '';
                        if (typeof autoFitInputText === 'function') autoFitInputText(amountInput, 12, 9.5);
                    }
                    if (redemptionInput) {
                        redemptionInput.value = '';
                        if (typeof autoFitInputText === 'function') autoFitInputText(redemptionInput, 12, 9.5);
                    }
                    if (rateInput) {
                        rateInput.value = '';
                        if (typeof autoFitInputText === 'function') autoFitInputText(rateInput, 12, 9.5);
                    }
                    validateColRedemption();
                    validateColRate();
                    recalcCollateralMetrics();
                });
            }

            fragment.appendChild(row);
        });

        listEl.appendChild(fragment);
        recalcCollateralMetrics();
    }

    /**
     * Unified collateral summary calculations
     * @param {Array} colList
     * @returns {Object} Calculated summary metrics
     */
    function getCollateralSummary(colList) {
        let totalCollateral = 0;
        let maxRate = 0;
        let totalMonthlyCdReturn = 0;
        let hasCollateral = false;
        let totalMaxLoan = 0;

        if (Array.isArray(colList)) {
            colList.forEach(c => {
                const a = (typeof safeParseFloat === 'function' ? safeParseFloat(c.amount) : parseFloat(c.amount)) || 0;
                const r = (typeof safeParseFloat === 'function' ? safeParseFloat(c.rate) : parseFloat(c.rate)) || 0;
                const red = typeof safeParseFloat === 'function' ? safeParseFloat(c.redemption) : parseFloat(c.redemption);
                if (a > 0) {
                    totalCollateral += a;
                    hasCollateral = true;
                    // Rule: 90% of nominal value or redemption value, whichever is lower
                    const colMax = (red !== undefined && red !== null && !isNaN(red) && red > 0)
                        ? Math.min(a * 0.90, red)
                        : a * 0.90;
                    totalMaxLoan += colMax;
                }
                if (r > maxRate) {
                    maxRate = r;
                }
                if (a > 0 && r > 0) {
                    totalMonthlyCdReturn += (a * r) / 1200;
                }
            });
        }

        const MAX_SECURED_LOAN = 100000000;
        const maxLoan = Math.min(totalMaxLoan, MAX_SECURED_LOAN);
        const minRate = maxRate > 0 ? maxRate + 2 : 0;

        return {
            totalCollateral,
            maxRate,
            totalMonthlyCdReturn,
            hasCollateral,
            maxLoan,
            minRate
        };
    }

    /**
     * Recalculates collateral summary HUD and triggers updates
     * @param {boolean} autoFillRate
     */
    function recalcCollateralMetrics(autoFillRate = false) {
        if (_options.getLoanType() !== 'secured') return;

        const { totalCollateral, maxLoan, minRate } = getCollateralSummary(collaterals);

        const totalColEl = document.getElementById('summary-total-collateral');
        const maxLoanEl = document.getElementById('summary-max-loan');
        const minRateEl = document.getElementById('summary-min-rate');

        const fitSummarySpan = (el, text) => {
            if (!el) return;
            el.textContent = text;
            if (text.length >= 14) {
                el.style.fontSize = '9px';
                el.style.letterSpacing = '-0.04em';
            } else if (text.length >= 11) {
                el.style.fontSize = '10.5px';
                el.style.letterSpacing = '-0.02em';
            } else {
                el.style.fontSize = '';
                el.style.letterSpacing = '';
            }
        };

        fitSummarySpan(totalColEl, totalCollateral > 0 ? displayFmt(totalCollateral) : '-');
        fitSummarySpan(maxLoanEl, maxLoan > 0 ? displayFmt(maxLoan) : '-');
        fitSummarySpan(minRateEl, minRate > 0 ? minRate.toFixed(2) + '%' : '-');

        const formInputs = _options.getFormInputs();
        if (autoFillRate && minRate > 0 && formInputs.rate) {
            formInputs.rate.value = minRate.toFixed(2);
            if (typeof _options.validateInput === 'function') _options.validateInput('rate');
        }

        updateCollateralWarnings();
        updateCollateralCashflow();
        updateMaxLoanChip();
    }

    function updateCollateralWarnings() {
        const wAmount = document.getElementById('warning-loan-amount');
        const wRate = document.getElementById('warning-loan-rate');

        if (_options.getLoanType() !== 'secured') {
            if (wAmount) wAmount.classList.add('hidden');
            if (wRate) wRate.classList.add('hidden');
            return;
        }

        const { totalCollateral, maxLoan: maxAllowedLoan, minRate: minRequiredRate, maxRate } = getCollateralSummary(collaterals);
        const formInputs = _options.getFormInputs();
        const lang = _options.getLang();

        const enteredAmount = (typeof safeParseFloat === 'function' ? safeParseFloat(formInputs.amount?.value) : parseFloat(formInputs.amount?.value)) || 0;
        const enteredRate = (typeof safeParseFloat === 'function' ? safeParseFloat(formInputs.rate?.value) : parseFloat(formInputs.rate?.value)) || 0;

        if (wAmount) {
            if (totalCollateral > 0 && enteredAmount > maxAllowedLoan) {
                const span = wAmount.querySelector('.warning-text');
                if (span && typeof t === 'function') {
                    span.textContent = t(lang, 'warningExceeds90Collateral').replace('{max}', displayFmt(maxAllowedLoan));
                }
                wAmount.classList.remove('hidden');
            } else {
                wAmount.classList.add('hidden');
            }
        }

        if (wRate) {
            if (maxRate > 0 && enteredRate > 0 && enteredRate < minRequiredRate) {
                const span = wRate.querySelector('.warning-text');
                if (span && typeof t === 'function') {
                    span.textContent = t(lang, 'warningBelowMinRate').replace('{min}', minRequiredRate.toFixed(2));
                }
                wRate.classList.remove('hidden');
            } else {
                wRate.classList.add('hidden');
            }
        }
    }

    function updateCollateralCashflow() {
        const card = document.getElementById('collateral-cashflow-card');
        if (!card) return;

        if (_options.getLoanType() !== 'secured') {
            card.classList.add('hidden');
            return;
        }

        const { totalMonthlyCdReturn, hasCollateral } = getCollateralSummary(collaterals);
        const formInputs = _options.getFormInputs();
        const lastRes = _options.getLastResult();
        const lang = _options.getLang();

        const lastM = lastRes?.M || (typeof safeParseFloat === 'function' ? safeParseFloat(formInputs.installment?.value) : parseFloat(formInputs.installment?.value)) || 0;
        const freq = lastRes?.freq || (document.getElementById('installment-freq')?.value === '3' ? 3 : 1);
        const monthlyInstallment = freq === 3 ? (lastM / 3) : lastM;

        if (!hasCollateral || monthlyInstallment <= 0) {
            card.classList.add('hidden');
            return;
        }

        let netDiff = totalMonthlyCdReturn - monthlyInstallment;
        if (Math.abs(netDiff) < 0.005) {
            netDiff = 0;
        }
        const isSurplus = netDiff >= 0;

        const cdReturnEl = document.getElementById('cashflow-cd-return');
        const loanInstEl = document.getElementById('cashflow-loan-inst');
        const netDiffEl = document.getElementById('cashflow-net-diff');
        const badgeEl = document.getElementById('cashflow-badge');
        const diffBoxEl = document.getElementById('cashflow-diff-box');
        const explainEl = document.getElementById('cashflow-explain');

        if (cdReturnEl) cdReturnEl.textContent = '+' + displayFmt(totalMonthlyCdReturn);
        if (loanInstEl) loanInstEl.textContent = '-' + displayFmt(monthlyInstallment);
        if (netDiffEl) {
            netDiffEl.textContent = (isSurplus ? '+' : '') + displayFmt(netDiff);
            netDiffEl.className = isSurplus
                ? 'font-black text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm select-text'
                : 'font-black text-red-600 dark:text-red-400 text-xs sm:text-sm select-text';
        }

        if (diffBoxEl) {
            diffBoxEl.className = isSurplus
                ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-1.5 rounded-lg flex flex-col justify-between min-h-[44px]'
                : 'cashflow-diff-deficit border p-1.5 rounded-lg flex flex-col justify-between min-h-[44px]';
        }

        if (badgeEl && typeof t === 'function') {
            badgeEl.textContent = isSurplus ? t(lang, 'cashflowSurplusBadge') : t(lang, 'cashflowDeficitBadge');
            badgeEl.className = isSurplus
                ? 'text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                : 'cashflow-badge-deficit text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap';
        }

        if (explainEl && typeof t === 'function') {
            explainEl.textContent = isSurplus
                ? t(lang, 'cashflowSurplusExplain')
                : t(lang, 'cashflowDeficitExplain');
        }

        // Self-covering reference loan amount
        const selfRow = document.getElementById('cashflow-self-covering-row');
        const selfAmtEl = document.getElementById('cashflow-self-covering-amount');
        const selfP = calculateSelfCoveringLoanAmount();
        if (selfRow && selfAmtEl && selfP > 0) {
            selfAmtEl.textContent = selfP.toLocaleString('en-US') + ' EGP';
            selfRow.classList.remove('hidden');
        } else if (selfRow) {
            selfRow.classList.add('hidden');
        }

        card.classList.remove('hidden');
    }

    /**
     * Calculates the loan amount P at which CD returns cover the loan installment
     * @returns {number} Integer self-covering principal
     */
    function calculateSelfCoveringLoanAmount() {
        if (_options.getLoanType() !== 'secured') return 0;

        let totalMonthlyCdReturn = 0;
        collaterals.forEach(c => {
            const a = (typeof safeParseFloat === 'function' ? safeParseFloat(c.amount) : parseFloat(c.amount)) || 0;
            const r = (typeof safeParseFloat === 'function' ? safeParseFloat(c.rate) : parseFloat(c.rate)) || 0;
            if (a > 0 && r > 0) totalMonthlyCdReturn += (a * r) / 1200;
        });
        if (totalMonthlyCdReturn <= 0) return 0;

        const formInputs = _options.getFormInputs();
        const rateVal = typeof safeParseFloat === 'function' ? safeParseFloat(formInputs.rate?.value) : parseFloat(formInputs.rate?.value);
        const periodVal = parseInt(formInputs.period?.value, 10);
        const freqVal = document.getElementById('installment-freq')?.value === '3' ? 3 : 1;

        if (isNaN(rateVal) || rateVal < 0 || isNaN(periodVal) || periodVal <= 0) return 0;

        const mTarget = totalMonthlyCdReturn * freqVal;
        const i = (rateVal / 100) * (freqVal / 12);

        const pExact = (i === 0)
            ? (mTarget * periodVal)
            : (mTarget * (Math.pow(1 + i, periodVal) - 1) / (i * Math.pow(1 + i, periodVal)));

        if (!isFinite(pExact) || pExact <= 0) return 0;

        let pInt = Math.floor(pExact);

        const getM = (pCandidate) => {
            const rawM = (i === 0)
                ? (pCandidate / periodVal)
                : (pCandidate * i * Math.pow(1 + i, periodVal) / (Math.pow(1 + i, periodVal) - 1));
            return typeof round2 === 'function' ? round2(rawM) : Math.round(rawM * 100) / 100;
        };

        while (pInt > 0 && ((getM(pInt) / freqVal) - totalMonthlyCdReturn > 0.0049)) {
            pInt--;
        }

        return pInt > 0 ? pInt : 0;
    }

    function updateMaxLoanChip() {
        const chipContainer = document.getElementById('max-loan-chip-container') || document.getElementById('self-covering-chip-container');
        const chipVal = document.getElementById('max-loan-chip-val') || document.getElementById('self-covering-chip-val');
        if (!chipContainer || !chipVal) return;

        if (_options.getLoanType() !== 'secured') {
            chipContainer.classList.add('hidden');
            return;
        }

        const { maxLoan } = getCollateralSummary(collaterals);
        if (maxLoan > 0) {
            chipVal.textContent = Math.floor(maxLoan).toLocaleString('en-US') + ' ' + (_options.getLang() === 'ar' ? 'ج.م' : 'EGP');
            chipContainer.classList.remove('hidden');
        } else {
            chipContainer.classList.add('hidden');
        }
    }

    function applyMaxLoanAmount() {
        const { maxLoan } = getCollateralSummary(collaterals);
        const formInputs = _options.getFormInputs();
        if (maxLoan <= 0 || !formInputs.amount) return;

        if (typeof haptic !== 'undefined') haptic('medium');

        const pVal = Math.floor(maxLoan);
        formInputs.amount.value = pVal.toLocaleString('en-US');
        formInputs.amount.dispatchEvent(new Event('input', { bubbles: true }));
        if (typeof _options.validateInput === 'function') _options.validateInput('amount');

        const instRadio = document.querySelector('input[name="calc-target"][value="installment"]');
        if (instRadio && !instRadio.checked) {
            instRadio.checked = true;
            instRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }

        if (typeof _options.onRecalcRequired === 'function') {
            _options.onRecalcRequired();
        }
    }

    function applySelfCoveringLoanAmount() {
        const p = calculateSelfCoveringLoanAmount();
        const formInputs = _options.getFormInputs();
        if (p <= 0 || !formInputs.amount) return;

        if (typeof haptic !== 'undefined') haptic('medium');

        formInputs.amount.value = p.toLocaleString('en-US');
        formInputs.amount.dispatchEvent(new Event('input', { bubbles: true }));
        if (typeof _options.validateInput === 'function') _options.validateInput('amount');

        const instRadio = document.querySelector('input[name="calc-target"][value="installment"]');
        if (instRadio && !instRadio.checked) {
            instRadio.checked = true;
            instRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }

        if (typeof _options.onRecalcRequired === 'function') {
            _options.onRecalcRequired();
        }
    }

    /**
     * Initialize collateral buttons and events
     * @param {Object} options
     */
    function initCollaterals(options = {}) {
        _options = Object.assign(_options, options);

        const addColBtn = document.getElementById('add-collateral-btn');
        if (addColBtn) {
            addColBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                const newId = nextCollateralId++;
                collaterals.push({ id: newId, amount: '', redemption: '', rate: '', period: '' });
                renderCollaterals(newId);
                const lang = _options.getLang();
                announceCollateralStatus((typeof t === 'function' ? t(lang, 'collateralAdded') : 'Collateral added').replace('{index}', collaterals.length));
            });
        }

        const clearColBtn = document.getElementById('clear-collateral-btn');
        if (clearColBtn) {
            clearColBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('medium');
                collaterals = [{ id: 1, amount: '', redemption: '', rate: '', period: '' }];
                nextCollateralId = 2;
                renderCollaterals();
                recalcCollateralMetrics();
                const lang = _options.getLang();
                announceCollateralStatus(typeof t === 'function' ? t(lang, 'collateralsCleared') : 'Collaterals cleared');
            });
        }

        const applySelfBtn = document.getElementById('apply-self-covering-btn');
        if (applySelfBtn) {
            applySelfBtn.addEventListener('click', () => applySelfCoveringLoanAmount());
        }

        const maxChip = document.getElementById('max-loan-chip') || document.getElementById('self-covering-chip');
        if (maxChip) {
            maxChip.addEventListener('click', () => applyMaxLoanAmount());
        }
    }

    // Export module to global scope
    window.CollateralManager = {
        get: getCollaterals,
        getRaw: () => collaterals,
        setRaw: (newList) => {
            if (Array.isArray(newList)) {
                collaterals = newList;
                nextCollateralId = collaterals.length + 1;
                renderCollaterals();
                recalcCollateralMetrics(false);
            }
        },
        setFromCd1: setMainCollateralsFromCd1,
        render: renderCollaterals,
        recalc: recalcCollateralMetrics,
        updateWarnings: updateCollateralWarnings,
        updateCashflow: updateCollateralCashflow,
        updateMaxLoanChip: updateMaxLoanChip,
        updateSelfCoveringChip: updateMaxLoanChip,
        applyMaxLoanAmount: applyMaxLoanAmount,
        applySelfCoveringLoanAmount: applySelfCoveringLoanAmount,
        init: initCollaterals
    };

    // Backward-compatible global bindings
    window.getCollaterals = getCollaterals;
    window.setMainCollateralsFromCd1 = setMainCollateralsFromCd1;
    window.renderCollaterals = renderCollaterals;
    window.recalcCollateralMetrics = recalcCollateralMetrics;
    window.updateCollateralWarnings = updateCollateralWarnings;
    window.updateCollateralCashflow = updateCollateralCashflow;
    window.updateMaxLoanChip = updateMaxLoanChip;
    window.updateSelfCoveringChip = updateMaxLoanChip;
    window.applyMaxLoanAmount = applyMaxLoanAmount;
    window.applySelfCoveringLoanAmount = applySelfCoveringLoanAmount;
})();

/**
 * js/app.js - Main Application Logic
 * Revised to prevent conflicts and ensure stability.
 */

(function() { // Wrap in IIFE to prevent global variable collisions

    // --- Local State & Utils ---
    const AppState = {
        activeKey: 'installment',
        lang: 'en',
        theme: 'system',
        lastRes: {},
        schedule: []
    };

    let appToastTimer = null;

    // Helper Fallbacks (in case logic.js/ui.js are missing/delayed)
    const safeNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
    const fmtMoney = (n) => { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); };

    // [STEP 1] Define Core Keys
    const CORE_KEYS = ['amount', 'rate', 'period', 'installment'];

    // DOM Elements Cache (Populated on Load)
    let formInputs = {};
    let inputGroups = {};
    let errorLabels = {};
    let dateInputs = {};

    // --- Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Initialize DOM Cache securely
        formInputs = { 
            amount: document.getElementById('loan-amount'), 
            rate: document.getElementById('interest-rate'), 
            period: document.getElementById('loan-period'), 
            installment: document.getElementById('monthly-installment') 
        };
        inputGroups = { 
            amount: document.getElementById('group-amount'), 
            rate: document.getElementById('group-rate'), 
            period: document.getElementById('group-period'), 
            installment: document.getElementById('group-installment') 
        };
        errorLabels = { 
            amount: document.getElementById('error-amount'), 
            rate: document.getElementById('error-rate'), 
            period: document.getElementById('error-period'), 
            installment: document.getElementById('error-installment') 
        };
        dateInputs = {
            startDisplay: document.getElementById('start-date-display'),
            startNative: document.getElementById('start-date-native'),
            firstDisplay: document.getElementById('first-inst-date-display'),
            firstNative: document.getElementById('first-inst-date-native')
        };

        // Safety Check: If critical elements are missing, stop to prevent freeze
        if (!formInputs.amount || !document.getElementById('theme-toggle')) {
            console.error("Critical DOM elements missing.");
            return;
        }

        // 2. Initialize PWA & UI
        if(typeof initPWA === 'function') initPWA();
        
        setTimeout(() => { document.body.classList.remove('preload'); }, 150);

        // 3. Load Preferences
        AppState.lang = localStorage.getItem('language') || (navigator.language.startsWith('ar') ? 'ar' : 'en');
        AppState.theme = localStorage.getItem('theme') || 'system';
        
        // 4. Set Initial Date if empty
        if(dateInputs.startNative && !dateInputs.startNative.value) {
            dateInputs.startNative.valueAsDate = new Date();
            // Trigger manual update for display input
            if(dateInputs.startDisplay) dateInputs.startDisplay.value = getFormattedDate(new Date()); 
        }

        // 5. Initialize Theme & Lang
        if(typeof initTheme === 'function') initTheme(AppState.lastRes);
        if(typeof updateLangUI === 'function') updateLangUI(AppState.lang);
        if(typeof updateInputState === 'function') updateInputState(inputGroups, formInputs, errorLabels, AppState.activeKey, AppState.lang);
        updateThemeMenuState(AppState.theme);

        // 6. Setup Event Listeners
        setupEventListeners();
        setupMobileKeyboard();
        
        // 7. Initialize Gestures
        if(typeof initSwipeToClose === 'function') initSwipeToClose();

        document.body.classList.add('lang-ready');
    });

    // --- Helper Logic ---

    function coreInputsFilled() {
        return CORE_KEYS
            .filter(k => k !== AppState.activeKey)
            .every(k => formInputs[k] && formInputs[k].value.trim() !== '');
    }

    function updateSummaryView(isAdvanced) {
        const std = document.getElementById('std-installments-view');
        const adv = document.getElementById('adv-installments-view');
        if(!std || !adv) return;
        
        if (isAdvanced) {
            std.classList.remove('max-h-24', 'opacity-100');
            std.classList.add('max-h-0', 'opacity-0');
            adv.classList.remove('max-h-0', 'opacity-0');
            adv.classList.add('max-h-96', 'opacity-100');
        } else {
            std.classList.add('max-h-24', 'opacity-100');
            std.classList.remove('max-h-0', 'opacity-0');
            adv.classList.add('max-h-0', 'opacity-0');
            adv.classList.remove('max-h-96', 'opacity-100');
        }
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        
        // 1. Theme Menu Logic
        const themeBtn = document.getElementById('theme-toggle');
        const themeMenu = document.getElementById('theme-menu');
        const themeOptions = document.querySelectorAll('.theme-option');

        if(themeBtn && themeMenu) {
            themeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Hide toast immediately on interaction
                hideToast();
                
                const isClosed = themeMenu.classList.contains('invisible');
                if (isClosed) {
                    // Open
                    themeMenu.classList.remove('invisible', 'opacity-0', 'scale-95', '-translate-y-2', 'pointer-events-none');
                    themeMenu.classList.add('visible', 'opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto');
                    updateThemeMenuState(AppState.theme);
                } else {
                    closeThemeMenu();
                }
            });

            document.addEventListener('click', (e) => {
                if (!themeMenu.classList.contains('invisible') && !themeBtn.contains(e.target) && !themeMenu.contains(e.target)) {
                    closeThemeMenu();
                }
            });
        }

        function closeThemeMenu() {
            if(!themeMenu) return;
            themeMenu.classList.remove('visible', 'opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto');
            themeMenu.classList.add('invisible', 'opacity-0', 'scale-95', '-translate-y-2', 'pointer-events-none');
        }

        // Theme Options Click
        themeOptions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newTheme = btn.dataset.themeValue;
                if (newTheme === AppState.theme) {
                    closeThemeMenu();
                    return;
                }

                // Prepare Update Logic
                const performUpdate = () => {
                    AppState.theme = newTheme;
                    localStorage.setItem('theme', AppState.theme);
                    if(typeof applyTheme === 'function') applyTheme(AppState.theme, AppState.lastRes);
                    updateThemeMenuState(AppState.theme);
                    closeThemeMenu();
                    
                    // Show Toast
                    const label = AppState.theme === 'system' 
                        ? (txt && txt[AppState.lang] ? txt[AppState.lang].themeSystem : 'System') 
                        : (AppState.theme === 'dark' 
                            ? (txt && txt[AppState.lang] ? txt[AppState.lang].themeDark : 'Dark') 
                            : (txt && txt[AppState.lang] ? txt[AppState.lang].themeLight : 'Light'));
                    showToast(label);
                };

                // Handle View Transitions Safely
                const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isCurrentDark = AppState.theme === 'dark' || (AppState.theme === 'system' && sysDark);
                const isNewDark = newTheme === 'dark' || (newTheme === 'system' && sysDark);
                const isReverse = isCurrentDark && !isNewDark;

                if (!document.startViewTransition) {
                    performUpdate();
                } else {
                    try {
                        const x = e.clientX;
                        const y = e.clientY;
                        const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
                        
                        const transition = document.startViewTransition(() => performUpdate());
                        
                        transition.ready.then(() => {
                            const keyframes = isReverse
                                ? [{ clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }, { clipPath: `circle(0px at ${x}px ${y}px)` }]
                                : [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }];
                            
                            document.documentElement.animate(keyframes, {
                                duration: 500, easing: 'ease-in-out', fill: 'forwards',
                                pseudoElement: isReverse ? '::view-transition-old(root)' : '::view-transition-new(root)'
                            });
                        });
                        
                        transition.finished.then(() => {
                            document.documentElement.classList.remove('reverse-transition');
                        });
                        
                        if(isReverse) document.documentElement.classList.add('reverse-transition');
                        
                    } catch (err) {
                        // Fallback if transition API fails
                        performUpdate();
                    }
                }
            });
        });

        // 2. Language Switch
        const langEn = document.getElementById('lang-en');
        const langAr = document.getElementById('lang-ar');
        if(langEn) langEn.addEventListener('click', () => setLang('en'));
        if(langAr) langAr.addEventListener('click', () => setLang('ar'));

        // 3. Inputs Logic
        document.querySelectorAll('.lock-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                AppState.activeKey = btn.dataset.target;
                if(typeof updateInputState === 'function') updateInputState(inputGroups, formInputs, errorLabels, AppState.activeKey, AppState.lang);
            });
        });

        Object.keys(formInputs).forEach(key => {
            const input = formInputs[key];
            if(!input) return;

            input.addEventListener('input', () => {
                if (key === 'amount' || key === 'installment') {
                    if(typeof formatCurrencyInput === 'function') formatCurrencyInput(input);
                } else if (key === 'period') {
                    if(typeof validatePeriodInput === 'function') validatePeriodInput(input);
                } else if (key === 'rate') {
                    if(typeof validateRateInput === 'function') validateRateInput(input);
                }
                validateInput(key);
            });

            input.addEventListener('blur', () => {
                if(input.value.trim() !== '') {
                    validateInput(key);
                    if(key === 'rate' && typeof formatRateInputBlur === 'function') formatRateInputBlur(input);
                }
            });
        });

        // TD Amount
        const tdAmount = document.getElementById('td-amount');
        if(tdAmount) tdAmount.addEventListener('input', (e) => { if(typeof formatCurrencyInput === 'function') formatCurrencyInput(e.target); });

        // Admin Fees
        const adminInput = document.getElementById('admin-fees');
        if(adminInput) {
            adminInput.addEventListener('input', () => {
                if(typeof validateRateInput === 'function') validateRateInput(adminInput);
                if(safeNum(adminInput.value) > 100) adminInput.parentElement.classList.add('error-state');
                else adminInput.parentElement.classList.remove('error-state');
            });
            adminInput.addEventListener('blur', () => { if(typeof formatRateInputBlur === 'function') formatRateInputBlur(adminInput); });
        }

        // Dates
        if(dateInputs.startNative) {
            dateInputs.startNative.addEventListener('change', (e) => {
                if(e.target.value) {
                    const parts = e.target.value.split('-');
                    const date = new Date(parts[0], parts[1] - 1, parts[2]);
                    if(typeof getFormattedDate === 'function') dateInputs.startDisplay.value = getFormattedDate(date);
                    dateInputs.startDisplay.classList.remove('text-red-500'); 
                    
                    const isAdvanced = document.getElementById('advanced-toggle').checked;
                    if ((!isAdvanced || !dateInputs.firstNative.value) && dateInputs.firstNative) {
                        const nextMonth = new Date(date);
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        if (date.getDate() > 28 && nextMonth.getDate() < date.getDate()) nextMonth.setDate(0); 
                        const y = nextMonth.getFullYear();
                        const m = String(nextMonth.getMonth() + 1).padStart(2, '0');
                        const d = String(nextMonth.getDate()).padStart(2, '0');
                        dateInputs.firstNative.value = `${y}-${m}-${d}`;
                        dateInputs.firstNative.dispatchEvent(new Event('change'));
                    }
                } else {
                    dateInputs.startDisplay.value = '';
                }
            });
            dateInputs.startDisplay.addEventListener('input', (e) => { if(typeof validateAndFormatDate === 'function') validateAndFormatDate(e, dateInputs.startNative); });
        }

        if(dateInputs.firstNative) {
            dateInputs.firstNative.addEventListener('change', (e) => {
                if(e.target.value) {
                    const parts = e.target.value.split('-');
                    const date = new Date(parts[0], parts[1] - 1, parts[2]);
                    if(typeof getFormattedDate === 'function') dateInputs.firstDisplay.value = getFormattedDate(date);
                    dateInputs.firstDisplay.classList.remove('text-red-500');
                } else {
                    dateInputs.firstDisplay.value = '';
                }
            });
            dateInputs.firstDisplay.addEventListener('input', (e) => { if(typeof validateAndFormatDate === 'function') validateAndFormatDate(e, dateInputs.firstNative); });
        }

        // Toggles
        const advToggle = document.getElementById('advanced-toggle');
        if(advToggle) {
            advToggle.addEventListener('change', (e) => {
                const advancedSection = document.getElementById('advanced-section');
                const labelKey = e.target.checked ? "bookingDateLabel" : "startDateLabel";
                const dateLabel = document.getElementById('date-label');
                if(dateLabel && txt) dateLabel.textContent = txt[AppState.lang][labelKey];
                
                if(e.target.checked) {
                    advancedSection.classList.remove('max-h-0', 'opacity-0');
                    advancedSection.style.maxHeight = '500px'; 
                    advancedSection.classList.add('opacity-100');
                } else {
                    advancedSection.classList.add('max-h-0', 'opacity-0');
                    advancedSection.style.maxHeight = '0';
                    advancedSection.classList.remove('opacity-100');
                }
                
                updateSummaryView(e.target.checked);
                if (coreInputsFilled()) appCalculate();
            });
        }

        const ssToggle = document.getElementById('self-sufficient-toggle');
        if(ssToggle) {
            const ssSection = document.getElementById('self-sufficient-section');
            ssToggle.addEventListener('change', (e) => {
                ssSection.style.maxHeight = e.target.checked ? '500px' : '0';
                ssSection.style.opacity = e.target.checked ? '1' : '0';
            });
        }

        // Main Buttons
        const calcBtn = document.getElementById('calculate-button');
        if(calcBtn) calcBtn.addEventListener('click', appCalculate);
        
        const resetBtn = document.getElementById('reset-button');
        if(resetBtn) resetBtn.addEventListener('click', resetApp);

        // Schedule & Export
        const schedBtn = document.getElementById('schedule-button');
        if(schedBtn) schedBtn.addEventListener('click', () => { if(typeof showScheduleUI === 'function') showScheduleUI(AppState.schedule, AppState.lang, true); });
        
        const closeSchedBtn = document.getElementById('close-schedule-btn');
        if(closeSchedBtn) closeSchedBtn.addEventListener('click', () => { if(typeof closeScheduleUI === 'function') closeScheduleUI(); });

        const pdfBtn = document.getElementById('export-pdf-button');
        if(pdfBtn) pdfBtn.addEventListener('click', printReport);
        
        const xlsxBtn = document.getElementById('export-xlsx-button');
        if(xlsxBtn) xlsxBtn.addEventListener('click', exportExcel);

        // Modals
        setupModalListeners();
        
        // Updates
        const updateBtn = document.getElementById('force-update-btn');
        if(updateBtn) updateBtn.addEventListener('click', checkUpdates);
        
        // Install
        setupInstallListeners();

        // Keyboard
        document.addEventListener('keydown', handleKeyboard);
    }

    // --- Core Logic Wrappers ---

    function setLang(l) { 
        AppState.lang = l; 
        localStorage.setItem('language', l); 
        if(typeof updateLangUI === 'function') updateLangUI(l); 
        Object.keys(formInputs).forEach(key => validateInput(key));
        if(AppState.lastRes.P) { 
            if(typeof showScheduleUI === 'function') showScheduleUI(AppState.schedule, AppState.lang, false); 
            if(typeof drawChart === 'function') drawChart(AppState.lastRes.P, AppState.lastRes.TI, AppState.lang); 
        } 
    }

    function validateInput(key) {
        if (key === AppState.activeKey) return true;
        if (!formInputs[key]) return true;

        let valStr = formInputs[key].value;
        // Use fallback safeNum if available, else simple check
        let val = (typeof safeParseFloat === 'function') ? safeParseFloat(valStr) : parseFloat(valStr.replace(/,/g, ''));
        
        let errMsg = "Invalid value";
        let isValid = true;

        if (isNaN(val) || val < 0) isValid = false;
        
        if (key === 'amount') {
            if (valStr.includes('.') || (val % 1 !== 0)) {
                isValid = false;
                errMsg = AppState.lang === 'ar' ? 'أرقام صحيحة فقط' : 'Whole numbers only';
            }
        } else if (key === 'rate') {
            if (val > 100) {
                isValid = false;
                errMsg = AppState.lang === 'ar' ? 'الحد الأقصى 100%' : 'Max rate is 100%';
            }
        } else if (key === 'period') {
            if (val === 0) isValid = false;
            if (val > 600) {
                isValid = false;
                errMsg = AppState.lang === 'ar' ? 'الحد الأقصى 600 شهر' : 'Max 600 months';
            }
        }

        if(inputGroups[key] && errorLabels[key]) {
            if (!isValid && valStr !== '') {
                inputGroups[key].classList.add('error-state');
                errorLabels[key].textContent = errMsg;
                errorLabels[key].classList.remove('hidden');
            } else {
                inputGroups[key].classList.remove('error-state');
                errorLabels[key].classList.add('hidden');
            }
        }
        return isValid;
    }

    function updateThemeMenuState(activeTheme) {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(btn => {
            const val = btn.dataset.themeValue;
            const check = btn.querySelector('.check-icon');
            if (val === activeTheme) {
                btn.classList.add('bg-indigo-50', 'dark:bg-indigo-900/20', 'text-indigo-700', 'dark:text-indigo-300');
                if(check) check.classList.remove('hidden');
            } else {
                btn.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20', 'text-indigo-700', 'dark:text-indigo-300');
                if(check) check.classList.add('hidden');
            }
        });
    }

    function appCalculate() {
        let isValid = true;
        CORE_KEYS.forEach(key => {
            if (key === AppState.activeKey) return;
            if (!validateInput(key)) isValid = false;
        });

        if (!isValid) {
            showToast("Please check input fields.", 'error');
            return;
        }

        if(typeof calculateLoan !== 'function' || typeof generateSchedule !== 'function') {
            console.error("Logic functions missing");
            return;
        }

        const isAdvanced = document.getElementById('advanced-toggle').checked;
        const calcResult = calculateLoan({
            amount: formInputs.amount.value,
            rate: formInputs.rate.value,
            period: formInputs.period.value,
            installment: formInputs.installment.value
        }, AppState.activeKey);

        if (calcResult.valid) {
            const { P, R, N, M } = calcResult;
            const displayFmt = (typeof fmt === 'function') ? fmt : fmtMoney;

            if(AppState.activeKey==='period') formInputs.period.value = N;
            else if(AppState.activeKey==='installment') formInputs.installment.value = displayFmt(M);
            else if(AppState.activeKey==='rate') formInputs.rate.value = R.toFixed(2);
            else if(AppState.activeKey==='amount') formInputs.amount.value = displayFmt(P);

            let bookingDate = new Date();
            if (dateInputs.startNative.value) {
                const parts = dateInputs.startNative.value.split('-');
                bookingDate = new Date(parts[0], parts[1]-1, parts[2]);
            }
            
            let m1_Date;
            if (isAdvanced && dateInputs.firstNative.value) {
                const parts = dateInputs.firstNative.value.split('-');
                m1_Date = new Date(parts[0], parts[1]-1, parts[2]);
            } else {
                m1_Date = new Date(bookingDate);
                m1_Date.setMonth(m1_Date.getMonth() + 1);
            }

            const schedResult = generateSchedule({ P, R, N, M }, { bookingDate, m1_Date, isAdvanced });

            AppState.schedule = schedResult.schedule;
            const totalActualInterest = schedResult.totalActualInterest;
            const finalTotalPayment = P + totalActualInterest;
            const finalFlatRate = (N > 0 && P > 0) ? ((totalActualInterest / P) / (N / 12) * 100).toFixed(2) : '0';

            AppState.lastRes = { P, R, N, M, FR: finalFlatRate, TI: totalActualInterest, startDate: dateInputs.startNative.value };

            document.getElementById('summary-rate').textContent = R.toFixed(2) + '%';
            document.getElementById('summary-principal').textContent = displayFmt(P);
            document.getElementById('total-interest').textContent = displayFmt(totalActualInterest);
            document.getElementById('total-sum').textContent = displayFmt(finalTotalPayment);
            
            document.querySelectorAll('.flat-rate-display').forEach(el => el.textContent = finalFlatRate + '%');
            document.getElementById('chart-empty-state').classList.add('hidden');

            if (isAdvanced) {
                document.getElementById('summary-first-inst').textContent = displayFmt(schedResult.m1_Payment);
                const regInstEl = document.getElementById('summary-regular-inst');
                regInstEl.textContent = displayFmt(M);
                regInstEl.className = "text-lg font-bold text-white select-text"; 
                
                const adminFeesVal = parseFloat(document.getElementById('admin-fees').value) || 0;
                const fees = (P * adminFeesVal) / 100;
                document.getElementById('summary-admin-fees').textContent = displayFmt(fees);
                document.getElementById('summary-net-loan').textContent = displayFmt(P - fees);
            } else {
                document.getElementById('summary-std-inst').textContent = displayFmt(M);
            }

            if(document.getElementById('self-sufficient-toggle').checked) {
                const tdR = safeNum(document.getElementById('td-rate').value);
                const userTd = safeNum(document.getElementById('td-amount').value);
                if(tdR > 0) {
                    document.getElementById('req-td-display').textContent = displayFmt(M / (tdR/1200));
                    if(userTd > 0) {
                        const net = (userTd * (tdR/1200)) - M;
                        const el = document.getElementById('net-flow-display');
                        el.textContent = displayFmt(net);
                        el.className = `font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`;
                    }
                }
            }

            if(typeof drawChart === 'function') drawChart(P, totalActualInterest, AppState.lang);
            
            document.getElementById('schedule-button').disabled = false;
            document.getElementById('export-pdf-button').disabled = false;
            document.getElementById('export-xlsx-button').disabled = false;
            document.getElementById('save-button').disabled = false;

            if(typeof showScheduleUI === 'function') showScheduleUI(AppState.schedule, AppState.lang, false);
        } else {
            showToast("Calculation failed. Check inputs.", 'error');
        }
    }

    function resetApp() {
        Object.values(formInputs).forEach(i => i.value = '');
        document.getElementById('td-rate').value = '';
        document.getElementById('td-amount').value = '';
        
        dateInputs.startNative.valueAsDate = new Date();
        dateInputs.startNative.dispatchEvent(new Event('change'));
        
        document.getElementById('advanced-toggle').checked = false;
        document.getElementById('advanced-toggle').dispatchEvent(new Event('change')); // Trigger listener to hide
        
        updateSummaryView(false);

        document.getElementById('admin-fees').value = '';
        
        document.getElementById('self-sufficient-toggle').checked = false;
        document.getElementById('self-sufficient-toggle').dispatchEvent(new Event('change'));

        ['summary-rate', 'summary-principal', 'total-interest', 'total-sum'].forEach(id => document.getElementById(id).textContent = '-');
        document.querySelectorAll('.flat-rate-display').forEach(el => el.textContent = '-');
        ['summary-first-inst', 'summary-regular-inst', 'summary-std-inst', 'summary-admin-fees', 'summary-net-loan', 'req-td-display', 'net-flow-display'].forEach(id => document.getElementById(id).textContent = '-');
        
        Object.values(errorLabels).forEach(e => e.classList.add('hidden')); 
        Object.values(inputGroups).forEach(g => g.classList.remove('error-state'));

        if(typeof chartInst !== 'undefined' && chartInst) { chartInst.destroy(); chartInst = null; }
        document.getElementById('chart-empty-state').classList.remove('hidden');
        if(typeof closeScheduleUI === 'function') closeScheduleUI();
        
        document.getElementById('schedule-button').disabled = true;
        document.getElementById('save-button').disabled = true;
        document.getElementById('export-pdf-button').disabled = true;
        document.getElementById('export-xlsx-button').disabled = true;
    }

    // --- Modal Logic ---
    function setupModalListeners() {
        const historyModal = document.getElementById('history-modal');
        const historyBtn = document.getElementById('history-btn');
        const closeHistory = document.getElementById('close-history');
        const historyList = document.getElementById('history-list');

        if(historyBtn && historyModal) {
            historyBtn.addEventListener('click', () => {
                const history = JSON.parse(localStorage.getItem('loanHistory') || '[]');
                if(typeof renderHistoryList === 'function') renderHistoryList(history, AppState.lang);
                if(typeof toggleModal === 'function') toggleModal(historyModal);
            });
            closeHistory.addEventListener('click', () => { if(typeof toggleModal === 'function') toggleModal(historyModal); });
            historyModal.addEventListener('click', (e) => { 
                if((e.target === historyModal || e.target.classList.contains('modal-overlay')) && typeof toggleModal === 'function') toggleModal(historyModal); 
            });

            if(historyList) {
                historyList.addEventListener('click', (e) => {
                    const btn = e.target.closest('button');
                    if (!btn) return;
                    const index = parseInt(btn.dataset.index);
                    if (isNaN(index)) return;

                    if (btn.classList.contains('load-btn')) {
                        const history = JSON.parse(localStorage.getItem('loanHistory') || '[]');
                        const item = history[index];
                        if(item) {
                            AppState.activeKey = item.activeKey;
                            if(typeof updateInputState === 'function') updateInputState(inputGroups, formInputs, errorLabels, AppState.activeKey, AppState.lang);
                            formInputs.amount.value = item.values.amount;
                            formInputs.rate.value = item.values.rate;
                            formInputs.period.value = item.values.period;
                            formInputs.installment.value = item.values.installment;
                            if(item.values.startDate) {
                                dateInputs.startNative.value = item.values.startDate;
                                dateInputs.startNative.dispatchEvent(new Event('change'));
                            }
                            if(typeof toggleModal === 'function') toggleModal(historyModal);
                            appCalculate();
                        }
                    } else if (btn.classList.contains('delete-btn')) {
                        const history = JSON.parse(localStorage.getItem('loanHistory') || '[]');
                        history.splice(index, 1);
                        localStorage.setItem('loanHistory', JSON.stringify(history));
                        if(typeof renderHistoryList === 'function') renderHistoryList(history, AppState.lang);
                    }
                });
            }
        }
        
        // Save Button
        const saveBtn = document.getElementById('save-button');
        if(saveBtn) saveBtn.addEventListener('click', () => {
            if(!AppState.lastRes.P) return;
            try {
                const history = JSON.parse(localStorage.getItem('loanHistory') || '[]');
                const entry = {
                    date: new Date().toISOString(),
                    activeKey: AppState.activeKey,
                    values: { 
                        amount: formInputs.amount.value, 
                        rate: formInputs.rate.value, 
                        period: formInputs.period.value, 
                        installment: formInputs.installment.value, 
                        startDate: dateInputs.startNative.value 
                    },
                    res: AppState.lastRes
                };
                history.unshift(entry);
                if(history.length > 20) history.pop();
                localStorage.setItem('loanHistory', JSON.stringify(history));
                showToast(txt[AppState.lang].saveSuccess);
            } catch (e) { showToast("Storage full", 'error'); }
        });

        // About Modal
        const aboutModal = document.getElementById('about-modal');
        if(aboutModal) {
            document.getElementById('about-btn').addEventListener('click', () => toggleModal(aboutModal));
            document.getElementById('close-about').addEventListener('click', () => toggleModal(aboutModal));
            document.getElementById('close-about-btn').addEventListener('click', () => toggleModal(aboutModal));
            aboutModal.addEventListener('click', (e) => { 
                if(e.target === aboutModal || e.target.classList.contains('modal-overlay')) toggleModal(aboutModal); 
            });
            
            document.getElementById('share-btn').addEventListener('click', async () => {
                if (navigator.share) {
                    try { await navigator.share({ title: txt[AppState.lang].shareTitle, text: txt[AppState.lang].shareText, url: window.location.href }); } catch (err) {}
                } else {
                    try { await navigator.clipboard.writeText(window.location.href); showToast(txt[AppState.lang].toastLinkCopied); } catch (err) { showToast("Copy failed"); }
                }
            });
        }
    }

    // --- Updates & Utils ---
    async function checkUpdates() {
        if (!navigator.onLine) { showToast(txt[AppState.lang].updateOffline, 'error'); return; }
        const btn = document.getElementById('force-update-btn');
        const icon = btn.querySelector('svg');
        icon.classList.add('spin-icon');
        
        try {
            const response = await fetch('./sw.js?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
            if (!response.ok) throw new Error('Unreachable');
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) { await registration.unregister(); }
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
                setTimeout(() => { window.location.reload(); }, 500);
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            icon.classList.remove('spin-icon');
            showToast(txt[AppState.lang].updateFail, 'error');
        }
    }

    function printReport() {
        if(AppState.schedule.length === 0) return;
        const frame = document.getElementById('print-frame');
        if(!frame) return;
        
        const doc = frame.contentWindow.document;
        const summaryClone = document.getElementById('summary-section').cloneNode(true);
        const scheduleClone = document.getElementById('schedule-container').cloneNode(true);
        
        scheduleClone.classList.remove('hidden', 'max-h-0', 'opacity-0');
        scheduleClone.classList.add('block', 'opacity-100');
        scheduleClone.style.marginTop = '2rem';
        
        const tableContainer = scheduleClone.querySelector('.table-container');
        if(tableContainer) {
            tableContainer.style.maxHeight = 'none';
            tableContainer.style.overflow = 'visible';
            tableContainer.style.border = 'none';
        }

        let styles = '';
        document.querySelectorAll('style').forEach(style => styles += style.outerHTML);
        let links = '';
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => links += link.outerHTML);

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html lang="${AppState.lang}" dir="${AppState.lang === 'ar' ? 'rtl' : 'ltr'}" class="light">
            <head><meta charset="UTF-8"><title>Loan Report</title>${links}${styles}
            <script src="./tailwind.js"></script>
            <style>
                body { background-color: white !important; color: black !important; padding: 2rem; font-family: system-ui; }
                .print-container { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; }
                #summary-section { background: white !important; border: 2px solid #000; border-radius: 12px; color: black !important; box-shadow: none !important; }
                #summary-section * { color: black !important; text-shadow: none !important; }
                #summary-section .absolute { display: none !important; }
                .summary-divider { background-color: #ccc !important; height: 1px !important; margin: 8px 0 !important; }
                .table-container { border: none !important; }
                table { border-collapse: collapse; width: 100%; font-size: 10pt; }
                thead th { background-color: #f3f4f6 !important; border-bottom: 2px solid #000 !important; padding: 8px; }
                tbody tr { border-bottom: 1px solid #e5e7eb !important; }
                tbody td { padding: 6px 8px !important; }
                ${AppState.lang === 'ar' ? 'th, td { text-align: left; }' : ''}
                #close-schedule-btn { display: none !important; }
            </style></head><body>
            <div class="print-container">${summaryClone.outerHTML}<div class="mt-8 w-full">${scheduleClone.innerHTML}</div></div>
            <script>window.onload = function() { setTimeout(() => { window.print(); }, 500); };</script></body></html>
        `);
        doc.close();
    }

    function exportExcel() {
        if(AppState.schedule.length === 0) return;
        const displayFmt = (typeof fmt === 'function') ? fmt : fmtMoney;
        const BOM = "\uFEFF"; 
        let csvContent = BOM; 
        csvContent += `${txt[AppState.lang].loanAmountLabel},"${displayFmt(AppState.lastRes.P)}"\n`;
        csvContent += `${txt[AppState.lang].interestRateLabel},"${displayFmt(AppState.lastRes.R)}%"\n`;
        csvContent += `${txt[AppState.lang].loanPeriodLabel},"${AppState.lastRes.N}"\n`;
        csvContent += `${txt[AppState.lang].monthlyInstallmentLabel},"${displayFmt(AppState.lastRes.M)}"\n\n`;
        csvContent += `${txt[AppState.lang].colMonth},${txt[AppState.lang].colDate},${txt[AppState.lang].colBalance},${txt[AppState.lang].colInterest},${txt[AppState.lang].colPrincipal},${txt[AppState.lang].colRemaining}\n`;
        AppState.schedule.forEach(r => { 
            const locale = AppState.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';
            const dateStr = r.rawDate.toLocaleDateString(locale, { month: AppState.lang === 'ar' ? 'long' : 'short', year: 'numeric' });
            csvContent += `${r.m},${dateStr},${r.bal.toFixed(2)},${r.int.toFixed(2)},${r.prin.toFixed(2)},${r.rem.toFixed(2)}\n`; 
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a"); 
        link.href = URL.createObjectURL(blob); 
        link.download = `Loan_Schedule_${Date.now()}.csv`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }

    // --- Toast Logic (Revised to prevent freeze) ---
    function showToast(message, type='normal') {
        const msgBox = document.getElementById('message-box');
        if(!msgBox) return;

        if (appToastTimer) { clearTimeout(appToastTimer); appToastTimer = null; }

        msgBox.textContent = message;
        msgBox.style.zIndex = "100"; 
        
        const baseClasses = 'fixed top-24 left-0 right-0 mx-auto w-fit max-w-[90vw] z-[100] px-6 py-3 rounded-lg text-white font-medium shadow-2xl text-sm text-center transition-all duration-500 ease-out transform origin-top';
        const colorClasses = type === 'error' ? 'bg-red-600 border-2 border-white/20 font-bold' : 'bg-gray-800 dark:bg-gray-700 border border-gray-700 dark:border-gray-600';

        msgBox.className = `${baseClasses} ${colorClasses} opacity-0 -translate-y-4 scale-95`;
        msgBox.classList.remove('hidden');

        void msgBox.offsetWidth; // Reflow

        msgBox.classList.remove('opacity-0', '-translate-y-4', 'scale-95');
        msgBox.classList.add('opacity-100', 'translate-y-0', 'scale-100');

        appToastTimer = setTimeout(() => { hideToast(); }, 3000); 
    }

    function hideToast() {
        const msgBox = document.getElementById('message-box');
        if(!msgBox || msgBox.classList.contains('hidden')) return;

        if (appToastTimer) { clearTimeout(appToastTimer); appToastTimer = null; }

        // Trigger fade out
        msgBox.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
        msgBox.classList.add('opacity-0', '-translate-y-4', 'scale-95');

        setTimeout(() => { msgBox.classList.add('hidden'); }, 500); 
    }

    // --- Install & Keyboard ---
    function setupInstallListeners() {
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); deferredPrompt = e;
            const instBtn = document.getElementById('install-button');
            if(instBtn) instBtn.classList.remove('hidden');
        });
        const instBtn = document.getElementById('install-button');
        if(instBtn) instBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            instBtn.classList.add('hidden');
        });
        const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        if (isIos && !isStandalone) {
            const iosMsg = document.getElementById('ios-install-message');
            if(iosMsg) iosMsg.classList.remove('hidden');
            const closeIos = document.getElementById('close-ios-msg');
            if(closeIos) closeIos.addEventListener('click', () => iosMsg.classList.add('hidden'));
        }
    }

    function setupMobileKeyboard() {
        CORE_KEYS.forEach(key => { if(formInputs[key]) formInputs[key].setAttribute('enterkeyhint', 'go'); });
    }

    function handleKeyboard(e) {
        if (e.key === 'Escape') {
            const aboutModal = document.getElementById('about-modal');
            const historyModal = document.getElementById('history-modal');
            const schedContainer = document.getElementById('schedule-container');
            if(aboutModal && !aboutModal.classList.contains('opacity-0')) toggleModal(aboutModal);
            else if(historyModal && !historyModal.classList.contains('opacity-0')) toggleModal(historyModal);
            else if(schedContainer && !schedContainer.classList.contains('hidden') && typeof closeScheduleUI === 'function') closeScheduleUI();
        }
        
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            const el = e.target;
            if (window.innerWidth < 1024 || el.getAttribute('enterkeyhint') === 'go') {
                e.preventDefault(); 
                if (coreInputsFilled()) { el.blur(); appCalculate(); }
                else {
                     const editableCore = CORE_KEYS.filter(k => k !== AppState.activeKey && !formInputs[k].hasAttribute('readonly')).map(k => formInputs[k]);
                    const idx = editableCore.indexOf(el);
                    if (idx !== -1 && idx < editableCore.length - 1) editableCore[idx + 1].focus();
                }
                return;
            }
            const editableCore = CORE_KEYS.filter(k => k !== AppState.activeKey && !formInputs[k].hasAttribute('readonly')).map(k => formInputs[k]);
            const idx = editableCore.indexOf(el);
            if (idx !== -1 && idx < editableCore.length - 1) { e.preventDefault(); editableCore[idx + 1].focus(); return; }
            if (coreInputsFilled()) { e.preventDefault(); el.blur(); appCalculate(); }
        }
    }

})(); // End IIFE
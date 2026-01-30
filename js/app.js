/**
 * js/app.js - Main Application Logic
 * Fixed: Radio button integration, Safe number parsing, Race conditions
 */

(function () { // Wrap in IIFE to prevent global variable collisions


    // --- Constants ---
    // APP_VERSION is now loaded from version.js (global scope)


    const Z_INDEX = {
        OVERLAY: 99999,
        MODAL: 9999,
        TOAST: 100
    };

    const MENU_CLASSES = {
        VISIBLE: ['visible', 'opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto'],
        HIDDEN: ['invisible', 'opacity-0', 'scale-95', '-translate-y-2', 'pointer-events-none']
    };

    // --- Local State & Utils ---
    const AppState = {
        activeKey: 'installment', // Default
        lang: 'en',
        theme: 'system',
        lastRes: {},
        schedule: []
    };


    // Use global fmt from logic.js if available, else fallback
    const displayFmt = (n) => (typeof fmt === 'function') ? fmt(n) : n.toFixed(2);

    // Robust date formatter
    const formatDate = (dateObj) => {
        if (typeof getFormattedDate === 'function') return getFormattedDate(dateObj);
        if (!dateObj || isNaN(dateObj.getTime())) return '';
        const d = dateObj.getDate().toString().padStart(2, '0');
        const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const y = dateObj.getFullYear();
        return `${d}/${m}/${y}`;
    };

    // [STEP 1] Define Core Keys
    const CORE_KEYS = ['amount', 'rate', 'period', 'installment'];

    // DOM Elements Cache
    let formInputs = {};
    let inputGroups = {};
    let errorLabels = {};
    let dateInputs = {};

    // --- Initialization ---
    window.addEventListener('load', () => {
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

        // Safety Check
        if (!formInputs.amount) return;

        // 2. Initialize PWA & UI (Safe Call)
        if (typeof initPWA === 'function') initPWA();
        if (typeof initOfflineIndicator === 'function') initOfflineIndicator();
        if (typeof BackHandler !== 'undefined' && BackHandler.init) BackHandler.init();

        // 2.3 Prevent pinch-to-zoom (even if browser ignores viewport meta)
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());

        // 2.5 Set About modal version from centralized constant
        const versionDisplay = document.getElementById('app-version-display');
        if (versionDisplay) versionDisplay.textContent = 'Version ' + APP_VERSION;

        setTimeout(() => { document.body.classList.remove('preload'); }, 150);

        // 3. Load Preferences
        AppState.lang = localStorage.getItem('language') || (navigator.language.startsWith('ar') ? 'ar' : 'en');
        AppState.theme = localStorage.getItem('theme') || 'system';

        // 4. Set Initial Date if empty
        if (dateInputs.startNative && !dateInputs.startNative.value) {
            const today = new Date();
            dateInputs.startNative.valueAsDate = today;
            if (dateInputs.startDisplay) dateInputs.startDisplay.value = formatDate(today);

            // Also set first installment date: 5th of second month after booking date
            if (dateInputs.firstNative) {
                const firstInstDate = new Date(today.getFullYear(), today.getMonth() + 2, 5);
                const y = firstInstDate.getFullYear();
                const m = String(firstInstDate.getMonth() + 1).padStart(2, '0');
                const d = String(firstInstDate.getDate()).padStart(2, '0');
                dateInputs.firstNative.value = `${y}-${m}-${d}`;
                if (dateInputs.firstDisplay) dateInputs.firstDisplay.value = formatDate(firstInstDate);
            }
        }

        // 5. Initialize Theme & Lang
        if (typeof initTheme === 'function') initTheme(AppState.lastRes);
        if (typeof updateLangUI === 'function') updateLangUI(AppState.lang);

        // 6. INITIALIZE RADIO STATE
        const checkedRadio = document.querySelector('input[name="calc-target"]:checked');
        if (checkedRadio) {
            AppState.activeKey = checkedRadio.value;
        }
        if (typeof updateInputState === 'function') updateInputState(inputGroups, formInputs, errorLabels, AppState.activeKey, AppState.lang);

        updateThemeMenuState(AppState.theme);

        // 7. Setup Event Listeners
        setupEventListeners();
        setupMobileKeyboard();

        // 8. Initialize Gestures
        if (typeof initSwipeToClose === 'function') initSwipeToClose();

        // 9. Handle Shared Data
        handleSharedData();

        document.body.classList.add('lang-ready');

        // 10. Show first-time tutorial tooltip (one-time only)
        showFirstTimeTutorial(AppState.lang);
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
        if (!std || !adv) return;

        if (isAdvanced) {
            std.classList.remove('max-h-24', 'opacity-100');
            std.classList.add('max-h-0', 'opacity-0', 'pointer-events-none');
            adv.classList.remove('max-h-0', 'opacity-0', 'pointer-events-none');
            adv.classList.add('max-h-96', 'opacity-100');
        } else {
            std.classList.add('max-h-24', 'opacity-100');
            std.classList.remove('max-h-0', 'opacity-0', 'pointer-events-none');
            adv.classList.add('max-h-0', 'opacity-0', 'pointer-events-none');
            adv.classList.remove('max-h-96', 'opacity-100');
        }
    }

    function showFirstTimeTutorial(lang) {
        // Versioned key - increment version to show tooltip again to all users
        const TOOLTIP_VERSION = 'v1';
        const TOOLTIP_KEY = `tutorialTooltipShown_${TOOLTIP_VERSION}`;

        // Check if already shown for this version
        if (localStorage.getItem(TOOLTIP_KEY)) return;

        // Wait a bit for the page to settle
        setTimeout(() => {
            // Find the first radio button (Loan Amount)
            const firstRadio = document.querySelector('input[name="calc-target"][value="amount"]');
            if (!firstRadio) return;

            const radioContainer = firstRadio.closest('.input-group');
            if (!radioContainer) return;

            // Create tooltip element
            const tooltip = document.createElement('div');
            tooltip.className = 'tutorial-tooltip pulse from-radio';
            // Safe DOM creation to prevent XSS (replacing innerHTML)
            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = 'display: flex; align-items: flex-start; gap: 8px;';

            // SVG is static and safe
            const successIcon = document.createElement('div');
            successIcon.innerHTML = `<svg class="flex-shrink-0" style="width: 18px; height: 18px; margin-top: 2px;" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
            contentDiv.appendChild(successIcon.firstElementChild);

            const textSpan = document.createElement('span');
            textSpan.textContent = t(AppState.lang, 'tutorialTooltip'); // Safe text insertion
            contentDiv.appendChild(textSpan);

            const dismissBtn = document.createElement('button');
            dismissBtn.type = 'button';
            dismissBtn.className = 'tutorial-tooltip-btn';
            dismissBtn.id = 'dismiss-tutorial';
            dismissBtn.textContent = t(AppState.lang, 'gotIt'); // Safe text insertion

            tooltip.appendChild(contentDiv);
            tooltip.appendChild(dismissBtn);

            // Position it next to the radio button
            const isRTL = document.documentElement.dir === 'rtl';
            radioContainer.style.position = 'relative';
            radioContainer.style.overflow = 'visible';
            tooltip.style.top = '50%';
            tooltip.style.transform = 'translateY(-50%)';

            if (isRTL) {
                // In RTL, radio button is on the RIGHT
                // Tooltip appears to the LEFT of the radio, with arrow pointing RIGHT
                tooltip.style.right = '48px';
                tooltip.style.left = 'auto';
                tooltip.classList.add('rtl-arrow');
            } else {
                // In LTR, radio button is on the LEFT, so position tooltip to come from left
                tooltip.style.left = '48px';
            }

            radioContainer.appendChild(tooltip);

            // Dismiss handler
            const dismissTooltip = () => {
                tooltip.style.opacity = '0';
                // Reverse the horizontal slide-in: collapse back toward the radio button
                const dismissX = isRTL ? '15px' : '-15px';
                tooltip.style.transform = `translateY(-50%) translateX(${dismissX}) scale(0.9)`;
                tooltip.style.transition = 'all 0.3s ease';
                setTimeout(() => tooltip.remove(), 300);
                localStorage.setItem(TOOLTIP_KEY, 'true');
                if (typeof haptic !== 'undefined') haptic('light');
            };

            if (dismissBtn) {
                dismissBtn.addEventListener('click', dismissTooltip);
            }

            // Also dismiss on any radio button click
            document.querySelectorAll('input[name="calc-target"]').forEach(radio => {
                radio.addEventListener('change', dismissTooltip, { once: true });
            });

            // Auto-dismiss after 10 seconds
            setTimeout(() => {
                if (tooltip.parentElement) dismissTooltip();
            }, 10000);
        }, 800);
    }

    // --- Menu Helpers ---
    function openMenu(menu) {
        if (!menu) return;
        menu.classList.remove(...MENU_CLASSES.HIDDEN);
        menu.classList.add(...MENU_CLASSES.VISIBLE);
    }

    function closeMenu(menu) {
        if (!menu) return;
        menu.classList.remove(...MENU_CLASSES.VISIBLE);
        menu.classList.add(...MENU_CLASSES.HIDDEN);
    }

    function isMenuOpen(menu) {
        return menu && !menu.classList.contains('invisible');
    }

    function animateToggleBounce(toggleElement) {
        const knob = toggleElement?.parentElement?.querySelector('div');
        if (knob) {
            knob.classList.remove('animate-toggle-bounce');
            void knob.offsetWidth; // Force reflow
            knob.classList.add('animate-toggle-bounce');
        }
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {

        // 1. Theme Menu Logic
        const themeBtn = document.getElementById('theme-toggle');
        const themeMenu = document.getElementById('theme-menu');
        const themeOptions = document.querySelectorAll('.theme-option');

        if (themeBtn && themeMenu) {
            themeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hideToast();
                if (typeof haptic !== 'undefined') haptic('light');

                // Close lang menu if open
                const langMenu = document.getElementById('lang-menu');
                if (isMenuOpen(langMenu)) closeMenu(langMenu);

                if (!isMenuOpen(themeMenu)) {
                    openMenu(themeMenu);
                    updateThemeMenuState(AppState.theme);
                } else {
                    closeMenu(themeMenu);
                }
            });

            document.addEventListener('click', (e) => {
                if (isMenuOpen(themeMenu) && !themeBtn.contains(e.target) && !themeMenu.contains(e.target)) {
                    closeMenu(themeMenu);
                }
            });
        }



        themeOptions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newTheme = btn.dataset.themeValue;
                if (newTheme === AppState.theme) {
                    closeMenu(themeMenu);
                    return;
                }

                const performUpdate = () => {
                    AppState.theme = newTheme;
                    localStorage.setItem('theme', AppState.theme);
                    if (typeof applyTheme === 'function') applyTheme(AppState.theme, AppState.lastRes);
                    updateThemeMenuState(AppState.theme);
                    closeMenu(themeMenu);
                    if (typeof haptic !== 'undefined') haptic('medium');

                    const label = t(AppState.lang, AppState.theme === 'system' ? 'themeSystem' : (AppState.theme === 'dark' ? 'themeDark' : 'themeLight'));
                    showToast(label);
                };

                const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isCurrentDark = AppState.theme === 'dark' || (AppState.theme === 'system' && sysDark);
                const isNewDark = newTheme === 'dark' || (newTheme === 'system' && sysDark);
                const isReverse = isCurrentDark && !isNewDark;

                // Use View Transitions API when available (modern browsers), fall back to crossfade (iOS Safari)
                if (!document.startViewTransition) {
                    // iOS-style gradual crossfade without blink
                    const overlay = document.createElement('div');
                    const oldBg = isCurrentDark ? '#020617' : '#f9fafb';
                    overlay.style.cssText = `
                        position: fixed;
                        inset: 0;
                        z-index: ${Z_INDEX.OVERLAY};
                        pointer-events: none;
                        background: ${oldBg};
                        opacity: 1;
                        transition: opacity 0.5s ease-in-out;
                    `;

                    // Step 1: Add overlay FIRST
                    document.body.appendChild(overlay);
                    void overlay.offsetHeight; // Force paint

                    // Step 2: Disable all CSS transitions temporarily
                    document.body.classList.add('preload');

                    // Step 3: Change theme instantly (no visible transition due to preload)
                    performUpdate();

                    // Step 4: Force repaint of new theme
                    void document.body.offsetHeight;

                    // Step 5: Re-enable transitions
                    document.body.classList.remove('preload');

                    // Step 6: Fade out overlay to reveal new theme
                    requestAnimationFrame(() => {
                        overlay.style.opacity = '0';
                        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
                    });
                } else {
                    try {
                        // Use theme toggle button center as origin for consistent animation
                        const themeBtn = document.getElementById('theme-toggle');
                        const rect = themeBtn.getBoundingClientRect();
                        const x = rect.left + rect.width / 2;
                        const y = rect.top + rect.height / 2;
                        const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

                        const transition = document.startViewTransition(() => performUpdate());

                        transition.ready.then(() => {
                            const keyframes = isReverse
                                ? [{ clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }, { clipPath: `circle(0px at ${x}px ${y}px)` }]
                                : [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }];

                            document.documentElement.animate(keyframes, {
                                duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards',
                                pseudoElement: isReverse ? '::view-transition-old(root)' : '::view-transition-new(root)'
                            });
                        });

                        transition.finished.then(() => {
                            document.documentElement.classList.remove('reverse-transition');
                        });

                        if (isReverse) document.documentElement.classList.add('reverse-transition');

                    } catch (err) {
                        performUpdate();
                    }
                }
            });
        });

        // 2. Language Menu Logic
        const langBtn = document.getElementById('lang-toggle');
        const langMenu = document.getElementById('lang-menu');
        const langOptions = document.querySelectorAll('.lang-option');

        if (langBtn && langMenu) {
            langBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hideToast();
                if (typeof haptic !== 'undefined') haptic('light');

                // Close theme menu if open
                if (isMenuOpen(themeMenu)) closeMenu(themeMenu);

                if (!isMenuOpen(langMenu)) {
                    openMenu(langMenu);
                    updateLangMenuState(AppState.lang);
                } else {
                    closeMenu(langMenu);
                }
            });

            document.addEventListener('click', (e) => {
                if (isMenuOpen(langMenu) && !langBtn.contains(e.target) && !langMenu.contains(e.target)) {
                    closeMenu(langMenu);
                }
            });
        }

        langOptions.forEach(btn => {
            btn.addEventListener('click', () => {
                const newLang = btn.dataset.langValue;
                if (newLang === AppState.lang) {
                    closeMenu(langMenu);
                    return;
                }
                if (typeof haptic !== 'undefined') haptic('medium');
                setLang(newLang);
                updateLangMenuState(newLang);
                closeMenu(langMenu);
            });
        });

        // 3. Inputs Logic & Radio Buttons

        // --- RADIO BUTTON LISTENER ---
        document.querySelectorAll('input[name="calc-target"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                AppState.activeKey = e.target.value;
                // Clear errors on mode switch
                Object.values(errorLabels).forEach(el => el.classList.add('hidden'));
                if (typeof updateInputState === 'function') updateInputState(inputGroups, formInputs, errorLabels, AppState.activeKey, AppState.lang);
                if (typeof haptic !== 'undefined') haptic('light');
            });
        });

        Object.keys(formInputs).forEach(key => {
            const input = formInputs[key];
            if (!input) return;

            input.addEventListener('input', () => {
                if (key === 'amount' || key === 'installment') {
                    if (typeof formatCurrencyInput === 'function') formatCurrencyInput(input);
                } else if (key === 'period') {
                    if (typeof validatePeriodInput === 'function') validatePeriodInput(input);
                } else if (key === 'rate') {
                    if (typeof validateRateInput === 'function') validateRateInput(input);
                }
                validateInput(key);
            });

            input.addEventListener('blur', () => {
                if (input.value.trim() !== '') {
                    validateInput(key);
                    if (key === 'rate' && typeof formatRateInputBlur === 'function') formatRateInputBlur(input);
                }
            });
        });

        // TD Rate - validation for percentage input (numbers only, max 100%)
        const tdRateInput = document.getElementById('td-rate');
        const tdRateGroup = document.getElementById('group-td-rate');
        const tdRateError = document.getElementById('error-td-rate');
        if (tdRateInput && tdRateGroup) {
            tdRateInput.addEventListener('input', () => {
                if (typeof validateRateInput === 'function') validateRateInput(tdRateInput);
                const val = parseFloat(tdRateInput.value);
                if (!isNaN(val) && val > 100) {
                    tdRateGroup.classList.add('error-state');
                    if (tdRateError) tdRateError.classList.remove('hidden');
                } else {
                    tdRateGroup.classList.remove('error-state');
                    if (tdRateError) tdRateError.classList.add('hidden');
                }
            });
            tdRateInput.addEventListener('blur', () => { if (typeof formatRateInputBlur === 'function') formatRateInputBlur(tdRateInput); });
        }

        // TD Amount
        const tdAmount = document.getElementById('td-amount');
        if (tdAmount) tdAmount.addEventListener('input', (e) => { if (typeof formatCurrencyInput === 'function') formatCurrencyInput(e.target); });

        // Admin Fees
        const adminInput = document.getElementById('admin-fees');
        if (adminInput) {
            adminInput.addEventListener('input', () => {
                if (typeof validateRateInput === 'function') validateRateInput(adminInput);
                const val = parseFloat(adminInput.value);
                if (!isNaN(val) && val > 100) adminInput.parentElement.classList.add('error-state');
                else adminInput.parentElement.classList.remove('error-state');
            });
            adminInput.addEventListener('blur', () => { if (typeof formatRateInputBlur === 'function') formatRateInputBlur(adminInput); });
        }

        // Stamp Rate - validation for percentage input
        const stampRateInput = document.getElementById('stamp-rate');
        if (stampRateInput) {
            stampRateInput.addEventListener('input', () => {
                if (typeof validateRateInput === 'function') validateRateInput(stampRateInput);
                const val = parseFloat(stampRateInput.value);
                if (!isNaN(val) && val > 100) stampRateInput.parentElement.classList.add('error-state');
                else stampRateInput.parentElement.classList.remove('error-state');
            });
            stampRateInput.addEventListener('blur', () => { if (typeof formatRateInputBlur === 'function') formatRateInputBlur(stampRateInput); });
        }

        // Dates - Initialize using new best-practice date input system
        if (dateInputs.startDisplay && dateInputs.startNative) {
            if (typeof initDateInput === 'function') {
                initDateInput(dateInputs.startDisplay, dateInputs.startNative);
            }

            // Additional handler for auto-calculating first payment date
            dateInputs.startNative.addEventListener('change', (e) => {
                if (e.target.value && dateInputs.firstNative) {
                    const parts = e.target.value.split('-');
                    const date = new Date(parts[0], parts[1] - 1, parts[2]);

                    // Always auto-fill: 5th of second month after booking date
                    const firstInstDate = new Date(date.getFullYear(), date.getMonth() + 2, 5);
                    const y = firstInstDate.getFullYear();
                    const m = String(firstInstDate.getMonth() + 1).padStart(2, '0');
                    const d = String(firstInstDate.getDate()).padStart(2, '0');
                    dateInputs.firstNative.value = `${y}-${m}-${d}`;
                    dateInputs.firstNative.dispatchEvent(new Event('change'));
                }
            });

            // Date picker button click handler
            const startPickerBtn = document.getElementById('start-date-picker-btn');
            if (startPickerBtn) {
                startPickerBtn.addEventListener('click', () => {
                    if (typeof haptic !== 'undefined') haptic('light');
                    if (typeof openDatePicker === 'function') {
                        openDatePicker(dateInputs.startDisplay, AppState.lang, (selectedDate) => {
                            if (selectedDate) {
                                dateInputs.startDisplay.value = formatDate(selectedDate);
                                // Sync to native input for form compatibility
                                const y = selectedDate.getFullYear();
                                const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                const d = String(selectedDate.getDate()).padStart(2, '0');
                                dateInputs.startNative.value = `${y}-${m}-${d}`;
                                dateInputs.startNative.dispatchEvent(new Event('change'));
                            }
                        });
                    } else {
                        dateInputs.startNative.showPicker();
                    }
                });
            }
        }

        if (dateInputs.firstDisplay && dateInputs.firstNative) {
            if (typeof initDateInput === 'function') {
                initDateInput(dateInputs.firstDisplay, dateInputs.firstNative);
            }

            // Date picker button click handler
            const firstPickerBtn = document.getElementById('first-inst-date-picker-btn');
            if (firstPickerBtn) {
                firstPickerBtn.addEventListener('click', () => {
                    if (typeof haptic !== 'undefined') haptic('light');
                    if (typeof openDatePicker === 'function') {
                        openDatePicker(dateInputs.firstDisplay, AppState.lang, (selectedDate) => {
                            if (selectedDate) {
                                dateInputs.firstDisplay.value = formatDate(selectedDate);
                                const y = selectedDate.getFullYear();
                                const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                const d = String(selectedDate.getDate()).padStart(2, '0');
                                dateInputs.firstNative.value = `${y}-${m}-${d}`;
                                dateInputs.firstNative.dispatchEvent(new Event('change'));
                            }
                        });
                    } else {
                        dateInputs.firstNative.showPicker();
                    }
                });
            }
        }

        // Toggles
        const advToggle = document.getElementById('advanced-toggle');
        if (advToggle) {
            advToggle.addEventListener('change', (e) => {
                const advancedSection = document.getElementById('advanced-section');
                const dateLabel = document.getElementById('date-label');
                if (typeof haptic !== 'undefined') haptic('medium');

                // Visual toggle bounce animation
                animateToggleBounce(e.target);

                if (e.target.checked) {
                    // Update label immediately when opening
                    if (dateLabel) dateLabel.textContent = t(AppState.lang, "bookingDateLabel");
                    advancedSection.classList.remove('max-h-0', 'opacity-0');
                    advancedSection.style.maxHeight = '1200px';
                    advancedSection.classList.add('opacity-100');
                    if (typeof updateLangUI === 'function') updateLangUI(AppState.lang);
                } else {
                    // Collapse - no need to change label since it's hidden
                    advancedSection.classList.add('max-h-0', 'opacity-0');
                    advancedSection.style.maxHeight = '0';
                    advancedSection.classList.remove('opacity-100');
                    if (typeof updateLangUI === 'function') updateLangUI(AppState.lang);
                }

                updateSummaryView(e.target.checked);
                if (coreInputsFilled()) appCalculate();
            });
        }

        const ssToggle = document.getElementById('self-sufficient-toggle');
        if (ssToggle) {
            const ssSection = document.getElementById('self-sufficient-section');
            ssToggle.addEventListener('change', (e) => {
                if (typeof haptic !== 'undefined') haptic('medium');

                // Visual toggle bounce animation
                animateToggleBounce(e.target);

                if (e.target.checked) {
                    ssSection.classList.remove('max-h-0', 'opacity-0');
                    ssSection.style.maxHeight = '500px';
                    ssSection.classList.add('opacity-100');

                } else {
                    ssSection.classList.add('max-h-0', 'opacity-0');
                    ssSection.style.maxHeight = '0';
                    ssSection.classList.remove('opacity-100');
                }
            });
        }

        // Self-Sufficient Button
        const ssCalcBtn = document.getElementById('self-sufficient-calc-btn');
        if (ssCalcBtn) {
            ssCalcBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                updateSelfSufficient(true);
            });
        }

        // Early Settlement Toggle
        const earlySettlementToggle = document.getElementById('early-settlement-toggle');
        const earlySettlementSection = document.getElementById('early-settlement-section');
        const settlementDateDisplay = document.getElementById('settlement-date-display');
        const settlementDateNative = document.getElementById('settlement-date-native');
        const settlementFeeInput = document.getElementById('early-settlement-fee');
        const settlementDatePickerBtn = document.getElementById('settlement-date-picker-btn');

        if (earlySettlementToggle && earlySettlementSection) {
            earlySettlementToggle.addEventListener('change', (e) => {
                if (typeof haptic !== 'undefined') haptic('medium');

                // Visual toggle bounce animation
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
                        if (settlementDateDisplay) settlementDateDisplay.value = formatDate(new Date());
                    }


                } else {
                    earlySettlementSection.classList.add('max-h-0', 'opacity-0');
                    earlySettlementSection.style.maxHeight = '0';
                    earlySettlementSection.classList.remove('opacity-100');
                }
            });
        }

        // Initialize settlement date input
        if (settlementDateDisplay && settlementDateNative) {
            if (typeof initDateInput === 'function') {
                initDateInput(settlementDateDisplay, settlementDateNative);
            }

            // Update calculation when date changes - DISABLED for manual button
            // settlementDateNative.addEventListener('change', () => {
            //     if (earlySettlementToggle?.checked) updateEarlySettlement();
            // });

            // Date picker button
            if (settlementDatePickerBtn) {
                settlementDatePickerBtn.addEventListener('click', () => {
                    if (typeof haptic !== 'undefined') haptic('light');
                    if (typeof openDatePicker === 'function') {
                        openDatePicker(settlementDateDisplay, AppState.lang, (selectedDate) => {
                            if (selectedDate) {
                                settlementDateDisplay.value = formatDate(selectedDate);
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

        // Settlement fee input handler - with max 100% validation
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

        // Main Buttons
        const calcBtn = document.getElementById('calculate-button');
        if (calcBtn) calcBtn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('light');
            appCalculate();
        });

        const resetBtn = document.getElementById('reset-button');
        if (resetBtn) resetBtn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('heavy');
            resetApp();
        });

        // Schedule & Export
        const schedBtn = document.getElementById('schedule-button');
        if (schedBtn) schedBtn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('light');
            const isAdv = document.getElementById('advanced-toggle')?.checked;
            const schedCont = document.getElementById('schedule-container');
            if (schedCont.classList.contains('hidden')) {
                if (typeof showScheduleUI === 'function') showScheduleUI(AppState.schedule, AppState.lang, true, isAdv);
            } else {
                if (typeof closeScheduleUI === 'function') closeScheduleUI();
            }
        });

        const closeSchedBtn = document.getElementById('close-schedule-btn');
        if (closeSchedBtn) closeSchedBtn.addEventListener('click', () => { if (typeof haptic !== 'undefined') haptic('light'); if (typeof closeScheduleUI === 'function') closeScheduleUI(); });

        const pdfBtn = document.getElementById('export-pdf-button');
        if (pdfBtn) pdfBtn.addEventListener('click', () => { if (typeof haptic !== 'undefined') haptic('medium'); printReport(); });

        const xlsxBtn = document.getElementById('export-xlsx-button');
        if (xlsxBtn) xlsxBtn.addEventListener('click', () => { if (typeof haptic !== 'undefined') haptic('medium'); exportExcel(); });

        // Modals
        setupModalListeners();

        // Updates
        const updateBtn = document.getElementById('force-update-btn');
        if (updateBtn) updateBtn.addEventListener('click', () => { if (typeof haptic !== 'undefined') haptic('light'); checkUpdates(); });

        // Install
        setupInstallListeners();

        // Keyboard
        document.addEventListener('keydown', handleKeyboard);

        // Copy Summary Listener
        const copySummaryBtn = document.getElementById('copy-summary-btn');
        if (copySummaryBtn) {
            copySummaryBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                if (!AppState.lastRes.P) {
                    showToast("No calculation to share", "error");
                    return;
                }

                const res = AppState.lastRes;
                const periodUnit = AppState.lang === 'ar' ? ' شهر' : ' Months';

                let text = `*${t(AppState.lang, 'appTitle')} - ${t(AppState.lang, 'summaryTitle')}*\n`;
                text += `-------------------\n`;
                text += `${t(AppState.lang, 'loanAmountLabel')}: ${displayFmt(res.P)}\n`;
                text += `${t(AppState.lang, 'interestRateLabel')}: ${res.R.toFixed(2)}%\n`;
                text += `${t(AppState.lang, 'loanPeriodLabel')}: ${res.N}${periodUnit}\n`;

                const isAdvanced = document.getElementById('advanced-toggle').checked;
                if (isAdvanced) {
                    const firstDate = dateInputs.firstNative.value ? formatDate(new Date(dateInputs.firstNative.value)) : '-';
                    const adminVal = parseFloat(document.getElementById('admin-fees').value) || 0;
                    const fees = (res.P * adminVal) / 100;
                    const netLoan = res.P - fees;
                    const m1_Payment = parseFloat(document.getElementById('summary-first-inst').textContent.replace(/,/g, '')) || 0;

                    text += `${t(AppState.lang, 'firstInstAmountLabel')}: ${displayFmt(m1_Payment)} (${firstDate})\n`;
                    text += `${t(AppState.lang, 'regularInstLabel')}: ${displayFmt(res.M)}\n`;
                    text += `${t(AppState.lang, 'adminFeesLabel')}: ${displayFmt(fees)}\n`;
                    text += `${t(AppState.lang, 'netLoanLabel')}: ${displayFmt(netLoan)}\n`;
                } else {
                    text += `${t(AppState.lang, 'monthlyInstallmentLabel')}: ${displayFmt(res.M)}\n`;
                }

                text += `-------------------\n`;
                text += `${t(AppState.lang, 'totalInterestLabel')}: ${displayFmt(res.TI)}\n`;
                text += `${t(AppState.lang, 'totalSumLabel')}: ${displayFmt(res.P + res.TI)}\n`;
                text += `${t(AppState.lang, 'flatRateLabel')}: ${res.FR}%`;

                if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
                    navigator.share({ title: t(AppState.lang, 'summaryTitle'), text: text }).catch(console.error);
                } else {
                    navigator.clipboard.writeText(text).then(() => { showToast(t(AppState.lang, 'toastSummaryCopied')); }).catch(() => showToast("Failed to copy", "error"));
                }
            });
        }
    }

    // --- Core Logic Wrappers ---

    function setLang(l) {
        AppState.lang = l;
        localStorage.setItem('language', l);
        if (typeof updateLangUI === 'function') updateLangUI(l);
        if (typeof haptic !== 'undefined') haptic('medium');
        Object.keys(formInputs).forEach(key => validateInput(key));

        // Update tutorial tooltip if visible (translate and reposition)
        const tutorialTooltip = document.querySelector('.tutorial-tooltip');
        if (tutorialTooltip) {
            const textSpan = tutorialTooltip.querySelector('span');
            const btnEl = tutorialTooltip.querySelector('.tutorial-tooltip-btn');
            if (textSpan) textSpan.textContent = t(l, 'tutorialTooltip');
            if (btnEl) btnEl.textContent = t(l, 'gotIt');

            // Update direction/position
            const isRTL = l === 'ar';
            if (isRTL) {
                tutorialTooltip.style.right = '48px';
                tutorialTooltip.style.left = 'auto';
                tutorialTooltip.classList.add('rtl-arrow');
            } else {
                tutorialTooltip.style.left = '48px';
                tutorialTooltip.style.right = 'auto';
                tutorialTooltip.classList.remove('rtl-arrow');
            }
        }

        // REFRESH DYNAMIC VALUES
        if (AppState.lastRes.P) {
            const periodUnit = AppState.lang === 'ar' ? ' شهر' : ' Months';
            document.getElementById('summary-period').textContent = AppState.lastRes.N + periodUnit;

            const isAdvancedMode = document.getElementById('advanced-toggle')?.checked || false;
            if (typeof showScheduleUI === 'function') showScheduleUI(AppState.schedule, AppState.lang, false, isAdvancedMode);
            if (typeof drawChart === 'function') drawChart(AppState.lastRes.P, AppState.lastRes.TI, AppState.lang);
        }
    }

    function validateInput(key) {
        if (key === AppState.activeKey) return true;
        if (!formInputs[key]) return true;

        let valStr = formInputs[key].value;
        let val = safeParseFloat(valStr);

        let errMsg = "Invalid value";
        let isValid = true;

        if (isNaN(val) || val < 0) isValid = false;

        if (key === 'amount') {
            if (valStr.includes('.') || (val % 1 !== 0)) {
                isValid = false;
                errMsg = AppState.lang === 'ar' ? 'أرقام صحيحة فقط' : 'Whole numbers only';
            }
            // Max limit to prevent overflow
            if (val > 999999999999) {
                isValid = false;
                errMsg = AppState.lang === 'ar' ? 'القيمة كبيرة جداً' : 'Value too large';
            }
        } else if (key === 'installment') {
            // Installments can have decimals (cents), but check max
            if (val > 999999999) {
                isValid = false;
                errMsg = AppState.lang === 'ar' ? 'القيمة كبيرة جداً' : 'Value too large';
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

        if (inputGroups[key] && errorLabels[key]) {
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
                if (check) check.classList.remove('hidden');
            } else {
                btn.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20', 'text-indigo-700', 'dark:text-indigo-300');
                if (check) check.classList.add('hidden');
            }
        });
    }

    function updateLangMenuState(activeLang) {
        const langOptions = document.querySelectorAll('.lang-option');
        langOptions.forEach(btn => {
            const val = btn.dataset.langValue;
            const check = btn.querySelector('.check-icon');
            if (val === activeLang) {
                btn.classList.add('bg-indigo-50', 'dark:bg-indigo-900/20', 'text-indigo-700', 'dark:text-indigo-300');
                if (check) check.classList.remove('hidden');
            } else {
                btn.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20', 'text-indigo-700', 'dark:text-indigo-300');
                if (check) check.classList.add('hidden');
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
            showToast(t(AppState.lang, 'errorCheckInputs'), 'error');
            if (typeof haptic !== 'undefined') haptic('error');

            // Visual shake animation for inputs with errors
            Object.keys(inputGroups).forEach(key => {
                if (inputGroups[key].classList.contains('error-state')) {
                    inputGroups[key].classList.remove('animate-shake');
                    void inputGroups[key].offsetWidth; // Force reflow
                    inputGroups[key].classList.add('animate-shake');
                }
            });
            updateSubsidiaryErrors();
            return;
        }

        if (typeof calculateLoan !== 'function' || typeof generateSchedule !== 'function') {
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

            if (AppState.activeKey === 'period') formInputs.period.value = N;
            else if (AppState.activeKey === 'installment') formInputs.installment.value = displayFmt(M);
            else if (AppState.activeKey === 'rate') formInputs.rate.value = R.toFixed(2);
            else if (AppState.activeKey === 'amount') formInputs.amount.value = displayFmt(P);

            let bookingDate = new Date();
            if (dateInputs.startNative.value) {
                const parts = dateInputs.startNative.value.split('-');
                bookingDate = new Date(parts[0], parts[1] - 1, parts[2]);
            }

            let m1_Date;
            if (isAdvanced && dateInputs.firstNative.value) {
                const parts = dateInputs.firstNative.value.split('-');
                m1_Date = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                m1_Date = new Date(bookingDate);
                m1_Date.setMonth(m1_Date.getMonth() + 1);
            }

            // Get stamp rate if in advanced mode
            const stampRateInput = document.getElementById('stamp-rate');
            const stampRate = isAdvanced && stampRateInput ? (parseFloat(stampRateInput.value) || 0) : 0;

            const schedResult = generateSchedule({ P, R, N, M }, { bookingDate, m1_Date, isAdvanced }, stampRate);

            AppState.schedule = schedResult.schedule;
            const totalActualInterest = schedResult.totalActualInterest;
            const totalStamp = schedResult.totalStamp || 0;
            const finalTotalPayment = P + totalActualInterest;
            const finalFlatRate = (N > 0 && P > 0) ? ((totalActualInterest / P) / (N / 12) * 100).toFixed(2) : '0';

            // SAVED m1_Payment HERE
            AppState.lastRes = {
                P, R, N, M,
                FR: finalFlatRate,
                TI: totalActualInterest,
                startDate: dateInputs.startNative.value,
                m1_Payment: schedResult.m1_Payment,
                totalStamp: totalStamp
            };

            document.getElementById('summary-rate').textContent = R.toFixed(2) + '%';
            document.getElementById('summary-principal').textContent = displayFmt(P);
            document.getElementById('total-interest').textContent = displayFmt(totalActualInterest);
            document.getElementById('total-sum').textContent = displayFmt(finalTotalPayment);

            document.querySelectorAll('.flat-rate-display').forEach(el => el.textContent = finalFlatRate + '%');
            document.getElementById('chart-empty-state').classList.add('hidden');

            const periodUnit = AppState.lang === 'ar' ? ' شهر' : ' Months';
            document.getElementById('summary-period').textContent = N + periodUnit;

            if (isAdvanced) {
                document.getElementById('summary-first-inst').textContent = displayFmt(schedResult.m1_Payment);

                if (dateInputs.firstNative.value) {
                    const d = new Date(dateInputs.firstNative.value);
                    document.getElementById('summary-first-date').textContent = formatDate(d);
                } else {
                    document.getElementById('summary-first-date').textContent = '';
                }

                const regInstEl = document.getElementById('summary-regular-inst');
                regInstEl.textContent = displayFmt(M);
                regInstEl.className = "text-lg font-bold text-white select-text";

                const adminFeesVal = parseFloat(document.getElementById('admin-fees').value) || 0;
                const fees = (P * adminFeesVal) / 100;
                document.getElementById('summary-admin-fees').textContent = displayFmt(fees);
                document.getElementById('summary-net-loan').textContent = displayFmt(P - fees);

                // Update admin fees label to show percentage
                const adminFeesLabel = document.getElementById('summary-admin-fees-label');
                if (adminFeesLabel) {
                    const baseLabel = t(AppState.lang, 'adminFeesLabel').replace(/ \(\d+\.?\d*%\)$/, '').replace(' (%)', '');
                    adminFeesLabel.textContent = adminFeesVal > 0 ? `${baseLabel} (${adminFeesVal}%)` : baseLabel;
                }

                // Update total stamp display
                const totalStampEl = document.getElementById('summary-total-stamp');
                if (totalStampEl) {
                    totalStampEl.textContent = totalStamp > 0 ? displayFmt(totalStamp) : '-';
                }
            } else {
                document.getElementById('summary-std-inst').textContent = displayFmt(M);
            }

            updateSelfSufficient(false);

            // Generate and display Calculation Fingerprint
            if (typeof generateFingerprint === 'function') {
                const fingerprintInputs = {
                    amount: P,
                    rate: R,
                    period: N,
                    // Use native ISO dates for stable canonicalization (avoid locale/format issues)
                    startDate: dateInputs.startNative?.value || '',
                    // Include other cost factors for audit
                    adminFees: parseFloat(document.getElementById('admin-fees').value) || 0,
                    stampRate: parseFloat(document.getElementById('stamp-rate').value) || 0,
                    firstInstDate: dateInputs.firstNative?.value || ''
                };
                const fingerprint = generateFingerprint(fingerprintInputs, APP_VERSION);
                const fingerprintEl = document.getElementById('fingerprint-value');
                const fingerprintContainer = document.getElementById('calculation-fingerprint');
                if (fingerprintEl) fingerprintEl.textContent = fingerprint;
                if (fingerprintContainer) fingerprintContainer.classList.remove('hidden');
            }

            if (typeof drawChart === 'function') drawChart(P, totalActualInterest, AppState.lang);


            document.getElementById('schedule-button').disabled = false;
            document.getElementById('export-pdf-button').disabled = false;
            document.getElementById('export-xlsx-button').disabled = false;
            document.getElementById('save-button').disabled = false;

            if (typeof haptic !== 'undefined') haptic('success');
            showToast(t(AppState.lang, 'calcSuccess'), 'success');

            // Visual success animation - pulse the calculate button
            const calcBtn = document.getElementById('calculate-button');
            if (calcBtn) {
                calcBtn.classList.remove('animate-button-success');
                void calcBtn.offsetWidth; // Force reflow
                calcBtn.classList.add('animate-button-success');
            }

            // Visual success animation - glow the result field
            const resultGroup = inputGroups[AppState.activeKey];
            if (resultGroup) {
                resultGroup.classList.remove('animate-result-glow');
                void resultGroup.offsetWidth; // Force reflow
                resultGroup.classList.add('animate-result-glow');
            }

            // Visual success animation - pulse the summary section
            const summarySection = document.getElementById('summary-section');
            if (summarySection) {
                summarySection.classList.remove('animate-success-pulse');
                void summarySection.offsetWidth; // Force reflow
                summarySection.classList.add('animate-success-pulse');
            }

            if (typeof showScheduleUI === 'function') showScheduleUI(AppState.schedule, AppState.lang, false, isAdvanced);

            // Reset subsidiary calculators to ensure results are fresh
            const esResults = document.getElementById('settlement-results');
            if (esResults) {
                esResults.classList.add('opacity-0', 'max-h-0');
                esResults.classList.remove('opacity-100', 'max-h-96');
            }
            const ssResults = document.getElementById('self-sufficient-results');
            if (ssResults) {
                ssResults.classList.add('opacity-0', 'max-h-0');
                ssResults.classList.remove('opacity-100', 'max-h-96');
            }

            // Hide errors too
            const esError = document.getElementById('error-early-settlement');
            if (esError) esError.classList.add('hidden');
            const ssError = document.getElementById('error-self-sufficient');
            if (ssError) ssError.classList.add('hidden');
        } else {
            showToast(t(AppState.lang, 'errorCalculationFailed'), 'error');
            updateSubsidiaryErrors();
        }
    }

    // --- Early Settlement Calculator ---
    function updateEarlySettlement(showError = false) {
        const resultsPanel = document.getElementById('settlement-results');
        const settlementDateNative = document.getElementById('settlement-date-native');
        const settlementFeeInput = document.getElementById('early-settlement-fee');

        const errorEl = document.getElementById('error-early-settlement');

        if (!resultsPanel) return;

        if (showError && errorEl) errorEl.classList.add('hidden'); // Reset error state

        // 1. Check if we have a valid main loan calculation (schedule exists)
        if (!AppState.schedule || AppState.schedule.length === 0) {
            resultsPanel.classList.add('opacity-0', 'max-h-0');
            resultsPanel.classList.remove('opacity-100', 'max-h-96');
            if (errorEl && showError) {
                // Show specific 'Loan not calculated' error
                errorEl.textContent = t(AppState.lang, 'errorLoanNotCalculated');
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
                errorEl.textContent = t(AppState.lang, 'errorCheckInputs');
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
        const annualRate = parseFloat((formInputs.rate?.value || '0').replace(/,/g, '')) || 0;

        // Get stamp rate
        const stampRateInput = document.getElementById('stamp-rate');
        const stampRate = parseFloat((stampRateInput?.value || '0').replace(/,/g, '')) || 0;

        // Calculate
        if (typeof calculateEarlySettlement !== 'function') {
            console.error('calculateEarlySettlement not found');
            return;
        }

        const result = calculateEarlySettlement(AppState.schedule, settlementDate, feePercentage, annualRate, stampRate);

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
                lastPaidEl.textContent = `#${result.lastPaidInstallment} (${formatDate(result.lastPaidDate)})`;
            } else {
                lastPaidEl.textContent = '-';
            }
        }

        // Principal balance
        const principalEl = document.getElementById('settlement-principal');
        if (principalEl) {
            principalEl.textContent = displayFmt(result.principalBalance);
        }

        // Fee
        const feeEl = document.getElementById('settlement-fee');
        if (feeEl) {
            feeEl.textContent = displayFmt(result.fee);
        }

        // Accrued interest with days
        const daysEl = document.getElementById('settlement-days');
        if (daysEl) {
            daysEl.textContent = `(${result.daysElapsed} ${AppState.lang === 'ar' ? 'يوم' : 'days'})`;
        }

        const interestEl = document.getElementById('settlement-interest');
        if (interestEl) {
            interestEl.textContent = displayFmt(result.accruedInterest);
        }

        // Settlement stamp
        const stampEl = document.getElementById('settlement-stamp');
        const stampRow = document.getElementById('settlement-stamp-row');
        if (stampEl && stampRow) {
            if (result.settlementStamp > 0) {
                stampEl.textContent = displayFmt(result.settlementStamp);
                stampRow.classList.remove('hidden');
            } else {
                stampRow.classList.add('hidden');
            }
        }

        // Total
        const totalEl = document.getElementById('settlement-total');
        if (totalEl) {
            totalEl.textContent = displayFmt(result.totalSettlement);
        }
    }

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
                ssResults.classList.add('opacity-0', 'max-h-0');
                ssResults.classList.remove('opacity-100', 'max-h-96');
            }
            if (ssError) ssError.classList.remove('hidden');
        } else {
            if (ssError) ssError.classList.add('hidden');
        }
    }

    function updateSelfSufficient(showError = false) {
        if (!document.getElementById('self-sufficient-toggle').checked) return;

        const ssResults = document.getElementById('self-sufficient-results');
        const ssError = document.getElementById('error-self-sufficient');
        const tdRateInput = document.getElementById('td-rate');

        // Validation
        const tdR = safeParseFloat(tdRateInput.value);

        // 1. Check if main loan is calculated (M exists)
        const M = AppState.lastRes?.M;
        if (!M) {
            if (ssResults) {
                ssResults.classList.add('opacity-0', 'max-h-0');
                ssResults.classList.remove('opacity-100', 'max-h-96');
            }
            if (showError && ssError) {
                ssError.textContent = t(AppState.lang, 'errorLoanNotCalculated');
                ssError.classList.remove('hidden');
            }
            return;
        }

        // 2. Check local inputs
        if (tdRateInput.value === '' || tdR <= 0) {
            if (ssResults) {
                ssResults.classList.add('opacity-0', 'max-h-0');
                ssResults.classList.remove('opacity-100', 'max-h-96');
            }
            if (showError && ssError) {
                ssError.textContent = t(AppState.lang, 'errorCheckInputs');
                ssError.classList.remove('hidden');
            }
            return;
        }

        // If valid, show results and hide error (always update if valid)
        if (ssResults) {
            ssResults.classList.remove('opacity-0', 'max-h-0');
            ssResults.classList.add('opacity-100', 'max-h-96');
        }
        if (ssError) ssError.classList.add('hidden');

        document.getElementById('req-td-display').textContent = displayFmt(M / (tdR / 1200));

        const userTd = safeParseFloat(document.getElementById('td-amount').value);
        if (!isNaN(userTd) && userTd > 0) {
            const net = (userTd * (tdR / 1200)) - M;
            const el = document.getElementById('net-flow-display');
            el.textContent = displayFmt(net);
            el.className = `font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`;
        } else {
            // Reset net flow display if user TD is empty?
            document.getElementById('net-flow-display').textContent = '-';
            document.getElementById('net-flow-display').className = 'font-bold text-green-900 dark:text-white select-text';
        }
    }

    function resetApp() {
        Object.values(formInputs).forEach(i => i.value = '');
        document.getElementById('td-rate').value = '';
        document.getElementById('td-amount').value = '';

        dateInputs.startNative.valueAsDate = new Date();
        dateInputs.startNative.dispatchEvent(new Event('change'));

        document.getElementById('advanced-toggle').checked = false;
        document.getElementById('advanced-toggle').dispatchEvent(new Event('change'));

        updateSummaryView(false);

        document.getElementById('admin-fees').value = '';

        // Reset stamp rate
        const stampRateInput = document.getElementById('stamp-rate');
        if (stampRateInput) stampRateInput.value = '0.2';

        document.getElementById('self-sufficient-toggle').checked = false;
        document.getElementById('self-sufficient-toggle').dispatchEvent(new Event('change'));

        // Reset early settlement
        const earlySettlementToggle = document.getElementById('early-settlement-toggle');
        if (earlySettlementToggle) {
            earlySettlementToggle.checked = false;
            earlySettlementToggle.dispatchEvent(new Event('change'));
        }
        document.getElementById('early-settlement-fee').value = '';
        document.getElementById('settlement-results')?.classList.add('hidden');

        // RESET RADIO BUTTON STATE
        AppState.activeKey = 'installment';
        const defaultRadio = document.querySelector('input[name="calc-target"][value="installment"]');
        if (defaultRadio) defaultRadio.checked = true;
        if (typeof updateInputState === 'function') updateInputState(inputGroups, formInputs, errorLabels, AppState.activeKey, AppState.lang);

        ['summary-rate', 'summary-principal', 'total-interest', 'total-sum', 'summary-period', 'summary-first-date'].forEach(id => document.getElementById(id).textContent = '-');
        document.querySelectorAll('.flat-rate-display').forEach(el => el.textContent = '-');
        ['summary-first-inst', 'summary-regular-inst', 'summary-std-inst', 'summary-admin-fees', 'summary-net-loan', 'summary-total-stamp', 'req-td-display', 'net-flow-display'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '-';
        });

        Object.values(errorLabels).forEach(e => e.classList.add('hidden'));
        Object.values(inputGroups).forEach(g => g.classList.remove('error-state'));

        if (typeof chartInst !== 'undefined' && chartInst) { chartInst.destroy(); chartInst = null; }
        document.getElementById('chart-empty-state').classList.remove('hidden');
        if (typeof closeScheduleUI === 'function') closeScheduleUI();

        document.getElementById('schedule-button').disabled = true;
        document.getElementById('save-button').disabled = true;
        document.getElementById('export-pdf-button').disabled = true;
        document.getElementById('export-xlsx-button').disabled = true;

        // Reset Calculation Fingerprint
        const fingerprintContainer = document.getElementById('calculation-fingerprint');
        if (fingerprintContainer) fingerprintContainer.classList.add('hidden');
        const fingerprintEl = document.getElementById('fingerprint-value');
        if (fingerprintEl) fingerprintEl.textContent = '-';
    }

    // --- Modal Logic ---
    function setupModalListeners() {
        const historyModal = document.getElementById('history-modal');
        const historyBtn = document.getElementById('history-btn');
        const closeHistory = document.getElementById('close-history');
        const historyList = document.getElementById('history-list');

        if (historyBtn && historyModal) {
            historyBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                const history = JSON.parse(localStorage.getItem('loanHistory') || '[]');
                if (typeof renderHistoryList === 'function') renderHistoryList(history, AppState.lang);
                if (typeof toggleModal === 'function') toggleModal(historyModal);
            });
            closeHistory.addEventListener('click', () => { if (typeof haptic !== 'undefined') haptic('light'); if (typeof toggleModal === 'function') toggleModal(historyModal); });
            historyModal.addEventListener('click', (e) => {
                if ((e.target === historyModal || e.target.classList.contains('modal-overlay')) && typeof toggleModal === 'function') { if (typeof haptic !== 'undefined') haptic('light'); toggleModal(historyModal); }
            });

            if (historyList) {
                historyList.addEventListener('click', (e) => {
                    // Check if delete button was clicked
                    const deleteBtn = e.target.closest('.delete-btn');
                    if (deleteBtn) {
                        e.stopPropagation();
                        const card = deleteBtn.closest('.history-card');
                        const index = parseInt(deleteBtn.dataset.index);
                        if (isNaN(index) || !card) return;
                        if (typeof haptic !== 'undefined') haptic('light');

                        // Hide overflow to prevent horizontal scrollbar
                        historyList.style.overflowX = 'hidden';

                        // Animate the card out
                        card.style.transition = 'all 0.3s ease-out';
                        card.style.transform = 'translateX(100%)';
                        card.style.opacity = '0';

                        // After slide-out, collapse height
                        setTimeout(() => {
                            card.style.maxHeight = card.offsetHeight + 'px';
                            card.style.overflow = 'hidden';
                            card.offsetHeight; // Force reflow
                            card.style.maxHeight = '0';
                            card.style.marginBottom = '0';
                            card.style.padding = '0';
                            card.style.border = 'none';
                        }, 250);

                        // After collapse, actually remove from storage
                        setTimeout(() => {
                            const history = JSON.parse(localStorage.getItem('loanHistory') || '[]');
                            history.splice(index, 1);
                            localStorage.setItem('loanHistory', JSON.stringify(history));

                            // If this was the last item, close the modal instead of showing empty state
                            if (history.length === 0) {
                                if (typeof toggleModal === 'function') toggleModal(historyModal);
                            } else {
                                if (typeof renderHistoryList === 'function') renderHistoryList(history, AppState.lang);
                            }
                        }, 500);
                        return;
                    }

                    // Check if card was clicked (load action)
                    const card = e.target.closest('.history-card');
                    if (card) {
                        const index = parseInt(card.dataset.index);
                        if (isNaN(index)) return;
                        if (typeof haptic !== 'undefined') haptic('medium');
                        const history = JSON.parse(localStorage.getItem('loanHistory') || '[]');
                        const item = history[index];
                        if (item) {
                            AppState.activeKey = item.activeKey || 'installment';
                            const radio = document.querySelector(`input[name="calc-target"][value="${AppState.activeKey}"]`);
                            if (radio) radio.checked = true;

                            if (typeof updateInputState === 'function') updateInputState(inputGroups, formInputs, errorLabels, AppState.activeKey, AppState.lang);
                            formInputs.amount.value = item.values.amount;
                            formInputs.rate.value = item.values.rate;
                            formInputs.period.value = item.values.period;
                            formInputs.installment.value = item.values.installment;
                            if (item.values.startDate) {
                                dateInputs.startNative.value = item.values.startDate;
                                dateInputs.startNative.dispatchEvent(new Event('change'));
                            }

                            // Restore advanced options if saved
                            const advancedToggle = document.getElementById('advanced-toggle');
                            if (item.values.isAdvanced && advancedToggle) {
                                advancedToggle.checked = true;
                                advancedToggle.dispatchEvent(new Event('change'));

                                // Restore first installment date
                                if (item.values.firstInstDate && dateInputs.firstNative) {
                                    dateInputs.firstNative.value = item.values.firstInstDate;
                                    dateInputs.firstNative.dispatchEvent(new Event('change'));
                                }

                                // Restore admin fees
                                const adminFeesInput = document.getElementById('admin-fees');
                                if (adminFeesInput && item.values.adminFees) {
                                    adminFeesInput.value = item.values.adminFees;
                                }

                                // Restore stamp rate
                                const stampRateInput = document.getElementById('stamp-rate');
                                if (stampRateInput && item.values.stampRate) {
                                    stampRateInput.value = item.values.stampRate;
                                }
                            } else if (advancedToggle) {
                                advancedToggle.checked = false;
                                advancedToggle.dispatchEvent(new Event('change'));
                            }

                            if (typeof toggleModal === 'function') toggleModal(historyModal);
                            appCalculate();
                        }
                    }
                });
            }
        }

        // Save Button
        const saveBtn = document.getElementById('save-button');
        if (saveBtn) saveBtn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('medium');
            if (!AppState.lastRes.P) return;
            try {
                const history = JSON.parse(localStorage.getItem('loanHistory') || '[]');
                const isAdvanced = document.getElementById('advanced-toggle').checked;
                const entry = {
                    date: new Date().toISOString(),
                    activeKey: AppState.activeKey,
                    values: {
                        amount: formInputs.amount.value,
                        rate: formInputs.rate.value,
                        period: formInputs.period.value,
                        installment: formInputs.installment.value,
                        startDate: dateInputs.startNative.value,
                        // Advanced options
                        isAdvanced: isAdvanced,
                        firstInstDate: dateInputs.firstNative?.value || '',
                        adminFees: document.getElementById('admin-fees')?.value || '',
                        stampRate: document.getElementById('stamp-rate')?.value || ''
                    },
                    res: AppState.lastRes
                };
                history.unshift(entry);
                if (history.length > 20) history.pop();
                localStorage.setItem('loanHistory', JSON.stringify(history));
                showToast(t(AppState.lang, 'saveSuccess'));
            } catch (e) { showToast("Storage full", 'error'); }
        });

        // About Modal
        const aboutModal = document.getElementById('about-modal');
        if (aboutModal) {
            document.getElementById('about-btn').addEventListener('click', () => { if (typeof haptic !== 'undefined') haptic('light'); toggleModal(aboutModal); });
            document.getElementById('close-about').addEventListener('click', () => { if (typeof haptic !== 'undefined') haptic('light'); toggleModal(aboutModal); });

            aboutModal.addEventListener('click', (e) => {
                if (e.target === aboutModal || e.target.classList.contains('modal-overlay')) { if (typeof haptic !== 'undefined') haptic('light'); toggleModal(aboutModal); }
            });

            document.getElementById('share-btn').addEventListener('click', async () => {
                if (typeof haptic !== 'undefined') haptic('medium');
                // Use clean URL without hash or query params for sharing
                const shareUrl = window.location.origin + window.location.pathname;

                if (navigator.share) {
                    try { await navigator.share({ title: t(AppState.lang, 'shareTitle'), text: t(AppState.lang, 'shareText'), url: shareUrl }); } catch (err) { /* User cancelled or share failed - no action needed */ }
                } else {
                    try { await navigator.clipboard.writeText(shareUrl); showToast(t(AppState.lang, 'toastLinkCopied')); } catch (err) { showToast("Copy failed"); }
                }
            });
        }
    }

    // --- Updates & Utils ---
    async function checkUpdates() {
        if (!navigator.onLine) { showToast(t(AppState.lang, 'updateOffline'), 'error'); return; }
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

                // Clean up history stack before reloading so Back button exits app after update
                if (history.state && history.state.modal) {
                    history.back();
                    await new Promise(r => setTimeout(r, 100));
                }

                // Use reload() to show native browser loading indicator
                window.location.reload();
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            icon.classList.remove('spin-icon');
            showToast(t(AppState.lang, 'updateFail'), 'error');
        }
    }

    function printReport() {
        if (AppState.schedule.length === 0) return;
        const frame = document.getElementById('print-frame');
        if (!frame) return;

        try {
            const doc = frame.contentWindow.document;
            const summaryClone = document.getElementById('summary-section').cloneNode(true);
            const scheduleClone = document.getElementById('schedule-container').cloneNode(true);

            // New addition: Clone disclaimer
            const disclaimerClone = document.getElementById('assumptions-panel').cloneNode(true);

            const existingHeader = scheduleClone.querySelector('.px-6.py-4');
            if (existingHeader) existingHeader.remove();

            scheduleClone.classList.remove('hidden', 'max-h-0', 'opacity-0');
            scheduleClone.classList.add('block', 'opacity-100');
            scheduleClone.style.marginTop = '2rem';

            const tableContainer = scheduleClone.querySelector('.table-container');
            if (tableContainer) {
                tableContainer.style.maxHeight = 'none';
                tableContainer.style.overflow = 'visible';
                tableContainer.style.border = 'none';
            }

            // Safe DOM Construction for Print (Avoids doc.write XSS sink)
            doc.open();
            doc.write('<!DOCTYPE html><html><head></head><body></body></html>');
            doc.close();

            const html = doc.documentElement;
            // Strict sanitization
            const safeLang = AppState.lang === 'ar' ? 'ar' : 'en';
            html.lang = safeLang;
            html.dir = safeLang === 'ar' ? 'rtl' : 'ltr';
            html.className = 'light';

            const head = doc.head;
            const meta = doc.createElement('meta');
            meta.charset = 'UTF-8';
            head.appendChild(meta);

            const title = doc.createElement('title');
            title.textContent = 'Loan Report';
            head.appendChild(title);

            // Clone styles
            document.querySelectorAll('link[rel="stylesheet"]').forEach(link => head.appendChild(link.cloneNode(true)));
            document.querySelectorAll('style').forEach(style => head.appendChild(style.cloneNode(true)));

            const twScript = doc.createElement('script');
            twScript.src = './tailwind.js';
            head.appendChild(twScript);

            const printStyles = doc.createElement('style');
            printStyles.textContent = `
                body { background-color: white !important; color: black !important; padding: 2rem; font-family: system-ui; }
                .print-container { max-width: 800px; margin: 0 auto; display: block; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                #summary-section { background: white !important; border: 2px solid #000; border-radius: 12px; color: black !important; box-shadow: none !important; margin-bottom: 2rem; }
                #summary-section * { color: black !important; text-shadow: none !important; }
                #summary-section .absolute { display: none !important; }
                
                /* Added Disclaimer Styling */
                #assumptions-panel { 
                    border: 1px solid #e5e7eb !important; 
                    background-color: #f9fafb !important; 
                    margin-bottom: 2rem !important; 
                    page-break-inside: avoid;
                    color: #6b7280 !important;
                    font-size: 0.75rem !important;
                }

                .summary-divider { background-color: #ccc !important; height: 1px !important; margin: 8px 0 !important; }
                
                /* Reset Tailwind CSS shadow variables */
                * {
                    --tw-shadow: 0 0 #0000 !important;
                    --tw-ring-shadow: 0 0 #0000 !important;
                    --tw-ring-offset-shadow: 0 0 #0000 !important;
                }
                
                /* Reset ONLY container DIVs - NOT table/tr/td/th */
                #schedule-container,
                #schedule-container > div,
                #schedule-container > div > div,
                .table-container { 
                    border: none !important; 
                    box-shadow: none !important; 
                    overflow: visible !important; 
                    max-height: none !important;
                }
                
                /* Remove divide-y effect (border-top on rows) */
                tbody tr { border-top: none !important; }
                table { border-collapse: collapse; width: 100%; border: none !important; font-size: 10pt; }
                thead, tbody, tr, th, td { position: static !important; overflow: visible !important; }
                thead { display: table-header-group !important; }
                tbody { display: table-row-group !important; }
                tr { display: table-row !important; break-inside: avoid; page-break-inside: avoid; }
                th, td { display: table-cell !important; }
                thead th { 
                    background-color: #f3f4f6 !important; 
                    color: #000 !important; 
                    border-bottom: 2px solid #000 !important; 
                    font-weight: bold !important; 
                    text-align: center !important; 
                }
                tbody td { border-bottom: 1px solid #e5e7eb !important; padding: 6px 8px !important; text-align: center !important; }
                .hidden { display: table-cell !important; }
                #close-schedule-btn, #copy-summary-btn { display: none !important; }
                [data-stamp-col] { color: #7c3aed !important; }
                .bg-purple-50, .bg-purple-100\\/50 { background-color: #faf5ff !important; }
                .text-purple-600, .text-purple-700, .text-purple-400 { color: #7c3aed !important; }
                @page { size: A4; margin: 1cm; }
                .no-print { display: none !important; }
            `;
            head.appendChild(printStyles);

            const body = doc.body;
            body.className = 'lang-ready';

            const container = doc.createElement('div');
            container.className = 'print-container';

            // Add Header
            const h2 = doc.createElement('h2');
            h2.className = 'text-xl font-bold mb-4 mt-8';
            h2.style.cssText = 'text-align: center; break-before: page; page-break-before: always;';
            h2.textContent = t(AppState.lang, 'scheduleTitle');

            container.appendChild(summaryClone);
            container.appendChild(disclaimerClone);
            container.appendChild(h2);

            const tableWrapper = doc.createElement('div');
            tableWrapper.className = 'w-full';
            // We can append scheduleClone directly if it's a node, or clone its content
            // scheduleClone is a node (cloneNode(true) earlier), so we just append it
            tableWrapper.appendChild(scheduleClone);
            container.appendChild(tableWrapper);

            // Footer
            const footer = doc.createElement('div');
            footer.style.cssText = 'margin-top: 2rem; text-align: center; font-size: 0.75rem; color: #666; border-top: 1px solid #ccc; pt-4';
            footer.textContent = `Generated by Loan Calculator Pro • ${new Date().toLocaleDateString(safeLang === 'ar' ? 'ar-EG' : 'en-GB')}`;
            container.appendChild(footer);

            body.appendChild(container);

            // Print Trigger
            const script = doc.createElement('script');
            // Execute directly - document is already ready. Focus is needed for some browsers.
            script.textContent = 'setTimeout(() => { window.focus(); window.print(); }, 500);';
            body.appendChild(script);
        } catch (e) { console.error(e); showToast("Print failed", "error"); }
    }

    function exportExcel() {
        if (AppState.schedule.length === 0) return;
        if (typeof XLSX === 'undefined') {
            showToast(AppState.lang === 'ar' ? "خطأ: المكتبة غير محملة" : "Error: Library not loaded", "error");
            return;
        }

        try {
            const l = AppState.lang;
            const res = AppState.lastRes;
            const isRTL = l === 'ar';

            // 1. Prepare Loan Summary Data
            // Structure: [Label, "", "", "", "", Value] (Value in Col 5 for alignment)
            const summaryData = [
                [t(l, 'summaryTitle')], // Row 0: Title
                [t(l, 'loanAmountLabel'), "", "", "", "", res.P],
                [t(l, 'interestRateLabel'), "", "", "", "", res.R / 100], // Pass as decimal for % format
                [t(l, 'loanPeriodLabel'), "", "", "", "", res.N],
                [t(l, 'monthlyInstallmentLabel'), "", "", "", "", res.M],
                [t(l, 'totalInterestLabel'), "", "", "", "", res.TI],
                [t(l, 'totalSumLabel'), "", "", "", "", res.P + res.TI],
                [t(l, 'flatRateLabel'), "", "", "", "", res.FR / 100] // Pass as decimal for % format
            ];

            const isAdvanced = document.getElementById('advanced-toggle').checked;
            if (isAdvanced) {
                const adminVal = parseFloat(document.getElementById('admin-fees').value) || 0;
                const fees = (res.P * adminVal) / 100;
                const netLoan = res.P - fees;

                summaryData.push([t(l, 'adminFeesLabel'), "", "", "", "", fees]);
                summaryData.push([t(l, 'netLoanLabel'), "", "", "", "", netLoan]);
                summaryData.push([t(l, 'firstInstAmountLabel'), "", "", "", "", res.m1_Payment]);

                // Add total stamp if present
                if (res.totalStamp && res.totalStamp > 0) {
                    summaryData.push([t(l, 'totalStampLabel'), "", "", "", "", res.totalStamp]);
                }

                const dateLabelKey = isAdvanced ? 'bookingDateLabel' : 'startDateLabel';
                if (dateInputs.startNative.value) {
                    summaryData.push([t(l, dateLabelKey), "", "", "", "", dateInputs.startNative.value]);
                }
            }

            summaryData.push([]);

            // 2. Prepare Schedule Data
            const scheduleTitleRow = [t(l, 'scheduleTitle')];

            // Check if any rows have stamps
            const hasAnyStamps = AppState.schedule.some(r => r.hasStamp && r.stamp > 0);

            // Build headers - add Stamp column if stamps exist
            const headers = hasAnyStamps
                ? [t(l, 'colMonth'), t(l, 'colDate'), t(l, 'colBalance'), t(l, 'colInterest'), t(l, 'colPrincipal'), t(l, 'colRemaining'), t(l, 'totalStampLabel')]
                : [t(l, 'colMonth'), t(l, 'colDate'), t(l, 'colBalance'), t(l, 'colInterest'), t(l, 'colPrincipal'), t(l, 'colRemaining')];

            const scheduleRows = AppState.schedule.map(r => {
                const locale = isRTL ? 'ar-EG-u-nu-latn' : 'en-US';
                const isAdv = document.getElementById('advanced-toggle')?.checked;
                let dateStr;
                if (isAdv) {
                    const d = r.rawDate.getDate().toString().padStart(2, '0');
                    const m = (r.rawDate.getMonth() + 1).toString().padStart(2, '0');
                    const y = r.rawDate.getFullYear();
                    dateStr = `${d} /${m}/${y} `;
                } else {
                    dateStr = r.rawDate.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
                }

                // Base row data
                const rowData = [r.m, dateStr, parseFloat(r.bal.toFixed(2)), parseFloat(r.int.toFixed(2)), parseFloat(r.prin.toFixed(2)), parseFloat(r.rem.toFixed(2))];

                // Add stamp column if stamps exist
                if (hasAnyStamps) {
                    rowData.push(r.hasStamp && r.stamp > 0 ? parseFloat(r.stamp.toFixed(2)) : '');
                }

                return rowData;
            });

            // 3a. Prepare Assumptions Data for Audit Trail
            const assumptionsData = [
                [],
                [t(l, 'assumptionsTitle')],
                [l === 'ar' ? '• طريقة الفائدة: رصيد متناقص (قسطي)' : '• Interest Method: Reducing Balance (Annuity)'],
                [l === 'ar' ? '• حساب الأيام: 30/360 (US/NASD)' : '• Day Count: 30/360 (US/NASD)'],
                [l === 'ar' ? '• التقريب: منزلتان عشريتان لكل قسط' : '• Rounding: 2 decimal places per installment'],
                [l === 'ar' ? '• الدمغة: ربع سنوية على أعلى رصيد مستحق' : '• Stamp: Quarterly on highest principal balance'],
                [l === 'ar' ? '• الرسوم: تُخصم مقدماً، لا يتم إطفاؤها' : '• Fees: Deducted upfront, not amortized'],
                [],
                [l === 'ar' ? 'هذه الحاسبة توفر تقديرات فقط. النتائج ليست موافقة نهائية على القرض.' : 'This calculator provides estimates only. Results are not final loan approval.']
            ];

            // 3b. Combine All Data
            const ws_data = [...summaryData, scheduleTitleRow, headers, ...scheduleRows, ...assumptionsData];
            const ws = XLSX.utils.aoa_to_sheet(ws_data);

            // 4. MERGES
            if (!ws['!merges']) ws['!merges'] = [];

            // Determine last column based on whether stamps exist
            const lastCol = hasAnyStamps ? 6 : 5;

            // Merge Summary Title
            ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } });

            // Merge Summary Rows (Label A-E) - Value is in F (Col 5)
            for (let i = 1; i < summaryData.length - 1; i++) {
                ws['!merges'].push({ s: { r: i, c: 0 }, e: { r: i, c: 4 } });
            }

            // Merge Schedule Title
            const schedTitleRowIdx = summaryData.length;
            ws['!merges'].push({ s: { r: schedTitleRowIdx, c: 0 }, e: { r: schedTitleRowIdx, c: lastCol } });

            // 5. STYLES & FORMATS
            const centerBoldStyle = { alignment: { horizontal: "center", vertical: "center" }, font: { bold: true, sz: 14 } };
            const labelStyle = { alignment: { horizontal: isRTL ? "right" : "left" }, font: { bold: true } };
            // For numbers, we rely on Excel's default right alignment for numbers, but ensure format
            const valueStyle = { alignment: { horizontal: "right" } }; // Force right
            const headerStyle = { alignment: { horizontal: "center", vertical: "center" }, font: { bold: true }, fill: { fgColor: { rgb: "F3F4F6" } } };

            // Apply Styles to Summary
            let cell = ws[XLSX.utils.encode_cell({ r: 0, c: 0 })];
            if (cell) cell.s = centerBoldStyle;

            for (let i = 1; i < summaryData.length - 1; i++) {
                // Label Style
                let lbl = ws[XLSX.utils.encode_cell({ r: i, c: 0 })];
                if (lbl) lbl.s = labelStyle;

                // Value Format & Style
                let val = ws[XLSX.utils.encode_cell({ r: i, c: 5 })];
                if (val) {
                    val.s = valueStyle;
                    // Apply Number Formats
                    if (typeof val.v === 'number') {
                        // Check if it's a percentage row
                        const isRate = (i === 2 || i === 7); // Row 2 (Rate) and Row 7 (Flat Rate)
                        if (isRate) {
                            val.z = '0.00%';
                        } else if (i === 3) { // Period (Row 3)
                            val.z = '0';
                        } else { // Currency
                            val.z = '#,##0.00';
                        }
                    }
                }
            }

            // Apply Styles to Schedule Title
            cell = ws[XLSX.utils.encode_cell({ r: schedTitleRowIdx, c: 0 })];
            if (cell) cell.s = centerBoldStyle;

            // Apply Styles to Headers
            const headerRowIdx = schedTitleRowIdx + 1;
            for (let c = 0; c <= 5; c++) {
                cell = ws[XLSX.utils.encode_cell({ r: headerRowIdx, c: c })];
                if (cell) cell.s = headerStyle;
            }

            // 6. SETUP SHEET PROPERTIES
            ws['!dir'] = isRTL ? 'rtl' : 'ltr';
            ws['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];

            // 7. WRITE FILE
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Loan Calculation");
            XLSX.writeFile(wb, `Loan_Calculation_${Date.now()}.xlsx`);

        } catch (e) {
            console.error(e);
            showToast("Export failed", "error");
        }
    }

    // --- Toast Logic ---
    // Note: showToast() and hideToast() are defined in ui.js and globally available

    function handleSharedData() {
        // Parse URL params for ?amount=...&rate=...
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('amount')) {
            formInputs.amount.value = urlParams.get('amount');
            if (urlParams.has('rate')) formInputs.rate.value = urlParams.get('rate');
            if (urlParams.has('period')) formInputs.period.value = urlParams.get('period');

            // Allow inputs to trigger formatting events if needed
            Object.values(formInputs).forEach(input => input.dispatchEvent(new Event('input')));

            appCalculate();

            // Clear URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // --- Install & Keyboard ---
    function setupInstallListeners() {
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); deferredPrompt = e;
            const instBtn = document.getElementById('install-button');
            if (instBtn) instBtn.classList.remove('hidden');
        });
        const instBtn = document.getElementById('install-button');
        if (instBtn) instBtn.addEventListener('click', async () => {
            if (typeof haptic !== 'undefined') haptic('medium');
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
            if (iosMsg) iosMsg.classList.remove('hidden');
            const closeIos = document.getElementById('close-ios-msg');
            if (closeIos) closeIos.addEventListener('click', () => { if (typeof haptic !== 'undefined') haptic('light'); iosMsg.classList.add('hidden'); });
        }
    }

    function setupMobileKeyboard() {
        CORE_KEYS.forEach(key => { if (formInputs[key]) formInputs[key].setAttribute('enterkeyhint', 'go'); });
    }

    function handleKeyboard(e) {
        if (e.key === 'Escape') {
            const aboutModal = document.getElementById('about-modal');
            const historyModal = document.getElementById('history-modal');
            const schedContainer = document.getElementById('schedule-container');
            if (aboutModal && !aboutModal.classList.contains('opacity-0')) toggleModal(aboutModal);
            else if (historyModal && !historyModal.classList.contains('opacity-0')) toggleModal(historyModal);
            else if (schedContainer && !schedContainer.classList.contains('hidden') && typeof closeScheduleUI === 'function') closeScheduleUI();
        }

        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            const el = e.target;

            // Check for Context-Specific Actions
            if (el.closest('#early-settlement-section')) {
                e.preventDefault();
                el.blur();
                if (typeof haptic !== 'undefined') haptic('light');
                updateEarlySettlement(true);
                return;
            }

            if (el.closest('#self-sufficient-section')) {
                e.preventDefault();
                el.blur();
                if (typeof haptic !== 'undefined') haptic('light');
                updateSelfSufficient(true);
                return;
            }

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
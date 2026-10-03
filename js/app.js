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

    // Note: Export and print utilities are maintained in js/export.js (ExportManager)

    const MENU_CLASSES = {
        VISIBLE: ['visible', 'opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto'],
        HIDDEN: ['invisible', 'opacity-0', 'scale-95', '-translate-y-2', 'pointer-events-none']
    };

    // --- Local State & Utils ---
    const AppState = {
        activeKey: 'installment', // Default
        loanType: 'unsecured',
        lang: localStorage.getItem('language') || (navigator.language.startsWith('ar') ? 'ar' : 'en'),
        theme: localStorage.getItem('theme') || 'system',
        lastRes: {},
        schedule: []
    };

    // Multi-collateral system state (delegated to js/collaterals.js)
    window.getCollaterals = () => (typeof CollateralManager !== 'undefined' ? CollateralManager.get() : []);
    window.setMainCollateralsFromCd1 = (cd1List) => {
        if (typeof CollateralManager !== 'undefined') CollateralManager.setFromCd1(cd1List);
    };

    /**
     * Dispatch polite screen-reader announcements to dedicated live regions
     */
    function announceLiveStatus(regionId, message) {
        if (!message) return;
        const liveRegion = document.getElementById(regionId);
        if (!liveRegion) return;
        liveRegion.textContent = '';
        setTimeout(() => {
            liveRegion.textContent = message;
        }, 50);
    }

    const announceCollateralStatus = (msg) => announceLiveStatus('collateral-live-region', msg);
    const announceExportStatus = (msg) => announceLiveStatus('export-live-region', msg);

    // Safe HTML escape helper
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
    let themeOptionsCache = null;
    let langOptionsCache = null;

    // --- Initialization ---
    window.addEventListener('load', () => {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

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
            // Use local date components to avoid UTC off-by-one (valueAsDate uses UTC)
            const ty = today.getFullYear();
            const tm = String(today.getMonth() + 1).padStart(2, '0');
            const td = String(today.getDate()).padStart(2, '0');
            const todayISO = `${ty}-${tm}-${td}`;
            dateInputs.startNative.value = todayISO;
            if (dateInputs.startDisplay) {
                dateInputs.startDisplay.value = (typeof dateBuildValue === 'function')
                    ? dateBuildValue(td, tm, String(ty), false)
                    : formatDate(today);
                dateInputs.startDisplay.dataset.iso = todayISO;
            }

            // Also set first installment date: 5th of second month after booking date
            if (dateInputs.firstNative) {
                const firstInstDate = new Date(today.getFullYear(), today.getMonth() + 2, 5);
                const fy = firstInstDate.getFullYear();
                const fm = String(firstInstDate.getMonth() + 1).padStart(2, '0');
                const fd = String(firstInstDate.getDate()).padStart(2, '0');
                const firstISO = `${fy}-${fm}-${fd}`;
                dateInputs.firstNative.value = firstISO;
                // Seed min so constraint is enforced immediately (today cannot be overridden)
                dateInputs.firstNative.min = todayISO;
                if (dateInputs.firstDisplay) {
                    dateInputs.firstDisplay.value = (typeof dateBuildValue === 'function')
                        ? dateBuildValue(fd, fm, String(fy), false)
                        : formatDate(firstInstDate);
                    dateInputs.firstDisplay.dataset.iso = firstISO;
                }
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
        setLoanType('unsecured', { immediate: true });

        // 8. Initialize Gestures
        if (typeof initSwipeToClose === 'function') initSwipeToClose();

        // 9. Handle Shared Data
        handleSharedData();

        document.body.classList.add('lang-ready');
    });

    // --- Helper Logic ---

    let freqAnimTimer = null;
    let collateralAnimTimer = null;

    function setLoanType(type, options = {}) {
        AppState.loanType = type;
        const unsecuredBtn = document.getElementById('loan-type-unsecured-btn');
        const securedBtn = document.getElementById('loan-type-secured-btn');
        const collateralSection = document.getElementById('collateral-section');
        const adminFeesInput = document.getElementById('admin-fees');
        const freqContainer = document.getElementById('frequency-container');
        const freqSel = document.getElementById('installment-freq');

        if (freqAnimTimer) {
            clearTimeout(freqAnimTimer);
            freqAnimTimer = null;
        }
        if (collateralAnimTimer) {
            clearTimeout(collateralAnimTimer);
            collateralAnimTimer = null;
        }

        if (type === 'secured') {
            if (unsecuredBtn) {
                unsecuredBtn.className = 'loan-type-btn py-2 px-3 rounded-md text-xs sm:text-sm font-semibold transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
            }
            if (securedBtn) {
                securedBtn.className = 'loan-type-btn py-2 px-3 rounded-md text-xs sm:text-sm font-semibold transition-all shadow-sm bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300';
            }
            if (collateralSection) {
                if (options.immediate) {
                    collateralSection.style.transition = 'none';
                    collateralSection.classList.remove('max-h-0', 'opacity-0');
                    collateralSection.style.maxHeight = '1200px';
                    collateralSection.classList.add('opacity-100');
                    void collateralSection.offsetHeight;
                    collateralAnimTimer = setTimeout(() => {
                        collateralSection.style.transition = '';
                    }, 500);
                } else {
                    collateralSection.classList.remove('max-h-0', 'opacity-0');
                    collateralSection.classList.add('opacity-100');
                    const targetHeight = Math.max(collateralSection.scrollHeight, 250);
                    collateralSection.style.maxHeight = targetHeight + 'px';
                    collateralAnimTimer = setTimeout(() => {
                        if (AppState.loanType === 'secured') {
                            collateralSection.style.maxHeight = '1200px';
                        }
                    }, 350);
                }
            }
            if (freqContainer) {
                if (options.immediate) {
                    freqContainer.classList.remove('hidden');
                    freqContainer.style.maxHeight = '';
                    freqContainer.style.opacity = '';
                    freqContainer.style.marginTop = '';
                    freqContainer.style.marginBottom = '';
                    freqContainer.style.overflow = '';
                    freqContainer.style.transition = '';
                } else if (freqContainer.classList.contains('hidden')) {
                    // Smoothly expand frequency container in sync with collateral section
                    freqContainer.classList.remove('hidden');
                    freqContainer.style.overflow = 'hidden';
                    freqContainer.style.maxHeight = '0px';
                    freqContainer.style.opacity = '0';
                    freqContainer.style.marginTop = '0px';
                    freqContainer.style.marginBottom = '0px';
                    freqContainer.style.transition = 'none';
                    void freqContainer.offsetHeight; // Force reflow

                    const targetH = Math.max(freqContainer.scrollHeight, 70);
                    freqContainer.style.transition = 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), margin-top 300ms cubic-bezier(0.4, 0, 0.2, 1), margin-bottom 300ms cubic-bezier(0.4, 0, 0.2, 1)';
                    freqContainer.style.maxHeight = targetH + 'px';
                    freqContainer.style.opacity = '1';
                    freqContainer.style.marginTop = '';
                    freqContainer.style.marginBottom = '';

                    freqAnimTimer = setTimeout(() => {
                        if (AppState.loanType === 'secured') {
                            freqContainer.style.overflow = 'visible';
                            freqContainer.style.maxHeight = 'none';
                            freqContainer.style.transition = '';
                        }
                    }, 350);
                }
            }
            if (adminFeesInput) {
                adminFeesInput.value = '1';
            }
            renderCollaterals();
            updateCollateralCashflow();
            updateSelfCoveringChip();
        } else {
            if (unsecuredBtn) {
                unsecuredBtn.className = 'loan-type-btn py-2 px-3 rounded-md text-xs sm:text-sm font-semibold transition-all shadow-sm bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300';
            }
            if (securedBtn) {
                securedBtn.className = 'loan-type-btn py-2 px-3 rounded-md text-xs sm:text-sm font-semibold transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
            }
            if (collateralSection) {
                if (options.immediate || collateralSection.classList.contains('max-h-0')) {
                    collateralSection.style.transition = 'none';
                    collateralSection.classList.add('max-h-0', 'opacity-0');
                    collateralSection.style.maxHeight = '0px';
                    collateralSection.classList.remove('opacity-100');
                    void collateralSection.offsetHeight;
                    collateralAnimTimer = setTimeout(() => {
                        collateralSection.style.transition = '';
                    }, 50);
                } else {
                    // Instantly lock current pixel height without transition so animation starts immediately from actual height
                    const currentH = collateralSection.getBoundingClientRect().height || collateralSection.scrollHeight;
                    collateralSection.style.transition = 'none';
                    collateralSection.style.maxHeight = currentH + 'px';
                    void collateralSection.offsetHeight; // Force reflow to commit current height

                    // Now animate down to 0 with explicit identical duration and cubic-bezier easing
                    collateralSection.style.transition = 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)';
                    collateralSection.classList.add('max-h-0', 'opacity-0');
                    collateralSection.style.maxHeight = '0px';
                    collateralSection.classList.remove('opacity-100');

                    collateralAnimTimer = setTimeout(() => {
                        if (AppState.loanType === 'unsecured') {
                            collateralSection.style.transition = '';
                        }
                    }, 320);
                }
            }
            const cashflowCard = document.getElementById('collateral-cashflow-card');
            if (cashflowCard) {
                if (options.immediate) {
                    cashflowCard.classList.add('hidden');
                } else {
                    setTimeout(() => {
                        if (AppState.loanType === 'unsecured') {
                            cashflowCard.classList.add('hidden');
                        }
                    }, 300);
                }
            }

            // Close frequency dropdown if open before collapse
            const freqDropdown = document.getElementById('freq-dropdown');
            if (freqDropdown && typeof closeMenu === 'function' && typeof isMenuOpen === 'function' && isMenuOpen(freqDropdown)) {
                closeMenu(freqDropdown);
                const freqChevron = document.getElementById('freq-chevron');
                if (freqChevron) freqChevron.style.transform = 'rotate(0deg)';
            }

            if (freqContainer) {
                if (options.immediate || freqContainer.classList.contains('hidden')) {
                    freqContainer.classList.add('hidden');
                    freqContainer.style.maxHeight = '';
                    freqContainer.style.opacity = '';
                    freqContainer.style.marginTop = '';
                    freqContainer.style.marginBottom = '';
                    freqContainer.style.overflow = '';
                    freqContainer.style.transition = '';
                } else {
                    // Smoothly collapse frequency container down to 0 in sync with collateralSection
                    const currentH = freqContainer.getBoundingClientRect().height || freqContainer.scrollHeight;
                    freqContainer.style.transition = 'none';
                    freqContainer.style.overflow = 'hidden';
                    freqContainer.style.maxHeight = currentH + 'px';
                    freqContainer.style.opacity = '1';
                    void freqContainer.offsetHeight; // Force reflow

                    freqContainer.style.transition = 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), margin-top 300ms cubic-bezier(0.4, 0, 0.2, 1), margin-bottom 300ms cubic-bezier(0.4, 0, 0.2, 1)';

                    freqContainer.style.maxHeight = '0px';
                    freqContainer.style.opacity = '0';
                    freqContainer.style.marginTop = '0px';
                    freqContainer.style.marginBottom = '0px';

                    freqAnimTimer = setTimeout(() => {
                        if (AppState.loanType === 'unsecured') {
                            freqContainer.classList.add('hidden');
                            freqContainer.style.maxHeight = '';
                            freqContainer.style.opacity = '';
                            freqContainer.style.marginTop = '';
                            freqContainer.style.marginBottom = '';
                            freqContainer.style.overflow = '';
                            freqContainer.style.transition = '';
                        }
                    }, 320);
                }
            }

            if (freqSel && freqSel.value !== '1') {
                freqSel.value = '1';
                freqSel.dispatchEvent(new Event('change'));
            }
            if (adminFeesInput) {
                adminFeesInput.value = '3';
            }
            const wAmount = document.getElementById('warning-loan-amount');
            const wRate = document.getElementById('warning-loan-rate');
            if (wAmount) wAmount.classList.add('hidden');
            if (wRate) wRate.classList.add('hidden');
        }
    }
    window.setLoanType = setLoanType;

    // --- Collateral Management (Delegated to js/collaterals.js) ---
    const renderCollaterals = (id) => (typeof CollateralManager !== 'undefined') && CollateralManager.render(id);
    const recalcCollateralMetrics = (auto) => (typeof CollateralManager !== 'undefined') && CollateralManager.recalc(auto);
    const updateCollateralWarnings = () => (typeof CollateralManager !== 'undefined') && CollateralManager.updateWarnings();
    const updateCollateralCashflow = () => (typeof CollateralManager !== 'undefined') && CollateralManager.updateCashflow();
    const updateSelfCoveringChip = () => (typeof CollateralManager !== 'undefined') && CollateralManager.updateSelfCoveringChip();
    const applySelfCoveringLoanAmount = () => (typeof CollateralManager !== 'undefined') && CollateralManager.applySelfCoveringLoanAmount();


    function getNextEditableCoreInput(currentEl) {
        let foundCurrent = false;
        for (let i = 0; i < CORE_KEYS.length; i++) {
            const k = CORE_KEYS[i];
            if (k === AppState.activeKey) continue;
            const input = formInputs[k];
            if (!input || input.hasAttribute('readonly')) continue;
            if (foundCurrent) return input;
            if (input === currentEl) foundCurrent = true;
        }
        return null;
    }

    function coreInputsFilled() {
        for (let i = 0; i < CORE_KEYS.length; i++) {
            const k = CORE_KEYS[i];
            if (k === AppState.activeKey) continue;
            const input = formInputs[k];
            if (!input || input.value.trim() === '') return false;
        }
        return true;
    }

    function updateSummaryView(isAdvanced) {
        const std = document.getElementById('std-installments-view');
        const adv = document.getElementById('adv-installments-view');
        if (!std || !adv) return;

        if (isAdvanced) {
            std.classList.remove('expanded');
            adv.classList.add('expanded');
        } else {
            adv.classList.remove('expanded');
            std.classList.add('expanded');
        }
    }

    function showFirstTimeTutorial(lang) {
        // Versioned key - increment version to show tooltip again to all users
        const TOOLTIP_VERSION = 'v1';
        const TOOLTIP_KEY = `tutorialTooltipShown_${TOOLTIP_VERSION}`;

        // Check if already shown for this version
        if (localStorage.getItem(TOOLTIP_KEY)) return;

        // Never trigger if any modal or date picker is currently open
        if (typeof ScrollLock !== 'undefined' && ScrollLock.isAnyModalOrPickerOpen()) return;
        const openModals = document.querySelectorAll('.modal:not(.pointer-events-none)');
        if (openModals.length > 0) return;

        // Wait a bit for the page to settle
        setTimeout(() => {
            if (typeof ScrollLock !== 'undefined' && ScrollLock.isAnyModalOrPickerOpen()) return;
            const openModalsNow = document.querySelectorAll('.modal:not(.pointer-events-none)');
            if (openModalsNow.length > 0) return;
            if (document.querySelector('.tutorial-tooltip')) return;

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
                if (tooltip._autoDismissTimer) {
                    clearTimeout(tooltip._autoDismissTimer);
                    tooltip._autoDismissTimer = null;
                }
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

            // Auto-dismiss after 15 seconds of viewing the form
            tooltip._autoDismissTimer = setTimeout(() => {
                if (tooltip.parentElement) dismissTooltip();
            }, 15000);
        }, 800);
    }

    // --- Menu Helpers ---
    function openMenu(menu) {
        if (!menu) return;
        menu.classList.remove(...MENU_CLASSES.HIDDEN);
        menu.classList.add(...MENU_CLASSES.VISIBLE);
        const trigger = menu.parentElement?.querySelector('[aria-haspopup]');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
    }

    function closeMenu(menu) {
        if (!menu) return;
        menu.classList.remove(...MENU_CLASSES.VISIBLE);
        menu.classList.add(...MENU_CLASSES.HIDDEN);
        const trigger = menu.parentElement?.querySelector('[aria-haspopup]');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }

    function isMenuOpen(menu) {
        return menu && !menu.classList.contains('invisible');
    }

    /**
     * Reusable W3C ARIA listbox & menu keyboard navigation helper
     */
    function setupDropdownKeyboardNav({
        triggerEl,
        menuEl,
        getOptions,
        isOpen,
        open,
        close,
        onSelect
    }) {
        if (!triggerEl || !menuEl) return;

        let activeIndex = -1;

        const clearActive = (opts) => {
            opts.forEach(opt => {
                opt.classList.remove('active-option');
                opt.tabIndex = -1;
            });
        };

        const setActive = (opts, index) => {
            if (opts.length === 0) return;
            clearActive(opts);
            if (index < 0) index = 0;
            if (index >= opts.length) index = opts.length - 1;
            activeIndex = index;
            const activeOpt = opts[activeIndex];
            if (activeOpt) {
                activeOpt.classList.add('active-option');
                activeOpt.tabIndex = 0;
                activeOpt.focus();
            }
        };

        const findMatchByChar = (opts, char, startIdx) => {
            const lower = char.toLowerCase();
            const len = opts.length;
            for (let i = 0; i < len; i++) {
                const idx = (startIdx + i) % len;
                const optText = opts[idx].textContent.trim().toLowerCase();
                if (optText.startsWith(lower)) {
                    return idx;
                }
            }
            return -1;
        };

        // Trigger keyboard navigation
        triggerEl.addEventListener('keydown', (e) => {
            const opts = getOptions();
            if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Spacebar'].includes(e.key)) {
                e.preventDefault();
                if (!isOpen()) {
                    open();
                    let targetIdx = opts.findIndex(o => o.getAttribute('aria-selected') === 'true' || o.getAttribute('aria-checked') === 'true' || o.classList.contains('text-indigo-700') || o.classList.contains('dark:text-indigo-300'));
                    if (targetIdx === -1) targetIdx = 0;
                    if (e.key === 'ArrowUp') targetIdx = opts.length - 1;
                    setTimeout(() => setActive(opts, targetIdx), 50);
                } else {
                    close();
                }
            } else if (e.key === 'Escape' && isOpen()) {
                e.preventDefault();
                close();
                triggerEl.focus();
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
                if (!isOpen()) open();
                const match = findMatchByChar(opts, e.key, (activeIndex + 1) % opts.length);
                if (match !== -1) {
                    e.preventDefault();
                    setTimeout(() => setActive(opts, match), 50);
                }
            }
        });

        // Menu items keyboard navigation
        menuEl.addEventListener('keydown', (e) => {
            const opts = getOptions();
            if (opts.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIdx = (activeIndex + 1) % opts.length;
                setActive(opts, nextIdx);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIdx = (activeIndex - 1 + opts.length) % opts.length;
                setActive(opts, prevIdx);
            } else if (e.key === 'Home') {
                e.preventDefault();
                setActive(opts, 0);
            } else if (e.key === 'End') {
                e.preventDefault();
                setActive(opts, opts.length - 1);
            } else if (['Enter', ' ', 'Spacebar'].includes(e.key)) {
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < opts.length) {
                    const chosen = opts[activeIndex];
                    close();
                    triggerEl.focus();
                    if (onSelect) onSelect(chosen);
                    else chosen.click();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                close();
                triggerEl.focus();
            } else if (e.key === 'Tab') {
                close();
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
                const match = findMatchByChar(opts, e.key, (activeIndex + 1) % opts.length);
                if (match !== -1) {
                    e.preventDefault();
                    setActive(opts, match);
                }
            }
        });
    }

    function animateToggleBounce(toggleElement) {
        const knob = toggleElement?.parentElement?.querySelector('div');
        if (knob) {
            knob.classList.remove('animate-toggle-bounce');
            void knob.offsetWidth; // Force reflow
            knob.classList.add('animate-toggle-bounce');
        }
    }

    // --- Event Listeners Setup (Modularized) ---

    function setupThemeListeners() {
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

                const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isCurrentDark = AppState.theme === 'dark' || (AppState.theme === 'system' && sysDark);
                const isNewDark = newTheme === 'dark' || (newTheme === 'system' && sysDark);
                const isReverse = isCurrentDark && !isNewDark;

                const finalize = () => {
                    if (typeof haptic !== 'undefined') haptic('medium');
                    const label = t(AppState.lang, AppState.theme === 'system' ? 'themeSystem' : (AppState.theme === 'dark' ? 'themeDark' : 'themeLight'));
                    showToast(label);
                };

                // Close the menu instantly before starting view transition (keeps it out of screenshots)
                themeMenu.style.transition = 'none';
                closeMenu(themeMenu);
                void themeMenu.offsetHeight;
                themeMenu.style.transition = '';

                if (!document.startViewTransition) {
                    // Crossfade fallback for Safari/iOS
                    const overlay = document.createElement('div');
                    const oldBg = isCurrentDark ? '#020617' : '#f9fafb';
                    overlay.style.cssText = `
                        position: fixed; inset: 0; z-index: ${Z_INDEX.OVERLAY};
                        pointer-events: none; background: ${oldBg};
                        opacity: 1; transition: opacity 0.5s ease-in-out;
                    `;
                    document.body.appendChild(overlay);
                    void overlay.offsetHeight;
                    document.body.classList.add('preload');
                    AppState.theme = newTheme;
                    localStorage.setItem('theme', AppState.theme);
                    if (typeof applyTheme === 'function') applyTheme(AppState.theme, AppState.lastRes, false);
                    updateThemeMenuState(AppState.theme);
                    void document.body.offsetHeight;
                    document.body.classList.remove('preload');
                    requestAnimationFrame(() => {
                        overlay.style.opacity = '0';
                        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
                    });
                    finalize();
                } else {
                    try {
                        // Set CSS custom properties for the keyframe animations BEFORE starting
                        const rect = themeBtn.getBoundingClientRect();
                        const x = rect.left + rect.width / 2;
                        const y = rect.top + rect.height / 2;
                        const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
                        const docEl = document.documentElement;

                        docEl.style.setProperty('--vt-x', `${x}px`);
                        docEl.style.setProperty('--vt-y', `${y}px`);
                        docEl.style.setProperty('--vt-radius', `${endRadius}px`);

                        docEl.classList.add('view-transition-active');
                        docEl.classList.add('preload');

                        // Minimal callback — CSS keyframes handle the animation automatically
                        // Pass skipChart=true to avoid DOM churn/reflow during transition snapshot
                        const transition = document.startViewTransition(() => {
                            AppState.theme = newTheme;
                            localStorage.setItem('theme', AppState.theme);
                            if (typeof applyTheme === 'function') applyTheme(AppState.theme, AppState.lastRes, true);
                            updateThemeMenuState(AppState.theme);
                            void docEl.offsetHeight;
                        });

                        transition.finished.then(() => {
                            docEl.classList.remove('preload');
                            docEl.classList.remove('view-transition-active');
                            docEl.style.removeProperty('--vt-x');
                            docEl.style.removeProperty('--vt-y');
                            docEl.style.removeProperty('--vt-radius');
                            finalize();
                        });

                    } catch (err) {
                        AppState.theme = newTheme;
                        localStorage.setItem('theme', AppState.theme);
                        if (typeof applyTheme === 'function') applyTheme(AppState.theme, AppState.lastRes, false);
                        updateThemeMenuState(AppState.theme);
                        finalize();
                    }
                }
            });
        });

        setupDropdownKeyboardNav({
            triggerEl: themeBtn,
            menuEl: themeMenu,
            getOptions: () => Array.from(document.querySelectorAll('.theme-option')),
            isOpen: () => isMenuOpen(themeMenu),
            open: () => {
                const langMenu = document.getElementById('lang-menu');
                if (isMenuOpen(langMenu)) closeMenu(langMenu);
                openMenu(themeMenu);
                updateThemeMenuState(AppState.theme);
            },
            close: () => closeMenu(themeMenu),
            onSelect: (btn) => btn.click()
        });
    }

    function setupLanguageListeners() {
        const langBtn = document.getElementById('lang-toggle');
        const langMenu = document.getElementById('lang-menu');
        const langOptions = document.querySelectorAll('.lang-option');

        if (langBtn && langMenu) {
            langBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hideToast();
                if (typeof haptic !== 'undefined') haptic('light');

                // Close theme menu if open
                const themeMenu = document.getElementById('theme-menu');
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

        setupDropdownKeyboardNav({
            triggerEl: langBtn,
            menuEl: langMenu,
            getOptions: () => Array.from(document.querySelectorAll('.lang-option')),
            isOpen: () => isMenuOpen(langMenu),
            open: () => {
                const themeMenu = document.getElementById('theme-menu');
                if (isMenuOpen(themeMenu)) closeMenu(themeMenu);
                openMenu(langMenu);
                updateLangMenuState(AppState.lang);
            },
            close: () => closeMenu(langMenu),
            onSelect: (btn) => btn.click()
        });
    }

    function setupCalculationTargetListeners() {
        const unsecuredBtn = document.getElementById('loan-type-unsecured-btn');
        const securedBtn = document.getElementById('loan-type-secured-btn');
        if (unsecuredBtn) {
            unsecuredBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                setLoanType('unsecured');
            });
        }
        if (securedBtn) {
            securedBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                setLoanType('secured');
            });
        }

        // Initialize Multi-Collateral Manager
        if (typeof CollateralManager !== 'undefined' && CollateralManager.init) {
            CollateralManager.init({
                getLang: () => AppState.lang,
                getLoanType: () => AppState.loanType,
                getFormInputs: () => formInputs,
                getLastResult: () => AppState.lastRes,
                onRecalcRequired: () => { if (coreInputsFilled()) appCalculate(); },
                validateInput: (key) => validateInput(key)
            });
        }


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
                // Refresh chip when rate or period changes (self-covering formula depends on them)
                if (key === 'rate' || key === 'period') updateSelfCoveringChip();
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
                    tdRateInput.setAttribute('aria-invalid', 'true');
                    if (tdRateError) {
                        tdRateError.classList.remove('hidden');
                        tdRateInput.setAttribute('aria-describedby', 'error-td-rate');
                    }
                } else {
                    tdRateGroup.classList.remove('error-state');
                    tdRateInput.removeAttribute('aria-invalid');
                    tdRateInput.removeAttribute('aria-describedby');
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
                if (!isNaN(val) && val > 100) {
                    adminInput.parentElement.classList.add('error-state');
                    adminInput.setAttribute('aria-invalid', 'true');
                    adminInput.title = t(AppState.lang, 'maxRate');
                } else {
                    adminInput.parentElement.classList.remove('error-state');
                    adminInput.removeAttribute('aria-invalid');
                    adminInput.title = '';
                }
            });
            adminInput.addEventListener('blur', () => { if (typeof formatRateInputBlur === 'function') formatRateInputBlur(adminInput); });
        }

        // Stamp Rate - validation for percentage input
        const stampRateInput = document.getElementById('stamp-rate');
        if (stampRateInput) {
            stampRateInput.addEventListener('input', () => {
                if (typeof validateRateInput === 'function') validateRateInput(stampRateInput);
                const val = parseFloat(stampRateInput.value);
                if (!isNaN(val) && val > 100) {
                    stampRateInput.parentElement.classList.add('error-state');
                    stampRateInput.setAttribute('aria-invalid', 'true');
                    stampRateInput.title = t(AppState.lang, 'maxRate');
                } else {
                    stampRateInput.parentElement.classList.remove('error-state');
                    stampRateInput.removeAttribute('aria-invalid');
                    stampRateInput.title = '';
                }
            });
            stampRateInput.addEventListener('blur', () => { if (typeof formatRateInputBlur === 'function') formatRateInputBlur(stampRateInput); });
        }
    }

    function setupDateInputListeners() {
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

                    // Enforce constraint: first installment cannot be before booking date
                    dateInputs.firstNative.min = e.target.value;
                }
            });

            // Date picker button click handler
            const startPickerBtn = document.getElementById('start-date-picker-btn');
            if (startPickerBtn) {
                startPickerBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
                        }, { launcher: startPickerBtn });
                    } else {
                        dateInputs.startNative.showPicker();
                    }
                });
            }
        }

        if (dateInputs.firstDisplay && dateInputs.firstNative) {
            // Seed min constraint from already-filled grant date before initDateInput runs
            if (dateInputs.startNative && dateInputs.startNative.value) {
                dateInputs.firstNative.min = dateInputs.startNative.value;
            }
            if (typeof initDateInput === 'function') {
                initDateInput(dateInputs.firstDisplay, dateInputs.firstNative);
            }

            // Date picker button click handler
            const firstPickerBtn = document.getElementById('first-inst-date-picker-btn');
            if (firstPickerBtn) {
                firstPickerBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof haptic !== 'undefined') haptic('light');
                    if (typeof openDatePicker === 'function') {
                        // Pass booking date as minDate so pre-grant dates are greyed out.
                        // normalizeConstraint expects a Date object or DD/MM/YYYY string (not ISO).
                        const grantDateISO = dateInputs.startNative ? dateInputs.startNative.value : '';
                        const minDateObj = grantDateISO ? new Date(grantDateISO + 'T00:00:00') : null;
                        const opts = { launcher: firstPickerBtn };
                        if (minDateObj) opts.minDate = minDateObj;
                        openDatePicker(dateInputs.firstDisplay, AppState.lang, (selectedDate) => {
                            if (selectedDate) {
                                dateInputs.firstDisplay.value = formatDate(selectedDate);
                                const y = selectedDate.getFullYear();
                                const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                const d = String(selectedDate.getDate()).padStart(2, '0');
                                dateInputs.firstNative.value = `${y}-${m}-${d}`;
                                dateInputs.firstNative.dispatchEvent(new Event('change'));
                            }
                        }, opts);
                    } else {
                        dateInputs.firstNative.showPicker();
                    }
                });
            }
        }
    }

    function setupModeToggleListeners() {
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
                    advancedSection.style.maxHeight = (advancedSection.scrollHeight + 40) + 'px';
                    advancedSection.classList.add('opacity-100');
                    if (typeof updateLangUI === 'function') updateLangUI(AppState.lang);
                    requestAnimationFrame(() => {
                        if (typeof autoFitAllInputs === 'function') autoFitAllInputs(advancedSection);
                    });
                } else {
                    // Collapse smoothly with real scrollHeight
                    advancedSection.style.maxHeight = advancedSection.scrollHeight + 'px';
                    advancedSection.offsetHeight; // Force reflow for instant smooth collapse
                    advancedSection.classList.add('max-h-0', 'opacity-0');
                    advancedSection.style.maxHeight = '0px';
                    advancedSection.classList.remove('opacity-100');
                    if (typeof updateLangUI === 'function') updateLangUI(AppState.lang);
                }

                updateSummaryView(e.target.checked);
                
                if (e.target.checked) {
                    // When toggling ON: Do NOT recalculate. Close schedule if open so user doesn't see stale results.
                    if (typeof closeScheduleUI === 'function') closeScheduleUI();
                } else {
                    // When toggling OFF: Recalculate immediately with basic terms.
                    if (coreInputsFilled()) appCalculate();
                }
            });
        }

        // Self-Sufficient module (selfsufficient.js)
        if (typeof initSelfSufficient === 'function') {
            initSelfSufficient(AppState, dateInputs, formInputs, animateToggleBounce, appCalculate);
        }

        // Early Settlement module (earlysettlement.js)
        if (typeof initEarlySettlement === 'function') {
            initEarlySettlement(AppState, formInputs, animateToggleBounce, formatDate);
        }

        // Export module (export.js)
        if (typeof initExport === 'function') {
            initExport(AppState, dateInputs);
        }
    }

    function setupFrequencyListeners() {
        const freqSelect = document.getElementById('installment-freq');
        if (freqSelect) {
            let _savedFirstInstDate = { native: '', display: '' }; // saved monthly date

            const updateFreqLabels = () => {
                const f = parseInt(freqSelect.value) || 1;
                const periodLabels = document.querySelectorAll('[data-lang-key="loanPeriodLabel"]');
                const instLabels = document.querySelectorAll('[data-lang-key="monthlyInstallmentLabel"]');
                
                periodLabels.forEach(periodLabel => {
                    const base = t(AppState.lang, 'loanPeriodBase');
                    const unit = f === 3
                        ? t(AppState.lang, 'quartersUnitSuffix')
                        : t(AppState.lang, 'monthsUnitSuffix');
                    periodLabel.textContent = base + unit;
                });

                instLabels.forEach(instLabel => {
                    instLabel.textContent = f === 3
                        ? t(AppState.lang, 'quarterlyInstallmentLabel')
                        : t(AppState.lang, 'monthlyInstallmentLabel');
                });
            };

            const syncQuarterlyDate = () => {
                // Calculate the quarterly first installment date from the booking date
                let bookingDate = new Date();
                if (dateInputs.startNative && dateInputs.startNative.value) {
                    const p = dateInputs.startNative.value.split('-');
                    bookingDate = new Date(p[0], p[1] - 1, p[2]);
                }
                const qDate = getNextQuarterlyDate(bookingDate);
                const y = qDate.getFullYear();
                const m = String(qDate.getMonth() + 1).padStart(2, '0');
                const d = String(qDate.getDate()).padStart(2, '0');
                if (dateInputs.firstNative) dateInputs.firstNative.value = `${y}-${m}-${d}`;
                if (dateInputs.firstDisplay) dateInputs.firstDisplay.value = `${d}/${m}/${y}`;
            };

            freqSelect.addEventListener('change', () => {
                const f = parseInt(freqSelect.value) || 1;
                if (f === 3) {
                    // Save current monthly date before overwriting
                    _savedFirstInstDate.native = dateInputs.firstNative?.value || '';
                    _savedFirstInstDate.display = dateInputs.firstDisplay?.value || '';
                    syncQuarterlyDate();
                } else {
                    // Restore the saved monthly date
                    if (dateInputs.firstNative) dateInputs.firstNative.value = _savedFirstInstDate.native;
                    if (dateInputs.firstDisplay) dateInputs.firstDisplay.value = _savedFirstInstDate.display;
                }
                updateFreqLabels();

                // Update summary card labels immediately
                const stdInstLabel = document.querySelector('#std-installments-view [data-lang-key="monthlyInstallmentLabel"]');
                if (stdInstLabel) {
                    stdInstLabel.textContent = f === 3
                        ? t(AppState.lang, 'quarterlyInstallmentLabel')
                        : t(AppState.lang, 'monthlyInstallmentLabel');
                }
                const regInstLabel = document.querySelector('[data-lang-key="regularInstLabel"]');
                if (regInstLabel) {
                    regInstLabel.textContent = f === 3
                        ? t(AppState.lang, 'quarterlyInstallmentLabel')
                        : t(AppState.lang, 'regularInstLabel');
                }

                if (coreInputsFilled()) {
                    appCalculate();
                }
            });

            // When booking date changes while quarterly, update the quarterly date
            if (dateInputs.startNative) {
                dateInputs.startNative.addEventListener('change', () => {
                    if (parseInt(freqSelect.value) === 3) syncQuarterlyDate();
                });
            }
            if (dateInputs.startDisplay) {
                dateInputs.startDisplay.addEventListener('change', () => {
                    if (parseInt(freqSelect.value) === 3) {
                        // Small delay to let the native input sync first
                        setTimeout(syncQuarterlyDate, 50);
                    }
                });
            }

            // Set initial labels
            updateFreqLabels();

            // Refresh labels when language or UI updates wipe out the dynamic text
            window.addEventListener('languageUpdated', updateFreqLabels);
        }

        // Custom frequency dropdown behavior
        const freqTrigger = document.getElementById('freq-trigger');
        const freqDropdown = document.getElementById('freq-dropdown');
        const freqChevron = document.getElementById('freq-chevron');
        const freqTriggerText = document.getElementById('freq-trigger-text');
        if (freqTrigger && freqDropdown) {
            const freqOptions = freqDropdown.querySelectorAll('.freq-option');
            const primaryColor = 'var(--primary-color, #6366f1)';

            const freqOptionNodes = Array.from(freqOptions).map(opt => ({
                opt,
                val: opt.dataset.value,
                check: opt.querySelector('.freq-check'),
                dot: opt.querySelector('.freq-check span')
            }));

            const updateFreqRadios = (selectedVal) => {
                freqOptionNodes.forEach(({ opt, val, check, dot }) => {
                    if (val === selectedVal) {
                        if (check) check.style.borderColor = primaryColor;
                        if (dot) dot.style.background = primaryColor;
                        opt.setAttribute('aria-selected', 'true');
                    } else {
                        if (check) check.style.borderColor = '#d1d5db';
                        if (dot) dot.style.background = 'transparent';
                        opt.setAttribute('aria-selected', 'false');
                    }
                });
            };

            const openFreqDropdown = () => {
                openMenu(freqDropdown);
                if (freqChevron) freqChevron.style.transform = 'rotate(180deg)';
            };

            const closeFreqDropdown = () => {
                closeMenu(freqDropdown);
                if (freqChevron) freqChevron.style.transform = 'rotate(0deg)';
            };

            const isFreqOpen = () => isMenuOpen(freqDropdown);

            freqTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof haptic !== 'undefined') haptic('light');
                if (isFreqOpen()) {
                    closeFreqDropdown();
                } else {
                    updateFreqRadios(freqSelect.value);
                    openFreqDropdown();
                }
            });

            freqOptions.forEach(opt => {
                opt.addEventListener('click', () => {
                    const val = opt.dataset.value;
                    if (typeof haptic !== 'undefined') haptic('medium');
                    
                    // Update trigger text and its lang key immediately for responsiveness
                    const label = opt.querySelector('.freq-option-label');
                    if (freqTriggerText && label) {
                        freqTriggerText.textContent = label.textContent;
                        freqTriggerText.setAttribute('data-lang-key', val === '3' ? 'freqQuarterly' : 'freqMonthly');
                    }
                    updateFreqRadios(val);
                    
                    // Start closing animation immediately
                    closeFreqDropdown();
                    
                    if (freqSelect.value !== val) {
                        freqSelect.value = val;
                        freqSelect.dispatchEvent(new Event('change'));
                    }
                });
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (isFreqOpen() && !freqTrigger.contains(e.target) && !freqDropdown.contains(e.target)) {
                    closeFreqDropdown();
                }
            });

            // Keyboard Navigation for listbox
            setupDropdownKeyboardNav({
                triggerEl: freqTrigger,
                menuEl: freqDropdown,
                getOptions: () => Array.from(freqDropdown.querySelectorAll('.freq-option')),
                isOpen: () => isFreqOpen(),
                open: () => {
                    updateFreqRadios(freqSelect.value);
                    openFreqDropdown();
                },
                close: () => closeFreqDropdown(),
                onSelect: (opt) => opt.click()
            });

            // Sync trigger text when select changes programmatically (e.g. restore from history)
            const origDispatch = freqSelect.dispatchEvent.bind(freqSelect);
            freqSelect.addEventListener('change', () => {
                const val = freqSelect.value;
                const matchOpt = freqDropdown.querySelector(`.freq-option[data-value="${val}"]`);
                if (matchOpt && freqTriggerText) {
                    const label = matchOpt.querySelector('.freq-option-label');
                    if (label) {
                        freqTriggerText.textContent = label.textContent;
                        freqTriggerText.setAttribute('data-lang-key', val === '3' ? 'freqQuarterly' : 'freqMonthly');
                    }
                }
                updateFreqRadios(val);
            });
        }
    }

    function setupActionButtonsListeners() {
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
        if (pdfBtn) pdfBtn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('medium');
            if (typeof window.printReport === 'function') window.printReport();
        });

        const xlsxBtn = document.getElementById('export-xlsx-button');
        if (xlsxBtn) xlsxBtn.addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('medium');
            if (typeof window.exportExcel === 'function') window.exportExcel();
        });

        // Modals
        setupModalListeners();

        // Updates
        const updateBtn = document.getElementById('force-update-btn');
        if (updateBtn) updateBtn.addEventListener('click', () => { if (typeof haptic !== 'undefined') haptic('light'); checkUpdates(); });

        // Install (Delegated to js/pwa-install.js)
        if (typeof setupInstallListeners === 'function') setupInstallListeners(() => AppState.lang);

        // Keyboard
        document.addEventListener('keydown', handleKeyboard);

        // Copy Summary Listener
        const copySummaryBtn = document.getElementById('copy-summary-btn');
        if (copySummaryBtn) {
            copySummaryBtn.addEventListener('click', () => {
                if (typeof haptic !== 'undefined') haptic('light');
                if (!AppState.lastRes.P) {
                    showToast(t(AppState.lang, 'noCalcToShare'), "error");
                    return;
                }

                const res = AppState.lastRes;
                const freq = res.freq || 1;
                const periodUnit = freq === 3
                    ? t(AppState.lang, 'quartersUnitWord')
                    : t(AppState.lang, 'monthsUnitWord');

                let text = `*${t(AppState.lang, 'appTitle')} - ${t(AppState.lang, 'summaryTitle')}*\n`;
                text += `-------------------\n`;
                text += `${t(AppState.lang, 'loanAmountLabel')}: ${displayFmt(res.P)}\n`;
                text += `${t(AppState.lang, 'interestRateLabel')}: ${res.R.toFixed(2)}%\n`;
                text += `${t(AppState.lang, 'loanPeriodLabel')}: ${res.N}\n`;

                const isAdvanced = document.getElementById('advanced-toggle').checked;
                if (isAdvanced) {
                    const firstDate = dateInputs.firstNative.value ? formatDate(new Date(dateInputs.firstNative.value)) : '-';
                    const adminVal = parseFloat(document.getElementById('admin-fees').value) || 0;
                    const fees = (res.P * adminVal) / 100;
                    const netLoan = res.P - fees;
                    const m1_Payment = parseFloat(document.getElementById('summary-first-inst').textContent.replace(/,/g, '')) || 0;

                    text += `${t(AppState.lang, 'firstInstAmountLabel')}: ${displayFmt(m1_Payment)} (${firstDate})\n`;
                    const regLabel = freq === 3
                        ? t(AppState.lang, 'quarterlyInstallmentLabel')
                        : t(AppState.lang, 'regularInstLabel');
                    text += `${regLabel}: ${displayFmt(res.M)}\n`;
                    text += `${t(AppState.lang, 'adminFeesLabel')}: ${displayFmt(fees)}\n`;
                    text += `${t(AppState.lang, 'netLoanLabel')}: ${displayFmt(netLoan)}\n`;
                } else {
                    const instLabel = freq === 3
                        ? t(AppState.lang, 'quarterlyInstallmentLabel')
                        : t(AppState.lang, 'monthlyInstallmentLabel');
                    text += `${instLabel}: ${displayFmt(res.M)}\n`;
                }

                text += `-------------------\n`;
                text += `${t(AppState.lang, 'totalInterestLabel')}: ${displayFmt(res.TI)}\n`;
                text += `${t(AppState.lang, 'totalSumLabel')}: ${displayFmt(res.P + res.TI)}\n`;
                text += `${t(AppState.lang, 'flatRateLabel')}: ${res.FR}%`;

                if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
                    navigator.share({ title: t(AppState.lang, 'summaryTitle'), text: text }).catch(console.error);
                } else {
                    navigator.clipboard.writeText(text).then(() => { showToast(t(AppState.lang, 'toastSummaryCopied')); }).catch(() => showToast(t(AppState.lang, 'failedToCopy'), "error"));
                }
            });
        }
    }

    function setupEventListeners() {
        setupThemeListeners();
        setupLanguageListeners();
        setupCalculationTargetListeners();
        setupDateInputListeners();
        setupModeToggleListeners();
        setupFrequencyListeners();
        setupActionButtonsListeners();
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
        renderCollaterals();
        updateCollateralWarnings();
        if (typeof window.renderSsCd1List === 'function') window.renderSsCd1List();
        if (typeof window.updateTenorAdvisoryAndMatchButton === 'function') {
            const p = parseInt(document.getElementById('ss-loan-period')?.value) || 36;
            window.updateTenorAdvisoryAndMatchButton(p);
        }
        if (typeof window.ssUpdateFirstInstDateDisplay === 'function') {
            window.ssUpdateFirstInstDateDisplay();
        }
        if (AppState.lastRes.P) {
            const freq = AppState.lastRes.freq || 1;
            document.getElementById('summary-period').textContent = AppState.lastRes.N;

            const isAdvancedMode = document.getElementById('advanced-toggle')?.checked || false;
            if (typeof showScheduleUI === 'function') showScheduleUI(AppState.schedule, AppState.lang, false, isAdvancedMode);
            if (typeof drawChart === 'function') drawChart(AppState.lastRes.P, AppState.lastRes.TI, AppState.lang);
        }
    }

    function validateInput(key, showEmptyError = false) {
        if (key === AppState.activeKey) return true;
        if (!formInputs[key]) return true;

        let valStr = formInputs[key].value;
        let val = safeParseFloat(valStr);

        let errMsg = t(AppState.lang, 'invalidValue');
        let isValid = true;

        if (valStr.trim() === '') {
            isValid = false;
            if (key === 'amount') errMsg = t(AppState.lang, 'invalidAmount');
            else if (key === 'rate') errMsg = t(AppState.lang, 'invalidRate');
            else if (key === 'period') errMsg = t(AppState.lang, 'invalidPeriod');
            else errMsg = t(AppState.lang, 'invalidValue');
        } else if (isNaN(val) || val <= 0) {
            isValid = false;
            if (key === 'amount') errMsg = t(AppState.lang, 'invalidAmount');
            else if (key === 'rate') errMsg = t(AppState.lang, 'invalidRate');
            else if (key === 'period') errMsg = t(AppState.lang, 'invalidPeriod');
            else errMsg = t(AppState.lang, 'invalidValue');
        } else if (key === 'amount') {
            if (valStr.includes('.') || (val % 1 !== 0)) {
                isValid = false;
                errMsg = t(AppState.lang, 'wholeNumbersOnly');
            } else if (val > 999999999999) {
                isValid = false;
                errMsg = t(AppState.lang, 'valueTooLarge');
            }
        } else if (key === 'installment') {
            if (val > 999999999) {
                isValid = false;
                errMsg = t(AppState.lang, 'valueTooLarge');
            }
        } else if (key === 'rate') {
            if (val > 100) {
                isValid = false;
                errMsg = t(AppState.lang, 'maxRate');
            }
        } else if (key === 'period') {
            const freqVal = document.getElementById('installment-freq')?.value || '1';
            const maxPeriod = freqVal === '3' ? 200 : 600;
            if (val > maxPeriod) {
                isValid = false;
                errMsg = freqVal === '3'
                    ? t(AppState.lang, 'maxPeriodQuarters')
                    : t(AppState.lang, 'maxPeriodMonths');
            }
        }

        if (inputGroups[key] && errorLabels[key]) {
            if (!isValid && (valStr.trim() !== '' || showEmptyError)) {
                inputGroups[key].classList.add('error-state');
                errorLabels[key].textContent = errMsg;
                errorLabels[key].classList.remove('hidden');
                if (formInputs[key]) {
                    formInputs[key].setAttribute('aria-invalid', 'true');
                    formInputs[key].setAttribute('aria-describedby', `error-${key}`);
                }
            } else {
                inputGroups[key].classList.remove('error-state');
                errorLabels[key].classList.add('hidden');
                if (formInputs[key]) {
                    formInputs[key].removeAttribute('aria-invalid');
                    formInputs[key].removeAttribute('aria-describedby');
                }
            }
        }

        updateCollateralWarnings();
        return isValid;
    }

    function updateThemeMenuState(activeTheme) {
        if (!themeOptionsCache) {
            themeOptionsCache = Array.from(document.querySelectorAll('.theme-option')).map(btn => ({
                btn,
                val: btn.dataset.themeValue,
                check: btn.querySelector('.check-icon')
            }));
        }
        themeOptionsCache.forEach(({ btn, val, check }) => {
            const isSelected = val === activeTheme;
            btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            if (isSelected) {
                btn.classList.add('bg-indigo-50', 'dark:bg-indigo-900/20', 'text-indigo-700', 'dark:text-indigo-300');
                if (check) check.classList.remove('hidden');
            } else {
                btn.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20', 'text-indigo-700', 'dark:text-indigo-300');
                if (check) check.classList.add('hidden');
            }
        });
    }

    function updateLangMenuState(activeLang) {
        if (!langOptionsCache) {
            langOptionsCache = Array.from(document.querySelectorAll('.lang-option')).map(btn => ({
                btn,
                val: btn.dataset.langValue,
                check: btn.querySelector('.check-icon')
            }));
        }
        langOptionsCache.forEach(({ btn, val, check }) => {
            const isSelected = val === activeLang;
            btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            if (isSelected) {
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
            if (!validateInput(key, true)) isValid = false;
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

        // Block calculation when first installment date is invalid or before the booking date.
        // Check both the native value (for arrow-key nav) AND the display field's red-state
        // (which persists when the typed value failed validation but nativeInput kept its last good value).
        if (isAdvanced) {
            const firstDateInvalid =
                dateInputs.firstDisplay.classList.contains('text-red-500') ||
                (dateInputs.firstNative.value && dateInputs.startNative.value &&
                    dateInputs.firstNative.value < dateInputs.startNative.value);
            if (firstDateInvalid) {
                showToast(t(AppState.lang, 'errorFirstInstBeforeBooking'), 'error');
                if (typeof haptic !== 'undefined') haptic('error');
                dateInputs.firstDisplay.classList.add('text-red-500');
                return;
            }
        }
        const freq = parseInt(document.getElementById('installment-freq').value) || 1;

        const calcResult = calculateLoan({
            amount: formInputs.amount.value,
            rate: formInputs.rate.value,
            period: formInputs.period.value,
            installment: formInputs.installment.value
        }, AppState.activeKey, freq);

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
            if (freq === 3) {
                // Quarterly: ALWAYS use fixed dates (5th of Mar/Jun/Sep/Dec)
                // Bank convention — quarterly installment dates are non-negotiable
                m1_Date = getNextQuarterlyDate(bookingDate);
            } else if (isAdvanced && dateInputs.firstNative.value) {
                const parts = dateInputs.firstNative.value.split('-');
                m1_Date = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                m1_Date = new Date(bookingDate);
                m1_Date.setMonth(m1_Date.getMonth() + 1);
            }

            // Get stamp rate if in advanced mode
            const stampRateInput = document.getElementById('stamp-rate');
            const stampRate = isAdvanced && stampRateInput ? (parseFloat(stampRateInput.value) || 0) : 0;

            const schedResult = generateSchedule({ P, R, N, M }, { bookingDate, m1_Date, isAdvanced }, stampRate, freq);

            AppState.schedule = schedResult.schedule;
            if (AppState.schedule && AppState.schedule.length > 0) {
                AppState.schedule.startDate = bookingDate;
                AppState.schedule.endDate = schedResult.schedule[schedResult.schedule.length - 1].rawDate;
            }
            const totalActualInterest = schedResult.totalActualInterest;
            const totalStamp = schedResult.totalStamp || 0;
            const finalTotalPayment = P + totalActualInterest;
            const totalMonths = N * freq; // Convert periods to months for flat rate
            const finalFlatRate = (totalMonths > 0 && P > 0) ? ((totalActualInterest / P) / (totalMonths / 12) * 100).toFixed(2) : '0';

            // SAVED m1_Payment HERE
            AppState.lastRes = {
                P, R, N, M,
                FR: finalFlatRate,
                TI: totalActualInterest,
                startDate: dateInputs.startNative.value,
                m1_Payment: schedResult.m1_Payment,
                totalStamp: totalStamp,
                freq: freq
            };

            document.getElementById('summary-rate').textContent = R.toFixed(2) + '%';
            document.getElementById('summary-principal').textContent = displayFmt(P);
            document.getElementById('total-interest').textContent = displayFmt(totalActualInterest);
            document.getElementById('total-sum').textContent = displayFmt(finalTotalPayment);

            document.querySelectorAll('.flat-rate-display').forEach(el => el.textContent = finalFlatRate + '%');
            const chartWrapper = document.getElementById('chart-collapsible-wrapper');
            if (chartWrapper) {
                chartWrapper.classList.add('expanded');
            }
            const chartEmptyState = document.getElementById('chart-empty-state');
            if (chartEmptyState) chartEmptyState.classList.add('hidden');

            document.getElementById('summary-period').textContent = N;

            if (isAdvanced || freq === 3) {
                document.getElementById('summary-first-inst').textContent = displayFmt(schedResult.m1_Payment);

                // Use the actual m1_Date (not the input field) for display
                document.getElementById('summary-first-date').textContent = formatDate(m1_Date);

                const regInstEl = document.getElementById('summary-regular-inst');
                regInstEl.textContent = displayFmt(M);
                regInstEl.className = "text-lg font-bold text-white select-text";

                // Update regular installment label for quarterly
                const regInstLabel = document.querySelector('[data-lang-key="regularInstLabel"]');
                if (regInstLabel) {
                    regInstLabel.textContent = freq === 3
                        ? t(AppState.lang, 'quarterlyInstallmentLabel')
                        : t(AppState.lang, 'regularInstLabel');
                }

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
            }

            // Always update the standard installment view (visible when advanced is off)
            document.getElementById('summary-std-inst').textContent = displayFmt(M);
            // Update its label for quarterly
            const stdInstLabel = document.querySelector('#std-installments-view [data-lang-key="monthlyInstallmentLabel"]');
            if (stdInstLabel) {
                stdInstLabel.textContent = freq === 3
                    ? t(AppState.lang, 'quarterlyInstallmentLabel')
                    : t(AppState.lang, 'monthlyInstallmentLabel');
            }

            updateSelfSufficient(false);
            updateCollateralCashflow();
            updateSelfCoveringChip();

            // Generate and display Calculation Fingerprint
            if (typeof generateFingerprint === 'function') {
                const fingerprintInputs = {
                    amount: P,
                    rate: R,
                    period: N,
                    freq: freq,
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

                // Smart auto-scroll to loan summary if not already in comfortable view.
                // Works seamlessly across mobile (stacked below fold) and PC/tablet
                // (e.g. when secured loan details or extra options pushed calculate button down).
                setTimeout(() => {
                    const rect = summarySection.getBoundingClientRect();
                    // Navbar height is 64px (h-16). If rect.top < 68, the summary header is obscured or scrolled off top.
                    // If rect.top > 140, the summary header is pushed down below comfortable view.
                    if (rect.top < 68 || rect.top > 140) {
                        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                        summarySection.scrollIntoView({
                            behavior: prefersReducedMotion ? 'auto' : 'smooth',
                            block: 'start'
                        });
                    }
                }, 120);
            }

            if (typeof showScheduleUI === 'function') showScheduleUI(AppState.schedule, AppState.lang, false, isAdvanced);

            // Reset subsidiary calculators to ensure results are fresh
            const esResults = document.getElementById('settlement-results');
            if (esResults) {
                esResults.classList.add('opacity-0', 'max-h-0');
                esResults.classList.remove('opacity-100', 'max-h-96');
            }
            const ssResults = document.getElementById('self-sufficient-results');
            if (ssResults && !updateSelfSufficient._fromSolver) {
                ssResults.classList.add('opacity-0');
                ssResults.classList.remove('opacity-100');
                ssResults.style.maxHeight = '0';
            }

            // Hide errors too
            const esError = document.getElementById('error-early-settlement');
            if (esError) esError.classList.add('hidden');
            const ssError = document.getElementById('error-self-sufficient');
            if (ssError) ssError.classList.add('hidden');

            if (typeof syncEarlySettlementConstraints === 'function') {
                syncEarlySettlementConstraints();
            }
            if (document.getElementById('early-settlement-toggle')?.checked && typeof updateEarlySettlement === 'function') {
                updateEarlySettlement(false);
            }
        } else {
            showToast(t(AppState.lang, 'errorCalculationFailed'), 'error');
            updateSubsidiaryErrors();
        }
    }

    // updateEarlySettlement, updateSubsidiaryErrors, updateSelfSufficient
    // are now global functions in earlysettlement.js and selfsufficient.js

    function resetApp() {
        Object.values(formInputs).forEach(i => i.value = '');

        const today = new Date();
        const ty = today.getFullYear();
        const tm = String(today.getMonth() + 1).padStart(2, '0');
        const td = String(today.getDate()).padStart(2, '0');
        dateInputs.startNative.value = `${ty}-${tm}-${td}`;
        dateInputs.startNative.dispatchEvent(new Event('change'));

        document.getElementById('advanced-toggle').checked = false;
        document.getElementById('advanced-toggle').dispatchEvent(new Event('change'));

        updateSummaryView(false);

        // Reset Loan Type to unsecured and Admin Fees to 3%
        setLoanType('unsecured');
        collaterals = [{ id: 1, amount: '', redemption: '', rate: '', period: '' }];
        nextCollateralId = 2;
        renderCollaterals();

        // Reset stamp rate
        const stampRateInput = document.getElementById('stamp-rate');
        if (stampRateInput) stampRateInput.value = '0.2';

        // Reset subsidiary modules
        if (typeof resetSelfSufficient === 'function') resetSelfSufficient();
        if (typeof resetEarlySettlement === 'function') resetEarlySettlement();

        // RESET RADIO BUTTON STATE
        AppState.activeKey = 'installment';
        const defaultRadio = document.querySelector('input[name="calc-target"][value="installment"]');
        if (defaultRadio) defaultRadio.checked = true;
        if (typeof updateInputState === 'function') updateInputState(inputGroups, formInputs, errorLabels, AppState.activeKey, AppState.lang);

        ['summary-rate', 'summary-principal', 'total-interest', 'total-sum', 'summary-period', 'summary-first-date'].forEach(id => document.getElementById(id).textContent = '-');
        document.querySelectorAll('.flat-rate-display').forEach(el => el.textContent = '-');
        ['summary-first-inst', 'summary-regular-inst', 'summary-std-inst', 'summary-admin-fees', 'summary-net-loan', 'summary-total-stamp'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '-';
        });

        Object.values(errorLabels).forEach(e => e.classList.add('hidden'));
        Object.values(inputGroups).forEach(g => g.classList.remove('error-state'));

        const wAmount = document.getElementById('warning-loan-amount');
        const wRate = document.getElementById('warning-loan-rate');
        if (wAmount) wAmount.classList.add('hidden');
        if (wRate) wRate.classList.add('hidden');

        const chartWrapper = document.getElementById('chart-collapsible-wrapper');
        if (chartWrapper && chartWrapper.classList.contains('expanded')) {
            chartWrapper.classList.remove('expanded');
            // Allow smooth 500ms collapse transition before destroying chart instance
            setTimeout(() => {
                if (chartWrapper && !chartWrapper.classList.contains('expanded')) {
                    if (typeof chartInst !== 'undefined' && chartInst) {
                        chartInst.destroy();
                        chartInst = null;
                    }
                }
            }, 500);
        } else {
            if (typeof chartInst !== 'undefined' && chartInst) {
                chartInst.destroy();
                chartInst = null;
            }
        }
        if (typeof closeScheduleUI === 'function') closeScheduleUI();

        const schedBtn = document.getElementById('schedule-button');
        if (schedBtn) {
            schedBtn.classList.remove('schedule-btn-active');
            schedBtn.classList.add('schedule-btn-inactive');
            schedBtn.disabled = true;
        }
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
        // History Modal & Storage Management (Delegated to js/history.js)
        if (typeof HistoryManager !== 'undefined' && HistoryManager.init) {
            HistoryManager.init({
                getLang: () => AppState.lang,
                onRestore: (item) => {
                    AppState.activeKey = item.activeKey || 'installment';
                    const radio = document.querySelector(`input[name="calc-target"][value="${AppState.activeKey}"]`);
                    if (radio) radio.checked = true;

                    if (typeof updateInputState === 'function') updateInputState(inputGroups, formInputs, errorLabels, AppState.activeKey, AppState.lang);
                    formInputs.amount.value = item.values.amount;
                    formInputs.rate.value = item.values.rate;
                    formInputs.period.value = item.values.period;
                    formInputs.installment.value = item.values.installment;

                    // Restore frequency BEFORE dates (affects date logic)
                    const freqSel = document.getElementById('installment-freq');
                    if (freqSel) {
                        freqSel.value = item.values.freq || '1';
                        freqSel.dispatchEvent(new Event('change'));
                    }
                    if (item.values.startDate && dateInputs.startNative) {
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

                    // Restore Loan Type & Collaterals
                    if (item.values && item.values.loanType) {
                        setLoanType(item.values.loanType);
                        if (item.values.collaterals && Array.isArray(item.values.collaterals) && typeof CollateralManager !== 'undefined') {
                            CollateralManager.setRaw(item.values.collaterals);
                        }
                    }

                    appCalculate();
                },
                onSave: () => {
                    if (!AppState.lastRes.P) return;
                    try {
                        const isAdvanced = document.getElementById('advanced-toggle')?.checked || false;
                        const entry = {
                            id: 'calc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
                            date: new Date().toISOString(),
                            activeKey: AppState.activeKey,
                            values: {
                                amount: formInputs.amount.value,
                                rate: formInputs.rate.value,
                                period: formInputs.period.value,
                                installment: formInputs.installment.value,
                                freq: document.getElementById('installment-freq')?.value || '1',
                                startDate: dateInputs.startNative?.value || '',
                                loanType: AppState.loanType,
                                collaterals: typeof CollateralManager !== 'undefined' ? CollateralManager.getRaw() : [],
                                isAdvanced: isAdvanced,
                                firstInstDate: dateInputs.firstNative?.value || '',
                                adminFees: document.getElementById('admin-fees')?.value || '',
                                stampRate: document.getElementById('stamp-rate')?.value || ''
                            },
                            res: AppState.lastRes
                        };
                        HistoryManager.save(entry);
                        showToast(t(AppState.lang, 'saveSuccess'));
                    } catch (e) {
                        showToast(t(AppState.lang, 'storageFull'), 'error');
                    }
                }
            });
        }

        // About Modal
        const aboutModal = document.getElementById('about-modal');
        if (aboutModal) {
            document.getElementById('about-btn').addEventListener('click', () => { if (typeof haptic !== 'undefined') haptic('light'); toggleModal(aboutModal, true); });
            document.getElementById('close-about').addEventListener('click', () => { if (typeof haptic !== 'undefined') haptic('light'); toggleModal(aboutModal, false); });

            aboutModal.addEventListener('click', (e) => {
                if (e.target === aboutModal || e.target.classList.contains('modal-overlay')) { if (typeof haptic !== 'undefined') haptic('light'); toggleModal(aboutModal, false); }
            });

            document.getElementById('share-btn').addEventListener('click', async () => {
                if (typeof haptic !== 'undefined') haptic('medium');
                // Use clean URL without hash or query params for sharing
                const shareUrl = window.location.origin + window.location.pathname;

                if (navigator.share) {
                    try { await navigator.share({ title: t(AppState.lang, 'shareTitle'), text: t(AppState.lang, 'shareText'), url: shareUrl }); } catch (err) { /* User cancelled or share failed - no action needed */ }
                } else {
                    try { await navigator.clipboard.writeText(shareUrl); showToast(t(AppState.lang, 'toastLinkCopied')); } catch (err) { showToast(t(AppState.lang, 'copyFailed')); }
                }
            });
        }

        // What's New & App Guide Modal
        const whatsNewModal = document.getElementById('whats-new-modal');
        if (whatsNewModal) {
            const closeWhatsNewBtn = document.getElementById('close-whats-new');
            const whatsNewGotItBtn = document.getElementById('btn-whats-new-got-it');
            const openWhatsNewBtn = document.getElementById('open-whats-new-btn');
            const tabBtnWhatsNew = document.getElementById('tab-btn-whats-new');
            const tabBtnAppFeatures = document.getElementById('tab-btn-app-features');
            const tabContentWhatsNew = document.getElementById('tab-content-whats-new');
            const tabContentAppFeatures = document.getElementById('tab-content-app-features');

            const switchWhatsNewTab = (tab) => {
                if (typeof haptic !== 'undefined') haptic('light');
                if (tab === 'whats-new') {
                    if (tabBtnWhatsNew) tabBtnWhatsNew.className = 'py-2 px-3 text-xs font-bold rounded-lg transition-all text-center bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs';
                    if (tabBtnAppFeatures) tabBtnAppFeatures.className = 'py-2 px-3 text-xs font-semibold rounded-lg transition-all text-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
                    if (contentWhatsNew) contentWhatsNew.classList.remove('hidden');
                    if (contentFeatures) contentFeatures.classList.add('hidden');
                } else {
                    if (tabBtnAppFeatures) tabBtnAppFeatures.className = 'py-2 px-3 text-xs font-bold rounded-lg transition-all text-center bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs';
                    if (tabBtnWhatsNew) tabBtnWhatsNew.className = 'py-2 px-3 text-xs font-semibold rounded-lg transition-all text-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
                    if (contentFeatures) contentFeatures.classList.remove('hidden');
                    if (contentWhatsNew) contentWhatsNew.classList.add('hidden');
                }
            };

            const contentWhatsNew = tabContentWhatsNew;
            const contentFeatures = tabContentAppFeatures;

            if (tabBtnWhatsNew) tabBtnWhatsNew.addEventListener('click', () => switchWhatsNewTab('whats-new'));
            if (tabBtnAppFeatures) tabBtnAppFeatures.addEventListener('click', () => switchWhatsNewTab('app-features'));

            const dismissWhatsNew = () => {
                if (typeof haptic !== 'undefined') haptic('light');
                if (whatsNewModal && !whatsNewModal.classList.contains('pointer-events-none')) {
                    toggleModal(whatsNewModal, false);
                }
                const curVer = (typeof self !== 'undefined' && self.APP_VERSION) || '2.3.0';
                localStorage.setItem('last_seen_version', curVer);

                // Fail-safe: ensure scroll is restored after exit transition
                setTimeout(() => {
                    if (typeof ScrollLock !== 'undefined' && !ScrollLock.isAnyModalOrPickerOpen()) {
                        ScrollLock.forceUnlock();
                    }
                }, 350);

                // Show first-time tutorial now that the user has closed the guide modal and is on the calculator
                setTimeout(() => {
                    showFirstTimeTutorial(AppState.lang);
                }, 500);
            };

            if (closeWhatsNewBtn) closeWhatsNewBtn.addEventListener('click', dismissWhatsNew);
            if (whatsNewGotItBtn) whatsNewGotItBtn.addEventListener('click', dismissWhatsNew);

            whatsNewModal.addEventListener('click', (e) => {
                if (e.target === whatsNewModal || e.target.classList.contains('modal-overlay')) {
                    dismissWhatsNew();
                }
            });

            if (openWhatsNewBtn) {
                openWhatsNewBtn.addEventListener('click', () => {
                    if (typeof haptic !== 'undefined') haptic('light');
                    if (aboutModal && !aboutModal.classList.contains('pointer-events-none')) {
                        toggleModal(aboutModal, false);
                    }
                    switchWhatsNewTab('whats-new');
                    toggleModal(whatsNewModal, true);
                });
            }

            // Automatic Check on Launch:
            const curVer = (typeof self !== 'undefined' && self.APP_VERSION) || '2.3.0';
            const lastSeen = localStorage.getItem('last_seen_version');
            if (!lastSeen) {
                // Newcomer -> Show App Guide (tutorial tooltip will trigger after user dismisses guide)
                switchWhatsNewTab('app-features');
                setTimeout(() => {
                    if (whatsNewModal.classList.contains('pointer-events-none')) {
                        toggleModal(whatsNewModal, true);
                    }
                }, 750);
            } else {
                const lastParts = lastSeen.split('.').map(n => parseInt(n, 10) || 0);
                const curParts = curVer.split('.').map(n => parseInt(n, 10) || 0);
                const isMajorMinorChange = curParts[0] !== lastParts[0] || curParts[1] !== lastParts[1];

                if (isMajorMinorChange) {
                    // Major / Minor Update -> Show What's New (tutorial tooltip will trigger after user dismisses)
                    switchWhatsNewTab('whats-new');
                    setTimeout(() => {
                        if (whatsNewModal.classList.contains('pointer-events-none')) {
                            toggleModal(whatsNewModal, true);
                        }
                    }, 750);
                } else {
                    if (lastSeen !== curVer) {
                        // Patch/Bugfix update only -> silently record new patch without popping up
                        localStorage.setItem('last_seen_version', curVer);
                    }
                    // No modal is shown on launch -> safe to trigger tutorial tooltip for first-time calculator use
                    setTimeout(() => {
                        showFirstTimeTutorial(AppState.lang);
                    }, 800);
                }
            }
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

    // Note: buildPrintReportHtmlDocument, printReport, and exportExcel are implemented in js/export.js (ExportManager)

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
    // Note: PWA install listeners & prompt capture are maintained in js/pwa-install.js

    function setupMobileKeyboard() {
        CORE_KEYS.forEach(key => { if (formInputs[key]) formInputs[key].setAttribute('enterkeyhint', 'go'); });
    }

    function handleKeyboard(e) {
        if (e.key === 'Escape') {
            // Skip if date picker is open - it handles its own Escape key
            if (typeof isDatePickerOpen === 'function' && isDatePickerOpen()) return;

            // Close dropdown menus
            const themeMenu = document.getElementById('theme-menu');
            const langMenu = document.getElementById('lang-menu');
            if (isMenuOpen(themeMenu)) closeMenu(themeMenu);
            if (isMenuOpen(langMenu)) closeMenu(langMenu);

            const aboutModal = document.getElementById('about-modal');
            const historyModal = document.getElementById('history-modal');
            const whatsNewModal = document.getElementById('whats-new-modal');
            const schedContainer = document.getElementById('schedule-container');

            if (whatsNewModal && !whatsNewModal.classList.contains('pointer-events-none')) toggleModal(whatsNewModal, false);
            else if (aboutModal && !aboutModal.classList.contains('pointer-events-none')) toggleModal(aboutModal, false);
            else if (historyModal && !historyModal.classList.contains('pointer-events-none')) toggleModal(historyModal, false);
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
                    const nextInput = getNextEditableCoreInput(el);
                    if (nextInput) nextInput.focus();
                }
                return;
            }
            const nextInput = getNextEditableCoreInput(el);
            if (nextInput) { e.preventDefault(); nextInput.focus(); return; }
            if (coreInputsFilled()) { e.preventDefault(); el.blur(); appCalculate(); }
        }
    }

    // --- Unified Developer Facade & Diagnostics ---
    window.LoanCalc = Object.freeze({
        get version() {
            return typeof APP_VERSION !== 'undefined' ? APP_VERSION : '';
        },
        getState() {
            return Object.assign({}, AppState);
        },
        getCollaterals() {
            return window.getCollaterals ? window.getCollaterals() : [];
        },
        calculate: () => appCalculate(),
        logic: {
            calculateLoan: (typeof calculateLoan === 'function') ? calculateLoan : null,
            calculateAmortizationSchedule: (typeof calculateAmortizationSchedule === 'function') ? calculateAmortizationSchedule : null,
            format: (typeof fmt === 'function') ? fmt : null
        },
        ui: {
            showSchedule: (typeof showScheduleUI === 'function') ? showScheduleUI : null,
            toggleModal: (typeof toggleModal === 'function') ? toggleModal : null,
            showToast: (typeof showToast === 'function') ? showToast : null
        },
        diagnostics() {
            return {
                version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'unknown',
                lang: document.documentElement.lang,
                dir: document.documentElement.dir,
                theme: document.documentElement.getAttribute('data-theme'),
                activeKey: AppState.activeKey,
                loanType: AppState.loanType,
                hasCollaterals: (typeof CollateralManager !== 'undefined' ? CollateralManager.get().length : 0),
                serviceWorkerActive: !!(navigator.serviceWorker && navigator.serviceWorker.controller)
            };
        }
    });

})(); // End IIFE

// js/ui.js - User Interface Functions & Theme Logic
// Fixed: Radio button logic, Translation fallbacks, Chart safety

const txt = {
    en: {
        appTitle: "Loan Calculator",
        inputSectionTitle: "Loan Details",
        loanAmountLabel: "Loan Amount",
        interestRateLabel: "Interest Rate (%)",
        loanPeriodLabel: "Period (months)",
        monthlyInstallmentLabel: "Monthly Installment",
        startDateLabel: "Start Date",
        bookingDateLabel: "Booking Date",
        advancedToggle: "Advanced Options",
        firstPaymentHint: "First Payment: ",
        inputPlaceholder: "Enter value",
        calcPlaceholder: "Result",
        totalSumLabel: "Total Payment",
        totalInterestLabel: "Total Interest",
        flatRateLabel: "Effective Flat Rate",
        firstInstLabel: "First Installment Date",
        firstInstAmountLabel: "First Installment",
        regularInstLabel: "Regular Installment",
        adminFeesLabel: "Admin Fees (%)",
        stampRateLabel: "Proportional Stamp (%)",
        stampRateHint: "Quarterly stamp on highest principal",
        totalStampLabel: "Total Stamp",
        stampIncluded: "+ Stamp",
        netLoanLabel: "Net Loan Amount",
        calculateBtn: "Calculate",
        computeButton: "CALCULATE",
        scheduleButton: "Schedule",
        scheduleButtonHide: "Hide Schedule",
        exportPdfButton: "PDF/Print",
        exportXlsxButton: "Excel",
        resetButton: "Reset Form",
        scheduleTitle: "Amortization Schedule",
        summaryTitle: "Loan Summary",
        chartTitle: "Distribution",
        colMonth: "No.",
        colDate: "Date",
        colStamp: "Stamp",
        colBalance: "Balance",
        colInterest: "Interest",
        colPrincipal: "Principal",
        colRemaining: "Remaining",
        selfSufficientMode: "Self-Sufficient Mode",
        ssDesc: "Calculate required Term Deposit to cover installments.",
        tdRateLabel: "TD Rate (%):",
        tdAmountLabel: "Your TD:",
        reqTdLabel: "Required TD:",
        netFlowLabel: "Net Flow:",
        chartLabelPrincipal: "Principal",
        chartLabelInterest: "Interest",
        installApp: "Install App",
        iosInstallHead: "Install this app on your iPhone:",
        iosInstallBody: "Tap",
        iosInstallFoot: "then select <strong>\"Add to Home Screen\"</strong>",
        aboutTitle: "About",
        aboutDesc: "A professional loan calculator PWA designed for accurate financial planning.",
        devContact: "Developer Contact",
        closeBtn: "Close",
        shareTitle: "Loan Calculator",
        shareText: "Check out this handy Loan Calculator app!",
        shareBtnLabel: "Share App",
        toastLinkCopied: "Link Copied!",
        toastSummaryCopied: "Summary copied to clipboard!",
        checkUpdates: "Check for Updates",
        updateCheck: "Checking...",
        updateOffline: "No internet connection",
        updateFail: "Update server unreachable",
        historyTitle: "Calculation History",
        savedOn: "Saved on",
        loadBtn: "Load",
        deleteBtn: "Delete",
        clearHistory: "Clear History",
        saveSuccess: "Saved to History!",
        calcSuccess: "Calculation complete!",
        noHistorySaved: "No history saved yet.",

        themeLight: "Light Mode",
        themeDark: "Dark Mode",
        themeSystem: "System Default",

        aboutBtn: "About App",
        themeBtn: "Change Theme",
        calcField: "Calculate this field",
        saveBtn: "Save to History",
        historyBtn: "View History",
        copySummaryBtn: "Copy Summary",
        radioHint: "Choose the value you want the calculator to solve",
        willBeCalculated: "Will be calculated",
        tutorialTooltip: "Tip: Select which field you want to calculate using the radio buttons",
        gotIt: "Got it!",

        // Early Settlement
        earlySettlementToggle: "Early Settlement Calculator",
        settlementDateLabel: "Settlement Date",
        earlySettlementFeeLabel: "Early Settlement Fee (%)",
        settlementSummaryTitle: "Settlement Summary",
        lastPaidInstLabel: "Last Paid Installment:",
        principalBalanceLabel: "Principal Balance:",
        settlementFeeLabel: "Early Settlement Fee:",
        accruedInterestLabel: "Accrued Interest",
        settlementStampLabel: "Quarter Stamp:",
        totalSettlementLabel: "Total Settlement:",
        noScheduleError: "Calculate loan first",

        // Error Messages
        errorCheckInputs: "Please check input fields.",
        errorCalculationFailed: "Calculation failed. Check inputs.",
        errorInvalidDate: "Invalid date format",
        errorDateOutOfRange: "Date must be between 2000-2099",
        errorDateDoesNotExist: "Date does not exist",
        errorLoanNotCalculated: "Please calculate loan details first.",

        // Offline & Compliance
        offlineMode: "Offline",
        offlineReady: "This app works fully offline.",
        localOnlyDisclaimer: "All calculations run locally. No data is transmitted.",

        // Button Tooltips
        langBtn: "Language",

        // Assumptions Panel
        assumptionsTitle: "Calculation Assumptions",
        assumptionInterestMethod: "• Interest CalculationMethod: Reducing Balance (Annuity)",
        assumptionDayCount: "• Day Count: 30/360 (US/NASD)",
        assumptionRounding: "• Rounding: 2 decimal places per installment",
        assumptionStampLogic: "• Stamp: Quarterly on highest principal balance",
        assumptionFeesLogic: "• Fees: Deducted upfront, not amortized",
        calculationIdLabel: "Calculation ID:",

        // Info Tooltips
        flatRateExplain: "Simple interest equivalent: (Total Interest ÷ Principal) ÷ Years × 100",
        firstInstExplain: "Interest calculated on actual days from booking to first payment date",
        totalStampExplain: "Quarterly stamp calculated on highest principal balance in each quarter",

        // Assumptions Disclaimer
        assumptionsDisclaimer: "This calculator provides estimates only. Results should not be considered final loan approval. Actual terms may vary.",

        // Date Picker
        monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        confirmDate: "Confirm",
        cancelDate: "Cancel",
        todayDate: "Today"
    },
    ar: {
        appTitle: "حاسبة القروض",
        inputSectionTitle: "تفاصيل القرض",
        loanAmountLabel: "مبلغ القرض",
        interestRateLabel: "الفائدة السنوية (%)",
        loanPeriodLabel: "المدة (أشهر)",
        monthlyInstallmentLabel: "القسط الشهري",
        startDateLabel: "تاريخ البداية",
        bookingDateLabel: "تاريخ المنح",
        advancedToggle: "خيارات متقدمة",
        firstPaymentHint: "أول قسط: ",
        inputPlaceholder: "أدخل القيمة",
        calcPlaceholder: "النتيجة",
        totalSumLabel: "إجمالي الدفعات",
        totalInterestLabel: "إجمالي الفائدة",
        flatRateLabel: "معدل الفائدة الثابت",
        firstInstLabel: "تاريخ القسط الأول",
        firstInstAmountLabel: "القسط الأول",
        regularInstLabel: "القسط الشهري",
        adminFeesLabel: "مصاريف إدارية (%)",
        stampRateLabel: "الدمغة النسبية (%)",
        stampRateHint: "دمغة ربع سنوية على أعلى رصيد أصل",
        totalStampLabel: "إجمالي الدمغة",
        stampIncluded: "+ دمغة",
        netLoanLabel: "صافي قيمة القرض",
        calculateBtn: "احسب",
        computeButton: "احسب",
        scheduleButton: "الجدول",
        scheduleButtonHide: "إخفاء الجدول",
        exportPdfButton: "PDF/طباعة",
        exportXlsxButton: "Excel ملف",
        resetButton: "إعادة تعيين",
        scheduleTitle: "جدول سداد الأقساط",
        summaryTitle: "ملخص القرض",
        chartTitle: "التوزيع",
        colMonth: "رقم",
        colDate: "التاريخ",
        colStamp: "الدمغة",
        colBalance: "الرصيد",
        colInterest: "الفائدة",
        colPrincipal: "الأصل",
        colRemaining: "المتبقي",
        selfSufficientMode: "وضع الاكتفاء الذاتي",
        ssDesc: "حساب الوديعة المطلوبة لتغطية الأقساط.",
        tdRateLabel: "فائدة الوديعة (%):",
        tdAmountLabel: "وديعتك الحالية:",
        reqTdLabel: "الوديعة المطلوبة:",
        netFlowLabel: "صافي التدفق:",
        chartLabelPrincipal: "أصل القرض",
        chartLabelInterest: "إجمالي الفائدة",
        installApp: "تثبيت التطبيق",
        iosInstallHead: "لتثبيت التطبيق على الآيفون:",
        iosInstallBody: "اضغط على",
        iosInstallFoot: "ثم اختر <strong>\"إضافة إلى الشاشة الرئيسية\"</strong>",
        aboutTitle: "عن التطبيق",
        aboutDesc: "تطبيق حاسبة قروض احترافي مصمم للتخطيط المالي الدقيق.",
        devContact: "معلومات المطور",
        closeBtn: "إغلاق",
        shareTitle: "حاسبة القروض",
        shareText: "جرب تطبيق حاسبة القروض المميز!",
        shareBtnLabel: "مشاركة التطبيق",
        toastLinkCopied: "تم نسخ الرابط!",
        toastSummaryCopied: "تم نسخ الملخص!",
        checkUpdates: "تحقق من التحديثات",
        updateCheck: "جاري التحقق...",
        updateOffline: "لا يوجد اتصال بالإنترنت",
        updateFail: "تعذر الاتصال بالخادم",
        historyTitle: "سجل الحسابات",
        savedOn: "تم الحفظ في",
        loadBtn: "تحميل",
        deleteBtn: "حذف",
        clearHistory: "محو السجل",
        saveSuccess: "تم الحفظ في السجل!",
        calcSuccess: "تمت العملية بنجاح!",
        noHistorySaved: "لا يوجد سجل محفوظ.",

        themeLight: "الوضع الفاتح",
        themeDark: "الوضع الداكن",
        themeSystem: "وضع النظام",

        aboutBtn: "عن التطبيق",
        themeBtn: "تغيير المظهر",
        calcField: "حساب هذا الحقل",
        saveBtn: "حفظ في السجل",
        historyBtn: "عرض السجل",
        copySummaryBtn: "نسخ الملخص",
        radioHint: "اختر القيمة التي سيتم حسابها تلقائيًا",
        willBeCalculated: "سيتم الحساب تلقائياً",
        tutorialTooltip: "تلميح: اختر الحقل الذي تريد حسابه باستخدام أزرار الاختيار",
        gotIt: "فهمت!",

        // Early Settlement
        earlySettlementToggle: "حاسبة السداد المبكر",
        settlementDateLabel: "تاريخ السداد",
        earlySettlementFeeLabel: "عمولة السداد المبكر (%)",
        settlementSummaryTitle: "ملخص السداد",
        lastPaidInstLabel: "آخر قسط مدفوع:",
        principalBalanceLabel: "رصيد الأصل:",
        settlementFeeLabel: "عمولة السداد المبكر:",
        accruedInterestLabel: "العائد حتى تاريخه",
        settlementStampLabel: "دمغة مستحقة:",
        totalSettlementLabel: "إجمالي السداد:",
        noScheduleError: "احسب القرض أولاً",

        // Error Messages
        errorCheckInputs: "يرجى التحقق من حقول الإدخال.",
        errorCalculationFailed: "فشل الحساب. تحقق من المدخلات.",
        errorInvalidDate: "صيغة التاريخ غير صحيحة",
        errorDateOutOfRange: "التاريخ يجب أن يكون بين 2000 و 2099",
        errorDateDoesNotExist: "التاريخ غير موجود",
        errorLoanNotCalculated: "يرجى حساب تفاصيل القرض أولاً.",

        // Offline & Compliance
        offlineMode: "غير متصل",
        offlineReady: "هذا التطبيق يعمل بالكامل بدون إنترنت.",
        localOnlyDisclaimer: "جميع الحسابات تتم محلياً. لا يتم إرسال أي بيانات.",

        // Button Tooltips
        langBtn: "اللغة",

        // Assumptions Panel
        assumptionsTitle: "افتراضات الحساب",
        assumptionInterestMethod: "• طريقة احتساب الفائدة: الرصيد المتناقص (الأقساط المتساوية)",
        assumptionDayCount: "• احتساب الأيام: 30/360",
        assumptionRounding: "• التقريب: 2 خانة عشرية لكل قسط",
        assumptionStampLogic: "• الدمغة: ربع سنوية على أعلى رصيد أصل",
        assumptionFeesLogic: "• الرسوم: تخصم مقدماً، لا يتم توزيعها على الأقساط",
        calculationIdLabel: "رمز العملية:",

        // Info Tooltips
        flatRateExplain: "معادل الفائدة البسيطة: (إجمالي الفائدة ÷ أصل القرض) ÷ السنوات × 100",
        firstInstExplain: "الفائدة محسوبة على الأيام الفعلية من تاريخ المنح حتى تاريخ أول قسط",
        totalStampExplain: "دمغة ربع سنوية محسوبة على أعلى رصيد أصل في كل ربع",

        // Assumptions Disclaimer
        assumptionsDisclaimer: "هذه الحاسبة تقدم تقديرات فقط. لا ينبغي اعتبار النتائج موافقة نهائية على القرض. قد تختلف الشروط الفعلية بناءً على سياسات الجهة المُقرضة.",

        // Date Picker
        monthNames: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
        dayNamesShort: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
        confirmDate: "تأكيد",
        cancelDate: "إلغاء",
        todayDate: "اليوم"
    }
};

/**
 * Safe translation getter with fallback to English, then key name
 * @param {string} lang - Language code ('en' or 'ar')
 * @param {string} key - Translation key
 * @returns {string} Translated text or key as fallback
 */
function t(lang, key) {
    if (txt[lang] && txt[lang][key]) return txt[lang][key];
    if (txt['en'] && txt['en'][key]) return txt['en'][key];
    return key; // Return key as last resort so it's visible
}

let chartInst = null;
let modalTimer = null;
let toastTimer = null;

// Debug mode flag - set to true during development
const DEBUG_MODE = false;

/* ================= ANDROID BACK BUTTON HANDLER ================= */
/**
 * Manages Android back button/gesture behavior for PWA modals.
 * Uses History API to intercept back navigation and close modals instead of exiting.
 * 
 * How it works:
 * 1. When a modal opens -> pushState adds a history entry
 * 2. When back button pressed -> popstate fires -> close the modal
 * 3. When modal closed normally -> history.back() removes the entry
 */
const BackHandler = (() => {
    // Stack of currently open modal identifiers
    const modalStack = [];

    // Map of modal IDs to their close functions
    const closeHandlers = {};

    // Flag to prevent recursive popstate handling
    let isHandlingPopstate = false;

    // Flag to ignore popstate events we trigger ourselves
    let isIgnoringPopstate = false;

    /**
     * Register a modal as open - pushes history state
     * @param {string} modalId - Unique identifier for the modal
     * @param {function} closeHandler - Function to call to close this modal
     */
    function push(modalId, closeHandler) {
        if (modalStack.includes(modalId)) return; // Already tracked

        modalStack.push(modalId);
        closeHandlers[modalId] = closeHandler;

        // Push a new history state with HASH to prevent predictive back page preview
        // Fragment changes are treated as same-document navigation
        const hash = '#modal-' + modalId;
        history.pushState({ modal: modalId }, '', hash);

        if (DEBUG_MODE) console.log('BackHandler: pushed', modalId, 'stack:', [...modalStack]);
    }

    /**
     * Unregister a modal when closed normally (not via back button)
     * @param {string} modalId - Unique identifier for the modal
     */
    function pop(modalId) {
        const index = modalStack.indexOf(modalId);
        if (index === -1) return; // Not tracked

        modalStack.splice(index, 1);
        delete closeHandlers[modalId];

        // Go back in history to remove the state we pushed (only if not already handling popstate)
        if (!isHandlingPopstate) {
            // Set flag to ignore the resulting popstate event
            isIgnoringPopstate = true;
            history.back();
        }

        if (DEBUG_MODE) console.log('BackHandler: popped', modalId, 'stack:', [...modalStack]);
    }

    /**
     * Check if a modal is currently tracked as open
     * @param {string} modalId - Unique identifier for the modal
     * @returns {boolean}
     */
    function isOpen(modalId) {
        return modalStack.includes(modalId);
    }

    /**
     * Handle popstate event (back button pressed)
     */
    function handlePopstate(e) {
        // Ignore popstate events we triggered ourselves (from pop())
        if (isIgnoringPopstate) {
            isIgnoringPopstate = false;
            return;
        }

        // If there's a modal in the stack, close it
        if (modalStack.length > 0) {
            isHandlingPopstate = true;

            const modalId = modalStack.pop();
            const closeHandler = closeHandlers[modalId];
            delete closeHandlers[modalId];

            if (DEBUG_MODE) console.log('BackHandler: popstate closing', modalId);

            if (closeHandler && typeof closeHandler === 'function') {
                closeHandler();
            }

            isHandlingPopstate = false;
        }
        // If no modals open, let the default back behavior happen (exit app or navigate)
    }

    /**
     * Initialize the back handler
     */
    function init() {
        // Set scroll restoration to manual to prevent browser from
        // trying to restore position on back/forward, which might help
        // reduce visual jumping during predictive scenarios.
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        window.addEventListener('popstate', handlePopstate);
        if (DEBUG_MODE) console.log('BackHandler: initialized');
    }

    return {
        push,
        pop,
        isOpen,
        init
    };
})();

// Flag to prevent double reloads
let isReloading = false;

function initPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                if (DEBUG_MODE) console.log('SW registered');

                // Listen for new service worker updates
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            // When new SW is installed and waiting, show update prompt
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateBanner();
                            }
                        });
                    }
                });
            })
            .catch(err => { if (DEBUG_MODE) console.warn('SW registration failed:', err); });

        // Also listen for controller changes (new SW took over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // A new service worker has taken control, reload for clean state
            if (!isReloading) {
                isReloading = true;
                window.location.reload();
            }
        });
    }
}

// Show "New version available" banner
function showUpdateBanner() {
    // Don't show if already visible
    if (document.getElementById('update-banner')) return;

    const lang = document.documentElement.lang || 'en';
    const message = lang === 'ar' ? 'يتوفر إصدار جديد' : 'New version available';
    const btnText = lang === 'ar' ? 'تحديث' : 'Refresh';

    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-xl z-50 flex items-center justify-between gap-3 animate-slide-up';
    banner.innerHTML = `
        <div class="flex items-center gap-2">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span class="text-sm font-medium">${message}</span>
        </div>
        <button id="update-refresh-btn" class="px-3 py-1 bg-white text-indigo-600 text-sm font-bold rounded hover:bg-indigo-50 transition-colors flex-shrink-0">
            ${btnText}
        </button>
    `;
    document.body.appendChild(banner);

    document.getElementById('update-refresh-btn').addEventListener('click', () => {
        // Skip waiting on new SW and reload
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(reg => {
                if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        }
        // Reload after short delay to allow message to be processed
        // (Fallback if controllerchange doesn't fire fast enough)
        setTimeout(() => {
            if (!isReloading) {
                isReloading = true;
                window.location.reload();
            }
        }, 500);
    });
}

function initOfflineIndicator() {
    const badge = document.getElementById('offline-badge');
    if (!badge) return;

    const updateStatus = () => {
        if (navigator.onLine) {
            badge.classList.add('hidden');
            badge.classList.remove('flex');
        } else {
            badge.classList.remove('hidden');
            badge.classList.add('flex');
        }
    };

    // Initial check
    updateStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Show one-time "works offline" toast on first install
    const offlineReadyShown = localStorage.getItem('offlineReadyShown');
    if (!offlineReadyShown && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
            setTimeout(() => {
                const lang = document.documentElement.lang || 'en';
                showToast(t(lang, 'offlineReady'));
                localStorage.setItem('offlineReadyShown', 'true');
            }, 1500);
        });
    }
}

/* ================= ADAPTIVE HAPTIC FEEDBACK ================= */

/**
 * Adaptive Haptic Feedback Utility
 * Detects device capability and adjusts vibration patterns automatically
 * 
 * Usage: haptic('success') or haptic() for default light tap
 * Check support: haptic.isSupported
 * Check tier: haptic.tier ('premium' | 'standard')
 */
const haptic = (() => {
    const isSupported = 'vibrate' in navigator;

    // Device capability detection heuristics
    const detectTier = () => {
        if (!isSupported) return 'none';

        const ua = navigator.userAgent.toLowerCase();

        // Premium tier: Devices with Linear Resonant Actuators (LRA)
        // - iPhones (Taptic Engine since iPhone 7)
        // - Samsung Galaxy S/Note/Z series (since S8)
        // - Google Pixel (since Pixel 2)
        // - OnePlus flagships
        const premiumPatterns = [
            /iphone/,                           // All iPhones have Taptic Engine
            /ipad/,                             // iPads too
            /galaxy\s*(s[89]|s1\d|s2\d|note|z)/,// Samsung flagships
            /pixel\s*[2-9]/,                    // Google Pixel 2+
            /oneplus/,                          // OnePlus devices
            /huawei\s*(p[234]\d|mate)/,         // Huawei flagships
            /xiaomi\s*(mi\s*1[0-9]|12|13|14)/,  // Xiaomi flagships
        ];

        for (const pattern of premiumPatterns) {
            if (pattern.test(ua)) return 'premium';
        }

        // Check for high-end indicators
        const hasHighMemory = navigator.deviceMemory && navigator.deviceMemory >= 6;
        const hasManyCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 6;

        if (hasHighMemory && hasManyCores) return 'premium';

        return 'standard'; // Budget/mid-range devices with ERM motors
    };

    const tier = detectTier();

    // Adaptive patterns based on device tier
    const patterns = tier === 'premium' ? {
        // Premium: Crisp, short patterns for LRA motors
        light: 10,
        medium: 30,
        heavy: 50,
        success: [30, 50, 30],
        error: [50, 100, 50, 100]
    } : {
        // Standard: Longer patterns for ERM motors (need spin-up time)
        light: 25,
        medium: 50,
        heavy: 80,
        success: [50, 80, 50],
        error: [80, 100, 80, 100]
    };

    // Main haptic function
    const fn = (type = 'light') => {
        if (!isSupported) return;
        navigator.vibrate(patterns[type] || patterns.light);
    };

    // Expose properties
    fn.isSupported = isSupported;
    fn.tier = tier;
    fn.patterns = patterns;

    return fn;
})();

function initTheme(lastRes) {
    const savedTheme = localStorage.getItem('theme') || 'system';
    applyTheme(savedTheme, lastRes);
}

function applyTheme(themeMode, lastRes) {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = themeMode === 'dark' || (themeMode === 'system' && isSystemDark);

    document.documentElement.setAttribute('data-theme', themeMode);

    if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        document.getElementById('meta-theme-color')?.setAttribute('content', '#020617');
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('meta-theme-color')?.setAttribute('content', '#f9fafb');
    }

    if (lastRes && lastRes.P) {
        drawChart(lastRes.P, lastRes.TI, document.documentElement.lang);
    }
}

/**
 * Updates all UI text elements based on selected language
 * @param {string} lang - Language code ('en' or 'ar')
 */
function updateLangUI(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-lang-key]').forEach(e => {
        if (e.id === 'date-label') {
            // Always use bookingDateLabel since this field is only visible in advanced mode
            e.textContent = t(lang, 'bookingDateLabel');
        }
        else if (e.dataset.langKey === 'iosMsg') {
            const shareIcon = `<svg class="w-5 h-5 inline text-blue-400 mx-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>`;
            e.innerHTML = `${t(lang, 'iosInstallBody')} ${shareIcon} ${t(lang, 'iosInstallFoot')}`;
        }
        else {
            e.textContent = t(lang, e.dataset.langKey);
        }
    });

    const inputIds = ['loan-amount', 'interest-rate', 'loan-period', 'monthly-installment', 'early-settlement-fee', 'admin-fees', 'stamp-rate', 'td-rate', 'td-amount'];
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const isReadOnly = el.hasAttribute('readonly');
            el.placeholder = isReadOnly ? t(lang, 'willBeCalculated') : t(lang, 'inputPlaceholder');
        }
    });

    const startDateDisplay = document.getElementById('start-date-display');
    const firstInstDateDisplay = document.getElementById('first-inst-date-display');
    if (startDateDisplay) startDateDisplay.placeholder = "DD/MM/YYYY";
    if (firstInstDateDisplay) firstInstDateDisplay.placeholder = "DD/MM/YYYY";

    const installSpan = document.getElementById('install-button')?.querySelector('span');
    if (installSpan) installSpan.textContent = t(lang, 'installApp');

    // Tooltips for existing elements
    document.querySelectorAll('[data-lang-title]').forEach(e => {
        const key = e.dataset.langTitle;
        e.title = t(lang, key);
    });

    // Tooltips for new Radio Buttons
    document.querySelectorAll('input[type="radio"][name="calc-target"]').forEach(radio => {
        radio.title = t(lang, 'calcField');
    });

    // Info icon tooltips (custom CSS tooltip uses data-tooltip)
    document.querySelectorAll('[data-lang-tooltip]').forEach(el => {
        const key = el.dataset.langTooltip;
        el.dataset.tooltip = t(lang, key);
    });
}

/**
 * Shows a toast notification message
 * @param {string} message - Message to display
 * @param {string} [type='normal'] - Toast type ('normal' or 'error')
 */
function showToast(message, type = 'normal') {
    const msgBox = document.getElementById('message-box');
    if (!msgBox) return;

    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }

    msgBox.textContent = message;
    msgBox.style.zIndex = "100";

    const baseClasses = 'fixed top-24 left-0 right-0 mx-auto w-fit max-w-[90vw] z-[100] px-6 py-3 rounded-lg text-white font-medium shadow-2xl text-sm text-center transition-all duration-300 ease-out transform';

    let colorClasses;
    if (type === 'error') {
        colorClasses = 'bg-red-600 border-2 border-white/20 font-bold';
    } else if (type === 'success') {
        colorClasses = 'bg-green-600 border border-green-500';
    } else {
        colorClasses = 'bg-gray-800 dark:bg-gray-700 border border-gray-700 dark:border-gray-600';
    }

    // Start state: hidden above, fully transparent
    msgBox.className = `${baseClasses} ${colorClasses} opacity-0 -translate-y-3`;
    msgBox.classList.remove('hidden');

    void msgBox.offsetWidth; // Force reflow

    // End state: in position, fully visible
    msgBox.classList.remove('opacity-0', '-translate-y-3');
    msgBox.classList.add('opacity-100', 'translate-y-0');

    toastTimer = setTimeout(() => {
        msgBox.classList.remove('opacity-100', 'translate-y-0');
        msgBox.classList.add('opacity-0', '-translate-y-3');

        setTimeout(() => {
            msgBox.classList.add('hidden');
        }, 300);
    }, 4000);
}

/**
 * Hides the toast notification immediately
 */
function hideToast() {
    const msgBox = document.getElementById('message-box');
    if (!msgBox) return;

    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }

    msgBox.classList.remove('opacity-100', 'translate-y-0');
    msgBox.classList.add('opacity-0', '-translate-y-3');

    setTimeout(() => {
        msgBox.classList.add('hidden');
    }, 300);
}

// Helper to dismiss all stamp tooltips
function dismissStampTooltips() {
    const tooltips = document.querySelectorAll('.stamp-tooltip');
    tooltips.forEach(tooltip => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = tooltip.style.transform.replace('scale(1)', 'scale(0.8)');
        setTimeout(() => tooltip.remove(), 200);
    });
}

// Add global listeners for tooltip dismissal
window.addEventListener('scroll', dismissStampTooltips, { capture: true, passive: true });
window.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.stamp-row')) dismissStampTooltips();
}, { passive: true });
window.addEventListener('wheel', dismissStampTooltips, { passive: true });

function toggleModal(modal) {
    if (!modal) return;
    const isOpening = modal.classList.contains('pointer-events-none');
    const modalId = modal.id || 'unknown-modal';

    modal.classList.toggle('pointer-events-none');

    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) overlay.classList.toggle('opacity-0');

    const container = modal.querySelector('.modal-container');
    if (container) {
        container.classList.toggle('translate-y-full');
        container.classList.toggle('md:opacity-0');
        container.classList.toggle('md:scale-95');
    }

    if (modalTimer) clearTimeout(modalTimer);

    if (isOpening) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
            const pad = `${scrollbarWidth}px`;
            document.body.style.paddingRight = pad;
            const nav = document.querySelector('nav');
            if (nav) nav.style.paddingRight = pad;
            // Compensate fixed elements for scrollbar width
            const updateBanner = document.getElementById('update-banner');
            if (updateBanner) updateBanner.style.paddingRight = pad;
        }
        document.body.classList.add('scroll-lock');

        // Register with BackHandler for Android back button support
        if (typeof BackHandler !== 'undefined') {
            BackHandler.push(modalId, () => toggleModal(modal));
        }
    } else {
        modalTimer = setTimeout(() => {
            document.body.classList.remove('scroll-lock');
            document.body.style.paddingRight = '';
            const nav = document.querySelector('nav');
            if (nav) nav.style.paddingRight = '';
            // Reset fixed elements
            const updateBanner = document.getElementById('update-banner');
            if (updateBanner) updateBanner.style.paddingRight = '';
        }, 300);

        // Unregister from BackHandler
        if (typeof BackHandler !== 'undefined') {
            BackHandler.pop(modalId);
        }
    }
}

// Lazy loading promise for Chart.js
let chartLoadPromise = null;

/**
 * Lazy load Chart.js library on first use
 * @returns {Promise} Resolves when Chart.js is loaded
 */
function loadChartJS() {
    // Return existing promise if already loading
    if (chartLoadPromise) return chartLoadPromise;

    // Return immediately if already loaded
    if (typeof Chart !== 'undefined') {
        return Promise.resolve();
    }

    chartLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './chart.js';
        script.async = true;

        script.onload = () => {
            if (DEBUG_MODE) console.log('Chart.js loaded lazily');
            resolve();
        };

        script.onerror = () => {
            chartLoadPromise = null; // Allow retry
            reject(new Error('Failed to load Chart.js'));
        };

        document.head.appendChild(script);
    });

    return chartLoadPromise;
}

/**
 * Draw pie chart - loads Chart.js lazily on first call
 * @param {number} principal - Loan principal amount
 * @param {number} interest - Total interest amount
 * @param {string} lang - Language code for labels
 */
function drawChart(principal, interest, lang) {
    const canvas = document.getElementById('loan-chart');
    if (!canvas) return; // Safety check

    // Load Chart.js lazily, then render
    loadChartJS().then(() => {
        renderChart(canvas, principal, interest, lang);
    }).catch(err => {
        console.error('Chart loading failed:', err);
    });
}

/**
 * Internal chart rendering (called after Chart.js is loaded)
 */
function renderChart(canvas, principal, interest, lang) {
    const ctx = canvas.getContext('2d');
    if (chartInst) chartInst.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    const colorText = isDark ? '#e5e7eb' : '#374151';

    let data = [1, 0];
    let bgColors = ['#e5e7eb', '#e5e7eb'];

    if (principal && principal > 0) {
        data = [principal, interest];
        bgColors = ['#3b82f6', '#ef4444'];
    }

    chartInst = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [t(lang, 'chartLabelPrincipal'), t(lang, 'chartLabelInterest')],
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderColor: isDark ? '#1f2937' : '#fff',
                borderWidth: 2
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: colorText, font: { family: 'system-ui, sans-serif' } }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function formatCurrencyInput(input) {
    if (!input) return;
    let selectionStart = input.selectionStart;
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
            // Use Intl.NumberFormat to avoid ReDoS vulnerability (CWE-1333)
            // BigInt handles arbitrary precision for large loan amounts
            try {
                formattedInt = new Intl.NumberFormat('en-US').format(BigInt(integerPart));
            } catch (e) {
                console.warn('Currency formatting error:', e);
                formattedInt = integerPart; // Fallback
            }
        }

        newVal = formattedInt + decimalPart;
    }
    input.value = newVal;
    restoreCursorPosition(input, oldVal, newVal, selectionStart);
}

/**
 * Helper to restore cursor position after formatting
 */
function restoreCursorPosition(input, oldVal, newVal, selectionStart) {
    let oldCommas = (oldVal.slice(0, selectionStart).match(/,/g) || []).length;
    let newCommas = (newVal.slice(0, selectionStart).match(/,/g) || []).length;

    if (oldVal !== newVal) {
        if (selectionStart < oldVal.length) {
            let newPos = selectionStart + (newCommas - oldCommas);
            newPos = Math.max(0, Math.min(newPos, newVal.length));
            try { input.setSelectionRange(newPos, newPos); } catch (e) { /* Ignore - some input types don't support selection */ }
        }
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

/* ================= DATE INPUT - BEST PRACTICE IMPLEMENTATION ================= */

const DATE_CONFIG = {
    MIN_DATE: "2000-01-01",
    MAX_DATE: "2099-12-31"
};

/* --- Date Helpers --- */

function dateIsValid(d, m, y) {
    const date = new Date(y, m - 1, d);
    return (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d
    );
}

function dateToISO(d, m, y) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function dateCompareISO(a, b) {
    return new Date(a) - new Date(b);
}

function dateIsWithinRange(iso) {
    if (dateCompareISO(iso, DATE_CONFIG.MIN_DATE) < 0) return false;
    if (dateCompareISO(iso, DATE_CONFIG.MAX_DATE) > 0) return false;
    return true;
}

function dateGetSegmentByCursor(pos) {
    if (pos <= 2) return { start: 0, end: 2 };   // DD
    if (pos <= 5) return { start: 3, end: 5 };   // MM
    return { start: 6, end: 10 };                // YYYY
}

/**
 * Navigate between date segments with arrow keys
 * ArrowLeft = previous segment (toward DD), ArrowRight = next segment (toward YYYY)
 * Consistent in both LTR and RTL modes since date format is always DD/MM/YYYY
 */
function handleDateLateralArrow(e, input) {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return false;

    const cursor = input.selectionStart;
    const currentSeg = dateGetSegmentByCursor(cursor);

    // Segment positions: DD(0-2), MM(3-5), YYYY(6-10)
    let newSeg = null;

    if (e.key === 'ArrowRight') {
        // Move from DD -> MM -> YYYY
        if (currentSeg.start === 0) {
            newSeg = { start: 3, end: 5 };   // DD -> MM
        } else if (currentSeg.start === 3) {
            newSeg = { start: 6, end: 10 };  // MM -> YYYY
        }
        // Already at YYYY: stay there
    } else {
        // ArrowLeft: Move from YYYY -> MM -> DD
        if (currentSeg.start === 6) {
            newSeg = { start: 3, end: 5 };   // YYYY -> MM
        } else if (currentSeg.start === 3) {
            newSeg = { start: 0, end: 2 };   // MM -> DD
        }
        // Already at DD: stay there
    }

    if (newSeg) {
        e.preventDefault();
        input.setSelectionRange(newSeg.start, newSeg.end);
        return true;
    }

    return false;
}

/* --- Input Mask Handler (Segment-Aware) --- */

function handleDateInputMask(input, nativeInput, errorCallback) {
    const oldValue = input.value;
    const cursor = input.selectionStart;

    // Parse existing segments from the current value
    const parts = oldValue.split('/');
    let day = (parts[0] || '').replace(/\D/g, '').slice(0, 2);
    let month = (parts[1] || '').replace(/\D/g, '').slice(0, 2);
    let year = (parts[2] || '').replace(/\D/g, '').slice(0, 4);

    // Determine which segment the cursor is in (based on old value)
    let cursorSegment = 0; // 0 = day, 1 = month, 2 = year
    const firstSlash = oldValue.indexOf('/');
    const secondSlash = oldValue.indexOf('/', firstSlash + 1);

    if (firstSlash === -1 || cursor <= firstSlash) {
        cursorSegment = 0;
    } else if (secondSlash === -1 || cursor <= secondSlash) {
        cursorSegment = 1;
    } else {
        cursorSegment = 2;
    }

    // Build new value preserving segment structure
    let newValue = day;

    // Only add slashes if we have content or are past that segment
    if (month.length > 0 || year.length > 0 || day.length === 2) {
        newValue += '/';
        newValue += month;
    }

    if (year.length > 0 || month.length === 2) {
        newValue += '/';
        newValue += year;
    }

    // Calculate new cursor position within the segment
    let newCursor;
    let newCursorEnd; // For selection range (start, end)

    // Auto-advance: if segment is complete, move to next segment
    if (cursorSegment === 0 && day.length === 2) {
        // Day complete -> move to month, select it if has data
        newCursor = 3; // After "DD/"
        newCursorEnd = month.length > 0 ? 3 + month.length : 3;
    } else if (cursorSegment === 1 && month.length === 2) {
        // Month complete -> move to year, select it if has data
        newCursor = 6; // After "DD/MM/"
        newCursorEnd = year.length > 0 ? 6 + year.length : 6;
    } else {
        // Normal cursor positioning within segment (no selection)
        if (cursorSegment === 0) {
            newCursor = Math.min(cursor, day.length);
        } else if (cursorSegment === 1) {
            const monthStart = day.length + 1; // After "DD/"
            const offsetInMonth = cursor - (firstSlash + 1);
            newCursor = monthStart + Math.min(Math.max(0, offsetInMonth), month.length);
        } else {
            const yearStart = day.length + 1 + month.length + 1; // After "DD/MM/"
            const offsetInYear = cursor - (secondSlash + 1);
            newCursor = yearStart + Math.min(Math.max(0, offsetInYear), year.length);
        }
        newCursorEnd = newCursor; // No selection
    }

    // Clamp to valid range
    newCursor = Math.max(0, Math.min(newCursor, newValue.length));
    newCursorEnd = Math.max(0, Math.min(newCursorEnd, newValue.length));

    input.value = newValue;

    // Restore cursor position (with potential selection)
    requestAnimationFrame(() => {
        input.setSelectionRange(newCursor, newCursorEnd);
    });

    // Validate if complete
    validateDateInputAndSync(input, nativeInput, errorCallback);
}

/* --- Validation & Sync --- */

function validateDateInputAndSync(input, nativeInput, errorCallback) {
    const parts = input.value.split('/');

    if (parts.length !== 3) {
        input.classList.remove('text-red-500');
        return false;
    }

    const [dd, mm, yyyy] = parts.map(s => s.trim());

    if (dd.length !== 2 || mm.length !== 2 || yyyy.length !== 4) {
        input.classList.remove('text-red-500');
        return false;
    }

    const d = parseInt(dd, 10);
    const m = parseInt(mm, 10);
    const y = parseInt(yyyy, 10);

    // Get current language
    const lang = document.documentElement.lang || 'en';

    if (!d || !m || !y || y < 1000) {
        input.classList.add('text-red-500');
        if (errorCallback) errorCallback(t(lang, 'errorInvalidDate'));
        return false;
    }

    if (!dateIsValid(d, m, y)) {
        input.classList.add('text-red-500');
        if (errorCallback) errorCallback(t(lang, 'errorDateDoesNotExist'));
        return false;
    }

    const iso = dateToISO(d, m, y);

    if (!dateIsWithinRange(iso)) {
        input.classList.add('text-red-500');
        if (errorCallback) errorCallback(t(lang, 'errorDateOutOfRange'));
        return false;
    }

    // Valid! Sync to native input
    input.classList.remove('text-red-500');
    input.dataset.iso = iso;
    nativeInput.value = iso;
    nativeInput.dispatchEvent(new Event('change'));
    return true;
}

/* --- Arrow Key Increment --- */

function handleDateArrowKey(e, input, nativeInput) {
    if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;

    // Get ISO from dataset, or try to parse from display value
    let iso = input.dataset.iso;

    if (!iso) {
        // Try to parse current display value (DD/MM/YYYY)
        const parts = input.value.split('/');
        if (parts.length === 3) {
            const [dd, mm, yyyy] = parts.map(s => s.trim());
            if (dd.length === 2 && mm.length === 2 && yyyy.length === 4) {
                const d = parseInt(dd, 10);
                const m = parseInt(mm, 10);
                const y = parseInt(yyyy, 10);
                if (dateIsValid(d, m, y)) {
                    iso = dateToISO(d, m, y);
                    input.dataset.iso = iso;
                    nativeInput.value = iso;
                }
            }
        }
    }

    if (!iso) return;

    e.preventDefault();

    const delta = e.key === 'ArrowUp' ? 1 : -1;
    const cursor = input.selectionStart;
    const seg = dateGetSegmentByCursor(cursor);

    const date = new Date(iso);

    // Increment based on cursor position
    if (seg.start === 0) {
        date.setDate(date.getDate() + delta);
    } else if (seg.start === 3) {
        date.setMonth(date.getMonth() + delta);
    } else {
        date.setFullYear(date.getFullYear() + delta);
    }

    const newISO = date.toISOString().slice(0, 10);
    if (!dateIsWithinRange(newISO)) return;

    const [y, m, d] = newISO.split('-');
    input.value = `${d}/${m}/${y}`;
    input.dataset.iso = newISO;
    nativeInput.value = newISO;

    // Restore segment selection
    input.setSelectionRange(seg.start, seg.end);
}

/* --- Segment Selection Handlers --- */

function handleDateFocus(input) {
    if (!input.value) return;

    requestAnimationFrame(() => {
        const seg = dateGetSegmentByCursor(input.selectionStart || 0);
        input.setSelectionRange(seg.start, seg.end);
    });
}

function handleDateClick(input) {
    requestAnimationFrame(() => {
        const seg = dateGetSegmentByCursor(input.selectionStart);
        input.setSelectionRange(seg.start, seg.end);
    });
}

function handleDateDblClick(e, input) {
    e.preventDefault();
    const seg = dateGetSegmentByCursor(input.selectionStart);
    input.setSelectionRange(seg.start, seg.end);
}

/* --- Main Initialization Function --- */

function initDateInput(displayInput, nativeInput) {
    if (!displayInput || !nativeInput) return;

    // Set min/max on native picker
    nativeInput.min = DATE_CONFIG.MIN_DATE;
    nativeInput.max = DATE_CONFIG.MAX_DATE;

    // Track composition state for Android keyboard compatibility
    // Android keyboards (Gboard, Samsung) use composition events for predictive text
    // During composition, we skip processing to avoid cursor jumping issues
    let isComposing = false;

    displayInput.addEventListener('compositionstart', () => {
        isComposing = true;
    });

    displayInput.addEventListener('compositionend', () => {
        isComposing = false;
        // Process the input after composition ends
        handleDateInputMask(displayInput, nativeInput, (msg) => showToast(msg, 'error'));
    });

    // Input mask - skip during composition for Android compatibility
    displayInput.addEventListener('input', () => {
        if (isComposing) return; // Wait for compositionend
        handleDateInputMask(displayInput, nativeInput, (msg) => showToast(msg, 'error'));
    });

    // Blur validation
    displayInput.addEventListener('blur', () => {
        validateDateInputAndSync(displayInput, nativeInput, (msg) => showToast(msg, 'error'));
    });

    // Arrow key increment
    displayInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation(); // Prevent bubbling to global Enter handler
            validateDateInputAndSync(displayInput, nativeInput, (msg) => showToast(msg, 'error'));
            displayInput.blur(); // Also blur to dismiss keyboard on mobile
            return;
        }

        // Handle backspace to move to previous segment
        if (e.key === 'Backspace') {
            const cursor = displayInput.selectionStart;
            const selEnd = displayInput.selectionEnd;
            const value = displayInput.value;

            // Only handle if no selection and cursor is at start of a segment (after a slash)
            if (cursor === selEnd) {
                const firstSlash = value.indexOf('/');
                const secondSlash = value.indexOf('/', firstSlash + 1);

                // At start of YYYY (position 6) -> move to end of MM
                if (secondSlash !== -1 && cursor === secondSlash + 1) {
                    e.preventDefault();
                    displayInput.setSelectionRange(secondSlash, secondSlash);
                    return;
                }

                // At start of MM (position 3) -> move to end of DD
                if (firstSlash !== -1 && cursor === firstSlash + 1) {
                    e.preventDefault();
                    displayInput.setSelectionRange(firstSlash, firstSlash);
                    return;
                }
            }
        }

        // Handle left/right arrows to navigate between segments (RTL-aware)
        if (handleDateLateralArrow(e, displayInput)) {
            return;
        }

        handleDateArrowKey(e, displayInput, nativeInput);
    });

    // Segment selection on focus
    displayInput.addEventListener('focus', () => handleDateFocus(displayInput));

    // Segment selection on click
    displayInput.addEventListener('click', () => handleDateClick(displayInput));

    // Segment selection on double-click
    displayInput.addEventListener('dblclick', (e) => handleDateDblClick(e, displayInput));

    // Native picker sync
    nativeInput.addEventListener('change', () => {
        if (!nativeInput.value) {
            displayInput.value = '';
            displayInput.dataset.iso = '';
            return;
        }

        const [y, m, d] = nativeInput.value.split('-');
        displayInput.value = `${d}/${m}/${y}`;
        displayInput.dataset.iso = nativeInput.value;
        displayInput.classList.remove('text-red-500');
    });
}

/* --- Legacy wrapper for backwards compatibility --- */

function validateAndFormatDate(e, nativeInput) {
    // This is now a thin wrapper - actual logic is in handleDateInputMask
    const input = e.target;
    handleDateInputMask(input, nativeInput, (msg) => showToast(msg, 'error'));
}

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

function renderHistoryList(history, lang) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    if (history.length === 0) {
        historyList.innerHTML = `<p class="text-center text-gray-500 py-8 text-sm">${t(lang, 'noHistorySaved')}</p>`;
        return;
    }
    historyList.innerHTML = history.map((item, index) => {
        const date = new Date(item.date).toLocaleDateString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const totalPayment = item.res.P + item.res.TI;
        const periodUnit = lang === 'ar' ? ' شهر' : ' mo';
        return `
        <div class="history-card bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all active:scale-[0.98]" data-index="${index}">
            <div class="flex justify-between items-start mb-2">
                <p class="text-xs text-gray-400">${date}</p>
                <button class="delete-btn p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors" data-index="${index}" title="${t(lang, 'deleteBtn')}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
            <p class="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1">${fmt(item.res.P)}</p>
            <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                    ${item.res.R.toFixed(2)}%
                </span>
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    ${item.res.N}${periodUnit}
                </span>
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    ${fmt(item.res.M)}/${lang === 'ar' ? 'شهر' : 'mo'}
                </span>
            </div>
            <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span class="text-xs text-gray-400">${t(lang, 'totalSumLabel')}</span>
                <span class="font-semibold text-gray-700 dark:text-gray-200 text-sm">${fmt(totalPayment)}</span>
            </div>
        </div>`;
    }).join('');
}

function showScheduleUI(scheduleData, language, autoOpen, isAdvanced = false) {
    const schedBody = document.getElementById('schedule-body');
    const schedCont = document.getElementById('schedule-container');
    const schedHead = document.querySelector('#schedule-container thead tr');
    if (!schedBody || !schedCont) return;

    // Check if any rows have stamps
    const hasAnyStamps = scheduleData.some(r => r.hasStamp && r.stamp > 0);

    // Dynamically add/remove stamp column header
    const existingStampHeader = schedHead?.querySelector('[data-stamp-col]');
    if (hasAnyStamps && !existingStampHeader && schedHead) {
        // Insert stamp header after Date column (2nd column)
        const dateCol = schedHead.children[1];
        if (dateCol) {
            const stampHeader = document.createElement('th');
            stampHeader.setAttribute('scope', 'col');
            stampHeader.setAttribute('data-lang-key', 'colStamp');
            stampHeader.setAttribute('data-stamp-col', 'true');
            stampHeader.className = 'hidden sm:table-cell px-1 py-3 text-end text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400';
            stampHeader.textContent = t(language, 'colStamp');
            dateCol.after(stampHeader);
        }
    } else if (!hasAnyStamps && existingStampHeader) {
        existingStampHeader.remove();
    } else if (hasAnyStamps && existingStampHeader) {
        // Update translation if language changed
        existingStampHeader.textContent = t(language, 'colStamp');
    }

    let htmlContent = "";
    const len = scheduleData.length;

    for (let i = 0; i < len; i++) {
        const r = scheduleData[i];
        const locale = language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';

        // Show full date (DD/MM/YYYY) in advanced mode, otherwise just month/year
        let dateStr;
        if (isAdvanced) {
            const d = r.rawDate.getDate().toString().padStart(2, '0');
            const m = (r.rawDate.getMonth() + 1).toString().padStart(2, '0');
            const y = r.rawDate.getFullYear();
            dateStr = `${d}/${m}/${y}`;
        } else {
            dateStr = r.rawDate.toLocaleDateString(locale, { month: language === 'ar' ? 'long' : 'short', year: 'numeric' });
        }

        // Row styling
        let rowClass = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';
        let dataAttr = '';

        // Generate stamp cell content (only if stamps exist in schedule)
        let stampCell = '';
        if (hasAnyStamps) {
            if (r.hasStamp && r.stamp > 0) {
                stampCell = `<td class="hidden sm:table-cell px-1 py-2 text-right font-medium text-purple-600 dark:text-purple-400 text-xs">${fmt(r.stamp)}</td>`;
                rowClass = 'stamp-row cursor-pointer transition-colors bg-purple-100/50 dark:bg-purple-900/40 hover:bg-purple-200/50 dark:hover:bg-purple-800/60';
                dataAttr = `data-stamp="${fmt(r.stamp)}"`;
            } else {
                stampCell = `<td class="hidden sm:table-cell px-1 py-2 text-right text-gray-300 dark:text-gray-600 text-xs">-</td>`;
            }
        }

        htmlContent += `
        <tr class="${rowClass}" ${dataAttr}>
            <td class="px-0.5 sm:px-1 py-2 text-center text-gray-500 dark:text-gray-400 whitespace-nowrap">${r.m}</td>
            <td class="px-0.5 sm:px-1 py-2 text-right text-gray-500 dark:text-gray-400 whitespace-nowrap" dir="ltr">${dateStr}</td>
            ${stampCell}
            <td class="hidden sm:table-cell px-1 py-2 text-right font-medium text-gray-900 dark:text-gray-100">${fmt(r.bal)}</td>
            <td class="px-0.5 sm:px-1 py-2 text-right text-gray-500 dark:text-gray-400 whitespace-nowrap">${fmt(r.int)}</td>
            <td class="px-0.5 sm:px-1 py-2 text-right text-gray-500 dark:text-gray-400 whitespace-nowrap">${fmt(r.prin)}</td>
            <td class="px-0.5 sm:px-1 py-2 text-right font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">${fmt(r.rem)}</td>
        </tr>`;
    }

    schedBody.innerHTML = htmlContent;

    // Add click handler for stamp rows (mobile tooltip - only when stamp column is hidden)
    schedBody.querySelectorAll('tr[data-stamp]').forEach(row => {
        row.addEventListener('click', function (e) {
            // Only show tooltip on mobile (when stamp column is hidden via 'hidden sm:table-cell')
            // Tailwind 'sm' breakpoint is 640px
            if (window.matchMedia('(min-width: 640px)').matches) {
                return; // Desktop view - stamp column is visible, no tooltip needed
            }

            // Remove any existing tooltip
            const existingTooltip = document.querySelector('.stamp-tooltip');
            if (existingTooltip) existingTooltip.remove();

            // Get stamp value
            const stampValue = this.dataset.stamp;
            const stampLabel = t(language, 'colStamp');

            // Get row position
            const rect = this.getBoundingClientRect();

            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'stamp-tooltip';
            tooltip.innerHTML = `<span style="opacity:0.8">${stampLabel}:</span> <span style="font-weight:bold">${stampValue}</span>`;

            // Style the tooltip
            tooltip.style.cssText = `
                position: fixed;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top - 8}px;
                transform: translate(-50%, -100%) scale(0.8);
                background: linear-gradient(135deg, #7c3aed, #9333ea);
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
                z-index: 9999;
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
                opacity: 0;
                transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                pointer-events: none;
            `;

            // Add arrow pointer
            const arrow = document.createElement('div');
            arrow.style.cssText = `
                position: absolute;
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid #9333ea;
            `;
            tooltip.appendChild(arrow);

            document.body.appendChild(tooltip);

            // Trigger animation
            requestAnimationFrame(() => {
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translate(-50%, -100%) scale(1)';
            });

            // Haptic feedback
            if (typeof haptic !== 'undefined') haptic('light');

            // Auto-remove after 2s
            setTimeout(() => {
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translate(-50%, -100%) scale(0.8)';
                setTimeout(() => tooltip.remove(), 200);
            }, 2000);
        });
    });

    if (autoOpen) {
        schedCont.classList.remove('hidden');
        setTimeout(() => {
            schedCont.classList.remove('max-h-0', 'opacity-0');
            schedCont.classList.add('max-h-[5000px]', 'opacity-100');
            schedCont.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);

        // Register with BackHandler for Android back button support
        if (typeof BackHandler !== 'undefined') {
            BackHandler.push('schedule-container', () => {
                if (typeof closeScheduleUI === 'function') closeScheduleUI();
            });
        }
    }
}

function closeScheduleUI() {
    const schedCont = document.getElementById('schedule-container');
    if (!schedCont) return;

    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        document.activeElement.blur();
    }

    schedCont.classList.remove('max-h-[5000px]', 'opacity-100');
    schedCont.classList.add('max-h-0', 'opacity-0');
    setTimeout(() => { schedCont.classList.add('hidden'); }, 500);

    // Unregister from BackHandler
    if (typeof BackHandler !== 'undefined') {
        BackHandler.pop('schedule-container');
    }
}

function initSwipeToClose() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
        const container = modal.querySelector('.modal-container');
        if (!container) return;

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        container.addEventListener('touchstart', (e) => {
            if (window.innerWidth >= 768) return;
            if (container.scrollTop > 0) return;

            startY = e.touches[0].clientY;
            isDragging = false;

            container.style.transition = 'none';
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (window.innerWidth >= 768) return;
            if (container.scrollTop > 0 && !isDragging) return;

            currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            if (diff > 0) {
                if (e.cancelable) e.preventDefault();
                isDragging = true;
                container.style.transform = `translateY(${diff}px)`;
            }
        }, { passive: false });

        container.addEventListener('touchend', (e) => {
            if (window.innerWidth >= 768) return;
            if (!isDragging) {
                container.style.transition = '';
                container.style.transform = '';
                return;
            }

            const diff = currentY - startY;

            if (diff > 150) {
                container.style.transition = 'transform 0.3s ease-out';
                container.style.transform = 'translateY(100%)';
                if (typeof haptic !== 'undefined') haptic('light');
                toggleModal(modal);

                setTimeout(() => {
                    container.style.transform = '';
                    container.style.transition = '';
                }, 300);
            } else {
                container.style.transition = 'transform 0.3s ease-out';
                container.style.transform = '';
            }
            isDragging = false;
        });
    });
}
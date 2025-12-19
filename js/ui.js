// js/ui.js - User Interface Functions & Theme Logic

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
        netLoanLabel: "Net Loan Amount",
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
        
        // --- THEME KEYS ---
        themeLight: "Light Mode",
        themeDark: "Dark Mode",
        themeSystem: "System Default",

        // --- NEW TOOLTIP KEYS ---
        aboutBtn: "About App",
        themeBtn: "Change Theme",
        calcField: "Calculate this field",
        saveBtn: "Save to History",
        historyBtn: "View History"
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
        regularInstLabel: "باقي الأقساط",
        adminFeesLabel: "مصاريف إدارية (%)",
        netLoanLabel: "صافي قيمة القرض",
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

        // --- THEME KEYS ---
        themeLight: "الوضع الفاتح",
        themeDark: "الوضع الداكن",
        themeSystem: "وضع النظام",

        // --- NEW TOOLTIP KEYS ---
        aboutBtn: "عن التطبيق",
        themeBtn: "تغيير المظهر",
        calcField: "حساب هذا الحقل",
        saveBtn: "حفظ في السجل",
        historyBtn: "عرض السجل"
    }
};

let chartInst = null;
let modalTimer = null; 
let toastTimer = null; 

function initPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW failed', err));
    }
}

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

function updateLangUI(lang) {
    document.documentElement.lang = lang; 
    document.documentElement.dir = lang==='ar'?'rtl':'ltr';
    
    // 1. Text Content Updates
    document.querySelectorAll('[data-lang-key]').forEach(e => {
        if(e.id === 'date-label') {
            const isAdvanced = document.getElementById('advanced-toggle').checked;
            const labelKey = isAdvanced ? "bookingDateLabel" : "startDateLabel";
            e.textContent = txt[lang][labelKey];
        } 
        else if(e.dataset.langKey === 'iosMsg') {
            const shareIcon = `<svg class="w-5 h-5 inline text-blue-400 mx-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>`;
            e.innerHTML = `${txt[lang].iosInstallBody} ${shareIcon} ${txt[lang].iosInstallFoot}`;
        }
        else {
            e.textContent = txt[lang][e.dataset.langKey];
        }
    });

    // 2. Placeholder Updates
    const inputIds = ['loan-amount', 'interest-rate', 'loan-period', 'monthly-installment'];
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const isReadOnly = el.hasAttribute('readonly');
            el.placeholder = isReadOnly ? txt[lang].calcPlaceholder : txt[lang].inputPlaceholder;
        }
    });
    
    const startDateDisplay = document.getElementById('start-date-display');
    const firstInstDateDisplay = document.getElementById('first-inst-date-display');
    if(startDateDisplay) startDateDisplay.placeholder = "DD/MM/YYYY";
    if(firstInstDateDisplay) firstInstDateDisplay.placeholder = "DD/MM/YYYY";

    const installSpan = document.getElementById('install-button').querySelector('span');
    if(installSpan) installSpan.textContent = txt[lang].installApp;

    // 3. NEW: Tooltip (Title) Updates
    document.querySelectorAll('[data-lang-title]').forEach(e => {
        const key = e.dataset.langTitle;
        if(txt[lang][key]) {
            e.title = txt[lang][key];
        }
    });
}

function showToast(message, type='normal') {
    const msgBox = document.getElementById('message-box');
    
    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }

    msgBox.textContent = message;
    msgBox.style.zIndex = "100"; 
    
    const baseClasses = 'fixed top-24 left-0 right-0 mx-auto w-fit max-w-[90vw] z-[100] px-6 py-3 rounded-lg text-white font-medium shadow-2xl text-sm text-center transition-all duration-500 ease-out transform origin-top';
    
    const colorClasses = type === 'error' 
        ? 'bg-red-600 border-2 border-white/20 font-bold' 
        : 'bg-gray-800 dark:bg-gray-700 border border-gray-700 dark:border-gray-600';

    msgBox.className = `${baseClasses} ${colorClasses} opacity-0 -translate-y-4 scale-95`;
    msgBox.classList.remove('hidden');

    void msgBox.offsetWidth;

    msgBox.classList.remove('opacity-0', '-translate-y-4', 'scale-95');
    msgBox.classList.add('opacity-100', 'translate-y-0', 'scale-100');

    toastTimer = setTimeout(() => {
        msgBox.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
        msgBox.classList.add('opacity-0', '-translate-y-4', 'scale-95');
        
        setTimeout(() => {
            msgBox.classList.add('hidden');
        }, 500); 
    }, 4000);
}

function toggleModal(modal) {
    const isOpening = modal.classList.contains('pointer-events-none');
    
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
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        document.body.classList.add('scroll-lock');
    } else {
        modalTimer = setTimeout(() => {
            document.body.classList.remove('scroll-lock');
            document.body.style.paddingRight = '';
        }, 300);
    }
}

function drawChart(principal, interest, lang) {
    const ctx = document.getElementById('loan-chart').getContext('2d');
    if(chartInst) chartInst.destroy();
    const isDark = document.documentElement.classList.contains('dark');
    const colorText = isDark ? '#e5e7eb' : '#374151';
    
    let data = [1, 0];
    let bgColors = ['#e5e7eb', '#e5e7eb']; 
    
    if (principal) {
        data = [principal, interest];
        bgColors = ['#3b82f6', '#ef4444'];
    }

    chartInst = new Chart(ctx, {
        type: 'pie',
        data: { labels: [txt[lang].chartLabelPrincipal || 'Principal', txt[lang].chartLabelInterest || 'Interest'], datasets: [{ data: data, backgroundColor: bgColors, borderColor: isDark?'#1f2937':'#fff', borderWidth:2 }] },
        options: { plugins: { legend: { position: 'right', labels: { color: colorText, font: {family: 'system-ui, sans-serif'} } } }, responsive: true, maintainAspectRatio: false }
    });
}

function formatCurrencyInput(input) {
    let selectionStart = input.selectionStart;
    let oldVal = input.value;
    
    let raw = oldVal.replace(/[^0-9.]/g, '');
    
    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    
    let newVal = "";
    if (raw !== "") {
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? "." + parts[1] : "";
        newVal = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + decimalPart;
    }
    input.value = newVal;

    let oldCommas = (oldVal.slice(0, selectionStart).match(/,/g) || []).length;
    let newCommas = (newVal.slice(0, selectionStart).match(/,/g) || []).length;
    
    if (oldVal !== newVal) {
        if (selectionStart < oldVal.length) {
             let newPos = selectionStart + (newCommas - oldCommas);
             newPos = Math.max(0, Math.min(newPos, newVal.length));
             input.setSelectionRange(newPos, newPos);
        }
    }
}

function formatRateInputBlur(input) {
    let val = input.value.trim();
    if(val === '') return;
    
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
    let val = input.value.replace(/[^0-9]/g, ''); 
    input.value = val;
}

function validateRateInput(input) {
    let val = input.value.replace(/[^0-9.]/g, ''); 
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    val = val.replace(/^0+(?=\d)/, '');
    if (val.startsWith('.')) {
        val = '0' + val;
    }
    input.value = val;
}

function validateAndFormatDate(e, nativeInput) {
    let input = e.target;
    let val = input.value.replace(/\D/g, ''); 
    
    if (val.length >= 2) {
        let d = parseInt(val.substring(0, 2));
        if (d > 31 || d === 0) {
            val = val.substring(0, 1);
            showToast("Invalid Day", 'error');
        }
    }
    
    if (val.length >= 4) {
        let m = parseInt(val.substring(2, 4));
        if (m > 12 || m === 0) {
            val = val.substring(0, 3);
            showToast("Invalid Month", 'error');
        }
    }
    
    if (val.length > 8) val = val.substring(0, 8);

    let formatted = "";
    if (val.length > 4) {
        formatted = val.substring(0, 2) + "/" + val.substring(2, 4) + "/" + val.substring(4);
    } else if (val.length > 2) {
        formatted = val.substring(0, 2) + "/" + val.substring(2);
    } else {
        formatted = val;
    }
    
    input.value = formatted;

    if (val.length === 8) {
        const d = parseInt(val.substring(0,2));
        const m = parseInt(val.substring(2,4));
        const y = parseInt(val.substring(4,8));
        
        const dateObj = new Date(y, m - 1, d);
        
        if (dateObj.getFullYear() === y && dateObj.getMonth() === m - 1 && dateObj.getDate() === d && y > 1900 && y < 2100) {
            input.classList.remove('text-red-500');
            nativeInput.value = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            nativeInput.dispatchEvent(new Event('change'));
        } else {
            input.classList.add('text-red-500'); 
            showToast("Invalid Date", 'error');
        }
    } else {
        input.classList.remove('text-red-500');
    }
}

function updateInputState(inputGroups, inputs, errors, activeKey, lang) {
    Object.keys(inputGroups).forEach(key => {
        inputGroups[key].classList.remove('error-state');
        errors[key].classList.add('hidden');

        const lockBtn = document.querySelector(`.lock-btn[data-target="${key}"]`);
        const unlockedIcon = lockBtn.querySelector('.icon-unlocked');
        const lockedIcon = lockBtn.querySelector('.icon-locked');

        if (key === activeKey) {
            inputGroups[key].classList.add('active-target');
            inputs[key].readOnly = true;
            inputs[key].placeholder = txt[lang].calcPlaceholder;
            
            unlockedIcon.classList.add('hidden');
            lockedIcon.classList.remove('hidden');
            lockBtn.classList.add('text-indigo-600');
            lockBtn.classList.remove('text-gray-400');
        } else {
            inputGroups[key].classList.remove('active-target');
            inputs[key].readOnly = false;
            inputs[key].placeholder = txt[lang].inputPlaceholder;
            
            unlockedIcon.classList.remove('hidden');
            lockedIcon.classList.add('hidden');
            lockBtn.classList.remove('text-indigo-600');
            lockBtn.classList.add('text-gray-400');
        }
    });
}

function renderHistoryList(history, lang) {
    const historyList = document.getElementById('history-list');
    if (history.length === 0) {
        historyList.innerHTML = `<p class="text-center text-gray-500 py-8 text-sm">No history saved yet.</p>`;
        return;
    }
    historyList.innerHTML = history.map((item, index) => {
        const date = new Date(item.date).toLocaleDateString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        return `
        <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div>
                <p class="text-xs text-gray-400 mb-1">${date}</p>
                <p class="font-bold text-gray-800 dark:text-gray-100 text-sm">${txt[lang].loanAmountLabel}: ${fmt(item.res.P)}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${txt[lang].monthlyInstallmentLabel}: ${fmt(item.res.M)}</p>
            </div>
            <div class="flex gap-2">
                <button class="load-btn p-1.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-colors text-xs font-bold" data-index="${index}">${txt[lang].loadBtn}</button>
                <button class="delete-btn p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors text-xs font-bold" data-index="${index}">${txt[lang].deleteBtn}</button>
            </div>
        </div>`;
    }).join('');
}

function showScheduleUI(scheduleData, language, autoOpen) {
    const schedBody = document.getElementById('schedule-body');
    const schedCont = document.getElementById('schedule-container');
    
    let htmlContent = "";
    const len = scheduleData.length;
    
    for(let i=0; i<len; i++) {
        const r = scheduleData[i];
        const locale = language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';
        const dateStr = r.rawDate.toLocaleDateString(locale, { month: language === 'ar' ? 'long' : 'short', year: 'numeric' });
        
        htmlContent += `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 even:bg-gray-50 dark:even:bg-gray-800/30 transition-colors">
            <td class="px-1 py-2 text-center whitespace-nowrap text-gray-500 dark:text-gray-400">${r.m}</td>
            <td class="px-2 py-2 text-right whitespace-nowrap text-gray-500 dark:text-gray-400" dir="ltr">${dateStr}</td>
            <td class="hidden sm:table-cell px-2 py-2 text-right whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">${fmt(r.bal)}</td>
            <td class="px-2 py-2 text-right whitespace-nowrap text-gray-500 dark:text-gray-400">${fmt(r.int)}</td>
            <td class="px-2 py-2 text-right whitespace-nowrap text-gray-500 dark:text-gray-400">${fmt(r.prin)}</td>
            <td class="px-2 py-2 text-right whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">${fmt(r.rem)}</td>
        </tr>`;
    }
    
    schedBody.innerHTML = htmlContent;
    
    if(autoOpen) {
        schedCont.classList.remove('hidden');
        setTimeout(() => {
            schedCont.classList.remove('max-h-0', 'opacity-0');
            schedCont.classList.add('max-h-[5000px]', 'opacity-100');
            schedCont.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }
}

function closeScheduleUI() {
    const schedCont = document.getElementById('schedule-container');
    
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        document.activeElement.blur();
    }

    schedCont.classList.remove('max-h-[5000px]', 'opacity-100');
    schedCont.classList.add('max-h-0', 'opacity-0');
    setTimeout(() => { schedCont.classList.add('hidden'); }, 500);
}

// NEW: Swipe to Close logic for Bottom Sheets
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
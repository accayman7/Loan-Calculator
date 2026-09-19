// js/ui.js - User Interface Functions & Theme Logic
// Fixed: Radio button logic, Translation fallbacks, Chart safety

const txt = {
    en: {
        appTitle: "Loan Calculator",
        inputSectionTitle: "Loan Details",
        loanAmountLabel: "Loan Amount",
        interestRateLabel: "Interest Rate (%)",
        loanPeriodLabel: "Period (months)",
        loanPeriodBase: "Period",
        monthlyInstallmentLabel: "Monthly Installment",
        frequencyLabel: "Installment Frequency",
        freqMonthly: "Monthly",
        freqQuarterly: "Quarterly",
        quarterUnit: "Quarters",
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
        scheduleButton: "Show Schedule",
        scheduleButtonHide: "Hide Schedule",
        exportPdfButton: "Print",
        exportXlsxButton: "Excel",
        exportingPdf: "Preparing...",
        exportingXlsx: "Exporting...",
        exportPdfStarting: "Preparing report for print...",
        exportPdfSuccess: "Report ready. Print dialog opened.",
        exportPdfError: "Print failed.",
        exportXlsxStarting: "Preparing Excel export...",
        exportXlsxSuccess: "Excel file exported successfully.",
        exportXlsxError: "Excel export failed.",
        ssPrintingOffer: "Preparing...",
        ssPrintOfferStarting: "Preparing client offer for print...",
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
        ssDesc: "Calculate required Certificate of Deposit to cover installments.",
        ssDescAdvanced: "Calculate a self-paying loan backed by your CD.",
        ssBookingDateLabel: "Booking Date:",
        ssCd1InterestDateLabel: "CD₁ Next Interest Date:",
        ssCd2InterestDateLabel: "CD₂ First Interest Date:",
        ssCdInterestBeforeM1Label: "CD Interest Before 1st Inst.:",
        tdRateLabel: "CD₁ Rate (%):",
        td2RateLabel: "CD₂ Rate (%):",
        tdAmountLabel: "Your CD (CD₁):",
        reqTdLabel: "Required CD:",
        netFlowLabel: "Net Flow:",
        ssTd2Label: "New CD (CD₂):",
        ssGrossLoanLabel: "Gross Loan Amount:",
        ssLoanRateLabel: "Loan Rate (%):",
        ssPeriodLabel: "Period (months):",
        ssAdminFeesInputLabel: "Admin Fees (%):",
        ssStampRateInputLabel: "Stamp Rate (%):",
        ssMonthlyTdInterest: "Combined Monthly CD Interest:",
        ssInstallmentLabel: "Loan Installment:",
        ssMonthlySurplusLabel: "Monthly Surplus:",
        ssFirstInstBufferLabel: "1st Installment Reserve:",
        ssTotalStampLabel: "Total Stamp Cost:",
        ssAdminFeesLabel: "Admin Fees (deducted):",
        ssTotalTdsLabel: "Total CDs After Term:",
        ssSimpleInterestAlt: "Simple Interest Alternative:",
        ssNetBenefitLabel: "Net Benefit:",
        ssEffectiveRateLabel: "Effective Earning Rate:",
        ssNetLeftoverLabel: "Net Remaining:",
        ssErrorTdRequired: "Please enter your CD amount.",
        ssErrorNoSolution: "No solution found. CD rate must exceed loan effective cost.",
        ssPeriodicTdInterest: "Combined Periodic CD Interest:",
        ssCopyOfferBtn: "Copy Client Offer",
        ssPrintOfferBtn: "Print Client Offer",
        ssOfferCopied: "Client offer copied to clipboard!",
        ssOfferCopyError: "Failed to copy offer to clipboard.",
        ssOfferTitle: "Investment Loan Proposal (Self-Sufficient Program)",
        ssOfferPlanTitle: "1️⃣ THE INVESTMENT PLAN",
        ssOfferCashflowTitle: "2️⃣ MONTHLY CASHFLOW (0 OUT-OF-POCKET)",
        ssOfferBenefitTitle: "3️⃣ NET BENEFIT AT MATURITY",
        ssOfferZeroCostNote: "You pay 0.00 EGP out-of-pocket (Installment is 100% covered by CD returns)",
        ssOfferDisclaimer: "Indicative proposal based on prevailing bank interest rates and tariffs.",
        ssOfferExistingCd: "Your Existing Certificate (CD₁):",
        ssOfferNewCd: "New Certificate Added (CD₂):",
        ssOfferTotalCds: "Total Certificates Owned:",
        ssOfferDuration: "Duration:",
        ssOfferMonthlyReturns: "Monthly Returns from Certificates:",
        ssOfferLoanInstallment: "Monthly Loan Installment:",
        ssOfferCashSurplus: "Cash Surplus in Your Account:",
        ssOfferValWithProgram: "Total Value with this Program:",
        ssOfferValWithoutProgram: "Total Value without Program:",
        ssOfferNetProfit: "Net Extra Profit:",
        ssOfferEffectiveReturn: "Effective Return:",
        chartLabelPrincipal: "Principal",
        chartLabelInterest: "Interest",
        installApp: "Install App",
        installAppAbout: "Install App",
        installManualHint: "Open your browser menu and select \"Install\" or \"Add to Home Screen\"",
        alreadyInstalled: "App is already installed!",
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
        settlementBeforeStampLabel: "Settlement (before stamp):",
        settlementStampOnTotalLabel: "Stamp on Settlement:",
        totalSettlementLabel: "Total Settlement:",
        noScheduleError: "Calculate loan first",

        // Error Messages
        errorCheckInputs: "Please check input fields.",
        errorCalculationFailed: "Calculation failed. Check inputs.",
        errorInvalidDate: "Invalid date format",
        errorDateOutOfRange: "Date must be between 2000-2099",
        errorDateDoesNotExist: "Date does not exist",
        errorFirstInstBeforeBooking: "First installment date cannot be before the booking date",
        errorLoanNotCalculated: "Please calculate loan details first.",
        errorSettlementDateOutOfRange: "Settlement date must be within the loan period.",

        // Offline & Compliance
        offlineMode: "Offline",
        offlineReady: "This app works fully offline.",
        localOnlyDisclaimer: "All calculations run locally. No data is transmitted.",

        // Button Tooltips
        langBtn: "Language",

        // Assumptions Panel
        assumptionsTitle: "Calculation Assumptions",
        assumptionInterestMethod: "• Interest Calculation Method: Reducing Balance (Annuity)",
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
        dayNamesFull: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        confirmDate: "Confirm",
        cancelDate: "Cancel",
        todayDate: "Today",
        selectDate: "Select date",
        clearDate: "Clear",
        prevMonth: "Previous month",
        nextMonth: "Next month",
        invalidDateHint: "Invalid date. Use DD/MM/YYYY.",
        dateRangeHint: "Date must be between {min} and {max}.",
        // Date Placeholders
        datePlaceholderDay: "DD",
        datePlaceholderMonth: "MM",
        datePlaceholderYear: "YYYY",

        // Additional Missing Translations
        invalidAmount: "Please enter a valid amount.",
        invalidRate: "Please enter a valid rate.",
        invalidPeriod: "Please enter a valid period.",
        invalidValue: "Invalid value.",
        maxRate: "Max rate is 100%",
        days: "days",
        enterDetailsToSeeChart: "Enter details to see chart",
        noCalcToShare: "No calculation to share",
        failedToCopy: "Failed to copy",
        storageFull: "Storage full",
        copyFailed: "Copy failed",
        printFailed: "Print failed",
        exportFailed: "Export failed",
        libNotLoaded: "Error: Library not loaded",
        calcLoanAmount: "Calculate Loan Amount",
        calcInterestRate: "Calculate Interest Rate",
        calcPeriod: "Calculate Period",
        calcInstallment: "Calculate Installment",

        // Loan Types & Collateral
        loanTypeLabel: "Loan Type",
        loanTypeUnsecured: "Unsecured Loan",
        loanTypeSecured: "Secured Loan",
        collateralDetailsTitle: "Collateral Details",
        addCollateralBtn: "Add Collateral",
        clearAllBtn: "Clear All",
        clearCollateralBtn: "Clear",
        removeCollateralBtn: "Remove",
        collateralItemLabel: "Collateral",
        collateralBadge: "CD",
        collateralAdded: "Collateral {index} added",
        collateralRemoved: "Collateral {index} removed",
        collateralsCleared: "All collaterals cleared",
        errorRedemptionExceedsNominal: "Redemption value cannot exceed nominal value",
        collateralAmountLabel: "Nominal Value",
        collateralNominalLabel: "Nominal Value",
        collateralRedemptionLabel: "Redemption Value",
        collateralRateLabel: "Interest Rate (%)",
        collateralPeriodLabel: "Period (months)",
        totalCollateralLabel: "Total Collateral:",
        maxLoanAllowedLabel: "Max Loan:",
        maxLoanAllowedTooltip: "Maximum Loan Limit: By banking regulations, maximum loan amount is 90% of certificate nominal value or its redemption value, whichever is lower.",
        minLoanRateLabel: "Min Rate (+2%):",
        minLoanRateTooltip: "Minimum Loan Rate: By banking regulations, loan interest must be at least 2% higher than your highest collateral CD rate.",
        cdMonthlyReturnLabel: "Monthly CD Returns",
        loanInstallmentMonthlyLabel: "Monthly Installment",
        netCashflowLabel: "Net Cashflow",
        cashflowSurplusBadge: "Surplus",
        cashflowDeficitBadge: "Net Payment",
        cashflowSurplusExplain: "CD interest covers your installment with extra monthly surplus.",
        cashflowDeficitExplain: "CD interest covers part of your installment; you pay the remaining difference.",
        selfCoveringLoanLabel: "100% Self-Covering Loan",
        selfCoveringChipLabel: "100% covered by CDs:",
        applyLoanAmountBtn: "Use Value",
        warningExceeds90Collateral: "Loan amount exceeds maximum collateral limit ({max})",
        warningBelowMinRate: "Loan rate is below minimum required ({min}%)",
        ssErrorExceeds90Collateral: "Generated loan amount ({gross}) exceeds maximum collateral limit ({max}).",
        colHeaderNum: "#",
        colHeaderAmount: "Nominal",
        colHeaderNominal: "Nominal",
        colHeaderRedemption: "Redemption",
        colHeaderRate: "Rate %",
        ssCd1SectionTitle: "Existing Certificates (CD₁)",
        ssCd2SectionTitle: "New Certificate (CD₂)",
        ssLoanTermsTitle: "Loan Terms",
        addCd1Btn: "Add CD₁",
        cdInterestDateShort: "Next Interest Date",
        cdCouponDateShort: "Next Interest",
        cdMaturityDateShort: "Maturity Date",
        remainingTenorLabel: "{n} mos left",
        matchCd1TenorBtn: "⚡ Match CD₁: {n} mos",
        advisoryMaturityExceeded: "Loan period ({loan} mos) exceeds CD₁ maturity ({cd} mos remaining). At month {cd}, CD₁ will renew at the prevailing market rate, which may alter your net surplus.",
        reassuranceMaturityMatched: "Guaranteed Horizon: Loan duration is fully covered within CD₁'s current contracted term.",
        datesLabel: "Dates",
        firstInstDateLabel: "First Installment Date:",
        deferredM1Note: "(5th of 2nd month)",
        nextCouponDateLabel: "Next Interest Date",
        maturityDateLabel: "Maturity Date",
        loanEndDateLabel: "Loan End Date:",
        loanEndDateTooltip: "Loan End Date: The maturity date of the loan when the final installment is paid (calculated based on loan duration and installment schedule).",
        whatsNewModalTitle: "What's New & App Guide",
        tabWhatsNew: "✨ What's New",
        tabAppFeatures: "🌟 App Guide",
        wnNativeChartTitle: "Native Interactive Vector Chart",
        wnNativeChartDesc: "Smooth radial progress-ring animation, live count-up percentage HUD, and dynamic hover contrast for dark and light modes.",
        wnSmartScrollTitle: "Smart Auto-Scroll to Results",
        wnSmartScrollDesc: "Clicking Calculate smoothly centers your loan summary and chart into view across all devices, with safe navbar clearance.",
        wnShareOfferTitle: "Shareable Client Proposals",
        wnShareOfferDesc: "Copy a ready-to-send proposal formatted for WhatsApp and Email with monthly surplus and net profit at maturity.",
        wnPrintOfferTitle: "1-Page Bank Print Summary",
        wnPrintOfferDesc: "Print an ink-friendly, single-page A4 breakdown of your investment and loan details to take directly to the bank.",
        wnSsProgTitle: "Self-Sufficient Loan Mode",
        wnSsProgDesc: "Calculate how existing certificates can fund a new high-rate certificate that pays off all installments with monthly profit.",
        wnLimitTitle: "Bank-Compliant Lending Limits",
        wnLimitDesc: "Maximum borrowing is automatically capped at 90% of certificate value or redemption value for guaranteed bank approval.",
        wnDueDateTitle: "First Payment Timing",
        wnDueDateDesc: "Displays the exact first installment date (5th of the 2nd month after booking) so you can plan your budget with ease.",
        featLoanTitle: "Flexible Loan Calculator",
        featLoanDesc: "Calculate your monthly installment, loan amount, interest rate, or duration with reducing balance calculations.",
        featSecuredTitle: "Secured Loans (CD-Backed)",
        featSecuredDesc: "Check your borrowing limit and see whether your monthly certificate interest covers your loan payment.",
        featSsTitle: "Self-Sufficient Loan Mode",
        featSsDesc: "Use your existing certificate to fund a new high-rate certificate that pays off all installments with monthly surplus.",
        featEarlyTitle: "Early Settlement Calculator",
        featEarlyDesc: "Find out the exact remaining principal, payoff fees, and interest accrued for any settlement date.",
        featExportTitle: "Schedule & PDF Reports",
        featExportDesc: "View month-by-month repayment breakdown, quarterly stamp tax, and export official PDF or Excel reports.",
        featOfflineTitle: "100% Private & Offline",
        featOfflineDesc: "Runs completely offline on your device. Your financial numbers are never sent anywhere.",
        whatsNewGotIt: "Got it!",
        viewWhatsNewBtn: "✨ What's New & App Guide",
        vsLabel: "vs",
        ssOfferCopied: "Client offer copied to clipboard!",
        ssOfferCopyError: "Failed to copy client offer. Please copy manually.",
        ssCopyOfferBtn: "Copy Client Offer",
        ssPrintOfferBtn: "Print Client Offer"
    },
    ar: {
        appTitle: "حاسبة القروض",
        inputSectionTitle: "تفاصيل القرض",
        loanAmountLabel: "مبلغ القرض",
        interestRateLabel: "الفائدة السنوية (%)",
        loanPeriodLabel: "المدة (أشهر)",
        loanPeriodBase: "المدة",
        monthlyInstallmentLabel: "القسط الشهري",
        frequencyLabel: "تكرار السداد",
        freqMonthly: "شهري",
        freqQuarterly: "ربع سنوي",
        quarterUnit: "أرباع",
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
        scheduleButton: "عرض الجدول",
        scheduleButtonHide: "إخفاء الجدول",
        exportPdfButton: "طباعة",
        exportXlsxButton: "Excel ملف",
        exportingPdf: "جاري التجهيز...",
        exportingXlsx: "جاري التصدير...",
        exportPdfStarting: "جاري تجهيز التقرير للطباعة...",
        exportPdfSuccess: "التقرير جاهز. تم فتح نافذة الطباعة.",
        exportPdfError: "فشلت عملية الطباعة.",
        exportXlsxStarting: "جاري تجهيز وتصدير ملف Excel...",
        exportXlsxSuccess: "تم تصدير ملف Excel بنجاح.",
        exportXlsxError: "فشل تصدير ملف Excel.",
        ssPrintingOffer: "جاري التجهيز...",
        ssPrintOfferStarting: "جاري تجهيز عرض العميل للطباعة...",
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
        ssDesc: "حساب الشهادة المطلوبة لتغطية الأقساط.",
        ssDescAdvanced: "حساب قرض ذاتي السداد مدعوم بشهادتك.",
        ssBookingDateLabel: "تاريخ المنح:",
        ssCd1InterestDateLabel: "تاريخ عائد شهادة 1:",
        ssCd2InterestDateLabel: "تاريخ عائد شهادة 2:",
        ssCdInterestBeforeM1Label: "عائد الشهادات قبل القسط الأول:",
        tdRateLabel: "فائدة الشهادة 1 (%):",
        td2RateLabel: "فائدة الشهادة 2 (%):",
        tdAmountLabel: "شهادتك (الشهادة 1):",
        reqTdLabel: "الشهادة المطلوبة:",
        netFlowLabel: "صافي التدفق:",
        ssTd2Label: "الشهادة الجديدة (شهادة 2):",
        ssGrossLoanLabel: "إجمالي مبلغ القرض:",
        ssLoanRateLabel: "فائدة القرض (%):",
        ssPeriodLabel: "المدة (أشهر):",
        ssAdminFeesInputLabel: "مصاريف إدارية (%):",
        ssStampRateInputLabel: "الدمغة النسبية (%):",
        ssMonthlyTdInterest: "العائد الشهري المشترك:",
        ssInstallmentLabel: "قسط القرض:",
        ssMonthlySurplusLabel: "الفائض الشهري:",
        ssFirstInstBufferLabel: "احتياطي القسط الأول:",
        ssTotalStampLabel: "إجمالي الدمغة:",
        ssAdminFeesLabel: "المصاريف الإدارية (تخصم):",
        ssTotalTdsLabel: "إجمالي الشهادات بعد المدة:",
        ssSimpleInterestAlt: "العائد بالشهادة فقط:",
        ssNetBenefitLabel: "صافي الاستفادة:",
        ssEffectiveRateLabel: "معدل العائد الفعلي:",
        ssNetLeftoverLabel: "المتبقي من صافي القرض:",
        ssErrorTdRequired: "يرجى إدخال مبلغ الشهادة.",
        ssErrorNoSolution: "لا يوجد حل. فائدة الشهادة يجب أن تتجاوز التكلفة الفعلية للقرض.",
        ssCopyOfferBtn: "نسخ عرض العميل",
        ssPrintOfferBtn: "طباعة عرض العميل",
        ssOfferCopied: "تم نسخ عرض العميل بنجاح!",
        ssOfferCopyError: "تعذر نسخ العرض إلى الحافظة.",
        ssOfferTitle: "عرض تمويل استثماري (برنامج التضاعف الذاتي)",
        ssOfferPlanTitle: "1️⃣ الخطة الاستثمارية",
        ssOfferCashflowTitle: "2️⃣ الموقف الشهري (بدون دفع أي مبالغ)",
        ssOfferBenefitTitle: "3️⃣ أرباحك في نهاية المدة",
        ssOfferZeroCostNote: "لا تدفع أي مليم من جيبك (القسط مغطى بالكامل من عوائد الشهادات تلقائياً)",
        ssOfferDisclaimer: "العرض استرشادي وخاضع لأسعار العوائد والتعريفة المصرفية السارية.",
        ssOfferExistingCd: "شهادتك الحالية (CD₁):",
        ssOfferNewCd: "الشهادة الجديدة المضافة (CD₂):",
        ssOfferTotalCds: "إجمالي شهاداتك:",
        ssOfferDuration: "المدة:",
        ssOfferMonthlyReturns: "عائد الشهادات شهرياً:",
        ssOfferLoanInstallment: "قسط القرض الشهري:",
        ssOfferCashSurplus: "فائض نقدي في جيبك:",
        ssOfferValWithProgram: "إجمالي أموالك بالبرنامج:",
        ssOfferValWithoutProgram: "في حال عدم الاشتراك:",
        ssOfferNetProfit: "صافي الربح الإضافي لك:",
        ssOfferEffectiveReturn: "العائد الفعلي المحقق:",
        chartLabelPrincipal: "أصل القرض",
        chartLabelInterest: "إجمالي الفائدة",
        installApp: "تثبيت التطبيق",
        installAppAbout: "تثبيت التطبيق",
        installManualHint: "افتح قائمة المتصفح واختر \"تثبيت\" أو \"إضافة إلى الشاشة الرئيسية\"",
        alreadyInstalled: "التطبيق مثبت بالفعل!",
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
        settlementStampLabel: "دمغة ربع سنوية:",
        settlementBeforeStampLabel: "الإجمالي (قبل الدمغة):",
        settlementStampOnTotalLabel: "دمغة على السداد:",
        totalSettlementLabel: "إجمالي السداد:",
        noScheduleError: "احسب القرض أولاً",

        // Date Placeholders
        datePlaceholderDay: "يوم",
        datePlaceholderMonth: "شهر",
        datePlaceholderYear: "سنة",

        // Error Messages
        errorCheckInputs: "يرجى التحقق من حقول الإدخال.",
        errorCalculationFailed: "فشل الحساب. تحقق من المدخلات.",
        errorInvalidDate: "صيغة التاريخ غير صحيحة",
        errorDateOutOfRange: "التاريخ يجب أن يكون بين 2000 و 2099",
        errorDateDoesNotExist: "التاريخ غير موجود",
        errorFirstInstBeforeBooking: "تاريخ أول قسط لا يمكن أن يسبق تاريخ المنح",
        errorLoanNotCalculated: "يرجى حساب تفاصيل القرض أولاً.",
        errorSettlementDateOutOfRange: "يجب أن يكون تاريخ السداد المبكر خلال فترة القرض.",

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
        dayNamesFull: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
        confirmDate: "تأكيد",
        cancelDate: "إلغاء",
        todayDate: "اليوم",
        selectDate: "اختر التاريخ",
        clearDate: "مسح",
        prevMonth: "الشهر السابق",
        nextMonth: "الشهر التالي",
        invalidDateHint: "تاريخ غير صحيح. استخدم يوم/شهر/سنة.",
        dateRangeHint: "التاريخ يجب أن يكون بين {min} و {max}.",

        // Additional Missing Translations
        invalidAmount: "يرجى إدخال مبلغ صحيح.",
        invalidRate: "يرجى إدخال فائدة صحيحة.",
        invalidPeriod: "يرجى إدخال مدة صحيحة.",
        invalidValue: "قيمة غير صالحة.",
        maxRate: "الحد الأقصى 100%",
        days: "يوم",
        enterDetailsToSeeChart: "أدخل التفاصيل لعرض الرسم البياني",
        noCalcToShare: "لا يوجد حساب للمشاركة",
        failedToCopy: "فشل النسخ",
        storageFull: "الذاكرة ممتلئة",
        copyFailed: "فشل النسخ",
        printFailed: "فشلت الطباعة",
        exportFailed: "فشل التصدير",
        libNotLoaded: "خطأ: المكتبة غير محملة",
        calcLoanAmount: "حساب مبلغ القرض",
        calcInterestRate: "حساب نسبة الفائدة",
        calcPeriod: "حساب المدة",
        calcInstallment: "حساب القسط",

        // Loan Types & Collateral
        loanTypeLabel: "نوع القرض",
        loanTypeUnsecured: "قرض غير مضمن (شخصي)",
        loanTypeSecured: "قرض مضمن (بضمان)",
        collateralDetailsTitle: "تفاصيل الضمانات",
        addCollateralBtn: "إضافة ضمانة",
        clearAllBtn: "مسح الكل",
        clearCollateralBtn: "مسح",
        removeCollateralBtn: "حذف",
        collateralItemLabel: "الضمانة",
        collateralBadge: "ضمانة",
        collateralAdded: "تمت إضافة الضمانة {index}",
        collateralRemoved: "تم حذف الضمانة {index}",
        collateralsCleared: "تم مسح جميع الضمانات",
        errorRedemptionExceedsNominal: "لا يمكن أن تتجاوز القيمة الاستردادية القيمة الاسمية",
        collateralAmountLabel: "القيمة الاسمية",
        collateralNominalLabel: "القيمة الاسمية",
        collateralRedemptionLabel: "القيمة الاستردادية",
        collateralRateLabel: "فائدة الضمانة (%)",
        collateralPeriodLabel: "المدة (أشهر)",
        totalCollateralLabel: "إجمالي الضمانات:",
        maxLoanAllowedLabel: "أقصى قرض:",
        maxLoanAllowedTooltip: "الحد الأقصى للقرض: وفقاً للتعليمات المصرفية، الحد الأقصى لمبلغ القرض هو 90% من القيمة الاسمية للشهادة أو قيمتها الاستردادية أيهما أقل.",
        minLoanRateLabel: "أدنى فائدة (+2%):",
        minLoanRateTooltip: "الحد الأدنى لسعر فائدة القرض: وفقاً للتعليمات المصرفية، يجب أن تكون فائدة القرض أعلى بنسبة 2% على الأقل من أعلى فائدة للشهادات الضامنة.",
        cdMonthlyReturnLabel: "عوائد الشهادات شهرياً",
        loanInstallmentMonthlyLabel: "قسط القرض الشهري",
        netCashflowLabel: "صافي التدفق الشهري",
        cashflowSurplusBadge: "فائض شهري",
        cashflowDeficitBadge: "سداد من الجيب",
        cashflowSurplusExplain: "عوائد الشهادات تغطي قسط القرض بالكامل مع فائض شهري متبقي.",
        cashflowDeficitExplain: "عوائد الشهادات تغطي جزءاً من القسط؛ وتقوم بسداد الفارق المتبقي.",
        selfCoveringLoanLabel: "قرض مغطى بالكامل من الفوائد",
        selfCoveringChipLabel: "مغطى بالكامل من الشهادات:",
        applyLoanAmountBtn: "استخدام المبلغ",
        warningExceeds90Collateral: "مبلغ القرض يتجاوز الحد الأقصى المسموح به للضمانات ({max})",
        warningBelowMinRate: "فائدة القرض أقل من الحد الأدنى المطلوب ({min}%)",
        ssErrorExceeds90Collateral: "مبلغ القرض الناتج ({gross}) يتجاوز الحد الأقصى المسموح به للضمانات ({max}).",
        colHeaderNum: "#",
        colHeaderAmount: "الاسمية",
        colHeaderNominal: "الاسمية",
        colHeaderRedemption: "الاستردادية",
        colHeaderRate: "الفائدة %",
        ssCd1SectionTitle: "الشهادات القائمة (شهادة 1)",
        ssCd2SectionTitle: "الشهادة الجديدة (شهادة 2)",
        ssLoanTermsTitle: "شروط القرض",
        addCd1Btn: "إضافة شهادة 1",
        cdInterestDateShort: "تاريخ العائد القادم",
        cdCouponDateShort: "العائد القادم",
        cdMaturityDateShort: "تاريخ الاستحقاق",
        remainingTenorLabel: "متبقي {n} شهر",
        matchCd1TenorBtn: "⚡ مطابقة مدة الشهادة: {n} شهر",
        advisoryMaturityExceeded: "مدة القرض ({loan} شهر) تتجاوز استحقاق الشهادة (متبقي {cd} شهر). عند الشهر {cd}، ستتطلب الشهادة تجديداً بسعر الفائدة السائد حينها، مما قد يغير الفائض الشهري.",
        reassuranceMaturityMatched: "فترة مضمونة: مدة القرض مغطاة بالكامل ضمن فترة الفائدة الثابتة الحالية للشهادة.",
        datesLabel: "التواريخ",
        firstInstDateLabel: "تاريخ أول قسط:",
        deferredM1Note: "(يوم 5 من الشهر الثاني)",
        nextCouponDateLabel: "تاريخ العائد القادم",
        maturityDateLabel: "تاريخ الاستحقاق",
        loanEndDateLabel: "تاريخ نهاية القرض:",
        loanEndDateTooltip: "تاريخ نهاية القرض: تاريخ سداد القسط الأخير للقرض (يُحسب بناءً على مدة القرض وجدول الأقساط).",
        whatsNewModalTitle: "ما الجديد ودليل التطبيق",
        tabWhatsNew: "✨ ما الجديد",
        tabAppFeatures: "🌟 دليل التطبيق",
        wnNativeChartTitle: "رسم بياني تفاعلي ومتحرك",
        wnNativeChartDesc: "حركة دائرية انسيابية متزامنة مع عداد رقمي فوري، وتأثيرات بصرية تفاعلية متوافقة تماماً مع الوضعين الليلي والنهاري.",
        wnSmartScrollTitle: "تمرير ذكي وتلقائي للنتائج",
        wnSmartScrollDesc: "تمرير انسيابي وسلس إلى ملخص القرض والرسم البياني فور الضغط على زر الحساب لجميع الشاشات والهواتف دون حجب.",
        wnShareOfferTitle: "مشاركة عروض تمويل فورية",
        wnShareOfferDesc: "نسخ عرض مالي منسق وجاهز للإرسال عبر واتساب والإيميل يوضح الفائض الشهري وصافي الأرباح عند الاستحقاق.",
        wnPrintOfferTitle: "طباعة ملخص بنكي في صفحة واحدة",
        wnPrintOfferDesc: "استخراج ورقة واحدة A4 موفرة للحبر تلخص خطة الشهادات وسداد القرض لتقديمها للبنك فوراً.",
        wnSsProgTitle: "برنامج التمويل الذاتي",
        wnSsProgDesc: "احسب كيف تسدد فوائد شهاداتك الجديدة كامل أقساط القرض مع تحقيق عائد وفائض شهري بدون أي عبء إضافي.",
        wnLimitTitle: "حدود اقتراض مطابقة للبنك",
        wnLimitDesc: "احتساب أقصى تمويل متاح تلقائياً بنسبة 90% من القيمة الاسمية أو الاستردادية لضمان مطابقة شروط البنك.",
        wnDueDateTitle: "تحديد تاريخ أول استحقاق",
        wnDueDateDesc: "يوضح موعد سداد أول قسط بدقة (يوم 5 من الشهر الثاني بعد المنح) لتنظيم ميزانيتك المالية بثقة.",
        featLoanTitle: "حاسبة قروض متكاملة",
        featLoanDesc: "احسب القسط، أو مبلغ القرض، أو الفائدة، أو المدة بنظام الرصيد المتناقص المعتمد بنكياً.",
        featSecuredTitle: "قروض بضمان الشهادات",
        featSecuredDesc: "اعرف أقصى مبلغ للاقتراض وما إذا كانت عوائد شهاداتك الشهرية تغطي قسط القرض بالكامل.",
        featSsTitle: "نظام القرض الذاتي",
        featSsDesc: "استثمر شهادتك الحالية لربط شهادة جديدة أعلى تسدد جميع الأقساط بالكامل مع فائض شهري.",
        featEarlyTitle: "حاسبة السداد المبكر",
        featEarlyDesc: "احسب رصيد الأصل المتبقي، وعمولة السداد، والفوائد المستحقة لأي تاريخ سداد تختاره.",
        featExportTitle: "جدول الأقساط وتقارير PDF",
        featExportDesc: "استعرض تفاصيل جدول السداد شهراً بشهر مع ضريبة الدمغة، واستخرج تقارير PDF وإكسيل بضغطة زر.",
        featOfflineTitle: "خصوصية تامة وبدون إنترنت",
        featOfflineDesc: "يعمل التطبيق محلياً بالكامل على جهازك دون اتصال؛ لا يتم إرسال أو مشاركة أي بيانات نهائياً.",
        whatsNewGotIt: "فهمت!",
        viewWhatsNewBtn: "✨ ما الجديد ودليل التطبيق",
        vsLabel: "مقابل",
        ssOfferCopied: "تم نسخ عرض العميل بنجاح!",
        ssOfferCopyError: "فشل نسخ عرض العميل، يرجى النسخ يدوياً.",
        ssCopyOfferBtn: "نسخ عرض العميل",
        ssPrintOfferBtn: "طباعة عرض العميل"
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

/* ================= SCROLL LOCK UTILITY ================= */
/**
 * Utility to prevent background scrolling when modals are open
 * without causing layout shifts from the scrollbar disappearing.
 * Centralized here to avoid repeating the logic across different components.
 */
const ScrollLock = (() => {
    let lockCount = 0;

    function isAnyModalOrPickerOpen() {
        const openModals = document.querySelectorAll('.modal:not(.pointer-events-none)');
        if (openModals.length > 0) return true;

        const mobileBackdrop = document.getElementById('mobile-picker-backdrop');
        if (mobileBackdrop && !mobileBackdrop.classList.contains('pointer-events-none') && !mobileBackdrop.classList.contains('opacity-0')) {
            return true;
        }
        const desktopPopover = document.getElementById('desktop-calendar-popover');
        if (desktopPopover && !desktopPopover.classList.contains('hidden')) {
            return true;
        }
        if (typeof window !== 'undefined' && typeof window.isDatePickerOpen === 'function' && window.isDatePickerOpen()) {
            return true;
        }
        return false;
    }

    function release() {
        lockCount = 0;
        document.body.classList.remove('scroll-lock');
        document.body.style.paddingRight = '';
        const nav = document.querySelector('nav');
        if (nav) nav.style.paddingRight = '';
        const updateBanner = document.getElementById('update-banner');
        if (updateBanner) updateBanner.style.paddingRight = '';
        const messageBox = document.getElementById('message-box');
        if (messageBox) messageBox.style.paddingRight = '';
    }

    function enable() {
        lockCount++;
        if (lockCount > 1 && document.body.classList.contains('scroll-lock')) return; // Already locked

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
            const pad = `${scrollbarWidth}px`;
            document.body.style.paddingRight = pad;
            const nav = document.querySelector('nav');
            if (nav) nav.style.paddingRight = pad;
            const updateBanner = document.getElementById('update-banner');
            if (updateBanner) updateBanner.style.paddingRight = pad;
            const messageBox = document.getElementById('message-box');
            if (messageBox && !messageBox.classList.contains('hidden')) {
                messageBox.style.paddingRight = pad;
            }
        }
        document.body.classList.add('scroll-lock');
    }

    function disable() {
        lockCount = Math.max(0, lockCount - 1);

        // Ground truth check: if no modal or picker is actually open in the DOM, release unconditionally
        if (!isAnyModalOrPickerOpen()) {
            release();
            return;
        }

        if (lockCount > 0) return; // Still locked by other active components
        release();
    }

    function forceUnlock() {
        release();
    }

    return { enable, disable, forceUnlock, isAnyModalOrPickerOpen };
})();

if (typeof window !== 'undefined') {
    window.ScrollLock = ScrollLock;
}

// Debug mode flag - set to true during development
const DEBUG_MODE = false;

/* ================= IN-APP MODAL HANDLER ================= */
/**
 * Manages in-app modal state and Escape key dismissal.
 * Operates purely in-memory without mutating browser history (history.pushState),
 * ensuring Chrome and Android OS never trigger the Predictive Back page-slide gesture.
 */
const BackHandler = (() => {
    // Stack of currently open modal identifiers
    const modalStack = [];

    // Map of modal IDs to their close functions
    const closeHandlers = {};

    /**
     * Register a modal as open
     * @param {string} modalId - Unique identifier for the modal
     * @param {function} closeHandler - Function to call to close this modal
     */
    function push(modalId, closeHandler) {
        if (modalStack.includes(modalId)) return; // Already tracked

        modalStack.push(modalId);
        closeHandlers[modalId] = closeHandler;

        if (DEBUG_MODE) console.log('BackHandler: registered', modalId, 'stack:', [...modalStack]);
    }

    /**
     * Unregister a modal when closed
     * @param {string} modalId - Unique identifier for the modal
     */
    function pop(modalId) {
        const index = modalStack.indexOf(modalId);
        if (index === -1) return; // Not tracked

        modalStack.splice(index, 1);
        delete closeHandlers[modalId];

        if (DEBUG_MODE) console.log('BackHandler: unregistered', modalId, 'stack:', [...modalStack]);
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
     * Close topmost open modal
     */
    function closeTopModal() {
        if (modalStack.length > 0) {
            const modalId = modalStack.pop();
            const closeHandler = closeHandlers[modalId];
            delete closeHandlers[modalId];

            if (closeHandler && typeof closeHandler === 'function') {
                closeHandler();
            }
        }
    }

    /**
     * Initialize modal keyboard and state handlers
     */
    function init() {
        // Handle Escape key to dismiss top modal
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalStack.length > 0) {
                closeTopModal();
            }
        });

        if (DEBUG_MODE) console.log('BackHandler: initialized (in-memory)');
    }

    return {
        push,
        pop,
        isOpen,
        closeTopModal,
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

function ensureDropdownFocusStyles() {
    const triggers = ['#freq-trigger', '#theme-toggle', '#lang-toggle'];
    triggers.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
            el.classList.add('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-indigo-500', 'dark:focus-visible:ring-indigo-400');
            if (selector === '#freq-trigger') {
                el.classList.add('focus-visible:ring-offset-1', 'dark:focus-visible:ring-offset-gray-900', 'rounded-lg');
            } else {
                el.classList.add('focus-visible:ring-offset-2', 'dark:focus-visible:ring-offset-gray-900');
            }
        }
    });
}

function initTheme(lastRes) {
    const savedTheme = localStorage.getItem('theme') || 'system';
    applyTheme(savedTheme, lastRes);
    ensureDropdownFocusStyles();
}

function applyTheme(themeMode, lastRes, skipChart = false) {
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

    if (!skipChart && lastRes && lastRes.P) {
        drawChart(lastRes.P, lastRes.TI, document.documentElement.lang, false);
    }
}

/**
 * Updates all UI text elements based on selected language
 * @param {string} lang - Language code ('en' or 'ar')
 */
function updateLangUI(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = t(lang, 'appTitle');

    document.querySelectorAll('[data-lang-key]').forEach(e => {
        if (e.id === 'date-label') {
            // Always use bookingDateLabel since this field is only visible in advanced mode
            e.textContent = t(lang, 'bookingDateLabel');
        }
        else if (e.dataset.langKey === 'iosMsg') {
            const shareIcon = `<svg class="w-5 h-5 inline text-blue-400 mx-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>`;
            e.innerHTML = `${t(lang, 'iosInstallBody')} ${shareIcon} ${t(lang, 'iosInstallFoot')}`;
        }
        else if (e.dataset.langKey === 'scheduleButton') {
            // Use correct key based on whether schedule is currently visible
            const schedCont = document.getElementById('schedule-container');
            const isShowing = schedCont && !schedCont.classList.contains('hidden');
            e.textContent = t(lang, isShowing ? 'scheduleButtonHide' : 'scheduleButton');
        }
        else {
            e.textContent = t(lang, e.dataset.langKey);
        }
    });

    const inputIds = ['loan-amount', 'interest-rate', 'loan-period', 'monthly-installment', 'early-settlement-fee', 'admin-fees', 'stamp-rate', 'td-rate', 'td-amount', 'td2-rate', 'ss-loan-rate', 'ss-loan-period', 'ss-admin-fees', 'ss-stamp-rate'];
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
        if (e.hasAttribute('data-col-index')) {
            const idx = e.dataset.colIndex;
            e.title = `${t(lang, key)} (${t(lang, 'collateralItemLabel')} ${idx})`;
        } else {
            e.title = t(lang, key);
        }
    });

    document.querySelectorAll('[data-lang-aria-label]').forEach(e => {
        const key = e.dataset.langAriaLabel;
        if (e.hasAttribute('data-col-index')) {
            const idx = e.dataset.colIndex;
            e.setAttribute('aria-label', `${t(lang, key)} (${t(lang, 'collateralItemLabel')} ${idx})`);
        } else {
            e.setAttribute('aria-label', t(lang, key));
        }
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

    // Dispatch event so other components can apply dynamic text formatting (e.g. adding (Months)/(Quarters))
    window.dispatchEvent(new CustomEvent('languageUpdated', { detail: { lang } }));
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

    const isDark = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
    if (type === 'error') {
        msgBox.style.backgroundColor = '#dc2626';
        msgBox.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    } else if (type === 'success') {
        msgBox.style.backgroundColor = '#16a34a';
        msgBox.style.borderColor = '#22c55e';
    } else {
        msgBox.style.backgroundColor = isDark ? '#374151' : '#1f2937';
        msgBox.style.borderColor = isDark ? '#4b5563' : '#374151';
    }
    msgBox.style.color = '#ffffff';

    const baseClasses = 'fixed top-24 left-0 right-0 mx-auto w-fit max-w-[90vw] z-[100] px-6 py-3 rounded-lg text-white font-medium shadow-2xl text-sm text-center transition duration-300 ease-out transform';

    let colorClasses;
    if (type === 'error') {
        colorClasses = 'toast-error bg-red-600 border-2 font-bold';
    } else if (type === 'success') {
        colorClasses = 'toast-success bg-green-600 border';
    } else {
        colorClasses = 'toast-normal bg-gray-800 dark:bg-gray-700 border border-gray-700 dark:border-gray-600';
    }

    // Start state: hidden above, fully transparent
    msgBox.className = `${baseClasses} ${colorClasses} opacity-0 -translate-y-3`;
    msgBox.classList.remove('hidden');

    // Inherit scrollbar padding if a modal is currently open
    if (document.body.classList.contains('scroll-lock')) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
            msgBox.style.paddingRight = `${scrollbarWidth}px`;
        }
    } else {
        msgBox.style.paddingRight = '';
    }

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

// Mobile Swipe-Down to Dismiss for Modals
let activeModalSwipeListeners = null;

function attachModalSwipeDismiss(modal) {
    if (activeModalSwipeListeners) return;

    const container = modal.querySelector('.modal-container');
    if (!container) return;
    const scrollable = container.querySelector('.overflow-y-auto') || container;

    let startY = 0;
    let startX = 0;
    let isTrackingSwipe = false;

    const onTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        // Only trigger pull-down if at top of scroll
        if (scrollable && scrollable.scrollTop > 0) return;

        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        isTrackingSwipe = true;
    };

    const onTouchEnd = (e) => {
        if (!isTrackingSwipe) return;
        if (scrollable && scrollable.scrollTop > 0) {
            isTrackingSwipe = false;
            return;
        }
        const endY = e.changedTouches[0]?.clientY || 0;
        const endX = e.changedTouches[0]?.clientX || 0;
        const deltaY = endY - startY;
        const deltaX = Math.abs(endX - startX);

        // If pulled downward at least 120px and mostly vertical
        if (deltaY > 120 && deltaY > deltaX * 1.5) {
            if (typeof haptic !== 'undefined') haptic('light');
            toggleModal(modal, false);
        }
        isTrackingSwipe = false;
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    activeModalSwipeListeners = () => {
        container.removeEventListener('touchstart', onTouchStart);
        container.removeEventListener('touchend', onTouchEnd);
        activeModalSwipeListeners = null;
    };
}

function removeModalSwipeDismiss() {
    if (activeModalSwipeListeners) {
        activeModalSwipeListeners();
    }
}

function toggleModal(modal, forceOpen) {
    if (!modal) return;
    const currentlyClosed = modal.classList.contains('pointer-events-none');
    const isOpening = typeof forceOpen === 'boolean' ? forceOpen : currentlyClosed;

    // Idempotency check: don't re-execute if already in the target state
    if (isOpening && !currentlyClosed) return;
    if (!isOpening && currentlyClosed) return;

    modal.classList.toggle('pointer-events-none', !isOpening);

    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) overlay.classList.toggle('opacity-0', !isOpening);

    const container = modal.querySelector('.modal-container');
    if (container) {
        container.classList.toggle('translate-y-full', !isOpening);
        container.classList.toggle('md:opacity-0', !isOpening);
        container.classList.toggle('md:scale-95', !isOpening);
    }

    const modalId = modal.id || 'unknown-modal';

    // Clear any pending close timer for this specific modal
    if (modal._closeTimer) {
        clearTimeout(modal._closeTimer);
        modal._closeTimer = null;
    }

    if (isOpening) {
        // Capture active trigger element for WCAG focus restoration on close
        modal._triggerEl = document.activeElement;

        // Clean up any visible tutorial tooltip when opening a modal
        const existingTooltip = document.querySelector('.tutorial-tooltip');
        if (existingTooltip) {
            if (existingTooltip._autoDismissTimer) clearTimeout(existingTooltip._autoDismissTimer);
            existingTooltip.remove();
        }

        ScrollLock.enable();
        attachModalSwipeDismiss(modal);

        // Register with in-memory BackHandler
        if (typeof BackHandler !== 'undefined') {
            BackHandler.push(modalId, () => toggleModal(modal, false));
        }
    } else {
        removeModalSwipeDismiss();

        // Unregister from in-memory BackHandler immediately
        if (typeof BackHandler !== 'undefined') {
            BackHandler.pop(modalId);
        }

        const trigger = modal._triggerEl;
        modal._triggerEl = null;

        modal._closeTimer = setTimeout(() => {
            modal._closeTimer = null;
            ScrollLock.disable();
            // Restore keyboard focus to launcher element
            if (trigger && typeof trigger.focus === 'function' && document.contains(trigger)) {
                try { trigger.focus(); } catch (_) {}
            }
        }, 300);
    }
}

/**
 * Lightweight Native SVG Doughnut Chart Helpers
 */
function _polarToCartesian(cx, cy, r, angleInRadians) {
    return {
        x: cx + r * Math.cos(angleInRadians),
        y: cy + r * Math.sin(angleInRadians)
    };
}

function _describeDonutSegment(cx, cy, rInner, rOuter, startAngle, endAngle) {
    const sweep = endAngle - startAngle;
    if (isNaN(sweep) || sweep <= 0.0001) return '';
    if (sweep >= 2 * Math.PI - 0.001) {
        // Full circle donut: draw two semicircles to avoid SVG arc coordinate collapse
        const mid = startAngle + Math.PI;
        const p1 = _polarToCartesian(cx, cy, rOuter, startAngle);
        const p2 = _polarToCartesian(cx, cy, rOuter, mid);
        const p3 = _polarToCartesian(cx, cy, rInner, mid);
        const p4 = _polarToCartesian(cx, cy, rInner, startAngle);
        return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${rOuter} ${rOuter} 0 1 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} A ${rOuter} ${rOuter} 0 1 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} M ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} A ${rInner} ${rInner} 0 1 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)} A ${rInner} ${rInner} 0 1 0 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} Z`;
    }

    const p1 = _polarToCartesian(cx, cy, rOuter, startAngle);
    const p2 = _polarToCartesian(cx, cy, rOuter, endAngle);
    const p3 = _polarToCartesian(cx, cy, rInner, endAngle);
    const p4 = _polarToCartesian(cx, cy, rInner, startAngle);
    const largeArc = sweep > Math.PI ? 1 : 0;

    return [
        `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
        `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
        `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
        `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
        'Z'
    ].join(' ');
}

/**
 * Backward-compatible stub (Chart.js has been replaced with native SVG)
 * @returns {Promise}
 */
function loadChartJS() {
    return Promise.resolve();
}

/**
 * Draw native SVG doughnut chart
 * @param {number} principal - Loan principal amount
 * @param {number} interest - Total interest amount
 * @param {string} lang - Language code for labels
 */
function drawChart(principal, interest, lang, animate = true) {
    const container = document.getElementById('loan-chart');
    if (!container) return;

    if (chartInst && typeof chartInst.destroy === 'function') {
        chartInst.destroy();
        chartInst = null;
    }

    const P = Math.max(0, Number(principal) || 0);
    const I = Math.max(0, Number(interest) || 0);
    const total = P + I;

    if (total <= 0) {
        container.innerHTML = '';
        return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const borderColor = isDark ? '#111827' : '#ffffff';

    const pFrac = total > 0 ? P / total : 1;
    const iFrac = total > 0 ? I / total : 0;

    const pPct = (pFrac * 100).toFixed(1) + '%';
    const iPct = (iFrac * 100).toFixed(1) + '%';
    const pAmt = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(Math.round(P));
    const iAmt = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(Math.round(I));

    const pLabel = t(lang, 'chartLabelPrincipal') || (lang === 'ar' ? 'أصل القرض' : 'Principal');
    const iLabel = t(lang, 'chartLabelInterest') || (lang === 'ar' ? 'الفوائد الإجمالية' : 'Interest');

    const pAngle = pFrac * 2 * Math.PI;
    const iAngle = iFrac * 2 * Math.PI;
    const start = -Math.PI / 2;

    const pPathFinal = _describeDonutSegment(100, 100, 56, 88, start, start + pAngle);
    const iPathFinal = iFrac > 0 ? _describeDonutSegment(100, 100, 56, 88, start + pAngle, start + 2 * Math.PI) : '';

    const initialPD = animate ? '' : pPathFinal;
    const initialID = animate ? '' : iPathFinal;
    const initialVal = animate ? '0.0%' : pPct;

    const uid = 'd_' + Math.random().toString(36).substr(2, 6);

    container.innerHTML = `
        <div class="donut-chart-container select-none">
            <!-- Donut Visual -->
            <div class="donut-visual">
                <svg viewBox="0 0 200 200" class="w-full h-full overflow-visible" role="img" aria-label="${pLabel}: ${pPct}, ${iLabel}: ${iPct}">
                    <!-- Background Guide Track -->
                    <circle cx="100" cy="100" r="72" stroke="currentColor" stroke-width="32" fill="none" class="text-gray-100 dark:text-gray-800/80" />
                    <g>
                        <path id="${uid}_p" d="${initialPD}" fill="#3b82f6" stroke="${borderColor}" stroke-width="2.5" class="donut-slice cursor-pointer">
                            <title>${pLabel}: ${pPct} (${pAmt})</title>
                        </path>
                        ${iFrac > 0 ? `
                        <path id="${uid}_i" d="${initialID}" fill="#ef4444" stroke="${borderColor}" stroke-width="2.5" class="donut-slice cursor-pointer">
                            <title>${iLabel}: ${iPct} (${iAmt})</title>
                        </path>` : ''}
                    </g>
                </svg>
                <!-- Center Metric HUD -->
                <div id="${uid}_center" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span id="${uid}_clabel" class="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">${pLabel}</span>
                    <span id="${uid}_cval" class="text-lg sm:text-2xl font-black text-gray-900 dark:text-gray-100 font-mono">${initialVal}</span>
                </div>
            </div>

            <!-- Responsive Legend Grid -->
            <div class="donut-legend-grid">
                <!-- Principal Legend Item -->
                <div id="${uid}_leg_p" class="donut-legend-item flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl cursor-pointer group">
                    <span class="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] sm:rounded-[5px] shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform" style="background-color: #3b82f6;"></span>
                    <div class="flex flex-col min-w-0 flex-1">
                        <span class="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">${pLabel}</span>
                        <div class="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 font-mono" dir="ltr">${pPct} <span class="font-normal text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs truncate">(${pAmt})</span></div>
                    </div>
                </div>

                <!-- Interest Legend Item -->
                ${iFrac > 0 ? `
                <div id="${uid}_leg_i" class="donut-legend-item flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl cursor-pointer group">
                    <span class="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] sm:rounded-[5px] shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform" style="background-color: #ef4444;"></span>
                    <div class="flex flex-col min-w-0 flex-1">
                        <span class="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">${iLabel}</span>
                        <div class="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 font-mono" dir="ltr">${iPct} <span class="font-normal text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs truncate">(${iAmt})</span></div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    const sp = document.getElementById(`${uid}_p`);
    const si = document.getElementById(`${uid}_i`);
    const lp = document.getElementById(`${uid}_leg_p`);
    const li = document.getElementById(`${uid}_leg_i`);
    const cl = document.getElementById(`${uid}_clabel`);
    const cv = document.getElementById(`${uid}_cval`);

    let animFrameId = null;
    let observer = null;
    let safetyTimer = null;
    let animStarted = false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function checkInView() {
        if (animStarted) return;
        const rect = container.getBoundingClientRect();
        // Trigger if chart is visible within viewport
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            startAnimation();
        }
    }

    function startAnimation() {
        if (animStarted) return;
        animStarted = true;
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        window.removeEventListener('scroll', checkInView);
        if (safetyTimer) {
            clearTimeout(safetyTimer);
            safetyTimer = null;
        }

        if (!animate || prefersReducedMotion) {
            if (sp) sp.setAttribute('d', pPathFinal);
            if (si && iFrac > 0) si.setAttribute('d', iPathFinal);
            if (cv) cv.textContent = pPct;
            return;
        }

        const duration = 750;
        let startTime = null;

        function step(now) {
            if (startTime === null) startTime = now;
            const elapsed = Math.max(0, now - startTime);
            const rawProgress = Math.min(1, elapsed / duration);
            // Ease-out cubic: 1 - (1 - t)^3
            const progress = 1 - Math.pow(1 - rawProgress, 3);

            const currPAngle = pAngle * progress;
            const currIAngle = iAngle * progress;

            if (sp) {
                sp.setAttribute('d', _describeDonutSegment(100, 100, 56, 88, start, start + currPAngle));
            }
            if (si && iFrac > 0) {
                si.setAttribute('d', _describeDonutSegment(100, 100, 56, 88, start + currPAngle, start + currPAngle + currIAngle));
            }
            if (cv) {
                cv.textContent = (progress * pFrac * 100).toFixed(1) + '%';
            }

            if (rawProgress < 1) {
                animFrameId = requestAnimationFrame(step);
            } else {
                if (sp) sp.setAttribute('d', pPathFinal);
                if (si && iFrac > 0) si.setAttribute('d', iPathFinal);
                if (cv) cv.textContent = pPct;
            }
        }
        animFrameId = requestAnimationFrame(step);
    }

    // Smart viewport-aware animation trigger:
    // Only runs the progress-ring sweep when the chart enters the user's viewport
    if (!animate || prefersReducedMotion) {
        startAnimation();
    } else {
        // Immediate check: if already in view (e.g. desktop or user already scrolled down), animate right away
        checkInView();

        if (!animStarted) {
            if (typeof IntersectionObserver !== 'undefined') {
                observer = new IntersectionObserver((entries) => {
                    for (const entry of entries) {
                        if (entry.isIntersecting) {
                            startAnimation();
                            break;
                        }
                    }
                }, {
                    threshold: 0.2 // Trigger when at least 20% of chart is visible in viewport
                });
                observer.observe(container);
            }

            window.addEventListener('scroll', checkInView, { passive: true });

            // Fallback safety timer: ensures animation runs even if observer is throttled or delayed
            safetyTimer = setTimeout(() => {
                if (!animStarted) startAnimation();
            }, 2500);
        }
    }

    // Interactive Two-Way Hover Wiring
    function setHover(target) {
        if (target === 'p') {
            if (sp) sp.style.transform = 'scale(1.05)';
            if (si) si.style.opacity = '0.4';
            if (cl) cl.textContent = pLabel;
            if (cv) cv.textContent = pPct;
        } else if (target === 'i') {
            if (si) si.style.transform = 'scale(1.05)';
            if (sp) sp.style.opacity = '0.4';
            if (cl) cl.textContent = iLabel;
            if (cv) cv.textContent = iPct;
        }
    }

    function clearHover() {
        if (sp) {
            sp.style.transform = 'scale(1)';
            sp.style.opacity = '1';
        }
        if (si) {
            si.style.transform = 'scale(1)';
            si.style.opacity = '1';
        }
        if (cl) cl.textContent = pLabel;
        if (cv) cv.textContent = pPct;
    }

    if (sp) {
        sp.onmouseenter = () => setHover('p');
        sp.onmouseleave = clearHover;
    }
    if (lp) {
        lp.onmouseenter = () => setHover('p');
        lp.onmouseleave = clearHover;
    }

    if (si && li) {
        si.onmouseenter = () => setHover('i');
        si.onmouseleave = clearHover;
        li.onmouseenter = () => setHover('i');
        li.onmouseleave = clearHover;
    }

    chartInst = {
        destroy() {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            window.removeEventListener('scroll', checkInView);
            if (safetyTimer) {
                clearTimeout(safetyTimer);
                safetyTimer = null;
            }
            if (animFrameId) {
                cancelAnimationFrame(animFrameId);
                animFrameId = null;
            }
            if (container) container.innerHTML = '';
            chartInst = null;
        }
    };
}

function formatCurrencyInput(input) {
    if (!input) return;

    let selectionStart = 0;
    try {
        selectionStart = input.selectionStart || 0;
    } catch (e) {
        // Some input types (like number) don't support selectionStart
    }
    
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
            // Strip leading zeros so e.g. deleting '1' from '1,000,000'
            // leaves '' (empty) instead of collapsing '000000' → 0.
            const stripped = integerPart.replace(/^0+/, '');
            if (stripped === '') {
                // All zeros — only show '0' when there IS a decimal part
                formattedInt = decimalPart ? '0' : '';
            } else {
                // Use Intl.NumberFormat to avoid ReDoS vulnerability (CWE-1333)
                // BigInt handles arbitrary precision for large loan amounts
                try {
                    formattedInt = new Intl.NumberFormat('en-US').format(BigInt(stripped));
                } catch (e) {
                    console.warn('Currency formatting error:', e);
                    formattedInt = stripped; // Fallback
                }
            }
        }

        newVal = formattedInt + decimalPart;

    }

    if (oldVal !== newVal) {
        input.value = newVal;
        restoreCursorPosition(input, oldVal, newVal, selectionStart);
    }
}

/**
 * Helper to restore cursor position after formatting
 */
function restoreCursorPosition(input, oldVal, newVal, selectionStart) {
    // If cursor was at the very end of old string, put it at the very end of new string
    if (selectionStart >= oldVal.length) {
        try {
            input.setSelectionRange(newVal.length, newVal.length);
        } catch (e) {}
        return;
    }

    // Number of commas before the cursor in the old string
    let oldCommas = (oldVal.slice(0, selectionStart).match(/,/g) || []).length;
    
    // We want the cursor to stay after the same number of non-comma characters.
    let targetNonCommas = selectionStart - oldCommas;
    
    let newPos = 0;
    let nonCommaCount = 0;
    while (newPos < newVal.length && nonCommaCount < targetNonCommas) {
        if (newVal[newPos] !== ',') {
            nonCommaCount++;
        }
        newPos++;
    }
    
    try { 
        input.setSelectionRange(newPos, newPos); 
    } catch (e) { 
        /* Ignore */ 
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

/* ================= DATE INPUT ================= */
/* All date input code has been moved to js/dateinput.js for isolation.
 * Do NOT add date-related functions here — edit dateinput.js instead. */

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

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderHistoryList(history, lang) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    if (!Array.isArray(history) || history.length === 0) {
        historyList.innerHTML = `<p class="text-center text-gray-500 py-8 text-sm">${escapeHtml(t(lang, 'noHistorySaved'))}</p>`;
        return;
    }
    historyList.innerHTML = history.map((item, index) => {
        const itemDate = item.date ? new Date(item.date) : new Date();
        const date = !isNaN(itemDate.getTime())
            ? itemDate.toLocaleDateString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '';
        const pVal = item.res?.P || 0;
        const tiVal = item.res?.TI || 0;
        const rVal = typeof item.res?.R === 'number' ? item.res.R.toFixed(2) : '0.00';
        const nVal = parseInt(item.res?.N, 10) || 0;
        const mVal = item.res?.M || 0;
        const totalPayment = pVal + tiVal;
        const freq = parseInt(item.values?.freq) || (item.res?.freq) || 1;
        const periodUnit = freq === 3
            ? (lang === 'ar' ? ' ربع' : ' qtr')
            : (lang === 'ar' ? ' شهر' : ' mo');
        const instUnit = freq === 3
            ? (lang === 'ar' ? '/ربع' : '/qtr')
            : (lang === 'ar' ? '/شهر' : '/mo');
        const safeIndex = parseInt(index, 10);
        const itemId = item.id || `legacy_${safeIndex}`;
        return `
        <div class="history-card bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all active:scale-[0.98]" data-id="${escapeHtml(itemId)}" data-index="${safeIndex}">
            <div class="flex justify-between items-start mb-2">
                <p class="text-xs text-gray-400">${escapeHtml(date)}</p>
                <button class="delete-btn p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors" data-id="${escapeHtml(itemId)}" data-index="${safeIndex}" title="${escapeHtml(t(lang, 'deleteBtn'))}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
            <p class="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1">${escapeHtml(fmt(pVal))}</p>
            <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                    ${escapeHtml(rVal)}%
                </span>
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    ${escapeHtml(nVal)}${escapeHtml(periodUnit)}
                </span>
                <span class="flex items-center gap-1">
                    <svg class="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    ${escapeHtml(fmt(mVal))}${escapeHtml(instUnit)}
                </span>
            </div>
            <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span class="text-xs text-gray-400">${escapeHtml(t(lang, 'totalSumLabel'))}</span>
                <span class="font-semibold text-gray-700 dark:text-gray-200 text-sm">${escapeHtml(fmt(totalPayment))}</span>
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

            // Create tooltip safely without innerHTML
            const tooltip = document.createElement('div');
            tooltip.className = 'stamp-tooltip';
            const labelSpan = document.createElement('span');
            labelSpan.style.opacity = '0.8';
            labelSpan.textContent = stampLabel + ': ';
            const valSpan = document.createElement('span');
            valSpan.style.fontWeight = 'bold';
            valSpan.textContent = stampValue || '';
            tooltip.appendChild(labelSpan);
            tooltip.appendChild(valSpan);

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
        // Prepare for animation
        schedCont.style.maxHeight = '0px';
        schedCont.style.marginTop = '0px';
        schedCont.style.borderWidth = '0px';
        void schedCont.offsetHeight; // Force reflow

        // Animate to exact content height and restore margins/borders
        schedCont.style.maxHeight = schedCont.scrollHeight + 'px';
        schedCont.style.marginTop = '';
        schedCont.style.borderWidth = '';
        schedCont.classList.remove('opacity-0');
        schedCont.classList.add('opacity-100');
        
        setTimeout(() => {
            schedCont.style.maxHeight = 'none'; // Allow dynamic resizing
        }, 300);

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

    // Animate smoothly to 0
    schedCont.style.maxHeight = schedCont.scrollHeight + 'px';
    void schedCont.offsetHeight; // Force reflow

    schedCont.style.maxHeight = '0px';
    schedCont.style.marginTop = '0px';
    schedCont.style.borderWidth = '0px';
    schedCont.classList.remove('opacity-100');
    schedCont.classList.add('opacity-0');
    
    setTimeout(() => { 
        schedCont.classList.add('hidden');
        schedCont.style.maxHeight = ''; // Clean up inline styles
        schedCont.style.marginTop = '';
        schedCont.style.borderWidth = '';
    }, 300);

    // Reset schedule button to "Show Schedule" state
    const schedBtn = document.getElementById('schedule-button');
    if (schedBtn) {
        const lang = document.documentElement.lang || 'en';
        const label = schedBtn.querySelector('[data-lang-key]');
        if (label) label.textContent = t(lang, 'scheduleButton');
        schedBtn.classList.remove('bg-cyan-100', 'dark:bg-cyan-900/30', 'text-cyan-700', 'dark:text-cyan-300', 'border', 'border-cyan-300', 'dark:border-cyan-700', 'hover:bg-cyan-200', 'dark:hover:bg-cyan-900/50');
        schedBtn.classList.add('bg-cyan-600', 'hover:bg-cyan-700', 'text-white');
    }

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
        let startX = 0;
        let currentY = 0;
        let isDragging = false;

        container.addEventListener('touchstart', (e) => {
            if (window.innerWidth >= 768) return;
            const scrollable = container.querySelector('.overflow-y-auto') || container;
            if (scrollable && scrollable.scrollTop > 0) return;

            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
            isDragging = false;

            container.style.transition = 'none';
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (window.innerWidth >= 768) return;
            const scrollable = container.querySelector('.overflow-y-auto') || container;
            if (scrollable && scrollable.scrollTop > 0 && !isDragging) return;

            currentY = e.touches[0].clientY;
            const currentX = e.touches[0].clientX;
            const diff = currentY - startY;
            const diffX = Math.abs(currentX - startX);

            // Only drag to dismiss if at the very top and dragging downward
            if (diff > 10 && diff > diffX * 1.2 && (!scrollable || scrollable.scrollTop <= 0)) {
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

            if (diff > 120) {
                container.style.transition = 'transform 0.3s ease-out';
                container.style.transform = 'translateY(100%)';
                if (typeof haptic !== 'undefined') haptic('light');
                toggleModal(modal, false);

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
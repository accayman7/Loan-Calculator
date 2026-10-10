// js/export.js - Export & Print Utilities (Print/PDF & Excel XLSX)
// Standalone module for handling report generation, printing, and Excel exports

(function () {
    'use strict';

    let _exportAppState = null;
    let _exportDateInputs = null;
    let xlsxLoadPromise = null;

/**
 * Initialize the Export module with application state and inputs
 * @param {Object} appState - Global application state
 * @param {Object} dateInputs - Reference to date input fields
 */
function initExport(appState, dateInputs) {
    _exportAppState = appState;
    _exportDateInputs = dateInputs;
}

/**
 * Accessible polite screen-reader announcer for export actions
 * @param {string} msg - Announcement message
 */
function announceExportStatus(msg) {
    if (typeof announceLiveStatus === 'function') {
        announceLiveStatus('export-live-region', msg);
        return;
    }
    const liveRegion = document.getElementById('export-live-region');
    if (!liveRegion || !msg) return;
    liveRegion.textContent = '';
    setTimeout(() => {
        liveRegion.textContent = msg;
    }, 50);
}

/**
 * Lazy load XLSX library on first use
 * @returns {Promise} Resolves when XLSX is loaded
 */
function loadXLSX() {
    if (xlsxLoadPromise) return xlsxLoadPromise;
    if (typeof XLSX !== 'undefined') return Promise.resolve();

    xlsxLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './xlsx.mini.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            xlsxLoadPromise = null; // Allow retry
            reject(new Error('Failed to load XLSX library'));
        };
        document.head.appendChild(script);
    });
    return xlsxLoadPromise;
}

/**
 * Constructs and styles the printable HTML document inside the print iframe
 * Separates print DOM generation and CSS layout from print execution.
 * @param {Document} doc - iframe document
 * @param {Object} options - Cloned DOM nodes and language {summaryClone, scheduleClone, disclaimerClone, lang}
 */
function buildPrintReportHtmlDocument(doc, { summaryClone, scheduleClone, disclaimerClone, lang }) {
    const safeLang = lang === 'ar' ? 'ar' : 'en';
    const html = doc.documentElement;
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
        table th.hidden, table td.hidden { display: table-cell !important; }
        .info-icon,
        #period-reconcile-card,
        #target-reconcile-card,
        #summary-final-inst-note,
        #calculation-fingerprint,
        .sched-detail-row,
        button {
            display: none !important;
        }
        .summary-collapse-wrapper:not(.expanded) {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
        }
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

    // Clean up summaryClone and scheduleClone for a clean, professional printed document
    summaryClone.querySelectorAll('.info-icon').forEach(el => el.remove());
    summaryClone.querySelectorAll('.summary-collapse-wrapper:not(.expanded)').forEach(el => el.remove());
    summaryClone.querySelectorAll('button').forEach(el => el.remove());
    summaryClone.querySelector('#period-reconcile-card')?.remove();
    summaryClone.querySelector('#target-reconcile-card')?.remove();
    summaryClone.querySelector('#summary-final-inst-note')?.remove();
    summaryClone.querySelector('#calculation-fingerprint')?.remove();

    scheduleClone.querySelectorAll('.info-icon').forEach(el => el.remove());
    scheduleClone.querySelectorAll('.sched-detail-row').forEach(el => el.remove());
    scheduleClone.querySelectorAll('button').forEach(el => el.remove());

    const container = doc.createElement('div');
    container.className = 'print-container';

    // Add Header
    const h2 = doc.createElement('h2');
    h2.className = 'text-xl font-bold mb-4 mt-8';
    h2.style.cssText = 'text-align: center; break-before: page; page-break-before: always;';
    h2.textContent = t(lang, 'scheduleTitle');

    container.appendChild(summaryClone);
    if (disclaimerClone) container.appendChild(disclaimerClone);
    container.appendChild(h2);

    const tableWrapper = doc.createElement('div');
    tableWrapper.className = 'w-full';
    tableWrapper.appendChild(scheduleClone);
    container.appendChild(tableWrapper);

    // Footer
    const footer = doc.createElement('div');
    footer.style.cssText = 'margin-top: 2rem; text-align: center; font-size: 0.75rem; color: #666; border-top: 1px solid #ccc; pt-4';
    footer.textContent = `Generated by Loan Calculator • ${new Date().toLocaleDateString(safeLang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB')}`;
    container.appendChild(footer);

    body.appendChild(container);
}

/**
 * Handle print action for loan schedule and summary report
 */
function printReport() {
    const appState = _exportAppState || (typeof AppState !== 'undefined' ? AppState : null);
    if (!appState || !appState.schedule || appState.schedule.length === 0) return;
    const frame = document.getElementById('print-frame');
    if (!frame) return;

    const pdfBtn = document.getElementById('export-pdf-button');
    const spinner = pdfBtn?.querySelector('.export-spinner');
    const icon = pdfBtn?.querySelector('.export-icon');
    const textSpan = pdfBtn?.querySelector('.export-text');

    const setPdfLoading = (loading) => {
        if (!pdfBtn) return;
        pdfBtn.disabled = loading;
        pdfBtn.setAttribute('aria-busy', loading ? 'true' : 'false');
        if (spinner) spinner.classList.toggle('hidden', !loading);
        if (icon) icon.classList.toggle('hidden', loading);
        if (textSpan) textSpan.textContent = t(appState.lang, loading ? 'exportingPdf' : 'exportPdfButton');
    };

    setPdfLoading(true);

    try {
        const doc = frame.contentWindow.document;
        const summaryClone = document.getElementById('summary-section').cloneNode(true);
        const scheduleClone = document.getElementById('schedule-container').cloneNode(true);
        const disclaimerClone = document.getElementById('assumptions-panel')?.cloneNode(true);

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

        buildPrintReportHtmlDocument(doc, {
            summaryClone,
            scheduleClone,
            disclaimerClone,
            lang: appState.lang
        });

        // Show success toast before opening print dialog so it is clearly visible as dialog opens
        showToast(t(appState.lang, 'exportPdfSuccess'), "success");
        announceExportStatus(t(appState.lang, 'exportPdfSuccess'));

        // Allow UI to repaint toast and restore button state before browser modal print dialog pauses JS execution
        setTimeout(() => {
            setPdfLoading(false);
            try {
                frame.contentWindow.focus();
                frame.contentWindow.print();
            } catch (printErr) {
                console.error("Print dialog error:", printErr);
                showToast(t(appState.lang, 'exportPdfError'), "error");
            }
        }, 250);
    } catch (e) {
        console.error(e);
        showToast(t(appState.lang, 'exportPdfError'), "error");
        setPdfLoading(false);
        announceExportStatus(t(appState.lang, 'exportPdfError'));
    }
}

/**
 * Handle Excel (.xlsx) export of loan summary, schedule, and assumptions
 */
async function exportExcel() {
    const appState = _exportAppState || (typeof AppState !== 'undefined' ? AppState : null);
    if (!appState || !appState.schedule || appState.schedule.length === 0) return;

    const xlsxBtn = document.getElementById('export-xlsx-button');
    const spinner = xlsxBtn?.querySelector('.export-spinner');
    const icon = xlsxBtn?.querySelector('.export-icon');
    const textSpan = xlsxBtn?.querySelector('.export-text');

    const setXlsxLoading = (loading) => {
        if (!xlsxBtn) return;
        xlsxBtn.disabled = loading;
        xlsxBtn.setAttribute('aria-busy', loading ? 'true' : 'false');
        if (spinner) spinner.classList.toggle('hidden', !loading);
        if (icon) icon.classList.toggle('hidden', loading);
        if (textSpan) textSpan.textContent = t(appState.lang, loading ? 'exportingXlsx' : 'exportXlsxButton');
    };

    setXlsxLoading(true);
    showToast(t(appState.lang, 'exportXlsxStarting'));
    announceExportStatus(t(appState.lang, 'exportXlsxStarting'));
    const startTime = Date.now();
    const MIN_LOADING_TIME = 600; // ms: ensures animation is smooth and perceptible

    try {
        try {
            await loadXLSX();
        } catch (e) {
            showToast(t(appState.lang, 'exportXlsxError'), "error");
            setXlsxLoading(false);
            announceExportStatus(t(appState.lang, 'exportXlsxError'));
            return;
        }

        const l = appState.lang;
        const res = appState.lastRes;
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

        const isAdvanced = document.getElementById('advanced-toggle')?.checked;
        if (isAdvanced) {
            const adminVal = Number.parseFloat(document.getElementById('admin-fees')?.value) || 0;
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
            const dateVal = _exportDateInputs?.startNative?.value || document.getElementById('start-date-native')?.value;
            if (dateVal) {
                summaryData.push([t(l, dateLabelKey), "", "", "", "", dateVal]);
            }
        }

        summaryData.push([]);

        // 2. Prepare Schedule Data
        const scheduleTitleRow = [t(l, 'scheduleTitle')];

        // Check if any rows have stamps
        const hasAnyStamps = appState.schedule.some(r => r.hasStamp && r.stamp > 0);

        // Build headers - add Stamp column if stamps exist
        const headers = hasAnyStamps
            ? [t(l, 'colMonth'), t(l, 'colDate'), t(l, 'colInstallment'), t(l, 'colBalance'), t(l, 'colInterest'), t(l, 'colPrincipal'), t(l, 'colRemaining'), t(l, 'totalStampLabel')]
            : [t(l, 'colMonth'), t(l, 'colDate'), t(l, 'colInstallment'), t(l, 'colBalance'), t(l, 'colInterest'), t(l, 'colPrincipal'), t(l, 'colRemaining')];

        const scheduleRows = appState.schedule.map(r => {
            const locale = isRTL ? 'ar-EG-u-nu-latn' : 'en-US';
            const isAdv = document.getElementById('advanced-toggle')?.checked;
            let dateStr;
            if (isAdv) {
                const d = r.rawDate.getDate().toString().padStart(2, '0');
                const m = (r.rawDate.getMonth() + 1).toString().padStart(2, '0');
                const y = r.rawDate.getFullYear();
                dateStr = `${d}/${m}/${y}`;
            } else {
                dateStr = r.rawDate.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
            }

            const instVal = r.inst !== undefined ? r.inst : (r.prin + r.int);

            // Base row data
            const rowData = [r.m, dateStr, Number.parseFloat(instVal.toFixed(2)), Number.parseFloat(r.bal.toFixed(2)), Number.parseFloat(r.int.toFixed(2)), Number.parseFloat(r.prin.toFixed(2)), Number.parseFloat(r.rem.toFixed(2))];

            // Add stamp column if stamps exist
            if (hasAnyStamps) {
                rowData.push(r.hasStamp && r.stamp > 0 ? Number.parseFloat(r.stamp.toFixed(2)) : '');
            }

            return rowData;
        });

        // 3a. Prepare Assumptions Data for Audit Trail
        const assumptionsData = [
            [],
            [t(l, 'assumptionsTitle')],
            [l === 'ar' ? '• طريقة احتساب الفائدة: الرصيد المتناقص (الأقساط المتساوية)' : '• Interest Calculation Method: Reducing Balance (Annuity)'],
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
        showToast(t(appState.lang, 'exportXlsxSuccess'), "success");
        announceExportStatus(t(appState.lang, 'exportXlsxSuccess'));

    } catch (e) {
        console.error(e);
        showToast(t(appState.lang, 'exportXlsxError'), "error");
        announceExportStatus(t(appState.lang, 'exportXlsxError'));
    } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);
        setTimeout(() => {
            setXlsxLoading(false);
        }, remaining);
    }
}

// Global exposure
window.initExport = initExport;
window.printReport = printReport;
window.exportExcel = exportExcel;
window.loadXLSX = loadXLSX;
window.buildPrintReportHtmlDocument = buildPrintReportHtmlDocument;
window.ExportManager = {
    init: initExport,
    printReport,
    exportExcel,
    loadXLSX,
    buildPrintReportHtmlDocument
};
})();

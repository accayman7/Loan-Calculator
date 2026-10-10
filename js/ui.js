// js/ui.js - Core UI Shell, Theme, Localization, Toasts & Amortization Schedule
// Subsystems extracted for clean modularity:
//   - Modals & ScrollLock: js/modals.js
//   - SVG Doughnut Chart: js/chart.js
//   - Input Masking & Auto-fit: js/formatters.js

// js/ui.js - User Interface Functions & Theme Logic
// Fixed: Radio button logic, Translation fallbacks, Chart safety

// Centralized translations are in js/translations.js
// Fallback if translations.js is not loaded
if (typeof t !== 'function') {
    window.t = function (lang, key) {
        if (typeof txt !== 'undefined' && txt[lang] && txt[lang][key]) return txt[lang][key];
        return key;
    };
}

let chartInst = null;
let modalTimer = null;
let toastTimer = null;

// Debug mode flag - set to true during development
const DEBUG_MODE = false;

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
            <span class="text-sm font-medium">${escapeHtml(message)}</span>
        </div>
        <button id="update-refresh-btn" class="px-3 py-1 bg-white text-indigo-600 text-sm font-bold rounded hover:bg-indigo-50 transition-colors flex-shrink-0">
            ${escapeHtml(btnText)}
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

let systemThemeListenerAttached = false;
function setupSystemThemeListener() {
    if (systemThemeListenerAttached) return;
    systemThemeListenerAttached = true;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
        const currentTheme = localStorage.getItem('theme') || 'system';
        if (currentTheme === 'system') {
            const lastRes = typeof AppState !== 'undefined' ? AppState.lastRes : null;
            applyTheme('system', lastRes);
            if (typeof updateThemeMenuState === 'function') {
                updateThemeMenuState('system');
            }
        }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handleSystemThemeChange);
    }

    // Re-sync on app resume / window focus if system theme was changed in OS settings
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) handleSystemThemeChange();
    });
    window.addEventListener('focus', handleSystemThemeChange);
}

let orientationListenerAttached = false;
function setupOrientationListener() {
    if (orientationListenerAttached) return;
    orientationListenerAttached = true;

    const updateOrientation = () => {
        const isLandscape = window.matchMedia('(orientation: landscape)').matches || 
            (window.innerWidth > window.innerHeight && window.innerWidth >= 480);
        const orientation = isLandscape ? 'landscape' : 'portrait';
        document.documentElement.setAttribute('data-orientation', orientation);
        document.documentElement.classList.toggle('landscape', isLandscape);
        document.documentElement.classList.toggle('portrait', !isLandscape);

        // Redraw chart if active to adapt to new orientation canvas width
        if (typeof AppState !== 'undefined' && AppState.lastRes && AppState.lastRes.P && typeof drawChart === 'function') {
            drawChart(AppState.lastRes.P, AppState.lastRes.TI, document.documentElement.lang, false);
        }
    };

    updateOrientation();

    const orientationQuery = window.matchMedia('(orientation: landscape)');
    if (typeof orientationQuery.addEventListener === 'function') {
        orientationQuery.addEventListener('change', updateOrientation);
    } else if (typeof orientationQuery.addListener === 'function') {
        orientationQuery.addListener(updateOrientation);
    }

    window.addEventListener('orientationchange', () => {
        setTimeout(updateOrientation, 50);
        setTimeout(updateOrientation, 250);
    }, { passive: true });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateOrientation, 100);
    }, { passive: true });
}

function initTheme(lastRes) {
    const savedTheme = localStorage.getItem('theme') || 'system';
    applyTheme(savedTheme, lastRes);
    ensureDropdownFocusStyles();
    setupSystemThemeListener();
    setupOrientationListener();
}

function applyTheme(themeMode, lastRes, skipChart = false, skipMetaTheme = false) {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = themeMode === 'dark' || (themeMode === 'system' && isSystemDark);

    document.documentElement.setAttribute('data-theme', themeMode);

    if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        if (!skipMetaTheme) {
            document.getElementById('meta-theme-color')?.setAttribute('content', '#020617');
        }
    } else {
        document.documentElement.classList.remove('dark');
        if (!skipMetaTheme) {
            document.getElementById('meta-theme-color')?.setAttribute('content', '#f9fafb');
        }
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

    // Info icon tooltips (js/tooltip.js reads data-tooltip and live-updates if visible)
    document.querySelectorAll('[data-lang-tooltip]').forEach(el => {
        const key = el.dataset.langTooltip;
        el.dataset.tooltip = t(lang, key);
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
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
    const isRTL = document.documentElement.dir === 'rtl' || document.documentElement.getAttribute('dir') === 'rtl';
    const paddingProp = isRTL ? 'paddingLeft' : 'paddingRight';
    if (document.body.classList.contains('scroll-lock')) {
        const isTouchOrMobile = window.innerWidth < 768 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        const supportsScrollbarGutter = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('scrollbar-gutter', 'stable');
        const scrollbarWidth = (isTouchOrMobile || supportsScrollbarGutter) ? 0 : Math.max(0, window.innerWidth - document.documentElement.clientWidth);
        if (scrollbarWidth > 0) {
            msgBox.style[paddingProp] = `${scrollbarWidth}px`;
        }
    } else {
        msgBox.style.paddingRight = '';
        msgBox.style.paddingLeft = '';
    }

    void msgBox.offsetWidth; // Force reflow

    // End state: in position, fully visible
    msgBox.classList.remove('opacity-0', '-translate-y-3');
    msgBox.classList.add('opacity-100', 'translate-y-0');

    toastTimer = setTimeout(() => {
        hideToast();
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



function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;
window.safeEscapeHtml = escapeHtml;

// Note: renderHistoryList and HistoryManager are maintained in js/history.js

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
            stampHeader.className = 'hidden sm:table-cell px-1 py-3 text-end text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 whitespace-nowrap';
            stampHeader.textContent = t(language, 'colStamp');
            dateCol.after(stampHeader);
        }
    } else if (!hasAnyStamps && existingStampHeader) {
        existingStampHeader.remove();
    } else if (hasAnyStamps && existingStampHeader) {
        // Update translation if language changed
        existingStampHeader.textContent = t(language, 'colStamp');
    }

    const rows = [];
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
        const hasStampThisRow = r.hasStamp && r.stamp > 0;
        let stampCell = '';
        if (hasAnyStamps) {
            if (hasStampThisRow) {
                stampCell = `<td class="hidden sm:table-cell px-1 py-2 text-end font-medium text-purple-600 dark:text-purple-400 text-xs">${fmt(r.stamp)}</td>`;
                rowClass = 'stamp-row cursor-pointer';
                dataAttr = `data-stamp="${fmt(r.stamp)}"`;
            } else {
                stampCell = `<td class="hidden sm:table-cell px-1 py-2 text-end text-gray-300 dark:text-gray-600 text-xs">-</td>`;
            }
        }

        rows.push(`
        <tr class="${rowClass}" ${dataAttr}>
            <td class="px-0.5 sm:px-1 py-2 text-center text-gray-500 dark:text-gray-400 whitespace-nowrap">${r.m}</td>
            <td class="px-0.5 sm:px-1 py-2 text-end text-gray-500 dark:text-gray-400 whitespace-nowrap" dir="ltr">${dateStr}</td>
            ${stampCell}
            <td class="hidden sm:table-cell px-1 py-2 text-end font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">${fmt(r.bal)}</td>
            <td class="px-0.5 sm:px-1 py-2 text-end text-gray-500 dark:text-gray-400 whitespace-nowrap">${fmt(r.int)}</td>
            <td class="px-0.5 sm:px-1 py-2 text-end text-gray-500 dark:text-gray-400 whitespace-nowrap">${fmt(r.prin)}</td>
            <td class="px-0.5 sm:px-1 py-2 text-end font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap ltr:pr-2 sm:ltr:pr-4 rtl:pl-2 sm:rtl:pl-4">${fmt(r.rem)}</td>
        </tr>`);
    }

    schedBody.innerHTML = rows.join('');

    // Delegated click handler for stamp rows (mobile tooltip - only when stamp column is hidden)
    if (!schedBody._stampListenerAttached) {
        schedBody._stampListenerAttached = true;
        schedBody.addEventListener('click', function (e) {
            const row = e.target.closest('tr[data-stamp]');
            if (!row || !schedBody.contains(row)) return;

            // Only show tooltip on mobile portrait when stamp column is hidden
            if (window.matchMedia('(min-width: 640px)').matches || window.matchMedia('(orientation: landscape)').matches || document.documentElement.getAttribute('data-orientation') === 'landscape') {
                return;
            }

            // Remove any existing tooltip
            const existingTooltip = document.querySelector('.stamp-tooltip');
            if (existingTooltip) existingTooltip.remove();

            // Get stamp value
            const stampValue = row.dataset.stamp;
            const currentLang = document.documentElement.lang || 'en';
            const stampLabel = typeof t === 'function' ? t(currentLang, 'colStamp') : 'Stamp Duty';

            // Get row position
            const rect = row.getBoundingClientRect();

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

            // Position the tooltip dynamically
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 8}px`;

            // Add arrow pointer
            const arrow = document.createElement('div');
            arrow.className = 'stamp-tooltip-arrow';
            tooltip.appendChild(arrow);

            document.body.appendChild(tooltip);

            // Trigger animation
            requestAnimationFrame(() => {
                tooltip.classList.add('show');
            });

            // Haptic feedback
            if (typeof haptic !== 'undefined') haptic('light');

            // Auto-remove after 2s
            setTimeout(() => {
                tooltip.classList.remove('show');
                setTimeout(() => tooltip.remove(), 200);
            }, 2000);
        });
    }

    if (autoOpen) {
        schedCont.classList.remove('hidden');
        // Initial state before animation
        schedCont.style.maxHeight = '0px';
        schedCont.style.opacity = '0';
        schedCont.style.transform = 'translateY(-8px)';
        schedCont.style.transition = 'max-height 0.35s ease-out, opacity 0.3s ease-out, transform 0.3s ease-out';
        void schedCont.offsetHeight; // Force reflow

        // Animate to full content height
        requestAnimationFrame(() => {
            const targetHeight = Math.max(schedCont.scrollHeight, 350);
            schedCont.style.maxHeight = (targetHeight + 80) + 'px';
            schedCont.style.opacity = '1';
            schedCont.style.transform = 'translateY(0)';
            schedCont.classList.remove('opacity-0');
            schedCont.classList.add('opacity-100');
        });
        
        setTimeout(() => {
            schedCont.style.maxHeight = 'none'; // Allow dynamic resizing
            schedCont.style.transition = ''; // Clean up inline transition
        }, 420);

        // Auto-scroll smoothly to schedule table
        setTimeout(() => {
            schedCont.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);

        // Update button to "Hide Schedule" state using dedicated high-contrast classes
        const schedBtn = document.getElementById('schedule-button');
        if (schedBtn) {
            const label = schedBtn.querySelector('[data-lang-key]');
            if (label) label.textContent = t(language, 'scheduleButtonHide');
            schedBtn.classList.remove('schedule-btn-inactive', 'bg-cyan-600', 'hover:bg-cyan-700', 'text-white');
            schedBtn.classList.add('schedule-btn-active');
        }

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
    if (!schedCont || schedCont.classList.contains('hidden')) return;

    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        document.activeElement.blur();
    }

    // Set starting height for smooth collapse
    schedCont.style.maxHeight = schedCont.scrollHeight + 'px';
    schedCont.style.opacity = '1';
    schedCont.style.transform = 'translateY(0)';
    schedCont.style.transition = 'max-height 0.3s ease-out, opacity 0.25s ease-out, transform 0.25s ease-out';
    void schedCont.offsetHeight; // Force reflow

    // Clean up after animation completes
    const onEnd = () => {
        schedCont.removeEventListener('transitionend', onEnd);
        schedCont.classList.add('hidden');
        schedCont.style.maxHeight = '';
        schedCont.style.opacity = '';
        schedCont.style.transform = '';
        schedCont.style.transition = '';
    };
    schedCont.addEventListener('transitionend', onEnd, { once: true });

    // Fallback timeout in case transitionend doesn't fire
    setTimeout(() => {
        if (!schedCont.classList.contains('hidden')) {
            onEnd();
        }
    }, 400);

    requestAnimationFrame(() => {
        schedCont.style.maxHeight = '0px';
        schedCont.style.opacity = '0';
        schedCont.style.transform = 'translateY(-8px)';
        schedCont.classList.remove('opacity-100');
        schedCont.classList.add('opacity-0');
    });

    // Reset schedule button to "Show Schedule" state
    const schedBtn = document.getElementById('schedule-button');
    if (schedBtn) {
        const lang = document.documentElement.lang || 'en';
        const label = schedBtn.querySelector('[data-lang-key]');
        if (label) label.textContent = t(lang, 'scheduleButton');
        schedBtn.classList.remove('schedule-btn-active', 'bg-cyan-100', 'dark:bg-cyan-900/30', 'text-cyan-700', 'dark:text-cyan-300', 'border', 'border-cyan-300', 'dark:border-cyan-700', 'hover:bg-cyan-200', 'dark:hover:bg-cyan-900/50');
        schedBtn.classList.add('schedule-btn-inactive');
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

// Early localization pass: translates DOM immediately upon parsing rather than waiting for window.load
// This completely eliminates the Flash of Untranslated Content (FOUC) and blank text in Arabic layout
(function earlyLocalization() {
    const apply = () => {
        try {
            const savedLang = localStorage.getItem('language') || (navigator.language.startsWith('ar') ? 'ar' : 'en');
            if (typeof updateLangUI === 'function') {
                updateLangUI(savedLang);
            }
            if (document.body) {
                document.body.classList.add('lang-ready');
            }
        } catch (e) {
            console.warn('[EarlyLocalization] Failed to apply language early', e);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply, { once: true });
    } else {
        apply();
    }
})();


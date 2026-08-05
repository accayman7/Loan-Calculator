// js/datepicker.js - Custom Scroll Wheel Date Picker
// Replaces native mobile calendar with a touch-friendly wheel picker
// v2.0 - Major refactoring: AbortController cleanup, accessibility, pointer events

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS & STATE
    // ═══════════════════════════════════════════════════════════════════════════

    const DEFAULT_ITEM_HEIGHT = 44; // Fallback if measurement fails
    const VISIBLE_ITEMS = 5;
    const YEAR_RANGE = [2000, 2099];

    // State variables
    let currentLang = 'en';
    let pickerModal = null;
    let onConfirmCallback = null;
    let selectedDate = new Date();
    let launcherElement = null; // #8: Track which element opened the picker
    let isPickerOpen = false;   // #8: Guard against double-open

    // #1 & #3: AbortController map + date constraints
    const columnAbortControllers = new Map();
    let minDate = null;
    let maxDate = null;

    // #5: Cached item heights per column
    const columnItemHeights = new Map();

    // ═══════════════════════════════════════════════════════════════════════════
    // TRANSLATION HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function getMonthNames(lang) {
        if (typeof txt !== 'undefined' && txt[lang]?.monthNames) {
            return txt[lang].monthNames;
        }
        return lang === 'ar'
            ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
            : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    }

    function getDayNamesShort(lang) {
        if (typeof txt !== 'undefined' && txt[lang]?.dayNamesShort) {
            return txt[lang].dayNamesShort;
        }
        return lang === 'ar'
            ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
            : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    }

    function getTranslation(key) {
        if (typeof t === 'function') {
            return t(currentLang, key);
        }
        const fallbacks = {
            confirmDate: currentLang === 'ar' ? 'تأكيد' : 'Confirm',
            cancelDate: currentLang === 'ar' ? 'إلغاء' : 'Cancel',
            todayDate: currentLang === 'ar' ? 'اليوم' : 'Today',
            lblYear: currentLang === 'ar' ? 'السنة' : 'Year',
            lblMonth: currentLang === 'ar' ? 'الشهر' : 'Month',
            lblDay: currentLang === 'ar' ? 'اليوم' : 'Day',
            lblDayOfWeek: currentLang === 'ar' ? 'اليوم في الأسبوع' : 'Day of Date',
            selectDate: currentLang === 'ar' ? 'اختر التاريخ' : 'Select date',
            clearDate: currentLang === 'ar' ? 'مسح' : 'Clear',
            prevMonth: currentLang === 'ar' ? 'الشهر السابق' : 'Previous month',
            nextMonth: currentLang === 'ar' ? 'الشهر التالي' : 'Next month',
            invalidDateHint: currentLang === 'ar' ? 'تاريخ غير صحيح. استخدم يوم/شهر/سنة.' : 'Invalid date. Use DD/MM/YYYY.',
            dateRangeHint: currentLang === 'ar' ? 'التاريخ يجب أن يكون بين {min} و {max}.' : 'Date must be between {min} and {max}.'
        };
        return fallbacks[key] || key;
    }

    function getDayNamesFull(lang) {
        if (typeof txt !== 'undefined' && txt[lang]?.dayNamesFull) {
            return txt[lang].dayNamesFull;
        }
        return lang === 'ar'
            ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
            : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHARED UTILITIES (used by both desktop and mobile renderers)
    // ═══════════════════════════════════════════════════════════════════════════

    function formatDDMMYYYY(date) {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    }

    function parseDDMMYYYYStrict(str) {
        if (!str || typeof str !== 'string') return null;
        // Strip LRM marks (\u200E) used by initDateInput for RTL rendering.
        // Without this, parseInt("\u200E20", 10) returns NaN and valid dates fail.
        const clean = str.replace(/\u200E/g, '');
        const parts = clean.split('/');
        if (parts.length !== 3) return null;
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
        if (y < 1000 || y > 9999) return null;
        const date = new Date(y, m, d);
        // Validate no rollover
        if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null;
        return date;
    }

    function isPointerFine() {
        return matchMedia('(pointer: fine)').matches &&
            !matchMedia('(pointer: coarse)').matches;
    }

    function getFirstDayOfWeek(lang) {
        // Always start with Sunday (0) for consistent UX
        return 0;
    }

    // #3 & #4: Normalize date constraint to midnight, support Date or DD/MM/YYYY string
    function normalizeConstraint(value) {
        if (!value) return null;
        let date;
        if (value instanceof Date) {
            // Clone to avoid mutating caller's object
            date = new Date(value.getTime());
        } else if (typeof value === 'string') {
            date = parseDDMMYYYYStrict(value);
            if (!date) return null;
        } else {
            return null;
        }
        // Normalize to local midnight
        date.setHours(0, 0, 0, 0);
        return date;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DATE UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getDayName(year, month, day) {
        const date = new Date(year, month, day);
        const dayIndex = date.getDay();
        return getDayNamesShort(currentLang)[dayIndex];
    }

    // #2: Strict date validation - prevents JS Date rollover bugs
    function isValidDate(year, month, day) {
        const date = new Date(year, month, day);
        return date.getFullYear() === year &&
            date.getMonth() === month &&
            date.getDate() === day;
    }

    // #3: Check if a date is within min/max bounds
    function isDateInRange(year, month, day) {
        const date = new Date(year, month, day);
        if (minDate && date < minDate) return false;
        if (maxDate && date > maxDate) return false;
        return true;
    }

    // #3: Clamp date to min/max range
    function clampDateToRange(date) {
        if (minDate && date < minDate) return new Date(minDate);
        if (maxDate && date > maxDate) return new Date(maxDate);
        return date;
    }

    // #5: Dynamically measure item height
    function measureItemHeight(scrollEl) {
        const item = scrollEl.querySelector('.date-picker-item:not(.padding)');
        if (item) {
            const height = item.getBoundingClientRect().height;
            if (height > 0) return height;
        }
        return DEFAULT_ITEM_HEIGHT;
    }

    function getItemHeight(columnId) {
        return columnItemHeights.get(columnId) || DEFAULT_ITEM_HEIGHT;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MODAL CREATION
    // ═══════════════════════════════════════════════════════════════════════════

    function createPickerModal() {
        const backdrop = document.createElement('div');
        backdrop.className = 'date-picker-backdrop';
        backdrop.id = 'date-picker-backdrop';

        const modal = document.createElement('div');
        modal.className = 'date-picker-modal';
        modal.id = 'date-picker-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'date-picker-title');

        const isRTL = document.documentElement.dir === 'rtl';

        modal.innerHTML = `
            <div class="date-picker-drag-handle md:hidden" aria-hidden="true">
                <div class="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto"></div>
            </div>
            <div class="date-picker-header">
                <button type="button" class="date-picker-btn cancel" id="date-picker-cancel">
                    ${getTranslation('cancelDate')}
                </button>
                <button type="button" class="date-picker-btn today" id="date-picker-today">
                    ${getTranslation('todayDate')}
                </button>
                <button type="button" class="date-picker-btn confirm" id="date-picker-confirm">
                    ${getTranslation('confirmDate')}
                </button>
            </div>
            <div class="date-picker-title-bar">
                <span class="date-picker-title" id="date-picker-title" aria-live="polite"></span>
            </div>
            <div class="date-picker-body">
                <div class="date-picker-highlight" aria-hidden="true"></div>
                <div class="date-picker-columns ${isRTL ? 'rtl' : 'ltr'}">
                    <div class="date-picker-column" id="col-dayname" data-type="dayname" tabindex="-1" role="status" aria-label="${getTranslation('lblDayOfWeek')}">
                        <div class="date-picker-scroll" id="scroll-dayname"></div>
                    </div>
                    <div class="date-picker-column" id="col-day" data-type="day" tabindex="0" role="listbox" aria-label="${getTranslation('lblDay')}">
                        <div class="date-picker-scroll" id="scroll-day"></div>
                    </div>
                    <div class="date-picker-column" id="col-month" data-type="month" tabindex="0" role="listbox" aria-label="${getTranslation('lblMonth')}">
                        <div class="date-picker-scroll" id="scroll-month"></div>
                    </div>
                    <div class="date-picker-column" id="col-year" data-type="year" tabindex="0" role="listbox" aria-label="${getTranslation('lblYear')}">
                        <div class="date-picker-scroll" id="scroll-year"></div>
                    </div>
                </div>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // ─────────────────────────────────────────────────────────────────────
        // MODAL-LEVEL EVENT LISTENERS (permanent, attached once)
        // ─────────────────────────────────────────────────────────────────────

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closePicker(false);
        });

        document.getElementById('date-picker-cancel').addEventListener('click', () => closePicker(false));
        document.getElementById('date-picker-confirm').addEventListener('click', () => closePicker(true));
        document.getElementById('date-picker-today').addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('medium');
            selectToday();
        });

        // #4: Escape to close + focus trap
        modal.addEventListener('keydown', handleModalKeydown);

        // Swipe-to-close gesture handling
        setupSwipeToClose(modal);

        return backdrop;
    }

    // #4: Modal keyboard handler (Escape, Tab trap)
    function handleModalKeydown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation(); // Prevent bubbling to app's global Escape handler
            closePicker(false);
            return;
        }

        // Focus trap: Tab cycles within modal
        if (e.key === 'Tab') {
            const modal = document.getElementById('date-picker-modal');
            const focusables = modal.querySelectorAll('button, [tabindex="0"]');
            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    function setupSwipeToClose(modal) {
        let swipeStartY = 0;
        let swipeCurrentY = 0;
        let isSwipeDragging = false;

        modal.addEventListener('touchstart', (e) => {
            if (window.innerWidth >= 768) return;
            const target = e.target;
            const header = modal.querySelector('.date-picker-header');
            const dragHandle = modal.querySelector('.date-picker-drag-handle');
            if (!header.contains(target) && !dragHandle?.contains(target)) return;

            swipeStartY = e.touches[0].clientY;
            isSwipeDragging = false;
            modal.style.transition = 'none';
        }, { passive: true });

        modal.addEventListener('touchmove', (e) => {
            if (window.innerWidth >= 768) return;
            if (swipeStartY === 0) return;

            swipeCurrentY = e.touches[0].clientY;
            const diff = swipeCurrentY - swipeStartY;

            if (diff > 25) {
                isSwipeDragging = true;
                if (e.cancelable) e.preventDefault();
                modal.style.transform = `translateY(${diff}px)`;
            }
        }, { passive: false });

        modal.addEventListener('touchend', () => {
            if (window.innerWidth >= 768) return;
            if (!isSwipeDragging) {
                modal.style.transition = '';
                modal.style.transform = '';
                swipeStartY = 0;
                return;
            }

            const diff = swipeCurrentY - swipeStartY;

            if (diff > 100) {
                modal.style.transition = 'transform 0.3s ease-out';
                modal.style.transform = 'translateY(100%)';
                if (typeof haptic !== 'undefined') haptic('light');
                setTimeout(() => {
                    closePicker(false, true);
                    modal.style.transform = '';
                    modal.style.transition = '';
                }, 300);
            } else {
                modal.style.transition = 'transform 0.3s ease-out';
                modal.style.transform = '';
            }

            isSwipeDragging = false;
            swipeStartY = 0;
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COLUMN POPULATION (with AbortController cleanup)
    // ═══════════════════════════════════════════════════════════════════════════

    // #1 & #6: Unified, leak-free column population
    function populateColumn(scrollEl, items, selectedIndex, onSelect, options = {}) {
        const columnEl = scrollEl.parentElement;
        const columnId = columnEl.id;

        // #1: Abort any existing listeners for this column
        if (columnAbortControllers.has(columnId)) {
            columnAbortControllers.get(columnId).abort();
        }
        const controller = new AbortController();
        columnAbortControllers.set(columnId, controller);
        const signal = controller.signal;

        // Clear content
        scrollEl.innerHTML = '';

        // Add padding items for scroll centering
        const paddingCount = Math.floor(VISIBLE_ITEMS / 2);

        for (let i = 0; i < paddingCount; i++) {
            const padItem = document.createElement('div');
            padItem.className = 'date-picker-item padding';
            scrollEl.appendChild(padItem);
        }

        // #4: Add items with proper ARIA semantics
        items.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'date-picker-item';
            itemEl.textContent = item.label;
            itemEl.dataset.value = item.value;
            itemEl.dataset.index = index;
            itemEl.id = `${columnId}-option-${index}`;
            itemEl.setAttribute('role', 'option');
            itemEl.setAttribute('aria-selected', index === selectedIndex ? 'true' : 'false');

            // #3: Mark disabled items
            if (item.disabled) {
                itemEl.classList.add('disabled');
                itemEl.setAttribute('aria-disabled', 'true');
            }

            scrollEl.appendChild(itemEl);
        });

        for (let i = 0; i < paddingCount; i++) {
            const padItem = document.createElement('div');
            padItem.className = 'date-picker-item padding';
            scrollEl.appendChild(padItem);
        }

        // #5: Measure actual item height & Align Scroll (Fix #1 & #2)
        // Ensure snap is enabled initially
        columnEl.style.scrollSnapType = 'y mandatory';
        columnEl.style.scrollBehavior = 'auto';

        requestAnimationFrame(() => {
            const measuredHeight = measureItemHeight(scrollEl);
            columnItemHeights.set(columnId, measuredHeight);
            // Precise alignment using valid height
            columnEl.scrollTop = selectedIndex * measuredHeight;
        });

        // ─────────────────────────────────────────────────────────────────────
        // INPUT-AWARE SNAPPING: Disable snap during active input, snap on idle
        // ─────────────────────────────────────────────────────────────────────

        let isInteracting = false;
        let idleSnapTimer = null;
        let keyboardTargetIndex = selectedIndex;
        let lastHapticIndex = selectedIndex;

        function beginInteraction() {
            isInteracting = true;
            clearTimeout(idleSnapTimer);
            // Disable snap while user is driving the scroll
            columnEl.style.scrollSnapType = 'none';
            columnEl.style.scrollBehavior = 'auto';
        }

        function endInteractionAndSnap() {
            isInteracting = false;

            const h = getItemHeight(columnId);
            const rawIndex = Math.round(columnEl.scrollTop / h);
            let finalIndex = Math.max(0, Math.min(rawIndex, items.length - 1));

            // Skip disabled items (search nearest enabled)
            if (items[finalIndex]?.disabled) {
                let up = finalIndex - 1, down = finalIndex + 1, found = -1;
                while (up >= 0 || down < items.length) {
                    if (up >= 0 && !items[up].disabled) { found = up; break; }
                    if (down < items.length && !items[down].disabled) { found = down; break; }
                    up--; down++;
                }
                if (found !== -1) finalIndex = found;
            }

            // Update keyboard target
            keyboardTargetIndex = finalIndex;

            // Re-enable snap AFTER instant scroll (avoids animation fighting)
            columnEl.style.scrollBehavior = 'auto';
            columnEl.scrollTo({ top: finalIndex * h, behavior: 'auto' });
            columnEl.style.scrollSnapType = 'y mandatory';

            // Commit selection once
            if (onSelect && !items[finalIndex]?.disabled) {
                onSelect(items[finalIndex].value, finalIndex);
            }
        }

        function scheduleIdleSnap(delay = 140) {
            clearTimeout(idleSnapTimer);
            idleSnapTimer = setTimeout(endInteractionAndSnap, delay);
        }

        // ─────────────────────────────────────────────────────────────────────
        // POINTER EVENTS (replaces mouse events, unifies mouse+touch+stylus)
        // ─────────────────────────────────────────────────────────────────────

        let isDragging = false;
        let startY;
        let startScrollTop;
        let lastY;
        let velocity = 0;
        let lastTime = 0;
        let animationFrame;

        columnEl.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;

            beginInteraction();
            isDragging = true;
            startY = e.clientY;
            lastY = startY;
            lastTime = Date.now();
            velocity = 0;
            startScrollTop = columnEl.scrollTop;

            columnEl.setPointerCapture(e.pointerId);
            columnEl.style.cursor = 'grabbing';
            columnEl.focus();

            e.preventDefault();
            cancelAnimationFrame(animationFrame);
        }, { signal });

        columnEl.addEventListener('pointermove', (e) => {
            if (!isDragging) return;

            const y = e.clientY;
            const now = Date.now();
            const dt = now - lastTime;

            if (dt > 0) {
                velocity = (lastY - y) / dt;
            }

            const walk = (y - startY) * 1.5;
            columnEl.scrollTop = startScrollTop - walk;

            lastY = y;
            lastTime = now;
        }, { signal });

        columnEl.addEventListener('pointerup', (e) => {
            if (!isDragging) return;

            isDragging = false;
            columnEl.releasePointerCapture(e.pointerId);
            columnEl.style.cursor = 'grab';
            cancelAnimationFrame(animationFrame);

            // One controlled snap (no inertia - cleaner UX)
            endInteractionAndSnap();
        }, { signal });

        columnEl.addEventListener('pointercancel', (e) => {
            if (isDragging) {
                isDragging = false;
                columnEl.releasePointerCapture(e.pointerId);
                columnEl.style.cursor = 'grab';
                endInteractionAndSnap();
            }
        }, { signal });

        // ─────────────────────────────────────────────────────────────────────
        // WHEEL EVENT HANDLER
        // ─────────────────────────────────────────────────────────────────────

        columnEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            beginInteraction();

            const h = getItemHeight(columnId);
            const maxScroll = Math.max(0, (items.length - 1) * h);
            columnEl.scrollTop = Math.max(0, Math.min(columnEl.scrollTop + e.deltaY, maxScroll));

            scheduleIdleSnap(240); // Longer delay for trackpads
        }, { passive: false, signal });

        // ─────────────────────────────────────────────────────────────────────
        // KEYBOARD SUPPORT
        // ─────────────────────────────────────────────────────────────────────

        columnEl.addEventListener('keydown', (e) => {
            const h = getItemHeight(columnId);

            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closePicker(false);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                keyboardTargetIndex = Math.max(0, keyboardTargetIndex - 1);
                columnEl.scrollTo({ top: keyboardTargetIndex * h, behavior: 'auto' });
                scheduleIdleSnap(200);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                keyboardTargetIndex = Math.min(items.length - 1, keyboardTargetIndex + 1);
                columnEl.scrollTo({ top: keyboardTargetIndex * h, behavior: 'auto' });
                scheduleIdleSnap(200);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();
                // RTL-aware navigation
                const isRTL = document.documentElement.dir === 'rtl';
                const goPrev = (e.key === 'ArrowLeft' && !isRTL) || (e.key === 'ArrowRight' && isRTL);
                const target = goPrev ? columnEl.previousElementSibling : columnEl.nextElementSibling;
                if (target && target.getAttribute('tabindex') === '0') target.focus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                closePicker(true);
            }
        }, { signal });

        // Sync keyboardTargetIndex when scroll ends
        columnEl.addEventListener('scrollend', () => {
            const h = getItemHeight(columnId);
            keyboardTargetIndex = Math.round(columnEl.scrollTop / h);
        }, { signal });

        // ─────────────────────────────────────────────────────────────────────
        // SCROLL HANDLER (haptic + aria only; snap is handled by idle timer)
        // ─────────────────────────────────────────────────────────────────────

        columnEl.addEventListener('scroll', () => {
            const h = getItemHeight(columnId);
            const currentIndex = Math.round(columnEl.scrollTop / h);
            const clampedIndex = Math.max(0, Math.min(currentIndex, items.length - 1));

            // Haptic feedback when passing through a new item
            if (clampedIndex !== lastHapticIndex) {
                if (typeof haptic !== 'undefined') haptic('light');
                lastHapticIndex = clampedIndex;

                // Update aria-selected
                scrollEl.querySelectorAll('[role="option"]').forEach((opt, i) => {
                    opt.setAttribute('aria-selected', i === clampedIndex ? 'true' : 'false');
                });
                columnEl.setAttribute('aria-activedescendant', `${columnId}-option-${clampedIndex}`);
            }

            // Guard: do NOT snap while user is interacting
            if (isInteracting) return;

            // Safety snap for programmatic scrolls (e.g., initial load)
            scheduleIdleSnap(120);
        }, { passive: true, signal });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COLUMN UPDATE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function updateDayNameColumn() {
        const scrollEl = document.getElementById('scroll-dayname');
        if (!scrollEl) return;

        const dayName = getDayName(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        scrollEl.innerHTML = '';

        const paddingCount = Math.floor(VISIBLE_ITEMS / 2);
        for (let i = 0; i < paddingCount; i++) {
            const padItem = document.createElement('div');
            padItem.className = 'date-picker-item padding';
            scrollEl.appendChild(padItem);
        }

        const itemEl = document.createElement('div');
        itemEl.className = 'date-picker-item selected-static';
        itemEl.textContent = dayName;
        scrollEl.appendChild(itemEl);

        for (let i = 0; i < paddingCount; i++) {
            const padItem = document.createElement('div');
            padItem.className = 'date-picker-item padding';
            scrollEl.appendChild(padItem);
        }

        scrollEl.parentElement.style.overflow = 'hidden';
    }

    function updateDayColumn() {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        let currentDay = selectedDate.getDate();

        if (currentDay > daysInMonth) {
            currentDay = daysInMonth;
            selectedDate.setDate(currentDay);
        }

        const days = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const isDisabled = !isDateInRange(year, month, d);
            days.push({
                label: String(d).padStart(2, '0'),
                value: d,
                disabled: isDisabled
            });
        }

        const scrollEl = document.getElementById('scroll-day');
        populateColumn(scrollEl, days, currentDay - 1, (value) => {
            selectedDate.setDate(value);
            updateDayNameColumn();
            updateTitle();
        });
    }

    function populateMonthColumn() {
        const monthNames = getMonthNames(currentLang);
        const year = selectedDate.getFullYear();

        const months = monthNames.map((name, i) => {
            // #3: Check if any day in this month is selectable
            let isDisabled = false;
            if (minDate || maxDate) {
                const monthStart = new Date(year, i, 1);
                const monthEnd = new Date(year, i + 1, 0);
                if (minDate && monthEnd < minDate) isDisabled = true;
                if (maxDate && monthStart > maxDate) isDisabled = true;
            }
            return { label: name, value: i, disabled: isDisabled };
        });

        const scrollEl = document.getElementById('scroll-month');
        populateColumn(scrollEl, months, selectedDate.getMonth(), (value) => {
            const currentDay = selectedDate.getDate();
            selectedDate.setDate(1);
            selectedDate.setMonth(value);
            const maxDays = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
            selectedDate.setDate(Math.min(currentDay, maxDays));

            // Fix #8: Smart clamp day to valid range
            selectedDate = clampDateToRange(selectedDate);

            updateDayColumn();
            updateDayNameColumn();
            updateTitle();
        });
    }

    function populateYearColumn() {
        const years = [];
        for (let y = YEAR_RANGE[0]; y <= YEAR_RANGE[1]; y++) {
            // #3: Check if this year has any selectable dates
            let isDisabled = false;
            if (minDate || maxDate) {
                const yearStart = new Date(y, 0, 1);
                const yearEnd = new Date(y, 11, 31);
                if (minDate && yearEnd < minDate) isDisabled = true;
                if (maxDate && yearStart > maxDate) isDisabled = true;
            }
            years.push({ label: String(y), value: y, disabled: isDisabled });
        }

        const currentYearIndex = selectedDate.getFullYear() - YEAR_RANGE[0];

        const scrollEl = document.getElementById('scroll-year');
        populateColumn(scrollEl, years, currentYearIndex, (value) => {
            const currentDay = selectedDate.getDate();
            selectedDate.setDate(1);
            selectedDate.setFullYear(value);
            const maxDays = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
            selectedDate.setDate(Math.min(currentDay, maxDays));

            // Fix #8: Smart clamp day to valid range
            selectedDate = clampDateToRange(selectedDate);

            updateDayColumn();
            updateDayNameColumn();
            updateTitle();
        });
    }

    function updateTitle() {
        const titleEl = document.getElementById('date-picker-title');
        if (titleEl) {
            const d = String(selectedDate.getDate()).padStart(2, '0');
            const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const y = selectedDate.getFullYear();
            const dayName = getDayName(y, selectedDate.getMonth(), selectedDate.getDate());
            titleEl.textContent = `${dayName}, ${d}/${m}/${y}`;
        }
    }

    function selectToday() {
        let today = new Date();
        // #3: Clamp to range if needed
        today = clampDateToRange(today);
        selectedDate = today;

        populateYearColumn();
        populateMonthColumn();
        updateDayColumn();
        updateDayNameColumn();
        updateTitle();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OPEN / CLOSE
    // ═══════════════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════════════
    // DESKTOP CALENDAR PICKER
    // ═══════════════════════════════════════════════════════════════════════════

    let desktopModal = null;
    let desktopAbortController = null;
    let desktopViewYear = 2026;
    let desktopViewMonth = 0;
    let desktopActiveCellDate = null;

    function buildCalendarGrid(year, month, firstDayOfWeek) {
        const firstOfMonth = new Date(year, month, 1);
        const lastOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastOfMonth.getDate();

        // Find the start date (back up to firstDayOfWeek)
        const startDayOfWeek = firstOfMonth.getDay();
        let offset = startDayOfWeek - firstDayOfWeek;
        if (offset < 0) offset += 7;
        const startDate = new Date(year, month, 1 - offset);

        const cells = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            cells.push({
                date,
                day: date.getDate(),
                isInMonth: date.getMonth() === month,
                isToday: date.getTime() === today.getTime(),
                isSelected: selectedDate &&
                    date.getFullYear() === selectedDate.getFullYear() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getDate() === selectedDate.getDate(),
                isDisabled: !isDateInRange(date.getFullYear(), date.getMonth(), date.getDate())
            });
        }
        return cells;
    }

    function createDesktopCalendarModal() {
        const backdrop = document.createElement('div');
        backdrop.className = 'date-picker-backdrop';
        backdrop.id = 'desktop-calendar-backdrop';

        const modal = document.createElement('div');
        modal.className = 'desktop-calendar-modal';
        modal.id = 'desktop-calendar-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'desktop-calendar-title');

        // Force LTR layout for consistent UX - only text is translated, not layout
        modal.setAttribute('dir', 'ltr');

        modal.innerHTML = `
            <div class="desktop-calendar-header">
                <h2 id="desktop-calendar-title">${getTranslation('selectDate')}</h2>
                <button type="button" class="desktop-calendar-close" id="desktop-calendar-close" 
                        aria-label="${getTranslation('cancelDate')}">✕</button>
            </div>
            <div class="desktop-calendar-input-row">
                <input type="text" 
                       id="desktop-calendar-input" 
                       class="desktop-calendar-input" 
                       placeholder="DD/MM/YYYY"
                       maxlength="10"
                       autocomplete="off">
                <div id="desktop-calendar-error" class="desktop-calendar-error" aria-live="polite"></div>
            </div>
            <div class="desktop-calendar-nav">
                <button type="button" id="desktop-cal-prev" class="desktop-calendar-nav-btn" 
                        aria-label="${getTranslation('prevMonth')}">◀</button>
                <div class="dcal-select-wrapper" style="position:relative;">
                    <select id="desktop-cal-month" style="display:none;" aria-label="Month"></select>
                    <button type="button" id="dcal-month-trigger" class="dcal-custom-trigger" aria-label="Month">
                        <span id="dcal-month-text"></span>
                        <svg class="dcal-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    <div id="dcal-month-dropdown" class="dcal-custom-dropdown hidden"></div>
                </div>
                <div class="dcal-select-wrapper" style="position:relative;">
                    <select id="desktop-cal-year" style="display:none;" aria-label="Year"></select>
                    <button type="button" id="dcal-year-trigger" class="dcal-custom-trigger" aria-label="Year">
                        <span id="dcal-year-text"></span>
                        <svg class="dcal-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    <div id="dcal-year-dropdown" class="dcal-custom-dropdown hidden"></div>
                </div>
                <button type="button" id="desktop-cal-next" class="desktop-calendar-nav-btn" 
                        aria-label="${getTranslation('nextMonth')}">▶</button>
            </div>
            <div class="desktop-calendar-weekdays" id="desktop-cal-weekdays"></div>
            <div class="desktop-calendar-grid" id="desktop-cal-grid" role="grid" tabindex="0"></div>
            <div class="desktop-calendar-footer">
                <button type="button" class="desktop-calendar-btn today" id="desktop-cal-today">
                    ${getTranslation('todayDate')}
                </button>
                <div class="desktop-calendar-footer-right">
                    <button type="button" class="desktop-calendar-btn cancel" id="desktop-cal-cancel">
                        ${getTranslation('cancelDate')}
                    </button>
                    <button type="button" class="desktop-calendar-btn confirm" id="desktop-cal-confirm">
                        ${getTranslation('confirmDate')}
                    </button>
                </div>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        return backdrop;
    }

    function renderDesktopCalendar(direction = null) {
        if (!desktopModal) return;
        const isRTL = currentLang === 'ar';
        const firstDayOfWeek = getFirstDayOfWeek(currentLang);
        const monthNames = getMonthNames(currentLang);

        // Weekday headers
        const weekdaysEl = document.getElementById('desktop-cal-weekdays');
        const dayNames = getDayNamesShort(currentLang);
        let weekdaysHTML = '';
        for (let i = 0; i < 7; i++) {
            const dayIndex = (firstDayOfWeek + i) % 7;
            weekdaysHTML += `<div class="desktop-calendar-weekday">${dayNames[dayIndex]}</div>`;
        }
        weekdaysEl.innerHTML = weekdaysHTML;

        // Month dropdown
        const monthSelect = document.getElementById('desktop-cal-month');
        const monthDropdown = document.getElementById('dcal-month-dropdown');
        const monthText = document.getElementById('dcal-month-text');

        let monthSelectHTML = '';
        let monthDropdownHTML = '';

        monthNames.forEach((name, i) => {
            const isSelected = i === desktopViewMonth;
            if (isSelected && monthText) monthText.textContent = name;
            monthSelectHTML += `<option value="${i}" ${isSelected ? 'selected' : ''}>${name}</option>`;
            monthDropdownHTML += `<div class="dcal-dropdown-option ${isSelected ? 'selected' : ''}" data-value="${i}">${name}</div>`;
        });
        if (monthSelect) monthSelect.innerHTML = monthSelectHTML;
        if (monthDropdown) monthDropdown.innerHTML = monthDropdownHTML;

        // Year dropdown (dynamic based on min/max)
        const yearSelect = document.getElementById('desktop-cal-year');
        const yearDropdown = document.getElementById('dcal-year-dropdown');
        const yearText = document.getElementById('dcal-year-text');

        const minYear = minDate ? minDate.getFullYear() : YEAR_RANGE[0];
        const maxYear = maxDate ? maxDate.getFullYear() : YEAR_RANGE[1];

        let yearSelectHTML = '';
        let yearDropdownHTML = '';

        for (let y = minYear; y <= maxYear; y++) {
            const isSelected = y === desktopViewYear;
            if (isSelected && yearText) yearText.textContent = y;
            yearSelectHTML += `<option value="${y}" ${isSelected ? 'selected' : ''}>${y}</option>`;
            yearDropdownHTML += `<div class="dcal-dropdown-option ${isSelected ? 'selected' : ''}" data-value="${y}">${y}</div>`;
        }
        if (yearSelect) yearSelect.innerHTML = yearSelectHTML;
        if (yearDropdown) yearDropdown.innerHTML = yearDropdownHTML;

        // Calendar grid
        const gridEl = document.getElementById('desktop-cal-grid');
        const cells = buildCalendarGrid(desktopViewYear, desktopViewMonth, firstDayOfWeek);
        const dayNamesFull = getDayNamesFull(currentLang);

        const nextView = document.createElement('div');
        nextView.className = 'desktop-calendar-view';

        let gridHTML = '';
        cells.forEach((cell, i) => {
            const classes = ['desktop-calendar-day'];
            if (!cell.isInMonth) classes.push('outside-month');
            if (cell.isToday) classes.push('today');
            if (cell.isSelected) classes.push('selected');
            if (cell.isDisabled) classes.push('disabled');

            const isActive = desktopActiveCellDate &&
                cell.date.getTime() === desktopActiveCellDate.getTime();
            if (isActive) classes.push('active');

            // Full date label for screen readers
            const dateLabel = `${dayNamesFull[cell.date.getDay()]}, ${cell.day} ${monthNames[cell.date.getMonth()]} ${cell.date.getFullYear()}`;

            gridHTML += `<div class="${classes.join(' ')}" 
                data-date="${cell.date.toISOString()}"
                role="gridcell"
                tabindex="${isActive ? '0' : '-1'}"
                aria-label="${dateLabel}"
                aria-selected="${cell.isSelected}"
                ${cell.isDisabled ? 'aria-disabled="true"' : ''}>
                ${cell.day}
            </div>`;
        });
        nextView.innerHTML = gridHTML;

        // Animation logic
        // #10: Cleanup any zombie views from rapid clicking
        const views = gridEl.querySelectorAll('.desktop-calendar-view');
        let currentView = null;
        if (views.length > 0) {
            // Keep the last one (most recent) as current
            currentView = views[views.length - 1];
            // Remove others immediately
            for (let i = 0; i < views.length - 1; i++) {
                views[i].remove();
            }
            // Strip animation classes from survivor to ensure clean state
            currentView.className = 'desktop-calendar-view';
        }

        // Only animate if we have a current view and a valid direction ('prev' or 'next')
        if (currentView && direction && direction !== 'none') {
            gridEl.appendChild(nextView);

            // Prepare animation classes
            nextView.classList.add(`anim-${direction}-enter`);
            currentView.classList.add(`anim-${direction}-exit`);

            // Force reflow
            nextView.offsetWidth;

            // Trigger animation
            requestAnimationFrame(() => {
                nextView.classList.add(`anim-${direction}-enter-active`);
                currentView.classList.add(`anim-${direction}-exit-active`);
            });

            // Cleanup after animation (250ms matches CSS)
            setTimeout(() => {
                // Check if currentView is still in DOM before removing (it might have been removed by a subsequent render)
                if (currentView.isConnected) {
                    currentView.remove();
                }
                if (nextView.isConnected) {
                    nextView.classList.remove(`anim-${direction}-enter`, `anim-${direction}-enter-active`);
                }
            }, 260);
        } else {
            gridEl.innerHTML = '';
            gridEl.appendChild(nextView);
        }
    }

    function closeDesktopCalendar(confirmed) {
        if (!desktopModal || !isPickerOpen) return;

        desktopModal.classList.remove('visible');
        isPickerOpen = false;

        setTimeout(() => {
            if (typeof ScrollLock !== 'undefined') ScrollLock.disable();
            else document.body.classList.remove('scroll-lock');
        }, 300);

        if (desktopAbortController) {
            desktopAbortController.abort();
            desktopAbortController = null;
        }

        if (confirmed && onConfirmCallback && selectedDate) {
            const finalDate = clampDateToRange(new Date(selectedDate));
            onConfirmCallback(finalDate);
        } else if (onConfirmCallback) {
            onConfirmCallback(null);
        }

        onConfirmCallback = null;

        if (launcherElement && typeof launcherElement.focus === 'function') {
            launcherElement.focus();
        }
        launcherElement = null;
        minDate = null;
        maxDate = null;

        if (typeof BackHandler !== 'undefined') {
            BackHandler.pop('date-picker');
        }

        if (typeof haptic !== 'undefined') haptic('light');
    }

    function openDesktopCalendar(inputEl, lang, callback, options = {}) {
        if (isPickerOpen) {
            console.warn('DatePicker: Already open');
            return;
        }

        currentLang = lang || 'en';
        onConfirmCallback = callback;
        launcherElement = inputEl;

        // #3 & #4: Normalize constraints to midnight, support Date or string
        minDate = normalizeConstraint(options.minDate);
        maxDate = normalizeConstraint(options.maxDate);

        let parsedDate = parseDDMMYYYYStrict(inputEl?.value);
        selectedDate = parsedDate || new Date();
        selectedDate = clampDateToRange(selectedDate);

        desktopViewYear = selectedDate.getFullYear();
        desktopViewMonth = selectedDate.getMonth();
        desktopActiveCellDate = new Date(selectedDate);

        if (!desktopModal) {
            desktopModal = createDesktopCalendarModal();
        } else {
            // Update text for current language (keep LTR layout always)
            document.getElementById('desktop-calendar-title').textContent = getTranslation('selectDate');
            document.getElementById('desktop-cal-today').textContent = getTranslation('todayDate');
            document.getElementById('desktop-cal-cancel').textContent = getTranslation('cancelDate');
            document.getElementById('desktop-cal-confirm').textContent = getTranslation('confirmDate');
            // Keep dir="ltr" for consistent layout
        }

        const inputField = document.getElementById('desktop-calendar-input');
        // Set initial value as plain DD/MM/YYYY (initDateInput not yet called)
        // but pre-populate dataset.iso so arrow keys work right after open.
        inputField.value = formatDDMMYYYY(selectedDate);
        {
            const _y = selectedDate.getFullYear();
            const _m = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const _d = String(selectedDate.getDate()).padStart(2, '0');
            inputField.dataset.iso = `${_y}-${_m}-${_d}`;
        }
        document.getElementById('desktop-calendar-error').textContent = '';

        renderDesktopCalendar(); // Initial render, no animation

        desktopAbortController = new AbortController();
        const signal = desktopAbortController.signal;
        const isRTL = currentLang === 'ar';

        desktopModal.addEventListener('click', (e) => {
            if (e.target === desktopModal) {
                closeDesktopCalendar(false);
                return;
            }

            const monthDropdown = document.getElementById('dcal-month-dropdown');
            const monthTrigger = document.getElementById('dcal-month-trigger');
            const yearDropdown = document.getElementById('dcal-year-dropdown');
            const yearTrigger = document.getElementById('dcal-year-trigger');

            const openDropdown = (dropdown, trigger) => {
                dropdown.classList.remove('hidden');
                dropdown.style.opacity = '0';
                dropdown.style.transform = 'scaleY(0.95) translateY(-4px)';
                void dropdown.offsetHeight; // force reflow
                dropdown.style.opacity = '1';
                dropdown.style.transform = 'scaleY(1) translateY(0)';
                if (trigger) trigger.querySelector('.dcal-chevron').style.transform = 'rotate(180deg)';

                // Scroll selected into view
                const selected = dropdown.querySelector('.selected');
                if (selected) setTimeout(() => selected.scrollIntoView({ block: 'center' }), 10);
            };

            const closeDropdown = (dropdown, trigger) => {
                if (!dropdown || dropdown.classList.contains('hidden')) return;
                dropdown.style.opacity = '0';
                dropdown.style.transform = 'scaleY(0.95) translateY(-4px)';
                setTimeout(() => dropdown.classList.add('hidden'), 150);
                if (trigger) trigger.querySelector('.dcal-chevron').style.transform = '';
            };

            const isMonthTrigger = monthTrigger && (e.target === monthTrigger || monthTrigger.contains(e.target));
            const isYearTrigger = yearTrigger && (e.target === yearTrigger || yearTrigger.contains(e.target));

            // Close dropdowns if clicking outside
            if (!isMonthTrigger && !isYearTrigger) {
                closeDropdown(monthDropdown, monthTrigger);
                closeDropdown(yearDropdown, yearTrigger);
            }

            if (isMonthTrigger) {
                const isHidden = monthDropdown.classList.contains('hidden');
                closeDropdown(yearDropdown, yearTrigger); // Close the other one
                if (isHidden) {
                    openDropdown(monthDropdown, monthTrigger);
                } else {
                    closeDropdown(monthDropdown, monthTrigger);
                }
                return;
            }

            if (isYearTrigger) {
                const isHidden = yearDropdown.classList.contains('hidden');
                closeDropdown(monthDropdown, monthTrigger); // Close the other one
                if (isHidden) {
                    openDropdown(yearDropdown, yearTrigger);
                } else {
                    closeDropdown(yearDropdown, yearTrigger);
                }
                return;
            }

            // Option clicks
            const option = e.target.closest('.dcal-dropdown-option');
            if (option) {
                if (monthDropdown && monthDropdown.contains(option)) {
                    desktopViewMonth = parseInt(option.dataset.value, 10);
                    renderDesktopCalendar('none');
                    closeDropdown(monthDropdown, monthTrigger);
                } else if (yearDropdown && yearDropdown.contains(option)) {
                    desktopViewYear = parseInt(option.dataset.value, 10);
                    renderDesktopCalendar('none');
                    closeDropdown(yearDropdown, yearTrigger);
                }
            }
        }, { signal });

        document.getElementById('desktop-calendar-close').addEventListener('click', () => closeDesktopCalendar(false), { signal });
        document.getElementById('desktop-cal-cancel').addEventListener('click', () => closeDesktopCalendar(false), { signal });
        document.getElementById('desktop-cal-confirm').addEventListener('click', () => closeDesktopCalendar(true), { signal });

        document.getElementById('desktop-cal-today').addEventListener('click', () => {
            let today = new Date();
            today.setHours(0, 0, 0, 0);
            // #5: Clamp today to range instead of doing nothing
            today = clampDateToRange(today);
            selectedDate = today;
            desktopViewYear = today.getFullYear();
            desktopViewMonth = today.getMonth();
            desktopActiveCellDate = new Date(today);
            // Set value with LRM-decoration if initDateInput is active; also update dataset.iso
            const ty = today.getFullYear();
            const tm = String(today.getMonth() + 1).padStart(2, '0');
            const td2 = String(today.getDate()).padStart(2, '0');
            inputField.value = (typeof dateBuildValue === 'function')
                ? dateBuildValue(td2, tm, String(ty), false)
                : formatDDMMYYYY(today);
            inputField.dataset.iso = `${ty}-${tm}-${td2}`;
            document.getElementById('desktop-calendar-error').textContent = '';
            renderDesktopCalendar('none'); // No animation for 'today' button
        }, { signal });



        // Mousewheel navigation for calendar grid
        let mousewheelTimeout = null;
        document.getElementById('desktop-cal-grid').addEventListener('wheel', (e) => {
            e.preventDefault(); // Prevent page scrolling
            if (mousewheelTimeout) clearTimeout(mousewheelTimeout);

            mousewheelTimeout = setTimeout(() => {
                const effectiveMinYear = minDate ? minDate.getFullYear() : YEAR_RANGE[0];
                const effectiveMaxYear = maxDate ? maxDate.getFullYear() : YEAR_RANGE[1];
                const minMonth = minDate && desktopViewYear === effectiveMinYear ? minDate.getMonth() : 0;
                const maxMonth = maxDate && desktopViewYear === effectiveMaxYear ? maxDate.getMonth() : 11;

                if (e.deltaY > 0) {
                    // Scroll down → next month
                    desktopViewMonth++;
                    if (desktopViewMonth > 11) { desktopViewMonth = 0; desktopViewYear++; }
                    if (desktopViewYear > effectiveMaxYear ||
                        (desktopViewYear === effectiveMaxYear && desktopViewMonth > maxMonth)) {
                        desktopViewYear = effectiveMaxYear;
                        desktopViewMonth = maxMonth;
                    }
                    renderDesktopCalendar('next');
                } else {
                    // Scroll up → prev month
                    desktopViewMonth--;
                    if (desktopViewMonth < 0) { desktopViewMonth = 11; desktopViewYear--; }
                    if (desktopViewYear < effectiveMinYear ||
                        (desktopViewYear === effectiveMinYear && desktopViewMonth < minMonth)) {
                        desktopViewYear = effectiveMinYear;
                        desktopViewMonth = minMonth;
                    }
                    renderDesktopCalendar('prev');
                }
            }, 50); // 50ms debounce for smooth scrolling
        }, { signal });

        document.getElementById('desktop-cal-prev').addEventListener('click', () => {
            desktopViewMonth--;
            if (desktopViewMonth < 0) { desktopViewMonth = 11; desktopViewYear--; }
            // #7: Bound to min year
            const effectiveMinYear = minDate ? minDate.getFullYear() : YEAR_RANGE[0];
            if (desktopViewYear < effectiveMinYear) {
                desktopViewYear = effectiveMinYear;
                desktopViewMonth = minDate ? minDate.getMonth() : 0;
            }
            renderDesktopCalendar('prev');
        }, { signal });

        document.getElementById('desktop-cal-next').addEventListener('click', () => {
            desktopViewMonth++;
            if (desktopViewMonth > 11) { desktopViewMonth = 0; desktopViewYear++; }
            // #7: Bound to max year
            const effectiveMaxYear = maxDate ? maxDate.getFullYear() : YEAR_RANGE[1];
            if (desktopViewYear > effectiveMaxYear) {
                desktopViewYear = effectiveMaxYear;
                desktopViewMonth = maxDate ? maxDate.getMonth() : 11;
            }
            renderDesktopCalendar('next');
        }, { signal });

        // Handle click and double-click on calendar days
        const gridContainer = document.getElementById('desktop-cal-grid');

        gridContainer.addEventListener('click', (e) => {
            const dayEl = e.target.closest('.desktop-calendar-day');
            if (!dayEl || dayEl.classList.contains('disabled')) return;

            const clickedDate = new Date(dayEl.dataset.date);
            selectedDate = clickedDate;
            desktopActiveCellDate = new Date(clickedDate);
            // Set value with LRM-decoration if initDateInput is active; also update dataset.iso
            const cy = clickedDate.getFullYear();
            const cm = String(clickedDate.getMonth() + 1).padStart(2, '0');
            const cd = String(clickedDate.getDate()).padStart(2, '0');
            inputField.value = (typeof dateBuildValue === 'function')
                ? dateBuildValue(cd, cm, String(cy), false)
                : formatDDMMYYYY(clickedDate);
            inputField.dataset.iso = `${cy}-${cm}-${cd}`;

            // Update visual state inline without re-rendering (preserves DOM for dblclick)
            gridContainer.querySelectorAll('.desktop-calendar-day.selected').forEach(el => {
                el.classList.remove('selected');
                el.setAttribute('aria-selected', 'false');
            });
            gridContainer.querySelectorAll('.desktop-calendar-day.active').forEach(el => {
                el.classList.remove('active');
                el.setAttribute('tabindex', '-1');
            });
            dayEl.classList.add('selected', 'active');
            dayEl.setAttribute('aria-selected', 'true');
            dayEl.setAttribute('tabindex', '0');
        }, { signal });

        // Double-click to confirm immediately
        gridContainer.addEventListener('dblclick', (e) => {
            const dayEl = e.target.closest('.desktop-calendar-day');
            if (!dayEl || dayEl.classList.contains('disabled')) return;
            selectedDate = new Date(dayEl.dataset.date);
            closeDesktopCalendar(true);
        }, { signal });

        const gridEl = document.getElementById('desktop-cal-grid');
        gridEl.addEventListener('keydown', (e) => {
            if (!desktopActiveCellDate) return;
            let delta = 0, monthDelta = 0, yearDelta = 0;

            switch (e.key) {
                case 'ArrowUp': delta = -7; break;
                case 'ArrowDown': delta = 7; break;
                case 'ArrowLeft': delta = -1; break;
                case 'ArrowRight': delta = 1; break;
                case 'PageUp': if (e.shiftKey) yearDelta = -1; else monthDelta = -1; break;
                case 'PageDown': if (e.shiftKey) yearDelta = 1; else monthDelta = 1; break;
                case 'Enter':
                    e.preventDefault();
                    if (isDateInRange(desktopActiveCellDate.getFullYear(), desktopActiveCellDate.getMonth(), desktopActiveCellDate.getDate())) {
                        selectedDate = new Date(desktopActiveCellDate);
                        closeDesktopCalendar(true);
                    }
                    return;
                case 'Escape': e.preventDefault(); closeDesktopCalendar(false); return;
                default: return;
            }
            e.preventDefault();

            if (delta !== 0) {
                const newDate = new Date(desktopActiveCellDate);
                newDate.setDate(newDate.getDate() + delta);
                while (!isDateInRange(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())) {
                    newDate.setDate(newDate.getDate() + (delta > 0 ? 1 : -1));
                    if (newDate.getFullYear() < YEAR_RANGE[0] || newDate.getFullYear() > YEAR_RANGE[1]) break;
                }
                if (isDateInRange(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())) {
                    desktopActiveCellDate = newDate;
                    desktopViewYear = newDate.getFullYear();
                    desktopViewMonth = newDate.getMonth();
                    renderDesktopCalendar();
                    requestAnimationFrame(() => {
                        const activeCell = gridEl.querySelector('.desktop-calendar-day.active');
                        if (activeCell) activeCell.focus();
                    });
                }
            }
            if (monthDelta !== 0) {
                const newDate = new Date(desktopActiveCellDate);
                newDate.setMonth(newDate.getMonth() + monthDelta);
                desktopActiveCellDate = newDate;
                desktopViewYear = newDate.getFullYear();
                desktopViewMonth = newDate.getMonth();
                renderDesktopCalendar();
            }
            if (yearDelta !== 0) {
                const newDate = new Date(desktopActiveCellDate);
                newDate.setFullYear(newDate.getFullYear() + yearDelta);
                desktopActiveCellDate = newDate;
                desktopViewYear = newDate.getFullYear();
                desktopViewMonth = newDate.getMonth();
                renderDesktopCalendar();
            }
        }, { signal });

        // Use initDateInput if available for consistent date input behavior
        // Otherwise fall back to basic auto-slash formatting
        if (typeof initDateInput === 'function') {
            // Create a hidden native input for sync
            const tempNativeInput = document.createElement('input');
            tempNativeInput.type = 'date';
            // Use local date components (not toISOString) to avoid UTC off-by-one in non-UTC timezones
            if (minDate) {
                tempNativeInput.min = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`;
            }
            if (maxDate) {
                tempNativeInput.max = `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}-${String(maxDate.getDate()).padStart(2, '0')}`;
            }
            initDateInput(inputField, tempNativeInput);

            // Sync changes back to calendar
            tempNativeInput.addEventListener('change', () => {
                if (tempNativeInput.value) {
                    const [y, m, d] = tempNativeInput.value.split('-').map(Number);
                    const parsed = new Date(y, m - 1, d);
                    if (isDateInRange(y, m - 1, d)) {
                        selectedDate = parsed;
                        desktopViewYear = y;
                        desktopViewMonth = m - 1;
                        desktopActiveCellDate = new Date(parsed);
                        document.getElementById('desktop-calendar-error').textContent = '';
                        renderDesktopCalendar();
                    }
                }
            });
        } else {
            // Fallback: auto-insert slashes and validate
            inputField.addEventListener('input', () => {
                const errorEl = document.getElementById('desktop-calendar-error');
                let val = inputField.value.replace(/[^0-9]/g, '');

                // Auto-insert slashes
                if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5);
                if (val.length > 10) val = val.slice(0, 10);
                inputField.value = val;

                // Validate when complete
                if (val.length === 10) {
                    const parsed = parseDDMMYYYYStrict(val);
                    if (!parsed) {
                        errorEl.textContent = getTranslation('invalidDateHint');
                    } else if (!isDateInRange(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())) {
                        let hint = getTranslation('dateRangeHint');
                        if (minDate) hint = hint.replace('{min}', formatDDMMYYYY(minDate));
                        if (maxDate) hint = hint.replace('{max}', formatDDMMYYYY(maxDate));
                        errorEl.textContent = hint;
                    } else {
                        errorEl.textContent = '';
                        selectedDate = parsed;
                        desktopViewYear = parsed.getFullYear();
                        desktopViewMonth = parsed.getMonth();
                        desktopActiveCellDate = new Date(parsed);
                        renderDesktopCalendar();
                    }
                } else {
                    errorEl.textContent = '';
                }
            }, { signal });
        }

        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const errorEl = document.getElementById('desktop-calendar-error');
                const parsed = parseDDMMYYYYStrict(inputField.value);
                // #8: Show error instead of silently ignoring
                if (!parsed) {
                    errorEl.textContent = getTranslation('invalidDateHint');
                } else if (!isDateInRange(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())) {
                    let hint = getTranslation('dateRangeHint');
                    if (minDate) hint = hint.replace('{min}', formatDDMMYYYY(minDate));
                    if (maxDate) hint = hint.replace('{max}', formatDDMMYYYY(maxDate));
                    errorEl.textContent = hint;
                } else {
                    selectedDate = parsed;
                    closeDesktopCalendar(true);
                }
            }
            // Escape handled by modal-level handler below
        }, { signal });

        // #1: Modal-level keydown handler for Escape + Tab focus trap
        const modalContent = desktopModal.querySelector('.desktop-calendar-modal');
        const focusableSelector = 'button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

        modalContent.addEventListener('keydown', (e) => {
            // Escape anywhere in modal closes it
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeDesktopCalendar(false);
                return;
            }

            // Tab focus trap
            if (e.key === 'Tab') {
                const focusables = Array.from(modalContent.querySelectorAll(focusableSelector));
                if (focusables.length === 0) return;

                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }, { signal });

        if (typeof ScrollLock !== 'undefined') ScrollLock.enable();
        else document.body.classList.add('scroll-lock');

        desktopModal.offsetHeight;
        desktopModal.classList.add('visible');
        isPickerOpen = true;

        requestAnimationFrame(() => inputField.focus());

        if (typeof BackHandler !== 'undefined') {
            BackHandler.push('date-picker', () => closeDesktopCalendar(false));
        }

        if (typeof haptic !== 'undefined') haptic('light');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MOBILE WHEEL PICKER - openDatePicker (renamed internally for mode selection)
    // ═══════════════════════════════════════════════════════════════════════════

    function openMobileWheelPicker(inputEl, lang, callback, options = {}) {
        currentLang = lang || 'en';
        onConfirmCallback = callback;
        launcherElement = inputEl;

        // Normalize constraints (Date or string to midnight)
        minDate = normalizeConstraint(options.minDate);
        maxDate = normalizeConstraint(options.maxDate);

        let parsedDate = null;
        if (inputEl && inputEl.value) {
            // Strip LRM marks before parsing (initDateInput decorates values with ‎ for RTL rendering)
            const rawVal = inputEl.value.replace(/\u200E/g, '');
            const parts = rawVal.split('/');
            if (parts.length === 3) {
                const d = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const y = parseInt(parts[2], 10);
                if (!isNaN(d) && !isNaN(m) && !isNaN(y) && isValidDate(y, m, d)) {
                    parsedDate = new Date(y, m, d);
                }
            }
        }

        selectedDate = parsedDate || new Date();
        selectedDate = clampDateToRange(selectedDate);

        if (!pickerModal) {
            pickerModal = createPickerModal();
        } else {
            document.getElementById('date-picker-cancel').textContent = getTranslation('cancelDate');
            document.getElementById('date-picker-confirm').textContent = getTranslation('confirmDate');
            document.getElementById('date-picker-today').textContent = getTranslation('todayDate');
            const columnsEl = document.querySelector('.date-picker-columns');
            const isRTL = document.documentElement.dir === 'rtl';
            columnsEl.className = `date-picker-columns ${isRTL ? 'rtl' : 'ltr'}`;
        }

        populateYearColumn();
        populateMonthColumn();
        updateDayColumn();
        updateDayNameColumn();
        updateTitle();

        pickerModal.offsetHeight;
        pickerModal.classList.add('visible');
        isPickerOpen = true;

        if (typeof ScrollLock !== 'undefined') ScrollLock.enable();
        else document.body.classList.add('scroll-lock');

        requestAnimationFrame(() => {
            const dayCol = document.getElementById('col-day');
            if (dayCol) dayCol.focus();
        });

        if (typeof BackHandler !== 'undefined') {
            BackHandler.push('date-picker', () => closePicker(false, true));
        }

        if (typeof haptic !== 'undefined') haptic('light');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN ENTRY POINT - Chooses desktop or mobile based on pointer type
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Open the date picker (auto-selects desktop calendar or mobile wheel)
     * @param {HTMLInputElement} inputEl - Input element that triggered the picker
     * @param {string} lang - Language code ('en' or 'ar')
     * @param {Function} callback - Called with Date or null on close
     * @param {Object} options - { minDate, maxDate, forceMode: 'desktop'|'mobile' }
     */
    function openDatePicker(inputEl, lang, callback, options = {}) {
        // Guard against double-open
        if (isPickerOpen) {
            console.warn('DatePicker: Already open, ignoring duplicate open call');
            return;
        }

        // Choose mode: desktop calendar or mobile wheel picker
        const forceMode = options.forceMode;
        const useDesktop = forceMode === 'desktop' ||
            (forceMode !== 'mobile' && isPointerFine());

        if (useDesktop) {
            openDesktopCalendar(inputEl, lang, callback, options);
        } else {
            openMobileWheelPicker(inputEl, lang, callback, options);
        }
    }

    function closePicker(confirmed, skipHaptic = false) {
        if (!pickerModal || !isPickerOpen) return;

        pickerModal.classList.remove('visible');
        isPickerOpen = false;

        // Restore scrollbar
        setTimeout(() => {
            if (typeof ScrollLock !== 'undefined') ScrollLock.disable();
            else document.body.classList.remove('scroll-lock');
        }, 300);

        // #1: Abort all column controllers to clean up listeners
        columnAbortControllers.forEach((controller) => controller.abort());
        columnAbortControllers.clear();
        columnItemHeights.clear();

        if (confirmed && onConfirmCallback) {
            // Fix #4: Final safety clamp on confirm
            const finalDate = clampDateToRange(new Date(selectedDate));
            onConfirmCallback(finalDate);
        } else if (onConfirmCallback) {
            onConfirmCallback(null);
        }

        onConfirmCallback = null;

        // #8: Restore focus to launcher
        if (launcherElement && typeof launcherElement.focus === 'function') {
            launcherElement.focus();
        }
        launcherElement = null;

        // Clear constraints
        minDate = null;
        maxDate = null;

        // Unregister from BackHandler
        if (typeof BackHandler !== 'undefined') {
            BackHandler.pop('date-picker');
        }

        if (!skipHaptic && typeof haptic !== 'undefined') haptic('light');
    }

    // Expose globally
    window.openDatePicker = openDatePicker;
    window.isDatePickerOpen = () => isPickerOpen;

})();
// js/datepicker.js - Custom Scroll Wheel Date Picker
// Replaces native mobile calendar with a touch-friendly wheel picker

(function () {
    'use strict';

    // Constants
    const ITEM_HEIGHT = 44; // Height of each row in pixels
    const VISIBLE_ITEMS = 5; // Number of visible items in the wheel
    const YEAR_RANGE = [2000, 2099];

    let currentLang = 'en';
    let pickerModal = null;
    let onConfirmCallback = null;
    let selectedDate = new Date();

    // Get translations from ui.js
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
            todayDate: currentLang === 'ar' ? 'اليوم' : 'Today'
        };
        return fallbacks[key] || key;
    }

    // Get days in a month
    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    // Get day name for a date
    function getDayName(year, month, day) {
        const date = new Date(year, month, day);
        const dayIndex = date.getDay();
        return getDayNamesShort(currentLang)[dayIndex];
    }

    // Create the picker modal structure
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
                    <div class="date-picker-column" id="col-dayname" data-type="dayname" tabindex="-1" role="listbox" aria-label="Day of week">
                        <div class="date-picker-scroll" id="scroll-dayname"></div>
                    </div>
                    <div class="date-picker-column" id="col-day" data-type="day" tabindex="0" role="listbox" aria-label="Day">
                        <div class="date-picker-scroll" id="scroll-day"></div>
                    </div>
                    <div class="date-picker-column" id="col-month" data-type="month" tabindex="0" role="listbox" aria-label="Month">
                        <div class="date-picker-scroll" id="scroll-month"></div>
                    </div>
                    <div class="date-picker-column" id="col-year" data-type="year" tabindex="0" role="listbox" aria-label="Year">
                        <div class="date-picker-scroll" id="scroll-year"></div>
                    </div>
                </div>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Event listeners
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closePicker(false);
        });

        document.getElementById('date-picker-cancel').addEventListener('click', () => closePicker(false));
        document.getElementById('date-picker-confirm').addEventListener('click', () => closePicker(true));
        document.getElementById('date-picker-today').addEventListener('click', () => {
            if (typeof haptic !== 'undefined') haptic('medium');
            selectToday();
        });

        // Swipe-to-close gesture handling
        let swipeStartY = 0;
        let swipeCurrentY = 0;
        let isSwipeDragging = false;

        modal.addEventListener('touchstart', (e) => {
            if (window.innerWidth >= 768) return; // Desktop only uses close button
            // Only initiate swipe from header area or drag handle
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

            if (diff > 10) { // Threshold to start dragging
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

            if (diff > 100) { // Close threshold
                modal.style.transition = 'transform 0.3s ease-out';
                modal.style.transform = 'translateY(100%)';
                if (typeof haptic !== 'undefined') haptic('light');
                setTimeout(() => {
                    closePicker(false, true); // skipHaptic since we already did it
                    modal.style.transform = '';
                    modal.style.transition = '';
                }, 300);
            } else {
                // Snap back
                modal.style.transition = 'transform 0.3s ease-out';
                modal.style.transform = '';
            }

            isSwipeDragging = false;
            swipeStartY = 0;
        });

        return backdrop;
    }

    // Populate a column with items
    function populateColumn(scrollEl, items, selectedIndex, onSelect) {
        scrollEl.innerHTML = '';

        // Add padding items at top and bottom for scroll centering
        const paddingCount = Math.floor(VISIBLE_ITEMS / 2);

        for (let i = 0; i < paddingCount; i++) {
            const padItem = document.createElement('div');
            padItem.className = 'date-picker-item padding';
            scrollEl.appendChild(padItem);
        }

        items.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'date-picker-item';
            itemEl.textContent = item.label;
            itemEl.dataset.value = item.value;
            itemEl.dataset.index = index;
            scrollEl.appendChild(itemEl);
        });

        // Mouse Drag Support
        let isDragging = false;
        let startY;
        let startScrollTop;
        let lastY;
        let velocity = 0;
        let lastTime = 0;
        let animationFrame;

        const columnEl = scrollEl.parentElement;

        columnEl.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.pageY;
            lastY = startY;
            lastTime = Date.now();
            velocity = 0;
            startScrollTop = columnEl.scrollTop;

            columnEl.style.cursor = 'grabbing';
            columnEl.style.scrollSnapType = 'none'; // Disable snap during drag
            columnEl.style.scrollBehavior = 'auto'; // Disable smooth scroll during drag

            // Critical for keyboard support: give it focus!
            columnEl.focus();

            e.preventDefault(); // Prevent text selection

            // Stop any ongoing inertial scroll
            cancelAnimationFrame(animationFrame);
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const y = e.pageY;
            const now = Date.now();
            const dt = now - lastTime;

            // Calculate velocity (pixels per ms)
            if (dt > 0) {
                velocity = (lastY - y) / dt;
            }

            const walk = (y - startY) * 1.5; // Scroll speed multiplier
            columnEl.scrollTop = startScrollTop - walk;

            lastY = y;
            lastTime = now;
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                columnEl.style.cursor = 'grab';

                // Simple Inertia
                const inertia = () => {
                    if (Math.abs(velocity) > 0.1) {
                        columnEl.scrollTop += velocity * 16;
                        velocity *= 0.95; // Friction
                        animationFrame = requestAnimationFrame(inertia);
                    } else {
                        // Restore snapping when inertia stops
                        columnEl.style.scrollSnapType = 'y mandatory';
                        columnEl.style.scrollBehavior = 'smooth';
                        // Trigger final snap
                        const snapEvent = new Event('scroll');
                        columnEl.dispatchEvent(snapEvent);
                    }
                };
                inertia();
            }
        });

        // Handle mouse leave same as up to prevent stuck drag
        scrollEl.parentElement.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                columnEl.style.cursor = 'grab';
                columnEl.style.scrollSnapType = 'y mandatory';
                columnEl.style.scrollBehavior = 'smooth';
            }
        });

        // Keyboard Support
        columnEl.addEventListener('keydown', (e) => {
            const currentST = columnEl.scrollTop;
            const index = Math.round(currentST / ITEM_HEIGHT);

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                columnEl.scrollTo({
                    top: (index - 1) * ITEM_HEIGHT,
                    behavior: 'smooth'
                });
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                columnEl.scrollTo({
                    top: (index + 1) * ITEM_HEIGHT,
                    behavior: 'smooth'
                });
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev = columnEl.previousElementSibling;
                if (prev && prev.getAttribute('tabindex') === '0') prev.focus();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const next = columnEl.nextElementSibling;
                if (next && next.getAttribute('tabindex') === '0') next.focus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                closePicker(true);
            }
        });

        for (let i = 0; i < paddingCount; i++) {
            const padItem = document.createElement('div');
            padItem.className = 'date-picker-item padding';
            scrollEl.appendChild(padItem);
        }

        // Scroll to selected
        const targetScroll = selectedIndex * ITEM_HEIGHT;
        scrollEl.parentElement.scrollTop = targetScroll;

        // Track last index for live haptic feedback
        let lastHapticIndex = selectedIndex;

        // Live haptic feedback during scroll (like iOS)
        scrollEl.parentElement.addEventListener('scroll', () => {
            const scrollTop = scrollEl.parentElement.scrollTop;
            const currentIndex = Math.round(scrollTop / ITEM_HEIGHT);
            const clampedIndex = Math.max(0, Math.min(currentIndex, items.length - 1));

            // Haptic feedback when passing through a new item
            if (clampedIndex !== lastHapticIndex) {
                if (typeof haptic !== 'undefined') haptic('light');
                lastHapticIndex = clampedIndex;
            }
        }, { passive: true });

        // Add scroll end listener for snapping and selection
        let scrollTimeout;
        scrollEl.parentElement.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollTop = scrollEl.parentElement.scrollTop;
                const newIndex = Math.round(scrollTop / ITEM_HEIGHT);
                const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));

                // Snap to position
                scrollEl.parentElement.scrollTo({
                    top: clampedIndex * ITEM_HEIGHT,
                    behavior: 'smooth'
                });

                if (onSelect) onSelect(items[clampedIndex].value, clampedIndex);
            }, 80);
        }, { passive: true });
    }

    // Update day name column (read-only, shows current day name)
    function updateDayNameColumn() {
        const scrollEl = document.getElementById('scroll-dayname');
        if (!scrollEl) return;

        const dayName = getDayName(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        scrollEl.innerHTML = '';

        // Padding
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

        // Disable scrolling for day name column
        scrollEl.parentElement.style.overflow = 'hidden';
    }

    // Update day column based on month/year
    function updateDayColumn() {
        const daysInMonth = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
        let currentDay = selectedDate.getDate();

        // Clamp day if it exceeds days in month (Safe Check)
        if (currentDay > daysInMonth) {
            currentDay = daysInMonth;
            selectedDate.setDate(currentDay);
        }

        const days = [];
        for (let d = 1; d <= daysInMonth; d++) {
            days.push({ label: String(d).padStart(2, '0'), value: d });
        }

        const scrollEl = document.getElementById('scroll-day');
        populateColumn(scrollEl, days, currentDay - 1, (value) => {
            selectedDate.setDate(value);
            updateDayNameColumn();
            updateTitle();
        });
    }

    // Build and populate month column
    function populateMonthColumn() {
        const monthNames = getMonthNames(currentLang);
        const months = monthNames.map((name, i) => ({ label: name, value: i }));

        const scrollEl = document.getElementById('scroll-month');
        populateColumn(scrollEl, months, selectedDate.getMonth(), (value) => {
            // FIX: Manual Clamping to prevent JS Date Rollover
            // 1. Capture user's currently selected day
            const currentDay = selectedDate.getDate();

            // 2. Temporarily set date to 1 to prevent "Feb 31 -> March 3" rollover
            selectedDate.setDate(1);

            // 3. Set the new month
            selectedDate.setMonth(value);

            // 4. Calculate max days in the new month
            const maxDays = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());

            // 5. Restore the day, but clamped to the new max
            selectedDate.setDate(Math.min(currentDay, maxDays));

            updateDayColumn();
            updateDayNameColumn();
            updateTitle();
        });
    }

    // Build and populate year column
    function populateYearColumn() {
        const years = [];
        for (let y = YEAR_RANGE[0]; y <= YEAR_RANGE[1]; y++) {
            years.push({ label: String(y), value: y });
        }

        const currentYearIndex = selectedDate.getFullYear() - YEAR_RANGE[0];

        const scrollEl = document.getElementById('scroll-year');
        populateColumn(scrollEl, years, currentYearIndex, (value) => {
            // FIX: Manual Clamping for Leap Years (e.g. Feb 29 -> Non-Leap Year)
            const currentDay = selectedDate.getDate();
            selectedDate.setDate(1); // Reset to safe day
            selectedDate.setFullYear(value); // Set year

            const maxDays = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
            selectedDate.setDate(Math.min(currentDay, maxDays)); // Clamp day

            updateDayColumn();
            updateDayNameColumn();
            updateTitle();
        });
    }

    // Update the title with formatted date
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

    // Select today's date
    function selectToday() {
        selectedDate = new Date();

        // Refresh all columns
        populateYearColumn();
        populateMonthColumn();
        updateDayColumn();
        updateDayNameColumn();
        updateTitle();
    }

    // Open the picker
    function openDatePicker(inputEl, lang, callback) {
        currentLang = lang || 'en';
        onConfirmCallback = callback;

        // Parse current value from input
        if (inputEl && inputEl.value) {
            const parts = inputEl.value.split('/');
            if (parts.length === 3) {
                const d = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const y = parseInt(parts[2], 10);
                if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                    selectedDate = new Date(y, m, d);
                } else {
                    selectedDate = new Date();
                }
            } else {
                selectedDate = new Date();
            }
        } else {
            selectedDate = new Date();
        }

        // Create modal if not exists
        if (!pickerModal) {
            pickerModal = createPickerModal();
        } else {
            // Update button texts for language
            document.getElementById('date-picker-cancel').textContent = getTranslation('cancelDate');
            document.getElementById('date-picker-confirm').textContent = getTranslation('confirmDate');
            document.getElementById('date-picker-today').textContent = getTranslation('todayDate');

            // Update columns direction
            const columnsEl = document.querySelector('.date-picker-columns');
            const isRTL = document.documentElement.dir === 'rtl';
            columnsEl.className = `date-picker-columns ${isRTL ? 'rtl' : 'ltr'}`;
        }

        // Populate columns
        populateYearColumn();
        populateMonthColumn();
        updateDayColumn();
        updateDayNameColumn();
        updateTitle();

        // Show modal with animation
        pickerModal.classList.add('visible');

        // Prevent scrollbar shift (same fix as modals)
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
            const pad = `${scrollbarWidth}px`;
            document.body.style.paddingRight = pad;
            const nav = document.querySelector('nav');
            if (nav) nav.style.paddingRight = pad;
        }
        document.body.classList.add('scroll-lock');

        // Register with BackHandler for Android back button support
        if (typeof BackHandler !== 'undefined') {
            BackHandler.push('date-picker', () => closePicker(false, true)); // skipHaptic=true (system provides feedback)
        }

        // Haptic feedback
        if (typeof haptic !== 'undefined') haptic('light');
    }

    // Close the picker
    function closePicker(confirmed, skipHaptic = false) {
        if (!pickerModal) return;

        pickerModal.classList.remove('visible');

        // Restore scrollbar (same fix as modals)
        setTimeout(() => {
            document.body.classList.remove('scroll-lock');
            document.body.style.paddingRight = '';
            const nav = document.querySelector('nav');
            if (nav) nav.style.paddingRight = '';
        }, 300);

        if (confirmed && onConfirmCallback) {
            onConfirmCallback(new Date(selectedDate));
        } else if (onConfirmCallback) {
            onConfirmCallback(null);
        }

        onConfirmCallback = null;

        // Unregister from BackHandler
        if (typeof BackHandler !== 'undefined') {
            BackHandler.pop('date-picker');
        }

        // Haptic feedback (skip if triggered by back gesture - system already provides feedback)
        if (!skipHaptic && typeof haptic !== 'undefined') haptic('light');
    }

    // Expose globally
    window.openDatePicker = openDatePicker;

})();
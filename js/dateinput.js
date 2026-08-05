// js/dateinput.js - Date Input Logic (Windows Calculator Style)
// PROTECTED: Do NOT modify unless explicitly requested.
// Extracted from ui.js for isolation — all date input behavior lives here.

/* ================= DATE INPUT - WINDOWS CALCULATOR STYLE ================= */
/* Key behaviors:
 * 1. Slashes are static and cannot be removed (format always DD/MM/YYYY)
 * 2. Click on segment highlights it; typing replaces entire segment
 * 3. DD/MM auto-advance to next segment when 2 digits filled
 * 4. Arrow left/right add leading zero if needed, then move to adjacent segment
 * 5. Backspace clears current segment first, then moves to previous
 */

const DATE_CONFIG = {
    MIN_DATE: "2000-01-01",
    MAX_DATE: "2099-12-31",
    EMPTY_CHAR: '' // Empty character for unfilled positions
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

/**
 * Get segment info by cursor position
 * Segments: DD(0-2), /(2), MM(3-5), /(5), YYYY(6-10)
 */
/**
 * Get segment info by cursor position
 * Dynamically calculates ranges based on slash positions to handle variable length (Arabic vs Digits)
 */
function dateGetSegmentByCursor(pos, value) {
    if (!value) return { start: 0, end: 0, type: 'day', maxLen: 2 };

    // Find slash positions
    const slash1 = value.indexOf('/');
    const slash2 = value.lastIndexOf('/');

    // Default to strict index if slashes missing (fallback)
    if (slash1 === -1) return { start: 1, end: 3, type: 'day', maxLen: 2 };

    // Determine segment based on position relative to slashes
    // Day: [LRM...DAY...LRM] /
    if (pos <= slash1) {
        return { start: 1, end: slash1 - 1, type: 'day', maxLen: 2 };
    }
    // Month: / [LRM...MONTH...LRM] /
    if (pos <= slash2) {
        return { start: slash1 + 2, end: slash2 - 1, type: 'month', maxLen: 2 };
    }
    // Year: / [LRM...YEAR]
    return { start: slash2 + 2, end: value.length, type: 'year', maxLen: 4 };
}

/**
 * Get segment by position index (0=day, 1=month, 2=year)
 */
function dateGetSegmentByIndex(index, value) {
    if (!value) return { start: 0, end: 0, type: 'day', maxLen: 2 };

    const slash1 = value.indexOf('/');
    const slash2 = value.lastIndexOf('/');

    if (slash1 === -1) return { start: 1, end: 3, type: 'day', maxLen: 2 }; // Fallback

    if (index === 0) return { start: 1, end: slash1 - 1, type: 'day', maxLen: 2 };
    if (index === 1) return { start: slash1 + 2, end: slash2 - 1, type: 'month', maxLen: 2 };
    return { start: slash2 + 2, end: value.length, type: 'year', maxLen: 4 };
}

/**
 * Parse segments from display value
 * Strips placeholder text (localized) treating them as empty
 */
function dateParseSegments(value) {
    const parts = value.split('/');
    let day = (parts[0] || '').replace(/\D/g, '');
    let month = (parts[1] || '').replace(/\D/g, '');
    let year = (parts[2] || '').replace(/\D/g, '');

    return { day, month, year };
}

/**
 * Build display value from segments (static slashes)
 * Uses placeholder text for empty segments: localized IDs
 */
function dateBuildValue(day, month, year, usePlaceholders = false) {
    if (usePlaceholders) {
        const lang = document.documentElement.lang || 'en';
        const displayDay = day || t(lang, 'datePlaceholderDay');
        const displayMonth = month || t(lang, 'datePlaceholderMonth');
        const displayYear = year || t(lang, 'datePlaceholderYear');
        // Use Left-to-Right Mark (\u200E) to force strict LTR visualization mixed with Arabic
        return `\u200E${displayDay}\u200E/\u200E${displayMonth}\u200E/\u200E${displayYear}`;
    }
    // Also add LRM to standard numerical display to ensure consistency
    return `\u200E${day}\u200E/\u200E${month}\u200E/\u200E${year}`;
}

/**
 * Pad segment with leading zeros
 */
function datePadSegment(value, maxLen) {
    if (!value) return '';
    return value.padStart(maxLen, '0');
}

/* --- Segment Navigation with Leading Zero --- */

/**
 * Navigate between date segments with arrow keys
 * Adds leading zero to current segment before moving
 */
function handleDateLateralArrow(e, input) {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return false;

    const cursor = input.selectionStart;
    const currentSeg = dateGetSegmentByCursor(cursor, input.value);
    const segments = dateParseSegments(input.value);

    // Pad current segment with leading zero if it has 1 digit (DD/MM only)
    let needsUpdate = false;
    if (currentSeg.type === 'day' && segments.day.length === 1) {
        segments.day = datePadSegment(segments.day, 2);
        needsUpdate = true;
    } else if (currentSeg.type === 'month' && segments.month.length === 1) {
        segments.month = datePadSegment(segments.month, 2);
        needsUpdate = true;
    }

    // Determine target segment index — resolved AFTER rebuild so offsets are always fresh.
    // Previously newSeg was computed from the OLD value then applied to the NEW value;
    // when padding added a digit ("5" → "05") all slash positions shifted by +1,
    // making the stored start/end land on the invisible LRM char instead of the digit.
    let newSegIndex = null;
    if (e.key === 'ArrowRight') {
        if (currentSeg.type === 'day') newSegIndex = 1;
        else if (currentSeg.type === 'month') newSegIndex = 2;
    } else {
        if (currentSeg.type === 'year') newSegIndex = 1;
        else if (currentSeg.type === 'month') newSegIndex = 0;
    }

    if (newSegIndex !== null || needsUpdate) {
        e.preventDefault();

        // Rebuild first — padding may change slash positions
        if (needsUpdate) {
            input.value = dateBuildValue(segments.day, segments.month, segments.year, true);
        }

        if (newSegIndex !== null) {
            // Resolve newSeg NOW, after the value has been updated
            const newSeg = dateGetSegmentByIndex(newSegIndex, input.value);
            input.setSelectionRange(newSeg.start, newSeg.end);
        } else {
            // Padding only, no navigation — re-select same segment with fresh offsets
            const currentIdx = currentSeg.type === 'year' ? 2 : (currentSeg.type === 'month' ? 1 : 0);
            const refSeg = dateGetSegmentByIndex(currentIdx, input.value);
            input.setSelectionRange(refSeg.start, refSeg.end);
        }
        return true;
    }

    return false;
}

/* --- Backspace Handler --- */

/**
 * Handle backspace: 
 * - Clear entire current segment
 * - Move to previous segment (if available)
 * Windows Calculator style: backspace always clears whole segment
 */
function handleDateBackspace(e, input) {
    if (e.key !== 'Backspace') return false;

    e.preventDefault();

    const cursor = input.selectionStart;
    const currentSeg = dateGetSegmentByCursor(cursor, input.value);
    const segments = dateParseSegments(input.value);

    // Get current segment content
    let segContent = '';
    if (currentSeg.type === 'day') segContent = segments.day;
    else if (currentSeg.type === 'month') segContent = segments.month;
    else segContent = segments.year;

    // First Backspace: clear the segment, but STAY on it.
    // (Second Backspace on an already-empty segment moves to previous.)
    if (segContent.length > 0) {
        if (currentSeg.type === 'day') segments.day = '';
        else if (currentSeg.type === 'month') segments.month = '';
        else segments.year = '';

        input.value = dateBuildValue(segments.day, segments.month, segments.year, true);

        // Re-select the same (now-empty) segment — do NOT jump back
        const currentIdx = currentSeg.type === 'year' ? 2 : (currentSeg.type === 'month' ? 1 : 0);
        const refSeg = dateGetSegmentByIndex(currentIdx, input.value);
        input.setSelectionRange(refSeg.start, refSeg.end);
        return true;
    }

    // Segment is already empty — move to previous segment
    let prevSeg = null;
    if (currentSeg.type === 'year') prevSeg = dateGetSegmentByIndex(1, input.value);
    else if (currentSeg.type === 'month') prevSeg = dateGetSegmentByIndex(0, input.value);

    if (prevSeg) {
        input.setSelectionRange(prevSeg.start, prevSeg.end);
    }
    return true;
}

/* --- Digit Input Handler --- */

/**
 * Handle digit input with segment replacement behavior
 */
function handleDateDigitInput(e, input, nativeInput, errorCallback) {
    // Only handle digit keys
    if (!/^\d$/.test(e.key)) return false;

    e.preventDefault();

    const cursor = input.selectionStart;
    const selEnd = input.selectionEnd;
    const currentSeg = dateGetSegmentByCursor(cursor, input.value);
    const segments = dateParseSegments(input.value);

    // Get current segment content
    let segContent = '';
    if (currentSeg.type === 'day') segContent = segments.day;
    else if (currentSeg.type === 'month') segContent = segments.month;
    else segContent = segments.year;

    // Determine if segment is fully selected (replace mode)
    const isFullySelected = (cursor === currentSeg.start && selEnd === currentSeg.end);
    const isAtSegmentEnd = (segContent.length >= currentSeg.maxLen);

    let newContent;
    if (isFullySelected || isAtSegmentEnd) {
        // Replace entire segment with new digit
        newContent = e.key;
    } else {
        // Append to segment (up to max length)
        newContent = (segContent + e.key).slice(0, currentSeg.maxLen);
    }

    // Update segment
    if (currentSeg.type === 'day') segments.day = newContent;
    else if (currentSeg.type === 'month') segments.month = newContent;
    else segments.year = newContent;

    input.value = dateBuildValue(segments.day, segments.month, segments.year, true);

    // Auto-advance logic
    const shouldAdvance = (currentSeg.type === 'day' && segments.day.length === 2) ||
        (currentSeg.type === 'month' && segments.month.length === 2);

    if (shouldAdvance) {
        // Move to next segment and select it
        let nextSeg = null;
        if (currentSeg.type === 'day') nextSeg = dateGetSegmentByIndex(1, input.value);
        else if (currentSeg.type === 'month') nextSeg = dateGetSegmentByIndex(2, input.value);

        if (nextSeg) {
            requestAnimationFrame(() => {
                input.setSelectionRange(nextSeg.start, nextSeg.end);
            });
        }
    } else {
        // Position cursor after the entered digit
        const newCursor = currentSeg.start + newContent.length;
        requestAnimationFrame(() => {
            input.setSelectionRange(newCursor, newCursor);
        });
    }

    // Validate if complete
    validateDateInputAndSync(input, nativeInput, errorCallback, true);

    return true;
}

/* --- Validation & Sync --- */

function validateDateInputAndSync(input, nativeInput, errorCallback, silent = false) {
    const segments = dateParseSegments(input.value);

    // Check if all segments are complete
    if (segments.day.length !== 2 || segments.month.length !== 2 || segments.year.length !== 4) {
        input.classList.remove('text-red-500');
        return false;
    }

    const d = parseInt(segments.day, 10);
    const m = parseInt(segments.month, 10);
    const y = parseInt(segments.year, 10);

    const lang = document.documentElement.lang || 'en';

    if (!d || !m || !y || y < 1000) {
        input.classList.add('text-red-500');
        if (errorCallback && !silent) errorCallback(t(lang, 'errorInvalidDate'));
        return false;
    }

    if (!dateIsValid(d, m, y)) {
        input.classList.add('text-red-500');
        if (errorCallback && !silent) errorCallback(t(lang, 'errorDateDoesNotExist'));
        return false;
    }

    const iso = dateToISO(d, m, y);

    if (!dateIsWithinRange(iso)) {
        input.classList.add('text-red-500');
        if (errorCallback && !silent) errorCallback(t(lang, 'errorDateOutOfRange'));
        return false;
    }

    // Also respect the input-specific min/max (e.g. first installment >= booking date)
    if (nativeInput.min && iso < nativeInput.min) {
        input.classList.add('text-red-500');
        if (errorCallback && !silent) errorCallback(t(lang, 'errorFirstInstBeforeBooking'));
        return false;
    }
    if (nativeInput.max && iso > nativeInput.max) {
        input.classList.add('text-red-500');
        if (errorCallback && !silent) errorCallback(t(lang, 'errorDateOutOfRange'));
        return false;
    }

    // Valid! Sync to native input
    input.classList.remove('text-red-500');
    input.dataset.iso = iso;
    nativeInput.value = iso;
    nativeInput.dispatchEvent(new Event('change'));
    return true;
}

/* --- Arrow Key Increment (Up/Down) --- */

function handleDateArrowKey(e, input, nativeInput) {
    if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return false;

    let iso = input.dataset.iso;

    if (!iso) {
        const segments = dateParseSegments(input.value);
        if (segments.day.length === 2 && segments.month.length === 2 && segments.year.length === 4) {
            const d = parseInt(segments.day, 10);
            const m = parseInt(segments.month, 10);
            const y = parseInt(segments.year, 10);
            if (dateIsValid(d, m, y)) {
                iso = dateToISO(d, m, y);
                input.dataset.iso = iso;
                nativeInput.value = iso;
            }
        }
    }

    if (!iso) return false;

    e.preventDefault();

    const delta = e.key === 'ArrowUp' ? 1 : -1;
    const cursor = input.selectionStart;
    const seg = dateGetSegmentByCursor(cursor, input.value);

    // Parse current date from ISO string directly (avoids UTC-offset issues)
    const [curY, curM, curD] = iso.split('-').map(Number);

    let newY = curY, newM = curM, newD = curD;

    if (seg.type === 'day') {
        // JS Date handles cross-month overflow correctly for day increments
        const d = new Date(curY, curM - 1, curD + delta);
        newY = d.getFullYear();
        newM = d.getMonth() + 1;
        newD = d.getDate();
    } else if (seg.type === 'month') {
        // Land on the 1st of the target month first, then clamp the day.
        // Avoids the JS Date rollover: e.g. Jan 31 + 1 month ≠ Mar 3.
        const tmp = new Date(curY, (curM - 1) + delta, 1);
        newY = tmp.getFullYear();
        newM = tmp.getMonth() + 1;
        const maxDay = new Date(newY, newM, 0).getDate(); // last day of target month
        newD = Math.min(curD, maxDay);
    } else {
        newY = curY + delta;
        // Clamp day: handles Feb 29 in leap year → non-leap year
        const maxDay = new Date(newY, newM, 0).getDate();
        newD = Math.min(curD, maxDay);
    }

    const newISO = dateToISO(newD, newM, newY);
    if (!dateIsWithinRange(newISO)) return true;
    // Respect the input-specific min/max (e.g. first installment >= booking date)
    if (nativeInput.min && newISO < nativeInput.min) return true;
    if (nativeInput.max && newISO > nativeInput.max) return true;

    input.value = dateBuildValue(
        String(newD).padStart(2, '0'),
        String(newM).padStart(2, '0'),
        String(newY),
        true
    );
    input.dataset.iso = newISO;
    nativeInput.value = newISO;
    // Fire 'change' on nativeInput so the open date picker calendar re-renders live.
    // (Typing already does this via validateDateInputAndSync; arrow keys need to match.)
    nativeInput.dispatchEvent(new Event('change'));

    // Re-derive seg from the updated value so the highlight stays on the right segment.
    // Note: the 'change' handler in initDateInput may also rebuild input.value, so we
    // read input.value *after* the dispatch to get the freshest offsets.
    const refreshedSeg = dateGetSegmentByCursor(cursor, input.value);
    input.setSelectionRange(refreshedSeg.start, refreshedSeg.end);
    return true;
}

/* --- Segment Selection Handlers --- */

function handleDateFocus(input) {
    const segments = dateParseSegments(input.value);

    // Show placeholders for empty segments
    if (!segments.day && !segments.month && !segments.year) {
        input.value = dateBuildValue('', '', '', true); // DD/MM/YYYY
        requestAnimationFrame(() => {
            const firstSeg = dateGetSegmentByIndex(0, input.value);
            input.setSelectionRange(firstSeg.start, firstSeg.end);
        });
        return;
    }

    // If value has some content, show with placeholders for empty parts
    input.value = dateBuildValue(segments.day, segments.month, segments.year, true);

    requestAnimationFrame(() => {
        const seg = dateGetSegmentByCursor(input.selectionStart || 0, input.value);
        input.setSelectionRange(seg.start, seg.end);
    });
}

function handleDateClick(input) {
    // Auto-pad incomplete segments before switching (like arrow key behavior)
    const segments = dateParseSegments(input.value);
    let needsUpdate = false;

    if (segments.day.length === 1) {
        segments.day = datePadSegment(segments.day, 2);
        needsUpdate = true;
    }
    if (segments.month.length === 1) {
        segments.month = datePadSegment(segments.month, 2);
        needsUpdate = true;
    }

    if (needsUpdate) {
        input.value = dateBuildValue(segments.day, segments.month, segments.year, true);
    }

    requestAnimationFrame(() => {
        const seg = dateGetSegmentByCursor(input.selectionStart, input.value);
        input.setSelectionRange(seg.start, seg.end);
    });
}

function handleDateDblClick(e, input) {
    e.preventDefault();
    const seg = dateGetSegmentByCursor(input.selectionStart, input.value);
    input.setSelectionRange(seg.start, seg.end);
}

/* --- Blur Handler with Auto-Padding --- */

function handleDateBlur(input, nativeInput, errorCallback) {
    const segments = dateParseSegments(input.value);

    // Auto-pad incomplete segments with leading zeros
    if (segments.day.length === 1) segments.day = datePadSegment(segments.day, 2);
    if (segments.month.length === 1) segments.month = datePadSegment(segments.month, 2);

    // Update display with placeholders for empty segments
    input.value = dateBuildValue(segments.day, segments.month, segments.year, true);

    validateDateInputAndSync(input, nativeInput, errorCallback);
}

/* --- Main Initialization Function --- */

function initDateInput(displayInput, nativeInput) {
    if (!displayInput || !nativeInput) return;

    // Only set min/max from global config if the caller hasn't already set
    // picker-specific constraints (e.g. first installment must be after grant date).
    if (!nativeInput.min) nativeInput.min = DATE_CONFIG.MIN_DATE;
    if (!nativeInput.max) nativeInput.max = DATE_CONFIG.MAX_DATE;

    let isComposing = false;

    displayInput.addEventListener('compositionstart', () => {
        isComposing = true;
    });

    displayInput.addEventListener('compositionend', () => {
        isComposing = false;
    });

    // Keydown: handle all special keys and digit input
    displayInput.addEventListener('keydown', (e) => {
        if (isComposing) return;

        // Enter key
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleDateBlur(displayInput, nativeInput, (msg) => showToast(msg, 'error'));
            displayInput.blur();
            return;
        }

        // Tab: pad current segment before leaving
        if (e.key === 'Tab') {
            const cursor = displayInput.selectionStart;
            const currentSeg = dateGetSegmentByCursor(cursor, displayInput.value);
            const segments = dateParseSegments(displayInput.value);

            if (currentSeg.type === 'day' && segments.day.length === 1) {
                segments.day = datePadSegment(segments.day, 2);
                displayInput.value = dateBuildValue(segments.day, segments.month, segments.year);
            } else if (currentSeg.type === 'month' && segments.month.length === 1) {
                segments.month = datePadSegment(segments.month, 2);
                displayInput.value = dateBuildValue(segments.day, segments.month, segments.year);
            }
            return; // Let default tab behavior continue
        }

        // Backspace
        if (handleDateBackspace(e, displayInput)) {
            validateDateInputAndSync(displayInput, nativeInput, null, true);
            return;
        }

        // Left/Right arrows (with leading zero padding)
        if (handleDateLateralArrow(e, displayInput)) {
            return;
        }

        // Up/Down arrows (increment/decrement)
        if (handleDateArrowKey(e, displayInput, nativeInput)) {
            return;
        }

        // Digit input
        if (handleDateDigitInput(e, displayInput, nativeInput, (msg) => showToast(msg, 'error'))) {
            return;
        }

        // Block all other keys except navigation
        if (!['Home', 'End', 'Delete'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
        }
    });

    // Prevent ALL default input behaviour — everything is handled in keydown.
    // Blocking deleteContentBackward here prevents the browser from also deleting
    // a character after our keydown handler already did so (double-processing).
    displayInput.addEventListener('beforeinput', (e) => {
        if (isComposing) return;
        e.preventDefault();
    });

    // Blur validation with auto-padding
    displayInput.addEventListener('blur', () => {
        handleDateBlur(displayInput, nativeInput, (msg) => showToast(msg, 'error'));
    });

    // Focus: select appropriate segment
    displayInput.addEventListener('focus', () => handleDateFocus(displayInput));

    // Click: select clicked segment
    displayInput.addEventListener('click', () => handleDateClick(displayInput));

    // Double-click: select segment
    displayInput.addEventListener('dblclick', (e) => handleDateDblClick(e, displayInput));

    // Native picker sync
    nativeInput.addEventListener('change', () => {
        if (!nativeInput.value) {
            displayInput.value = '';
            displayInput.dataset.iso = '';
            return;
        }

        const [y, m, d] = nativeInput.value.split('-');
        // Use dateBuildValue so the value includes LRM chars, keeping segment
        // offsets consistent with what dateGetSegmentByCursor expects.
        displayInput.value = dateBuildValue(d, m, y, false);
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

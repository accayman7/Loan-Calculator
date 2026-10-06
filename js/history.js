/**
 * js/history.js - History Management & Persistence Module
 * Handles saving calculations, localStorage migrations, deletion, and history modal interactions.
 * Fully compatible with vanilla desktop file:// and offline PWA environments.
 */

(function () {
    const STORAGE_KEY = 'loanHistory';
    const MAX_HISTORY = 20;

    /**
     * Load history array from localStorage with backward-compatible ID migration
     * @returns {Array} Array of history calculation objects
     */
    function loadHistory() {
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            console.warn('[History] Failed to parse history from localStorage', e);
            history = [];
        }

        let migrated = false;
        history.forEach((item, idx) => {
            if (!item.id) {
                item.id = 'calc_' + (Date.parse(item.date) || Date.now()) + '_' + idx;
                migrated = true;
            }
        });

        if (migrated) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            } catch (e) {
                console.warn('[History] Failed to save migrated history', e);
            }
        }

        return history;
    }

    /**
     * Save a calculation entry to history
     * @param {Object} entry - Calculation snapshot
     * @returns {boolean} Success status
     */
    function saveHistory(entry) {
        const history = loadHistory();
        history.unshift(entry);
        if (history.length > MAX_HISTORY) {
            history.pop();
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return true;
    }

    /**
     * Delete an item by unique ID or numeric index
     * @param {string} targetId
     * @param {number} targetIndex
     * @returns {Array} Updated history array
     */
    function deleteHistoryItem(targetId, targetIndex) {
        let history = loadHistory();
        if (targetId) {
            history = history.filter((it, idx) => (it.id || `legacy_${idx}`) !== targetId);
        } else if (!isNaN(targetIndex)) {
            history.splice(targetIndex, 1);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return history;
    }

    /**
     * Render history cards in the modal list
     * @param {Array} history
     * @param {string} lang - 'en' or 'ar'
     */
    function renderHistoryList(history, lang) {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        const escapeFn = (typeof escapeHtml === 'function') ? escapeHtml : (s) => String(s || '');
        const formatFn = (typeof fmt === 'function') ? fmt : (n) => Number(n).toFixed(2);
        const transFn = (typeof t === 'function') ? t : (l, k) => k;

        if (!Array.isArray(history) || history.length === 0) {
            historyList.innerHTML = `<p class="text-center text-gray-500 py-8 text-sm">${escapeFn(transFn(lang, 'noHistorySaved'))}</p>`;
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
            <div class="history-card bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all active:scale-[0.98]" data-id="${escapeFn(itemId)}" data-index="${safeIndex}">
                <div class="flex justify-between items-start mb-2">
                    <p class="text-xs text-gray-400">${escapeFn(date)}</p>
                    <button type="button" class="delete-btn p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors" data-id="${escapeFn(itemId)}" data-index="${safeIndex}" title="${escapeFn(transFn(lang, 'deleteBtn'))}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
                <p class="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1">${escapeFn(formatFn(pVal))}</p>
                <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span class="flex items-center gap-1">
                        <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                        ${escapeFn(rVal)}%
                    </span>
                    <span class="flex items-center gap-1">
                        <svg class="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        ${escapeFn(nVal)}${escapeFn(periodUnit)}
                    </span>
                    <span class="flex items-center gap-1">
                        <svg class="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                        ${escapeFn(formatFn(mVal))}${escapeFn(instUnit)}
                    </span>
                </div>
                <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span class="text-xs text-gray-400">${escapeFn(transFn(lang, 'totalSumLabel'))}</span>
                    <span class="font-semibold text-gray-700 dark:text-gray-200 text-sm">${escapeFn(formatFn(totalPayment))}</span>
                </div>
            </div>`;
        }).join('');
    }

    /**
     * Wire history button and modal interaction events
     * @param {Object} options - Configuration and callbacks
     */
    function initHistory(options = {}) {
        const historyModal = document.getElementById('history-modal');
        const historyBtn = document.getElementById('history-btn');
        const closeHistory = document.getElementById('close-history');
        const historyList = document.getElementById('history-list');
        const saveBtn = document.getElementById('save-button');

        const getLang = () => (options.getLang ? options.getLang() : (document.documentElement.lang || 'en'));
        const doHaptic = (type) => { if (typeof haptic !== 'undefined') haptic(type); };
        const doModal = (el, show) => { if (typeof toggleModal === 'function') toggleModal(el, show); };

        if (historyBtn && historyModal) {
            historyBtn.addEventListener('click', () => {
                doHaptic('light');
                const history = loadHistory();
                renderHistoryList(history, getLang());
                doModal(historyModal, true);
            });

            if (closeHistory) {
                closeHistory.addEventListener('click', () => {
                    doHaptic('light');
                    doModal(historyModal, false);
                });
            }

            historyModal.addEventListener('click', (e) => {
                if (e.target === historyModal || e.target.classList.contains('modal-overlay')) {
                    doHaptic('light');
                    doModal(historyModal, false);
                }
            });

            if (historyList) {
                historyList.addEventListener('click', (e) => {
                    // Check if delete button was clicked
                    const deleteBtn = e.target.closest('.delete-btn');
                    if (deleteBtn) {
                        e.stopPropagation();
                        const card = deleteBtn.closest('.history-card');
                        const targetId = deleteBtn.dataset.id;
                        const targetIndex = parseInt(deleteBtn.dataset.index, 10);
                        if (!card) return;
                        doHaptic('light');

                        const updatedHistory = deleteHistoryItem(targetId, targetIndex);

                        // Animate card removal
                        historyList.style.overflowX = 'hidden';
                        card.style.transition = 'all 0.25s ease-out';
                        card.style.transform = 'translateX(100%)';
                        card.style.opacity = '0';
                        card.style.maxHeight = card.offsetHeight + 'px';
                        card.style.overflow = 'hidden';

                        setTimeout(() => {
                            card.style.maxHeight = '0';
                            card.style.marginBottom = '0';
                            card.style.padding = '0';
                            card.style.border = 'none';

                            setTimeout(() => {
                                card.remove();
                                if (updatedHistory.length === 0) {
                                    doModal(historyModal, false);
                                }
                            }, 200);
                        }, 150);
                        return;
                    }

                    // Check if card was clicked for loading/restoring
                    const card = e.target.closest('.history-card');
                    if (card) {
                        const targetId = card.dataset.id;
                        const targetIndex = parseInt(card.dataset.index, 10);
                        doHaptic('medium');
                        const history = loadHistory();
                        const item = targetId
                            ? history.find((it, idx) => (it.id || `legacy_${idx}`) === targetId)
                            : history[targetIndex];

                        if (item && typeof options.onRestore === 'function') {
                            options.onRestore(item);
                            doModal(historyModal, false);
                        }
                    }
                });
            }
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                doHaptic('medium');
                if (typeof options.onSave === 'function') {
                    options.onSave();
                }
            });
        }
    }

    // Expose globally for vanilla scripts
    window.HistoryManager = {
        load: loadHistory,
        save: saveHistory,
        delete: deleteHistoryItem,
        render: renderHistoryList,
        init: initHistory
    };

    // Keep backwards compatibility for any direct renderHistoryList calls
    window.renderHistoryList = renderHistoryList;
})();

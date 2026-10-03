/**
 * js/modals.js - In-App Modal Dialogs, ScrollLock & BackHandler
 * Handles modal transitions, backdrop dismiss, swipe-to-close, and background scroll locking.
 */

(function () {
    'use strict';

    /* ================= SCROLL LOCK UTILITY ================= */
    /**
     * Utility to prevent background scrolling when modals or pickers are open
     * without causing layout shifts from the scrollbar disappearing.
     */
    const ScrollLock = (() => {
        let lockCount = 0;
        let savedScrollY = 0;

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

        function isMobileOrTouch() {
            return window.innerWidth < 768 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        }

        function release() {
            const wasMobile = document.body.style.position === 'fixed';
            lockCount = 0;
            document.documentElement.classList.remove('scroll-lock');
            document.body.classList.remove('scroll-lock');

            if (wasMobile) {
                // Temporarily disable smooth scrolling so scroll restoration is completely instant and silent
                const docEl = document.documentElement;
                const prevBehavior = docEl.style.scrollBehavior;
                docEl.style.scrollBehavior = 'auto';

                // Restore body from fixed positioning and recover saved scroll position
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                document.body.style.width = '';
                window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });

                // Re-apply original scrollBehavior in the next animation frame
                requestAnimationFrame(() => {
                    docEl.style.scrollBehavior = prevBehavior;
                });
            }

            ['paddingRight', 'paddingLeft'].forEach(prop => {
                document.body.style[prop] = '';
                const nav = document.querySelector('nav');
                if (nav) nav.style[prop] = '';
                const updateBanner = document.getElementById('update-banner');
                if (updateBanner) updateBanner.style[prop] = '';
                const messageBox = document.getElementById('message-box');
                if (messageBox) messageBox.style[prop] = '';
                const mobileBackdrop = document.getElementById('mobile-picker-backdrop');
                if (mobileBackdrop) mobileBackdrop.style[prop] = '';
            });
        }

        function enable() {
            lockCount++;
            if (lockCount > 1 && document.body.classList.contains('scroll-lock')) return; // Already locked

            const docEl = document.documentElement;

            if (isMobileOrTouch()) {
                // Mobile: use position: fixed on body to freeze scroll without losing scroll position.
                // overflow: hidden on <html> alone can cause the viewport to jump to the top on mobile.
                savedScrollY = window.scrollY || window.pageYOffset || 0;
                document.body.style.position = 'fixed';
                document.body.style.top = `-${savedScrollY}px`;
                document.body.style.left = '0';
                document.body.style.right = '0';
                document.body.style.width = '100%';
            } else {
                // Desktop: scrollbar-gutter: stable (via CSS media query) handles gutter preservation.
                // For older browsers without scrollbar-gutter support, manually compensate padding.
                const supportsScrollbarGutter = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('scrollbar-gutter', 'stable');
                const scrollbarWidth = supportsScrollbarGutter ? 0 : Math.max(0, window.innerWidth - docEl.clientWidth);

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
            }
            docEl.classList.add('scroll-lock');
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

        function push(modalId, closeHandler) {
            if (modalStack.includes(modalId)) return; // Already tracked
            modalStack.push(modalId);
            closeHandlers[modalId] = closeHandler;
        }

        function pop(modalId) {
            const index = modalStack.indexOf(modalId);
            if (index === -1) return; // Not tracked
            modalStack.splice(index, 1);
            delete closeHandlers[modalId];
        }

        function isOpen(modalId) {
            return modalStack.includes(modalId);
        }

        function closeTopModal() {
            if (modalStack.length === 0) return false;
            const topId = modalStack[modalStack.length - 1];
            const handler = closeHandlers[topId];
            if (typeof handler === 'function') {
                handler();
                return true;
            }
            return false;
        }

        function init() {
            // Document-level Escape key listener for keyboard dismissal
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    // If a modal was open and closed, stop propagation
                    if (closeTopModal()) {
                        e.stopPropagation();
                    }
                }
            });
        }

        return { push, pop, isOpen, closeTopModal, init };
    })();

    /* ================= SWIPE DISMISS & MODAL TOGGLING ================= */
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
                if (typeof window.haptic === 'function') window.haptic('light');
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

            // Enable scroll lock first so layout padding is established before modal enters
            ScrollLock.enable();

            modal.classList.toggle('pointer-events-none', false);

            const overlay = modal.querySelector('.modal-overlay');
            if (overlay) overlay.classList.toggle('opacity-0', false);

            const container = modal.querySelector('.modal-container');
            if (container) {
                container.classList.toggle('translate-y-full', false);
                container.classList.toggle('md:opacity-0', false);
                container.classList.toggle('md:scale-95', false);
            }

            attachModalSwipeDismiss(modal);

            // Register with in-memory BackHandler
            BackHandler.push(modalId, () => toggleModal(modal, false));
        } else {
            modal.classList.toggle('pointer-events-none', true);

            const overlay = modal.querySelector('.modal-overlay');
            if (overlay) overlay.classList.toggle('opacity-0', true);

            const container = modal.querySelector('.modal-container');
            if (container) {
                container.classList.toggle('translate-y-full', true);
                container.classList.toggle('md:opacity-0', true);
                container.classList.toggle('md:scale-95', true);
            }

            removeModalSwipeDismiss();

            // Unregister from in-memory BackHandler immediately
            BackHandler.pop(modalId);

            const trigger = modal._triggerEl;
            modal._triggerEl = null;

            modal._closeTimer = setTimeout(() => {
                modal._closeTimer = null;
                ScrollLock.disable();
                // Restore keyboard focus to launcher element without triggering scroll jump
                if (trigger && typeof trigger.focus === 'function' && document.contains(trigger)) {
                    try { trigger.focus({ preventScroll: true }); } catch (_) {}
                }
            }, 300);
        }
    }

    // Public API exposure on window
    window.ScrollLock = ScrollLock;
    window.BackHandler = BackHandler;
    window.toggleModal = toggleModal;
    window.ModalManager = {
        toggle: toggleModal,
        scrollLock: ScrollLock,
        backHandler: BackHandler
    };
})();

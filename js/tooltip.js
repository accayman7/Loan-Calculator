// js/tooltip.js - Global, collision-aware tooltip engine
//
// WHY THIS EXISTS:
// Tooltips used to be CSS ::after pseudo-elements on each .info-icon, positioned
// with hard-coded offsets (left:0, right:-4.5rem, ...). A pseudo-element lives
// INSIDE its ancestors, so it got clipped by any card with overflow/rounded
// clipping, hidden under sibling stacking contexts, and pushed off-screen
// depending on where the icon happened to sit (LTR vs RTL, left vs right column).
//
// HOW THIS FIXES IT (for every [data-tooltip] element, current and future):
// 1. ONE tooltip element appended to <body> and promoted to the browser "top layer"
//    via the Popover API (fallback: position:fixed + max z-index). Nothing in the
//    page (overflow, transform, z-index) can clip or cover it.
// 2. Position is computed at show-time from the icon's real on-screen rect and
//    CLAMPED to the visible viewport (visualViewport aware, safe margins).
// 3. Auto-flips below the icon when there's not enough room above (incl. sticky nav).
// 4. The arrow follows the icon even when the bubble is shifted to stay on-screen.
// 5. Repositions on scroll / resize / pinch-zoom / keyboard, updates on language change.
//
// Usage: just put data-tooltip="text" on any element. No per-element classes needed.
(function () {
    'use strict';

    const SELECTOR = '[data-tooltip]';
    const VIEWPORT_MARGIN = 8;   // min distance from screen edges (px)
    const GAP = 8;               // distance between icon and bubble (px)
    const ARROW_INSET = 12;      // keep arrow away from bubble's rounded corners (px)
    const MAX_WIDTH = 280;       // preferred max bubble width (px)

    const supportsPopover = typeof HTMLElement !== 'undefined' &&
        Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover');

    let tipEl = null;
    let textEl = null;
    let anchor = null;      // element currently showing a tooltip
    let pinned = false;     // opened by click/tap (stays until dismissed)
    let rafId = 0;
    let attrObserver = null;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

    function ensureEl() {
        if (tipEl) return;
        tipEl = document.createElement('div');
        tipEl.id = 'app-tooltip';
        tipEl.className = 'app-tooltip';
        tipEl.setAttribute('role', 'tooltip');
        if (supportsPopover) tipEl.setAttribute('popover', 'manual');

        textEl = document.createElement('div');
        textEl.className = 'app-tooltip-text';

        const arrowEl = document.createElement('div');
        arrowEl.className = 'app-tooltip-arrow';

        tipEl.append(textEl, arrowEl);
        document.body.appendChild(tipEl);
    }

    function getViewport() {
        const vv = window.visualViewport;
        return {
            left: vv ? vv.offsetLeft : 0,
            top: vv ? vv.offsetTop : 0,
            width: vv ? vv.width : document.documentElement.clientWidth,
            height: vv ? vv.height : window.innerHeight
        };
    }

    // Bottom edge of any sticky/fixed header so we don't place the bubble under it
    function getObstructedTop() {
        const nav = document.querySelector('nav');
        if (!nav) return 0;
        const pos = getComputedStyle(nav).position;
        if (pos !== 'sticky' && pos !== 'fixed') return 0;
        return Math.max(0, nav.getBoundingClientRect().bottom);
    }

    function position() {
        rafId = 0;
        if (!anchor || !tipEl) return;
        if (!anchor.isConnected) { hide(); return; }

        const r = anchor.getBoundingClientRect();
        const vp = getViewport();

        // Anchor hidden (display:none) or scrolled fully out of view -> dismiss
        if ((r.width === 0 && r.height === 0) || r.bottom < vp.top || r.top > vp.top + vp.height) {
            hide();
            return;
        }

        // Width: never wider than the visible screen minus margins
        const maxW = Math.max(120, Math.min(MAX_WIDTH, vp.width - VIEWPORT_MARGIN * 2));
        tipEl.style.maxWidth = maxW + 'px';
        tipEl.style.left = '0px';
        tipEl.style.top = '0px';

        const w = tipEl.offsetWidth;
        const h = tipEl.offsetHeight;

        // Vertical: prefer above, flip below if it doesn't fit (accounting for sticky nav)
        const topLimit = Math.max(vp.top + VIEWPORT_MARGIN, getObstructedTop() + VIEWPORT_MARGIN);
        const bottomLimit = vp.top + vp.height - VIEWPORT_MARGIN;
        const spaceAbove = r.top - GAP - topLimit;
        const spaceBelow = bottomLimit - (r.bottom + GAP);
        const placeBelow = spaceAbove < h && spaceBelow > spaceAbove;

        let top = placeBelow ? r.bottom + GAP : r.top - GAP - h;
        top = clamp(top, vp.top + VIEWPORT_MARGIN, bottomLimit - h);

        // Horizontal: center on icon, then clamp inside the visible viewport
        const iconCenterX = r.left + r.width / 2;
        const left = clamp(iconCenterX - w / 2, vp.left + VIEWPORT_MARGIN, vp.left + vp.width - VIEWPORT_MARGIN - w);

        // Arrow keeps pointing at the icon even when bubble was shifted
        const arrowX = clamp(iconCenterX - left, ARROW_INSET, w - ARROW_INSET);

        tipEl.style.left = Math.round(left) + 'px';
        tipEl.style.top = Math.round(top) + 'px';
        tipEl.style.setProperty('--arrow-x', Math.round(arrowX) + 'px');
        tipEl.dataset.placement = placeBelow ? 'bottom' : 'top';
    }

    function schedulePosition() {
        if (!anchor || rafId) return;
        rafId = requestAnimationFrame(position);
    }

    function syncText() {
        if (!anchor) return;
        textEl.textContent = anchor.getAttribute('data-tooltip') || '';
        tipEl.setAttribute('dir', document.documentElement.getAttribute('dir') || 'ltr');
    }

    function show(el, pin) {
        const text = el.getAttribute('data-tooltip');
        if (!text) return;
        ensureEl();

        if (anchor && anchor !== el) hide();
        anchor = el;
        pinned = !!pin;

        syncText();
        anchor.setAttribute('aria-describedby', 'app-tooltip');

        if (!tipEl.classList.contains('is-open')) {
            if (supportsPopover) {
                try { tipEl.showPopover(); } catch { /* already open */ }
            }
            tipEl.classList.add('is-open');
            tipEl.classList.remove('is-shown');
            position();
            requestAnimationFrame(() => tipEl && anchor && tipEl.classList.add('is-shown'));
        } else {
            position();
        }

        // Live-update text if language changes while visible
        if (attrObserver) attrObserver.disconnect();
        attrObserver = new MutationObserver(() => { syncText(); schedulePosition(); });
        attrObserver.observe(anchor, { attributes: true, attributeFilter: ['data-tooltip'] });
    }

    function hide() {
        if (attrObserver) { attrObserver.disconnect(); attrObserver = null; }
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        if (anchor) anchor.removeAttribute('aria-describedby');
        anchor = null;
        pinned = false;
        if (!tipEl) return;
        tipEl.classList.remove('is-shown', 'is-open');
        if (supportsPopover) {
            try { tipEl.hidePopover(); } catch { /* already hidden */ }
        }
    }

    const closestTip = (target) => (target && target.closest ? target.closest(SELECTOR) : null);

    // --- Mouse hover (desktop) ---
    document.addEventListener('pointerover', (e) => {
        if (e.pointerType !== 'mouse') return;
        const el = closestTip(e.target);
        if (el && el !== anchor) show(el, false);
    });

    document.addEventListener('pointerout', (e) => {
        if (e.pointerType !== 'mouse' || !anchor || pinned) return;
        const el = closestTip(e.target);
        if (el === anchor && !anchor.contains(e.relatedTarget)) hide();
    });

    // --- Tap / click (mobile + desktop pin) ---
    // Dismiss on any press outside the current anchor (fires before scroll starts)
    document.addEventListener('pointerdown', (e) => {
        if (anchor && closestTip(e.target) !== anchor) hide();
    }, true);

    document.addEventListener('click', (e) => {
        const el = closestTip(e.target);
        if (!el) return;
        e.preventDefault(); // e.g. avoid focusing a <label>'s input
        if (anchor === el && pinned) hide();
        else show(el, true);
    });

    // --- Keyboard ---
    document.addEventListener('focusin', (e) => {
        const el = closestTip(e.target);
        if (!el) return;
        let keyboard = true;
        try { keyboard = el.matches(':focus-visible'); } catch (_) { /* old browsers */ }
        if (keyboard) show(el, false);
    });

    document.addEventListener('focusout', (e) => {
        if (anchor && e.target === anchor) hide();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && anchor) { hide(); return; }
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = closestTip(e.target);
        if (!el || el.matches('input, textarea, select')) return;
        e.preventDefault();
        if (anchor === el && pinned) hide();
        else show(el, true);
    });

    // --- Keep it glued to the icon ---
    window.addEventListener('scroll', schedulePosition, { capture: true, passive: true });
    window.addEventListener('resize', schedulePosition, { passive: true });
    window.addEventListener('orientationchange', schedulePosition, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', schedulePosition, { passive: true });
        window.visualViewport.addEventListener('scroll', schedulePosition, { passive: true });
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });

    window.AppTooltip = { show: (el) => show(el, true), hide, reposition: schedulePosition };
})();

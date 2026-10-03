/**
 * js/chart.js - Native Interactive SVG Doughnut Chart Engine
 * Lightweight, zero-dependency data visualization with smooth arc animations.
 */

(function () {
    'use strict';

    let chartInst = null;

/**
 * Lightweight Native SVG Doughnut Chart Helpers
 */
function _polarToCartesian(cx, cy, r, angleInRadians) {
    return {
        x: cx + r * Math.cos(angleInRadians),
        y: cy + r * Math.sin(angleInRadians)
    };
}

function _describeDonutSegment(cx, cy, rInner, rOuter, startAngle, endAngle, gapWidth = 0) {
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

    if (!gapWidth || gapWidth <= 0) {
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

    // Parallel cut geometry:
    // Straight cut lines parallel to the radial partition ray at uniform perpendicular offset w = gapWidth / 2.
    // Facing edges of adjacent slices are separated by exact constant distance 2 * w = gapWidth across the entire ring.
    const maxW = rInner * Math.sin(sweep * 0.25);
    const w = Math.min(gapWidth / 2, Math.max(0, maxW));

    const a1_out = startAngle + Math.asin(w / rOuter);
    const a1_in  = startAngle + Math.asin(w / rInner);
    const a2_out = endAngle - Math.asin(w / rOuter);
    const a2_in  = endAngle - Math.asin(w / rInner);

    if (a2_out <= a1_out || a2_in <= a1_in) return '';

    const p1_out = _polarToCartesian(cx, cy, rOuter, a1_out);
    const p2_out = _polarToCartesian(cx, cy, rOuter, a2_out);
    const p2_in  = _polarToCartesian(cx, cy, rInner, a2_in);
    const p1_in  = _polarToCartesian(cx, cy, rInner, a1_in);

    const sweepOut = a2_out - a1_out;
    const sweepIn  = a2_in - a1_in;

    return [
        `M ${p1_out.x.toFixed(2)} ${p1_out.y.toFixed(2)}`,
        `A ${rOuter} ${rOuter} 0 ${sweepOut > Math.PI ? 1 : 0} 1 ${p2_out.x.toFixed(2)} ${p2_out.y.toFixed(2)}`,
        `L ${p2_in.x.toFixed(2)} ${p2_in.y.toFixed(2)}`,
        `A ${rInner} ${rInner} 0 ${sweepIn > Math.PI ? 1 : 0} 0 ${p1_in.x.toFixed(2)} ${p1_in.y.toFixed(2)}`,
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

    const pFrac = total > 0 ? P / total : 1;
    const iFrac = total > 0 ? I / total : 0;

    const pPct = (pFrac * 100).toFixed(1) + '%';
    const iPct = (iFrac * 100).toFixed(1) + '%';
    const pAmt = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US').format(Math.round(P));
    const iAmt = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US').format(Math.round(I));

    const pLabel = t(lang, 'chartLabelPrincipal') || (lang === 'ar' ? 'أصل القرض' : 'Principal');
    const iLabel = t(lang, 'chartLabelInterest') || (lang === 'ar' ? 'الفوائد الإجمالية' : 'Interest');

    const pAngle = pFrac * 2 * Math.PI;
    const iAngle = iFrac * 2 * Math.PI;
    const start = -Math.PI / 2;

    const gapW = (iFrac > 0.005 && pFrac > 0.005) ? 4.5 : 0; // Uniform 4.5px parallel cut gap
    const startP = start;
    const endP = start + pAngle;
    const startI = start + pAngle;
    const endI = start + 2 * Math.PI;

    const pPathFinal = _describeDonutSegment(100, 100, 56, 88, startP, endP, gapW);
    const iPathFinal = iFrac > 0 ? _describeDonutSegment(100, 100, 56, 88, startI, endI, gapW) : '';

    // Static hit target geometry: envelopes resting and translated radial zones (54 to 93)
    const pPathHit = _describeDonutSegment(100, 100, 54, 93, startP, endP, Math.max(2.5, gapW - 1));
    const iPathHit = iFrac > 0 ? _describeDonutSegment(100, 100, 54, 93, startI, endI, Math.max(2.5, gapW - 1)) : '';

    const midP = (startP + endP) / 2;
    const midI = (startI + endI) / 2;
    const explodeDist = 5.0;
    const dxP = (explodeDist * Math.cos(midP)).toFixed(2);
    const dyP = (explodeDist * Math.sin(midP)).toFixed(2);
    const dxI = (explodeDist * Math.cos(midI)).toFixed(2);
    const dyI = (explodeDist * Math.sin(midI)).toFixed(2);

    const initialPD = animate ? '' : pPathFinal;
    const initialID = animate ? '' : iPathFinal;
    const initialVal = animate ? '0.0%' : pPct;

    const uid = 'd_' + Math.random().toString(36).substr(2, 6);

    container.innerHTML = `
        <div class="donut-chart-container select-none">
            <!-- Donut Visual -->
            <div class="donut-visual">
                <svg viewBox="0 0 200 200" class="w-full h-full overflow-visible" role="img" aria-label="${pLabel}: ${pPct}, ${iLabel}: ${iPct}">
                    <!-- Visual Slices (glides on hover, pointer-events-none so physical motion never interrupts hit-testing) -->
                    <g id="${uid}_visual_group">
                        <path id="${uid}_p" d="${initialPD}" fill="#3b82f6" class="donut-slice donut-slice-p pointer-events-none">
                            <title>${pLabel}: ${pPct} (${pAmt})</title>
                        </path>
                        ${iFrac > 0 ? `
                        <path id="${uid}_i" d="${initialID}" fill="#ef4444" class="donut-slice donut-slice-i pointer-events-none">
                            <title>${iLabel}: ${iPct} (${iAmt})</title>
                        </path>` : ''}
                    </g>
                    <!-- Static Hit Targets (never translates, captures mouseenter/mouseleave stably without edge jitter) -->
                    <g id="${uid}_hit_group">
                        <path id="${uid}_hit_p" d="${pPathHit}" fill="transparent" class="donut-hit-area cursor-pointer" style="pointer-events: fill;">
                            <title>${pLabel}: ${pPct} (${pAmt})</title>
                        </path>
                        ${iFrac > 0 ? `
                        <path id="${uid}_hit_i" d="${iPathHit}" fill="transparent" class="donut-hit-area cursor-pointer" style="pointer-events: fill;">
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

            const currEndP = startP + (endP - startP) * progress;
            const currEndI = startI + (endI - startI) * progress;

            if (sp) {
                sp.setAttribute('d', _describeDonutSegment(100, 100, 56, 88, startP, currEndP, gapW));
            }
            if (si && iFrac > 0) {
                si.setAttribute('d', _describeDonutSegment(100, 100, 56, 88, startI, currEndI, gapW));
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
        const isDark = document.documentElement.classList.contains('dark');
        const elevationShadow = isDark ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' : 'drop-shadow(0 3px 6px rgba(0,0,0,0.12))';

        if (target === 'p' && sp) {
            sp.classList.add('hovered');
            sp.classList.remove('dimmed');
            sp.style.transform = `translate(${dxP}px, ${dyP}px)`;
            sp.style.filter = elevationShadow;
            sp.style.opacity = '1';
            if (si) {
                si.classList.add('dimmed');
                si.classList.remove('hovered');
                si.style.transform = 'translate(0, 0)';
                si.style.filter = 'none';
                si.style.opacity = '0.35';
            }
            if (cl) cl.textContent = pLabel;
            if (cv) cv.textContent = pPct;
            lp?.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
            li?.classList.remove('bg-red-50', 'dark:bg-red-900/20');
        } else if (target === 'i' && si) {
            si.classList.add('hovered');
            si.classList.remove('dimmed');
            si.style.transform = `translate(${dxI}px, ${dyI}px)`;
            si.style.filter = elevationShadow;
            si.style.opacity = '1';
            if (sp) {
                sp.classList.add('dimmed');
                sp.classList.remove('hovered');
                sp.style.transform = 'translate(0, 0)';
                sp.style.filter = 'none';
                sp.style.opacity = '0.35';
            }
            if (cl) cl.textContent = iLabel;
            if (cv) cv.textContent = iPct;
            li?.classList.add('bg-red-50', 'dark:bg-red-900/20');
            lp?.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
        }
    }

    function clearHover() {
        if (sp) {
            sp.classList.remove('hovered', 'dimmed');
            sp.style.transform = '';
            sp.style.filter = '';
            sp.style.opacity = '1';
        }
        if (si) {
            si.classList.remove('hovered', 'dimmed');
            si.style.transform = '';
            si.style.filter = '';
            si.style.opacity = '1';
        }
        if (cl) cl.textContent = pLabel;
        if (cv) cv.textContent = pPct;
        lp?.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
        li?.classList.remove('bg-red-50', 'dark:bg-red-900/20');
    }

    const hitP = document.getElementById(`${uid}_hit_p`);
    const hitI = document.getElementById(`${uid}_hit_i`);

    if (hitP) {
        hitP.onmouseenter = () => setHover('p');
        hitP.onmouseleave = clearHover;
    }
    if (sp) {
        sp.onmouseenter = () => setHover('p');
        sp.onmouseleave = clearHover;
    }
    if (lp) {
        lp.onmouseenter = () => setHover('p');
        lp.onmouseleave = clearHover;
    }

    if (hitI) {
        hitI.onmouseenter = () => setHover('i');
        hitI.onmouseleave = clearHover;
    }
    if (si) {
        si.onmouseenter = () => setHover('i');
        si.onmouseleave = clearHover;
    }
    if (li) {
        li.onmouseenter = () => setHover('i');
        li.onmouseleave = clearHover;
    }

    // Safety fallbacks: guarantee hover state never sticks when cursor exits chart area
    const chartWrapper = container.querySelector('.donut-chart-container');
    if (chartWrapper) {
        chartWrapper.addEventListener('mouseleave', clearHover);
        chartWrapper.addEventListener('pointerleave', clearHover);
    }
    container.addEventListener('mouseleave', clearHover);

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

    // Public API exposure
    window.drawChart = drawChart;
    window.loadChartJS = loadChartJS;
    window.ChartEngine = {
        draw: drawChart,
        load: loadChartJS,
        getInstance: () => chartInst
    };
})();

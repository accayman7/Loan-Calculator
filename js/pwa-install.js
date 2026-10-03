/**
 * js/pwa-install.js - PWA Installation & Banner Coordination
 * Manages beforeinstallprompt capture, floating install button,
 * About modal install button, and iOS Home Screen install guide.
 */

(function () {
    'use strict';

    let deferredPrompt = null;

    // Capture beforeinstallprompt IMMEDIATELY (before window.load)
    // so the event is never missed regardless of script timing.
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const instBtn = document.getElementById('install-button');
        if (instBtn) instBtn.classList.remove('hidden');
    });

    /** Mark the app as installed and hide both install buttons */
    function markAppInstalled() {
        deferredPrompt = null;
        localStorage.setItem('pwaInstalled', '1');
        const instBtn = document.getElementById('install-button');
        const aboutInstBtn = document.getElementById('about-install-btn');
        if (instBtn) instBtn.classList.add('hidden');
        if (aboutInstBtn) aboutInstBtn.classList.add('hidden');
    }

    function setupInstallListeners(getLangFn) {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
        const wasInstalled = localStorage.getItem('pwaInstalled') === '1';

        // If beforeinstallprompt already fired before load, show the floating button now
        const instBtn = document.getElementById('install-button');
        if (instBtn && deferredPrompt) instBtn.classList.remove('hidden');

        // Floating install button click handler
        if (instBtn) {
            instBtn.addEventListener('click', async () => {
                if (typeof window.haptic === 'function') window.haptic('medium');
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
                markAppInstalled();
            });
        }

        // --- About modal install button ---
        // Show only if: not standalone AND not already installed AND not remembered as installed
        const aboutInstBtn = document.getElementById('about-install-btn');
        if (aboutInstBtn && !isStandalone && !wasInstalled) {
            aboutInstBtn.classList.remove('hidden');

            aboutInstBtn.addEventListener('click', async () => {
                if (typeof window.haptic === 'function') window.haptic('medium');

                // 1. If we have a deferred prompt, use it directly
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    await deferredPrompt.userChoice;
                    markAppInstalled();
                    return;
                }

                // 2. iOS → show the iOS install instructions banner
                if (isIos) {
                    const iosMsg = document.getElementById('ios-install-message');
                    if (iosMsg) iosMsg.classList.remove('hidden');
                    // Close the about modal so the user can see the banner
                    const aboutModal = document.getElementById('about-modal');
                    if (aboutModal && !aboutModal.classList.contains('pointer-events-none')) {
                        if (typeof window.toggleModal === 'function') {
                            window.toggleModal(aboutModal);
                        }
                    }
                    return;
                }

                // 3. Other browsers → show manual hint toast
                const currentLang = typeof getLangFn === 'function' ? getLangFn() : (localStorage.getItem('language') || 'en');
                if (typeof window.showToast === 'function' && typeof window.t === 'function') {
                    window.showToast(window.t(currentLang, 'installManualHint'));
                }
            });
        }

        // --- iOS auto-banner ---
        if (isIos && !isStandalone) {
            const iosMsg = document.getElementById('ios-install-message');
            if (iosMsg) iosMsg.classList.remove('hidden');
            const closeIos = document.getElementById('close-ios-msg');
            if (closeIos) {
                closeIos.addEventListener('click', () => {
                    if (typeof window.haptic === 'function') window.haptic('light');
                    iosMsg.classList.add('hidden');
                });
            }
        }

        // --- Safety net: hide install buttons on appinstalled / standalone change ---
        window.addEventListener('appinstalled', () => markAppInstalled());

        window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
            if (e.matches) markAppInstalled();
        });
    }

    // Public API exposure
    window.setupInstallListeners = setupInstallListeners;
    window.markAppInstalled = markAppInstalled;
    window.PwaInstall = {
        setup: setupInstallListeners,
        markInstalled: markAppInstalled,
        getDeferredPrompt: () => deferredPrompt
    };
})();

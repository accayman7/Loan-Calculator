# Loan Calculator — Developer Guide & Architecture

Welcome to the **Loan Calculator** codebase. This guide serves as the architectural overview and reference manual for any developer maintaining, extending, or refactoring this project.

---

## 1. High-Level Architecture

- **Zero-Build Vanilla Architecture:** The app has **NO build step** (no Webpack, Vite, Node.js, or bundlers). Everything runs directly in the browser.
- **Offline & Desktop Compatibility:** The app can be launched as a standalone Progressive Web App (PWA) via browser, or locally as a Windows desktop utility using `Launch App.vbs` or `launch.bat` (`start "" "%~dp0index.html"`).
- **CRITICAL CONSTRAINT — No ES Modules:** Because the app is frequently launched via the `file://` protocol from the desktop, modern browser CORS policies block ES Module scripts (`<script type="module">` or `import/export`). All scripts are standard classic scripts (`<script src="...">`) evaluated in global window scope in explicit order.
- **Single Source of Truth for State:** Main application state lives in `AppState` inside `js/app.js` and is passed by reference to specialized modules.

---

## 2. Directory Structure & File Responsibilities

```text
Loan-Calculator/
├── index.html              # Main application markup, layout, and modal structures
├── app.css                 # Custom styles, transitions, print media queries, themes
├── tailwind.css            # Pre-compiled static Tailwind CSS utility classes
├── sw.js                   # Service Worker for offline PWA asset caching
├── xlsx.mini.min.js        # Minimal SheetJS library (lazy-loaded on export demand)
├── launch.bat              # Batch launcher for local desktop execution
├── Launch App.vbs          # Silent VBScript launcher without cmd window
├── DEVELOPMENT.md          # Architecture & developer onboarding guide (this file)
├── STATE_MODEL.md          # Formal documentation of application state & transitions
├── COMPLIANCE.md           # Banking regulation & mathematical compliance notes
└── js/
    ├── version.js          # Single source of truth for APP_VERSION
    ├── translations.js     # Centralized localization strings (EN & AR) + t(lang, key)
    ├── logic.js            # Pure financial math (annuity, reducing balance, stamp tax)
    ├── ui.js               # UI helpers, animations, vector Chart HUD, modals, themes
    ├── dateinput.js        # Masked 3-box date input handler (DD/MM/YYYY)
    ├── datepicker.js       # Native interactive calendar picker modal (RTL & a11y)
    ├── earlysettlement.js  # Early settlement calculations, accrued interest & fees
    ├── selfsufficient.js   # Self-Sufficient mode (CD interest funding new loan/CD)
    ├── export.js           # Print report generation (hidden iframe) & Excel (.xlsx) export
    ├── app.js              # Application orchestrator, event wiring & calculation dispatch
    ├── logic.test.html     # Browser-based test suite for financial math calculations
    ├── logic.test.js       # Mathematical test cases and assertions
    └── ui.test.html        # Browser-based test suite for UI components & number rules
```

---

## 3. Script Loading Sequence (`index.html`)

Scripts must load and execute in this specific order to satisfy dependency chains (all with `defer`):

1. `js/version.js` — Defines `self.APP_VERSION` for cache and UI.
2. `js/translations.js` — Provides global `txt` dictionary and `t(lang, key)` localization function.
3. `js/logic.js` — Pure financial calculation functions (`calculateLoan`, `calculateAmortizationSchedule`, `fmt`, etc.).
4. `js/ui.js` — UI state tools, radial chart rendering, theme switching, `ScrollLock`, toast banners.
5. `js/dateinput.js` — Custom segmented date input logic.
6. `js/datepicker.js` — Pop-up calendar picker widget.
7. `js/collaterals.js` — Multi-collateral cards, CD rows, cashflow warnings & self-covering loan amount.
8. `js/earlysettlement.js` — Module for loan payoff & accrued interest calculations.
9. `js/selfsufficient.js` — Module for Certificate of Deposit (CD) investment optimization.
10. `js/history.js` — LocalStorage persistence, history modal rendering & calculation restore.
11. `js/export.js` — Module for Excel generation and print report rendering.
12. `js/app.js` — Core application bootstrap: initializes state, connects listeners, bridges modules.


---

## 4. Key Architectural Patterns

### 4.1 Localization (`t(lang, key)`)
- All strings are declared in `js/translations.js` under `txt.en` and `txt.ar`.
- Always fetch strings via `t(lang, key)`. It provides automatic fallback to English, and ultimately to the key itself if missing.
- **Western Latin Numerals Policy:** By design and banking requirements, digits must ALWAYS display as Western Arabic numerals `0-9` (never Eastern Arabic `٠-٩`), even in Arabic locale. Always use `fmt()` or `Intl.NumberFormat('ar-EG-u-nu-latn')`.

### 4.2 Module Bridging (`initModule`)
Feature modules (`selfsufficient.js`, `earlysettlement.js`, `export.js`) are decoupled from `app.js` using initialization hooks called from `app.js`:
```javascript
// Example in js/app.js:
if (typeof initExport === 'function') {
    initExport(AppState, dateInputs);
}
```
This keeps internal logic isolated while enabling clean access to the reactive `AppState` and inputs.

### 4.3 Service Worker & Cache Invalidation
- When any script, CSS, or markup file is added or modified:
  1. Add the path to `PRE_CACHE` array in `sw.js`.
  2. Bump `APP_VERSION` in `js/version.js` (e.g., `2.5.8` → `2.5.9`).
  3. When users load the app, the Service Worker detects the version difference and triggers the in-app update banner.

### 4.4 Modal & Accordion Animations
- CSS transitions on `max-height` require explicit pixel heights for smooth animations.
- When opening an accordion: set `maxHeight = element.scrollHeight + 'px'`. Once transitioned, set `maxHeight = 'none'`.
- When closing an accordion: **never** animate from `'none'`. First set `element.style.maxHeight = element.scrollHeight + 'px'`, force reflow (`void element.offsetHeight`), then set `maxHeight = '0px'`.

### 4.5 Developer Facade (`window.LoanCalc`)
For rapid debugging and onboarding in browser DevTools without breaking vanilla desktop execution:
```javascript
// Access state snapshot
LoanCalc.getState();

// Inspect active environment & diagnostics
LoanCalc.diagnostics(); // { version, lang, dir, theme, activeKey, loanType, ... }

// Invoke core calculators directly
LoanCalc.logic.calculateLoan({ amount: 100000, rate: 10, period: 12 }, 'installment', 1);

// Programmatic calculation trigger
LoanCalc.calculate();
```

### 4.6 RTL/LTR Architecture & `!important` Policy
- **Date Inputs Mirroring:** Date inputs (`DD/MM/YYYY`) must maintain Latin character sequence (`direction: ltr`) even when Arabic locale (`dir="rtl"`) is active, but calendar picker icons must mirror to the opposite edge. Specific overrides in `app.css` intentionally use `!important` to supersede Tailwind's physical utility classes (`pr-10`, `left-0`, etc.). **Do not remove these overrides without thoroughly checking Arabic RTL layout.**
- **Writing New Styles:** Always prefer **CSS Logical Properties** (`padding-inline-start`, `margin-inline-end`, `inset-inline-start`) instead of physical directions (`padding-left`, `margin-right`, `left`). This ensures components automatically mirror for RTL without requiring `!important` overrides.
- **Print Styles:** Rules in `js/export.js` and `app.css` under `@media print` legitimately use `!important` to force browser print engines to produce clean, high-contrast, black-and-white documents without background interference.

---

## 5. Testing & Verification

The project includes built-in browser-based test harnesses:
- **`js/logic.test.html`**: Validates loan calculation accuracy, day counts (30/360), reducing balance amortization, quarterly stamp taxes, and rounding rules against expected bank benchmark figures.
- **`js/ui.test.html`**: Validates UI component behaviors, Western numeral formatting, scroll locking, chart rendering, and XSS sanitization.

To run tests:
Simply double-click or open `js/logic.test.html` and `js/ui.test.html` in any modern web browser.


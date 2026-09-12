# Changelog

All notable changes and enhancements implemented in this session are documented below.

---

## [2.3.0] - 2026-09-12

### 1. Regulatory Collateral Lending Limit ($\min(90\% \times \text{Nominal}, \text{Redemption})$)
- **Banking Compliance Formula**: Updated borrowing capacity calculations across both **Secured Loan** and **Self-Sufficient Mode** to adhere to the central banking directive:
  $$\text{Max Loan Limit} = \min(90\% \times \text{Nominal Value}, \text{Redemption Value})$$
- **Dynamic Cap Logic**:
  - If $\text{Redemption} < 90\% \times \text{Nominal}$, the redemption value caps the maximum loan (e.g., Nominal = 1,000,000 EGP, Redemption = 800,000 EGP $\rightarrow$ Max Loan = 800,000 EGP).
  - If $\text{Redemption} \ge 90\% \times \text{Nominal}$, the $90\%$ nominal rule caps the loan (e.g., Nominal = 1,000,000 EGP, Redemption = 950,000 EGP $\rightarrow$ Max Loan = 900,000 EGP).
  - If Redemption is blank or 0, it automatically defaults to $90\% \times \text{Nominal}$.
- **Nominal Coupon Accrual**: Preserved nominal value as the sole base for CD interest accruals ($A \times R / 1200$).
- **Solver & Validation Guardrails**:
  - Updated `solveTdLoan` and `evaluateTdLoanCandidate` in `js/logic.js` to enforce the aggregated collateral limit $\sum \min(0.90 \times \text{Nominal}_i, \text{Redemption}_i)$.
  - Added warning banner in `js/app.js` and detailed error notifications in `js/selfsufficient.js` when loan amounts exceed allowable collateral limits.

---

### 2. Streamlined Collateral Details (Removed Redundant "Months")
- **Eliminated Months Field**: Removed the "Months" input from `#collateral-section` in `index.html`, `js/app.js`, and `js/ui.js` because collateral maturity does not restrict the loan term in standard calculations (certificates renew upon maturity at prevailing market rates).
- **Responsive 12-Column Grid**: Reorganized the table columns across all devices:
  - `#` & Action Button: `col-span-2`
  - Nominal Value: `col-span-4`
  - Redemption Value: `col-span-4`
  - Interest Rate (%): `col-span-2`

---

### 3. Self-Sufficient Mode: Card Layout & Dedicated Field Labels
- **Eliminated Ambiguous "DATES" Row**: Replaced the multi-row table structure with self-contained, beautifully styled cards for each existing certificate ($\text{CD}_1$).
- **Dedicated Label Above Every Field**:
  - **Row 1**:
    - **Nominal Value** (`القيمة الاسمية`) — label directly above the amount input.
    - **Redemption Value** (`القيمة الاستردادية`) — label directly above the redemption input.
    - **Rate %** (`الفائدة %`) — label directly above the interest rate input.
  - **Row 2**:
    - **Next Coupon Date** (`تاريخ الكوبون القادم`) — label directly above the coupon date picker input.
    - **Maturity Date** (`تاريخ الاستحقاق`) — label directly above the maturity date picker input.
- **Integrated Remaining Tenor Badge**: Placed the remaining tenor indicator (`{n} mos left` / `متبقي {n} شهر`) directly beside the Maturity Date label.
- **Card Header**: Displays certificate identifier (`CD₁ #1`, `CD₁ #2`) and dedicated `Clear` or `Remove` action buttons.

---

### 4. Auto-Fill Loan Rate from CD Rates
- **Regulatory Auto-Pricing**: Implemented automatic loan rate derivation in Self-Sufficient mode:
  $$\text{Loan Rate} = \max(\text{CD}_1\text{ rates}) + 2.0\%$$
- **Automatic Sync**: Triggers whenever $\text{CD}_1$ interest rates are entered, updated, removed, or cleared.
- **Manual Override Preservation**: Respects manual edits by the user; clearing the input restores automatic calculation.

---

### 5. Loan Terms Input Field Baseline Alignment
- **Resolved Vertical Misalignment**: Moved the `⚡ Match CD₁: {n} mos` button out of the `Period (months):` label row and positioned it as a dedicated chip directly beneath the input field.
- **Single-Line Alignment**: Ensured both `Loan Rate (%)` and `Period (months)` labels are strictly single-line, achieving **100% horizontal baseline alignment** of input boxes.

---

### 6. Deferred First Installment Date ($M_1$)
- **Prominent Header Display**: Added `#ss-first-inst-date-display` in the Loan Terms card header:
  `First Installment Date: [DD/MM/YYYY] (5th of 2nd month)` / `تاريخ أول قسط: [DD/MM/YYYY] (يوم 5 من الشهر الثاني)`.
- **Calendar Deferral Calculation**: Fixed $M_1$ derivation to strictly compute the 5th day of the second calendar month following the SS Booking Date:
  $$M_1 = \text{Date}(\text{Year}, \text{Month} + 2, 5)$$
  ensuring consistent accrual and cash-flow timing.

---

### 7. Auto-Fill $\text{CD}_1$ to Main Collateral Details Table
- **Automated Collateral Transfer**: Calculating Self-Sufficient mode now automatically synchronizes all active $\text{CD}_1$ entries into the main calculator's **Collateral Details** table.
- **Exclusion of $\text{CD}_2$**: Newly created certificates ($\text{CD}_2$) are excluded from the main pledged collateral table to prevent false `warningBelowMinRate` alerts ("Loan rate is below minimum required (+2%)").

---

### 8. Full Bilingual Localization (English & Arabic)
- Added and aligned all translation keys across `js/ui.js` for:
  - `collateralNominalLabel`, `collateralRedemptionLabel`, `collateralRateLabel`
  - `nextCouponDateLabel`, `maturityDateLabel`, `datesLabel`
  - `firstInstDateLabel`, `deferredM1Note`
  - `matchCd1TenorBtn`, `advisoryMaturityExceeded`, `reassuranceMaturityMatched`
  - `ssErrorExceeds90Collateral`

---

### 9. Verification & Quality Assurance
- **Automated Regression Suite**: Executed 188 test cases in Microsoft Edge headless environment (`js/logic.test.html`):
  - **Total Tests**: 188
  - **Passed**: 188
  - **Failed**: 0
- **Live DOM Verification**: Verified DOM generation for labeled card components and responsive layout integrity.

# Loan Calculator — Compliance Statement

**Version:** 2.0.0  
**Document Date:** 2026-08-29  
**Application Type:** Progressive Web Application (PWA)

---

## 1. Overview

Loan Calculator is a **fully offline, local-only financial calculator** designed for accurate loan calculations, amortization schedules, early settlement projections, secured/unsecured loan evaluations, and self-sufficient certificate-backed loan strategies. This application operates entirely on the user's device without any external data transmission.

---

## 2. Data Handling Statement

### 2.1 No Data Transmission

All calculations are performed **locally on the user's device**. This application:

- ❌ Does **not** send any data to external servers
- ❌ Does **not** use third-party APIs
- ❌ Does **not** include analytics or tracking
- ❌ Does **not** require authentication or user accounts
- ❌ Does **not** connect to any cloud services

### 2.2 No External Network Dependencies

The application includes no external dependencies that require network access:

- ❌ No CDN-hosted libraries
- ❌ No remote fonts
- ❌ No external stylesheets
- ❌ No third-party scripts

All assets are self-contained and cached locally.

---

## 3. Local Storage

The application uses browser-native local storage **only** for:

| Data | Purpose | Retention |
|------|---------|-----------|
| Language preference | UI language (EN/AR) | Until cleared |
| Theme preference | Light/Dark/System mode | Until cleared |
| Calculation history | User-saved calculations | Until cleared |

**All data remains exclusively on the device.** No synchronization or backup occurs.

Users can clear all stored data at any time via:
- Browser settings → Clear site data
- Application → Storage → Clear Data

---

## 4. Service Worker & Offline Capability

A service worker enables full offline functionality:

- **Cache-first strategy**: Ensures instant load after install
- **Local-only enforcement**: External domain requests are blocked
- **Automatic updates**: New versions are fetched when online

### 4.1 External Request Blocking

The service worker is configured to **reject all requests** to domains other than the application origin. Any attempt to fetch external resources will return:

```
403 Forbidden - Local Only Mode
```

This architectural decision ensures no data can leak to external servers, even if future code modifications accidentally introduce external calls.

---

## 5. Financial Calculation Transparency & Regulatory Alignment

To ensure user trust and regulatory alignment regarding financial product understanding and consumer protection:

### 5.1 Explicit Assumptions Panel
The application includes a permanent "**Calculation Assumptions**" panel that explicitly states the underlying logic used for interest and fees:
- **Interest Method:** Reducing Balance (Annuity)
- **Day Count:** 30/360 Convention (US/NASD)
- **Rounding:** 2 decimal places per installment
- **Stamp Duty:** Quarterly calculation logic on highest quarterly balance
- **Fees:** Deducted upfront treatment
- **Frequencies:** Monthly and Quarterly installment schedules

### 5.2 "Explain This Number" Tooltips
Complex financial outputs include interactive tooltips (ℹ) that provide immediate, plain-language explanations of the derivation:
- **Effective Flat Rate:** Explains the conversion from reducing rate
- **First Installment:** Clarifies specific interest calculation for broken periods
- **Total Stamp:** Details the quarterly calculation basis
- **Net Benefit:** Explains the gain comparison vs simple certificate holding

These features ensure users are not presented with "black box" numbers, supporting **Consumer Duty** and **Fair Treatment of Customers** principles.

### 5.3 Secured vs. Unsecured Loan Compliance & Safeguards
The calculator distinguishes between **Unsecured** and **Secured** loan products with clear regulatory safeguards:
- **Loan-to-Value (LTV) Cap (90%):** In secured mode, the system dynamically calculates the 90% collateral ceiling and issues real-time visual warnings if the requested loan amount exceeds 90% of total pledged collateral.
- **Minimum Rate Spread Margin (+2.0%):** In secured mode, the calculator verifies that the loan rate is at least 2.0% higher than the highest pledged collateral rate, issuing a clear warning if the rate is below regulatory and bank guidelines.
- **Multi-Collateral Aggregation:** Supports multiple Certificates of Deposit (CDs), aggregating principal amounts and computing weighted average collateral yields with full breakdown visibility.
- **Unsecured Frequency Locking:** Unsecured loans automatically lock payment frequency to Monthly (`1`), reflecting standard retail banking policies.

### 5.4 Self-Sufficient Multi-CD₁ TD Solver
The Self-Sufficient calculator provides a transparent **CD-Backed Self-Funding Strategy** analysis:
- **Multi-CD₁ Cash Flow Engine:** Evaluates multiple existing CD₁s, each with its own principal, rate, and next interest date.
- **Solver Transparency:** Uses an iterative search algorithm (`solveTdLoan`) to solve for the maximum gross loan where combined CD interest covers every installment.
- **Upfront Fee & Buffer Deductions:** Net loan is floored to the nearest 1,000 EGP after accounting for admin fees and broken-period first installment interest shortfall buffers.
- **Comparison Metrics:** Effective Earning Rate and Net Benefit are explicitly calculated and contrasted with the simple non-leveraged alternative.

### 5.5 Calculation Fingerprint
Each calculation generates a unique, deterministic **Calculation ID** (e.g., `v2.0-8XK29A`) based on:
- **Inputs**: Loan Amount, Rate, Period, Start Date, Collaterals, Frequency
- **App Version**: Ensures recalculations on updated versions generate new IDs

This provides:
- **Auditability**: Same inputs always produce the same fingerprint
- **Verifiability**: Users/auditors can confirm calculation consistency
- **Traceability**: Fingerprint changes if any input or calculation logic changes

---

## 6. Audit Readiness

This application is designed to satisfy common compliance requirements:

| Requirement | Status |
|-------------|--------|
| GDPR data transfer | ✅ Not applicable (no transfer) |
| Data residency | ✅ Device-only storage |
| Third-party processors | ✅ None |
| Data breach exposure | ✅ Minimal (local-only) |
| Network logging | ✅ None (no network calls) |
| Calculation Transparency | ✅ Explicit assumptions & tooltips |
| Regulatory Safeguards | ✅ 90% LTV & +2% rate spread warnings |
| Automated Test Suite | ✅ 139 / 139 passing unit test assertions |

---

## 7. Deployment Options

This application can be deployed via:

- **Web hosting**: Standard HTTPS deployment
- **Offline distribution**: ZIP file for sideloading
- **Enterprise MDM**: Pre-installed on managed devices

No server-side components or databases are required.

---

## 8. Contact

For compliance inquiries or audits, contact:

**Developer:** Ayman Alsebaey  
**Email:** ayman.alsebaey7@gmail.com  
**Telegram:** @accayman7

---

*This document serves as a compliance attestation for enterprise and regulatory review.*

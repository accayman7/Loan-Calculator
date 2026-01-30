# Loan Calculator Pro — Compliance Statement

**Version:** 1.12.16 
**Document Date:** 2026-01-29  
**Application Type:** Progressive Web Application (PWA)

---

## 1. Overview

Loan Calculator Pro is a **fully offline, local-only financial calculator** designed for accurate loan calculations, amortization schedules, and early settlement projections. This application operates entirely on the user's device without any external data transmission.

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

## 5. Financial Calculation Transparency

To ensure user trust and regulatory alignment regarding financial product understanding:

### 5.1 Explicit Assumptions Panel
The application now includes a permanent "**Calculation Assumptions**" panel that explicitly states the underlying logic used for interest and fees:
- **Interest Method:** Reducing Balance (Annuity)
- **Day Count:** 30/360 Convention (US/NASD)
- **Rounding:** 2 decimal places per installment
- **Stamp Duty:** Quarterly calculation logic
- **Fees:** Deducted upfront treatment

### 5.2 "Explain This Number" Tooltips
Complex financial outputs include interactive tooltips (ℹ) that provide immediate, plain-language explanations of the derivation:
- **Effective Flat Rate:** Explains the conversion from reducing rate
- **First Installment:** Clarifies specific interest calculation for broken periods
- **Total Stamp:** details the quarterly calculation basis

These features ensure users are not presented with "black box" numbers, supporting **Consumer Duty** and **Fair Treatment of Customers** principles.

### 5.3 Calculation Fingerprint
Each calculation generates a unique, deterministic **Calculation ID** (e.g., `v1.9-8XK29A`) based on:
- **Inputs**: Loan Amount, Rate, Period, Start Date
- **App Version**: Ensures recalculations on updated versions generate new IDs

This provides:
- **Auditability**: Same inputs always produce the same fingerprint
- **Verifiability**: Users/auditors can confirm calculation consistency
- **Traceability**: Fingerprint changes if any input or calculation logic changes

---

## 5. Audit Readiness

This application is designed to satisfy common compliance requirements:

| Requirement | Status |
|-------------|--------|
| GDPR data transfer | ✅ Not applicable (no transfer) |
| Data residency | ✅ Device-only storage |
| Third-party processors | ✅ None |
| Data breach exposure | ✅ Minimal (local-only) |
| Network logging | ✅ None (no network calls) |
| Calculation Transparency | ✅ Explicit assumptions & tooltips |

---

## 6. Deployment Options

This application can be deployed via:

- **Web hosting**: Standard HTTPS deployment
- **Offline distribution**: ZIP file for sideloading
- **Enterprise MDM**: Pre-installed on managed devices

No server-side components or databases are required.

---

## 7. Contact

For compliance inquiries or audits, contact:

**Developer:** Ayman Alsebaey  
**Email:** ayman.alsebaey7@gmail.com  
**Telegram:** @accayman7

---

*This document serves as a compliance attestation for enterprise and regulatory review.*

// js/logic.js - Core calculation logic
// Fixed: Precision rounding for First Installment & Remaining Balance

const MAX_MONTHS = 600;

// --- Integer Math Constants ---
// Work in piastres (1/100 currency) internally to avoid floating-point errors
const PIASTRES = 100;

// --- Utilities ---

/**
 * Round to 2 decimal places (Standard Rounding: 0.5 goes up)
 * @param {number} num 
 * @returns {number}
 */
function round2(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Convert currency amount to piastres (integer)
 * @param {number} amount - Currency amount (e.g., 1000.50)
 * @returns {number} Integer piastres (e.g., 100050)
 */
function toPiastres(amount) {
    return Math.round(amount * PIASTRES);
}

/**
 * Convert piastres back to currency amount
 * @param {number} piastres - Integer piastres (e.g., 100050)
 * @returns {number} Currency amount (e.g., 1000.50)
 */
function toCurrency(piastres) {
    return piastres / PIASTRES;
}

/**
 * Round to nearest integer (for piastres calculations)
 * @param {number} value 
 * @returns {number}
 */
function roundInt(value) {
    return Math.round(value);
}

/**
 * Convert formatted strings to numbers, falling back to 0
 * @param {string|number} v 
 * @returns {number}
 */
function toNum(v) {
    const n = safeParseFloat(v);
    return isNaN(n) ? 0 : n;
}

// Format numbers for display
function fmt(n) {
    if (!isFinite(n)) return '0.00';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Safe float parsing
function safeParseFloat(v) {
    const clean = String(v).replace(/,/g, '');
    const n = parseFloat(clean);
    return isNaN(n) ? NaN : n;
}

// Days360 calculation (US/NASD method 30/360)
function days360(d1, d2) {
    let d1y = d1.getFullYear();
    let d1m = d1.getMonth();
    let d1d = d1.getDate();
    let d2y = d2.getFullYear();
    let d2m = d2.getMonth();
    let d2d = d2.getDate();

    if (d1d === 31) d1d = 30;
    if (d2d === 31 && d1d === 30) d2d = 30;

    return (d2y - d1y) * 360 + (d2m - d1m) * 30 + (d2d - d1d);
}

// Format Date Object to String DD/MM/YYYY
function getFormattedDate(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    const d = dateObj.getDate().toString().padStart(2, '0');
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
}

// Get the quarter key for a date (e.g., "2026-Q1")
function getQuarterKey(date) {
    const m = date.getMonth(); // 0-indexed
    const y = date.getFullYear();
    if (m <= 2) return `${y}-Q1`;
    if (m <= 5) return `${y}-Q2`;
    if (m <= 8) return `${y}-Q3`;
    return `${y}-Q4`;
}

// Get the quarter-end date for the quarter containing a given date
function getQuarterEndDate(date) {
    const m = date.getMonth(); // 0-indexed
    const y = date.getFullYear();
    // Q1: March 31, Q2: June 30, Q3: September 30, Q4: December 31
    if (m <= 2) return new Date(y, 2, 31);  // March 31
    if (m <= 5) return new Date(y, 5, 30);  // June 30
    if (m <= 8) return new Date(y, 8, 30);  // September 30
    return new Date(y, 11, 31);              // December 31
}

/**
 * Get the next quarterly installment date
 * The first installment is always on the 5th of the fourth month after the booking date.
 *
 * Examples:
 *   Booking 15-01-2026 → 05-05-2026 (May 5)
 *   Booking 26-02-2026 → 05-06-2026 (June 5)
 *
 * @param {Date} bookingDate
 * @returns {Date} Next quarterly installment date
 */
function getNextQuarterlyDate(bookingDate) {
    const day = 5; // fixed day
    return new Date(bookingDate.getFullYear(), bookingDate.getMonth() + 4, day);
}

/**
 * Count how many monthly CD interest payments fall on or before m1Date,
 * starting from firstAccrualDate and stepping one calendar month at a time.
 * Each payment equals exactly one month of interest regardless of actual days.
 *
 * @param {Date} firstAccrualDate - First scheduled interest payment date
 * @param {Date} m1Date           - First loan installment date
 * @returns {number} Number of payments (0, 1, or 2 in practice)
 */
function countCdPaymentsBeforeM1(firstAccrualDate, m1Date) {
    if (!firstAccrualDate || !m1Date) return 0;
    let count = 0;
    let d = new Date(firstAccrualDate);
    // Use numeric comparison to avoid timezone edge cases
    const m1Num = m1Date.getFullYear() * 10000 + (m1Date.getMonth() + 1) * 100 + m1Date.getDate();
    while (true) {
        const dNum = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
        if (dNum > m1Num) break;
        count++;
        // Advance exactly one calendar month
        d = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
    return count;
}

// Check if a quarter-end falls within a date range (exclusive start, inclusive end)
function quarterEndInRange(startDate, endDate) {
    const quarterEnd = getQuarterEndDate(endDate);
    // Quarter-end is in range if it's after startDate and on or before endDate
    return quarterEnd > startDate && quarterEnd <= endDate;
}

/**
 * Fallback solver using Bisection Method
 */
function solveRateBisection(P, N, M) {
    let low = 0.00001;
    let high = 1.0;
    let epsilon = 0.0000001;
    let i = 0;

    for (let check = 0; check < 10; check++) {
        let calcP_High = (M / high) * (1 - Math.pow(1 + high, -N));
        if (calcP_High < P) break;
        high *= 2;
    }

    for (let k = 0; k < 100; k++) {
        i = (low + high) / 2;
        if (i <= 0.0000001) i = 0.0000001;

        let calcP = (M / i) * (1 - Math.pow(1 + i, -N));

        if (Math.abs(calcP - P) < epsilon) {
            return i * 1200;
        }

        if (calcP > P) {
            low = i;
        } else {
            high = i;
        }
    }
    return i * 1200;
}

/**
 * Core loan calculation - solves for one unknown variable
 * @param {Object} inputs - Input values {amount, rate, period, installment}
 * @param {string} activeKey - Which field to calculate ('amount'|'rate'|'period'|'installment')
 * @param {number} [freq=1] - Installment frequency in months (1=monthly, 3=quarterly)
 * @returns {Object} Result with {valid, P, R, N, M}
 */
function calculateLoan(inputs, activeKey, freq) {
    if (!freq || freq < 1) freq = 1;
    const P = safeParseFloat(inputs.amount);
    const R = safeParseFloat(inputs.rate);
    let N = parseInt(inputs.period);
    const M = safeParseFloat(inputs.installment);

    let resP = P, resR = R, resN = N, resM = M, valid = false;

    try {
        if (activeKey !== 'period' && (isNaN(N) || N > MAX_MONTHS)) {
            return { valid: false };
        }

        if (activeKey === 'installment') {
            if (P > 0 && R >= 0 && N > 0) {
                const i = R / 100 * (freq / 12);
                resM = i === 0 ? P / N : P * i * Math.pow(1 + i, N) / (Math.pow(1 + i, N) - 1);
                valid = true;
            }
        }
        else if (activeKey === 'amount') {
            if (M > 0 && R >= 0 && N > 0) {
                const i = R / 100 * (freq / 12);
                resP = i === 0 ? M * N : M * (Math.pow(1 + i, N) - 1) / (i * Math.pow(1 + i, N));
                valid = true;
            }
        }
        else if (activeKey === 'period') {
            if (P > 0 && M > 0 && R >= 0) {
                const i = R / 100 * (freq / 12);
                // Handle 0% rate case: simple division instead of log formula
                if (i === 0) {
                    resN = Math.ceil((P / M) - 0.001);
                    if (resN <= 0) resN = 1;
                    if (resN <= MAX_MONTHS) valid = true;
                } else if (M > P * i) {
                    let exactN = Math.log(M / (M - P * i)) / Math.log(1 + i);
                    resN = Math.ceil(exactN - 0.001);
                    if (resN <= 0) resN = 1;
                    if (resN <= MAX_MONTHS) valid = true;
                    else valid = false;
                }
            }
        }
        else if (activeKey === 'rate') {
            if (P > 0 && M > 0 && N > 0 && M * N >= P) {
                // Handle 0% rate case: total payments exactly equals principal
                if (M * N === P) {
                    resR = 0;
                    resM = M; // Installment stays as entered
                    valid = true;
                } else {
                    // M * N > P: use Newton-Raphson solver
                    let i = 0.01;
                    let converged = false;
                    for (let j = 0; j < 20; j++) {
                        if (i <= 0.0000001) i = 0.0000001;
                        let f = M * (1 - Math.pow(1 + i, -N)) / i - P;
                        let df = (M / i) * (N * Math.pow(1 + i, -N - 1) / (1 + i) - (1 - Math.pow(1 + i, -N)) / i);
                        if (!isFinite(f) || !isFinite(df) || df === 0) break;
                        let newI = i - f / df;
                        if (Math.abs(newI - i) < 0.0000001) {
                            i = newI;
                            converged = true;
                            break;
                        }
                        i = newI;
                    }
                    resR = i * 1200;
                    if (!converged || !isFinite(resR) || resR <= 0) {
                        resR = solveRateBisection(P, N, M);
                    }

                    // Re-derive installment from the calculated rate for schedule consistency
                    // This ensures the schedule uses values that are mathematically consistent
                    // with the derived rate, eliminating rounding discrepancies
                    const derivedI = resR / 100 * (freq / 12);
                    if (derivedI > 0) {
                        resM = round2(P * derivedI * Math.pow(1 + derivedI, N) / (Math.pow(1 + derivedI, N) - 1));
                    }

                    valid = true;
                }
            }
        }
    } catch (e) {
        console.error("Calculation Error", e);
    }

    if (!isFinite(resP) || !isFinite(resR) || !isFinite(resN) || !isFinite(resM) || resN > MAX_MONTHS) valid = false;

    return { valid, P: resP, R: resR, N: resN, M: resM };
}

/**
 * Generates amortization schedule with optional stamp duty calculation
 * Uses INTEGER MATH internally (piastres) for precision
 * @param {Object} loanData - Loan parameters {P, R, N, M}
 * @param {Object} dates - Date configuration {bookingDate, m1_Date, isAdvanced}
 * @param {number} [stampRate=0] - Quarterly stamp rate percentage
 * @param {number} [freq=1] - Installment frequency in months (1=monthly, 3=quarterly)
 * @returns {Object} Schedule data with {schedule[], totalActualInterest, m1_Payment, totalStamp}
 */
function generateSchedule(loanData, dates, stampRate = 0, freq = 1) {
    if (!freq || freq < 1) freq = 1;
    let { P, R, N, M } = loanData;
    let { bookingDate, m1_Date, isAdvanced } = dates;

    let schedule = [];
    let iRate = R / 100 * (freq / 12);  // Periodic rate (monthly or quarterly)

    // === CONVERT TO INTEGER (PIASTRES) ===
    // All monetary values work in piastres (1/100 currency) to avoid float errors
    let balInt = toPiastres(P);
    let MInt = toPiastres(round2(M));  // Force 2 decimals first, then to piastres

    // Standard interest and principal in piastres
    let standardMonthlyInterestInt = roundInt(balInt * iRate);
    let standardPrincipalInt = MInt - standardMonthlyInterestInt;

    // First month calculations
    let m1_InterestInt = 0;
    let m1_PaymentInt = 0;

    if (isAdvanced) {
        const daysDiff = days360(bookingDate, m1_Date);
        // First month interest: P * (R/100) * (days/360) - all in piastres
        m1_InterestInt = roundInt(balInt * (R / 100) * (daysDiff / 360));
        m1_PaymentInt = standardPrincipalInt + m1_InterestInt;
    } else {
        m1_InterestInt = standardMonthlyInterestInt;
        m1_PaymentInt = MInt;
    }

    let totalActualInterestInt = 0;
    let totalStampInt = 0;

    // Track highest principal per quarter for stamp calculation (in piastres)
    let quarterHighestPrincipalInt = {};
    let processedQuarters = new Set();

    for (let m = 1; m <= N; m++) {
        let inteInt, prinInt, currentDate;
        let openingBalInt = balInt;

        if (m === 1) {
            inteInt = m1_InterestInt;
            prinInt = standardPrincipalInt;
            if (openingBalInt < prinInt) prinInt = openingBalInt;
            currentDate = m1_Date;
        } else {
            // Monthly interest in piastres
            inteInt = roundInt(openingBalInt * iRate);

            // Monthly principal in piastres
            prinInt = MInt - inteInt;

            if (openingBalInt < prinInt || m === N) {
                prinInt = openingBalInt;
            }

            let d = new Date(m1_Date);
            d.setMonth(m1_Date.getMonth() + (m - 1) * freq);
            if (d.getDate() !== m1_Date.getDate()) { d.setDate(0); }
            currentDate = d;
        }

        // Update balance (integer subtraction - no float errors!)
        balInt = balInt - prinInt;

        totalActualInterestInt += inteInt;

        // --- Stamp Calculation Logic (in piastres) ---
        let stampChargeInt = 0;
        let hasStamp = false;

        if (stampRate > 0) {
            const currentQuarter = getQuarterKey(currentDate);

            // Track highest principal for current quarter
            if (!quarterHighestPrincipalInt[currentQuarter] || openingBalInt > quarterHighestPrincipalInt[currentQuarter]) {
                quarterHighestPrincipalInt[currentQuarter] = openingBalInt;
            }

            // Determine previous date (booking date for m=1, previous installment date otherwise)
            const prevDate = m === 1 ? bookingDate : schedule[m - 2].rawDate;

            // Check if a quarter-end falls within this installment period
            const prevQuarter = getQuarterKey(prevDate);
            const quarterEnd = getQuarterEndDate(prevDate);

            // If the previous period's quarter-end is on or before current date, and we haven't processed it
            if (!processedQuarters.has(prevQuarter) && quarterEnd <= currentDate) {
                // Calculate stamp based on highest principal in that quarter
                const highestPrincipalInt = quarterHighestPrincipalInt[prevQuarter] || openingBalInt;
                stampChargeInt = roundInt(highestPrincipalInt * (stampRate / 100) / 4);
                totalStampInt += stampChargeInt;
                hasStamp = true;
                processedQuarters.add(prevQuarter);
            }
        }

        // === CONVERT BACK TO CURRENCY FOR OUTPUT ===
        schedule.push({
            m,
            rawDate: currentDate,
            bal: toCurrency(openingBalInt),
            int: toCurrency(inteInt),
            prin: toCurrency(prinInt),
            rem: toCurrency(balInt),
            stamp: toCurrency(stampChargeInt),
            hasStamp: hasStamp
        });

        if (balInt <= 0) break;
    }

    return {
        schedule,
        totalActualInterest: toCurrency(totalActualInterestInt),
        m1_Payment: toCurrency(m1_PaymentInt),
        totalStamp: toCurrency(totalStampInt)
    };
}

/**
 * Calculates early settlement amounts including fees and accrued interest
 * Uses INTEGER MATH internally (piastres) for precision
 * @param {Array} schedule - Amortization schedule array
 * @param {Date} settlementDate - Date of early settlement
 * @param {number} feePercentage - Early settlement fee percentage
 * @param {number} annualRate - Annual interest rate
 * @param {number} [stampRate=0] - Quarterly stamp rate percentage
 * @returns {Object} Settlement breakdown with totals
 */
function calculateEarlySettlement(schedule, settlementDate, feePercentage, annualRate, stampRate = 0) {
    if (!schedule || schedule.length === 0 || !settlementDate) {
        return { valid: false };
    }

    const toDateNum = (d) => {
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    };

    const settlementNum = toDateNum(settlementDate);
    let lastPaidIndex = -1;

    for (let i = 0; i < schedule.length; i++) {
        if (toDateNum(schedule[i].rawDate) <= settlementNum) {
            lastPaidIndex = i;
        } else {
            break;
        }
    }

    let principalBalance, lastPaidDate, nextInstallmentDate, nextInstallmentInterest;

    if (lastPaidIndex === -1) {
        principalBalance = schedule[0].bal;
        lastPaidDate = null;
        nextInstallmentDate = schedule[0].rawDate;
        nextInstallmentInterest = schedule[0].int;
    } else if (lastPaidIndex === schedule.length - 1) {
        return { valid: true, principalBalance: 0, fee: 0, accruedInterest: 0, settlementStamp: 0, totalSettlement: 0, daysElapsed: 0, lastPaidInstallment: lastPaidIndex + 1, message: 'Loan fully paid' };
    } else {
        principalBalance = schedule[lastPaidIndex].rem;
        lastPaidDate = schedule[lastPaidIndex].rawDate;
        nextInstallmentDate = schedule[lastPaidIndex + 1].rawDate;
        nextInstallmentInterest = schedule[lastPaidIndex + 1].int;
    }

    // === CONVERT TO INTEGER (PIASTRES) ===
    let principalBalanceInt = toPiastres(principalBalance);
    let nextInstallmentInterestInt = toPiastres(nextInstallmentInterest);

    // Fee calculation in piastres
    let feeInt = roundInt(principalBalanceInt * (feePercentage / 100));
    let accruedInterestInt = 0;
    let daysElapsed = 0;

    if (lastPaidDate) {
        daysElapsed = days360(lastPaidDate, settlementDate);
        const daysInPeriod = days360(lastPaidDate, nextInstallmentDate);
        if (daysInPeriod > 0 && daysElapsed > 0) {
            accruedInterestInt = roundInt((nextInstallmentInterestInt / daysInPeriod) * daysElapsed);
        }
    } else {
        const dailyRate = annualRate / 100 / 360;
        daysElapsed = days360(new Date(settlementDate.getFullYear(), settlementDate.getMonth(), 1), settlementDate);
        accruedInterestInt = roundInt(principalBalanceInt * dailyRate * Math.max(0, daysElapsed));
    }

    // Calculate settlement stamp (quarter's stamp based on HIGHEST principal in the quarter)
    let settlementStampInt = 0;
    if (stampRate > 0 && principalBalanceInt > 0) {
        // Determine the quarter of the settlement date
        const settlementQuarter = getQuarterKey(settlementDate);

        // Find the highest principal balance in that quarter from the schedule (in piastres)
        let highestPrincipalInQuarterInt = principalBalanceInt; // Default to current

        for (let i = 0; i < schedule.length; i++) {
            const entryQuarter = getQuarterKey(schedule[i].rawDate);
            if (entryQuarter === settlementQuarter) {
                const entryBalInt = toPiastres(schedule[i].bal);
                if (entryBalInt > highestPrincipalInQuarterInt) {
                    highestPrincipalInQuarterInt = entryBalInt;
                }
            }
        }

        // Also include the opening balance of the loan if it's in the same quarter
        if (schedule.length > 0 && getQuarterKey(schedule[0].rawDate) === settlementQuarter) {
            const firstBalInt = toPiastres(schedule[0].bal);
            if (firstBalInt > highestPrincipalInQuarterInt) {
                highestPrincipalInQuarterInt = firstBalInt;
            }
        }

        settlementStampInt = roundInt(highestPrincipalInQuarterInt * (stampRate / 100) / 4);
    }

    // Total settlement in piastres (integer addition - no float errors!)
    const totalSettlementInt = principalBalanceInt + feeInt + accruedInterestInt + settlementStampInt;

    // === CONVERT BACK TO CURRENCY FOR OUTPUT ===
    return {
        valid: true,
        principalBalance: toCurrency(principalBalanceInt),
        fee: toCurrency(feeInt),
        accruedInterest: toCurrency(accruedInterestInt),
        settlementStamp: toCurrency(settlementStampInt),
        totalSettlement: toCurrency(totalSettlementInt),
        daysElapsed: daysElapsed,
        lastPaidInstallment: lastPaidIndex + 1,
        lastPaidDate: lastPaidDate,
        nextInstallmentDate: nextInstallmentDate,
        remainingInstallments: schedule.length - (lastPaidIndex + 1)
    };
}

/**
 * Solves for the loan amount (TD₂) in the self-sufficient TD doubling strategy.
 *
 * Strategy: Client has TD₁, takes a loan against it. Loan proceeds minus admin
 * fees become TD₂. Both TDs earn monthly interest which must fully cover the
 * loan installment AND quarterly stamp duty — the customer pays nothing.
 *
 * Key constraints:
 *   - totalTdInterest ≥ totalLoanCost (installments + stamp over the full term)
 *   - TD₂ = floor(grossLoan × feeFactor / 1000) × 1000 (rounded DOWN, no fractions)
 *   - Admin fees can have fractions (e.g., 5808.08), but TD amounts cannot
 *
 * Algorithm:
 *   1. Analytic formula gives initial gross loan estimate (ignoring stamp)
 *   2. Derive td2 from grossLoan with proper fractional admin fees
 *   3. Iterate td2 downward (in 1000 steps) until total TD interest covers
 *      total loan cost including quarterly stamp duty
 *
 * @param {number} td1 - Original Term Deposit amount
 * @param {number} tdRate - TD₁ annual interest rate (%)
 * @param {number} loanRate - Loan annual interest rate (%)
 * @param {number} N - Loan period in months
 * @param {Object} dates - {bookingDate, m1_Date, isAdvanced}
 * @param {number} stampRate - Quarterly stamp rate (%)
 * @param {number} adminFees - Admin fees percentage (%)
 * @param {number} [td2Rate] - TD₂ annual interest rate (%), defaults to tdRate
 * @returns {Object} Solution with {valid, grossLoan, td2, monthlyTdInterest, totalTdInterest,
 *                    totalLoanCost, totalTdsAtEnd, simpleInterestAlt, netBenefit, adminFeesAmount, ...}
 */
/**
 * @param {Date|null} [cd1AccrualDate] - Next CD₁ interest payment date (used for accurate buffer)
 * @param {Date|null} [cd2AccrualDate] - First CD₂ interest payment date (used for accurate buffer)
 */
function solveTdLoan(td1, tdRate, loanRate, N, dates, stampRate, adminFees, td2Rate, freq, cd1AccrualDate, cd2AccrualDate) {
    if (!freq || freq < 1) freq = 1;
    // Default td2Rate to tdRate if not provided
    if (td2Rate === undefined || td2Rate === null || isNaN(td2Rate)) td2Rate = tdRate;
    if (td1 <= 0 || tdRate <= 0 || loanRate <= 0 || N <= 0 || td2Rate <= 0) {
        return { valid: false };
    }

    const monthlyTd1Rate = tdRate / 1200;
    const monthlyTd2Rate = td2Rate / 1200;
    const feeFactor = 1 - (adminFees / 100); // Net factor: e.g., 0.99 for 1% fees
    const i = loanRate / 100 * (freq / 12);  // Periodic loan rate

    // Annuity factor: installment = grossLoan × annuityFactor
    const annuityFactor = i * Math.pow(1 + i, N) / (Math.pow(1 + i, N) - 1);

    // --- Step 1: Analytic estimate (ignoring stamp) ---
    // Constraint: td1×r1/1200 + grossLoan×feeFactor×r2/1200 = grossLoan × annuityFactor
    // Rearranging: grossLoan = (td1 × r1/1200) / (annuityFactor - feeFactor × r2/1200)
    const denominator = annuityFactor - feeFactor * monthlyTd2Rate;
    if (denominator <= 0) {
        return { valid: false };
    }

    const grossLoanEst = (td1 * monthlyTd1Rate) / denominator;
    if (!isFinite(grossLoanEst) || grossLoanEst <= 0) {
        return { valid: false };
    }

    // --- Step 2: Derive initial td2 with proper fractional admin fees ---
    // Admin fees produce a fractional net loan (e.g., 580808 × 0.99 = 574999.92)
    // TD amounts cannot have fractions, so floor to nearest 1000
    const netLoanEst = grossLoanEst * feeFactor;
    let td2 = Math.floor(netLoanEst / 1000) * 1000;

    if (td2 <= 0) {
        return { valid: false };
    }

    // --- Step 3: Iterate td2 downward until conditions are met ---
    // Approach B: for each candidate grossLoan, hold back buffer = (m1_Payment - M)
    // from the net loan proceeds. The remaining net goes into TD₂ (effectiveTd2).
    // Month 1: client uses TD interest + buffer to pay the larger first installment.
    // Months 2-N: client uses TD interest alone (positive surplus guaranteed).
    //
    // Acceptance:
    //   1. periodicTdInterest(effectiveTd2) >= M   — monthly surplus positive
    //   2. totalTdIncome + buffer >= totalLoanCost  — full term coverage
    for (; td2 >= 1000; td2 -= 1000) {
        // Derive grossLoan from td2 (same as original algorithm)
        const grossLoan = feeFactor > 0 ? Math.ceil(td2 / feeFactor) : td2;
        const netLoan = grossLoan * feeFactor;
        if (Math.floor(netLoan / 1000) * 1000 < td2) continue;

        const loanCalc = calculateLoan({ amount: String(grossLoan), rate: String(loanRate), period: String(N) }, 'installment', freq);
        if (!loanCalc.valid) continue;

        // Run full amortization schedule for buffer and stamp calculation
        const sched = generateSchedule(
            { P: grossLoan, R: loanRate, N: N, M: loanCalc.M },
            dates, stampRate, freq
        );

        // --- Two-pass buffer calculation ---
        // Pass 1: estimate effectiveTd2 with the old simple upper-bound buffer
        //         so we can calculate how much CD₂ interest arrives before m1.
        const oldBuffer = Math.max(0, round2(sched.m1_Payment - loanCalc.M));
        const initEffectiveTd2 = Math.floor((netLoan - oldBuffer) / 1000) * 1000;

        // Pass 2: count actual CD interest payments received before the first installment
        const cd1Payments = countCdPaymentsBeforeM1(cd1AccrualDate, dates.m1_Date);
        const cd2Payments = countCdPaymentsBeforeM1(cd2AccrualDate, dates.m1_Date);
        const cd1InterestBefore = td1 * monthlyTd1Rate * cd1Payments;
        const cd2InterestBefore = initEffectiveTd2 > 0 ? initEffectiveTd2 * monthlyTd2Rate * cd2Payments : 0;
        const availableCdInterest = round2(cd1InterestBefore + cd2InterestBefore);

        // Accurate buffer: how much extra must be held back from loan proceeds
        // after subtracting the CD interest already collected before m1.
        const buffer = Math.max(0, round2(sched.m1_Payment - availableCdInterest));

        // Effective TD₂: net loan minus the buffer reserve (rounded down to nearest 1000)
        const effectiveTd2 = Math.floor((netLoan - buffer) / 1000) * 1000;
        if (effectiveTd2 <= 0) continue;

        // TD interest computed with effectiveTd2 (actual amount deposited into TD₂)
        const periodicTdInterest = ((td1 * monthlyTd1Rate) + (effectiveTd2 * monthlyTd2Rate)) * freq;

        // Total loan cost = all installments + all stamp charges
        let totalLoanCost = 0;
        const actualPeriods = sched.schedule.length;
        for (let j = 0; j < actualPeriods; j++) {
            const entry = sched.schedule[j];
            totalLoanCost += entry.int + entry.prin + entry.stamp;
        }

        // Total TD income over the loan term
        const totalTdIncome = periodicTdInterest * actualPeriods;

        if (periodicTdInterest >= loanCalc.M && totalTdIncome + buffer >= totalLoanCost) {
            // Found solution — client needs zero deposit!
            const adminFeesAmount = round2(grossLoan * adminFees / 100);
            const periodicTdInterestR = round2(periodicTdInterest);
            const totalTdInterest = round2(periodicTdInterestR * actualPeriods);
            const totalLoanCostR = round2(totalLoanCost);
            const totalTdsAtEnd = td1 + effectiveTd2;
            const actualMonths = actualPeriods * freq;
            const simpleInterestAlt = round2(td1 + (td1 * monthlyTd1Rate * actualMonths));
            const netBenefit = round2(totalTdsAtEnd - simpleInterestAlt);
            // Surplus = guaranteed minimum (months 2-N use regular installment)
            const monthlySurplus = round2(periodicTdInterestR - loanCalc.M);
            const years = actualMonths / 12;
            const effectiveRate = years > 0 ? round2((effectiveTd2 / td1) / years * 100) : 0;

            return {
                valid: true,
                grossLoan: grossLoan,
                td2: effectiveTd2,
                monthlyTdInterest: periodicTdInterestR,
                installment: round2(loanCalc.M),
                monthlySurplus: monthlySurplus,
                totalTdInterest: totalTdInterest,
                totalLoanCost: totalLoanCostR,
                totalTdsAtEnd: totalTdsAtEnd,
                simpleInterestAlt: simpleInterestAlt,
                netBenefit: netBenefit,
                effectiveRate: effectiveRate,
                adminFeesAmount: adminFeesAmount,
                totalStamp: sched.totalStamp || 0,
                actualMonths: actualMonths,
                m1_Payment: sched.m1_Payment,
                firstInstBuffer: buffer,
                availableCdInterest: availableCdInterest,
                netLeftover: round2(netLoan - buffer - effectiveTd2)
            };
        }
    }

    return { valid: false };
}

/**
 * Generates a deterministic Calculation Fingerprint (short hash)
 * Used for auditability - same inputs always produce same fingerprint
 * @param {Object} inputs - Comprehensive input set for audit:
 *   - amount, rate, period
 *   - startDate (ISO YYYY-MM-DD)
 *   - adminFees, stampRate
 *   - firstInstDate (ISO YYYY-MM-DD, optional)
 * @param {string} appVersion - Current app version
 * @returns {string} Fingerprint in format "v1.12-XXXXXX"
 */
function generateFingerprint(inputs, appVersion) {
    // Create canonical input string (order matters for determinism)
    // We include hardcoded conventions (30/360) to ensure future changes break the hash
    const canonical = [
        String(inputs.amount || 0),
        String(inputs.rate || 0),
        String(inputs.period || 0),
        String(inputs.freq || 1),
        String(inputs.startDate || ''), // Expecting ISO date
        String(inputs.adminFees || 0),
        String(inputs.stampRate || 0),
        String(inputs.firstInstDate || ''), // Expecting ISO date
        '30/360', // Hardcoded convention
        'installment', // Calculation target
        appVersion
    ].join('|');

    // DJB2 hash algorithm (fast, non-cryptographic, deterministic)
    let hash = 5381;
    for (let i = 0; i < canonical.length; i++) {
        hash = ((hash << 5) + hash) + canonical.charCodeAt(i);
        hash = hash & 0xFFFFFFFF; // Convert to 32-bit integer
    }

    // Convert to positive number and then to Base36 (alphanumeric)
    const hashPositive = Math.abs(hash) >>> 0;
    const hashStr = hashPositive.toString(36).toUpperCase().padStart(6, '0').slice(-6);

    // Format: v{majorVersion}-{HASH}
    const versionPrefix = 'v' + appVersion.split('.')[0] + '.' + appVersion.split('.')[1];
    return `${versionPrefix}-${hashStr}`;
}

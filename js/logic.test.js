/**
 * logic.test.js - Unit Tests for logic.js
 * Zero-dependency test runner for financial calculations
 * 
 * Run: Open logic.test.html in a browser
 */

// Simple assertion library
const TestRunner = {
    passed: 0,
    failed: 0,
    results: [],

    assertEqual(actual, expected, message) {
        if (actual === expected) {
            this.passed++;
            this.results.push({ pass: true, message });
        } else {
            this.failed++;
            this.results.push({ pass: false, message, actual, expected });
        }
    },

    assertApproxEqual(actual, expected, tolerance, message) {
        const diff = Math.abs(actual - expected);
        if (diff <= tolerance) {
            this.passed++;
            this.results.push({ pass: true, message });
        } else {
            this.failed++;
            this.results.push({ pass: false, message, actual, expected, diff });
        }
    },

    assertTrue(condition, message) {
        if (condition) {
            this.passed++;
            this.results.push({ pass: true, message });
        } else {
            this.failed++;
            this.results.push({ pass: false, message, actual: condition, expected: true });
        }
    },

    assertFalse(condition, message) {
        this.assertTrue(!condition, message);
    },

    reset() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    },

    getSummary() {
        return {
            total: this.passed + this.failed,
            passed: this.passed,
            failed: this.failed,
            results: this.results
        };
    }
};

// ========================================
// TEST SUITES
// ========================================

function testRound2() {
    console.log('Testing round2()...');

    TestRunner.assertEqual(round2(1.234), 1.23, 'round2(1.234) = 1.23');
    TestRunner.assertEqual(round2(1.235), 1.24, 'round2(1.235) = 1.24 (rounds up)');
    TestRunner.assertEqual(round2(1.005), 1.01, 'round2(1.005) = 1.01 (epsilon fix)');
    TestRunner.assertEqual(round2(0), 0, 'round2(0) = 0');
    TestRunner.assertEqual(round2(-1.234), -1.23, 'round2(-1.234) = -1.23');
    TestRunner.assertEqual(round2(100.999), 101, 'round2(100.999) = 101');
}

function testPiastresConversion() {
    console.log('Testing toPiastres() and toCurrency()...');

    TestRunner.assertEqual(toPiastres(100), 10000, 'toPiastres(100) = 10000');
    TestRunner.assertEqual(toPiastres(0.01), 1, 'toPiastres(0.01) = 1');
    TestRunner.assertEqual(toPiastres(1000.50), 100050, 'toPiastres(1000.50) = 100050');

    TestRunner.assertEqual(toCurrency(10000), 100, 'toCurrency(10000) = 100');
    TestRunner.assertEqual(toCurrency(1), 0.01, 'toCurrency(1) = 0.01');
    TestRunner.assertEqual(toCurrency(100050), 1000.50, 'toCurrency(100050) = 1000.50');

    // Round-trip
    TestRunner.assertEqual(toCurrency(toPiastres(123.45)), 123.45, 'Round-trip: 123.45');
}

function testToNum() {
    console.log('Testing toNum() and safeParseFloat()...');

    TestRunner.assertEqual(toNum('1000'), 1000, 'toNum("1000") = 1000');
    TestRunner.assertEqual(toNum('1,000'), 1000, 'toNum("1,000") = 1000 (with comma)');
    TestRunner.assertEqual(toNum('1,234,567.89'), 1234567.89, 'toNum("1,234,567.89") handles multiple commas');
    TestRunner.assertEqual(toNum(''), 0, 'toNum("") = 0 (empty string)');
    TestRunner.assertEqual(toNum('abc'), 0, 'toNum("abc") = 0 (invalid)');
    TestRunner.assertEqual(toNum(null), 0, 'toNum(null) = 0');
    TestRunner.assertEqual(toNum(undefined), 0, 'toNum(undefined) = 0');
    TestRunner.assertEqual(toNum(42), 42, 'toNum(42) = 42 (number passthrough)');
}

function testDays360() {
    console.log('Testing days360()...');

    // Same month: Jan 1 to Jan 31 = 30 days (30/360 convention: d2d - d1d = 31 - 1 = 30)
    const d1 = new Date(2024, 0, 1);  // Jan 1, 2024
    const d2 = new Date(2024, 0, 31); // Jan 31, 2024
    TestRunner.assertEqual(days360(d1, d2), 30, 'days360: Jan 1 to Jan 31 = 30 days (31-1)');

    // Full month
    const d3 = new Date(2024, 0, 1);  // Jan 1, 2024
    const d4 = new Date(2024, 1, 1);  // Feb 1, 2024
    TestRunner.assertEqual(days360(d3, d4), 30, 'days360: Jan 1 to Feb 1 = 30 days');

    // Full year
    const d5 = new Date(2024, 0, 1);  // Jan 1, 2024
    const d6 = new Date(2025, 0, 1);  // Jan 1, 2025
    TestRunner.assertEqual(days360(d5, d6), 360, 'days360: Jan 1 2024 to Jan 1 2025 = 360 days');

    // 31st day handling
    const d7 = new Date(2024, 0, 31); // Jan 31
    const d8 = new Date(2024, 2, 31); // Mar 31
    TestRunner.assertEqual(days360(d7, d8), 60, 'days360: Jan 31 to Mar 31 = 60 days');
}

function testGetQuarterKey() {
    console.log('Testing getQuarterKey()...');

    TestRunner.assertEqual(getQuarterKey(new Date(2024, 0, 15)), '2024-Q1', 'Jan = Q1');
    TestRunner.assertEqual(getQuarterKey(new Date(2024, 2, 31)), '2024-Q1', 'Mar = Q1');
    TestRunner.assertEqual(getQuarterKey(new Date(2024, 3, 1)), '2024-Q2', 'Apr = Q2');
    TestRunner.assertEqual(getQuarterKey(new Date(2024, 5, 30)), '2024-Q2', 'Jun = Q2');
    TestRunner.assertEqual(getQuarterKey(new Date(2024, 6, 1)), '2024-Q3', 'Jul = Q3');
    TestRunner.assertEqual(getQuarterKey(new Date(2024, 9, 15)), '2024-Q4', 'Oct = Q4');
    TestRunner.assertEqual(getQuarterKey(new Date(2024, 11, 31)), '2024-Q4', 'Dec = Q4');
}

function testCalculateLoanInstallment() {
    console.log('Testing calculateLoan() - solve for installment...');

    // Standard loan: 100,000 @ 10% for 12 months
    const result1 = calculateLoan({ amount: '100000', rate: '10', period: '12' }, 'installment');
    TestRunner.assertTrue(result1.valid, 'Loan calculation is valid');
    TestRunner.assertApproxEqual(result1.M, 8791.59, 0.01, 'Installment ≈ 8,791.59');
    TestRunner.assertEqual(result1.P, 100000, 'Principal = 100,000');
    TestRunner.assertEqual(result1.N, 12, 'Period = 12');

    // Zero interest rate
    const result2 = calculateLoan({ amount: '12000', rate: '0', period: '12' }, 'installment');
    TestRunner.assertTrue(result2.valid, 'Zero rate calculation is valid');
    TestRunner.assertEqual(result2.M, 1000, 'Zero rate: 12000/12 = 1000');

    // Large loan
    const result3 = calculateLoan({ amount: '1000000', rate: '8', period: '60' }, 'installment');
    TestRunner.assertTrue(result3.valid, 'Large loan is valid');
    TestRunner.assertApproxEqual(result3.M, 20276.39, 0.01, 'Large loan installment ≈ 20,276.39');
}

function testCalculateLoanAmount() {
    console.log('Testing calculateLoan() - solve for amount...');

    // Work backwards: what principal gives 8791.59/month @ 10% for 12 months?
    const result = calculateLoan({ installment: '8791.59', rate: '10', period: '12' }, 'amount');
    TestRunner.assertTrue(result.valid, 'Amount calculation is valid');
    TestRunner.assertApproxEqual(result.P, 100000, 1, 'Principal ≈ 100,000');
}

function testCalculateLoanPeriod() {
    console.log('Testing calculateLoan() - solve for period...');

    // 100,000 @ 10% with 10,000/month payments
    const result = calculateLoan({ amount: '100000', rate: '10', installment: '10000' }, 'period');
    TestRunner.assertTrue(result.valid, 'Period calculation is valid');
    TestRunner.assertEqual(result.N, 11, 'Period = 11 months');
}

function testCalculateLoanRate() {
    console.log('Testing calculateLoan() - solve for rate...');

    // What rate gives 8791.59/month on 100,000 for 12 months?
    const result = calculateLoan({ amount: '100000', period: '12', installment: '8791.59' }, 'rate');
    TestRunner.assertTrue(result.valid, 'Rate calculation is valid');
    TestRunner.assertApproxEqual(result.R, 10, 0.1, 'Rate ≈ 10%');
}

function testCalculateLoanInvalid() {
    console.log('Testing calculateLoan() - invalid inputs...');

    // Missing required values
    const result1 = calculateLoan({ amount: '', rate: '10', period: '12' }, 'installment');
    TestRunner.assertFalse(result1.valid, 'Empty amount is invalid');

    // Negative values
    const result2 = calculateLoan({ amount: '-1000', rate: '10', period: '12' }, 'installment');
    TestRunner.assertFalse(result2.valid, 'Negative amount is invalid');

    // Period too large
    const result3 = calculateLoan({ amount: '100000', rate: '10', period: '9999' }, 'installment');
    TestRunner.assertFalse(result3.valid, 'Period > MAX_MONTHS is invalid');
}

function testGenerateSchedule() {
    console.log('Testing generateSchedule()...');

    const loanData = { P: 100000, R: 12, N: 12, M: 8884.88 };
    const dates = {
        bookingDate: new Date(2024, 0, 15), // Jan 15, 2024
        m1_Date: new Date(2024, 2, 5),      // Mar 5, 2024
        isAdvanced: false
    };

    const result = generateSchedule(loanData, dates, 0);

    TestRunner.assertEqual(result.schedule.length, 12, 'Schedule has 12 entries');
    TestRunner.assertEqual(result.schedule[0].m, 1, 'First entry is month 1');
    TestRunner.assertEqual(result.schedule[11].m, 12, 'Last entry is month 12');

    // Opening balance should be principal
    TestRunner.assertEqual(result.schedule[0].bal, 100000, 'Opening balance = principal');

    // Final remaining balance should be 0 or very close
    TestRunner.assertApproxEqual(result.schedule[11].rem, 0, 1, 'Final balance ≈ 0');

    // Total interest should be positive
    TestRunner.assertTrue(result.totalActualInterest > 0, 'Total interest > 0');
}

function testGenerateScheduleAdvanced() {
    console.log('Testing generateSchedule() - advanced mode with first installment...');

    const loanData = { P: 100000, R: 12, N: 12, M: 8884.88 };
    const dates = {
        bookingDate: new Date(2024, 0, 15), // Jan 15, 2024
        m1_Date: new Date(2024, 2, 5),      // Mar 5, 2024
        isAdvanced: true
    };

    const result = generateSchedule(loanData, dates, 0);

    TestRunner.assertEqual(result.schedule.length, 12, 'Advanced schedule has 12 entries');

    // First payment should differ from regular M due to day-count
    // The first interest is calculated based on days between booking and first payment
    TestRunner.assertTrue(result.m1_Payment !== loanData.M, 'First payment differs from standard M');
}

function testGenerateScheduleWithStamp() {
    console.log('Testing generateSchedule() - with stamp duty...');

    const loanData = { P: 100000, R: 12, N: 12, M: 8884.88 };
    const dates = {
        bookingDate: new Date(2024, 0, 15),
        m1_Date: new Date(2024, 2, 5),
        isAdvanced: false
    };

    const stampRate = 0.2; // 0.2% stamp
    const result = generateSchedule(loanData, dates, stampRate);

    // Should have some stamp charges
    TestRunner.assertTrue(result.totalStamp > 0, 'Total stamp > 0 when stampRate > 0');

    // At least one entry should have stamp
    const hasStampEntry = result.schedule.some(e => e.hasStamp);
    TestRunner.assertTrue(hasStampEntry, 'At least one entry has stamp');
}

function testEarlySettlement() {
    console.log('Testing calculateEarlySettlement()...');

    // Create a simple schedule
    const loanData = { P: 100000, R: 12, N: 12, M: 8884.88 };
    const dates = {
        bookingDate: new Date(2024, 0, 15),
        m1_Date: new Date(2024, 2, 5),
        isAdvanced: false
    };
    const { schedule } = generateSchedule(loanData, dates, 0);

    // Settle after 6 payments
    const settlementDate = new Date(2024, 8, 10); // Sep 10, 2024
    const result = calculateEarlySettlement(schedule, settlementDate, 3, 12, 0);

    TestRunner.assertTrue(result.valid, 'Settlement calculation is valid');
    TestRunner.assertTrue(result.principalBalance > 0, 'Principal balance > 0');
    TestRunner.assertTrue(result.fee >= 0, 'Fee >= 0');
    TestRunner.assertTrue(result.totalSettlement > result.principalBalance, 'Total > principal (includes fee)');
    TestRunner.assertTrue(result.lastPaidInstallment > 0, 'Last paid installment > 0');
}

function testEarlySettlementEdgeCases() {
    console.log('Testing calculateEarlySettlement() - edge cases...');

    // Empty schedule
    const result1 = calculateEarlySettlement([], new Date(), 3, 12, 0);
    TestRunner.assertFalse(result1.valid, 'Empty schedule is invalid');

    // Null schedule
    const result2 = calculateEarlySettlement(null, new Date(), 3, 12, 0);
    TestRunner.assertFalse(result2.valid, 'Null schedule is invalid');
}

function testSolveTdLoan() {
    console.log('Testing solveTdLoan()...');

    // Standard case: TD₁=1,000,000, TD rate=20%, Loan rate=22%, 36 months, stamp=0.2%, admin=1%
    const bookingDate = new Date(2026, 0, 15);
    const m1_Date = new Date(2026, 1, 15);

    const result = solveTdLoan(
        1000000, 20, 22, 36,
        { bookingDate, m1_Date, isAdvanced: true },
        0.2, 1
    );

    TestRunner.assertTrue(result.valid, 'Solver finds a valid solution');
    TestRunner.assertTrue(result.td2 > 0, 'TD₂ is positive: ' + result.td2);
    TestRunner.assertEqual(result.td2 % 1000, 0, 'TD₂ is a multiple of 1000');
    TestRunner.assertTrue(result.grossLoan > result.td2, 'Gross loan > TD₂ (fees deducted)');
    TestRunner.assertTrue(result.adminFeesAmount > 0, 'Admin fees > 0 when admin=1%');
    TestRunner.assertApproxEqual(result.grossLoan - result.td2, result.adminFeesAmount, 1, 'grossLoan - td2 ≈ adminFees');
    TestRunner.assertTrue(result.monthlyTdInterest > 0, 'Monthly interest > 0');
    // Core constraint: customer pays nothing (TD interest covers installment)
    TestRunner.assertTrue(result.monthlySurplus >= 0, 'Monthly surplus ≥ 0 (customer pays nothing): ' + result.monthlySurplus);
    TestRunner.assertTrue(result.monthlyTdInterest >= result.installment, 'TD interest ≥ installment');
    TestRunner.assertTrue(result.totalTdsAtEnd > result.simpleInterestAlt, 'Total TDs > simple interest alt');
    TestRunner.assertTrue(result.netBenefit > 0, 'Net benefit is positive: ' + result.netBenefit);

    // With no fees: TD₂ = grossLoan
    const resultNoFees = solveTdLoan(
        1000000, 20, 22, 36,
        { bookingDate, m1_Date, isAdvanced: true },
        0.2, 0
    );
    TestRunner.assertTrue(resultNoFees.valid, 'Solver works with no admin fees');
    TestRunner.assertEqual(resultNoFees.td2 % 1000, 0, 'TD₂ still a multiple of 1000 (no fees)');
    TestRunner.assertEqual(resultNoFees.adminFeesAmount, 0, 'Admin fees = 0 when admin=0%');
    TestRunner.assertTrue(resultNoFees.monthlySurplus >= 0, 'No fees: surplus ≥ 0');

    // Split-rate test: TD₂ rate differs from TD₁ rate
    const resultSplitRate = solveTdLoan(
        1000000, 20, 22, 36,
        { bookingDate, m1_Date, isAdvanced: true },
        0.2, 1, 18  // td2Rate=18% (lower than td1Rate=20%)
    );
    TestRunner.assertTrue(resultSplitRate.valid, 'Solver works with split rates');
    TestRunner.assertTrue(resultSplitRate.td2 > 0, 'TD₂ positive with split rate: ' + resultSplitRate.td2);
    TestRunner.assertEqual(resultSplitRate.td2 % 1000, 0, 'TD₂ multiple of 1000 with split rate');
    TestRunner.assertTrue(resultSplitRate.monthlySurplus >= 0, 'Split rate: surplus ≥ 0');

    // Explicit same-rate produces same result as default
    const resultExplicit = solveTdLoan(
        1000000, 20, 22, 36,
        { bookingDate, m1_Date, isAdvanced: true },
        0.2, 1, 20  // td2Rate=20% same as td1Rate
    );
    TestRunner.assertTrue(resultExplicit.valid, 'Explicit same rate is valid');
    TestRunner.assertEqual(resultExplicit.td2, result.td2, 'Explicit td2Rate=tdRate gives same TD₂');
    TestRunner.assertApproxEqual(resultExplicit.monthlyTdInterest, result.monthlyTdInterest, 0.01, 'Same monthly interest when rates match');
}

function testSolveTdLoanEdgeCases() {
    console.log('Testing solveTdLoan() edge cases...');

    // Invalid inputs
    TestRunner.assertFalse(solveTdLoan(0, 20, 22, 36, {}, 0, 0).valid, 'Zero TD₁ is invalid');
    TestRunner.assertFalse(solveTdLoan(1000000, 0, 22, 36, {}, 0, 0).valid, 'Zero TD rate is invalid');
    TestRunner.assertFalse(solveTdLoan(1000000, 20, 0, 36, {}, 0, 0).valid, 'Zero loan rate is invalid');
    TestRunner.assertFalse(solveTdLoan(1000000, 20, 22, 0, {}, 0, 0).valid, 'Zero period is invalid');
    TestRunner.assertFalse(solveTdLoan(1000000, 20, 22, 36, {}, 0, 0, 0).valid, 'Zero td2Rate is invalid');

    // Non-advanced mode
    const result = solveTdLoan(
        500000, 18, 20, 24,
        { bookingDate: new Date(2026, 5, 1), m1_Date: new Date(2026, 6, 1), isAdvanced: false },
        0, 0
    );
    TestRunner.assertTrue(result.valid, 'Solver works in non-advanced mode');
    TestRunner.assertTrue(result.td2 > 0, 'TD₂ > 0 in non-advanced mode');
    TestRunner.assertEqual(result.td2 % 1000, 0, 'TD₂ is multiple of 1000 in non-advanced mode');
    TestRunner.assertTrue(typeof result.monthlySurplus === 'number', 'monthlySurplus is returned');
}

// ========================================
// REGRESSION TESTS (monthly backward-compat)
// ========================================

function testMonthlyRegression() {
    console.log('Testing monthly regression - freq omitted vs freq=1...');

    // calculateLoan: omitting freq should give same results as freq=1
    const r1 = calculateLoan({ amount: '100000', rate: '10', period: '12' }, 'installment');
    const r1f = calculateLoan({ amount: '100000', rate: '10', period: '12' }, 'installment', 1);
    TestRunner.assertApproxEqual(r1.M, r1f.M, 0.001, 'Regression: installment identical with freq=1 vs omitted');

    const r2 = calculateLoan({ installment: '8791.59', rate: '10', period: '12' }, 'amount');
    const r2f = calculateLoan({ installment: '8791.59', rate: '10', period: '12' }, 'amount', 1);
    TestRunner.assertApproxEqual(r2.P, r2f.P, 0.001, 'Regression: amount identical with freq=1 vs omitted');

    const r3 = calculateLoan({ amount: '100000', rate: '10', installment: '10000' }, 'period');
    const r3f = calculateLoan({ amount: '100000', rate: '10', installment: '10000' }, 'period', 1);
    TestRunner.assertEqual(r3.N, r3f.N, 'Regression: period identical with freq=1 vs omitted');

    const r4 = calculateLoan({ amount: '100000', period: '12', installment: '8791.59' }, 'rate');
    const r4f = calculateLoan({ amount: '100000', period: '12', installment: '8791.59' }, 'rate', 1);
    TestRunner.assertApproxEqual(r4.R, r4f.R, 0.001, 'Regression: rate identical with freq=1 vs omitted');

    // Pin known monthly installment value
    TestRunner.assertApproxEqual(r1.M, 8791.59, 0.01, 'Regression: 100k@10%/12mo = 8791.59');

    // generateSchedule: omitting freq should give same results as freq=1
    const loanData = { P: 100000, R: 12, N: 12, M: 8884.88 };
    const dates = { bookingDate: new Date(2024, 0, 15), m1_Date: new Date(2024, 1, 15), isAdvanced: false };
    const s1 = generateSchedule(loanData, dates, 0);
    const s1f = generateSchedule(loanData, dates, 0, 1);
    TestRunner.assertEqual(s1.schedule.length, s1f.schedule.length, 'Regression: schedule length identical');
    TestRunner.assertApproxEqual(s1.totalActualInterest, s1f.totalActualInterest, 0.01, 'Regression: total interest identical');
    TestRunner.assertApproxEqual(s1.schedule[0].int, s1f.schedule[0].int, 0.01, 'Regression: first interest identical');
}

// ========================================
// QUARTERLY FREQUENCY TESTS
// ========================================

function testCalculateLoanQuarterly() {
    console.log('Testing calculateLoan() - quarterly (freq=3)...');

    // Quarterly: 500,000 @ 29% for 2 quarterly installments
    // Quarterly rate = 29/400 = 0.0725
    // M = P * i * (1+i)^N / ((1+i)^N - 1)
    const result = calculateLoan({ amount: '500000', rate: '29', period: '2' }, 'installment', 3);
    TestRunner.assertTrue(result.valid, 'Quarterly loan calculation is valid');
    TestRunner.assertApproxEqual(result.M, 277504.52, 1, 'Quarterly installment ≈ 277,504.52');

    // Solve for amount: given the installment, can we recover the principal?
    const resultA = calculateLoan({ installment: String(result.M), rate: '29', period: '2' }, 'amount', 3);
    TestRunner.assertTrue(resultA.valid, 'Quarterly solve-for-amount is valid');
    TestRunner.assertApproxEqual(resultA.P, 500000, 1, 'Quarterly reverse amount ≈ 500,000');

    // Quarterly installment should be larger than monthly for same N
    const monthlyResult = calculateLoan({ amount: '500000', rate: '29', period: '2' }, 'installment', 1);
    TestRunner.assertTrue(result.M > monthlyResult.M, 'Quarterly installment > monthly installment for same N');
}

function testGenerateScheduleQuarterly() {
    console.log('Testing generateSchedule() - quarterly matching bank PDF...');

    // Bank loan: P=500,000, R=29%, N=2 quarterly installments
    // Booking: 26/02/2026, First payment: 05/05/2026
    const P = 500000;
    const R = 29;
    const N = 2;
    const freq = 3;
    const calcResult = calculateLoan({ amount: String(P), rate: String(R), period: String(N) }, 'installment', freq);
    const M = calcResult.M;

    const bookingDate = new Date(2026, 1, 26); // Feb 26, 2026
    const m1_Date = new Date(2026, 5, 5);      // Jun 5, 2026

    const result = generateSchedule(
        { P, R, N, M },
        { bookingDate, m1_Date, isAdvanced: true },
        0,   // no stamp
        freq
    );

    // Schedule should have 2 entries (2 quarterly installments)
    TestRunner.assertEqual(result.schedule.length, 2, 'Quarterly schedule has 2 entries');

    // Entry 1: Jun 5, 2026
    // days360(26/02/2026, 05/06/2026) = 99 days
    // Interest = 500,000 * 29/100 * 99/360 = 39,875.00
    TestRunner.assertApproxEqual(result.schedule[0].int, 39875.00, 0.01, 'Q1 interest = 39,875.00 (bank PDF match)');
    TestRunner.assertApproxEqual(result.schedule[0].prin, 241254.52, 1, 'Q1 principal ≈ 241,254.52 (bank PDF match)');

    // Entry 2: Sep 5, 2026
    // Balance = 500,000 - 241,254.52 = 258,745.48
    // Interest = 258,745.48 * 29/100 * 90/360 = 18,759.05
    TestRunner.assertApproxEqual(result.schedule[1].bal, 258745.48, 1, 'Q2 opening balance ≈ 258,745.48');
    TestRunner.assertApproxEqual(result.schedule[1].int, 18759.05, 0.10, 'Q2 interest ≈ 18,759.05 (bank PDF match)');

    // Final balance should be 0
    TestRunner.assertApproxEqual(result.schedule[1].rem, 0, 1, 'Final balance ≈ 0');

    // Total interest = 39,875.00 + 18,759.05 = 58,634.05
    TestRunner.assertApproxEqual(result.totalActualInterest, 58634.05, 1, 'Total interest ≈ 58,634.05 (bank PDF match)');

    // Second installment date should be 3 months after the first
    const q2Date = result.schedule[1].rawDate;
    TestRunner.assertEqual(q2Date.getMonth(), 8, 'Q2 date is September (month index 8)');
    TestRunner.assertEqual(q2Date.getDate(), 5, 'Q2 date is the 5th');
}

function testGetNextQuarterlyDate() {
    console.log('Testing getNextQuarterlyDate()...');

    // Booking Jan 15 → next quarterly 4th month → May 5
    const d1 = getNextQuarterlyDate(new Date(2026, 0, 15));
    TestRunner.assertEqual(d1.getMonth(), 4, 'Jan booking → May (index 4)');
    TestRunner.assertEqual(d1.getDate(), 5, 'Jan booking → 5th');

    // Booking Feb 26 → next quarterly 4th month → Jun 5
    const d2 = getNextQuarterlyDate(new Date(2026, 1, 26));
    TestRunner.assertEqual(d2.getMonth(), 5, 'Feb 26 booking → June (index 5)');
    TestRunner.assertEqual(d2.getDate(), 5, 'Feb 26 booking → 5th');

    // Booking Mar 10 → next quarterly 4th month → Jul 5
    const d3 = getNextQuarterlyDate(new Date(2026, 2, 10));
    TestRunner.assertEqual(d3.getMonth(), 6, 'Mar booking → July (index 6)');

    // Booking Sep 1 → next quarterly 4th month → Jan 5 next year
    const d4 = getNextQuarterlyDate(new Date(2026, 8, 1));
    TestRunner.assertEqual(d4.getMonth(), 0, 'Sep booking → January next year (index 0)');
    TestRunner.assertEqual(d4.getFullYear(), 2027, 'Sep booking → year 2027');
    TestRunner.assertEqual(d4.getDate(), 5, 'Sep booking → 5th');

    // Booking Nov 10 → next quarterly 4th month → Mar 5 next year
    const d5 = getNextQuarterlyDate(new Date(2026, 10, 10));
    TestRunner.assertEqual(d5.getMonth(), 2, 'Nov booking → Mar next year (index 2)');
    TestRunner.assertEqual(d5.getFullYear(), 2027, 'Nov booking → year 2027');
    TestRunner.assertEqual(d5.getDate(), 5, 'Nov booking → 5th');

    // Booking Dec 1 → next quarterly 4th month → Apr 5 next year
    const d6 = getNextQuarterlyDate(new Date(2026, 11, 1));
    TestRunner.assertEqual(d6.getMonth(), 3, 'Dec booking → April next year (index 3)');
    TestRunner.assertEqual(d6.getFullYear(), 2027, 'Dec booking → year 2027');
}

// ========================================
// RUN ALL TESTS
// ========================================

function runAllTests() {
    TestRunner.reset();

    console.log('=== Starting logic.js Unit Tests ===\n');

    // Utility tests
    testRound2();
    testPiastresConversion();
    testToNum();

    // Date tests
    testDays360();
    testGetQuarterKey();

    // Core calculation tests
    testCalculateLoanInstallment();
    testCalculateLoanAmount();
    testCalculateLoanPeriod();
    testCalculateLoanRate();
    testCalculateLoanInvalid();

    // Schedule tests
    testGenerateSchedule();
    testGenerateScheduleAdvanced();
    testGenerateScheduleWithStamp();

    // Early settlement tests
    testEarlySettlement();
    testEarlySettlementEdgeCases();

    // Self-sufficient TD solver tests
    testSolveTdLoan();
    testSolveTdLoanEdgeCases();

    // Regression tests (monthly backward-compat)
    testMonthlyRegression();

    // Quarterly frequency tests
    testGetNextQuarterlyDate();
    testCalculateLoanQuarterly();
    testGenerateScheduleQuarterly();

    console.log('\n=== Test Results ===');

    const summary = TestRunner.getSummary();
    console.log(`Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}`);

    return summary;
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.runAllTests = runAllTests;
    window.TestRunner = TestRunner;
}

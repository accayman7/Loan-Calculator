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

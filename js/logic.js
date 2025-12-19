// js/logic.js - Core calculation logic

const MAX_MONTHS = 600; // Hard limit: 50 years

// Convert formatted strings to numbers
function toNum(v) { 
    const clean = String(v).replace(/,/g, '');
    const n = parseFloat(clean); 
    return isNaN(n) ? 0 : n; 
}

// Format numbers for display
function fmt(n) { 
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); 
}

// Safe float parsing
function safeParseFloat(v) { 
    const clean = String(v).replace(/,/g, '');
    const n = parseFloat(clean); 
    return isNaN(n) ? NaN : n; 
}

// Days360 calculation for banking logic
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

/**
 * Fallback solver using Bisection Method
 * Used when Newton-Raphson diverges
 */
function solveRateBisection(P, N, M) {
    let low = 0.00001; // Approx 0.01%
    let high = 1.0;    // Approx 1200% interest
    let epsilon = 0.0000001; // Precision
    let i = 0;
    
    for (let k = 0; k < 100; k++) {
        i = (low + high) / 2;
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
 * Core Loan Calculation
 */
function calculateLoan(inputs, activeKey) {
    const P = safeParseFloat(inputs.amount);
    const R = safeParseFloat(inputs.rate);
    let N = parseInt(inputs.period);
    const M = safeParseFloat(inputs.installment);
    
    let resP=P, resR=R, resN=N, resM=M, valid=false;
    
    try {
        // Enforce 600 months limit on input
        if (activeKey !== 'period' && (isNaN(N) || N > MAX_MONTHS)) {
             return { valid: false };
        }

        if (activeKey === 'installment') { 
            if(P>0 && R>=0 && N>0) { 
                const i = R/1200; 
                resM = i===0 ? P/N : P * i * Math.pow(1+i,N) / (Math.pow(1+i,N)-1); 
                valid=true; 
            } 
        }
        else if (activeKey === 'amount') { 
            if(M>0 && R>=0 && N>0) { 
                const i = R/1200; 
                resP = i===0 ? M*N : M * (Math.pow(1+i,N)-1) / (i * Math.pow(1+i,N)); 
                valid=true; 
            } 
        }
        else if (activeKey === 'period') { 
            if(P>0 && M>0 && R>=0) { 
                const i = R/1200; 
                if(M > P*i) { 
                    resN = Math.ceil(Math.log(M/(M-P*i)) / Math.log(1+i)); 
                    // Validate calculated period against limit
                    if (resN <= MAX_MONTHS) {
                        valid=true; 
                    } else {
                        console.warn("Calculated period exceeds limit.");
                        valid = false;
                    }
                } 
            } 
        }
        else if (activeKey === 'rate') { 
            if(P>0 && M>0 && N>0 && M*N > P) { 
                // Try Newton-Raphson first
                let i=0.01; 
                let converged = false;
                for(let j=0;j<20;j++) { 
                    let f = M*(1-Math.pow(1+i,-N))/i - P; 
                    let df = (M/i)*(N*Math.pow(1+i,-N-1)/(1+i) - (1-Math.pow(1+i,-N))/i); 
                    let newI = i - f/df;
                    if (Math.abs(newI - i) < 0.0000001) {
                        i = newI;
                        converged = true;
                        break;
                    }
                    i = newI;
                } 
                resR = i*1200; 

                // Robustness Check: If Newton failed (NaN/Infinity/Negative), use Bisection
                if (!converged || !isFinite(resR) || resR <= 0) {
                    resR = solveRateBisection(P, N, M);
                }
                
                valid = true;
            } 
        }
    } catch(e) {
        console.error("Calculation Error", e);
    }

    // Double check sanity of results before returning valid
    if (isNaN(resP) || isNaN(resR) || isNaN(resN) || isNaN(resM) || resN > MAX_MONTHS) valid = false;

    return { valid, P: resP, R: resR, N: resN, M: resM };
}

// Schedule Generation Logic
function generateSchedule(loanData, dates) {
    let { P, R, N, M } = loanData;
    let { bookingDate, m1_Date, isAdvanced } = dates;
    
    let schedule = [];
    let bal = P;
    let cumInt = 0;
    let iRate = R/1200; 
    
    let standardPrincipal = 0;
    let standardMonthlyInterest = P * iRate;
    standardPrincipal = M - standardMonthlyInterest;

    let m1_Interest = 0;
    let m1_Payment = 0;

    if (isAdvanced) {
        const daysDiff = days360(bookingDate, m1_Date);
        m1_Interest = P * (R / 100) * (daysDiff / 360);
        m1_Payment = standardPrincipal + m1_Interest;
    } else {
        m1_Interest = standardMonthlyInterest;
        m1_Payment = M;
    }

    let totalActualInterest = 0;
    
    for(let m=1; m<=N; m++) {
        let inte, prin, currentDate;

        if (m === 1) {
            inte = m1_Interest;
            prin = standardPrincipal; 
            if (bal < prin) prin = bal;
            currentDate = m1_Date;
        } else {
            inte = bal * iRate;
            prin = M - inte;
            if (bal < prin) prin = bal;
            
            let d = new Date(m1_Date);
            d.setMonth(m1_Date.getMonth() + (m - 1));
            // Fix date overflow (e.g. Feb 30 -> Feb 28/29)
            // NOTE: setDate(0) sets it to the LAST day of previous month
            if(d.getDate() !== m1_Date.getDate()) { d.setDate(0); }
            currentDate = d;
        }

        bal -= prin; 
        cumInt += inte;
        totalActualInterest += inte;

        schedule.push({ 
            m, 
            rawDate: currentDate, 
            bal: bal < 0.01 ? 0 : bal, 
            int: inte, 
            prin: prin, 
            rem: bal < 0.01 ? 0 : bal 
        });
        
        if(bal < 0.01) break;
    }

    return { schedule, totalActualInterest, m1_Payment };
}
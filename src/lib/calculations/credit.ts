// -----------------------------------------------------------------------------
// Crédit — standard amortizing-loan (annuité constante) computation.
// Excludes: dossier fees, borrower insurance, optional services and any other
// contractual costs. The Astro page and result footer document this clearly.
// -----------------------------------------------------------------------------

import { BOUNDS, clamp } from './validation';

export interface CreditInput {
  /** Amount borrowed (MAD). */
  principal: number;
  /** Annual interest rate as decimal (5 % → 0.05). */
  annualRate: number;
  /** Loan duration in years. */
  years: number;
}

export interface CreditMonthlyPoint {
  month: number;
  principalPaid: number;
  interestPaid: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  remaining: number;
}

export interface CreditResult {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  months: number;
  amortization: CreditMonthlyPoint[];
}

/**
 * Standard formula:  P × r / (1 - (1 + r)^-n)
 * Equivalent to:     P × r × (1+r)^n / ((1+r)^n - 1)
 * With annualRate = 0 → payment = principal / months.
 */
export function calculateCredit(input: CreditInput): CreditResult {
  const principal = Math.max(0, input.principal);
  const annualRate = clamp(input.annualRate, 0, BOUNDS.annualRatePct.max);
  const years = clamp(input.years, 0, BOUNDS.years.max);
  const months = Math.max(0, Math.round(years * 12));

  if (months === 0 || principal === 0) {
    return {
      monthlyPayment: 0,
      totalPaid: 0,
      totalInterest: 0,
      months,
      amortization: [],
    };
  }

  const r = annualRate / 12;
  let monthlyPayment: number;
  if (r === 0) {
    monthlyPayment = principal / months;
  } else {
    const factor = Math.pow(1 + r, months);
    monthlyPayment = (principal * r * factor) / (factor - 1);
  }

  const amortization: CreditMonthlyPoint[] = [];
  let remaining = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  for (let m = 1; m <= months; m++) {
    const interestPaid = remaining * r;
    let principalPaid = monthlyPayment - interestPaid;
    // Final payment may need a tiny correction from float rounding.
    if (m === months) principalPaid = remaining;
    remaining = Math.max(0, remaining - principalPaid);
    cumulativePrincipal += principalPaid;
    cumulativeInterest += interestPaid;
    amortization.push({
      month: m,
      principalPaid,
      interestPaid,
      cumulativePrincipal,
      cumulativeInterest,
      remaining,
    });
  }

  const totalPaid = monthlyPayment * months;
  const totalInterest = totalPaid - principal;

  return {
    monthlyPayment,
    totalPaid,
    totalInterest,
    months,
    amortization,
  };
}

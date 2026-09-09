// -----------------------------------------------------------------------------
// Épargne — future-value simulation for a monthly savings plan.
//
// Uses iterative month-by-month accumulation so the r=0 case works without a
// special branch and so a full monthly series is available for charts.
// -----------------------------------------------------------------------------

import { BOUNDS, clamp } from './validation';

export type ContributionTiming = 'end' | 'begin';

export interface SavingsInput {
  /** Starting capital in the account currency (MAD). */
  initial: number;
  /** Recurring monthly contribution. */
  monthlyContribution: number;
  /** Duration in years. Can be fractional. */
  years: number;
  /** Annual rate as a decimal (2.5 % → 0.025). */
  annualRate: number;
  /** When the recurring contribution is credited. Defaults to end-of-month. */
  contributionTiming?: ContributionTiming;
}

export interface SavingsMonthlyPoint {
  month: number;
  contributed: number;
  balance: number;
  interest: number;
}

export interface SavingsResult {
  finalCapital: number;
  totalContributed: number;
  totalInterest: number;
  months: number;
  monthlySeries: SavingsMonthlyPoint[];
}

/** Compute future value + monthly series. Handles annualRate = 0. */
export function calculateSavings(input: SavingsInput): SavingsResult {
  const initial = Math.max(0, input.initial);
  const monthlyContribution = Math.max(0, input.monthlyContribution);
  const years = clamp(input.years, 0, BOUNDS.years.max);
  const annualRate = clamp(input.annualRate, 0, BOUNDS.annualRatePct.max);
  const timing: ContributionTiming = input.contributionTiming ?? 'end';

  const months = Math.max(0, Math.round(years * 12));
  const r = annualRate / 12;

  let balance = initial;
  let totalContributed = initial;
  const series: SavingsMonthlyPoint[] = [
    { month: 0, contributed: initial, balance: initial, interest: 0 },
  ];

  for (let m = 1; m <= months; m++) {
    if (timing === 'begin') {
      balance += monthlyContribution;
      totalContributed += monthlyContribution;
    }
    balance = balance * (1 + r);
    if (timing === 'end') {
      balance += monthlyContribution;
      totalContributed += monthlyContribution;
    }
    series.push({
      month: m,
      contributed: totalContributed,
      balance,
      interest: balance - totalContributed,
    });
  }

  return {
    finalCapital: balance,
    totalContributed,
    totalInterest: balance - totalContributed,
    months,
    monthlySeries: series,
  };
}

import { describe, it, expect } from 'vitest';
import { calculateCredit } from './credit';

const near = (a: number, b: number, epsPct = 0.001) =>
  Math.abs(a - b) / Math.max(1, Math.abs(b)) < epsPct;

describe('calculateCredit', () => {
  it('rate = 0 → payment = principal / months', () => {
    // 100 000 / 60 = 1 666.67
    const r = calculateCredit({ principal: 100_000, annualRate: 0, years: 5 });
    expect(near(r.monthlyPayment, 100_000 / 60)).toBe(true);
    expect(near(r.totalPaid, 100_000)).toBe(true);
    expect(near(r.totalInterest, 0)).toBe(true);
  });

  it('5 % annual over 5 years, principal 100 000 → payment ≈ 1 887.12', () => {
    // Independently: r = 0.05/12 = 0.0041667, n = 60
    // payment = 100 000 × 0.0041667 × 1.283359 / (1.283359 − 1)
    //         ≈ 1 887.12
    const r = calculateCredit({ principal: 100_000, annualRate: 0.05, years: 5 });
    expect(near(r.monthlyPayment, 1_887.12, 0.001)).toBe(true);
    // Total paid ≈ 1 887.12 × 60 ≈ 113 227.4
    expect(near(r.totalPaid, r.monthlyPayment * 60)).toBe(true);
    expect(near(r.totalInterest, r.totalPaid - 100_000)).toBe(true);
  });

  it('longer duration → higher total interest, lower payment', () => {
    const short = calculateCredit({ principal: 100_000, annualRate: 0.05, years: 5 });
    const long = calculateCredit({ principal: 100_000, annualRate: 0.05, years: 15 });
    expect(long.monthlyPayment).toBeLessThan(short.monthlyPayment);
    expect(long.totalInterest).toBeGreaterThan(short.totalInterest);
  });

  it('total interest = total paid − principal', () => {
    const r = calculateCredit({ principal: 250_000, annualRate: 0.045, years: 10 });
    expect(near(r.totalInterest, r.totalPaid - 250_000)).toBe(true);
  });

  it('amortization: last remaining balance is 0', () => {
    const r = calculateCredit({ principal: 50_000, annualRate: 0.04, years: 3 });
    expect(r.amortization.length).toBe(36);
    expect(r.amortization[35].remaining).toBe(0);
  });

  it('amortization: cumulative principal at end equals principal', () => {
    const r = calculateCredit({ principal: 75_000, annualRate: 0.06, years: 7 });
    const last = r.amortization[r.amortization.length - 1];
    expect(near(last.cumulativePrincipal, 75_000, 0.0001)).toBe(true);
  });

  it('principal = 0 → payment = 0', () => {
    const r = calculateCredit({ principal: 0, annualRate: 0.05, years: 5 });
    expect(r.monthlyPayment).toBe(0);
    expect(r.amortization.length).toBe(0);
  });

  it('years = 0 → returns empty result, no divide by zero', () => {
    const r = calculateCredit({ principal: 100_000, annualRate: 0.05, years: 0 });
    expect(r.monthlyPayment).toBe(0);
    expect(r.months).toBe(0);
  });
});

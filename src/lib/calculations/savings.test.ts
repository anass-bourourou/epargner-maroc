import { describe, it, expect } from 'vitest';
import { calculateSavings } from './savings';

const near = (a: number, b: number, epsPct = 0.001) =>
  Math.abs(a - b) / Math.max(1, Math.abs(b)) < epsPct;

describe('calculateSavings', () => {
  it('r = 0 with initial only → capital unchanged', () => {
    const r = calculateSavings({
      initial: 10_000,
      monthlyContribution: 0,
      years: 5,
      annualRate: 0,
    });
    expect(r.finalCapital).toBe(10_000);
    expect(r.totalContributed).toBe(10_000);
    expect(r.totalInterest).toBe(0);
    expect(r.months).toBe(60);
  });

  it('r = 0 with monthly contribution only → sum of contributions', () => {
    // 500 × 60 = 30 000
    const r = calculateSavings({
      initial: 0,
      monthlyContribution: 500,
      years: 5,
      annualRate: 0,
    });
    expect(r.finalCapital).toBe(30_000);
    expect(r.totalContributed).toBe(30_000);
    expect(r.totalInterest).toBe(0);
  });

  it('positive rate: initial only compounds monthly', () => {
    // 10 000 × (1 + 0.03/12)^12 ≈ 10 304.16
    const r = calculateSavings({
      initial: 10_000,
      monthlyContribution: 0,
      years: 1,
      annualRate: 0.03,
    });
    expect(near(r.finalCapital, 10_304.16, 0.0005)).toBe(true);
    expect(r.totalContributed).toBe(10_000);
    expect(near(r.totalInterest, 304.16, 0.005)).toBe(true);
  });

  it('positive rate: monthly contributions only (end-of-month annuity)', () => {
    // FV = PMT × ((1+r)^n − 1) / r  with r = 0.03/12, n = 60
    // 500 × ((1.0025)^60 − 1) / 0.0025 ≈ 32 322.6
    const r = calculateSavings({
      initial: 0,
      monthlyContribution: 500,
      years: 5,
      annualRate: 0.03,
    });
    expect(near(r.finalCapital, 32_322.6, 0.0005)).toBe(true);
    expect(r.totalContributed).toBe(500 * 60);
  });

  it('positive rate: initial + monthly contributions', () => {
    // Independently: FV(initial) + FV(annuity) at r=0.03/12, n=60
    // = 10 000 × 1.0025^60 + 500 × ((1.0025^60 − 1) / 0.0025)
    // ≈ 11 616.17 + 32 322.60 ≈ 43 938.77
    const r = calculateSavings({
      initial: 10_000,
      monthlyContribution: 500,
      years: 5,
      annualRate: 0.03,
    });
    expect(near(r.finalCapital, 43_938.77, 0.0005)).toBe(true);
    expect(r.totalContributed).toBe(10_000 + 500 * 60);
    expect(r.totalInterest).toBeGreaterThan(0);
  });

  it('begin-of-month timing yields a higher final capital', () => {
    const end = calculateSavings({
      initial: 0,
      monthlyContribution: 500,
      years: 5,
      annualRate: 0.03,
      contributionTiming: 'end',
    });
    const begin = calculateSavings({
      initial: 0,
      monthlyContribution: 500,
      years: 5,
      annualRate: 0.03,
      contributionTiming: 'begin',
    });
    expect(begin.finalCapital).toBeGreaterThan(end.finalCapital);
    // Ratio should be exactly (1 + r): 1.0025
    expect(near(begin.finalCapital / end.finalCapital, 1.0025)).toBe(true);
  });

  it('monthly series has months+1 points and is monotone in contributions', () => {
    const r = calculateSavings({
      initial: 1000,
      monthlyContribution: 100,
      years: 2,
      annualRate: 0.02,
    });
    expect(r.monthlySeries.length).toBe(25);
    for (let i = 1; i < r.monthlySeries.length; i++) {
      expect(r.monthlySeries[i].contributed).toBeGreaterThanOrEqual(
        r.monthlySeries[i - 1].contributed,
      );
      expect(r.monthlySeries[i].balance).toBeGreaterThan(r.monthlySeries[i - 1].balance);
    }
  });

  it('negative inputs are clamped to 0', () => {
    const r = calculateSavings({
      initial: -1000,
      monthlyContribution: -50,
      years: 1,
      annualRate: 0,
    });
    expect(r.finalCapital).toBe(0);
    expect(r.totalContributed).toBe(0);
  });
});

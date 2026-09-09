import { describe, it, expect } from 'vitest';
import { calculateBudget, emptyExpenses } from './budget';

describe('calculateBudget', () => {
  it('positive balance: income > expenses', () => {
    const r = calculateBudget({
      income: 10_000,
      expenses: {
        ...emptyExpenses(),
        logement: 3000,
        alimentation: 2000,
        transport: 1000,
      },
    });
    expect(r.totalExpenses).toBe(6000);
    expect(r.balance).toBe(4000);
    expect(r.savingsRate).toBe(40); // 4000 / 10000 * 100
    expect(r.isDeficit).toBe(false);
  });

  it('zero balance: income == expenses', () => {
    const r = calculateBudget({
      income: 5000,
      expenses: { ...emptyExpenses(), logement: 5000 },
    });
    expect(r.balance).toBe(0);
    expect(r.savingsRate).toBe(0);
    expect(r.isDeficit).toBe(false);
  });

  it('negative balance: expenses > income', () => {
    const r = calculateBudget({
      income: 4000,
      expenses: { ...emptyExpenses(), logement: 3000, credits: 2000 },
    });
    expect(r.totalExpenses).toBe(5000);
    expect(r.balance).toBe(-1000);
    expect(r.savingsRate).toBe(0);
    expect(r.isDeficit).toBe(true);
  });

  it('zero income: savings rate = 0, deficit if any expense', () => {
    const r1 = calculateBudget({
      income: 0,
      expenses: emptyExpenses(),
    });
    expect(r1.balance).toBe(0);
    expect(r1.savingsRate).toBe(0);
    expect(r1.isDeficit).toBe(false);

    const r2 = calculateBudget({
      income: 0,
      expenses: { ...emptyExpenses(), logement: 100 },
    });
    expect(r2.balance).toBe(-100);
    expect(r2.savingsRate).toBe(0);
    expect(r2.isDeficit).toBe(true);
  });

  it('breakdown shares sum to 100 when expenses > 0', () => {
    const r = calculateBudget({
      income: 10_000,
      expenses: { ...emptyExpenses(), logement: 3000, transport: 1500, loisirs: 500 },
    });
    const total = r.breakdown.reduce((s, b) => s + b.sharePct, 0);
    expect(Math.abs(total - 100)).toBeLessThan(0.0001);
  });

  it('breakdown shares = 0 when no expenses', () => {
    const r = calculateBudget({ income: 5000, expenses: emptyExpenses() });
    for (const b of r.breakdown) {
      expect(b.sharePct).toBe(0);
      expect(b.incomePct).toBe(0);
    }
  });

  it('clamps negative individual expenses to 0', () => {
    const r = calculateBudget({
      income: 5000,
      expenses: {
        ...emptyExpenses(),
        logement: -500,
        alimentation: 1000,
      },
    });
    expect(r.totalExpenses).toBe(1000);
  });
});

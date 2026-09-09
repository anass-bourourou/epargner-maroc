// -----------------------------------------------------------------------------
// Budget mensuel — cash-flow breakdown.
// -----------------------------------------------------------------------------

export const EXPENSE_KEYS = [
  'logement',
  'alimentation',
  'transport',
  'credits',
  'assurances',
  'loisirs',
  'abonnements',
  'autres',
] as const;

export type ExpenseKey = (typeof EXPENSE_KEYS)[number];

export type BudgetExpenses = Record<ExpenseKey, number>;

export interface BudgetInput {
  income: number;
  expenses: BudgetExpenses;
}

export interface BudgetBreakdownItem {
  key: ExpenseKey;
  label: string;
  amount: number;
  /** Share of total expenses, in percent. */
  sharePct: number;
  /** Share of income, in percent (0 when income = 0). */
  incomePct: number;
}

export interface BudgetResult {
  income: number;
  totalExpenses: number;
  /** Signed. Negative = déficit. */
  balance: number;
  /** Percent. 0 when income ≤ 0 OR balance ≤ 0. */
  savingsRate: number;
  /** True when expenses > income. */
  isDeficit: boolean;
  breakdown: BudgetBreakdownItem[];
}

const LABELS: Record<ExpenseKey, string> = {
  logement: 'Logement',
  alimentation: 'Alimentation',
  transport: 'Transport',
  credits: 'Crédits',
  assurances: 'Assurances',
  loisirs: 'Loisirs',
  abonnements: 'Abonnements',
  autres: 'Autres',
};

export function emptyExpenses(): BudgetExpenses {
  return EXPENSE_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as BudgetExpenses);
}

export function calculateBudget(input: BudgetInput): BudgetResult {
  const income = Math.max(0, input.income);
  const expenses = { ...emptyExpenses(), ...input.expenses };

  // Clamp individual expense values to ≥ 0
  for (const k of EXPENSE_KEYS) {
    expenses[k] = Math.max(0, expenses[k] ?? 0);
  }
  const totalExpenses = EXPENSE_KEYS.reduce((s, k) => s + expenses[k], 0);
  const balance = income - totalExpenses;
  const savingsRate = income > 0 && balance > 0 ? (balance / income) * 100 : 0;
  const isDeficit = balance < 0;

  const breakdown: BudgetBreakdownItem[] = EXPENSE_KEYS.map((k) => ({
    key: k,
    label: LABELS[k],
    amount: expenses[k],
    sharePct: totalExpenses > 0 ? (expenses[k] / totalExpenses) * 100 : 0,
    incomePct: income > 0 ? (expenses[k] / income) * 100 : 0,
  }));

  return {
    income,
    totalExpenses,
    balance,
    savingsRate,
    isDeficit,
    breakdown,
  };
}

export const EXPENSE_LABELS = LABELS;

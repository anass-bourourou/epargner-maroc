import { useMemo, useState } from 'react';
import {
  calculateBudget,
  EXPENSE_KEYS,
  EXPENSE_LABELS,
  type BudgetExpenses,
  type ExpenseKey,
} from '../../lib/calculations/budget';
import { parseWithDefault } from '../../lib/calculations/parse';
import { CalculatorField } from './CalculatorField';
import { ResultMetric } from './ResultMetric';
import { formatDH, formatPercent, roundDh } from './format';

const DEFAULT_INCOME = '10 000';
const DEFAULT_EXPENSES: Record<ExpenseKey, string> = {
  logement: '3 000',
  alimentation: '1 800',
  transport: '900',
  credits: '0',
  assurances: '400',
  loisirs: '500',
  abonnements: '250',
  autres: '350',
};

// Segment colors — restrained editorial palette, not a rainbow.
const SEG_COLORS: Record<ExpenseKey, string> = {
  logement: 'var(--color-forest-700)',
  alimentation: 'var(--color-forest-500)',
  transport: 'var(--color-sage-700)',
  credits: 'var(--color-terracotta-500)',
  assurances: 'var(--color-terracotta-700)',
  loisirs: 'var(--color-sage-500)',
  abonnements: 'var(--color-charcoal-700)',
  autres: 'var(--color-charcoal-500)',
};

export function BudgetCalculator() {
  const [income, setIncome] = useState(DEFAULT_INCOME);
  const [expenses, setExpenses] =
    useState<Record<ExpenseKey, string>>(DEFAULT_EXPENSES);

  const parsedExpenses: BudgetExpenses = useMemo(() => {
    const out = {} as BudgetExpenses;
    for (const k of EXPENSE_KEYS) {
      out[k] = parseWithDefault(expenses[k], 0);
    }
    return out;
  }, [expenses]);

  const parsedIncome = useMemo(() => parseWithDefault(income, 0), [income]);

  const result = useMemo(
    () => calculateBudget({ income: parsedIncome, expenses: parsedExpenses }),
    [parsedIncome, parsedExpenses],
  );

  const setExpense = (k: ExpenseKey, v: string) =>
    setExpenses((prev) => ({ ...prev, [k]: v }));

  const reset = () => {
    setIncome(DEFAULT_INCOME);
    setExpenses(DEFAULT_EXPENSES);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      {/* Inputs */}
      <section aria-labelledby="budget-inputs" className="lg:col-span-5">
        <h2 id="budget-inputs" className="overline mb-5">Revenus</h2>
        <CalculatorField
          label="Revenu mensuel net"
          value={income}
          onChange={setIncome}
          suffix="DH"
          helper="Toutes sources de revenu confondues, après cotisations."
        />

        <h3 className="overline mt-8 mb-4">Dépenses mensuelles</h3>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          {EXPENSE_KEYS.map((k) => (
            <CalculatorField
              key={k}
              label={EXPENSE_LABELS[k]}
              value={expenses[k]}
              onChange={(v) => setExpense(k, v)}
              suffix="DH"
              compact
            />
          ))}
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={reset}
            className="text-[0.8125rem] font-medium text-[color:var(--color-primary)] underline decoration-[color:var(--color-border-strong)] underline-offset-4 hover:decoration-current"
          >
            Réinitialiser
          </button>
        </div>
      </section>

      {/* Results */}
      <section
        aria-labelledby="budget-results"
        aria-live="polite"
        className="lg:col-span-7 lg:pl-10 lg:border-l lg:border-[color:var(--color-border)]"
      >
        <h2 id="budget-results" className="overline mb-5">Résultat</h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <ResultMetric
            label={result.isDeficit ? 'Déficit mensuel' : 'Reste mensuel'}
            value={formatDH(roundDh(Math.abs(result.balance))).replace(' DH', '')}
            suffix="DH"
            size="xl"
            tone={result.isDeficit ? 'negative' : 'accent'}
            description={
              result.isDeficit
                ? 'Vos dépenses dépassent vos revenus.'
                : `Solde disponible après dépenses`
            }
          />
          <ResultMetric
            label="Taux d'épargne"
            value={formatPercent(result.savingsRate / 100, 1).replace(' %', '')}
            suffix="%"
            size="xl"
            tone={result.savingsRate > 0 ? 'default' : 'negative'}
            description={
              result.savingsRate > 0
                ? 'Part du revenu non dépensée.'
                : 'Aucune capacité d’épargne sur ce mois.'
            }
          />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <ResultMetric
            label="Revenu total"
            value={formatDH(roundDh(result.income)).replace(' DH', '')}
            suffix="DH"
            size="md"
          />
          <ResultMetric
            label="Dépenses totales"
            value={formatDH(roundDh(result.totalExpenses)).replace(' DH', '')}
            suffix="DH"
            size="md"
            description={
              result.income > 0
                ? `${formatPercent(result.totalExpenses / result.income, 1)} du revenu`
                : undefined
            }
          />
        </div>

        {result.totalExpenses > 0 && (
          <BudgetBreakdownBar breakdown={result.breakdown} />
        )}

        <p className="mt-8 max-w-[60ch] text-[0.9375rem] leading-relaxed text-[color:var(--color-foreground-muted)]">
          {interpretation(result.balance, result.savingsRate, result.isDeficit)}
        </p>
      </section>
    </div>
  );
}

function interpretation(
  balance: number,
  savingsRate: number,
  isDeficit: boolean,
): string {
  if (isDeficit)
    return "Vos dépenses dépassent actuellement vos revenus mensuels. Identifier les postes ajustables est une première étape utile — le calculateur peut aider à visualiser la répartition.";
  if (balance === 0)
    return "Votre budget est équilibré au dirham près. Une marge de sécurité peut néanmoins être utile pour absorber les imprévus.";
  if (savingsRate < 5)
    return "Votre budget dégage une petite marge. Construire une épargne, même modeste, commence souvent par automatiser un virement dès la réception du salaire.";
  return "Votre budget présente un solde positif. Une répartition régulière entre épargne de précaution et objectifs à plus long terme est un point de départ utile.";
}

/** Horizontal stacked bar of expense categories. */
function BudgetBreakdownBar({
  breakdown,
}: {
  breakdown: ReturnType<typeof calculateBudget>['breakdown'];
}) {
  const visible = breakdown.filter((b) => b.amount > 0);
  if (visible.length === 0) return null;

  return (
    <figure className="mt-10 border-t border-[color:var(--color-border)] pt-6">
      <figcaption className="overline mb-3">Répartition des dépenses</figcaption>
      <div
        className="flex h-3 w-full overflow-hidden rounded-[var(--radius-xs)] border border-[color:var(--color-border)]"
        role="img"
        aria-label={`Répartition des dépenses par catégorie : ${visible
          .map((b) => `${b.label} ${Math.round(b.sharePct)}%`)
          .join(', ')}.`}
      >
        {visible.map((b) => (
          <span
            key={b.key}
            className="block h-full"
            style={{ width: `${b.sharePct}%`, background: SEG_COLORS[b.key] }}
          />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[0.8125rem] sm:grid-cols-3">
        {visible.map((b) => (
          <div key={b.key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0"
              style={{ background: SEG_COLORS[b.key] }}
            />
            <div className="min-w-0">
              <dt className="truncate text-[color:var(--color-foreground-muted)]">
                {b.label}
              </dt>
              <dd className="num font-medium text-[color:var(--color-foreground-strong)]">
                {formatDH(roundDh(b.amount))} · {Math.round(b.sharePct)}%
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </figure>
  );
}

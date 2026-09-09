import { useMemo, useState } from 'react';
import { calculateCredit, type CreditResult } from '../../lib/calculations/credit';
import { parseWithDefault, parseLocalNumber } from '../../lib/calculations/parse';
import { CalculatorField } from './CalculatorField';
import { ResultMetric } from './ResultMetric';
import { formatDH, formatPercent, roundDh } from './format';

const DEFAULTS = {
  principal: '100 000',
  rate: '5',
  years: '5',
};

export function CreditCalculator() {
  const [principal, setPrincipal] = useState(DEFAULTS.principal);
  const [rate, setRate] = useState(DEFAULTS.rate);
  const [years, setYears] = useState(DEFAULTS.years);

  const parsed = useMemo(
    () => ({
      principal: parseWithDefault(principal, 0),
      ratePct: parseWithDefault(rate, 0),
      years: parseWithDefault(years, 0),
    }),
    [principal, rate, years],
  );

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (parseLocalNumber(principal) !== null && parsed.principal <= 0)
      e.principal = 'Indiquez un montant emprunté supérieur à 0.';
    if (parsed.ratePct < 0) e.rate = 'Le taux ne peut pas être négatif.';
    if (parsed.years <= 0) e.years = 'Indiquez une durée supérieure à 0.';
    return e;
  }, [principal, parsed]);

  const result: CreditResult = useMemo(
    () =>
      calculateCredit({
        principal: parsed.principal,
        annualRate: parsed.ratePct / 100,
        years: parsed.years,
      }),
    [parsed],
  );

  const reset = () => {
    setPrincipal(DEFAULTS.principal);
    setRate(DEFAULTS.rate);
    setYears(DEFAULTS.years);
  };

  const hasError = Object.keys(errors).length > 0;
  const interestShare =
    result.totalPaid > 0 ? result.totalInterest / result.totalPaid : 0;

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <section aria-labelledby="credit-inputs" className="lg:col-span-5">
        <h2 id="credit-inputs" className="overline mb-5">Paramètres</h2>
        <CalculatorField
          label="Montant emprunté"
          value={principal}
          onChange={setPrincipal}
          suffix="DH"
          error={errors.principal}
        />
        <CalculatorField
          label="Taux annuel"
          value={rate}
          onChange={setRate}
          suffix="%"
          error={errors.rate}
          helper="Taux nominal, hors assurance et frais."
        />
        <CalculatorField
          label="Durée"
          value={years}
          onChange={setYears}
          suffix="ans"
          error={errors.years}
        />
        <div className="mt-2">
          <button
            type="button"
            onClick={reset}
            className="text-[0.8125rem] font-medium text-[color:var(--color-primary)] underline decoration-[color:var(--color-border-strong)] underline-offset-4 hover:decoration-current"
          >
            Réinitialiser
          </button>
        </div>
      </section>

      <section
        aria-labelledby="credit-results"
        aria-live="polite"
        className="lg:col-span-7 lg:pl-10 lg:border-l lg:border-[color:var(--color-border)]"
      >
        <h2 id="credit-results" className="overline mb-5">Résultat estimé</h2>

        {hasError && (
          <p className="mb-6 text-[0.875rem] text-[color:var(--color-terracotta-700)]">
            Corrigez les champs signalés pour afficher un résultat cohérent.
          </p>
        )}

        <ResultMetric
          label="Mensualité estimée"
          value={formatDH(roundDh(result.monthlyPayment)).replace(' DH', '')}
          suffix="DH / mois"
          size="xl"
          tone="accent"
          description={`Sur ${result.months} mois`}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <ResultMetric
            label="Montant emprunté"
            value={formatDH(roundDh(parsed.principal)).replace(' DH', '')}
            suffix="DH"
            size="md"
          />
          <ResultMetric
            label="Coût total du crédit"
            value={formatDH(roundDh(result.totalPaid)).replace(' DH', '')}
            suffix="DH"
            size="md"
          />
          <ResultMetric
            label="Total des intérêts"
            value={formatDH(roundDh(result.totalInterest)).replace(' DH', '')}
            suffix="DH"
            size="md"
            description={`Part des intérêts : ${formatPercent(interestShare, 1)}`}
          />
        </div>

        <CreditBreakdownBar
          principal={parsed.principal}
          interest={result.totalInterest}
        />
      </section>
    </div>
  );
}

/** Two-segment horizontal bar: capital emprunté vs intérêts payés. */
function CreditBreakdownBar({
  principal,
  interest,
}: {
  principal: number;
  interest: number;
}) {
  const total = Math.max(1, principal + interest);
  const principalPct = (principal / total) * 100;

  return (
    <figure
      className="mt-10 border-t border-[color:var(--color-border)] pt-6"
      aria-label={`Répartition du coût total : ${Math.round(principalPct)}% capital, ${Math.round(100 - principalPct)}% intérêts.`}
    >
      <figcaption className="overline mb-3">Composition du coût total</figcaption>
      <div className="flex h-3 w-full overflow-hidden rounded-[var(--radius-xs)] border border-[color:var(--color-border)]">
        <span
          className="block h-full bg-[color:var(--color-forest-700)]"
          style={{ width: `${principalPct}%` }}
        />
        <span
          className="block h-full flex-1 bg-[color:var(--color-terracotta-500)]"
        />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-[0.8125rem]">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-2 w-2 bg-[color:var(--color-forest-700)]" />
          <div>
            <dt className="text-[color:var(--color-foreground-muted)]">Capital</dt>
            <dd className="num font-medium text-[color:var(--color-foreground-strong)]">
              {formatDH(roundDh(principal))}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-2 w-2 bg-[color:var(--color-terracotta-500)]" />
          <div>
            <dt className="text-[color:var(--color-foreground-muted)]">Intérêts</dt>
            <dd className="num font-medium text-[color:var(--color-foreground-strong)]">
              {formatDH(roundDh(interest))}
            </dd>
          </div>
        </div>
      </dl>
    </figure>
  );
}

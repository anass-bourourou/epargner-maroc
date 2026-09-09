import { useMemo, useState } from 'react';
import { calculateSavings, type SavingsResult } from '../../lib/calculations/savings';
import { parseWithDefault, parseLocalNumber } from '../../lib/calculations/parse';
import { CalculatorField } from './CalculatorField';
import { ResultMetric } from './ResultMetric';
import { formatDH, formatPercent, roundDh } from './format';

const DEFAULTS = {
  initial: '10 000',
  monthly: '1 500',
  years: '5',
  rate: '2,5',
};

export function SavingsCalculator() {
  const [initial, setInitial] = useState(DEFAULTS.initial);
  const [monthly, setMonthly] = useState(DEFAULTS.monthly);
  const [years, setYears] = useState(DEFAULTS.years);
  const [rate, setRate] = useState(DEFAULTS.rate);

  const parsed = useMemo(
    () => ({
      initial: parseWithDefault(initial, 0),
      monthly: parseWithDefault(monthly, 0),
      years: parseWithDefault(years, 0),
      ratePct: parseWithDefault(rate, 0),
    }),
    [initial, monthly, years, rate],
  );

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (parseLocalNumber(initial) !== null && parsed.initial < 0)
      e.initial = 'Le montant initial ne peut pas être négatif.';
    if (parseLocalNumber(monthly) !== null && parsed.monthly < 0)
      e.monthly = 'Le versement mensuel ne peut pas être négatif.';
    if (parsed.years <= 0) e.years = 'Indiquez une durée supérieure à 0.';
    if (parsed.ratePct < 0) e.rate = 'Le taux ne peut pas être négatif.';
    return e;
  }, [initial, monthly, parsed]);

  const result: SavingsResult = useMemo(
    () =>
      calculateSavings({
        initial: parsed.initial,
        monthlyContribution: parsed.monthly,
        years: parsed.years,
        annualRate: parsed.ratePct / 100,
      }),
    [parsed],
  );

  const reset = () => {
    setInitial(DEFAULTS.initial);
    setMonthly(DEFAULTS.monthly);
    setYears(DEFAULTS.years);
    setRate(DEFAULTS.rate);
  };

  const hasError = Object.keys(errors).length > 0;

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      {/* Inputs */}
      <section
        aria-labelledby="savings-inputs"
        className="lg:col-span-5"
      >
        <h2 id="savings-inputs" className="overline mb-5">
          Paramètres
        </h2>
        <CalculatorField
          label="Montant initial"
          value={initial}
          onChange={setInitial}
          suffix="DH"
          error={errors.initial}
          helper="Somme déjà disponible au démarrage."
        />
        <CalculatorField
          label="Versement mensuel"
          value={monthly}
          onChange={setMonthly}
          suffix="DH"
          error={errors.monthly}
          helper="Montant épargné chaque mois."
        />
        <CalculatorField
          label="Durée"
          value={years}
          onChange={setYears}
          suffix="ans"
          error={errors.years}
        />
        <CalculatorField
          label="Taux annuel estimé"
          value={rate}
          onChange={setRate}
          suffix="%"
          error={errors.rate}
          helper="Estimation — dépend du produit d'épargne choisi."
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

      {/* Results */}
      <section
        aria-labelledby="savings-results"
        aria-live="polite"
        className="lg:col-span-7 lg:pl-10 lg:border-l lg:border-[color:var(--color-border)]"
      >
        <h2 id="savings-results" className="overline mb-5">
          Résultat estimé
        </h2>

        {hasError && (
          <p className="mb-6 text-[0.875rem] text-[color:var(--color-terracotta-700)]">
            Corrigez les champs signalés pour afficher un résultat cohérent.
          </p>
        )}

        <ResultMetric
          label="Capital final estimé"
          value={formatDH(roundDh(result.finalCapital)).replace(' DH', '')}
          suffix="DH"
          size="xl"
          tone="accent"
          description={`Après ${result.months} mois`}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <ResultMetric
            label="Total versé"
            value={formatDH(roundDh(result.totalContributed)).replace(' DH', '')}
            suffix="DH"
            size="md"
            description="Somme de vos versements"
          />
          <ResultMetric
            label="Intérêts estimés"
            value={formatDH(roundDh(result.totalInterest)).replace(' DH', '')}
            suffix="DH"
            size="md"
            description={
              result.totalContributed > 0
                ? `≈ ${formatPercent(result.totalInterest / result.totalContributed, 1)} du total versé`
                : '—'
            }
          />
        </div>

        <SavingsChart result={result} />
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Inline SVG chart — no external chart library. Shows contributed vs balance.
// -----------------------------------------------------------------------------
function SavingsChart({ result }: { result: SavingsResult }) {
  const series = result.monthlySeries;
  if (series.length < 2) return null;

  const W = 640;
  const H = 260;
  const P = { top: 30, right: 24, bottom: 30, left: 48 };
  const iw = W - P.left - P.right;
  const ih = H - P.top - P.bottom;

  const maxY = Math.max(1, result.finalCapital);
  const xAt = (m: number) => P.left + (m / result.months) * iw;
  const yAt = (v: number) => P.top + (1 - v / maxY) * ih;

  const balancePts = series.map((p) => `${xAt(p.month)},${yAt(p.balance)}`).join(' ');
  const contribPts = series.map((p) => `${xAt(p.month)},${yAt(p.contributed)}`).join(' ');
  const areaPath = `M ${series
    .map((p) => `${xAt(p.month)},${yAt(p.balance)}`)
    .join(' L ')} L ${xAt(result.months)},${yAt(0)} L ${xAt(0)},${yAt(0)} Z`;

  // Y ticks: 0, 25%, 50%, 75%, 100%
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxY);

  return (
    <figure className="mt-10">
      <figcaption className="overline mb-3">Évolution estimée</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Évolution de l'épargne : de ${formatDH(roundDh(series[0].balance))} à ${formatDH(roundDh(result.finalCapital))} sur ${result.months} mois.`}
        className="block h-auto w-full"
      >
        {/* Gridlines */}
        <g stroke="var(--color-border)" strokeWidth="1">
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={P.left}
              y1={yAt(t)}
              x2={W - P.right}
              y2={yAt(t)}
              strokeDasharray={i === 0 ? undefined : '1 4'}
            />
          ))}
        </g>
        {/* Y labels */}
        <g fill="var(--color-charcoal-400)" fontFamily="var(--font-sans)" fontSize="10" textAnchor="end">
          {ticks.map((t, i) => (
            <text key={i} x={P.left - 8} y={yAt(t) + 3} className="num">
              {t >= 1000 ? `${Math.round(t / 1000)}k` : Math.round(t)}
            </text>
          ))}
        </g>
        {/* X labels: years */}
        <g fill="var(--color-charcoal-500)" fontFamily="var(--font-sans)" fontSize="10" textAnchor="middle">
          {Array.from({ length: Math.max(2, Math.round(result.months / 12) + 1) }).map((_, i) => (
            <text key={i} x={xAt(i * 12)} y={H - 10} className="num">
              {i}
            </text>
          ))}
        </g>
        {/* Area under balance */}
        <path d={areaPath} fill="var(--color-sage-100)" fillOpacity="0.7" />
        {/* Contribution baseline */}
        <polyline
          points={contribPts}
          fill="none"
          stroke="var(--color-sage-500)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        {/* Balance curve */}
        <polyline
          points={balancePts}
          fill="none"
          stroke="var(--color-forest-700)"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        {/* End dot */}
        <circle
          cx={xAt(result.months)}
          cy={yAt(result.finalCapital)}
          r="4.5"
          fill="var(--color-forest-700)"
        />

        {/* Legend */}
        <g fontFamily="var(--font-sans)" fontSize="10.5">
          <line x1={P.left} y1={H - 4} x2={P.left + 20} y2={H - 4} stroke="var(--color-forest-700)" strokeWidth="1.75" />
          <text x={P.left + 26} y={H - 1} fill="var(--color-charcoal-700)">Épargne cumulée</text>
          <line x1={P.left + 160} y1={H - 4} x2={P.left + 180} y2={H - 4} stroke="var(--color-sage-500)" strokeDasharray="4 4" />
          <text x={P.left + 186} y={H - 1} fill="var(--color-charcoal-500)">Versements</text>
        </g>
      </svg>
    </figure>
  );
}

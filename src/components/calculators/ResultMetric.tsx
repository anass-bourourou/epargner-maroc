import type { ReactNode } from 'react';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  label?: string;
  value: string;
  suffix?: string;
  description?: string;
  size?: Size;
  tone?: 'default' | 'accent' | 'negative';
  children?: ReactNode;
}

/**
 * React mirror of the Astro <FinancialNumber> — same typography rules so
 * calculator results feel part of the same product.
 */
export function ResultMetric({
  label,
  value,
  suffix,
  description,
  size = 'lg',
  tone = 'default',
  children,
}: Props) {
  const sizes: Record<Size, string> = {
    sm: 'text-[1.5rem]',
    md: 'text-[2rem]',
    lg: 'text-[2.75rem]',
    xl: 'text-[clamp(3rem,5vw,4.5rem)]',
  };
  const toneColor =
    tone === 'accent'
      ? 'text-[color:var(--color-primary)]'
      : tone === 'negative'
        ? 'text-[color:var(--color-terracotta-700)]'
        : 'text-[color:var(--color-foreground-strong)]';

  return (
    <div className="flex flex-col items-start text-left">
      {label && <span className="overline mb-2">{label}</span>}
      <span
        className={`num font-[var(--font-display)] font-medium leading-[1.02] tracking-tight ${toneColor}`}
      >
        <span className={sizes[size]}>{value}</span>
        {suffix && (
          <span className="ml-1 align-baseline text-[0.5em] font-[var(--font-sans)] font-medium uppercase tracking-[0.12em] text-[color:var(--color-foreground-muted)]">
            {suffix}
          </span>
        )}
      </span>
      {description && (
        <p className="mt-2 text-[0.8125rem] text-[color:var(--color-foreground-muted)]">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

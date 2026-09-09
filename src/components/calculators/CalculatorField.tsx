import { useId } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  helper?: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  compact?: boolean;
}

/**
 * Localized numeric field. Uses `type="text"` + `inputMode="decimal"` rather
 * than `type="number"` — the native number spinner and locale coercion break
 * French input like "2,5" and "10 000". Parsing happens upstream via
 * `parseLocalNumber`.
 */
export function CalculatorField({
  label,
  value,
  onChange,
  suffix,
  helper,
  error,
  placeholder,
  autoComplete = 'off',
  compact = false,
}: Props) {
  const id = useId();
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={compact ? '' : 'mb-5'}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.875rem] font-medium text-[color:var(--color-foreground-strong)]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={[
            'num w-full h-11 rounded-[var(--radius-sm)] border bg-[color:var(--color-surface)] px-3 text-[0.9375rem]',
            'text-[color:var(--color-foreground-strong)] placeholder:text-[color:var(--color-foreground-subtle)]',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--color-forest-500)]/25',
            suffix ? 'pr-16' : '',
            error
              ? 'border-[color:var(--color-terracotta-700)] focus:border-[color:var(--color-terracotta-700)]'
              : 'border-[color:var(--color-border-strong)] focus:border-[color:var(--color-primary)]',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {suffix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[0.8125rem] text-[color:var(--color-foreground-muted)]"
          >
            {suffix}
          </span>
        )}
      </div>
      {helper && !error && (
        <p id={helperId} className="mt-1.5 text-[0.75rem] text-[color:var(--color-foreground-muted)]">
          {helper}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-[0.75rem] text-[color:var(--color-terracotta-700)]">
          {error}
        </p>
      )}
    </div>
  );
}

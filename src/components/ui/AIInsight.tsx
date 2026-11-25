'use client';

type AIInsightVariant = 'insight' | 'recommendation' | 'why' | 'adapted';

interface AIInsightProps {
  variant?: AIInsightVariant;
  label?: string;
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}

/* The variant now only names the observation. The tinted panel, the machine
   iconography and the pulsing dot are gone: an aside earns its place with a rule
   and a label, and the reader does not need to be told a machine wrote it. */
const VARIANT_LABEL: Record<AIInsightVariant, string> = {
  insight: 'INSIGHT',
  recommendation: 'RECOMMENDATION',
  why: 'WHY THIS',
  adapted: 'PATH ADAPTED',
};

export function AIInsight({
  variant = 'insight',
  label,
  children,
  compact = false,
  className = '',
}: AIInsightProps) {
  const displayLabel = label ?? VARIANT_LABEL[variant];

  return (
    <div
      className={`${compact ? 'pl-3' : 'pl-4'} ${className}`}
      style={{ borderLeft: '2px solid var(--k-edge)' }}
    >
      <div className="k-label mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {displayLabel}
      </div>

      <div className={compact ? 'text-[11px]' : 'text-xs'} style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

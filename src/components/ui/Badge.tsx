import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'violet' | 'cyan' | 'green' | 'amber' | 'rose' | 'muted' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

/* Every variant is a chip on the .k-badge model: square, one-pixel rule, display
   face. Only `amber` fills — the rest are ink-quiet chips whose accent carries the
   type and, via currentColor, the rule. Painting with the accent variables rather
   than Tailwind palette classes is what lets one badge sit on the dark room and on
   a paper sheet without a second code path. */
const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  violet: { color: 'var(--accent-violet-bright)', borderColor: 'currentColor' },
  cyan: { color: 'var(--accent-cyan-bright)', borderColor: 'currentColor' },
  green: { color: 'var(--accent-green-bright)', borderColor: 'currentColor' },
  rose: { color: 'var(--accent-rose)', borderColor: 'currentColor' },
  amber: {},
  muted: { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' },
  outline: {},
};

/* Inline, because .k-badge is unlayered CSS and outranks Tailwind's padding and
   font-size utilities. Nothing drops below 11px — a badge is read, not decoration. */
const SIZE_STYLES: Record<string, React.CSSProperties> = {
  xs: { fontSize: 11, padding: '0.0625rem 0.3125rem', letterSpacing: '0.08em' },
  sm: { fontSize: 11, padding: '0.125rem 0.4375rem' },
  md: { fontSize: 12, padding: '0.25rem 0.625rem' },
};

export function Badge({ children, variant = 'muted', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn('k-badge', variant !== 'amber' && 'k-badge-quiet', className)}
      style={{ ...VARIANT_STYLES[variant], ...SIZE_STYLES[size] }}
    >
      {children}
    </span>
  );
}

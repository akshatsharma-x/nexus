import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'violet' | 'cyan' | 'green' | 'amber' | 'rose' | 'muted' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'muted', size = 'sm', className }: BadgeProps) {
  const variants = {
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    muted: 'bg-white/5 text-slate-400 border-white/10',
    outline: 'bg-transparent text-slate-400 border-white/15',
  };
  const sizes = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-medium',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}

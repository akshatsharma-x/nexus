'use client';

import { motion } from 'framer-motion';
import { Zap, GitBranch, HelpCircle, Activity, type LucideIcon } from 'lucide-react';

type AIInsightVariant = 'insight' | 'recommendation' | 'why' | 'adapted';

interface AIInsightProps {
  variant?: AIInsightVariant;
  label?: string;
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}

const VARIANT_CONFIG: Record<
  AIInsightVariant,
  { icon: LucideIcon; label: string; color: string; bg: string; border: string }
> = {
  insight: {
    icon: Zap,
    label: 'NEXUS INSIGHT',
    color: 'var(--accent-violet-bright)',
    bg: 'rgba(124, 58, 237, 0.08)',
    border: 'rgba(124, 58, 237, 0.2)',
  },
  recommendation: {
    icon: Activity,
    label: 'AI RECOMMENDATION',
    color: 'var(--accent-violet-bright)',
    bg: 'rgba(124, 58, 237, 0.08)',
    border: 'rgba(124, 58, 237, 0.2)',
  },
  why: {
    icon: HelpCircle,
    label: 'WHY THIS',
    color: 'var(--accent-cyan)',
    bg: 'rgba(6, 182, 212, 0.06)',
    border: 'rgba(6, 182, 212, 0.2)',
  },
  adapted: {
    icon: GitBranch,
    label: 'PATH ADAPTED',
    color: 'var(--accent-green)',
    bg: 'rgba(16, 185, 129, 0.06)',
    border: 'rgba(16, 185, 129, 0.2)',
  },
};

export function AIInsight({
  variant = 'insight',
  label,
  children,
  compact = false,
  className = '',
}: AIInsightProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  const displayLabel = label ?? config.label;

  return (
    <div
      className={`rounded-xl ${compact ? 'p-2.5' : 'p-3.5'} ${className}`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-1.5 mb-2">
        {/* Animated dot indicator */}
        <motion.div
          className="w-1 h-1 rounded-full flex-shrink-0"
          style={{ background: config.color }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          aria-hidden="true"
        />
        <Icon size={10} style={{ color: config.color, flexShrink: 0 }} aria-hidden="true" />
        <span
          className="text-[9px] font-bold tracking-widest uppercase"
          style={{ color: config.color }}
        >
          {displayLabel}
        </span>
      </div>

      {/* Content */}
      <div className={compact ? 'text-[11px]' : 'text-[12px]'} style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { skillLevelLabel } from '@/lib/utils';
import type { SkillLevel } from '@/lib/types';

interface SkillBarProps {
  name: string;
  level: SkillLevel;
  score: number;
  showLabel?: boolean;
  compact?: boolean;
  delay?: number;
}

export function SkillBar({ name, level, score, showLabel = true, compact = false, delay = 0 }: SkillBarProps) {
  /* The ramp is read from the variable rather than skillLevelColor() because
     .k-paper re-cuts every --skill-* step for cream; the literal hex is tuned for
     the dark room only and drops to ~2:1 on stock. */
  const color = `var(--skill-${level})`;

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {showLabel && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{name}</span>
          <div className="flex items-center gap-2 flex-none">
            <span className="k-badge k-badge-quiet"
              style={{ color, borderColor: 'currentColor', padding: '0.0625rem 0.3125rem', letterSpacing: '0.08em' }}>
              {skillLevelLabel(level)}
            </span>
            <span className="k-figure text-[11px]" style={{ color: 'var(--text-muted)' }}>{score}%</span>
          </div>
        </div>
      )}
      <div className="k-meter" style={{ height: compact ? 6 : 8 }}>
        <motion.div
          className="k-meter-fill"
          /* The class carries a CSS width transition, which would fight the
             per-frame width Framer writes here. */
          style={{ background: color, transition: 'none' }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

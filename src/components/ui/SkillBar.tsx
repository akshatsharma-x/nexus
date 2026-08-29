'use client';

import { motion } from 'framer-motion';
import { skillLevelColor, skillLevelLabel } from '@/lib/utils';
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
  const color = skillLevelColor(level);

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{name}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
              {skillLevelLabel(level)}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{score}%</span>
          </div>
        </div>
      )}
      <div className="relative h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--bg-overlay)' }}>
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99 0%, ${color} 100%)` }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
    </div>
  );
}

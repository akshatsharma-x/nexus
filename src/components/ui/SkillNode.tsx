'use client';

import { motion } from 'framer-motion';
import type { SkillLevel } from '@/lib/types';
import { skillLevelColor, skillLevelLabel } from '@/lib/utils';

type SkillNodeState = 'mastered' | 'strong' | 'developing' | 'weak' | 'locked' | 'recommended';

interface SkillNodeProps {
  name: string;
  icon?: string;
  level?: SkillLevel;
  score?: number;
  state?: SkillNodeState;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showLabel?: boolean;
  showScore?: boolean;
}

function deriveState(level?: SkillLevel, score?: number): SkillNodeState {
  const s = score ?? 0;
  if (!level || (level === 'novice' && s === 0)) return 'locked';
  if (level === 'master' || level === 'expert') return 'mastered';
  if (level === 'advanced') return 'strong';
  if (level === 'intermediate') return 'developing';
  return 'weak';
}

const SIZES = {
  sm: { node: 48, font: 20, label: 48 },
  md: { node: 64, font: 26, label: 68 },
  lg: { node: 80, font: 32, label: 84 },
};

export function SkillNode({
  name,
  icon = '🧠',
  level,
  score,
  state: stateProp,
  size = 'md',
  onClick,
  showLabel = true,
  showScore = true,
}: SkillNodeProps) {
  const state = stateProp ?? deriveState(level, score);
  const color = level ? skillLevelColor(level) : 'var(--text-muted)';
  const dim = SIZES[size];
  const isLocked = state === 'locked';
  const isRecommended = state === 'recommended';

  return (
    <motion.button
      className="flex flex-col items-center gap-1.5"
      onClick={onClick}
      whileHover={!isLocked ? { scale: 1.06 } : {}}
      whileTap={!isLocked ? { scale: 0.96 } : {}}
      style={{ cursor: onClick ? 'pointer' : isLocked ? 'not-allowed' : 'default' }}
      aria-label={`${name}${level ? ` — ${skillLevelLabel(level)}` : ''}${score !== undefined ? `, ${score}%` : ''}`}
    >
      {/* Node */}
      <div className="relative" style={{ width: dim.node, height: dim.node }}>
        {/* Main circle */}
        <div
          className="absolute inset-0 rounded-xl flex items-center justify-center"
          style={{
            background: isLocked ? 'var(--bg-elevated)' : `${color}18`,
            border: isLocked
              ? '2px dashed var(--border-subtle)'
              : `2px solid ${color}`,
            boxShadow:
              state === 'mastered'
                ? `0 0 20px ${color}50, 0 0 6px ${color}30`
                : state === 'strong'
                ? `0 0 12px ${color}35`
                : 'none',
            opacity: isLocked ? 0.45 : 1,
          }}
        >
          <span
            style={{ fontSize: dim.font, lineHeight: 1 }}
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>

        {/* Recommended orbit */}
        {isRecommended && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{ border: `2px dashed ${color}`, borderStyle: 'dashed' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />
        )}

        {/* Score badge */}
        {showScore && score !== undefined && score > 0 && !isLocked && (
          <div
            className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold"
            style={{ background: color, color: 'white', lineHeight: 1.3 }}
            aria-hidden="true"
          >
            {score}
          </div>
        )}

        {/* Lock badge */}
        {isLocked && (
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}
            aria-hidden="true"
          >
            🔒
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div
          className="text-[10px] font-medium text-center leading-tight"
          style={{
            color: isLocked ? 'var(--text-muted)' : 'var(--text-primary)',
            maxWidth: dim.label,
          }}
        >
          {name}
        </div>
      )}
    </motion.button>
  );
}

'use client';

import { motion } from 'framer-motion';
import type { SkillLevel } from '@/lib/types';
import { skillLevelLabel } from '@/lib/utils';

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

/* Depth replaces the old glow: mastery casts a hard ink offset, a recommendation
   casts an amber one. Both are drawn blocks, so they survive on cream. */
const STATE_SHADOW: Partial<Record<SkillNodeState, string>> = {
  mastered: 'var(--k-shadow-sm)',
  recommended: '3px 3px 0 0 var(--amber)',
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
  /* The ramp variable rather than skillLevelColor(): .k-paper re-cuts every
     --skill-* step for cream, where the dark-room hex would fall to ~2:1. */
  const color = level ? `var(--skill-${level})` : 'var(--text-muted)';
  const dim = SIZES[size];
  const isLocked = state === 'locked';

  return (
    <motion.button
      className="flex flex-col items-center gap-2"
      onClick={onClick}
      whileHover={!isLocked ? { scale: 1.06 } : {}}
      whileTap={!isLocked ? { scale: 0.96 } : {}}
      style={{ cursor: onClick ? 'pointer' : isLocked ? 'not-allowed' : 'default' }}
      aria-label={`${name}${level ? ` — ${skillLevelLabel(level)}` : ''}${score !== undefined ? `, ${score}%` : ''}`}
    >
      {/* Node */}
      <div className="relative" style={{ width: dim.node, height: dim.node }}>
        {/* Main block */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: isLocked ? 'transparent' : 'var(--bg-surface)',
            border: isLocked ? '2px dashed var(--k-edge)' : `2px solid ${color}`,
            boxShadow: isLocked ? undefined : STATE_SHADOW[state],
            opacity: isLocked ? 0.55 : 1,
          }}
        >
          <span
            style={{ fontSize: dim.font, lineHeight: 1 }}
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>

        {/* Score badge */}
        {showScore && score !== undefined && score > 0 && !isLocked && (
          <div
            className="absolute -bottom-2 -right-2 px-1.5"
            style={{
              background: 'var(--amber)',
              color: 'var(--ink)',
              border: '1px solid var(--k-edge)',
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.5,
            }}
            aria-hidden="true"
          >
            {score}
          </div>
        )}

        {/* Lock badge */}
        {isLocked && (
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--k-edge)' }}
            aria-hidden="true"
          >
            🔒
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div
          className="text-[11px] font-medium text-center leading-tight"
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

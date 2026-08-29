'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion, AnimatePresence, motion } from 'framer-motion';
import type { LearningSphereProps, SphereSkill } from '@/lib/visualization/sphereTypes';
import type { SphereSceneProps, LabelInfo } from './SphereScene';

// ─── Dynamic import — no SSR (WebGL is client-only) ──────────────────────────

const SphereSceneComponent = dynamic<SphereSceneProps>(
  () => import('./SphereScene').then(m => ({ default: m.SphereScene })),
  {
    ssr: false,
    loading: () => <SpherePlaceholder />,
  }
);

// ─── Loading placeholder ──────────────────────────────────────────────────────

function SpherePlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="w-52 h-52 rounded-full"
        style={{
          background: 'radial-gradient(circle at 40% 35%, rgba(124,58,237,0.12), rgba(6,182,212,0.04) 60%, transparent)',
          animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        }}
      />
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const MASTERY_LABEL: Record<SphereSkill['mastery'], string> = {
  mastered:   'Mastered',
  strong:     'Strong',
  developing: 'Developing',
  weak:       'Weak',
  locked:     'Not started',
};

const MASTERY_COLOR: Record<SphereSkill['mastery'], string> = {
  mastered:   'var(--accent-green)',
  strong:     'var(--accent-violet-bright)',
  developing: 'var(--accent-cyan)',
  weak:       'var(--accent-amber)',
  locked:     'var(--text-muted)',
};

interface TooltipState {
  skill: SphereSkill;
  x: number;
  y: number;
}

// ─── LearningSphere ───────────────────────────────────────────────────────────

export function LearningSphere({
  skills,
  connections,
  selectedSkillId,
  recommendedSkillIds = [],
  goalSkillId,
  interactive = true,
  onSkillSelect,
  className,
  height = 480,
}: LearningSphereProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [autoLabels, setAutoLabels] = useState<LabelInfo[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleHoverChange = useCallback((
    skill: SphereSkill | null,
    screenX: number,
    screenY: number,
  ) => {
    if (skill) {
      setTooltip({ skill, x: screenX, y: screenY });
    } else {
      setTooltip(null);
    }
  }, []);

  const handleSkillSelect = useCallback((id: string | null) => {
    onSkillSelect?.(id);
  }, [onSkillSelect]);

  const handleLabelsUpdate = useCallback((labels: LabelInfo[]) => {
    setAutoLabels(labels);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', height, userSelect: 'none' }}
      aria-label="Knowledge sphere"
    >
      {/* Accessible text alternative — screen readers and keyboard nav */}
      <ul className="sr-only" aria-label="Skill map — text list">
        {skills.map(s => (
          <li key={s.id}>
            <button onClick={() => handleSkillSelect(s.id)}>
              {s.name} — {MASTERY_LABEL[s.mastery]}
              {s.isRecommended ? ' (recommended next)' : ''}
              {s.isGoal ? ' (goal destination)' : ''}
            </button>
          </li>
        ))}
      </ul>

      <SphereSceneComponent
        skills={skills}
        connections={connections}
        selectedSkillId={selectedSkillId ?? null}
        recommendedSkillIds={recommendedSkillIds}
        goalSkillId={goalSkillId ?? null}
        onSkillSelect={interactive ? handleSkillSelect : () => {}}
        reducedMotion={reducedMotion}
        onHoverChange={handleHoverChange}
        onLabelsUpdate={handleLabelsUpdate}
      />

      {/* Auto-reveal labels: appear as nodes rotate to front, fade out as they go back */}
      <AnimatePresence>
        {!reducedMotion && autoLabels.map(label => (
          <motion.div
            key={label.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: label.opacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: `${label.y}px`,
              left: `${label.x}px`,
              transform: 'translate(-50%, calc(-100% - 10px))',
              transition: 'top 66ms linear, left 66ms linear',
              pointerEvents: 'none',
              zIndex: 12,
              textAlign: 'center',
            }}
          >
            <div style={{
              display: 'inline-block',
              background: 'rgba(8, 8, 15, 0.86)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 7,
              padding: '4px 9px',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.55)',
              lineHeight: 1,
            }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
                {label.name}
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.07em', marginTop: 3, color: MASTERY_COLOR[label.mastery], whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                {MASTERY_LABEL[label.mastery]}
              </div>
            </div>
            {/* Connector tick */}
            <div style={{
              width: 1,
              height: 6,
              background: 'rgba(255,255,255,0.18)',
              margin: '0 auto',
            }} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 14, (containerRef.current?.offsetWidth ?? 400) - 130),
            top: Math.max(tooltip.y - 36, 8),
            pointerEvents: 'none',
            zIndex: 20,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '6px 10px',
            minWidth: 110,
          }}
        >
          <div
            className="text-[12px] font-medium leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            {tooltip.skill.name}
          </div>
          <div
            className="text-[10px] mt-0.5"
            style={{ color: MASTERY_COLOR[tooltip.skill.mastery] }}
          >
            {MASTERY_LABEL[tooltip.skill.mastery]}
            {tooltip.skill.isRecommended && ' · next'}
            {tooltip.skill.isGoal && ' · goal'}
          </div>
        </div>
      )}
    </div>
  );
}

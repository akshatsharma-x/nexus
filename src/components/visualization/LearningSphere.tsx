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
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <div className="k-panel-flat w-12 h-12 flex items-center justify-center">
        {/* Genuine loading indicator, so the repeat is kept; the global
            reduced-motion rule stops it for users who ask. */}
        <div className="w-3 h-3 animate-pulse" style={{ background: 'var(--amber)' }} />
      </div>
      <span className="k-label" style={{ color: 'var(--text-secondary)' }}>
        Loading map
      </span>
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

// Text colours for the chrome, not swatches: --text-muted is a dot colour in the
// legend but fails as 11px type on the near-black chip, so locked reads secondary.
const MASTERY_COLOR: Record<SphereSkill['mastery'], string> = {
  mastered:   'var(--accent-green)',
  strong:     'var(--accent-violet-bright)',
  developing: 'var(--accent-cyan)',
  weak:       'var(--accent-amber)',
  locked:     'rgba(242, 239, 233, 0.62)',
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
            {/* The chip is a plate on the instrument, not a sheet of stock, so
                it keeps the room's palette in literal values: the sphere may be
                dropped into either surface scope and this must stay legible on
                the dark canvas underneath it either way. */}
            <div className="k-panel-flat" style={{
              display: 'inline-block',
              background: 'rgba(8, 8, 15, 0.88)',
              padding: '4px 8px',
              lineHeight: 1,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--paper)', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
                {label.name}
              </div>
              <div className="k-label" style={{ marginTop: 4, color: MASTERY_COLOR[label.mastery], whiteSpace: 'nowrap' }}>
                {MASTERY_LABEL[label.mastery]}
              </div>
            </div>
            {/* Connector tick */}
            <div style={{
              width: 1,
              height: 6,
              background: 'rgba(242, 239, 233, 0.28)',
              margin: '0 auto',
            }} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          aria-hidden="true"
          className="k-panel"
          style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 14, (containerRef.current?.offsetWidth ?? 400) - 130),
            top: Math.max(tooltip.y - 36, 8),
            pointerEvents: 'none',
            zIndex: 20,
            background: 'rgba(8, 8, 15, 0.92)',
            padding: '6px 10px',
            minWidth: 110,
          }}
        >
          <div
            className="text-[12px] leading-snug"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--paper)' }}
          >
            {tooltip.skill.name}
          </div>
          <div
            className="k-label mt-1"
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

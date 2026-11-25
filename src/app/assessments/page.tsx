'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Target, ChevronRight, CheckCircle } from 'lucide-react';
import { ASSESSMENTS, SKILLS } from '@/lib/data/seed';
import { useAssessmentResults } from '@/lib/context/AssessmentContext';
import { Tabs } from '@/components/ui/Tabs';
import { difficultyLabel } from '@/lib/utils';
import type { StoredResult } from '@/lib/context/AssessmentContext';

function AssessmentCard({
  assessment,
  index,
  storedResult,
}: {
  assessment: typeof ASSESSMENTS[0];
  index: number;
  storedResult?: StoredResult;
}) {
  const skillNames = assessment.skillIds
    .map(id => SKILLS.find(s => s.id === id)?.name)
    .filter(Boolean);
  const diffColors = [
    '',
    'var(--accent-green)',
    'var(--accent-cyan)',
    'var(--accent-amber)',
    'var(--accent-rose)',
    '#dc2626',
  ];
  const diffColor = diffColors[assessment.difficulty] ?? 'var(--text-muted)';
  const result = storedResult?.result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="py-5"
      style={{ borderTop: index === 0 ? undefined : '2px solid var(--border-strong)' }}
    >
      <div className="flex items-start gap-4">
        {/* Left: content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="k-badge k-badge-quiet">{assessment.type}</span>
            <span className="k-label" style={{ color: diffColor }}>
              {difficultyLabel(assessment.difficulty)}
            </span>
            {result?.passed && (
              <CheckCircle size={12} style={{ color: 'var(--accent-green)' }} />
            )}
          </div>

          <h3 className="k-display-sm mb-2">{assessment.title}</h3>
          <p
            className="text-xs mb-3 leading-relaxed"
            style={{ color: 'var(--text-secondary)', maxWidth: 520 }}
          >
            {assessment.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {skillNames.map(name => (
              <span key={name} className="k-badge k-badge-quiet">
                {name}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="k-label flex items-center gap-1.5">
              <Clock size={11} /> {assessment.estimatedMinutes}m
            </span>
            <span
              className="k-label flex items-center gap-1.5"
              style={{ color: 'var(--accent-amber)' }}
            >
              <Star size={11} /> +{assessment.xpReward} XP
            </span>
            <span className="k-label flex items-center gap-1.5">
              <Target size={11} /> Pass: {assessment.passingScore}%
            </span>
            <span className="k-label">5 questions</span>
          </div>

          {result && (
            <div className="mt-2.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {result.timeTakenMinutes}m ·{' '}
              <span
                style={{
                  color: result.passed ? 'var(--accent-green)' : 'var(--accent-rose)',
                  fontWeight: 600,
                }}
              >
                {result.score}% {result.passed ? '✓ Passed' : '✗ Not passed'}
              </span>
            </div>
          )}
        </div>

        {/* Right: CTA */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2.5">
          {result ? (
            <>
              <div
                className="k-figure text-2xl"
                style={{ color: result.passed ? 'var(--accent-green)' : 'var(--accent-rose)' }}
              >
                {result.score}%
              </div>
              <div className="flex gap-1.5">
                <a
                  href={`/assessments/${assessment.id}`}
                  className="k-btn k-btn-outline"
                  style={{ padding: '0.375rem 0.625rem', fontSize: 11, boxShadow: 'none' }}
                >
                  Review
                </a>
                <a
                  href={`/assessments/${assessment.id}`}
                  className="k-btn k-btn-outline"
                  style={{ padding: '0.375rem 0.625rem', fontSize: 11, boxShadow: 'none' }}
                >
                  Retake
                </a>
              </div>
            </>
          ) : (
            <a
              href={`/assessments/${assessment.id}`}
              className="k-btn k-btn-solid"
              style={{ padding: '0.5rem 0.875rem' }}
            >
              Start <ChevronRight size={12} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'completed'>('all');
  const { loaded, storedResults } = useAssessmentResults();

  const completedIds = Object.keys(storedResults).filter(id => storedResults[id]?.result.passed);
  const attemptedIds = Object.keys(storedResults);

  const passedCount = completedIds.length;
  const scores = Object.values(storedResults).map(sr => sr.result.score);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  const visibleAssessments = ASSESSMENTS.filter(a => {
    if (activeTab === 'completed') return attemptedIds.includes(a.id);
    if (activeTab === 'recommended') return !attemptedIds.includes(a.id);
    return true;
  });

  // Recommended next: first not-yet-attempted assessment
  const recommendedNext = ASSESSMENTS.find(a => !attemptedIds.includes(a.id));

  return (
    <div className="max-w-3xl">

      {/* ── Header — sits directly on the dark room ───────────────────────── */}
      <header className="mb-6">
        <div className="k-slug mb-3">Assessments</div>
        <h1 className="k-display mb-4">Verify what you know.</h1>
        <p className="nx-support" style={{ maxWidth: 560 }}>
          Assessments turn estimated skill levels into verified evidence.
          Each one you pass strengthens your learning path and your Skill Passport.
        </p>
        <div className="flex gap-8 mt-5">
          <div>
            <div className="k-figure text-2xl" style={{ color: 'var(--accent-green)' }}>
              {passedCount}
            </div>
            <div className="k-label mt-1">Passed</div>
          </div>
          {scores.length > 0 && (
            <div>
              <div className="k-figure text-2xl" style={{ color: 'var(--accent-cyan)' }}>
                {avgScore}%
              </div>
              <div className="k-label mt-1">Avg score</div>
            </div>
          )}
          <div>
            <div className="k-figure text-2xl">
              {ASSESSMENTS.length - attemptedIds.length}
            </div>
            <div className="k-label mt-1">Available</div>
          </div>
        </div>
      </header>

      {/* ── Recommended next — the one primary object on this view ────────── */}
      {recommendedNext && (
        <motion.div
          className="k-paper k-panel-hero p-5 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="k-slug mb-2">Recommended next</div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 420 }}>
              Take the{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{recommendedNext.title}</strong> —
              passing calibrates your mastery and strengthens your Skill Passport.
            </p>
            <a
              href={`/assessments/${recommendedNext.id}`}
              className="k-btn k-btn-solid flex-shrink-0"
            >
              Start now
            </a>
          </div>
        </motion.div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <Tabs
          tabs={[
            { id: 'all', label: 'All', badge: ASSESSMENTS.length },
            {
              id: 'recommended',
              label: 'Recommended',
              badge: ASSESSMENTS.length - attemptedIds.length,
            },
            { id: 'completed', label: 'Completed', badge: attemptedIds.length },
          ]}
          active={activeTab}
          onChange={id => setActiveTab(id as typeof activeTab)}
        />
      </div>

      {/* ── Assessment list ───────────────────────────────────────────────── */}
      <div className="k-paper k-panel px-5 py-1">
        {loaded && visibleAssessments.length === 0 && (
          <p
            className="py-8 text-sm text-center"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {activeTab === 'completed'
              ? 'No completed assessments yet.'
              : 'All assessments have been started.'}
          </p>
        )}
        {visibleAssessments.map((assessment, i) => (
          <AssessmentCard
            key={assessment.id}
            assessment={assessment}
            index={i}
            storedResult={storedResults[assessment.id]}
          />
        ))}
      </div>
    </div>
  );
}

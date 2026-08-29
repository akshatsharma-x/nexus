'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Target, ChevronRight, CheckCircle } from 'lucide-react';
import { ASSESSMENTS, SKILLS } from '@/lib/data/seed';
import { useAssessmentResults } from '@/lib/context/AssessmentContext';
import { Badge } from '@/components/ui/Badge';
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
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-start gap-4">
        {/* Left: content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge
              variant={
                assessment.type === 'quiz'
                  ? 'cyan'
                  : assessment.type === 'project'
                  ? 'green'
                  : 'violet'
              }
              size="xs"
            >
              {assessment.type}
            </Badge>
            <span className="text-[10px] font-medium" style={{ color: diffColor }}>
              {difficultyLabel(assessment.difficulty)}
            </span>
            {result?.passed && (
              <CheckCircle size={11} style={{ color: 'var(--accent-green)' }} />
            )}
          </div>

          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {assessment.title}
          </h3>
          <p
            className="text-xs mb-2.5 leading-relaxed"
            style={{ color: 'var(--text-secondary)', maxWidth: 520 }}
          >
            {assessment.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {skillNames.map(name => (
              <span
                key={name}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--accent-violet-bright)' }}
              >
                {name}
              </span>
            ))}
          </div>

          <div
            className="flex items-center gap-4 text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="flex items-center gap-1">
              <Clock size={9} /> {assessment.estimatedMinutes}m
            </span>
            <span
              className="flex items-center gap-1"
              style={{ color: 'var(--accent-amber)' }}
            >
              <Star size={9} /> +{assessment.xpReward} XP
            </span>
            <span className="flex items-center gap-1">
              <Target size={9} /> Pass: {assessment.passingScore}%
            </span>
            <span>5 questions</span>
          </div>

          {result && (
            <div className="mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
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
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          {result ? (
            <>
              <div
                className="text-xl font-bold"
                style={{ color: result.passed ? 'var(--accent-green)' : 'var(--accent-rose)' }}
              >
                {result.score}%
              </div>
              <div className="flex gap-1.5">
                <motion.a
                  href={`/assessments/${assessment.id}`}
                  className="text-[10px] px-2.5 py-1 rounded-lg"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                  whileHover={{ scale: 1.04 }}
                >
                  Review
                </motion.a>
                <motion.a
                  href={`/assessments/${assessment.id}`}
                  className="text-[10px] px-2.5 py-1 rounded-lg"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                  whileHover={{ scale: 1.04 }}
                >
                  Retake
                </motion.a>
              </div>
            </>
          ) : (
            <motion.a
              href={`/assessments/${assessment.id}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'var(--accent-violet)', color: 'white' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Start <ChevronRight size={11} />
            </motion.a>
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

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Assessments
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Verify what you know.
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Assessments turn estimated skill levels into verified evidence.
          Each one you pass strengthens your learning path and your Skill Passport.
        </p>
        <div className="flex gap-6 mt-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span>
            <span className="font-semibold" style={{ color: 'var(--accent-green)' }}>
              {passedCount}
            </span>{' '}
            passed
          </span>
          {scores.length > 0 && (
            <span>
              <span className="font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                {avgScore}%
              </span>{' '}
              avg score
            </span>
          )}
          <span>
            <span
              className="font-semibold"
              style={{ color: 'var(--text-secondary)' }}
            >
              {ASSESSMENTS.length - attemptedIds.length}
            </span>{' '}
            available
          </span>
        </div>
      </div>

      {/* ── Recommended next ─────────────────────────────────────────────── */}
      {recommendedNext && (
        <motion.div
          className="mb-6 p-4 rounded-xl"
          style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className="text-[10px] font-bold tracking-[0.14em] uppercase mb-2"
            style={{ color: 'var(--accent-violet-bright)' }}
          >
            Recommended next
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Take the{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{recommendedNext.title}</strong> —
              passing calibrates your mastery and strengthens your Skill Passport.
            </p>
            <motion.a
              href={`/assessments/${recommendedNext.id}`}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'var(--accent-violet)', color: 'white' }}
              whileHover={{ scale: 1.04 }}
            >
              Start now
            </motion.a>
          </div>
        </motion.div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="mb-2">
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
      <div>
        {loaded && visibleAssessments.length === 0 && (
          <p
            className="py-8 text-sm text-center"
            style={{ color: 'var(--text-muted)' }}
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

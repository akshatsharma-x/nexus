'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ArrowRight, AlertCircle, Clock, Target,
} from 'lucide-react';
import { ASSESSMENTS, SKILLS, ACTIVE_PATH, DEMO_LEARNER_CONTEXT } from '@/lib/data/seed';
import { AssessmentService } from '@/lib/services/assessment';
import { useJourneyProgress } from '@/lib/context/JourneyProgressContext';
import { useMastery } from '@/lib/context/MasteryContext';
import { useAssessmentResults } from '@/lib/context/AssessmentContext';
import type { PerSkillPercent } from '@/lib/context/AssessmentContext';
import { difficultyLabel } from '@/lib/utils';
import type { AssessmentSession, AssessmentSubmission } from '@/lib/types';

type PageView = 'loading' | 'intro' | 'active' | 'results';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computePerSkillPercents(
  session: AssessmentSession,
  answers: Record<string, string>,
): PerSkillPercent[] {
  const map: Record<string, { correct: number; total: number }> = {};
  for (const q of session.questions) {
    if (!map[q.skillId]) map[q.skillId] = { correct: 0, total: 0 };
    map[q.skillId].total++;
    if (answers[q.id] === q.correctAnswer) map[q.skillId].correct++;
  }
  return Object.entries(map).map(([skillId, { correct, total }]) => ({
    skillId,
    percent: total > 0 ? Math.round((correct / total) * 100) : 0,
  }));
}

function deriveInsight(
  passed: boolean,
  perSkillPercents: PerSkillPercent[],
  assessmentId: string,
): string {
  if (perSkillPercents.length === 0) return 'Mastery scores have been updated.';

  const getSkillName = (id: string) => SKILLS.find(s => s.id === id)?.name ?? id;
  const sorted = [...perSkillPercents].sort((a, b) => b.percent - a.percent);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  if (!passed) {
    if (perSkillPercents.length > 1 && strongest.percent - weakest.percent >= 20) {
      return `Your strongest area was ${getSkillName(strongest.skillId)} (${strongest.percent}%). Focusing on ${getSkillName(weakest.skillId)} before retaking will have the most impact.`;
    }
    return 'Review the core concepts and try again when ready. The resources on your learning path address these gaps directly.';
  }

  if (perSkillPercents.length > 1 && strongest.percent - weakest.percent >= 20) {
    return `${getSkillName(strongest.skillId)} is your current strength (${strongest.percent}%). ${getSkillName(weakest.skillId)} at ${weakest.percent}% is your largest opportunity to keep building.`;
  }

  const hasJourneyNode = ACTIVE_PATH.nodes.some(n => n.assessmentId === assessmentId);
  if (hasJourneyNode) {
    return 'Passing this assessment confirms your foundations. Your journey has been updated and mastery scores reflect this result.';
  }
  return 'Consistent performance across these skills is a strong signal for your ML Engineer transition. Mastery scores have been updated.';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: assessmentId } = use(params);
  const assessment = ASSESSMENTS.find(a => a.id === assessmentId);

  const { applyResult } = useMastery();
  const { loaded, storedResults, saveResult } = useAssessmentResults();
  const { nodeStatuses, completeNode } = useJourneyProgress();

  const [view, setView] = useState<PageView>('loading');
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [submitWarning, setSubmitWarning] = useState(false);
  // Local result holds the just-computed result immediately after submission,
  // before the context state propagates — avoids a blank flash.
  const [localResult, setLocalResult] = useState<{
    result: { score: number; passed: boolean; assessmentId: string };
    perSkillPercents: PerSkillPercent[];
  } | null>(null);

  // Set initial view once context finishes loading from localStorage
  useEffect(() => {
    if (!loaded) return;
    setView(storedResults[assessmentId] ? 'results' : 'intro');
    // Intentionally only run when loaded first becomes true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // ── Not found ──────────────────────────────────────────────────────────────

  if (!assessment) {
    return (
      <div className="max-w-2xl">
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Assessment
        </div>
        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Assessment not found
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          No assessment with ID &ldquo;{assessmentId}&rdquo; exists.
        </p>
        <a href="/assessments" className="text-sm" style={{ color: 'var(--accent-violet-bright)' }}>
          ← Back to Assessments
        </a>
      </div>
    );
  }

  if (view === 'loading') {
    return null;
  }

  const skillNames = assessment.skillIds.map(
    id => SKILLS.find(s => s.id === id)?.name ?? id
  );

  // ── INTRO ──────────────────────────────────────────────────────────────────

  if (view === 'intro') {
    const handleBegin = () => {
      const newSession = AssessmentService.generateSession(assessment, DEMO_LEARNER_CONTEXT);
      setSession(newSession);
      setAnswers({});
      setCurrentQ(0);
      setStartedAt(new Date());
      setSubmitWarning(false);
      setLocalResult(null);
      setView('active');
    };

    return (
      <div className="max-w-2xl">
        <a
          href="/assessments"
          className="flex items-center gap-1 text-xs mb-8"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={12} /> Assessments
        </a>

        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Assessment
        </div>

        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}
        >
          {assessment.title}
        </h1>

        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 520 }}
        >
          {assessment.description}
        </p>

        <div
          className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs mb-6"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 20,
            color: 'var(--text-secondary)',
          }}
        >
          <div className="flex items-center gap-2">
            <Clock size={12} style={{ color: 'var(--text-muted)' }} />
            <span>{assessment.estimatedMinutes} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Target size={12} style={{ color: 'var(--text-muted)' }} />
            <span>5 questions</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Pass score: </span>
            {assessment.passingScore}%
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Difficulty: </span>
            {difficultyLabel(assessment.difficulty)}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginBottom: 28 }}>
          <div
            className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Skills assessed
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {skillNames.join('  ·  ')}
          </p>
        </div>

        {storedResults[assessmentId] && (
          <div
            className="text-xs mb-5 flex items-center gap-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>Previous result: </span>
            <span
              style={{
                color: storedResults[assessmentId].result.passed
                  ? 'var(--accent-green)'
                  : 'var(--accent-amber)',
                fontWeight: 600,
              }}
            >
              {storedResults[assessmentId].result.score}%{' '}
              {storedResults[assessmentId].result.passed ? '✓ Passed' : '✗ Not passed'}
            </span>
            <button
              onClick={() => setView('results')}
              className="underline"
              style={{ color: 'var(--accent-violet-bright)' }}
            >
              Review
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <motion.button
            onClick={handleBegin}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent-violet)', color: 'white' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Begin Assessment <ArrowRight size={14} />
          </motion.button>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            +{assessment.xpReward} XP on passing
          </span>
        </div>
      </div>
    );
  }

  // ── ACTIVE ─────────────────────────────────────────────────────────────────

  if (view === 'active' && session) {
    const questions = session.questions;
    const question = questions[currentQ];
    const totalQ = questions.length;
    const unansweredCount = questions.filter(q => !answers[q.id]).length;
    const isLastQ = currentQ === totalQ - 1;

    if (!question) {
      return (
        <div className="max-w-2xl">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No questions available for this assessment.
          </p>
          <button
            onClick={() => setView('intro')}
            className="text-xs mt-4"
            style={{ color: 'var(--accent-violet-bright)' }}
          >
            ← Back
          </button>
        </div>
      );
    }

    const handleSelect = (option: string) => {
      setAnswers(prev => ({ ...prev, [question.id]: option }));
      setSubmitWarning(false);
    };

    const handleSubmit = () => {
      if (unansweredCount > 0) {
        setSubmitWarning(true);
        return;
      }

      const now = new Date();
      const timeTaken = startedAt
        ? Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 60000))
        : 1;

      const submission: AssessmentSubmission = {
        sessionId: session.sessionId,
        userId: DEMO_LEARNER_CONTEXT.user.id,
        answers,
        timeTakenMinutes: timeTaken,
        submittedAt: now,
      };

      const result = AssessmentService.evaluateSubmission(submission, session);
      const perSkillPercents = computePerSkillPercents(session, answers);

      // Update mastery
      applyResult(result);

      // Complete journey node if this assessment belongs to one and it's available
      const journeyNode = ACTIVE_PATH.nodes.find(
        n => n.type === 'assessment' && n.assessmentId === assessmentId
      );
      if (journeyNode && nodeStatuses[journeyNode.id] === 'available' && result.passed) {
        completeNode(journeyNode.id);
      }

      // Persist result
      saveResult(assessmentId, result, perSkillPercents);

      // Hold local copy so results view renders immediately
      setLocalResult({ result, perSkillPercents });
      setView('results');
    };

    return (
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setView('intro')}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronLeft size={12} /> Exit
          </button>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {assessment.title}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {currentQ + 1} / {totalQ}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="h-[2px] rounded-full mb-8"
          style={{ background: 'var(--border-subtle)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--accent-violet)' }}
            animate={{ width: `${((currentQ + 1) / totalQ) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="text-[10px] font-bold tracking-[0.18em] uppercase mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Question {currentQ + 1} of {totalQ}
            </div>

            <p
              className="text-base font-medium mb-6"
              style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}
            >
              {question.text}
            </p>

            {/* Answer options */}
            <div
              className="space-y-2.5 mb-8"
              role="radiogroup"
              aria-label={`Question ${currentQ + 1} options`}
            >
              {(question.options ?? []).map((option, i) => {
                const isSelected = answers[question.id] === option;
                const label = String.fromCharCode(65 + i);
                return (
                  <motion.button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className="w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left text-sm"
                    style={{
                      background: isSelected
                        ? 'rgba(124,58,237,0.1)'
                        : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                      style={{
                        background: isSelected ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                        color: isSelected ? 'white' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      {label}
                    </span>
                    <span style={{ lineHeight: 1.5 }}>{option}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Submit warning */}
        <AnimatePresence>
          {submitWarning && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mb-4 text-xs"
              style={{ color: 'var(--accent-amber)' }}
              role="alert"
            >
              <AlertCircle size={13} />
              <span>
                {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered.
                Answer all questions before submitting.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: currentQ === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
              opacity: currentQ === 0 ? 0.4 : 1,
            }}
            whileHover={currentQ > 0 ? { scale: 1.02 } : {}}
            whileTap={currentQ > 0 ? { scale: 0.98 } : {}}
            aria-label="Previous question"
          >
            <ChevronLeft size={12} /> Previous
          </motion.button>

          {/* Dot indicators */}
          <div className="flex gap-1.5" role="list" aria-label="Question progress">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: answers[q.id]
                    ? 'var(--accent-violet)'
                    : i === currentQ
                    ? 'var(--text-secondary)'
                    : 'var(--border-default)',
                }}
                aria-label={`Go to question ${i + 1}${answers[q.id] ? ' (answered)' : ''}`}
                role="listitem"
              />
            ))}
          </div>

          {isLastQ ? (
            <motion.button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium"
              style={{ background: 'var(--accent-violet)', color: 'white' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Submit <ArrowRight size={12} />
            </motion.button>
          ) : (
            <motion.button
              onClick={() => setCurrentQ(q => Math.min(totalQ - 1, q + 1))}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Next question"
            >
              Next <ChevronRight size={12} />
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────

  if (view === 'results') {
    const display = localResult ?? (storedResults[assessmentId]
      ? {
          result: storedResults[assessmentId].result,
          perSkillPercents: storedResults[assessmentId].perSkillPercents,
        }
      : null);

    if (!display) {
      // Results not yet available — redirect to intro
      setView('intro');
      return null;
    }

    const { result, perSkillPercents } = display;
    const insight = deriveInsight(result.passed, perSkillPercents, assessmentId);
    const scoreColor = result.passed ? 'var(--accent-green)' : 'var(--accent-amber)';

    const handleRetake = () => {
      setLocalResult(null);
      setSession(null);
      setAnswers({});
      setCurrentQ(0);
      setSubmitWarning(false);
      setView('intro');
    };

    return (
      <div className="max-w-2xl">
        <a
          href="/assessments"
          className="flex items-center gap-1 text-xs mb-8"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={12} /> Assessments
        </a>

        {/* Score header */}
        <div className="mb-8">
          <div
            className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3"
            style={{ color: scoreColor }}
          >
            Assessment complete
          </div>

          <div className="flex items-end gap-4 mb-3">
            <span
              className="text-5xl font-bold"
              style={{ color: scoreColor, lineHeight: 1 }}
            >
              {result.score}%
            </span>
            <div className="pb-1">
              <p className="text-sm font-semibold" style={{ color: scoreColor }}>
                {result.passed ? '✓ Passed' : '✗ Not passed'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Pass threshold {assessment.passingScore}%
              </p>
            </div>
          </div>

          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {assessment.title}
          </h1>
        </div>

        {/* Per-skill breakdown */}
        {perSkillPercents.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginBottom: 20 }}>
            <div
              className="text-[10px] font-bold tracking-[0.18em] uppercase mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Skill results
            </div>
            <div className="space-y-3.5">
              {perSkillPercents.map(({ skillId, percent }) => {
                const skillName = SKILLS.find(s => s.id === skillId)?.name ?? skillId;
                const barColor =
                  percent >= 80
                    ? 'var(--accent-green)'
                    : percent >= 60
                    ? 'var(--accent-cyan)'
                    : 'var(--accent-amber)';
                return (
                  <div key={skillId}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: 'var(--text-secondary)' }}>{skillName}</span>
                      <span className="font-semibold tabular-nums" style={{ color: barColor }}>
                        {percent}%
                      </span>
                    </div>
                    <div
                      className="h-[3px] rounded-full"
                      style={{ background: 'var(--border-subtle)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NEXUS noticed */}
        {insight && (
          <div
            className="mb-6 py-4"
            style={{
              borderTop: '1px solid var(--border-subtle)',
              borderLeft: '2px solid var(--accent-violet)',
              paddingLeft: 14,
            }}
          >
            <div
              className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2"
              style={{ color: 'var(--accent-violet-bright)' }}
            >
              NEXUS noticed
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {insight}
            </p>
          </div>
        )}

        {/* Actions */}
        <div
          className="flex flex-wrap gap-3"
          style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}
        >
          <motion.a
            href="/journey"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium"
            style={{ background: 'var(--accent-violet)', color: 'white' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Continue Journey <ArrowRight size={11} />
          </motion.a>
          <motion.a
            href="/skills"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Review Skills
          </motion.a>
          <motion.button
            onClick={handleRetake}
            className="px-4 py-2 rounded-lg text-xs"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Retake
          </motion.button>
        </div>
      </div>
    );
  }

  return null;
}

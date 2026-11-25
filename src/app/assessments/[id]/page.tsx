'use client';

import { use, useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  const reducedMotion = useReducedMotion() ?? false;

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
        <div className="k-slug mb-3">Assessment</div>
        <h1 className="k-display-sm mb-5">Assessment not found</h1>
        <div className="k-paper k-panel p-5">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            No assessment with ID &ldquo;{assessmentId}&rdquo; exists.
          </p>
          <a href="/assessments" className="k-btn k-btn-solid">
            <ChevronLeft size={14} /> Back to Assessments
          </a>
        </div>
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

    const previous = storedResults[assessmentId];

    return (
      <div className="max-w-2xl">
        <a
          href="/assessments"
          className="k-label inline-flex items-center gap-1.5 mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={12} /> Assessments
        </a>

        {/* Header — on the dark room */}
        <header className="mb-6">
          <div className="k-slug mb-3">Assessment</div>
          <h1 className="k-display-sm mb-4">{assessment.title}</h1>
          <p className="nx-support" style={{ maxWidth: 520 }}>
            {assessment.description}
          </p>
        </header>

        {/* The brief — the one primary object on this view */}
        <div className="k-paper k-panel-hero p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="k-well p-3">
              <div className="k-label mb-1.5 flex items-center gap-1.5">
                <Clock size={11} /> Duration
              </div>
              <div className="k-figure text-[15px]">{assessment.estimatedMinutes} minutes</div>
            </div>
            <div className="k-well p-3">
              <div className="k-label mb-1.5 flex items-center gap-1.5">
                <Target size={11} /> Questions
              </div>
              <div className="k-figure text-[15px]">5</div>
            </div>
            <div className="k-well p-3">
              <div className="k-label mb-1.5">Pass score</div>
              <div className="k-figure text-[15px]">{assessment.passingScore}%</div>
            </div>
            <div className="k-well p-3">
              <div className="k-label mb-1.5">Difficulty</div>
              <div className="k-figure text-[15px]">{difficultyLabel(assessment.difficulty)}</div>
            </div>
          </div>

          <hr className="k-rule-hard my-5" />

          <div className="k-label mb-2.5">Skills assessed</div>
          <div className="flex flex-wrap gap-1.5">
            {skillNames.map(name => (
              <span key={name} className="k-badge k-badge-quiet">{name}</span>
            ))}
          </div>

          {previous && (
            <>
              <hr className="k-rule-thin my-5" />
              <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                <span className="k-label">Previous result</span>
                <span
                  style={{
                    color: previous.result.passed ? 'var(--accent-green)' : 'var(--accent-amber)',
                    fontWeight: 600,
                  }}
                >
                  {previous.result.score}% {previous.result.passed ? '✓ Passed' : '✗ Not passed'}
                </span>
                <button
                  onClick={() => setView('results')}
                  className="underline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Review
                </button>
              </div>
            </>
          )}

          <hr className="k-rule-hard my-5" />

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={handleBegin} className="k-btn k-btn-solid">
              Begin Assessment <ArrowRight size={14} />
            </button>
            <span className="k-label">+{assessment.xpReward} XP on passing</span>
          </div>
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
          <div className="k-paper k-panel p-5">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              No questions available for this assessment.
            </p>
            <button onClick={() => setView('intro')} className="k-btn k-btn-solid">
              <ChevronLeft size={14} /> Back
            </button>
          </div>
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
        <div className="flex items-center justify-between gap-3 mb-5">
          <button
            onClick={() => setView('intro')}
            className="k-label inline-flex items-center gap-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={12} /> Exit
          </button>
          <span className="k-label truncate" style={{ color: 'var(--text-secondary)' }}>
            {assessment.title}
          </span>
          <span className="k-figure text-[13px]">
            {currentQ + 1} / {totalQ}
          </span>
        </div>

        {/* Progress */}
        <div className="k-meter mb-6" style={{ height: '0.5rem' }}>
          <motion.div
            className="k-meter-fill"
            animate={{ width: `${((currentQ + 1) / totalQ) * 100}%` }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
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
            className="k-paper k-panel p-6 mb-6"
          >
            <div className="k-slug mb-4">Question {currentQ + 1} of {totalQ}</div>

            <p
              className="text-xl md:text-2xl font-medium mb-6"
              style={{ color: 'var(--text-primary)', lineHeight: 1.35 }}
            >
              {question.text}
            </p>

            {/* Answer options */}
            <div
              className="space-y-2.5"
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
                    className="w-full flex items-start gap-3 px-4 py-3.5 text-left text-sm cursor-pointer"
                    style={{
                      background: isSelected ? 'var(--amber)' : 'var(--bg-surface)',
                      border: '2px solid var(--border-strong)',
                      color: 'var(--text-primary)',
                      boxShadow: isSelected ? 'var(--k-shadow-sm)' : 'none',
                    }}
                    whileTap={reducedMotion ? {} : { x: 2, y: 2 }}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span
                      className="k-figure flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{
                        width: 22,
                        height: 22,
                        fontSize: 11,
                        border: '2px solid var(--border-strong)',
                        background: isSelected ? 'var(--ink)' : 'transparent',
                        color: isSelected ? 'var(--paper)' : 'var(--text-primary)',
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
              className="flex items-center gap-2 mb-4 px-3 py-2.5 text-xs"
              /* --accent-amber, not --amber: this is amber carrying type and a
                 rule, not filling a block, and plain --amber is 1.8:1 on cream.
                 --accent-amber is the surface-aware cut that stays legible on
                 stock and in the light theme, which an alert has to be. */
              style={{ color: 'var(--accent-amber)', border: '2px solid var(--accent-amber)' }}
              role="alert"
            >
              <AlertCircle size={13} className="flex-shrink-0" />
              <span>
                {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered.
                Answer all questions before submitting.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="k-btn k-btn-outline"
            style={{ padding: '0.5rem 0.875rem' }}
            aria-label="Previous question"
          >
            <ChevronLeft size={12} /> Previous
          </button>

          {/* Dot indicators */}
          <div className="flex gap-1.5" role="list" aria-label="Question progress">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(i)}
                className="cursor-pointer"
                style={{
                  width: 9,
                  height: 9,
                  border: '1px solid var(--k-edge-strong)',
                  background: answers[q.id]
                    ? 'var(--amber)'
                    : i === currentQ
                    ? 'var(--text-secondary)'
                    : 'transparent',
                }}
                aria-label={`Go to question ${i + 1}${answers[q.id] ? ' (answered)' : ''}`}
                role="listitem"
              />
            ))}
          </div>

          {isLastQ ? (
            <button
              onClick={handleSubmit}
              className="k-btn k-btn-amber"
              style={{ padding: '0.5rem 0.875rem' }}
            >
              Submit <ArrowRight size={12} />
            </button>
          ) : (
            <button
              onClick={() => setCurrentQ(q => Math.min(totalQ - 1, q + 1))}
              className="k-btn k-btn-outline"
              style={{ padding: '0.5rem 0.875rem' }}
              aria-label="Next question"
            >
              Next <ChevronRight size={12} />
            </button>
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
          className="k-label inline-flex items-center gap-1.5 mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={12} /> Assessments
        </a>

        {/* Header — on the dark room */}
        <header className="mb-6">
          <div className="k-slug mb-3">Assessment complete</div>
          <h1 className="k-display-sm">{assessment.title}</h1>
        </header>

        <div className="space-y-5">
          {/* Score — the one primary object on this view */}
          <div className="k-paper k-panel-hero p-6">
            <div className="flex flex-wrap items-end gap-5">
              <span
                className="k-figure"
                style={{ fontSize: 'clamp(3rem, 2rem + 4vw, 4.5rem)', lineHeight: 0.9, color: scoreColor }}
              >
                {result.score}%
              </span>
              <div className="pb-1.5">
                <div className="k-label" style={{ color: scoreColor, fontSize: 13 }}>
                  {result.passed ? '✓ Passed' : '✗ Not passed'}
                </div>
                <div className="k-label mt-1">
                  Pass threshold {assessment.passingScore}%
                </div>
              </div>
            </div>
          </div>

          {/* Per-skill breakdown */}
          {perSkillPercents.length > 0 && (
            <div className="k-paper k-panel p-5">
              <div className="k-slug mb-4">Skill results</div>
              <div className="space-y-4">
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
                      <div className="flex justify-between items-baseline gap-3 mb-1.5">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{skillName}</span>
                        <span className="k-figure text-[13px]" style={{ color: barColor }}>
                          {percent}%
                        </span>
                      </div>
                      <div className="k-meter" style={{ height: '0.4rem' }}>
                        <motion.div
                          className="k-meter-fill"
                          style={{ background: barColor }}
                          initial={reducedMotion ? false : { width: 0 }}
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
            <div className="k-paper k-panel p-5" style={{ borderLeft: '6px solid var(--amber)' }}>
              <div className="k-slug mb-2">NEXUS noticed</div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {insight}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          <a href="/journey" className="k-btn k-btn-amber">
            Continue Journey <ArrowRight size={11} />
          </a>
          <a href="/skills" className="k-btn k-btn-outline">
            Review Skills
          </a>
          <button onClick={handleRetake} className="k-btn k-btn-outline">
            Retake
          </button>
        </div>
      </div>
    );
  }

  return null;
}

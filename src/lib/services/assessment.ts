/**
 * AssessmentService — assessment pipeline service.
 *
 * Service boundary for the assessment → evidence → mastery update loop.
 * Phase 2.5D-3 implements the deterministic question bank and real scoring.
 *
 * Full adaptive learning loop:
 *   1. AssessmentService.generateSession()   → AssessmentSession (with questions)
 *   2. User answers questions in the UI
 *   3. AssessmentService.evaluateSubmission() → AssessmentResult (correct-answer scoring)
 *   4. MasteryService.applyAssessmentResult() → updated SkillMastery[]
 *   5. GapAnalysisService.computeSkillGaps() → updated SkillGap[]
 *
 * The AI layer (ai-intelligence.ts) handles:
 *   - Adaptive question selection
 *   - Feedback text generation
 *   All scoring math is deterministic.
 */
import type {
  Assessment, AssessmentResult, AssessmentSession, AssessmentQuestion,
  AssessmentSubmission, LearnerContext, SkillLevel,
} from '../types';
import { ASSESSMENTS } from '../data/seed';
import { QUESTION_BANK } from '../data/questionBank';

// ─── Service interface ────────────────────────────────────────────────────────

export interface IAssessmentService {
  generateSession(assessment: Assessment, context: LearnerContext): AssessmentSession;
  evaluateSubmission(submission: AssessmentSubmission, session: AssessmentSession): AssessmentResult;
  generateFeedback(result: AssessmentResult, context: LearnerContext): string;
}

// ─── Deterministic scoring helpers ───────────────────────────────────────────

const LEVEL_THRESHOLDS: Array<[number, SkillLevel]> = [
  [95, 'master'], [80, 'expert'], [65, 'advanced'],
  [45, 'intermediate'], [20, 'beginner'], [0, 'novice'],
];

function scoreToLevel(score: number): SkillLevel {
  for (const [threshold, level] of LEVEL_THRESHOLDS) {
    if (score >= threshold) return level;
  }
  return 'novice';
}

function computeSkillDelta(score: number, passed: boolean): number {
  if (!passed) return -2;
  if (score >= 90) return 10;
  if (score >= 80) return 7;
  if (score >= 70) return 5;
  return 3;
}

// ─── Implementation ───────────────────────────────────────────────────────────

export const AssessmentService: IAssessmentService = {
  generateSession(assessment: Assessment, context: LearnerContext): AssessmentSession {
    const questions = QUESTION_BANK[assessment.id] ?? [];
    return {
      sessionId: `session_${assessment.id}_${context.user.id}`,
      assessmentId: assessment.id,
      userId: context.user.id,
      questions,
      startedAt: new Date(),
      timeLimit: assessment.estimatedMinutes,
      answers: {},
      completed: false,
    };
  },

  evaluateSubmission(submission: AssessmentSubmission, session: AssessmentSession): AssessmentResult {
    const total = Math.max(session.questions.length, 1);
    const correct = session.questions.filter(
      (q: AssessmentQuestion) => submission.answers[q.id] === q.correctAnswer
    ).length;
    const score = Math.round((correct / total) * 100);

    // Look up assessment-specific passing score
    const assessment = ASSESSMENTS.find(a => a.id === session.assessmentId);
    const passingScore = assessment?.passingScore ?? 70;
    const passed = score >= passingScore;

    // Compute per-skill scores for more precise mastery updates
    const skillQMap: Record<string, AssessmentQuestion[]> = {};
    for (const q of session.questions) {
      if (!skillQMap[q.skillId]) skillQMap[q.skillId] = [];
      skillQMap[q.skillId].push(q);
    }

    const skillUpdates = Object.entries(skillQMap).map(([skillId, questions]) => {
      const skillCorrect = questions.filter(
        (q: AssessmentQuestion) => submission.answers[q.id] === q.correctAnswer
      ).length;
      const skillScore = Math.round((skillCorrect / questions.length) * 100);
      const skillPassed = skillScore >= passingScore;
      return {
        skillId,
        newLevel: scoreToLevel(skillScore),
        scoreDelta: computeSkillDelta(skillScore, skillPassed),
      };
    });

    return {
      assessmentId: session.assessmentId,
      userId: submission.userId,
      score,
      timeTakenMinutes: submission.timeTakenMinutes,
      completedAt: submission.submittedAt,
      skillUpdates,
      feedback: '',
      passed,
    };
  },

  generateFeedback(result: AssessmentResult, context: LearnerContext): string {
    if (result.passed) {
      return `Well done, ${context.user.name}! You scored ${result.score}% — your mastery has been updated.`;
    }
    return `You scored ${result.score}%. Review the core concepts and try again when you feel ready.`;
  },
};

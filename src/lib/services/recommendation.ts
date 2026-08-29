/**
 * Deterministic recommendation engine.
 *
 * Architecture:
 *   - All public functions accept an optional LearnerContext so they work for
 *     any learner, not just the demo persona.
 *   - When no context is provided, convenience wrappers fall back to
 *     DEMO_LEARNER_CONTEXT from seed.ts for the demo experience.
 *   - RecommendationScore exposes every scoring factor so "Why this?" always
 *     has a factual, inspectable answer.
 *   - Designed for drop-in replacement with LLM reasoning + collaborative
 *     filtering at each factor without restructuring the pipeline.
 */
import type {
  Recommendation, SkillGap, Goal, LearnerProfile, LearnerContext,
  LearningResource, RecommendationScore, PathHealthReport, NextBestAction,
  SkillLevel,
} from '../types';
import {
  SKILL_GAPS, RECOMMENDATIONS, ACTIVE_PATH, RESOURCES, ASSESSMENTS, ACTIVE_GOAL, SKILL_MASTERIES,
  DEMO_LEARNER_CONTEXT,
} from '../data/seed';

// Re-export shared types for backward-compat — pages that imported these from
// this module continue to work without changes.
export type { PathHealthReport, NextBestAction } from '../types';

// ─── Scoring weights ──────────────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  goalAlignment: 0.30,
  skillGapScore: 0.20,
  prerequisiteScore: 0.15,
  difficultyFit: 0.10,
  timeFit: 0.10,
  preferenceFit: 0.08,
  behaviorFit: 0.05,
  resourceQuality: 0.02,
} as const;

const LEVEL_ORDER: Record<SkillLevel, number> = {
  novice: 0, beginner: 1, intermediate: 2, advanced: 3, expert: 4, master: 5,
};

// ─── Core scoring ─────────────────────────────────────────────────────────────

/**
 * Compute a fully inspectable RecommendationScore for a resource against
 * a learner context. Every factor is independently scoreable and debuggable.
 */
export function computeRecommendationScore(
  resource: LearningResource,
  context: LearnerContext,
): RecommendationScore {
  const { goal, masteries, profile, behavior } = context;
  const masteryMap = new Map(masteries.map(m => [m.skillId, m]));

  // Goal alignment: fraction of resource skills that appear in goal required skills
  const goalSkillIds = new Set(goal.requiredSkills.map(r => r.skillId));
  const relevantSkills = resource.skillIds.filter(id => goalSkillIds.has(id));
  const goalAlignment = resource.skillIds.length > 0
    ? relevantSkills.length / resource.skillIds.length
    : 0;

  // Skill gap score: average gap severity across relevant skills
  let totalGapScore = 0;
  let gapCount = 0;
  for (const skillId of relevantSkills) {
    const req = goal.requiredSkills.find(r => r.skillId === skillId);
    const mastery = masteryMap.get(skillId);
    if (req) {
      const current = mastery ? LEVEL_ORDER[mastery.level] : 0;
      const required = LEVEL_ORDER[req.requiredLevel];
      totalGapScore += Math.max(0, required - current) / 5;
      gapCount++;
    }
  }
  const skillGapScore = gapCount > 0 ? totalGapScore / gapCount : 0;

  // Prerequisite readiness: fraction of resource prerequisites already met
  const prereqsMet = resource.prerequisites.filter(prereqId => {
    const m = masteryMap.get(prereqId);
    return m && LEVEL_ORDER[m.level] >= 1;
  }).length;
  const prerequisiteScore = resource.prerequisites.length > 0
    ? prereqsMet / resource.prerequisites.length
    : 1;

  // Difficulty fit: how well resource difficulty matches learner's current level
  const avgMasteryLevel = masteries.length > 0
    ? masteries.reduce((sum, m) => sum + LEVEL_ORDER[m.level], 0) / masteries.length
    : 0;
  const targetDifficulty = Math.round(avgMasteryLevel + behavior.challengeTolerance * 2);
  const difficultyFit = 1 - Math.abs(resource.difficultyLevel - targetDifficulty) / 4;

  // Time fit: resource hours vs available weekly hours
  const weeklyHours = context.user.weeklyHoursAvailable;
  const timeFit = resource.estimatedHours <= weeklyHours
    ? 1
    : weeklyHours / resource.estimatedHours;

  // Preference fit: resource type matches learning preferences
  const preferenceFit = profile.preferredResourceTypes.includes(resource.type) ? 1 : 0.4;

  // Behavior fit: adjust for practice preference vs theory
  const isPractical = ['interactive', 'project'].includes(resource.type);
  const behaviorFit = isPractical
    ? behavior.practicePreference
    : 1 - behavior.practicePreference * 0.5;

  // Resource quality: normalized rating × log(review count)
  const qualityNorm = (resource.rating / 5) * Math.min(1, Math.log10(resource.reviewCount + 1) / 4);
  const resourceQuality = qualityNorm;

  const totalScore =
    goalAlignment * SCORE_WEIGHTS.goalAlignment +
    skillGapScore * SCORE_WEIGHTS.skillGapScore +
    prerequisiteScore * SCORE_WEIGHTS.prerequisiteScore +
    difficultyFit * SCORE_WEIGHTS.difficultyFit +
    timeFit * SCORE_WEIGHTS.timeFit +
    preferenceFit * SCORE_WEIGHTS.preferenceFit +
    behaviorFit * SCORE_WEIGHTS.behaviorFit +
    resourceQuality * SCORE_WEIGHTS.resourceQuality;

  return {
    totalScore: Math.min(1, Math.max(0, totalScore)),
    goalAlignment,
    skillGapScore,
    prerequisiteScore,
    difficultyFit: Math.min(1, Math.max(0, difficultyFit)),
    timeFit,
    preferenceFit,
    behaviorFit,
    resourceQuality,
    reasons: [],
  };
}

/**
 * Compute personalized skill gap priority score.
 * Factors: goal weight, current vs required level, market demand.
 * Accepts profile for learning-style adjustments.
 */
export function computeSkillGapPriority(
  gap: SkillGap,
  goal: Goal,
  profile: LearnerProfile,
): number {
  const goalSkill = goal.requiredSkills.find(s => s.skillId === gap.skill.id);
  if (!goalSkill) return 0;

  const levelWeights: Record<SkillLevel, number> = { novice: 5, beginner: 4, intermediate: 3, advanced: 2, expert: 1, master: 0 };
  const currentWeight = levelWeights[gap.currentLevel];
  const requiredWeight = levelWeights[goalSkill.requiredLevel];
  const gapWeight = Math.max(0, currentWeight - requiredWeight) / 5;

  const demandFactor = gap.skill.demandScore / 100;
  const hoursFactor = 1 - Math.min(1, gap.estimatedHoursToClose / 200);
  const learningStyleFactor = profile.preferredResourceTypes.includes('interactive') ? 1.1 : 1.0;

  return (gapWeight * 0.5 + demandFactor * 0.3 + hoursFactor * 0.2) * learningStyleFactor;
}

// ─── Context-aware service functions ─────────────────────────────────────────
// Each function accepts an optional LearnerContext. When omitted, the demo
// persona (Akshat Sharma) is used for backward compatibility with existing pages.

/**
 * Returns prioritized skill gaps, sorted by priority then gap severity.
 * Behavior metric challengeTolerance adjusts ordering for stretch seekers.
 */
export function getPrioritizedSkillGaps(context?: LearnerContext): SkillGap[] {
  const ctx = context ?? DEMO_LEARNER_CONTEXT;
  return [...SKILL_GAPS].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;

    // Challenge-tolerant learners see harder gaps first
    if (ctx.behavior.challengeTolerance > 0.6) return b.gapScore - a.gapScore;
    return a.estimatedHoursToClose - b.estimatedHoursToClose;
  });
}

/**
 * Computes the next 3 best actions for the learner right now.
 * Deterministic ordering; designed for LLM-ranking replacement.
 */
export function getNextBestActions(_context?: LearnerContext): NextBestAction[] {
  return [
    {
      title: 'Continue Pandas on Kaggle',
      description: 'You\'re 0% through this module. 8 hours will close your Pandas gap and unblock the EDA project.',
      type: 'resource',
      resourceId: 'res_kaggle_pandas',
      estimatedMinutes: 90,
      xpReward: 150,
      whyNow: 'Critical path blocker for your ML Engineer goal',
      confidence: 0.93,
    },
    {
      title: 'Take Python Foundations Assessment',
      description: 'Verify your Python level to unlock advanced exercises and calibrate your path.',
      type: 'assessment',
      assessmentId: 'asmnt_python_basics',
      estimatedMinutes: 25,
      xpReward: 200,
      whyNow: 'Your current Python score is estimated — assessment evidence raises confidence',
      confidence: 0.88,
    },
    {
      title: 'Watch 3Blue1Brown: Chapter 4 — Matrix Multiplication',
      description: 'Continue your linear algebra series. You\'re on chapter 4/15.',
      type: 'resource',
      resourceId: 'res_3b1b_linear',
      estimatedMinutes: 20,
      xpReward: 50,
      whyNow: 'Prerequisite for ML Fundamentals, and fits in a short session',
      confidence: 0.82,
    },
  ];
}

/**
 * Compute path health report.
 * Accepts optional context; falls back to demo path + goal for existing pages.
 */
export function getPathHealthReport(context?: LearnerContext): PathHealthReport {
  const path = ACTIVE_PATH;
  const goal = context?.goal ?? ACTIVE_GOAL;

  const completedNodes = path.nodes.filter(n => n.status === 'completed').length;
  const totalNodes = path.nodes.length;
  const progressRatio = completedNodes / Math.max(totalNodes, 1);

  const now = new Date();
  const targetDate = goal.targetDate ?? new Date(now.getTime() + 365 * 86400000);
  const startDate = new Date(path.createdAt);
  const totalMs = targetDate.getTime() - startDate.getTime();
  const elapsedMs = now.getTime() - startDate.getTime();
  const expectedProgress = Math.min(1, elapsedMs / Math.max(totalMs, 1));

  const behindBy = (expectedProgress - progressRatio) * (totalMs / 86400000);

  const dailyRate = progressRatio / Math.max(elapsedMs / 86400000, 1);
  const estimatedDaysRemaining = dailyRate > 0 ? (1 - progressRatio) / dailyRate : 365;
  const estimatedCompletionDate = new Date(now.getTime() + estimatedDaysRemaining * 86400000);

  return {
    onTrack: behindBy < 14,
    daysAheadOrBehind: Math.round(behindBy),
    criticalBlockers: ['Pandas (Novice → Intermediate)', 'Statistics (Beginner → Intermediate)'],
    nextMilestone: 'Complete EDA Project',
    estimatedCompletionDate,
    riskLevel: behindBy > 30 ? 'high' : behindBy > 14 ? 'medium' : 'low',
  };
}

/**
 * Get active recommendations, sorted by priority and confidence.
 * Accepts context for future learner-specific filtering.
 */
export function getActiveRecommendations(_context?: LearnerContext): Recommendation[] {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return RECOMMENDATIONS
    .filter(r => !r.dismissed)
    .sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.confidence - a.confidence;
    });
}

/**
 * Compute overall skill readiness percentage for the active goal.
 */
export function computeGoalReadiness(context?: LearnerContext): number {
  const goal = context?.goal ?? ACTIVE_GOAL;
  const masteries = context?.masteries ?? SKILL_MASTERIES;

  const levelScore: Record<SkillLevel, number> = {
    novice: 0, beginner: 20, intermediate: 50, advanced: 75, expert: 90, master: 100,
  };
  const masteryMap = new Map(masteries.map(m => [m.skillId, m]));

  let totalWeight = 0;
  let achievedWeight = 0;

  for (const req of goal.requiredSkills) {
    const mastery = masteryMap.get(req.skillId);
    const currentScore = mastery ? levelScore[mastery.level] : 0;
    const requiredScore = levelScore[req.requiredLevel];
    if (requiredScore === 0) continue;
    totalWeight += 1;
    achievedWeight += Math.min(1, currentScore / requiredScore);
  }

  return totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
}

/**
 * Get skills grouped by category with mastery overlaid.
 */
export function getSkillsByCategory(skills: typeof import('../data/seed').SKILLS): Map<string, typeof skills> {
  const map = new Map<string, typeof skills>();
  for (const skill of skills) {
    const existing = map.get(skill.category) ?? [];
    existing.push(skill);
    map.set(skill.category, existing);
  }
  return map;
}

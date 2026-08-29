/**
 * PathAdaptationService — deterministic learning path health and adaptation logic.
 *
 * Responsible for:
 *   - Evaluating whether a learner is on track against their goal timeline
 *   - Detecting behavioral triggers that warrant path adaptation
 *   - Suggesting concrete adaptations (no LLM required for detection;
 *     LLM is used only to generate the explanation text via AIIntelligenceService)
 *
 * Adaptive loop (Phase 6 will wire these together):
 *   Assessment → AssessmentResult → MasteryService → updated SkillMasteries
 *     → GapAnalysisService → updated SkillGaps
 *     → this service → PathAdaptation candidates
 *     → LearningPath updated nodes / order
 *     → RecommendationService → updated Recommendations
 */
import type { LearningPath, LearnerContext, PathAdaptation, PathHealthReport } from '../types';

export const PathAdaptationService = {
  /**
   * Evaluate path health against the learner's goal timeline.
   * All inputs are explicit — no globals. Safe to call with any learner context.
   */
  evaluatePathHealth(
    path: LearningPath,
    context: LearnerContext,
    now: Date = new Date(),
  ): PathHealthReport {
    const { goal } = context;
    const completedNodes = path.nodes.filter(n => n.status === 'completed').length;
    const totalNodes = path.nodes.length;
    const progressRatio = completedNodes / Math.max(totalNodes, 1);

    const targetDate = goal.targetDate ?? new Date(now.getTime() + 365 * 86400000);
    const startDate = new Date(path.createdAt);
    const totalMs = targetDate.getTime() - startDate.getTime();
    const elapsedMs = now.getTime() - startDate.getTime();
    const expectedProgress = Math.min(1, elapsedMs / Math.max(totalMs, 1));

    const behindBy = (expectedProgress - progressRatio) * (totalMs / 86400000);

    const dailyRate = progressRatio / Math.max(elapsedMs / 86400000, 1);
    const estimatedDaysRemaining = dailyRate > 0 ? (1 - progressRatio) / dailyRate : 365;
    const estimatedCompletionDate = new Date(now.getTime() + estimatedDaysRemaining * 86400000);

    const nextAvailable = path.nodes.find(n => n.status === 'available');
    const criticalBlockers = path.nodes
      .filter(n => n.status === 'locked')
      .slice(0, 3)
      .map(n => n.title);

    return {
      onTrack: behindBy < 14,
      daysAheadOrBehind: Math.round(behindBy),
      criticalBlockers,
      nextMilestone: nextAvailable?.title ?? 'Complete current modules',
      estimatedCompletionDate,
      riskLevel: behindBy > 30 ? 'high' : behindBy > 14 ? 'medium' : 'low',
    };
  },

  /**
   * Detect adaptation triggers from learner behavior metrics and path state.
   * Returns suggested adaptations — they do not auto-apply; the caller decides.
   *
   * Phase 6 will extend this to fire on assessment results and goal changes.
   */
  detectAdaptationTriggers(
    context: LearnerContext,
    path: LearningPath,
  ): PathAdaptation[] {
    const { behavior } = context;
    const adaptations: PathAdaptation[] = [];
    const now = new Date();

    if (behavior.learningVelocity > 1.4) {
      adaptations.push({
        timestamp: now,
        reason: `Learning velocity ${behavior.learningVelocity.toFixed(1)}x above baseline — path can be accelerated.`,
        changesApplied: ['Unlock next module early', 'Add stretch resources'],
        triggeredBy: 'pace_change',
      });
    }

    if (behavior.consistency < 0.4) {
      adaptations.push({
        timestamp: now,
        reason: 'Session consistency below threshold — introducing spaced review checkpoints.',
        changesApplied: ['Insert review milestones', 'Adjust daily session targets'],
        triggeredBy: 'feedback',
      });
    }

    if (behavior.practicePreference > 0.8) {
      const projectNodes = path.nodes.filter(n => n.type === 'project' && n.status !== 'completed');
      if (projectNodes.length === 0) {
        adaptations.push({
          timestamp: now,
          reason: 'High practice preference detected but no project nodes available — adding project opportunities.',
          changesApplied: ['Suggest a practice project'],
          triggeredBy: 'feedback',
        });
      }
    }

    return adaptations;
  },

  /**
   * Compute what fraction of the path's expected progress has been achieved.
   * Returns a value 0-1 where 1 = perfectly on schedule.
   */
  computeScheduleAdherence(path: LearningPath, context: LearnerContext, now: Date = new Date()): number {
    const { goal } = context;
    const targetDate = goal.targetDate ?? new Date(now.getTime() + 365 * 86400000);
    const startDate = new Date(path.createdAt);
    const totalMs = targetDate.getTime() - startDate.getTime();
    const elapsedMs = now.getTime() - startDate.getTime();
    const expectedProgress = Math.min(1, elapsedMs / Math.max(totalMs, 1));
    const completedNodes = path.nodes.filter(n => n.status === 'completed').length;
    const actualProgress = completedNodes / Math.max(path.nodes.length, 1);
    return expectedProgress > 0 ? Math.min(1, actualProgress / expectedProgress) : 1;
  },
};

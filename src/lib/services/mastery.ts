/**
 * MasteryService — deterministic skill mastery calculations.
 *
 * Responsible for:
 *   - Computing skill level from a numeric score
 *   - Applying assessment results to update mastery state
 *   - Computing overall goal readiness from masteries
 *
 * This is a deterministic service. It NEVER calls an LLM. The AI layer
 * (in ai-intelligence.ts) generates feedback text; this service only
 * computes the numeric mastery state.
 */
import type { SkillMastery, SkillLevel, AssessmentResult, Goal } from '../types';

const LEVEL_THRESHOLDS: Array<[number, SkillLevel]> = [
  [95, 'master'], [80, 'expert'], [65, 'advanced'],
  [45, 'intermediate'], [20, 'beginner'], [0, 'novice'],
];

const LEVEL_SCORE: Record<SkillLevel, number> = {
  novice: 0, beginner: 20, intermediate: 50, advanced: 75, expert: 90, master: 100,
};

export const MasteryService = {
  /**
   * Convert a numeric score (0-100) to the corresponding SkillLevel.
   */
  computeLevel(score: number): SkillLevel {
    for (const [threshold, level] of LEVEL_THRESHOLDS) {
      if (score >= threshold) return level;
    }
    return 'novice';
  },

  /**
   * Apply an assessment result to a mastery array and return the updated copy.
   * Creates a new mastery entry if the skill was not previously tracked.
   * Does NOT mutate the input array.
   */
  applyAssessmentResult(
    result: AssessmentResult,
    currentMasteries: SkillMastery[],
  ): SkillMastery[] {
    const updated = [...currentMasteries];
    const now = new Date();

    for (const update of result.skillUpdates) {
      const idx = updated.findIndex(m => m.skillId === update.skillId);
      const newEvidence = {
        type: 'assessment' as const,
        sourceId: result.assessmentId,
        sourceName: 'Assessment',
        score: result.score,
        dateAcquired: now,
        weight: 0.8,
      };

      if (idx >= 0) {
        const prev = updated[idx];
        const newScore = Math.min(100, Math.max(0, prev.score + update.scoreDelta));
        updated[idx] = {
          ...prev,
          score: newScore,
          level: update.newLevel,
          trending: update.scoreDelta > 0 ? 'up' : update.scoreDelta < 0 ? 'down' : 'stable',
          assessedAt: now,
          lastPracticed: now,
          confidenceScore: Math.min(100, prev.confidenceScore + 10),
          evidence: [...prev.evidence, newEvidence],
        };
      } else {
        updated.push({
          skillId: update.skillId,
          level: update.newLevel,
          score: Math.max(0, update.scoreDelta),
          evidence: [newEvidence],
          lastPracticed: now,
          assessedAt: now,
          trending: 'up',
          confidenceScore: 75,
        });
      }
    }

    return updated;
  },

  /**
   * Compute overall goal readiness percentage (0-100) from current masteries.
   * Each required skill is weighted equally.
   */
  computeOverallReadiness(masteries: SkillMastery[], goal: Goal): number {
    const masteryMap = new Map(masteries.map(m => [m.skillId, m]));
    let totalWeight = 0;
    let achievedWeight = 0;

    for (const req of goal.requiredSkills) {
      const mastery = masteryMap.get(req.skillId);
      const currentScore = mastery ? LEVEL_SCORE[mastery.level] : 0;
      const requiredScore = LEVEL_SCORE[req.requiredLevel];
      if (requiredScore === 0) continue;
      totalWeight += 1;
      achievedWeight += Math.min(1, currentScore / requiredScore);
    }

    return totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
  },

  /** Build a skillId → SkillMastery lookup map. */
  getMasteryMap(masteries: SkillMastery[]): Map<string, SkillMastery> {
    return new Map(masteries.map(m => [m.skillId, m]));
  },
};

/**
 * GapAnalysisService — deterministic skill gap calculation.
 *
 * Responsible for:
 *   - Computing which skills are gapped (current < required)
 *   - Prioritizing gaps using learner context (behavior modifies ordering)
 *   - Traversing the prerequisite graph to surface unmet dependencies
 *
 * All calculations are pure functions of their inputs — no globals, no LLM.
 * Priority ordering is adjusted by LearningBehavior.challengeTolerance:
 *   high tolerance → harder gaps first
 *   low tolerance → easier wins first (closes gaps faster, builds momentum)
 */
import type { SkillMastery, SkillGap, Goal, Skill, LearnerContext, SkillLevel } from '../types';

const LEVEL_ORDER: Record<SkillLevel, number> = {
  novice: 0, beginner: 1, intermediate: 2, advanced: 3, expert: 4, master: 5,
};

export const GapAnalysisService = {
  /**
   * Compute all skill gaps for a learner against their goal.
   * Only skills appearing in goal.requiredSkills that are below requirement are included.
   */
  computeSkillGaps(
    masteries: SkillMastery[],
    goal: Goal,
    skills: Skill[],
  ): SkillGap[] {
    const masteryMap = new Map(masteries.map(m => [m.skillId, m]));
    const skillMap = new Map(skills.map(s => [s.id, s]));

    return goal.requiredSkills
      .map(req => {
        const skill = skillMap.get(req.skillId);
        if (!skill) return null;
        const mastery = masteryMap.get(req.skillId);
        const currentLevel: SkillLevel = mastery?.level ?? 'novice';
        const levelDiff = LEVEL_ORDER[req.requiredLevel] - LEVEL_ORDER[currentLevel];
        if (levelDiff <= 0) return null; // gap is closed

        const gapScore = Math.round((levelDiff / 5) * 100);
        const estimatedHoursToClose = Math.round((skill.estimatedHoursToLearn * levelDiff) / 5);
        const priority: SkillGap['priority'] =
          levelDiff >= 4 ? 'critical' :
          levelDiff >= 3 ? 'high' :
          levelDiff >= 2 ? 'medium' : 'low';

        return {
          skill,
          currentLevel,
          requiredLevel: req.requiredLevel,
          gapScore,
          priority,
          estimatedHoursToClose,
          recommendations: [] as string[],
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null) as SkillGap[];
  },

  /**
   * Sort gaps using learner context.
   * Primary sort: priority (critical → low).
   * Secondary sort: adjusted by challengeTolerance and market demand.
   */
  prioritizeGaps(gaps: SkillGap[], context: LearnerContext): SkillGap[] {
    const { behavior } = context;
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    return [...gaps].sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;

      if (behavior.challengeTolerance > 0.6) {
        // Stretch seekers: bigger gaps first
        return b.gapScore - a.gapScore;
      } else {
        // Momentum-seekers: quickest wins first
        return a.estimatedHoursToClose - b.estimatedHoursToClose;
      }
    });
  },

  /**
   * Return all unmet prerequisite skill IDs in the dependency chain of a skill.
   * Traverses the full prerequisite graph — not just direct prerequisites.
   */
  computePrerequisiteChain(
    skillId: string,
    skills: Skill[],
    masteries: SkillMastery[],
  ): string[] {
    const skillMap = new Map(skills.map(s => [s.id, s]));
    const masteryMap = new Map(masteries.map(m => [m.skillId, m]));
    const unmet = new Set<string>();

    const visit = (id: string, visited = new Set<string>()) => {
      if (visited.has(id)) return;
      visited.add(id);
      const skill = skillMap.get(id);
      if (!skill) return;
      for (const prereqId of skill.prerequisites) {
        const m = masteryMap.get(prereqId);
        if (!m || LEVEL_ORDER[m.level] < 1) {
          unmet.add(prereqId);
        }
        visit(prereqId, visited);
      }
    };

    visit(skillId);
    return [...unmet];
  },

  /**
   * Compute 0-1 prerequisite readiness for a specific skill.
   * 1.0 means all direct prerequisites are met at ≥ beginner level.
   */
  computePrerequisiteReadiness(
    skillId: string,
    skills: Skill[],
    masteries: SkillMastery[],
  ): number {
    const skill = skills.find(s => s.id === skillId);
    if (!skill || skill.prerequisites.length === 0) return 1;

    const masteryMap = new Map(masteries.map(m => [m.skillId, m]));
    const metCount = skill.prerequisites.filter(prereqId => {
      const m = masteryMap.get(prereqId);
      return m && LEVEL_ORDER[m.level] >= 1;
    }).length;

    return metCount / skill.prerequisites.length;
  },

  /**
   * Compute which skills in a set depend on a given skill (i.e., list it as a prerequisite).
   * Used to populate SkillWithContext.dependents for the Skill Universe UI.
   */
  computeDependents(skillId: string, skills: Skill[]): string[] {
    return skills
      .filter(s => s.prerequisites.includes(skillId))
      .map(s => s.id);
  },
};

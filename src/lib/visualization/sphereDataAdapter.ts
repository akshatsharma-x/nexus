import type { Skill, SkillMastery } from '@/lib/types';
import type { SphereSkill, SphereConnection, NodeMastery } from './sphereTypes';

function masteryToNode(m: SkillMastery | undefined): NodeMastery {
  if (!m || m.score === 0) return 'locked';
  if (m.score >= 80) return 'mastered';
  if (m.score >= 55) return 'strong';
  if (m.score >= 28) return 'developing';
  return 'weak';
}

export function buildSphereData(
  skills: Skill[],
  masteries: SkillMastery[],
  recommendedSkillIds: string[] = [],
  goalSkillId: string | null = null,
): { sphereSkills: SphereSkill[]; sphereConnections: SphereConnection[] } {
  const masteryMap = new Map<string, SkillMastery>();
  masteries.forEach(m => masteryMap.set(m.skillId, m));

  const maxDemand = Math.max(...skills.map(s => s.demandScore), 1);

  const sphereSkills: SphereSkill[] = skills.map(skill => ({
    id: skill.id,
    name: skill.name,
    mastery: masteryToNode(masteryMap.get(skill.id)),
    importance: skill.demandScore / maxDemand,
    isRecommended: recommendedSkillIds.includes(skill.id),
    isGoal: skill.id === goalSkillId,
  }));

  const skillIdSet = new Set(skills.map(s => s.id));
  const seen = new Set<string>();
  const sphereConnections: SphereConnection[] = [];

  for (const skill of skills) {
    for (const prereqId of skill.prerequisites) {
      if (!skillIdSet.has(prereqId)) continue;
      const key = `${prereqId}→${skill.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        sphereConnections.push({ fromId: prereqId, toId: skill.id, type: 'prerequisite' });
      }
    }
    // Limit related connections to avoid visual noise
    for (const relId of skill.related.slice(0, 2)) {
      if (!skillIdSet.has(relId)) continue;
      const key = [skill.id, relId].sort().join('—');
      if (!seen.has(key)) {
        seen.add(key);
        sphereConnections.push({ fromId: skill.id, toId: relId, type: 'related' });
      }
    }
  }

  return { sphereSkills, sphereConnections };
}

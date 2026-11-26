export type NodeMastery = 'mastered' | 'strong' | 'developing' | 'weak' | 'locked';

export interface SphereSkill {
  id: string;
  name: string;
  mastery: NodeMastery;
  importance: number; // 0–1; drives node radius
  isRecommended?: boolean;
  isGoal?: boolean;
}

export interface SphereConnection {
  fromId: string;
  toId: string;
  type: 'prerequisite' | 'related';
}

export interface LearningSphereProps {
  skills: SphereSkill[];
  connections: SphereConnection[];
  selectedSkillId?: string | null;
  recommendedSkillIds?: string[];
  goalSkillId?: string | null;
  interactive?: boolean;
  onSkillSelect?: (skillId: string | null) => void;
  className?: string;
  height?: number;
}

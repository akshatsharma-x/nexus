/**
 * AIIntelligenceService — boundary between deterministic and AI intelligence.
 *
 * ─── Deterministic (never replace with AI) ───────────────────────────────────
 *   - Prerequisite validation (graph traversal in GapAnalysisService)
 *   - Skill gap calculations (current vs required level delta)
 *   - Recommendation scoring (RecommendationScore in recommendation.ts)
 *   - Path constraint enforcement (unlock conditions, node ordering)
 *   - Mastery score math (MasteryService)
 *   - XP / level progression formulas
 *   - Schedule and time-fit calculations
 *
 * ─── AI (LLM-powered) ────────────────────────────────────────────────────────
 *   - Natural-language goal interpretation
 *   - Learner profile extraction from onboarding conversation
 *   - Recommendation explanation generation ("Why this?")
 *   - Assessment feedback generation
 *   - Learning intervention messages
 *   - Project brief generation
 *   - Adaptive question selection for assessments
 *   - Conversational tutoring (AI Tutor / api/tutor/route.ts)
 *
 * The AI layer NEVER overrides deterministic prerequisite validation.
 * AI generates explanations and suggestions; the algorithm validates and enforces.
 *
 * Current implementation: deterministic stubs for all AI methods.
 * Phase 7: replace each stub with Claude Opus 5 via the Anthropic SDK,
 * injecting the relevant LearnerContext into the system prompt.
 */
import type { LearnerContext, Goal, Recommendation } from '../types';

// ─── Request / Response types ─────────────────────────────────────────────────

export interface GoalInterpretationRequest {
  rawInput: string;
  context: LearnerContext;
}

export interface GoalInterpretationResult {
  interpretedGoal: Partial<Goal>;
  clarifyingQuestions: string[];
  confidence: number;
}

export interface RecommendationExplanationRequest {
  recommendation: Recommendation;
  context: LearnerContext;
  verbosity: 'brief' | 'detailed';
}

export interface RecommendationExplanationResult {
  headline: string;
  explanation: string;
  skillRefs: string[];
}

export interface LearningInterventionRequest {
  context: LearnerContext;
  triggerType:
    | 'streak_broken'
    | 'plateau'
    | 'pace_behind'
    | 'assessment_failed'
    | 'goal_at_risk';
}

export interface LearningInterventionResult {
  message: string;
  suggestedActions: string[];
  urgency: 'low' | 'medium' | 'high';
}

export interface ProjectGenerationRequest {
  context: LearnerContext;
  targetSkillIds: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  type: 'solo' | 'guided' | 'challenge';
}

export interface ProjectGenerationResult {
  title: string;
  description: string;
  estimatedHours: number;
  skillIds: string[];
  xpReward: number;
}

// ─── AI Intelligence service interface ───────────────────────────────────────

export interface IAIIntelligenceService {
  interpretGoal(req: GoalInterpretationRequest): Promise<GoalInterpretationResult>;
  explainRecommendation(req: RecommendationExplanationRequest): Promise<RecommendationExplanationResult>;
  generateIntervention(req: LearningInterventionRequest): Promise<LearningInterventionResult>;
  generateProject(req: ProjectGenerationRequest): Promise<ProjectGenerationResult>;
}

// ─── Deterministic stub implementation ───────────────────────────────────────
// Swap with LLM calls in Phase 7. Each method receives a LearnerContext so
// the real implementation can inject full profile context into the system prompt.

const INTERVENTION_MESSAGES: Record<LearningInterventionRequest['triggerType'], string> = {
  streak_broken: "Your streak was broken — no problem. Let's rebuild momentum with a short session today.",
  plateau: "You've been at this level for a while. Try a different resource format to break through.",
  pace_behind: "You're behind your estimated pace. Consider adjusting your weekly commitment or timeline.",
  assessment_failed: "This result shows gaps in the fundamentals. Review the core concepts before retaking.",
  goal_at_risk: "Your goal timeline is at risk. Let's reprioritize to focus on the critical path.",
};

export const AIIntelligenceService: IAIIntelligenceService = {
  async interpretGoal(_req: GoalInterpretationRequest): Promise<GoalInterpretationResult> {
    return {
      interpretedGoal: {},
      clarifyingQuestions: [
        'What is your target timeline?',
        'Do you have a specific company or role type in mind?',
        'How many hours per week can you dedicate?',
      ],
      confidence: 0.5,
    };
  },

  async explainRecommendation(req: RecommendationExplanationRequest): Promise<RecommendationExplanationResult> {
    const topReason = req.recommendation.reasons[0]?.description ?? 'Aligned with your learning goal.';
    return {
      headline: req.recommendation.title,
      explanation: req.verbosity === 'detailed'
        ? `${topReason} This recommendation was scored ${Math.round(req.recommendation.confidence * 100)}% confidence based on your current skill profile and goal.`
        : topReason,
      skillRefs: req.recommendation.skillId ? [req.recommendation.skillId] : [],
    };
  },

  async generateIntervention(req: LearningInterventionRequest): Promise<LearningInterventionResult> {
    return {
      message: INTERVENTION_MESSAGES[req.triggerType],
      suggestedActions: [],
      urgency: req.triggerType === 'goal_at_risk' ? 'high' : 'medium',
    };
  },

  async generateProject(req: ProjectGenerationRequest): Promise<ProjectGenerationResult> {
    return {
      title: `Practice Project: ${req.targetSkillIds[0] ?? 'General'}`,
      description: 'A hands-on project to consolidate your recent learning.',
      estimatedHours: req.difficulty * 5,
      skillIds: req.targetSkillIds,
      xpReward: req.difficulty * 200,
    };
  },
};

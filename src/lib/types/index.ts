// ─── Core Identifiers ────────────────────────────────────────────────────────
export type SkillLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
export type ResourceType = 'video' | 'article' | 'book' | 'course' | 'project' | 'podcast' | 'interactive';
export type PathNodeStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped';
export type AssessmentType = 'quiz' | 'project' | 'peer_review' | 'self_assessment' | 'challenge';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type CareerTrack = 'ml_engineer' | 'data_scientist' | 'frontend_engineer' | 'backend_engineer' | 'fullstack_engineer' | 'devops_engineer' | 'product_manager' | 'ux_designer' | 'security_engineer' | 'research_scientist';

// ─── User & Profile ───────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: Date;
  timezone: string;
  learningStyle: 'visual' | 'hands_on' | 'reading' | 'mixed';
  weeklyHoursAvailable: number;
  streakDays: number;
  totalXP: number;
  level: number;
}

export interface LearnerProfile {
  userId: string;
  currentRole: string;
  targetRole: string;
  yearsOfExperience: number;
  educationLevel: 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd' | 'bootcamp' | 'self_taught';
  strengths: string[];
  weaknesses: string[];
  interests: string[];
  preferredResourceTypes: ResourceType[];
  learningVelocity: number; // 0.5 = slow, 1 = normal, 2 = fast
  completionRate: number; // 0-1
  engagementScore: number; // 0-100
  lastActive: Date;
}

// ─── Skills ───────────────────────────────────────────────────────────────────
export interface Skill {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory?: string;
  description: string;
  icon?: string;
  color: string;
  prerequisites: string[]; // skill ids
  related: string[]; // skill ids
  demandScore: number; // 0-100 market demand
  difficulty: DifficultyLevel;
  estimatedHoursToLearn: number;
  tags: string[];
}

export interface SkillMastery {
  skillId: string;
  level: SkillLevel;
  score: number; // 0-100
  evidence: SkillEvidence[];
  lastPracticed: Date;
  assessedAt?: Date;
  trending: 'up' | 'down' | 'stable';
  confidenceScore: number; // 0-100 (how confident the system is in this assessment)
}

export interface SkillEvidence {
  type: 'assessment' | 'project' | 'course_completion' | 'peer_endorsement' | 'self_reported';
  sourceId: string;
  sourceName: string;
  score?: number;
  dateAcquired: Date;
  weight: number; // 0-1
}

export interface SkillRelationship {
  fromSkillId: string;
  toSkillId: string;
  type: 'prerequisite' | 'complementary' | 'alternative' | 'related';
  strength: number; // 0-1
}

export interface SkillGap {
  skill: Skill;
  currentLevel: SkillLevel;
  requiredLevel: SkillLevel;
  gapScore: number; // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedHoursToClose: number;
  recommendations: string[]; // resource ids
}

// ─── Goals ────────────────────────────────────────────────────────────────────
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetRole: CareerTrack;
  targetDate?: Date;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  requiredSkills: Array<{ skillId: string; requiredLevel: SkillLevel }>;
  progressPercent: number;
  createdAt: Date;
}

// ─── Learning Resources ───────────────────────────────────────────────────────
export interface LearningResource {
  id: string;
  title: string;
  type: ResourceType;
  provider: string;
  url: string;
  description: string;
  skillIds: string[];
  difficultyLevel: DifficultyLevel;
  estimatedHours: number;
  rating: number; // 0-5
  reviewCount: number;
  isFree: boolean;
  price?: number;
  tags: string[];
  prerequisites: string[]; // skill ids
  language: string;
  updatedAt: Date;
}

export interface Course extends LearningResource {
  modules: CourseModule[];
  totalLessons: number;
  hasCertificate: boolean;
  enrollmentCount: number;
  completionRate: number;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: number;
  estimatedMinutes: number;
  skillIds: string[];
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  skillIds: string[];
  estimatedHours: number;
  type: 'solo' | 'collaborative' | 'guided' | 'challenge';
  status: 'not_started' | 'in_progress' | 'completed' | 'submitted';
  completedAt?: Date;
  githubUrl?: string;
  liveUrl?: string;
  tags: string[];
  xpReward: number;
  mentorReview: boolean;
}

// ─── Assessments ──────────────────────────────────────────────────────────────
export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: AssessmentType;
  skillIds: string[];
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  totalQuestions?: number;
  passingScore: number; // 0-100
  xpReward: number;
  tags: string[];
}

export interface AssessmentResult {
  assessmentId: string;
  userId: string;
  score: number;
  timeTakenMinutes: number;
  completedAt: Date;
  skillUpdates: Array<{ skillId: string; newLevel: SkillLevel; scoreDelta: number }>;
  feedback: string;
  passed: boolean;
}

// ─── Learning Path ────────────────────────────────────────────────────────────
export interface LearningPath {
  id: string;
  userId: string;
  goalId: string;
  title: string;
  description: string;
  nodes: PathNode[];
  estimatedTotalHours: number;
  progressPercent: number;
  adaptationHistory: PathAdaptation[];
  createdAt: Date;
  lastAdaptedAt: Date;
  recommendationReason: string;
}

export interface PathNode {
  id: string;
  order: number;
  type: 'skill' | 'resource' | 'project' | 'assessment' | 'milestone';
  resourceId?: string;
  skillId?: string;
  assessmentId?: string;
  projectId?: string;
  title: string;
  description: string;
  status: PathNodeStatus;
  estimatedHours: number;
  xpReward: number;
  completedAt?: Date;
  unlockConditions: string[]; // node ids that must be completed
  whyRecommended: string;
  skillsGained: string[];
}

export interface PathAdaptation {
  timestamp: Date;
  reason: string;
  changesApplied: string[];
  triggeredBy: 'assessment_result' | 'pace_change' | 'goal_change' | 'feedback' | 'manual';
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export interface Progress {
  userId: string;
  totalXP: number;
  level: number;
  streakDays: number;
  longestStreak: number;
  totalHoursLearned: number;
  resourcesCompleted: number;
  assessmentsPassed: number;
  projectsCompleted: number;
  skillsAcquired: number;
  weeklyActivity: WeeklyActivity[];
  milestones: Milestone[];
}

export interface WeeklyActivity {
  weekStart: Date;
  hoursLearned: number;
  xpEarned: number;
  skillsProgressed: number;
  resourcesCompleted: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  achievedAt?: Date;
  xpReward: number;
  icon: string;
  type: 'streak' | 'skill' | 'course' | 'project' | 'assessment' | 'level';
}

// ─── Recommendations ──────────────────────────────────────────────────────────
export interface Recommendation {
  id: string;
  userId: string;
  type: 'resource' | 'skill' | 'project' | 'assessment' | 'path_adjustment';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  resourceId?: string;
  skillId?: string;
  assessmentId?: string;
  confidence: number; // 0-1
  reasons: RecommendationReason[];
  expiresAt?: Date;
  dismissed: boolean;
  createdAt: Date;
}

export interface RecommendationReason {
  type: 'skill_gap' | 'goal_alignment' | 'learning_style' | 'prerequisite' | 'trending' | 'peer_completion' | 'schedule_fit';
  description: string;
  weight: number;
}

// ─── AI Conversation ──────────────────────────────────────────────────────────
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  skillRefs?: string[];
  resourceRefs?: string[];
  actionSuggested?: string;
  /** Where an assistant reply came from: the model, or the local fallback. */
  source?: 'ai' | 'fallback';
}

export interface AIConversation {
  id: string;
  userId: string;
  topic?: string;
  messages: AIMessage[];
  startedAt: Date;
  lastMessageAt: Date;
}

// ─── Learning Session ──────────────────────────────────────────────────────────
export interface LearningSession {
  id: string;
  userId: string;
  resourceId: string;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes: number;
  progressPercent: number;
  notes?: string;
  focusScore: number; // 0-100
}

// ─── Career ───────────────────────────────────────────────────────────────────
export interface CareerRole {
  id: CareerTrack;
  title: string;
  description: string;
  averageSalary: { min: number; max: number; currency: string };
  demandTrend: 'rising' | 'stable' | 'declining';
  requiredSkills: Array<{ skillId: string; requiredLevel: SkillLevel; critical: boolean }>;
  niceToHaveSkills: string[];
  typicalPath: string[];
  companiesHiring: string[];
  growthOutlook: string;
}

// ─── Skill Passport ──────────────────────────────────────────────────────────
export interface SkillPassport {
  userId: string;
  version: string;
  generatedAt: Date;
  verifiedSkills: VerifiedSkill[];
  badges: Badge[];
  summary: string;
  shareUrl?: string;
}

export interface VerifiedSkill {
  skillId: string;
  level: SkillLevel;
  score: number;
  evidenceCount: number;
  verifiedAt: Date;
  issuedBy: string;
  credentialId: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'skill' | 'streak' | 'completion' | 'community' | 'special';
  earnedAt: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// ─── Learning Behavior ────────────────────────────────────────────────────────
// Dynamic behavioral metrics derived from learning session history.
// These metrics flow into the recommendation scoring engine to bias results
// toward the learner's demonstrated patterns:
//   practicePreference high → increase project/challenge recommendations
//   conceptRetention low → increase spaced-review interventions
//   challengeTolerance high → recommend harder exercises first
//   exploration high → surface breadth resources alongside depth
export interface LearningBehavior {
  userId: string;
  learningVelocity: number;        // ratio vs estimated time (1.0 = on pace, 1.3 = 30% faster)
  practicePreference: number;      // 0-1: 0 = pure theory, 1 = pure hands-on
  conceptRetention: number;        // 0-1: knowledge retained between sessions
  consistency: number;             // 0-1: regularity of learning activity
  challengeTolerance: number;      // 0-1: 0 = comfort zone, 1 = seeks stretch goals
  exploration: number;             // 0-1: 0 = deep focus, 1 = broad exploration
  sessionLengthPreference: 'micro' | 'short' | 'medium' | 'long';
  peakHours?: number[];            // productive hours of day (0-23)
  lastUpdated: Date;
}

// ─── Learner Preferences ──────────────────────────────────────────────────────
// UI/UX and notification preferences, distinct from LearnerProfile demographics.
export interface LearnerPreferences {
  resourceTypes: ResourceType[];
  learningStyle: 'visual' | 'hands_on' | 'reading' | 'mixed';
  weeklyHoursAvailable: number;
  preferShortSessions: boolean;
  dailyReminderEnabled: boolean;
  streakAlertsEnabled: boolean;
  recommendationUpdateFrequency: 'daily' | 'weekly' | 'on_demand';
  language: string;
  timezone: string;
}

// ─── Recommendation Score ─────────────────────────────────────────────────────
// Structured per-factor breakdown for every recommendation.
// Keeps each dimension inspectable so "Why this?" always has a factual answer.
export interface RecommendationScore {
  totalScore: number;              // 0-1 weighted aggregate
  goalAlignment: number;           // 0-1: how directly this closes a goal skill gap
  skillGapScore: number;           // 0-1: severity of the gap being addressed
  prerequisiteScore: number;       // 0-1: how ready the learner is (prereqs met ratio)
  difficultyFit: number;           // 0-1: difficulty match to current level + challenge tolerance
  timeFit: number;                 // 0-1: resource fits available weekly hours
  preferenceFit: number;           // 0-1: resource type matches learning preferences
  behaviorFit: number;             // 0-1: aligns with observed behavioral patterns
  resourceQuality: number;         // 0-1: rating, review count, freshness
  reasons: RecommendationReason[];
}

// ─── Learner Context ──────────────────────────────────────────────────────────
// Central bundle passed to every intelligence service.
// The architecture explicitly supports multiple learners — the demo uses the
// Akshat Sharma persona assembled in seed.ts via DEMO_LEARNER_CONTEXT.
//
// Dependency flow:
//   LearnerContext (user + profile + goal + masteries + progress + behavior)
//     → GapAnalysisService → SkillGaps
//     → RecommendationService → Recommendations (scored via RecommendationScore)
//     → PathAdaptationService → LearningPath adaptations
export interface LearnerContext {
  user: User;
  profile: LearnerProfile;
  goal: Goal;
  masteries: SkillMastery[];
  progress: Progress;
  behavior: LearningBehavior;
}

// Derived state computed by services from a LearnerContext.
export interface LearnerState {
  context: LearnerContext;
  skillGaps: SkillGap[];
  activeRecommendations: Recommendation[];
  lastComputedAt: Date;
}

// ─── Skill With Context ───────────────────────────────────────────────────────
// A Skill enriched with per-learner computed fields for UI and services.
// Used in Skill Universe and gap analysis — not stored, always computed.
export interface SkillWithContext extends Skill {
  mastery?: SkillMastery;
  goalRelevance: number;           // 0-1: importance for current goal
  isRequired: boolean;             // appears in goal.requiredSkills
  dependents: string[];            // skills that list this as a prerequisite (computed)
}

// ─── Path Health Report ───────────────────────────────────────────────────────
// Defined here so it can be shared across services without circular imports.
export interface PathHealthReport {
  onTrack: boolean;
  daysAheadOrBehind: number;
  criticalBlockers: string[];
  nextMilestone: string;
  estimatedCompletionDate: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// ─── Next Best Action ─────────────────────────────────────────────────────────
export interface NextBestAction {
  title: string;
  description: string;
  type: 'resource' | 'assessment' | 'project' | 'review';
  resourceId?: string;
  assessmentId?: string;
  projectId?: string;
  estimatedMinutes: number;
  xpReward: number;
  whyNow: string;
  confidence: number;
}

// ─── Assessment Pipeline ──────────────────────────────────────────────────────
// Shared types for the assessment → evidence → mastery update pipeline.

export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'code';
  skillId: string;
  difficulty: DifficultyLevel;
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  timeLimit?: number;
}

export interface AssessmentSession {
  sessionId: string;
  assessmentId: string;
  userId: string;
  questions: AssessmentQuestion[];
  startedAt: Date;
  timeLimit: number;
  answers: Record<string, string>;
  completed: boolean;
}

export interface AssessmentSubmission {
  sessionId: string;
  userId: string;
  answers: Record<string, string>;
  timeTakenMinutes: number;
  submittedAt: Date;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export interface OnboardingSkill {
  name: string;
  skillId?: string;
  confidence: 'learning' | 'comfortable' | 'strong';
}

export type OnboardingStage =
  | 'intro'
  | 'asking_experience'
  | 'asking_skills'
  | 'asking_availability'
  | 'asking_preferences'
  | 'review';

export interface OnboardingProfile {
  goalRaw: string;
  goal: string;
  targetRole: string;
  targetRoleId: CareerTrack | null;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  currentRole: string;
  yearsOfExperience: number | null;
  currentSkills: OnboardingSkill[];
  completedCourses: string[];
  interests: string[];
  weeklyHoursAvailable: number | null;
  targetDate: Date | null;
  targetDateRaw: string;
  learningFormatPreference: ResourceType[];
  projectPreference: 'structured' | 'open_ended' | 'mixed';
}

export interface OnboardingInsight {
  label: string;
  text: string;
}

export interface OnboardingMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  insight?: OnboardingInsight;
  suggestedReplies?: string[];
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
export interface Feedback {
  id: string;
  userId: string;
  type: 'resource_rating' | 'path_quality' | 'recommendation_quality' | 'difficulty_calibration';
  targetId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  helpful: boolean;
  createdAt: Date;
}

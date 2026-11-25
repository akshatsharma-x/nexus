/**
 * OnboardingService — Conversational learner profiling.
 *
 * ─── Deterministic (this file) ───────────────────────────────────────────────
 *   - Skill name matching and normalization against known skill IDs
 *   - Role detection via regex patterns
 *   - Timeline parsing (X months, X years)
 *   - Hours-per-week parsing
 *   - Confidence signal detection per skill (learning / comfortable / strong)
 *   - LearnerContext assembly from completed profile
 *
 * ─── AI upgrade path (Phase 7) ───────────────────────────────────────────────
 *   Replace processMessage() body with a Claude API call using the
 *   collected conversation history as context. The service interface
 *   (ProcessMessageResult) stays identical — only the internals swap.
 */

import { ACTIVE_GOAL } from '../data/seed';
import type {
  LearnerContext, LearnerProfile, User, Goal, SkillMastery, Progress,
  LearningBehavior, ResourceType, CareerTrack, SkillLevel, WeeklyActivity,
  OnboardingProfile, OnboardingSkill, OnboardingStage, OnboardingInsight,
} from '../types';

// ─── Track requirements ───────────────────────────────────────────────────────
// A goal with no required skills is unusable downstream: gap analysis returns
// nothing, readiness computes 0, and selectNextBestMove bails out entirely. This
// build carries a real requirement set for exactly one track, so that set is
// reused rather than invented — an onboarded ML Engineer goal then measures
// against the same skills Career and the services already use. Tracks without
// data stay empty on purpose; fabricating requirements would be worse than
// admitting they aren't tracked.
const TRACK_REQUIRED_SKILLS: Partial<Record<CareerTrack, Goal['requiredSkills']>> = {
  ml_engineer: ACTIVE_GOAL.requiredSkills,
};

// ─── Role patterns ────────────────────────────────────────────────────────────

const ROLE_PATTERNS: Array<{ pattern: RegExp; track: CareerTrack; label: string }> = [
  { pattern: /\b(ml|machine\s+learning)\s*(engineer|dev|developer)\b/i, track: 'ml_engineer', label: 'ML Engineer' },
  { pattern: /\b(ai|artificial\s+intelligence)\s*(engineer|developer)\b/i, track: 'ml_engineer', label: 'AI Engineer' },
  { pattern: /\bdata\s+scientist\b/i, track: 'data_scientist', label: 'Data Scientist' },
  { pattern: /\bdata\s+analyst\b/i, track: 'data_scientist', label: 'Data Analyst' },
  { pattern: /\bfrontend|front[\s-]end\b/i, track: 'frontend_engineer', label: 'Frontend Engineer' },
  { pattern: /\bbackend|back[\s-]end\b/i, track: 'backend_engineer', label: 'Backend Engineer' },
  { pattern: /\bfull[\s-]?stack\b/i, track: 'fullstack_engineer', label: 'Full Stack Engineer' },
  { pattern: /\bdevops\b/i, track: 'devops_engineer', label: 'DevOps Engineer' },
  { pattern: /\b(research|ml)\s+scientist\b/i, track: 'research_scientist', label: 'Research Scientist' },
];

// ─── Skill patterns (name → skillId in seed) ─────────────────────────────────

interface SkillPattern {
  pattern: RegExp;
  name: string;
  skillId?: string;
}

const SKILL_PATTERNS: SkillPattern[] = [
  { pattern: /\bpython\b/i, name: 'Python', skillId: 'sk_python' },
  { pattern: /\bjavascript\b|\.js\b/i, name: 'JavaScript', skillId: 'sk_javascript' },
  { pattern: /\btypescript\b/i, name: 'TypeScript', skillId: 'sk_typescript' },
  { pattern: /\breact\b/i, name: 'React', skillId: 'sk_react' },
  { pattern: /\bsql\b/i, name: 'SQL', skillId: 'sk_sql' },
  { pattern: /\bnode\.?js\b/i, name: 'Node.js' },
  { pattern: /\bmachine\s+learning\b/i, name: 'Machine Learning', skillId: 'sk_ml_fundamentals' },
  { pattern: /\bdeep\s+learning\b/i, name: 'Deep Learning', skillId: 'sk_deep_learning' },
  { pattern: /\bstatistics?\b|\bstats\b/i, name: 'Statistics', skillId: 'sk_statistics' },
  { pattern: /\blinear\s+algebra\b/i, name: 'Linear Algebra', skillId: 'sk_linear_algebra' },
  { pattern: /\bcalculus\b/i, name: 'Calculus', skillId: 'sk_calculus' },
  { pattern: /\bpandas\b/i, name: 'Pandas', skillId: 'sk_pandas' },
  { pattern: /\bnumpy\b/i, name: 'NumPy', skillId: 'sk_numpy' },
  { pattern: /\bpytorch\b/i, name: 'PyTorch', skillId: 'sk_pytorch' },
  { pattern: /\btensorflow\b/i, name: 'TensorFlow' },
  { pattern: /\bscikit[-\s]?learn\b|\bsklearn\b/i, name: 'Scikit-Learn', skillId: 'sk_sklearn' },
  { pattern: /\bc\+\+\b/i, name: 'C++' },
  { pattern: /\bjava\b(?!script)/i, name: 'Java' },
  { pattern: /\bvue\.?js?\b/i, name: 'Vue.js' },
  { pattern: /\bangular\b/i, name: 'Angular' },
  { pattern: /\bcss\b/i, name: 'CSS' },
  { pattern: /\bhtml\b/i, name: 'HTML' },
  { pattern: /\bgit\b/i, name: 'Git' },
  { pattern: /\bdocker\b/i, name: 'Docker' },
  { pattern: /\baws\b/i, name: 'AWS' },
  { pattern: /\bnlp\b|\bnatural\s+language\s+processing\b/i, name: 'NLP', skillId: 'sk_nlp' },
  { pattern: /\bcomputer\s+vision\b/i, name: 'Computer Vision' },
  { pattern: /\bllm\b|\blarge\s+language\s+model\b/i, name: 'LLM Engineering', skillId: 'sk_llm_engineering' },
  { pattern: /\bdata\s+analysis\b/i, name: 'Data Analysis' },
];

// ─── Confidence detection ─────────────────────────────────────────────────────

function detectSkillConfidence(text: string, skillName: string): OnboardingSkill['confidence'] {
  const idx = text.toLowerCase().indexOf(skillName.toLowerCase());
  if (idx === -1) return 'comfortable';

  const before = text.substring(Math.max(0, idx - 120), idx).toLowerCase();
  const rawAfter = text.substring(idx + skillName.length, idx + skillName.length + 100).toLowerCase();
  // Truncate after at clause boundaries — prevents "still learning X" from contaminating skills
  // mentioned in the same sentence before X (e.g. "know JS, React but still learning Python")
  const clauseEnd = rawAfter.search(/[.,;]|\bbut\b|\bhowever\b|\balthough\b/);
  const after = clauseEnd !== -1 ? rawAfter.substring(0, clauseEnd) : rawAfter;
  const ctx = before + ' ' + after;

  if (/\b(learning|studying|just\s+started|beginner|still\s+learning|trying|new\s+to|weak|limited|no\s+(?:real|much)|not\s+great)\b/.test(ctx)) {
    return 'learning';
  }
  if (/\b(know|proficient|expert|experienced|strong|years|comfortable|confident|advanced|fluent|good\s+at|work\s+with|built|written|developed|solid)\b/.test(ctx)) {
    return 'strong';
  }
  if (/\b(some|familiar|little|bit|okay|getting\s+better|improving|decent|basics?)\b/.test(ctx)) {
    return 'comfortable';
  }
  return 'comfortable';
}

// ─── Extractors ───────────────────────────────────────────────────────────────

export function extractTargetRole(text: string): { track: CareerTrack; label: string } | null {
  for (const rp of ROLE_PATTERNS) {
    if (rp.pattern.test(text)) return { track: rp.track, label: rp.label };
  }
  return null;
}

function extractCurrentRole(text: string): string {
  if (/\bfrontend|front[\s-]end\b/i.test(text)) return 'Frontend Developer';
  if (/\bbackend|back[\s-]end\b/i.test(text)) return 'Backend Developer';
  if (/\bfull[\s-]?stack\b/i.test(text)) return 'Full Stack Developer';
  if (/\bsoftware\s+(?:developer|engineer)\b/i.test(text)) return 'Software Developer';
  if (/\bdata\s+analyst\b/i.test(text)) return 'Data Analyst';
  if (/\bproduct\s+manager\b/i.test(text)) return 'Product Manager';

  const roleMatch = text.match(
    /\bi(?:'m|\s+am)\s+(?:a|an)\s+([\w\s-]+?)\s+(?:developer|engineer|analyst|designer|manager)\b/i
  );
  if (roleMatch?.[1]) {
    const role = roleMatch[1].trim();
    if (role.length > 1 && role.length < 35) {
      return role.charAt(0).toUpperCase() + role.slice(1) + ' Developer';
    }
  }

  const workMatch = text.match(/\bwork(?:ing)?\s+(?:as|in)\s+(?:a|an)?\s*([\w\s-]+?)\s*(?:developer|engineer|for|and|$)/i);
  if (workMatch?.[1]) {
    const role = workMatch[1].trim();
    if (role.length > 1 && role.length < 35) {
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
  }

  return '';
}

function extractExperienceLevel(text: string): 'beginner' | 'intermediate' | 'advanced' | null {
  if (/\b(complete\s+beginner|completely\s+new|no\s+(?:programming|coding|tech)\s+(?:experience|background)|never\s+(?:coded|programmed)|just\s+starting\s+out|starting\s+from\s+scratch|zero\s+(?:coding|programming)|not\s+a\s+programmer)\b/i.test(text)) {
    return 'beginner';
  }
  if (/\b(senior|lead|architect|principal|staff\s+engineer|10\+\s+years)\b/i.test(text)) {
    return 'advanced';
  }
  if (/\b\d{1,2}\s+years?\s+(?:of\s+)?(?:experience|coding|programming|working)\b/i.test(text)) {
    const m = text.match(/\b(\d{1,2})\s+years?/);
    if (m && parseInt(m[1]) >= 5) return 'advanced';
    return 'intermediate';
  }
  if (/\b(software\s+(?:developer|engineer)|frontend|backend|full[\s-]?stack|web\s+dev|i\s*(?:'m|am)\s+a\s+\w+\s+(?:developer|engineer))\b/i.test(text)) {
    return 'intermediate';
  }
  return null;
}

export function extractTimeline(text: string): { date: Date; raw: string } | null {
  const now = new Date();

  const rangeMatch = text.match(/\b(?:in|within)\s+(\d+)\s+months?\b/i);
  if (rangeMatch) {
    const months = parseInt(rangeMatch[1]);
    const date = new Date(now);
    date.setMonth(date.getMonth() + months);
    return { date, raw: `${months} month${months !== 1 ? 's' : ''}` };
  }

  const goalMonths = text.match(/(\d+)\s+months?\b/i);
  if (goalMonths) {
    const months = parseInt(goalMonths[1]);
    if (months >= 1 && months <= 36) {
      const date = new Date(now);
      date.setMonth(date.getMonth() + months);
      return { date, raw: `${months} month${months !== 1 ? 's' : ''}` };
    }
  }

  const yearsMatch = text.match(/\b(?:in|within)\s+(\d+)\s+years?\b/i);
  if (yearsMatch) {
    const yrs = parseInt(yearsMatch[1]);
    const date = new Date(now);
    date.setFullYear(date.getFullYear() + yrs);
    return { date, raw: `${yrs} year${yrs !== 1 ? 's' : ''}` };
  }

  if (/\basap\b|\bas\s+soon\s+as\s+possible\b/i.test(text)) {
    const date = new Date(now);
    date.setMonth(date.getMonth() + 3);
    return { date, raw: '3 months (ASAP)' };
  }

  return null;
}

function extractHoursPerWeek(text: string): number | null {
  const rangeMatch = text.match(/(\d+)\s*[-–]\s*(\d+)\s+hours?\s*(?:per\s*week|a\s*week|\/week|weekly)?/i);
  if (rangeMatch) return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);

  const weekMatch = text.match(/(\d+)\s+hours?\s*(?:per\s*week|a\s*week|\/week|weekly)/i);
  if (weekMatch) return parseInt(weekMatch[1]);

  const dayMatch = text.match(/(\d+)\s+hours?\s*(?:per\s*day|a\s*day|daily)/i);
  if (dayMatch) return parseInt(dayMatch[1]) * 5;

  if (/\bfull[\s-]?time\b/i.test(text)) return 40;
  if (/\bpart[\s-]?time\b/i.test(text)) return 20;
  if (/\bweekends?\b/i.test(text) && !/per\s*week/i.test(text)) return 5;
  if (/\ba\s+few\s+hours?\b/i.test(text)) return 4;

  const simpleMatch = text.match(/\b(\d+)\s+hours?\b/i);
  if (simpleMatch) {
    const h = parseInt(simpleMatch[1]);
    if (h >= 1 && h <= 80) return h;
  }

  return null;
}

function extractLearningPreferences(text: string): {
  formats: ResourceType[];
  project: OnboardingProfile['projectPreference'];
} {
  const lower = text.toLowerCase();
  const formats: ResourceType[] = [];

  // Plurals and gerunds are matched explicitly — people answer this question with
  // "building real projects", not "project". Without the suffixes the app's own
  // suggested replies extracted nothing.
  if (/\bvideos?\b|\bwatch(?:ing)?\b|\byoutube\b/.test(lower)) formats.push('video');
  if (/\bcourses?\b|\bstructured\b|\bcurriculum\b/.test(lower)) formats.push('course');
  if (/\bprojects?\b|\bbuild(?:ing)?\b|\bhands[\s-]?on\b|\bcoding\b/.test(lower)) formats.push('project');
  if (/\bread(?:ing)?\b|\bbooks?\b|\bdocumentation\b|\bdocs\b|\barticles?\b/.test(lower)) formats.push('article');
  if (/\binteractive\b|\bexercises?\b/.test(lower)) formats.push('interactive');

  // No default is injected here. This runs on every message, so defaulting to
  // ['video', 'project'] let an unrelated turn ("8-10 hours/week") record formats
  // the learner never asked for — and preferredResourceTypes feeds recommendation
  // scoring. buildLearnerContext still applies the default if nothing was ever
  // stated.

  let project: OnboardingProfile['projectPreference'] = 'mixed';
  if (/\bstructured\b|\bguided\b|\bstep[\s-]?by[\s-]?step\b/.test(lower)) project = 'structured';
  if (/\bopen[\s-]?ended\b|\bmy\s+own\s+projects?\b/.test(lower)) project = 'open_ended';

  return { formats, project };
}

function extractSkills(text: string, existing: OnboardingSkill[]): OnboardingSkill[] {
  const found: OnboardingSkill[] = [];
  const existingNames = new Set(existing.map(s => s.name.toLowerCase()));

  for (const sp of SKILL_PATTERNS) {
    if (sp.pattern.test(text)) {
      const name = sp.name;
      if (!existingNames.has(name.toLowerCase())) {
        found.push({
          name,
          skillId: sp.skillId,
          confidence: detectSkillConfidence(text, name),
        });
        existingNames.add(name.toLowerCase());
      }
    }
  }

  return found;
}

// ─── Merging ──────────────────────────────────────────────────────────────────

function mergeProfile(
  base: Partial<OnboardingProfile>,
  updates: Partial<OnboardingProfile>
): Partial<OnboardingProfile> {
  const merged: Partial<OnboardingProfile> = { ...base };

  // Scalar overwrite — only if the new value is meaningful
  const scalarKeys: (keyof OnboardingProfile)[] = [
    'goalRaw', 'goal', 'targetRole', 'targetRoleId',
    'experienceLevel', 'currentRole', 'yearsOfExperience',
    'weeklyHoursAvailable', 'targetDate', 'targetDateRaw',
    'projectPreference',
  ];
  for (const k of scalarKeys) {
    const v = updates[k];
    if (v !== null && v !== undefined && v !== '') {
      (merged as Record<string, unknown>)[k] = v;
    }
  }

  // Arrays: union
  merged.currentSkills = [
    ...(base.currentSkills ?? []),
    ...(updates.currentSkills ?? []).filter(
      s => !(base.currentSkills ?? []).some(e => e.name.toLowerCase() === s.name.toLowerCase())
    ),
  ];
  merged.interests = Array.from(new Set([...(base.interests ?? []), ...(updates.interests ?? [])]));
  merged.completedCourses = Array.from(
    new Set([...(base.completedCourses ?? []), ...(updates.completedCourses ?? [])])
  );
  merged.learningFormatPreference = Array.from(
    new Set([...(base.learningFormatPreference ?? []), ...(updates.learningFormatPreference ?? [])])
  );

  return merged;
}

// ─── Public: parseGoal (first message) ───────────────────────────────────────

export function parseGoal(input: string): Partial<OnboardingProfile> {
  const updates: Partial<OnboardingProfile> = {
    goalRaw: input,
    goal: input,
    targetRole: '',
    targetRoleId: null,
    currentRole: '',
    experienceLevel: null,
    currentSkills: [],
    interests: [],
    completedCourses: [],
    learningFormatPreference: [],
    projectPreference: 'mixed',
    weeklyHoursAvailable: null,
    targetDate: null,
    targetDateRaw: '',
  };

  const role = extractTargetRole(input);
  if (role) { updates.targetRole = role.label; updates.targetRoleId = role.track; }

  const timeline = extractTimeline(input);
  if (timeline) { updates.targetDate = timeline.date; updates.targetDateRaw = timeline.raw; }

  const currentRole = extractCurrentRole(input);
  if (currentRole) updates.currentRole = currentRole;

  const expLevel = extractExperienceLevel(input);
  if (expLevel) updates.experienceLevel = expLevel;

  updates.currentSkills = extractSkills(input, []);

  const hours = extractHoursPerWeek(input);
  if (hours) updates.weeklyHoursAvailable = hours;

  return updates;
}

// ─── Public: extractLearnerInformation (subsequent messages) ─────────────────

export function extractLearnerInformation(
  message: string,
  existing: Partial<OnboardingProfile>
): Partial<OnboardingProfile> {
  const updates: Partial<OnboardingProfile> = {};

  if (!existing.targetRoleId) {
    const role = extractTargetRole(message);
    if (role) { updates.targetRole = role.label; updates.targetRoleId = role.track; }
  }
  if (!existing.currentRole) {
    const cr = extractCurrentRole(message);
    if (cr) updates.currentRole = cr;
  }
  if (!existing.experienceLevel) {
    const exp = extractExperienceLevel(message);
    if (exp) updates.experienceLevel = exp;
  }
  if (!existing.targetDate) {
    const tl = extractTimeline(message);
    if (tl) { updates.targetDate = tl.date; updates.targetDateRaw = tl.raw; }
  }
  if (!existing.weeklyHoursAvailable) {
    const h = extractHoursPerWeek(message);
    if (h) updates.weeklyHoursAvailable = h;
  }

  const newSkills = extractSkills(message, existing.currentSkills ?? []);
  if (newSkills.length > 0) updates.currentSkills = newSkills;

  const { formats, project } = extractLearningPreferences(message);
  if (formats.length > 0) updates.learningFormatPreference = formats;
  if (project !== 'mixed') updates.projectPreference = project;

  return updates;
}

// ─── Public: generateInsight ──────────────────────────────────────────────────

export function generateInsight(
  profile: Partial<OnboardingProfile>,
  stage: OnboardingStage
): OnboardingInsight | null {
  const skills = profile.currentSkills ?? [];
  const hasProgramming = skills.some(
    s => s.confidence === 'strong' &&
      ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'Java', 'CSS', 'HTML'].includes(s.name)
  );
  const mlTarget = profile.targetRoleId &&
    ['ml_engineer', 'data_scientist', 'research_scientist'].includes(profile.targetRoleId);
  const mathMissing = mlTarget && !skills.some(s => ['Statistics', 'Linear Algebra'].includes(s.name));
  const mathWeak = skills.some(
    s => ['Statistics', 'Linear Algebra', 'Calculus'].includes(s.name) && s.confidence === 'learning'
  );

  if (stage === 'asking_skills' && hasProgramming) {
    return {
      label: 'NEXUS NOTICED',
      text: 'Strong software development foundations detected. I\'ll skip beginner programming material and focus on what\'s actually new territory for you.',
    };
  }
  if (stage === 'asking_availability' && (mathMissing || mathWeak) && mlTarget) {
    return {
      label: 'NEXUS NOTICED',
      text: 'Math fundamentals are the primary gap for ML engineering. Your path will prioritize statistics and linear algebra early, with immediate practical application alongside the theory.',
    };
  }
  if (stage === 'asking_preferences' && profile.weeklyHoursAvailable) {
    const h = profile.weeklyHoursAvailable;
    const pace = h >= 15 ? 'an intensive commitment — I\'ll structure for accelerated progress.'
      : h <= 4 ? 'a minimal commitment. I\'ll keep the path focused on the highest-impact material only.'
      : 'a sustainable weekly commitment — enough to make real progress without burning out.';
    return {
      label: 'NEXUS NOTICED',
      text: `${h} hours/week is ${pace}`,
    };
  }
  return null;
}

// ─── Public: generateNextQuestion ────────────────────────────────────────────

export interface QuestionResult {
  reply: string;
  nextStage: OnboardingStage;
  suggestedReplies?: string[];
  insight?: OnboardingInsight;
}

export function generateNextQuestion(
  profile: Partial<OnboardingProfile>,
  currentStage: OnboardingStage
): QuestionResult {
  const targetRole = profile.targetRole || 'your target role';

  switch (currentStage) {
    case 'intro': {
      const cr = profile.currentRole;
      const timeline = profile.targetDateRaw ? ` in ${profile.targetDateRaw}` : '';
      const reply = cr
        ? `Transitioning from ${cr} to ${targetRole}${timeline} — that's a concrete, achievable goal.\n\nTo build the right path, I need to understand your starting point more precisely. How long have you been in your ${cr} role? And how would you describe your overall technical depth — primarily the tools of your current role, or have you branched into adjacent areas?`
        : `${targetRole}${timeline} — a specific goal makes path planning much more accurate.\n\nTell me about your current background. Are you coming from a software development role, another technical field, or are you largely starting fresh?`;
      return {
        reply,
        nextStage: 'asking_experience',
        suggestedReplies: cr
          // cr is a role label ("Frontend Developer", "Data Analyst"), so it
          // takes "your … role" / "this role" rather than "working in …".
          ? ['About 2-3 years in this role', 'I just started this role', 'I have broader technical experience']
          : ['Software developer with a few years experience', 'Some programming background', 'Starting largely from scratch'],
      };
    }

    case 'asking_experience': {
      const expLevel = profile.experienceLevel;
      const roleId = profile.targetRoleId;
      const cr = profile.currentRole || 'your field';
      const isMlTarget = roleId && ['ml_engineer', 'data_scientist', 'research_scientist'].includes(roleId);

      if (expLevel === 'beginner') {
        return {
          reply: `Starting fresh is a clean slate — no habits to unlearn.\n\nBefore I plan your path, I want to know what you've already touched. Have you tried any programming at all — even a bit of Python, some JavaScript tutorials, a course you started? What have you explored?`,
          nextStage: 'asking_skills',
          suggestedReplies: ['No programming at all', 'I\'ve done a few tutorials', 'Basic Python knowledge'],
          insight: generateInsight(profile, 'asking_skills') ?? undefined,
        };
      }
      if (isMlTarget) {
        return {
          reply: `Your ${cr} background is a genuine advantage — software skills transfer directly into ML engineering.\n\nThe gaps for ML tend to be specific: Python depth, mathematics, and ML concepts. How would you describe your Python level — beginner, can write scripts independently, or comfortable with data work? And how's your math background: statistics, linear algebra, calculus?`,
          nextStage: 'asking_skills',
          suggestedReplies: [
            'Python is intermediate, math is weak',
            'Strong Python, no ML or math',
            'Just starting Python, haven\'t touched the math',
          ],
          insight: generateInsight(profile, 'asking_skills') ?? undefined,
        };
      }
      return {
        reply: `Got it. To calibrate the right starting point — which specific skills do you feel most confident in right now, and what feels most unfamiliar about ${targetRole}?`,
        nextStage: 'asking_skills',
        suggestedReplies: ['Strong in one area, gaps in domain knowledge', 'Comfortable with basics, need depth', 'Most things feel relatively new'],
        insight: generateInsight(profile, 'asking_skills') ?? undefined,
      };
    }

    case 'asking_skills': {
      const skills = profile.currentSkills ?? [];
      const strong = skills.filter(s => s.confidence === 'strong').map(s => s.name);
      const learning = skills.filter(s => s.confidence === 'learning').map(s => s.name);

      let ack = '';
      if (strong.length > 0) ack += `${strong.slice(0, 3).join(', ')} as confirmed strengths. `;
      if (learning.length > 0) ack += `${learning.slice(0, 2).join(' and ')} as areas in progress.`;

      const timelineNote = profile.targetDateRaw
        ? ` You mentioned ${profile.targetDateRaw} — is that a firm target, or flexible?`
        : '';

      const reply = `${ack ? 'Noted: ' + ack.trim() + '\n\n' : ''}Two practical questions to make the path realistic: How many hours per week can you genuinely commit to learning?${timelineNote}`;

      return {
        reply,
        nextStage: 'asking_availability',
        suggestedReplies: ['3-5 hours/week', '8-10 hours/week', '15+ hours/week'],
        insight: generateInsight(profile, 'asking_availability') ?? undefined,
      };
    }

    case 'asking_availability': {
      const h = profile.weeklyHoursAvailable;
      const ack = h
        ? `${h} hours/week — ${h >= 12 ? 'a solid commitment' : h >= 6 ? 'a realistic commitment' : 'a focused commitment'}. `
        : '';
      const reply = `${ack}One last question: how do you learn best? Some people absorb through structured video courses, others need to build things, some prefer reading documentation. What tends to actually stick for you?`;
      return {
        reply,
        nextStage: 'asking_preferences',
        suggestedReplies: ['Video courses with exercises', 'Building real projects', 'Mix of structured and hands-on'],
        insight: generateInsight(profile, 'asking_preferences') ?? undefined,
      };
    }

    case 'asking_preferences': {
      const prefs = profile.learningFormatPreference ?? [];
      const projectDriven = prefs.includes('project') || profile.projectPreference === 'open_ended';
      const note = projectDriven
        ? 'Project-driven learning — well matched to how this field actually works. '
        : '';
      return {
        reply: `${note}I have what I need.\n\nLet me show you what I've understood — review your profile and adjust anything that doesn't look right.`,
        nextStage: 'review',
      };
    }

    default:
      return { reply: "I have enough context to build your profile. Let me show you what I've understood.", nextStage: 'review' };
  }
}

// ─── Public: processMessage ───────────────────────────────────────────────────

export interface ProcessMessageResult {
  updates: Partial<OnboardingProfile>;
  mergedProfile: Partial<OnboardingProfile>;
  reply: string;
  nextStage: OnboardingStage;
  insight?: OnboardingInsight;
  suggestedReplies?: string[];
}

export function processMessage(
  message: string,
  profile: Partial<OnboardingProfile>,
  stage: OnboardingStage
): ProcessMessageResult {
  const updates = stage === 'intro'
    ? parseGoal(message)
    : extractLearnerInformation(message, profile);

  const mergedProfile = mergeProfile(profile, updates);
  const { reply, nextStage, suggestedReplies, insight } = generateNextQuestion(mergedProfile, stage);

  return { updates, mergedProfile, reply, nextStage, insight, suggestedReplies };
}

// ─── Public: buildLearnerContext ──────────────────────────────────────────────

function mapSkillToMastery(skill: OnboardingSkill): SkillMastery {
  const lvlMap: Record<OnboardingSkill['confidence'], { level: SkillLevel; score: number }> = {
    strong: { level: 'intermediate', score: 68 },
    comfortable: { level: 'beginner', score: 42 },
    learning: { level: 'beginner', score: 18 },
  };
  const { level, score } = lvlMap[skill.confidence];
  return {
    skillId: skill.skillId ?? `sk_onboard_${skill.name.toLowerCase().replace(/[\s.+]+/g, '_')}`,
    level,
    score,
    evidence: [{
      type: 'self_reported',
      sourceId: 'onboarding',
      sourceName: 'Onboarding Self-Assessment',
      dateAcquired: new Date(),
      weight: 0.4,
    }],
    lastPracticed: new Date(),
    trending: 'stable',
    confidenceScore: skill.confidence === 'strong' ? 65 : skill.confidence === 'comfortable' ? 50 : 35,
  };
}

export function buildLearnerContext(rawProfile: Partial<OnboardingProfile>): LearnerContext {
  const p = rawProfile as OnboardingProfile;
  const userId = `user_onboarded_${Date.now()}`;
  const now = new Date();

  // One effective format list drives learningStyle, preferredResourceTypes and
  // practicePreference, so those three can never disagree about the same learner.
  const formats: ResourceType[] = p.learningFormatPreference?.length
    ? p.learningFormatPreference
    : ['video', 'project'];

  const learningStyle: User['learningStyle'] = formats.includes('project')
    ? 'hands_on'
    : formats.includes('article')
    ? 'reading'
    : formats.includes('video')
    ? 'visual'
    : 'mixed';

  const user: User = {
    id: userId,
    name: 'You',
    email: '',
    joinedAt: now,
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
    learningStyle,
    weeklyHoursAvailable: p.weeklyHoursAvailable ?? 5,
    streakDays: 0,
    totalXP: 0,
    level: 1,
  };

  const expToYears: Record<string, number> = { beginner: 0, intermediate: 3, advanced: 7 };

  const learnerProfile: LearnerProfile = {
    userId,
    currentRole: p.currentRole || 'Learner',
    targetRole: p.targetRole || 'ML Engineer',
    yearsOfExperience: expToYears[p.experienceLevel ?? ''] ?? 1,
    educationLevel: 'self_taught',
    strengths: (p.currentSkills ?? []).filter(s => s.confidence === 'strong').map(s => s.name),
    weaknesses: [],
    interests: p.interests?.length ? p.interests : ['AI/ML'],
    preferredResourceTypes: formats,
    learningVelocity: Math.min(2, Math.max(0.5, (p.weeklyHoursAvailable ?? 5) / 10)),
    completionRate: 0.7,
    engagementScore: 75,
    lastActive: now,
  };

  const track = (p.targetRoleId ?? 'ml_engineer') as CareerTrack;

  const goal: Goal = {
    id: `goal_${userId}`,
    userId,
    title: p.goal || `Become a ${p.targetRole || 'ML Engineer'}`,
    description: p.goalRaw || '',
    targetRole: track,
    targetDate: p.targetDate ?? undefined,
    status: 'active',
    // Copied, not aliased — this context is the learner's own state and must not
    // share an array with the seed.
    requiredSkills: [...(TRACK_REQUIRED_SKILLS[track] ?? [])],
    progressPercent: 0,
    createdAt: now,
  };

  const masteries: SkillMastery[] = (p.currentSkills ?? [])
    .filter(s => s.skillId)
    .map(mapSkillToMastery);

  const emptyWeekly: WeeklyActivity[] = [];

  const progress: Progress = {
    userId,
    totalXP: 0,
    level: 1,
    streakDays: 0,
    longestStreak: 0,
    totalHoursLearned: 0,
    resourcesCompleted: 0,
    assessmentsPassed: 0,
    projectsCompleted: 0,
    skillsAcquired: masteries.length,
    weeklyActivity: emptyWeekly,
    milestones: [],
  };

  const hrs = p.weeklyHoursAvailable ?? 5;
  const behavior: LearningBehavior = {
    userId,
    learningVelocity: Math.min(2, Math.max(0.5, hrs / 10)),
    practicePreference: formats.includes('project') ? 0.75 : 0.4,
    conceptRetention: 0.65,
    consistency: 0.5,
    challengeTolerance:
      p.experienceLevel === 'advanced' ? 0.7
      : p.experienceLevel === 'intermediate' ? 0.5
      : 0.3,
    exploration: 0.4,
    sessionLengthPreference: hrs >= 15 ? 'long' : hrs >= 8 ? 'medium' : 'short',
    lastUpdated: now,
  };

  return { user, profile: learnerProfile, goal, masteries, progress, behavior };
}

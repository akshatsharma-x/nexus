/**
 * Client-side settings contract.
 *
 * Plain module (no React, no 'use client') so both client components and the
 * tutor API route can import the shared option lists and id maps.
 *
 * Persistence is a single namespaced localStorage object: `nexus_settings`.
 * Every read is sanitized against the option lists below, so corrupt or
 * out-of-date stored values degrade to defaults instead of breaking a <select>.
 */

export const SETTINGS_KEY = 'nexus_settings';

/** Every localStorage key NEXUS owns — used by data export and local reset. */
export const NEXUS_STORAGE_KEYS = [
  'nexus_settings',
  // Owned by src/lib/theme.ts, which keeps it out of this object so the
  // pre-paint script can read a bare word instead of parsing JSON.
  'nexus_theme',
  'nexus_onboarding_profile',
  'nexus_learner_context',
  'nexus_journey_progress',
  'nexus_resource_started',
  'nexus_mastery_state',
  'nexus_assessment_results',
  'nexus_project_progress',
] as const;

// ─── Option lists ─────────────────────────────────────────────────────────────
// These are the exact strings rendered in the settings UI. Stored values are
// validated against them on load.

export const TIMEZONE_OPTIONS = [
  'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Asia/Tokyo',
] as const;

export const WEEKLY_HOURS_OPTIONS = ['5h', '8h', '10h', '12h', '15h', '20h+'] as const;

export const LEARNING_STYLE_OPTIONS = ['Visual', 'Hands-on', 'Reading', 'Mixed'] as const;

export const FORMAT_OPTIONS = [
  'Video', 'Interactive', 'Reading', 'Video + Interactive', 'All',
] as const;

export const DIFFICULTY_OPTIONS = [
  'Easy start', 'Moderate challenge', 'Push my limits',
] as const;

export const AI_MODEL_OPTIONS = ['Claude Opus 5', 'Claude Sonnet 5', 'Claude Haiku 4.5'] as const;

export const PERSONALITY_OPTIONS = [
  'Encouraging', 'Direct & Strategic', 'Socratic', 'Detailed',
] as const;

export const CONTEXT_DEPTH_OPTIONS = [
  'Light (5 msgs)', 'Standard (10 msgs)', 'Full (last 20 msgs)',
] as const;

// ─── Runtime maps consumed by the tutor route ─────────────────────────────────

/** Settings label → Anthropic model id. */
export const MODEL_IDS: Record<string, string> = {
  'Claude Opus 5': 'claude-opus-5',
  'Claude Sonnet 5': 'claude-sonnet-5',
  'Claude Haiku 4.5': 'claude-haiku-4-5-20251001',
};

/** Settings label → number of trailing messages to send. */
export const CONTEXT_DEPTH_SIZES: Record<string, number> = {
  'Light (5 msgs)': 5,
  'Standard (10 msgs)': 10,
  'Full (last 20 msgs)': 20,
};

/** Settings label → system-prompt tone instruction. */
export const PERSONALITY_INSTRUCTIONS: Record<string, string> = {
  'Encouraging': 'Lead with what is going well before naming what needs work. Warm, motivating, never sugar-coating a real risk.',
  'Direct & Strategic': 'Be direct and prioritise ruthlessly. Lead with the single highest-leverage action. Respect the learner\'s time.',
  'Socratic': 'Prefer questions over answers. Guide the learner to the insight with two or three pointed questions before summarising.',
  'Detailed': 'Be thorough. Explain the reasoning behind each recommendation and include concrete numbers, timelines, and worked steps.',
};

// ─── Settings shape ───────────────────────────────────────────────────────────

export interface NexusSettings {
  // Profile
  timezone: string;
  // Learning preferences
  weeklyHours: string;
  learningStyle: string;
  preferredFormats: string;
  difficultyPreference: string;
  // Notifications
  notifyDailyReminder: boolean;
  notifyPathAdaptations: boolean;
  notifyAssessmentResults: boolean;
  notifyRecommendations: boolean;
  // AI tutor
  aiModel: string;
  tutorPersonality: string;
  contextDepth: string;
  learningAnalogies: boolean;
  // Privacy
  learningAnalytics: boolean;
  publicPassport: boolean;
}

export const DEFAULT_SETTINGS: NexusSettings = {
  timezone: 'America/Los_Angeles',
  weeklyHours: '12h',
  learningStyle: 'Hands-on',
  preferredFormats: 'Video + Interactive',
  difficultyPreference: 'Moderate challenge',
  notifyDailyReminder: true,
  notifyPathAdaptations: true,
  notifyAssessmentResults: false,
  notifyRecommendations: true,
  aiModel: 'Claude Opus 5',
  tutorPersonality: 'Direct & Strategic',
  contextDepth: 'Full (last 20 msgs)',
  learningAnalogies: true,
  learningAnalytics: true,
  publicPassport: false,
};

// ─── Sanitize / load / save ───────────────────────────────────────────────────

function pickEnum(
  value: unknown,
  options: readonly string[],
  fallback: string,
): string {
  return typeof value === 'string' && options.includes(value) ? value : fallback;
}

function pickBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Coerce arbitrary parsed JSON into a valid NexusSettings.
 * Unknown keys are dropped; invalid values fall back to their default.
 */
export function sanitizeSettings(raw: unknown): NexusSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const r = raw as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  return {
    timezone: pickEnum(r.timezone, TIMEZONE_OPTIONS, d.timezone),
    weeklyHours: pickEnum(r.weeklyHours, WEEKLY_HOURS_OPTIONS, d.weeklyHours),
    learningStyle: pickEnum(r.learningStyle, LEARNING_STYLE_OPTIONS, d.learningStyle),
    preferredFormats: pickEnum(r.preferredFormats, FORMAT_OPTIONS, d.preferredFormats),
    difficultyPreference: pickEnum(r.difficultyPreference, DIFFICULTY_OPTIONS, d.difficultyPreference),
    notifyDailyReminder: pickBool(r.notifyDailyReminder, d.notifyDailyReminder),
    notifyPathAdaptations: pickBool(r.notifyPathAdaptations, d.notifyPathAdaptations),
    notifyAssessmentResults: pickBool(r.notifyAssessmentResults, d.notifyAssessmentResults),
    notifyRecommendations: pickBool(r.notifyRecommendations, d.notifyRecommendations),
    aiModel: pickEnum(r.aiModel, AI_MODEL_OPTIONS, d.aiModel),
    tutorPersonality: pickEnum(r.tutorPersonality, PERSONALITY_OPTIONS, d.tutorPersonality),
    contextDepth: pickEnum(r.contextDepth, CONTEXT_DEPTH_OPTIONS, d.contextDepth),
    learningAnalogies: pickBool(r.learningAnalogies, d.learningAnalogies),
    learningAnalytics: pickBool(r.learningAnalytics, d.learningAnalytics),
    publicPassport: pickBool(r.publicPassport, d.publicPassport),
  };
}

/** Read settings from localStorage. Always returns a valid object. */
export function loadSettings(): NexusSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    // localStorage unavailable, or stored value is not valid JSON
    return { ...DEFAULT_SETTINGS };
  }
}

/** Event name broadcast on save so open pages can pick up new settings. */
export const SETTINGS_EVENT = 'nexus:settings-changed';

/**
 * Persist settings and notify listeners in this tab.
 * Returns false if storage was unavailable (private browsing, quota).
 */
export function saveSettings(settings: NexusSettings): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }));
    return true;
  } catch {
    return false;
  }
}

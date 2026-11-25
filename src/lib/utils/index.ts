import type { SkillLevel } from '../types';

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatXP(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
}

export function getLevelFromXP(xp: number): number {
  // Level formula: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100));
}

export function getXPForNextLevel(level: number): number {
  return Math.pow(level + 1, 2) * 100;
}

export function getXPProgress(currentXP: number): { level: number; current: number; required: number; percent: number } {
  const level = getLevelFromXP(currentXP);
  const xpForCurrentLevel = Math.pow(level, 2) * 100;
  const xpForNextLevel = Math.pow(level + 1, 2) * 100;
  const current = currentXP - xpForCurrentLevel;
  const required = xpForNextLevel - xpForCurrentLevel;
  return { level, current, required, percent: (current / required) * 100 };
}

export function skillLevelToScore(level: SkillLevel): number {
  const map: Record<SkillLevel, number> = {
    novice: 5, beginner: 25, intermediate: 50, advanced: 75, expert: 90, master: 100,
  };
  return map[level];
}

export function scoreToSkillLevel(score: number): SkillLevel {
  if (score >= 95) return 'master';
  if (score >= 80) return 'expert';
  if (score >= 65) return 'advanced';
  if (score >= 45) return 'intermediate';
  if (score >= 20) return 'beginner';
  return 'novice';
}

/**
 * The name to address a learner by, or '' to address them without one.
 * Onboarding stores the literal string "You" when the learner never gave a
 * name, so that placeholder is dropped rather than greeted by it — "Good
 * morning, You" is worse than no name at all. Only the first name is used.
 */
export function greetingName(fullName: string): string {
  const full = fullName.trim();
  if (!full || full === 'You') return '';
  return full.split(/\s+/)[0];
}

export function skillLevelLabel(level: SkillLevel): string {
  const labels: Record<SkillLevel, string> = {
    novice: 'Novice', beginner: 'Beginner', intermediate: 'Intermediate',
    advanced: 'Advanced', expert: 'Expert', master: 'Master',
  };
  return labels[level];
}

/**
 * The level's colour as a CSS variable, not a hex, so it re-inks with its
 * surface: .k-paper and the light theme re-cut the --skill-* ramp for cream,
 * where the dark-room hexes fall to 2–4:1. Valid wherever CSS takes a colour
 * (inline style, stylesheets) — not for canvas, WebGL or chart fills.
 */
export function skillLevelColor(level: SkillLevel): string {
  return `var(--skill-${level})`;
}

export function skillLevelBgClass(level: SkillLevel): string {
  const classes: Record<SkillLevel, string> = {
    novice: 'bg-slate-700',
    beginner: 'bg-blue-600',
    intermediate: 'bg-violet-600',
    advanced: 'bg-cyan-600',
    expert: 'bg-emerald-600',
    master: 'bg-amber-500',
  };
  return classes[level];
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function resourceTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    video: '▶', article: '📄', book: '📚', course: '🎓',
    project: '🔨', podcast: '🎙', interactive: '⚡',
  };
  return icons[type] || '📌';
}

export function difficultyLabel(level: number): string {
  const labels: Record<number, string> = { 1: 'Beginner', 2: 'Easy', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert' };
  return labels[level] || 'Unknown';
}

export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    urgent: '#f43f5e', high: '#f59e0b', medium: '#8b5cf6', low: '#6b7280',
  };
  return colors[priority] || '#6b7280';
}

export function rarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#6b7280', uncommon: '#10b981', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b',
  };
  return colors[rarity] || '#6b7280';
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex = (c: string) => parseInt(c.slice(1), 16);
  const r1 = (hex(color1) >> 16) & 255, g1 = (hex(color1) >> 8) & 255, b1 = hex(color1) & 255;
  const r2 = (hex(color2) >> 16) & 255, g2 = (hex(color2) >> 8) & 255, b2 = hex(color2) & 255;
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { OnboardingProfile } from '@/lib/types';

type FieldStatus = 'known' | 'partial' | 'unknown';

function StatusDot({ status }: { status: FieldStatus }) {
  const colors: Record<FieldStatus, string> = {
    known: 'var(--accent-green)',
    partial: 'var(--accent-amber)',
    unknown: 'var(--border-strong)',
  };
  return (
    <span
      className="flex-shrink-0 inline-block w-[5px] h-[5px] rounded-full mt-[3px]"
      style={{ background: colors[status] }}
      aria-hidden="true"
    />
  );
}

function Section({
  label,
  status,
  children,
  shouldReduce,
}: {
  label: string;
  status: FieldStatus;
  children?: React.ReactNode;
  shouldReduce: boolean | null;
}) {
  return (
    <motion.div
      className="space-y-1.5"
      initial={shouldReduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span
          className="text-[10px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
      </div>
      <div className="pl-3.5">
        {children ?? (
          <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            —
          </span>
        )}
      </div>
    </motion.div>
  );
}

function SkillGroup({
  label,
  skills,
  color,
  shouldReduce,
}: {
  label: string;
  skills: string[];
  color: string;
  shouldReduce: boolean | null;
}) {
  if (skills.length === 0) return null;
  return (
    <motion.div
      className="space-y-1.5"
      initial={shouldReduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div
        className="text-[10px] font-semibold tracking-[0.12em] uppercase"
        style={{ color }}
      >
        {label}
      </div>
      <div className="pl-3.5 space-y-0.5">
        {skills.map(s => (
          <div key={s} className="text-[12px]" style={{ color: 'var(--text-primary)' }}>
            {s}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface ProfilePreviewProps {
  profile: Partial<OnboardingProfile>;
}

export function ProfilePreview({ profile }: ProfilePreviewProps) {
  const shouldReduce = useReducedMotion();
  const skills = profile.currentSkills ?? [];
  const strongSkills = skills.filter(s => s.confidence === 'strong');
  const comfortableSkills = skills.filter(s => s.confidence === 'comfortable');
  const learningSkills = skills.filter(s => s.confidence === 'learning');

  const hasGoal = !!profile.targetRole;
  const hasStart = !!(profile.currentRole || profile.experienceLevel);
  const hasSkills = skills.length > 0;
  const hasTimeline = !!(profile.targetDateRaw || profile.targetDate);
  const hasAvail = !!profile.weeklyHoursAvailable;
  const hasPrefs = (profile.learningFormatPreference ?? []).length > 0;

  const goalStatus: FieldStatus = hasGoal ? 'known' : profile.goalRaw ? 'partial' : 'unknown';
  const startStatus: FieldStatus =
    profile.currentRole && profile.experienceLevel ? 'known' : hasStart ? 'partial' : 'unknown';

  return (
    <div className="space-y-5">
      <div
        className="text-[10px] font-bold tracking-[0.15em] uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        Your Profile
      </div>

      <Section label="Goal" status={goalStatus} shouldReduce={shouldReduce}>
        {(hasGoal || profile.goalRaw) ? (
          <span className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {profile.targetRole ?? 'Analysing…'}
          </span>
        ) : undefined}
      </Section>

      <Section label="Starting point" status={startStatus} shouldReduce={shouldReduce}>
        {hasStart ? (
          <div className="space-y-0.5">
            {profile.currentRole && (
              <div className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                {profile.currentRole}
              </div>
            )}
            {profile.experienceLevel && (
              <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1)}
              </div>
            )}
          </div>
        ) : undefined}
      </Section>

      {hasSkills && (
        <div className="space-y-3">
          <SkillGroup
            label="Strong"
            skills={strongSkills.map(s => s.name)}
            color="var(--accent-green)"
            shouldReduce={shouldReduce}
          />
          <SkillGroup
            label="Comfortable"
            skills={comfortableSkills.map(s => s.name)}
            color="var(--accent-violet-bright)"
            shouldReduce={shouldReduce}
          />
          <SkillGroup
            label="Developing"
            skills={learningSkills.map(s => s.name)}
            color="var(--accent-amber)"
            shouldReduce={shouldReduce}
          />
        </div>
      )}

      <Section
        label="Timeline"
        status={hasTimeline ? 'known' : 'unknown'}
        shouldReduce={shouldReduce}
      >
        {hasTimeline ? (
          <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
            {profile.targetDateRaw ??
              profile.targetDate?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        ) : undefined}
      </Section>

      <Section
        label="Availability"
        status={hasAvail ? 'known' : 'unknown'}
        shouldReduce={shouldReduce}
      >
        {hasAvail ? (
          <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
            {profile.weeklyHoursAvailable}h / week
          </span>
        ) : undefined}
      </Section>

      {hasPrefs && (
        <Section label="Learning style" status="known" shouldReduce={shouldReduce}>
          <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
            {(profile.learningFormatPreference ?? []).join(', ')}
          </span>
        </Section>
      )}
    </div>
  );
}

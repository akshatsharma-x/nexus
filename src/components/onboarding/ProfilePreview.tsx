'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { OnboardingProfile } from '@/lib/types';

type FieldStatus = 'known' | 'partial' | 'unknown';

const STATUS_TEXT: Record<FieldStatus, string> = {
  known: 'Confirmed',
  partial: 'Inferred',
  unknown: 'Not captured yet',
};

/* Three printer's marks instead of three colours: a filled block, an outline,
   a rule. They carry no meaning on their own — the status is always spelled out
   for assistive tech beside them — but they make the document scannable
   without a legend and without a second hue. */
function StatusMark({ status }: { status: FieldStatus }) {
  if (status === 'unknown') {
    return (
      <span
        aria-hidden="true"
        className="flex-shrink-0 inline-block"
        style={{ width: '9px', height: '2px', marginTop: '6px', background: 'var(--text-muted)' }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex-shrink-0 inline-block"
      style={{
        width: '9px',
        height: '9px',
        marginTop: '2px',
        background: status === 'known' ? 'var(--text-primary)' : 'transparent',
        border: '2px solid var(--text-primary)',
      }}
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
      className="space-y-1.5 pt-3"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
      initial={shouldReduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start gap-2">
        <StatusMark status={status} />
        <span className="k-label" style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </span>
        <span className="sr-only">{STATUS_TEXT[status]}</span>
      </div>
      <div className="pl-[17px]">
        {children ?? (
          <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
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
  mark,
  shouldReduce,
}: {
  label: string;
  skills: string[];
  mark: FieldStatus;
  shouldReduce: boolean | null;
}) {
  if (skills.length === 0) return null;
  return (
    <motion.div
      className="space-y-1"
      initial={shouldReduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-start gap-2">
        <StatusMark status={mark} />
        <span className="k-label" style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </span>
      </div>
      <div className="pl-[17px]">
        {skills.map(s => (
          <div key={s} className="text-[13px] leading-[1.6]" style={{ color: 'var(--text-primary)' }}>
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
    <div className="space-y-4">
      <div>
        <div className="k-slug">Your profile</div>
        <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Written as we talk. Nothing is fixed until you confirm it.
        </p>
      </div>

      <Section label="Goal" status={goalStatus} shouldReduce={shouldReduce}>
        {(hasGoal || profile.goalRaw) ? (
          <span className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {profile.targetRole || 'Reading your answer…'}
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
              <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1)}
              </div>
            )}
          </div>
        ) : undefined}
      </Section>

      {hasSkills && (
        <div
          className="space-y-3 pt-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <SkillGroup
            label="Strong"
            skills={strongSkills.map(s => s.name)}
            mark="known"
            shouldReduce={shouldReduce}
          />
          <SkillGroup
            label="Comfortable"
            skills={comfortableSkills.map(s => s.name)}
            mark="partial"
            shouldReduce={shouldReduce}
          />
          <SkillGroup
            label="Developing"
            skills={learningSkills.map(s => s.name)}
            mark="unknown"
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
            {profile.targetDateRaw ||
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
            {profile.weeklyHoursAvailable}h per week
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

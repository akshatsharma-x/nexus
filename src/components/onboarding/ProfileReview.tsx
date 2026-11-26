'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Edit2, Check, X, ArrowRight } from 'lucide-react';
import type { OnboardingProfile, OnboardingSkill } from '@/lib/types';
import { extractTargetRole, extractTimeline } from '@/lib/services/onboarding';
import { parseResourceTypes, resourceTypeLabel } from '@/lib/utils';

// ─── Inline editable field ────────────────────────────────────────────────────

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
}

function EditableField({ label, value, onSave, placeholder = '—' }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const display = value || placeholder;

  return (
    <div
      className="group py-3"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="k-label mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </div>
      <div className="flex items-start justify-between gap-3">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="k-field flex-1 text-sm px-2.5 py-1.5"
            onKeyDown={e => {
              if (e.key === 'Enter') { onSave(draft); setEditing(false); }
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            aria-label={`Edit ${label}`}
          />
        ) : (
          <div
            className="text-sm flex-1 leading-relaxed"
            style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {display}
          </div>
        )}

        {editing ? (
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={() => { onSave(draft); setEditing(false); }}
              className="w-7 h-7 flex items-center justify-center"
              style={{ background: 'var(--amber)', color: 'var(--ink)', border: '2px solid var(--k-edge)' }}
              aria-label="Save"
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => { setDraft(value); setEditing(false); }}
              className="w-7 h-7 flex items-center justify-center"
              style={{ color: 'var(--text-secondary)', border: '2px solid var(--border-default)' }}
              aria-label="Cancel"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          /* Revealed on hover, but also on keyboard focus — the pencil is the
             only way into the field, so it cannot be mouse-only. */
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex-shrink-0 w-7 h-7 flex items-center justify-center"
            style={{ color: 'var(--text-secondary)', border: '2px solid var(--border-default)' }}
            aria-label={`Edit ${label}`}
          >
            <Edit2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Skill chip ───────────────────────────────────────────────────────────────

function SkillChip({ skill }: { skill: OnboardingSkill }) {
  return (
    <span className="k-badge-quiet text-[11px]" title={skill.confidence}>
      {skill.name}
    </span>
  );
}

// ─── ProfileReview ────────────────────────────────────────────────────────────

interface ProfileReviewProps {
  profile: OnboardingProfile;
  onConfirm: (profile: OnboardingProfile) => void;
  onEdit: () => void;
}

export function ProfileReview({ profile, onConfirm, onEdit }: ProfileReviewProps) {
  const shouldReduce = useReducedMotion();
  // A spread alone would leave currentSkills pointing at the parent's array, so
  // the draft and the live profile would share it. Copy the array too.
  const [edited, setEdited] = useState<OnboardingProfile>(() => ({
    ...profile,
    currentSkills: Array.isArray(profile.currentSkills) ? [...profile.currentSkills] : [],
    learningFormatPreference: Array.isArray(profile.learningFormatPreference)
      ? [...profile.learningFormatPreference]
      : [],
  }));

  const update = (key: keyof OnboardingProfile) => (value: string) => {
    setEdited(p => ({ ...p, [key]: value }));
  };

  const expLabel = edited.experienceLevel
    ? edited.experienceLevel.charAt(0).toUpperCase() + edited.experienceLevel.slice(1)
    : '';

  const hoursLabel = edited.weeklyHoursAvailable
    ? `${edited.weeklyHoursAvailable} hours / week`
    : '';

  const timelineLabel = edited.targetDateRaw
    ? edited.targetDateRaw
    : edited.targetDate
    ? edited.targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const prefsLabel = (edited.learningFormatPreference ?? []).map(resourceTypeLabel).join(', ');

  const strongSkills = edited.currentSkills.filter(s => s.confidence === 'strong');
  const comfortableSkills = edited.currentSkills.filter(s => s.confidence === 'comfortable');
  const learningSkills = edited.currentSkills.filter(s => s.confidence === 'learning');

  return (
    <motion.div
      className="w-full"
      style={{ maxWidth: '36rem' }}
      initial={shouldReduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="k-slug">Learner profile</div>
        <h2 className="k-display-sm mt-2.5 mb-2.5">
          Here&apos;s what I understood
        </h2>
        <p className="nx-support">
          Hover or tab to any line to change it. When it reads true, I&apos;ll build the map.
        </p>
      </div>

      {/* Goal + role */}
      <EditableField label="Goal" value={edited.goal} onSave={update('goal')} placeholder="Describe your goal" />
      <EditableField
        label="Target role"
        value={edited.targetRole}
        onSave={v => {
          const roleResult = extractTargetRole(v);
          setEdited(p => ({
            ...p,
            targetRole: v,
            targetRoleId: roleResult ? roleResult.track : p.targetRoleId,
          }));
        }}
        placeholder="e.g. ML Engineer"
      />

      {/* Background */}
      <EditableField label="Current role" value={edited.currentRole} onSave={update('currentRole')} placeholder="e.g. Frontend Developer" />
      <EditableField
        label="Experience level"
        value={expLabel}
        onSave={v => setEdited(p => ({
          ...p,
          experienceLevel: (['beginner', 'intermediate', 'advanced'].includes(v.toLowerCase())
            ? v.toLowerCase()
            : p.experienceLevel) as OnboardingProfile['experienceLevel'],
        }))}
        placeholder="Beginner / Intermediate / Advanced"
      />

      {/* Skills — display only */}
      {edited.currentSkills.length > 0 && (
        <div className="py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="k-label mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Skills
          </div>
          <div className="space-y-3">
            {strongSkills.length > 0 && (
              <div>
                <div className="k-label mb-1.5" style={{ color: 'var(--text-secondary)' }}>Strong</div>
                <div className="flex flex-wrap gap-1.5">
                  {strongSkills.map(s => <SkillChip key={s.name} skill={s} />)}
                </div>
              </div>
            )}
            {comfortableSkills.length > 0 && (
              <div>
                <div className="k-label mb-1.5" style={{ color: 'var(--text-secondary)' }}>Comfortable</div>
                <div className="flex flex-wrap gap-1.5">
                  {comfortableSkills.map(s => <SkillChip key={s.name} skill={s} />)}
                </div>
              </div>
            )}
            {learningSkills.length > 0 && (
              <div>
                <div className="k-label mb-1.5" style={{ color: 'var(--text-secondary)' }}>Developing</div>
                <div className="flex flex-wrap gap-1.5">
                  {learningSkills.map(s => <SkillChip key={s.name} skill={s} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule */}
      <EditableField
        label="Weekly availability"
        value={hoursLabel}
        onSave={v => {
          const n = parseInt(v.replace(/\D/g, ''));
          if (!isNaN(n) && n > 0) setEdited(p => ({ ...p, weeklyHoursAvailable: n }));
        }}
        placeholder="e.g. 8 hours / week"
      />
      <EditableField
        label="Target timeline"
        value={timelineLabel}
        onSave={v => {
          const tl = extractTimeline(v);
          setEdited(p => ({
            ...p,
            targetDateRaw: tl ? tl.raw : v,
            targetDate: tl ? tl.date : p.targetDate,
          }));
        }}
        placeholder="e.g. 6 months"
      />
      <EditableField
        label="Learning preferences"
        value={prefsLabel}
        onSave={v => {
          // The field shows labels, so it has to read them back; free text
          // that names no format is dropped instead of cast to the enum.
          setEdited(p => ({ ...p, learningFormatPreference: parseResourceTypes(v) }));
        }}
        placeholder="e.g. Videos, Projects"
      />

      <hr className="k-rule-hard mt-1" />

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          className="k-btn k-btn-amber flex-1"
          onClick={() => onConfirm(edited)}
        >
          Build my learning map
          <ArrowRight size={14} />
        </button>
        <button
          className="k-btn k-btn-outline"
          onClick={onEdit}
        >
          Keep talking
        </button>
      </div>
    </motion.div>
  );
}

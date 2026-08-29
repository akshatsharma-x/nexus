'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Check, X, ArrowRight } from 'lucide-react';
import type { OnboardingProfile, OnboardingSkill } from '@/lib/types';
import { extractTargetRole, extractTimeline } from '@/lib/services/onboarding';

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
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div
        className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      <div className="flex items-start justify-between gap-3">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="flex-1 text-sm outline-none rounded px-2 py-1"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--accent-violet)',
              color: 'var(--text-primary)',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') { onSave(draft); setEditing(false); }
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            aria-label={`Edit ${label}`}
          />
        ) : (
          <div
            className="text-sm flex-1"
            style={{ color: value ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
          >
            {display}
          </div>
        )}

        {editing ? (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => { onSave(draft); setEditing(false); }}
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)' }}
              aria-label="Save"
            >
              <Check size={10} />
            </button>
            <button
              onClick={() => { setDraft(value); setEditing(false); }}
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              aria-label="Cancel"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            aria-label={`Edit ${label}`}
          >
            <Edit2 size={10} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Skill chip ───────────────────────────────────────────────────────────────

function SkillChip({ skill }: { skill: OnboardingSkill }) {
  const map: Record<OnboardingSkill['confidence'], { bg: string; text: string; border: string; label: string }> = {
    strong:      { bg: 'rgba(16,185,129,0.1)',  text: 'var(--accent-green)',          border: 'rgba(16,185,129,0.2)',  label: 'strong'      },
    comfortable: { bg: 'rgba(124,58,237,0.08)', text: 'var(--accent-violet-bright)', border: 'rgba(124,58,237,0.18)', label: 'comfortable' },
    learning:    { bg: 'rgba(245,158,11,0.08)', text: 'var(--accent-amber)',          border: 'rgba(245,158,11,0.18)', label: 'learning'    },
  };
  const c = map[skill.confidence];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      title={c.label}
    >
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
  const [edited, setEdited] = useState<OnboardingProfile>({ ...profile });

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

  const prefsLabel = (edited.learningFormatPreference ?? []).join(', ');

  const strongSkills = edited.currentSkills.filter(s => s.confidence === 'strong');
  const comfortableSkills = edited.currentSkills.filter(s => s.confidence === 'comfortable');
  const learningSkills = edited.currentSkills.filter(s => s.confidence === 'learning');

  return (
    <motion.div
      className="max-w-lg mx-auto w-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-8">
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3"
          style={{ color: 'var(--accent-violet-bright)' }}
        >
          Learner Profile
        </div>
        <h2 className="text-2xl font-bold mb-2.5" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Here's what I understood<br />about you.
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Hover any field to edit. When it looks right, let's build your path.
        </p>
      </div>

      {/* Goal + role */}
      <div className="mb-2">
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
      </div>

      {/* Background */}
      <div className="mb-2">
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
      </div>

      {/* Skills — display only */}
      {edited.currentSkills.length > 0 && (
        <div
          className="py-3"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div
            className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Skills
          </div>
          <div className="space-y-2.5">
            {strongSkills.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--accent-green)' }}>Strong</div>
                <div className="flex flex-wrap gap-1.5">
                  {strongSkills.map(s => <SkillChip key={s.name} skill={s} />)}
                </div>
              </div>
            )}
            {comfortableSkills.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--accent-violet-bright)' }}>Comfortable</div>
                <div className="flex flex-wrap gap-1.5">
                  {comfortableSkills.map(s => <SkillChip key={s.name} skill={s} />)}
                </div>
              </div>
            )}
            {learningSkills.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--accent-amber)' }}>Developing</div>
                <div className="flex flex-wrap gap-1.5">
                  {learningSkills.map(s => <SkillChip key={s.name} skill={s} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule */}
      <div className="mb-2">
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
            const parts = v.split(',').map(s => s.trim()).filter(Boolean) as OnboardingProfile['learningFormatPreference'];
            setEdited(p => ({ ...p, learningFormatPreference: parts }));
          }}
          placeholder="e.g. video, project"
        />
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <motion.button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-semibold"
          style={{
            background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-cyan) 100%)',
            color: 'white',
          }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.975 }}
          onClick={() => onConfirm(edited)}
        >
          Build my learning map
          <ArrowRight size={14} />
        </motion.button>
        <motion.button
          className="px-5 py-3.5 rounded-xl text-sm"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
          whileHover={{ background: 'var(--bg-overlay)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onEdit}
        >
          Edit profile
        </motion.button>
      </div>
    </motion.div>
  );
}

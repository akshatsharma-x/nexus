'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Bell, Zap, Shield, Download, Trash2 } from 'lucide-react';
import { DEMO_LEARNER_CONTEXT, LEARNER_PROFILE } from '@/lib/data/seed';
import { useOnboarding } from '@/lib/context/OnboardingContext';
import { useEditableSettings } from '@/lib/hooks/useSettings';
import {
  NEXUS_STORAGE_KEYS,
  TIMEZONE_OPTIONS,
  WEEKLY_HOURS_OPTIONS,
  LEARNING_STYLE_OPTIONS,
  FORMAT_OPTIONS,
  DIFFICULTY_OPTIONS,
  AI_MODEL_OPTIONS,
  PERSONALITY_OPTIONS,
  CONTEXT_DEPTH_OPTIONS,
} from '@/lib/settings';

import type { LucideIcon } from 'lucide-react';

/** Compact press-key sizing for the buttons that sit inside a form group. */
const INLINE_BTN = { padding: '0.5rem 0.75rem', fontSize: 11 } as const;

function SettingsSection({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="k-paper k-panel p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="k-tile">
          <Icon size={16} />
        </span>
        <h3 className="k-display-sm">{title}</h3>
      </div>
      <hr className="k-rule-hard" />
      <div>{children}</div>
    </section>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-3 border-t first:border-t-0"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div className="min-w-0">
        <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
        {description && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{description}</div>}
      </div>
      {children}
    </div>
  );
}

/** A muted clarifier for things this build stores but cannot act on. */
function SectionNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] pt-3" style={{ color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative w-10 h-5 flex-shrink-0"
      style={{
        background: checked ? 'var(--amber)' : 'transparent',
        border: '2px solid var(--text-primary)',
      }}>
      <motion.div
        className="absolute top-0.5 w-3 h-3"
        style={{ background: 'var(--text-primary)' }}
        animate={{ left: checked ? '22px' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function Select({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="k-field px-2 py-1.5 text-[12px] flex-shrink-0">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { onboardingProfile, learnerContext } = useOnboarding();
  const { draft, dirty, set, commit } = useEditableSettings();
  // The same person the rail and the top bar name, by the same rule: this card
  // used to show the demo persona's name and email to every learner.
  const liveUser = (learnerContext ?? DEMO_LEARNER_CONTEXT).user;
  const displayName = liveUser.name.trim() || 'Learner';

  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [confirmReset, setConfirmReset] = useState(false);

  const currentRole = onboardingProfile?.currentRole || LEARNER_PROFILE.currentRole;
  const targetRole = onboardingProfile?.targetRole || LEARNER_PROFILE.targetRole;

  useEffect(() => {
    if (saveState === 'idle') return;
    const t = setTimeout(() => setSaveState('idle'), 2500);
    return () => clearTimeout(t);
  }, [saveState]);

  function handleSave() {
    setSaveState(commit() ? 'saved' : 'error');
  }

  /** Everything NEXUS keeps for you lives in localStorage, so export is real. */
  function handleExport() {
    const data: Record<string, unknown> = {};
    for (const key of NEXUS_STORAGE_KEYS) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) continue;
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      } catch {
        // storage unavailable — skip this key
      }
    }

    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    for (const key of NEXUS_STORAGE_KEYS) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // storage unavailable — nothing to clear
      }
    }
    // Full reload so every provider re-reads from a clean slate.
    window.location.reload();
  }

  const statusText =
    saveState === 'saved' ? 'Saved'
    : saveState === 'error' ? 'Could not save — browser storage is unavailable'
    : dirty ? 'Unsaved changes'
    : '';

  return (
    <div className="max-w-3xl">

      {/* ── Header — sits directly on the dark room ──────────────────────── */}
      <div className="mb-8">
        <div className="k-slug mb-3">Settings</div>
        <h1 className="k-display mb-4">Preferences</h1>
        <p className="nx-support" style={{ maxWidth: 520 }}>
          Profile, learning preferences and AI tutor behavior. Edits are held as a draft
          until you save, and are stored only in this browser.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Profile */}
        <SettingsSection title="Profile" icon={User}>
          <div className="flex items-center gap-3 py-4">
            <div
              className="k-panel-flat k-figure flex-shrink-0 w-12 h-12 flex items-center justify-center text-lg"
              style={{ background: 'var(--amber)', color: 'var(--ink)' }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{displayName}</div>
              {/* Onboarding never asks for an email, so there is often none. */}
              {liveUser.email && (
                <div className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>{liveUser.email}</div>
              )}
            </div>
            <button
              onClick={() => router.push('/onboarding')}
              className="k-btn k-btn-outline ml-auto flex-shrink-0"
              style={INLINE_BTN}>
              Redo Profiling
            </button>
          </div>
          <SettingRow label="Current Role" description="Used to calibrate recommendations">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{currentRole}</span>
          </SettingRow>
          <SettingRow label="Target Role" description="Set during profiling">
            <span className="k-highlight text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{targetRole}</span>
          </SettingRow>
          <SettingRow label="Timezone">
            <Select
              label="Timezone"
              value={draft.timezone}
              options={TIMEZONE_OPTIONS}
              onChange={v => set('timezone', v)}
            />
          </SettingRow>
        </SettingsSection>

        {/* Learning Preferences */}
        <SettingsSection title="Learning Preferences" icon={Zap}>
          <SettingRow label="Weekly Hours Available" description="Shared with the AI tutor when it plans your week">
            <Select
              label="Weekly hours available"
              value={draft.weeklyHours}
              options={WEEKLY_HOURS_OPTIONS}
              onChange={v => set('weeklyHours', v)}
            />
          </SettingRow>
          <SettingRow label="Learning Style">
            <Select
              label="Learning style"
              value={draft.learningStyle}
              options={LEARNING_STYLE_OPTIONS}
              onChange={v => set('learningStyle', v)}
            />
          </SettingRow>
          <SettingRow label="Preferred Formats">
            <Select
              label="Preferred formats"
              value={draft.preferredFormats}
              options={FORMAT_OPTIONS}
              onChange={v => set('preferredFormats', v)}
            />
          </SettingRow>
          <SettingRow label="Difficulty Preference" description="Shared with the AI tutor to calibrate challenge">
            <Select
              label="Difficulty preference"
              value={draft.difficultyPreference}
              options={DIFFICULTY_OPTIONS}
              onChange={v => set('difficultyPreference', v)}
            />
          </SettingRow>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon={Bell}>
          <SettingRow label="Daily Learning Reminder" description="Reminds you to maintain your streak">
            <Toggle
              label="Daily learning reminder"
              checked={draft.notifyDailyReminder}
              onChange={v => set('notifyDailyReminder', v)}
            />
          </SettingRow>
          <SettingRow label="AI Path Adaptations" description="Flag when your path is updated">
            <Toggle
              label="AI path adaptations"
              checked={draft.notifyPathAdaptations}
              onChange={v => set('notifyPathAdaptations', v)}
            />
          </SettingRow>
          <SettingRow label="Assessment Results" description="Flag newly graded assessments">
            <Toggle
              label="Assessment results"
              checked={draft.notifyAssessmentResults}
              onChange={v => set('notifyAssessmentResults', v)}
            />
          </SettingRow>
          <SettingRow label="New Recommendations" description="Weekly recommendation digest">
            <Toggle
              label="New recommendations"
              checked={draft.notifyRecommendations}
              onChange={v => set('notifyRecommendations', v)}
            />
          </SettingRow>
          <SectionNote>
            Saved as preferences. This build has no email or push delivery, so nothing is sent yet.
          </SectionNote>
        </SettingsSection>

        {/* AI Settings */}
        <SettingsSection title="AI Tutor Settings" icon={Zap}>
          <SettingRow label="AI Model" description="Used for tutor replies when an API key is configured">
            <Select
              label="AI model"
              value={draft.aiModel}
              options={AI_MODEL_OPTIONS}
              onChange={v => set('aiModel', v)}
            />
          </SettingRow>
          <SettingRow label="Tutor Personality" description="How the AI communicates with you">
            <Select
              label="Tutor personality"
              value={draft.tutorPersonality}
              options={PERSONALITY_OPTIONS}
              onChange={v => set('tutorPersonality', v)}
            />
          </SettingRow>
          <SettingRow label="Context Depth" description="How much history the AI uses per conversation">
            <Select
              label="Context depth"
              value={draft.contextDepth}
              options={CONTEXT_DEPTH_OPTIONS}
              onChange={v => set('contextDepth', v)}
            />
          </SettingRow>
          <SettingRow label="Learning Analogies" description="AI uses your background for explanations">
            <Toggle
              label="Learning analogies"
              checked={draft.learningAnalogies}
              onChange={v => set('learningAnalogies', v)}
            />
          </SettingRow>
        </SettingsSection>

        {/* Privacy & Data */}
        <SettingsSection title="Privacy & Data" icon={Shield}>
          <SettingRow label="Learning Analytics" description="Use your activity to tune recommendations">
            <Toggle
              label="Learning analytics"
              checked={draft.learningAnalytics}
              onChange={v => set('learningAnalytics', v)}
            />
          </SettingRow>
          <SettingRow label="Public Skill Passport" description="Preference only — passport sharing is not available in this build">
            <Toggle
              label="Public skill passport"
              checked={draft.publicPassport}
              onChange={v => set('publicPassport', v)}
            />
          </SettingRow>
          <SectionNote>
            Your progress is stored only in this browser. Nothing leaves your device except tutor
            messages, which are sent to the model when an API key is configured.
          </SectionNote>

          <hr className="k-rule-thin mt-4" />

          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="k-btn k-btn-outline"
              style={INLINE_BTN}>
              <Download size={12} /> Export My Data
            </button>

            {confirmReset ? (
              <>
                <button
                  onClick={handleReset}
                  className="k-btn"
                  style={{ ...INLINE_BTN, color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', boxShadow: 'var(--k-shadow)' }}>
                  <Trash2 size={12} /> Erase everything
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="k-btn k-btn-outline"
                  style={INLINE_BTN}>
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="k-btn"
                style={{ ...INLINE_BTN, color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', boxShadow: 'var(--k-shadow)' }}>
                <Trash2 size={12} /> Reset Local Data
              </button>
            )}
          </div>
          {confirmReset && (
            <div className="text-[11px] pt-3" style={{ color: 'var(--accent-rose)', lineHeight: 1.6 }}>
              This clears your profile, journey progress, mastery, assessments and projects from this
              browser, then reloads. It cannot be undone — export first if you want a copy.
            </div>
          )}
        </SettingsSection>
      </div>

      {/* Save — on the dark room, below the sheets */}
      <div className="flex flex-wrap justify-end items-center gap-4 mt-6">
        <span
          role="status"
          aria-live="polite"
          className="text-[11px]"
          style={{ color: saveState === 'error' ? 'var(--accent-rose)' : saveState === 'saved' ? 'var(--accent-green-bright)' : 'var(--text-secondary)' }}>
          {statusText}
        </span>
        <button
          onClick={handleSave}
          disabled={!dirty}
          className="k-btn k-btn-solid">
          Save Changes
        </button>
      </div>
    </div>
  );
}

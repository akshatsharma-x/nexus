'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Zap, Moon, Globe, Shield, Download, Trash2 } from 'lucide-react';
import { CURRENT_USER, LEARNER_PROFILE } from '@/lib/data/seed';
import { GlowCard } from '@/components/ui/GlowCard';

import type { LucideIcon } from 'lucide-react';

function SettingsSection({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <GlowCard className="p-4">
      <div className="flex items-center gap-2 mb-4" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.15)' }}>
          <Icon size={13} style={{ color: 'var(--accent-violet-bright)' }} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </GlowCard>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
        {description && <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ defaultChecked = true }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className="relative w-9 h-5 rounded-full transition-colors"
      style={{ background: checked ? 'var(--accent-violet)' : 'var(--bg-overlay)' }}>
      <motion.div
        className="absolute top-0.5 w-4 h-4 rounded-full"
        style={{ background: 'white' }}
        animate={{ left: checked ? '18px' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function Select({ value, options }: { value: string; options: string[] }) {
  return (
    <select defaultValue={value}
      className="px-2 py-1 rounded-lg text-xs outline-none"
      style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {/* Profile */}
        <SettingsSection title="Profile" icon={User}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-cyan) 100%)', color: 'white' }}>
              {CURRENT_USER.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{CURRENT_USER.name}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{CURRENT_USER.email}</div>
            </div>
            <button className="ml-auto px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
              Edit Profile
            </button>
          </div>
          <SettingRow label="Current Role" description="Used to calibrate recommendations">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{LEARNER_PROFILE.currentRole}</span>
          </SettingRow>
          <SettingRow label="Target Role">
            <span className="text-xs" style={{ color: 'var(--accent-violet-bright)' }}>ML Engineer</span>
          </SettingRow>
          <SettingRow label="Timezone">
            <Select value={CURRENT_USER.timezone} options={['America/Los_Angeles', 'America/New_York', 'Europe/London', 'Asia/Tokyo']} />
          </SettingRow>
        </SettingsSection>

        {/* Learning Preferences */}
        <SettingsSection title="Learning Preferences" icon={Zap}>
          <SettingRow label="Weekly Hours Available" description="Used to pace your learning path">
            <Select value="12h" options={['5h', '8h', '10h', '12h', '15h', '20h+']} />
          </SettingRow>
          <SettingRow label="Learning Style">
            <Select value="Hands-on" options={['Visual', 'Hands-on', 'Reading', 'Mixed']} />
          </SettingRow>
          <SettingRow label="Preferred Formats">
            <Select value="Video + Interactive" options={['Video', 'Interactive', 'Reading', 'Video + Interactive', 'All']} />
          </SettingRow>
          <SettingRow label="Difficulty Preference" description="AI adjusts challenge level accordingly">
            <Select value="Moderate challenge" options={['Easy start', 'Moderate challenge', 'Push my limits']} />
          </SettingRow>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon={Bell}>
          <SettingRow label="Daily Learning Reminder" description="Get reminded to maintain your streak">
            <Toggle defaultChecked={true} />
          </SettingRow>
          <SettingRow label="AI Path Adaptations" description="Notify when your path is updated">
            <Toggle defaultChecked={true} />
          </SettingRow>
          <SettingRow label="Assessment Results" description="Email when assessments are graded">
            <Toggle defaultChecked={false} />
          </SettingRow>
          <SettingRow label="New Recommendations" description="Weekly AI recommendation digest">
            <Toggle defaultChecked={true} />
          </SettingRow>
        </SettingsSection>

        {/* AI Settings */}
        <SettingsSection title="AI Tutor Settings" icon={Zap}>
          <SettingRow label="AI Model" description="Claude Opus 5 is recommended for best personalization">
            <Select value="Claude Opus 5" options={['Claude Opus 5', 'Claude Sonnet 5', 'Claude Haiku 4.5']} />
          </SettingRow>
          <SettingRow label="Tutor Personality" description="How the AI communicates with you">
            <Select value="Direct & Strategic" options={['Encouraging', 'Direct & Strategic', 'Socratic', 'Detailed']} />
          </SettingRow>
          <SettingRow label="Context Depth" description="How much history the AI uses per conversation">
            <Select value="Full (last 20 msgs)" options={['Light (5 msgs)', 'Standard (10 msgs)', 'Full (last 20 msgs)']} />
          </SettingRow>
          <SettingRow label="Learning Analogies" description="AI uses your background (React/JS) for explanations">
            <Toggle defaultChecked={true} />
          </SettingRow>
        </SettingsSection>

        {/* Privacy & Data */}
        <SettingsSection title="Privacy & Data" icon={Shield}>
          <SettingRow label="Learning Analytics" description="Help improve NEXUS recommendations">
            <Toggle defaultChecked={true} />
          </SettingRow>
          <SettingRow label="Public Skill Passport" description="Allow others to view your verified skills">
            <Toggle defaultChecked={true} />
          </SettingRow>
          <div className="pt-2 flex gap-2">
            <motion.button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              whileHover={{ borderColor: 'var(--border-default)' }}>
              <Download size={11} /> Export My Data
            </motion.button>
            <motion.button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
              style={{ background: 'rgba(244,63,94,0.08)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.2)' }}
              whileHover={{ borderColor: 'rgba(244,63,94,0.4)' }}>
              <Trash2 size={11} /> Delete Account
            </motion.button>
          </div>
        </SettingsSection>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <motion.button
          className="px-5 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent-violet)', color: 'white' }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          Save Changes
        </motion.button>
      </div>
    </div>
  );
}

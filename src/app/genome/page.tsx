'use client';

import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { LEARNER_PROFILE, CURRENT_USER, USER_PROGRESS } from '@/lib/data/seed';

const RADAR_DATA = [
  { subject: 'Consistency', value: 88 },
  { subject: 'Depth', value: 62 },
  { subject: 'Breadth', value: 55 },
  { subject: 'Speed', value: 78 },
  { subject: 'Retention', value: 72 },
  { subject: 'Application', value: 65 },
];

const CATEGORY_DATA = [
  { name: 'Programming', hours: 68, color: '#3b82f6' },
  { name: 'ML/AI', hours: 24, color: '#8b5cf6' },
  { name: 'Mathematics', hours: 32, color: '#f43f5e' },
  { name: 'Data', hours: 18, color: '#06b6d4' },
  { name: 'Frontend', hours: 45, color: '#f59e0b' },
];

const LEARNING_TRAITS = [
  { label: 'Hands-on oriented', score: 95, description: 'Prefers building over reading' },
  { label: 'Streak maintainer', score: 90, description: 'Strong consistency habit' },
  { label: 'Visual learner', score: 82, description: 'Responds well to diagrams and visualizations' },
  { label: 'Deep diver', score: 71, description: 'Tends to go deep before moving on' },
  { label: 'Morning focus', score: 68, description: 'Most active sessions 7am–10am' },
  { label: 'Complexity seeker', score: 60, description: 'Comfortable with challenging material' },
];

export default function GenomePage() {
  const completionRate = Math.round(LEARNER_PROFILE.completionRate * 100);
  const velocity = LEARNER_PROFILE.learningVelocity;

  return (
    <div className="max-w-5xl">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Learning Genome
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {CURRENT_USER.name}&apos;s learning profile.
        </h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 520 }}>
          Derived from {USER_PROGRESS.totalHoursLearned}h of learning activity,{' '}
          {USER_PROGRESS.assessmentsPassed} assessments, and behavioral patterns.
          Used to personalize your path and pacing.
        </p>
        <div className="flex gap-6 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span>
            <span className="font-semibold" style={{ color: 'var(--accent-violet-bright)' }}>{velocity}×</span> avg velocity
          </span>
          <span>
            <span className="font-semibold" style={{ color: 'var(--accent-green)' }}>{completionRate}%</span> completion rate
          </span>
          <span>
            <span className="font-semibold" style={{ color: 'var(--accent-cyan)' }}>47m</span> avg session
          </span>
          <span>
            <span className="font-semibold" style={{ color: 'var(--accent-amber)' }}>84%</span> assessment avg
          </span>
        </div>
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-10"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        {/* Radar */}
        <div>
          <div
            className="text-[10px] font-bold tracking-[0.18em] uppercase mb-4"
            style={{ color: 'var(--text-muted)' }}
          >
            Learning dimensions
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DATA} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Radar
                name="You"
                dataKey="value"
                stroke="var(--accent-violet-bright)"
                fill="var(--accent-violet)"
                fillOpacity={0.18}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar */}
        <div>
          <div
            className="text-[10px] font-bold tracking-[0.18em] uppercase mb-4"
            style={{ color: 'var(--text-muted)' }}
          >
            Hours by category
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CATEGORY_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '11px' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
                {CATEGORY_DATA.map(entry => (
                  <Cell key={entry.name} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Learning traits ──────────────────────────────────────────────── */}
      <div className="mb-10 pb-10" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-6"
          style={{ color: 'var(--text-muted)' }}
        >
          Learning traits
        </div>
        <div className="space-y-4">
          {LEARNING_TRAITS.map(({ label, score, description }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 + 0.2 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{description}</span>
                </div>
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--accent-violet-bright)' }}>
                  {score}%
                </span>
              </div>
              <div className="h-[3px] rounded-full" style={{ background: 'var(--border-subtle)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, var(--accent-violet), var(--accent-cyan))' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ delay: i * 0.06 + 0.4, duration: 0.6 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Preferences ──────────────────────────────────────────────────── */}
      <div>
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Profile preferences · used to personalize your path
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3">
          {[
            { label: 'Learning style', value: 'Hands-on' },
            { label: 'Preferred formats', value: 'Video, Interactive' },
            { label: 'Weekly hours', value: `${CURRENT_USER.weeklyHoursAvailable}h available` },
            { label: 'Velocity', value: '1.3× average' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

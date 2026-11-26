'use client';

import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip
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

// Hours is one measure, so the bars are one hue and the category is carried by
// the axis label — a colour per bar would encode nothing the axis does not.
const CATEGORY_DATA = [
  { name: 'Programming', hours: 68 },
  { name: 'ML/AI', hours: 24 },
  { name: 'Mathematics', hours: 32 },
  { name: 'Data', hours: 18 },
  { name: 'Frontend', hours: 45 },
];

const LEARNING_TRAITS = [
  { label: 'Hands-on oriented', score: 95, description: 'Prefers building over reading' },
  { label: 'Streak maintainer', score: 90, description: 'Strong consistency habit' },
  { label: 'Visual learner', score: 82, description: 'Responds well to diagrams and visualizations' },
  { label: 'Deep diver', score: 71, description: 'Tends to go deep before moving on' },
  { label: 'Morning focus', score: 68, description: 'Most active sessions 7am–10am' },
  { label: 'Complexity seeker', score: 60, description: 'Comfortable with challenging material' },
];

/** Tooltip and axis chrome for a chart printed on stock rather than lit on dark. */
const TOOLTIP_STYLE = {
  background: 'var(--bg-surface)',
  border: '2px solid var(--text-primary)',
  color: 'var(--text-primary)',
  fontSize: '12px',
} as const;

const AXIS_TICK = { fill: 'var(--text-tertiary)', fontSize: 11 } as const;

export default function GenomePage() {
  const completionRate = Math.round(LEARNER_PROFILE.completionRate * 100);
  const velocity = LEARNER_PROFILE.learningVelocity;

  const summary = [
    { label: 'Avg velocity', value: `${velocity}×` },
    { label: 'Completion rate', value: `${completionRate}%` },
    { label: 'Avg session', value: '47m' },
    { label: 'Assessment avg', value: '84%' },
  ];

  return (
    <div className="max-w-5xl">

      {/* ── Header — sits directly on the dark room ──────────────────────── */}
      <div className="mb-8">
        <div className="k-slug mb-3">Learning Genome</div>
        <h1 className="k-display mb-4">{CURRENT_USER.name}</h1>
        <p className="nx-support" style={{ maxWidth: 520 }}>
          Learning profile derived from {USER_PROGRESS.totalHoursLearned}h of learning activity,{' '}
          {USER_PROGRESS.assessmentsPassed} assessments, and behavioral patterns.
          Used to personalize your path and pacing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">

        {/* ── Summary figures — the one primary object on this view ─────── */}
        <div className="k-paper k-panel-hero p-5">
          <div className="k-label mb-4">Profile at a glance</div>
          <hr className="k-rule-hard mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">
            {summary.map(({ label, value }) => (
              <div key={label}>
                <div className="k-figure text-2xl mb-1">{value}</div>
                <div className="k-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Charts ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Radar */}
          <div className="k-paper k-panel p-5">
            <div className="k-label mb-4">Learning dimensions</div>
            <hr className="k-rule-thin mb-2" />
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart data={RADAR_DATA} margin={{ top: 12, right: 24, bottom: 8, left: 24 }}>
                <PolarGrid stroke="var(--border-default)" />
                <PolarAngleAxis dataKey="subject" tick={AXIS_TICK} />
                <Radar
                  name="You"
                  dataKey="value"
                  stroke="var(--text-primary)"
                  fill="var(--amber)"
                  fillOpacity={0.55}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar */}
          <div className="k-paper k-panel p-5">
            <div className="k-label mb-4">Hours by category</div>
            <hr className="k-rule-thin mb-2" />
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={CATEGORY_DATA} margin={{ top: 8, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: 'rgba(20,20,16,0.05)' }}
                />
                <Bar
                  dataKey="hours"
                  fill="var(--amber)"
                  stroke="var(--text-primary)"
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Learning traits ──────────────────────────────────────────── */}
        <div className="k-paper k-panel p-5">
          <div className="k-label mb-4">Learning traits</div>
          <hr className="k-rule-hard mb-5" />
          <div className="space-y-5">
            {LEARNING_TRAITS.map(({ label, score, description }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 + 0.2 }}
              >
                <div className="flex items-baseline justify-between gap-4 mb-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{description}</div>
                  </div>
                  <span className="k-figure text-base flex-shrink-0">{score}%</span>
                </div>
                <div className="k-meter">
                  {/* The fill's own CSS transition would fight the frame-by-frame
                      width this animation writes, so it is disabled here. */}
                  <motion.div
                    className="k-meter-fill"
                    style={{ transition: 'none' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ delay: i * 0.06 + 0.4, duration: 0.6 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Preferences ──────────────────────────────────────────────── */}
        <div className="k-paper k-panel p-5">
          <div className="k-label mb-4">Profile preferences · used to personalize your path</div>
          <hr className="k-rule-hard mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Learning style', value: 'Hands-on' },
              { label: 'Preferred formats', value: 'Video, Interactive' },
              { label: 'Weekly hours', value: `${CURRENT_USER.weeklyHoursAvailable}h available` },
              { label: 'Velocity', value: '1.3× average' },
            ].map(({ label, value }) => (
              <div key={label} className="k-well p-3">
                <div className="k-label mb-1.5">{label}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

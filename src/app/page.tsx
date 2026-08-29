'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CURRENT_USER, USER_PROGRESS, ACTIVE_GOAL, ACTIVE_PATH, SKILLS } from '@/lib/data/seed';
import { getNextBestActions, getPathHealthReport } from '@/lib/services/recommendation';
import { useJourneyProgress } from '@/lib/context/JourneyProgressContext';
import { useMastery } from '@/lib/context/MasteryContext';
import { SkillBar } from '@/components/ui/SkillBar';
import { LearningSphere } from '@/components/visualization/LearningSphere';
import { buildSphereData } from '@/lib/visualization/sphereDataAdapter';
import { formatXP } from '@/lib/utils';

const RECOMMENDED_SKILL_IDS = ['sk_numpy', 'sk_statistics', 'sk_ml_fundamentals'];
const GOAL_SKILL_ID = 'sk_llm_engineering';

const pathHealth = getPathHealthReport();
const nextActions = getNextBestActions();
const goalTargetStr = ACTIVE_GOAL.targetDate
  ? ACTIVE_GOAL.targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  : 'In Progress';

export default function HomePage() {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const { nodeStatuses, progressPercent: journeyProgress, completedCount, totalCount } = useJourneyProgress();
  const { masteries } = useMastery();

  const chartData = USER_PROGRESS.weeklyActivity.map((w, i) => ({
    week: `W${i + 1}`,
    hours: w.hoursLearned,
  }));

  const { sphereSkills, sphereConnections } = useMemo(
    () => buildSphereData(SKILLS, masteries, RECOMMENDED_SKILL_IDS, GOAL_SKILL_ID),
    [masteries]
  );

  const primaryAction = nextActions[0];
  const activeSkillMasteries = masteries
    .filter(m => ['sk_python', 'sk_javascript', 'sk_react', 'sk_linear_algebra', 'sk_numpy', 'sk_pandas'].includes(m.skillId))
    .slice(0, 5);

  return (
    <div className="max-w-7xl">

      {/* ── Greeting + Goal ───────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          Good afternoon, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{CURRENT_USER.name}</span>
          {' '}· {CURRENT_USER.streakDays}-day streak · {formatXP(USER_PROGRESS.totalXP)} XP
        </p>
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)', lineHeight: 1.1 }}>
          ML Engineer
        </h1>
        <div className="flex items-center gap-4" style={{ maxWidth: 360 }}>
          <div className="flex-1 h-[3px] rounded-full" style={{ background: 'var(--border-subtle)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--accent-violet), var(--accent-cyan))' }}
              initial={{ width: 0 }}
              animate={{ width: `${journeyProgress}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <span className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--accent-cyan)' }}>
            {journeyProgress}%
          </span>
          <span className="text-xs flex-shrink-0" style={{ color: pathHealth.onTrack ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
            {pathHealth.onTrack ? 'On track' : `${pathHealth.daysAheadOrBehind}d behind`}
          </span>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="flex gap-10 items-start">

        {/* Left column */}
        <div className="flex-1 min-w-0">

          {/* Next best move */}
          {primaryAction && (
            <div className="mb-10">
              <div
                className="text-[10px] font-bold tracking-[0.18em] uppercase mb-4"
                style={{ color: 'var(--text-muted)' }}
              >
                Next best move
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {primaryAction.title}
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 480 }}>
                {primaryAction.whyNow}
              </p>
              <div className="flex items-center gap-4">
                <motion.a
                  href="/journey"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--accent-violet)', color: 'white' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start learning <ChevronRight size={14} />
                </motion.a>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  ~{primaryAction.estimatedMinutes}m · +{primaryAction.xpReward} XP
                </span>
              </div>
            </div>
          )}

          {/* Sphere preview */}
          <div
            className="rounded-2xl overflow-hidden mb-3"
            style={{
              height: 320,
              background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.07) 0%, rgba(6,182,212,0.03) 50%, transparent 80%)',
            }}
          >
            <LearningSphere
              skills={sphereSkills}
              connections={sphereConnections}
              selectedSkillId={selectedSkillId}
              recommendedSkillIds={RECOMMENDED_SKILL_IDS}
              goalSkillId={GOAL_SKILL_ID}
              onSkillSelect={setSelectedSkillId}
              height={320}
            />
          </div>
          <div className="mb-10 text-center">
            <a href="/skills" className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {SKILLS.length} skills tracked —{' '}
              <span style={{ color: 'var(--accent-violet-bright)' }}>Open Skill Universe →</span>
            </a>
          </div>

          {/* Activity */}
          <div className="mb-6" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '28px' }}>
            <div
              className="text-[10px] font-bold tracking-[0.18em] uppercase mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Learning activity · hours per week
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="homeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '11px' }}
                  itemStyle={{ color: 'var(--accent-cyan)' }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                />
                <Area type="monotone" dataKey="hours" stroke="var(--accent-cyan)" strokeWidth={1.5} fill="url(#homeAreaGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column */}
        <div className="w-[272px] flex-shrink-0 space-y-8">

          {/* Path */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--text-muted)' }}>
                Your path
              </div>
              <a href="/journey" className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--accent-violet-bright)' }}>
                View all <ArrowRight size={9} />
              </a>
            </div>
            <div>
              {ACTIVE_PATH.nodes.slice(0, 7).map((node) => {
                const liveStatus = nodeStatuses[node.id] ?? node.status;
                return (
                <div
                  key={node.id}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background:
                        liveStatus === 'completed' ? 'var(--accent-green)' :
                          liveStatus === 'in_progress' ? 'var(--accent-violet-bright)' :
                            liveStatus === 'available' ? 'var(--accent-cyan)' :
                              'var(--border-default)',
                    }}
                  />
                  <span
                    className="text-xs flex-1"
                    style={{
                      color:
                        liveStatus === 'completed' ? 'var(--text-muted)' :
                          liveStatus === 'in_progress' ? 'var(--text-primary)' :
                            'var(--text-secondary)',
                      textDecoration: liveStatus === 'completed' ? 'line-through' : undefined,
                      fontWeight: liveStatus === 'in_progress' ? 500 : 400,
                    }}
                  >
                    {node.title}
                  </span>
                </div>
              );})}
            </div>
            <div className="flex justify-between text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
              <span>{journeyProgress}% complete</span>
              <span>by {goalTargetStr}</span>
            </div>
          </div>

          {/* Skills */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '28px' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--text-muted)' }}>
                Skill progress
              </div>
              <a href="/skills" className="text-[10px]" style={{ color: 'var(--accent-violet-bright)' }}>
                See all
              </a>
            </div>
            <div className="space-y-3">
              {activeSkillMasteries.map((mastery, i) => {
                const skill = SKILLS.find(s => s.id === mastery.skillId);
                if (!skill) return null;
                return (
                  <SkillBar
                    key={mastery.skillId}
                    name={skill.name}
                    level={mastery.level}
                    score={mastery.score}
                    delay={i * 0.05}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

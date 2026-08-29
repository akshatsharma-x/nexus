'use client';

import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { ML_ENGINEER_ROLE, SKILL_MASTERIES, SKILLS, ACTIVE_GOAL } from '@/lib/data/seed';
import { skillLevelColor, skillLevelLabel } from '@/lib/utils';
import type { SkillLevel } from '@/lib/types';

const levelOrder: Record<SkillLevel, number> = {
  novice: 0, beginner: 1, intermediate: 2, advanced: 3, expert: 4, master: 5,
};

const ROLE_ALTERNATIVES = [
  { title: 'Data Scientist', match: 41, salary: '$130K–$190K', demand: 'High', color: '#8b5cf6' },
  { title: 'ML Engineer', match: 31, salary: '$140K–$220K', demand: 'Very high', color: '#06b6d4', active: true },
  { title: 'LLM Engineer', match: 28, salary: '$160K–$250K', demand: 'Critical', color: '#10b981' },
  { title: 'AI Researcher', match: 15, salary: '$150K–$280K', demand: 'High', color: '#f59e0b' },
];

export default function CareerPage() {
  const role = ML_ENGINEER_ROLE;
  const masteryMap = new Map(SKILL_MASTERIES.map(m => [m.skillId, m]));

  const skillReadiness = role.requiredSkills.map(req => {
    const mastery = masteryMap.get(req.skillId);
    const skill = SKILLS.find(s => s.id === req.skillId);
    const currentLevel = mastery?.level ?? 'novice';
    const met = levelOrder[currentLevel] >= levelOrder[req.requiredLevel];
    const progress = Math.round((levelOrder[currentLevel] / levelOrder[req.requiredLevel]) * 100);
    return { skill, req, currentLevel, met, progress: Math.min(100, progress) };
  }).filter(r => r.skill);

  const metCount = skillReadiness.filter(r => r.met).length;
  const readinessPercent = Math.round((metCount / skillReadiness.length) * 100);

  return (
    <div className="max-w-5xl">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Career
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {role.title}
        </h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 520 }}>
          {role.description}
        </p>

        {/* Readiness bar */}
        <div className="flex items-center gap-4 mb-3" style={{ maxWidth: 360 }}>
          <div className="flex-1 h-[3px] rounded-full" style={{ background: 'var(--border-subtle)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-green))' }}
              initial={{ width: 0 }}
              animate={{ width: `${readinessPercent}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <span className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--accent-cyan)' }}>
            {readinessPercent}% role ready
          </span>
        </div>

        <div className="flex gap-6 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span>
            <span className="font-semibold" style={{ color: 'var(--accent-green)' }}>{metCount}</span>/{skillReadiness.length} requirements met
          </span>
          <span style={{ color: 'var(--accent-green)' }}>
            <TrendingUp size={10} className="inline mr-1" />{role.growthOutlook}
          </span>
          <span>
            <span className="font-semibold" style={{ color: 'var(--accent-green)' }}>
              ${role.averageSalary.min / 1000}K–${role.averageSalary.max / 1000}K
            </span> avg
          </span>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="flex gap-10 items-start">

        {/* Skills readiness (left, dominant) */}
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] font-bold tracking-[0.18em] uppercase mb-5"
            style={{ color: 'var(--text-muted)' }}
          >
            Required skills
          </div>

          <div className="space-y-4">
            {skillReadiness.map(({ skill, req, currentLevel, met, progress }, i) => {
              const color = skillLevelColor(currentLevel);
              return (
                <motion.div
                  key={skill!.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {met ? (
                        <CheckCircle size={11} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                      ) : (
                        <XCircle size={11} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
                      )}
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {skill!.name}
                      </span>
                      {req.critical && (
                        <span
                          className="text-[9px] px-1 rounded"
                          style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--accent-rose)' }}
                        >
                          critical
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span style={{ color }}>
                        {skillLevelLabel(currentLevel)}
                      </span>
                      <ArrowRight size={9} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: skillLevelColor(req.requiredLevel) }}>
                        {skillLevelLabel(req.requiredLevel)}
                      </span>
                    </div>
                  </div>
                  <div className="h-[3px] rounded-full" style={{ background: 'var(--border-subtle)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: met
                          ? `linear-gradient(90deg, ${color}80, ${color})`
                          : 'linear-gradient(90deg, rgba(244,63,94,0.6), var(--accent-amber))',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ delay: i * 0.04 + 0.2, duration: 0.6 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: context */}
        <div className="w-[240px] flex-shrink-0 space-y-8">

          {/* Typical path */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
              Typical path
            </div>
            <div className="space-y-2">
              {role.typicalPath.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: step === 'ML Engineer' ? 'var(--accent-violet-bright)' : 'var(--border-default)',
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{
                      color: step === 'ML Engineer' ? 'var(--accent-violet-bright)' : 'var(--text-secondary)',
                      fontWeight: step === 'ML Engineer' ? 600 : 400,
                    }}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Companies */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
            <div className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
              Companies hiring
            </div>
            <div className="flex flex-wrap gap-1.5">
              {role.companiesHiring.map(c => (
                <span
                  key={c}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Role alternatives ─────────────────────────────────────────────── */}
      <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-6"
          style={{ color: 'var(--text-muted)' }}
        >
          Alternative paths · current skill match
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ROLE_ALTERNATIVES.map(({ title, match, salary, demand, color, active }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              {active && (
                <div className="text-[9px] mb-1.5 font-semibold uppercase tracking-wider" style={{ color }}>
                  ← Your goal
                </div>
              )}
              <div className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</div>
              <div className="text-2xl font-bold mb-0.5" style={{ color }}>{match}%</div>
              <div className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>current match</div>
              <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{salary}</div>
              <div className="text-[10px]" style={{ color }}>
                {demand} demand
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { ML_ENGINEER_ROLE, SKILLS, ACTIVE_GOAL, DEMO_LEARNER_CONTEXT } from '@/lib/data/seed';
import { skillLevelColor, skillLevelLabel } from '@/lib/utils';
import { useMastery } from '@/lib/context/MasteryContext';
import { useOnboarding } from '@/lib/context/OnboardingContext';
import { MasteryService } from '@/lib/services/mastery';
import { GapAnalysisService } from '@/lib/services/gap-analysis';
import type { SkillLevel } from '@/lib/types';

const levelOrder: Record<SkillLevel, number> = {
  novice: 0, beginner: 1, intermediate: 2, advanced: 3, expert: 4, master: 5,
};

export default function CareerPage() {
  const role = ML_ENGINEER_ROLE;
  const { masteries } = useMastery();
  const { onboardingProfile, learnerContext } = useOnboarding();

  const targetRoleTitle = onboardingProfile?.targetRole ?? role.title;

  const masteryMap = MasteryService.getMasteryMap(masteries);

  // Readiness and gaps both come from the shared services, so this page cannot
  // drift from the Tutor, Journey or Skills view. Requirements are read from
  // the learner's goal — the same list the readiness figure is computed over.
  const readinessPercent = MasteryService.computeOverallReadiness(masteries, ACTIVE_GOAL);

  const gaps = GapAnalysisService.prioritizeGaps(
    GapAnalysisService.computeSkillGaps(masteries, ACTIVE_GOAL, SKILLS),
    learnerContext ?? DEMO_LEARNER_CONTEXT,
  );
  const gapMap = new Map(gaps.map(g => [g.skill.id, g]));
  const gapRank = new Map(gaps.map((g, i) => [g.skill.id, i]));

  /** Criticality is role reference data; the goal list doesn't carry it. */
  const criticalBySkill = new Map(role.requiredSkills.map(r => [r.skillId, r.critical]));

  const skillReadiness = ACTIVE_GOAL.requiredSkills
    .map(req => {
      const skill = SKILLS.find(s => s.id === req.skillId);
      const gap = gapMap.get(req.skillId);
      const currentLevel = masteryMap.get(req.skillId)?.level ?? 'novice';
      const requiredScore = levelOrder[req.requiredLevel] || 1;
      const progress = Math.min(100, Math.round((levelOrder[currentLevel] / requiredScore) * 100));
      return {
        skill,
        requiredLevel: req.requiredLevel,
        critical: criticalBySkill.get(req.skillId) ?? false,
        currentLevel,
        met: !gap, // the gap service is the single authority on met/unmet
        progress,
        gap,
      };
    })
    .filter(r => r.skill)
    // Open gaps first, in the service's prioritised order.
    .sort((a, b) => {
      if (a.met !== b.met) return a.met ? 1 : -1;
      if (!a.met && !b.met) {
        return (gapRank.get(a.skill!.id) ?? 0) - (gapRank.get(b.skill!.id) ?? 0);
      }
      return 0;
    });

  const metCount = skillReadiness.filter(r => r.met).length;

  // Only the learner's own goal has a real match figure — this build has skill
  // requirements for one role, so the others are market reference only and
  // deliberately show no percentage rather than an invented one.
  const roleAlternatives: Array<{
    title: string; salary: string; demand: string;
    match?: number; active?: boolean;
  }> = [
    { title: 'Data Scientist', salary: '$130K–$190K', demand: 'High' },
    { title: targetRoleTitle, match: readinessPercent, salary: '$140K–$220K', demand: 'Very high', active: true },
    { title: 'LLM Engineer', salary: '$160K–$250K', demand: 'Critical' },
    { title: 'AI Researcher', salary: '$150K–$280K', demand: 'High' },
  ];

  return (
    <div className="max-w-5xl">

      {/* ── Header, directly on the dark room ────────────────────────────── */}
      <div className="mb-8">
        <div className="k-slug mb-3">Career</div>
        <h1 className="k-display mb-4">{targetRoleTitle}</h1>
        <p
          className={`nx-support ${targetRoleTitle === role.title ? 'mb-6' : 'mb-2'}`}
          style={{ maxWidth: 560 }}
        >
          {role.description}
        </p>
        {targetRoleTitle !== role.title && (
          <p className="text-[11px] mb-6" style={{ color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: 560 }}>
            Requirements, salary and market data shown are for {role.title} — the only role
            profile this build tracks in detail.
          </p>
        )}

        {/* Readiness */}
        <div className="flex items-end gap-4 mb-6">
          <div className="k-figure text-4xl leading-none">{readinessPercent}%</div>
          <div className="k-label pb-1">Role ready</div>
        </div>
        <div className="k-meter mb-6" style={{ maxWidth: 420 }}>
          <motion.div
            className="k-meter-fill"
            initial={{ width: 0 }}
            animate={{ width: `${readinessPercent}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          <span>
            <span className="k-figure">{metCount}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>/{skillReadiness.length}</span> requirements met
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingUp size={12} style={{ color: 'var(--text-tertiary)' }} />
            {role.growthOutlook}
          </span>
          <span>
            <span className="k-figure">
              ${role.averageSalary.min / 1000}K–${role.averageSalary.max / 1000}K
            </span> avg
          </span>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-start">

        {/* Required skills — the primary object on this view, set as a ruled
            table so current and required level read down a column. */}
        <div className="k-paper k-panel-hero flex-1 min-w-0 w-full p-5 md:p-6">
          <div className="k-label mb-1">Required skills</div>
          <div className="k-rule-hard mb-4 mt-3" />

          <div className="space-y-4">
            {skillReadiness.map(({ skill, requiredLevel, critical, currentLevel, met, progress, gap }, i) => {
              const color = skillLevelColor(currentLevel);
              return (
                <motion.div
                  key={skill!.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {met ? (
                        <CheckCircle size={12} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                      ) : (
                        <XCircle size={12} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
                      )}
                      <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {skill!.name}
                      </span>
                      {critical && <span className="k-badge flex-shrink-0">Critical</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] flex-shrink-0">
                      <span style={{ color }}>
                        {skillLevelLabel(currentLevel)}
                      </span>
                      <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: skillLevelColor(requiredLevel) }}>
                        {skillLevelLabel(requiredLevel)}
                      </span>
                      {gap && (
                        <span className="nx-numeric" style={{ color: 'var(--text-tertiary)' }}>
                          ~{gap.estimatedHoursToClose}h
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="k-meter" style={{ height: 6 }}>
                    <motion.div
                      className="k-meter-fill"
                      style={{ background: met ? 'var(--ink)' : 'var(--amber)' }}
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

        {/* Right: context sheets */}
        <div className="w-full md:w-[248px] flex-shrink-0 flex flex-col gap-5 md:gap-6">

          {/* Typical path */}
          <div className="k-paper k-panel p-5">
            <div className="k-label mb-1">Typical path</div>
            <div className="k-rule-hard mb-4 mt-3" />
            <div className="space-y-2.5">
              {role.typicalPath.map(step => {
                const isCurrent = step === role.title;
                return (
                  <div key={step} className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="flex-none"
                      style={{
                        width: isCurrent ? 9 : 7,
                        height: isCurrent ? 9 : 7,
                        background: isCurrent ? 'var(--amber)' : 'transparent',
                        border: `1px solid ${isCurrent ? 'var(--ink)' : 'var(--border-default)'}`,
                      }}
                    />
                    <span
                      className="text-[13px]"
                      style={{
                        color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Companies */}
          <div className="k-paper k-panel p-5">
            <div className="k-label mb-1">Companies hiring</div>
            <div className="k-rule-hard mb-4 mt-3" />
            <div className="flex flex-wrap gap-1.5">
              {role.companiesHiring.map(c => (
                <span key={c} className="k-badge-quiet">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Role alternatives ─────────────────────────────────────────────── */}
      <div className="k-paper k-panel mt-5 md:mt-6 p-5 md:p-6">
        <div className="k-label mb-1">Related roles · market reference</div>
        <div className="k-rule-hard mb-1 mt-3" />

        {/* A comparison reads better ruled than carded: one row per role, the
            same three facts down the same three columns. */}
        <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th scope="col" className="k-label py-2.5">Role</th>
              <th scope="col" className="k-label py-2.5">Readiness</th>
              <th scope="col" className="k-label py-2.5 hidden sm:table-cell">Salary band</th>
              <th scope="col" className="k-label py-2.5 text-right">Demand</th>
            </tr>
          </thead>
          <tbody>
            {roleAlternatives.map(({ title, match, salary, demand, active }) => (
              <tr key={title} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <th scope="row" className="py-3.5 pr-3 align-top font-normal">
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {title}
                  </div>
                  {active && <span className="k-badge mt-1.5">Your goal</span>}
                  <div className="text-[11px] mt-1.5 sm:hidden" style={{ color: 'var(--text-secondary)' }}>
                    {salary}
                  </div>
                </th>
                <td className="py-3.5 pr-3 align-top">
                  {match !== undefined ? (
                    <span className="k-figure text-lg">{match}%</span>
                  ) : (
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                      Not tracked yet
                    </span>
                  )}
                </td>
                <td className="py-3.5 pr-3 align-top hidden sm:table-cell">
                  <span className="nx-numeric text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {salary}
                  </span>
                </td>
                <td className="py-3.5 align-top text-right">
                  <span className="text-[12px]" style={{ color: 'var(--text-primary)' }}>
                    {demand}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] mt-4" style={{ color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          Only your own goal has skill requirements in this build; the other rows are
          market reference and deliberately show no readiness figure.
        </p>
      </div>
    </div>
  );
}

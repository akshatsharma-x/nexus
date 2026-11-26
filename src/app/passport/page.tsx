'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Lock } from 'lucide-react';
import { SKILL_PASSPORT, SKILLS, PROJECTS, ASSESSMENTS } from '@/lib/data/seed';
import { useProjectProgress } from '@/lib/context/ProjectContext';
import { useAssessmentResults } from '@/lib/context/AssessmentContext';
import { skillLevelLabel } from '@/lib/utils';

/** A ruled row in a printed record, not a card. */
const ROW_RULE = { borderBottom: '1px solid var(--border-default)' } as const;

export default function PassportPage() {
  const passport = SKILL_PASSPORT;
  const { projectState, loaded } = useProjectProgress();
  const { storedResults } = useAssessmentResults();

  const completedProjects = loaded
    ? PROJECTS.filter(p => projectState[p.id]?.status === 'completed')
    : PROJECTS.filter(p => p.status === 'completed' || p.status === 'submitted');

  // How many assessments taken in this app touched each skill. This is the only
  // in-app validation that exists — everything else is self-reported history.
  const assessmentsBySkill = new Map<string, number>();
  for (const stored of Object.values(storedResults)) {
    for (const skillId of new Set(stored.perSkillPercents.map(p => p.skillId))) {
      assessmentsBySkill.set(skillId, (assessmentsBySkill.get(skillId) ?? 0) + 1);
    }
  }
  const assessmentBackedCount = passport.verifiedSkills
    .filter(vs => assessmentsBySkill.has(vs.skillId)).length;

  const takenAssessments = Object.values(storedResults)
    .sort((a, b) => b.result.completedAt.getTime() - a.result.completedAt.getTime());

  // The assessment-backed figure is omitted rather than printed as zero — this
  // build has no external verification to fall back on.
  const record = [
    { label: 'Skills tracked', value: passport.verifiedSkills.length },
    ...(assessmentBackedCount > 0
      ? [{ label: 'Assessment-backed', value: assessmentBackedCount }]
      : []),
    { label: 'Completed projects', value: completedProjects.length },
    { label: 'Badges earned', value: passport.badges.length },
  ];

  return (
    <div className="max-w-4xl">

      {/* ── Header — sits directly on the dark room ──────────────────────── */}
      <div className="mb-8">
        <div className="k-slug mb-3">Skill Passport · v{passport.version}</div>
        <h1 className="k-display mb-4">Akshat Sharma</h1>
        <p className="nx-support" style={{ maxWidth: 520 }}>
          {passport.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">

        {/* ── The record itself — one stamped sheet ─────────────────────── */}
        <div className="k-paper k-panel-hero p-6">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="k-label mb-2">Credential record</div>
              <div className="k-display-sm">Skill Passport</div>
            </div>

            {/* The seal. Amber carries no text here — the type on it is ink. */}
            <div
              className="k-panel-flat flex-none w-[76px] h-[76px] flex flex-col items-center justify-center gap-0.5"
              style={{ background: 'var(--amber)', color: 'var(--ink)' }}
              aria-hidden="true"
            >
              <span className="k-figure text-[13px]" style={{ color: 'var(--ink)' }}>NEXUS</span>
              <span className="k-label" style={{ color: 'var(--ink)' }}>v{passport.version}</span>
            </div>
          </div>

          <hr className="k-rule-hard my-5" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">
            {record.map(({ label, value }) => (
              <div key={label}>
                <div className="k-figure text-2xl mb-1">{value}</div>
                <div className="k-label">{label}</div>
              </div>
            ))}
          </div>

          <hr className="k-rule-thin my-4" />

          {/* No share infrastructure exists, so this states the fact instead of
              offering a button that would have to invent a public URL. */}
          <div
            className="flex items-center gap-2 text-[11px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Lock size={12} className="flex-shrink-0" />
            Private to this browser · passport sharing is not available in this build
          </div>
        </div>

        {/* ── Skill evidence ───────────────────────────────────────────── */}
        <div className="k-paper k-panel p-5">
          <div className="k-label mb-2">Skill evidence</div>
          <p className="text-[11px] mb-4" style={{ color: 'var(--text-tertiary)', lineHeight: 1.6, maxWidth: 520 }}>
            Assessment-backed entries were scored inside NEXUS. The rest come from your own
            profile history — this build has no external verification.
          </p>
          <hr className="k-rule-hard" />

          <div className="space-y-0">
            {passport.verifiedSkills.map((vs, i) => {
              const skill = SKILLS.find(s => s.id === vs.skillId);
              if (!skill) return null;
              // The level ramp is redefined for stock by .k-paper, so the level
              // reads as ink-weight colour here instead of a lit accent.
              const color = `var(--skill-${vs.level})`;
              const assessmentCount = assessmentsBySkill.get(vs.skillId) ?? 0;

              return (
                <motion.div
                  key={vs.skillId}
                  className="flex items-center gap-4 py-3.5"
                  style={ROW_RULE}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  {/* Score */}
                  <div className="w-14 text-right flex-shrink-0">
                    <div className="k-figure text-lg" style={{ color }}>{vs.score}%</div>
                  </div>

                  {/* Bar */}
                  <div className="w-24 flex-shrink-0 hidden sm:block">
                    <div className="k-meter">
                      {/* The fill's own CSS transition would fight the frame-by-frame
                          width this animation writes, so it is disabled here. */}
                      <motion.div
                        className="k-meter-fill"
                        style={{ transition: 'none' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${vs.score}%` }}
                        transition={{ delay: i * 0.06 + 0.3, duration: 0.6 }}
                      />
                    </div>
                  </div>

                  {/* Name + level */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {skill.name}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color }}>
                        {skillLevelLabel(vs.level)}
                      </span>
                    </div>
                  </div>

                  {/* Evidence + date */}
                  <div className="flex-shrink-0 text-right">
                    {assessmentCount > 0 ? (
                      <span className="k-badge">
                        <CheckCircle size={11} /> {assessmentCount} assessment{assessmentCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="k-badge-quiet">Self-reported</span>
                    )}
                    <div className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(vs.verifiedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Completed projects ───────────────────────────────────────── */}
        {completedProjects.length > 0 && (
          <div className="k-paper k-panel p-5">
            <div className="k-label mb-4">Completed projects · {completedProjects.length}</div>
            <hr className="k-rule-hard" />

            <div className="space-y-0">
              {completedProjects.map((project, i) => {
                const skillNames = project.skillIds
                  .map(id => SKILLS.find(s => s.id === id)?.name)
                  .filter(Boolean) as string[];
                const entry = projectState[project.id];
                const completedDate = entry?.completedAt
                  ? new Date(entry.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : project.completedAt
                    ? new Date(project.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : null;

                return (
                  <motion.div
                    key={project.id}
                    className="flex items-start gap-4 py-4"
                    style={ROW_RULE}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="k-well flex-shrink-0 w-7 h-7 mt-0.5 flex items-center justify-center">
                      <CheckCircle size={13} style={{ color: 'var(--accent-green)' }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                        {project.title}
                      </div>
                      <div className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {skillNames.join('  ·  ')}
                      </div>
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <span className="capitalize">{project.type}</span>
                        <span>~{project.estimatedHours}h</span>
                        {completedDate && <span>{completedDate}</span>}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="k-label" style={{ color: 'var(--accent-green)' }}>
                        Completed
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        +{project.xpReward} XP
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Assessments taken (only when there are real results) ──────── */}
        {takenAssessments.length > 0 && (
          <div className="k-paper k-panel p-5">
            <div className="k-label mb-4">Assessments taken · {takenAssessments.length}</div>
            <hr className="k-rule-hard" />

            <div className="space-y-0">
              {takenAssessments.map(({ result }, i) => {
                const assessment = ASSESSMENTS.find(a => a.id === result.assessmentId);
                const passColor = result.passed ? 'var(--accent-green)' : 'var(--accent-amber)';

                return (
                  <motion.div
                    key={result.assessmentId}
                    className="flex items-center gap-4 py-3.5"
                    style={ROW_RULE}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="w-14 text-right flex-shrink-0">
                      <div className="k-figure text-lg" style={{ color: passColor }}>{result.score}%</div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {assessment?.title ?? result.assessmentId}
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        <span style={{ color: passColor }}>{result.passed ? 'Passed' : 'Not passed'}</span>
                        {' · '}{result.timeTakenMinutes} min
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {result.completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Badges ───────────────────────────────────────────────────── */}
        <div className="k-paper k-panel p-5">
          <div className="k-label mb-4">Achievement badges · {passport.badges.length} earned</div>
          <hr className="k-rule-hard mb-5" />

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {passport.badges.map((badge, i) => (
              <motion.div
                key={badge.id}
                // Informational, not interactive — no click target, so no
                // pointer cursor or hover lift to imply one. The title gives
                // the detail a click would otherwise have shown.
                title={`${badge.description} · earned ${new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                className="k-well flex flex-col items-center gap-2 p-3"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}
              >
                <div className="text-3xl leading-none">{badge.icon}</div>
                <div className="text-[11px] font-medium text-center" style={{ color: 'var(--text-primary)' }}>
                  {badge.name}
                </div>
                <div className="k-label">{badge.rarity}</div>
              </motion.div>
            ))}

            {/* Locked placeholders */}
            {[...Array(3)].map((_, i) => (
              <div
                key={`locked-${i}`}
                className="k-well flex flex-col items-center gap-2 p-3 opacity-45"
              >
                <div className="text-3xl leading-none filter grayscale">🔒</div>
                <div className="k-label">Locked</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { SKILLS } from '@/lib/data/seed';
import { useMastery } from '@/lib/context/MasteryContext';
import { SkillBar } from '@/components/ui/SkillBar';
import { SkillNode } from '@/components/ui/SkillNode';
import { LearningSphere } from '@/components/visualization/LearningSphere';
import { buildSphereData } from '@/lib/visualization/sphereDataAdapter';
import { skillLevelColor, skillLevelLabel } from '@/lib/utils';
import type { Skill, SkillMastery } from '@/lib/types';

// Skills recommended for Akshat Sharma's ML Engineer path
const RECOMMENDED_SKILL_IDS = ['sk_numpy', 'sk_statistics', 'sk_ml_fundamentals'];
const GOAL_SKILL_ID = 'sk_llm_engineering';

const CATEGORIES = ['All', ...Array.from(new Set(SKILLS.map(s => s.category)))];

// The legend maps to the sphere's node colours, so the swatches keep the
// dark-room hex values even where the legend itself sits on stock.
const MASTERY_LEGEND = [
  { color: '#10b981', label: 'Mastered' },
  { color: '#8b5cf6', label: 'Strong' },
  { color: '#06b6d4', label: 'Developing' },
  { color: '#f59e0b', label: 'Weak' },
  { color: '#44445a', label: 'Not started' },
];

// ─── Skill detail panel ───────────────────────────────────────────────────────

function SkillDetailPanel({ skill, mastery, onClose }: { skill: Skill; mastery?: SkillMastery; onClose: () => void }) {
  const reducedMotion = useReducedMotion() ?? false;
  const level = mastery?.level ?? 'novice';
  const score = mastery?.score ?? 0;
  const color = skillLevelColor(level);

  const prerequisites = skill.prerequisites.map(id => SKILLS.find(s => s.id === id)).filter(Boolean);
  const related = skill.related.slice(0, 4).map(id => SKILLS.find(s => s.id === id)).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="k-paper k-panel sticky top-20"
    >
      <div className="p-4" style={{ borderBottom: '2px solid var(--border-strong)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="k-display-sm mb-2">{skill.name}</div>
            <div className="flex flex-wrap items-center gap-2">
              {/* The mastery hue is a block, not type: the ramp hexes are tuned
                  for the dark room and do not carry text on cream. */}
              <span className="k-badge k-badge-quiet">
                <span
                  aria-hidden="true"
                  style={{ width: 8, height: 8, background: color, border: '1px solid var(--border-strong)' }}
                />
                {skillLevelLabel(level)}
              </span>
              <span className="k-label">{score}% mastery</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={`Close ${skill.name} details`}
            className="flex-none flex items-center justify-center cursor-pointer"
            style={{
              width: 26,
              height: 26,
              border: '2px solid var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            <X size={12} />
          </button>
        </div>
        <div className="k-meter mt-3">
          <motion.div
            className="k-meter-fill"
            initial={reducedMotion ? false : { width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{skill.description}</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Market Demand', value: `${skill.demandScore}/100` },
            { label: 'Difficulty', value: `${skill.difficulty}/5` },
            { label: 'Est. Hours', value: `${skill.estimatedHoursToLearn}h` },
            { label: 'Category', value: skill.category },
          ].map(stat => (
            <div key={stat.label} className="k-well p-2.5">
              <div className="k-label mb-1">{stat.label}</div>
              <div className="k-figure text-[13px]">{stat.value}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="k-label">Market demand</span>
            <span className="k-figure text-[11px]">{skill.demandScore}%</span>
          </div>
          <div className="k-meter" style={{ height: '0.4rem' }}>
            <div className="k-meter-fill" style={{ width: `${skill.demandScore}%` }} />
          </div>
        </div>
        {prerequisites.length > 0 && (
          <div>
            <div className="k-label mb-2">Prerequisites</div>
            <div className="flex flex-wrap gap-1.5">
              {prerequisites.map(p => p && (
                <span key={p.id} className="k-badge k-badge-quiet">{p.name}</span>
              ))}
            </div>
          </div>
        )}
        {related.length > 0 && (
          <div>
            <div className="k-label mb-2">Related Skills</div>
            <div className="flex flex-wrap gap-1.5">
              {related.map(r => r && (
                <span key={r.id} className="k-badge k-badge-quiet" style={{ color: 'var(--accent-cyan)' }}>
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {skill.tags.map(tag => (
              <span key={tag} className="k-label">#{tag}</span>
            ))}
          </div>
        )}
        <button className="k-btn k-btn-solid w-full">
          {score > 0 ? 'Continue Learning' : 'Start Learning'} →
        </button>
      </div>
    </motion.div>
  );
}

// ─── Knowledge Map section ────────────────────────────────────────────────────

function ReadinessBar({ percent }: { percent: number }) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div className="flex items-center gap-3">
      <div className="k-meter flex-1" style={{ height: '0.5rem' }}>
        <motion.div
          className="k-meter-fill"
          initial={reducedMotion ? false : { width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
      <span className="k-figure text-[13px] flex-shrink-0">{percent}%</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SkillsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const { masteries } = useMastery();

  const selectedSkill = useMemo(
    () => selectedSkillId ? (SKILLS.find(s => s.id === selectedSkillId) ?? null) : null,
    [selectedSkillId]
  );

  const masteryMap = useMemo(() => {
    const map = new Map<string, SkillMastery>();
    masteries.forEach(m => map.set(m.skillId, m));
    return map;
  }, [masteries]);

  // Sphere data
  const { sphereSkills, sphereConnections } = useMemo(
    () => buildSphereData(SKILLS, masteries, RECOMMENDED_SKILL_IDS, GOAL_SKILL_ID),
    [masteries]
  );

  // Readiness = avg score of skills with any mastery
  const readiness = useMemo(() => {
    const relevant = masteries.filter(m => m.score > 0);
    if (!relevant.length) return 0;
    return Math.round(relevant.reduce((acc, m) => acc + m.score, 0) / relevant.length);
  }, [masteries]);

  const filteredSkills = useMemo(() => {
    return SKILLS.filter(s => {
      const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some(t => t.includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  const skillsByCategory = useMemo(() => {
    const map = new Map<string, Skill[]>();
    filteredSkills.forEach(s => {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    });
    return map;
  }, [filteredSkills]);

  const scoredMasteries = masteries.filter(m => m.score > 0);
  const learnedCount = scoredMasteries.length;
  const avgScore = masteries.length > 0
    ? Math.round(masteries.reduce((acc, m) => acc + m.score, 0) / masteries.length)
    : 0;

  return (
    <div className="max-w-7xl">

      {/* ── Page header — sits directly on the dark room ───────────────────── */}
      <header className="mb-6">
        <div className="k-slug mb-3">Knowledge Map</div>
        <h1 className="k-display mb-5">ML Engineer</h1>
        <div className="flex items-center gap-4" style={{ maxWidth: 340 }}>
          <span className="k-label flex-none">Current readiness</span>
          <ReadinessBar percent={readiness} />
        </div>
      </header>

      {/* ── Knowledge Map ─────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex gap-5 items-start">
          <div className="flex-1 min-w-0 space-y-5">
            {/* The sphere is a dark-room object: it stays off the stock and is
                framed by a hard rule instead of sitting on a cream sheet. It
                draws cream lines and amber light on transparency, so .k-room
                pins the night behind it — without that it would be cream on
                cream once the app is switched to the light theme. */}
            <div className="k-room k-panel-flat overflow-hidden" style={{ height: 440 }}>
              <LearningSphere
                skills={sphereSkills}
                connections={sphereConnections}
                selectedSkillId={selectedSkillId}
                recommendedSkillIds={RECOMMENDED_SKILL_IDS}
                goalSkillId={GOAL_SKILL_ID}
                onSkillSelect={setSelectedSkillId}
                height={440}
              />
            </div>

            {/* The copy and controls that surround the sphere go on stock. */}
            <div className="k-paper k-panel p-5">
              <div className="k-label mb-3">Mastery legend</div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {MASTERY_LEGEND.map(item => (
                  <span
                    key={item.label}
                    className="flex items-center gap-2 text-[11px]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span
                      className="flex-shrink-0"
                      style={{ width: 8, height: 8, background: item.color, border: '1px solid var(--border-strong)' }}
                    />
                    {item.label}
                  </span>
                ))}
              </div>

              {!selectedSkillId && (
                <>
                  <hr className="k-rule-hard my-4" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="k-label flex-none">Recommended next</span>
                    {RECOMMENDED_SKILL_IDS.map(id => {
                      const skill = SKILLS.find(s => s.id === id);
                      return skill ? (
                        <button
                          key={id}
                          onClick={() => setSelectedSkillId(id)}
                          className="k-badge k-badge-quiet cursor-pointer"
                          style={{ color: 'var(--text-primary)', borderWidth: 2 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--amber)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          {skill.name}
                        </button>
                      ) : null;
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Selected skill detail — desktop side panel */}
          <AnimatePresence>
            {selectedSkill && (
              <div className="hidden lg:block w-72 flex-shrink-0">
                <SkillDetailPanel
                  skill={selectedSkill}
                  mastery={masteryMap.get(selectedSkill.id)}
                  onClose={() => setSelectedSkillId(null)}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected skill detail — mobile (below sphere) */}
        <AnimatePresence>
          {selectedSkill && (
            <motion.div
              className="lg:hidden mt-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <SkillDetailPanel
                skill={selectedSkill}
                mastery={masteryMap.get(selectedSkill.id)}
                onClose={() => setSelectedSkillId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Skills grid ────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-5">
          <div className="k-slug mb-2">Skill Library</div>
          <p className="nx-support">
            {masteries.length} tracking · {learnedCount} learned · {avgScore}% avg mastery
          </p>
        </div>

        <div className="flex gap-5 items-start">
          <div className="k-paper k-panel flex-1 min-w-0 p-5">
            {/* Search + filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="k-field w-full pl-9 pr-4 py-2 text-xs"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto">
                {CATEGORIES.map(cat => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className="k-badge flex-shrink-0 cursor-pointer"
                      style={{
                        borderWidth: 2,
                        background: isActive ? 'var(--amber)' : 'transparent',
                        // An amber block always carries ink: --text-primary is
                        // near-white on the dark room, 1.7:1 against amber.
                        color: isActive ? 'var(--ink)' : 'var(--text-primary)',
                      }}
                      aria-pressed={isActive}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="k-rule-hard my-5" />

            <div className="space-y-6">
              {Array.from(skillsByCategory.entries()).map(([category, skills]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ width: 5, height: 16, background: 'var(--amber)', flex: 'none' }} />
                    <h3 className="k-label" style={{ color: 'var(--text-primary)', fontSize: 12 }}>{category}</h3>
                    <span className="k-label">({skills.length})</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {skills.map(skill => (
                      <SkillNode
                        key={skill.id}
                        name={skill.name}
                        icon={skill.icon || '🧠'}
                        level={masteryMap.get(skill.id)?.level}
                        score={masteryMap.get(skill.id)?.score}
                        onClick={() => setSelectedSkillId(selectedSkillId === skill.id ? null : skill.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {skillsByCategory.size === 0 && (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  No skills match this search.
                </p>
              )}
            </div>
          </div>

          {/* Detail panel alongside skill grid (desktop) */}
          <AnimatePresence>
            {selectedSkill && (
              <div className="hidden lg:block w-72 flex-shrink-0">
                <SkillDetailPanel
                  skill={selectedSkill}
                  mastery={masteryMap.get(selectedSkill.id)}
                  onClose={() => setSelectedSkillId(null)}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Mastery bars ───────────────────────────────────────────────────── */}
      <section>
        <div className="k-slug mb-4">Mastery Breakdown</div>
        <div className="k-paper k-panel p-5">
          {scoredMasteries.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              No mastery recorded yet. Take an assessment to calibrate your scores.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {scoredMasteries.map((mastery, i) => {
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
          )}
        </div>
      </section>
    </div>
  );
}

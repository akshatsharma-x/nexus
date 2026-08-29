'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { SKILLS } from '@/lib/data/seed';
import { useMastery } from '@/lib/context/MasteryContext';
import { Badge } from '@/components/ui/Badge';
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

// ─── Skill detail panel ───────────────────────────────────────────────────────

function SkillDetailPanel({ skill, mastery, onClose }: { skill: Skill; mastery?: SkillMastery; onClose: () => void }) {
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
      className="sticky top-20 rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)', background: `${color}10` }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{skill.name}</div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                {skillLevelLabel(level)}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{score}% mastery</span>
            </div>
          </div>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
            ✕
          </button>
        </div>
        <div className="mt-3">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{skill.description}</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Market Demand', value: `${skill.demandScore}/100` },
            { label: 'Difficulty', value: `${skill.difficulty}/5` },
            { label: 'Est. Hours', value: `${skill.estimatedHoursToLearn}h` },
            { label: 'Category', value: skill.category },
          ].map(stat => (
            <div key={stat.label} className="p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Market demand</span>
            <span style={{ color: 'var(--accent-green)' }}>{skill.demandScore}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-overlay)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${skill.demandScore}%`, background: 'linear-gradient(90deg, var(--accent-green), var(--accent-cyan))' }} />
          </div>
        </div>
        {prerequisites.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Prerequisites</div>
            <div className="flex flex-wrap gap-1.5">
              {prerequisites.map(p => p && (
                <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {related.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Related Skills</div>
            <div className="flex flex-wrap gap-1.5">
              {related.map(r => r && (
                <span key={r.id} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(6,182,212,0.25)' }}>
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {skill.tags.map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
              #{tag}
            </span>
          ))}
        </div>
        <motion.button
          className="w-full py-2 rounded-lg text-xs font-medium"
          style={{ background: 'var(--accent-violet)', color: 'white' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {score > 0 ? 'Continue Learning' : 'Start Learning'} →
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Knowledge Map section ────────────────────────────────────────────────────

function ReadinessBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-[3px] rounded-full" style={{ background: 'var(--border-subtle)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--accent-violet), var(--accent-cyan))' }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: 'var(--accent-cyan)' }}>
        {percent}%
      </span>
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

  const learnedCount = masteries.filter(m => m.score > 0).length;
  const avgScore = masteries.length > 0
    ? Math.round(masteries.reduce((acc, m) => acc + m.score, 0) / masteries.length)
    : 0;

  return (
    <div className="max-w-7xl">

      {/* ── Knowledge Map ─────────────────────────────────────────────────── */}
      <div className="mb-10">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
          <div className="flex-1">
            <div
              className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Your Knowledge Map
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
              ML Engineer
            </h2>
            <div className="flex items-center gap-3 mt-2" style={{ maxWidth: 240 }}>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                Current readiness
              </span>
              <ReadinessBar percent={readiness} />
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {[
              { color: '#10b981', label: 'Mastered' },
              { color: '#8b5cf6', label: 'Strong' },
              { color: '#06b6d4', label: 'Developing' },
              { color: '#f59e0b', label: 'Weak' },
              { color: '#44445a', label: 'Not started' },
            ].map(item => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Sphere + detail panel */}
        <div className="flex gap-5 items-start">
          {/* Sphere container */}
          <div
            className="flex-1 min-w-0 rounded-2xl overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.07) 0%, rgba(6,182,212,0.03) 50%, transparent 80%)',
              height: 440,
            }}
          >
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
              className="lg:hidden mt-4"
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

        {/* Recommended next skill hint */}
        {!selectedSkillId && (
          <div className="mt-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="text-[10px] tracking-[0.12em] uppercase">Recommended next</span>
            <div className="flex gap-2">
              {RECOMMENDED_SKILL_IDS.map(id => {
                const skill = SKILLS.find(s => s.id === id);
                return skill ? (
                  <button
                    key={id}
                    onClick={() => setSelectedSkillId(id)}
                    className="text-[11px] px-2.5 py-1 rounded-full transition-colors duration-150"
                    style={{
                      background: 'rgba(6,182,212,0.08)',
                      color: 'var(--accent-cyan)',
                      border: '1px solid rgba(6,182,212,0.2)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.14)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.08)'; }}
                  >
                    {skill.name}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Skills grid ────────────────────────────────────────────────────── */}
      <div
        className="mb-5 pt-8"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--text-muted)' }}>
            Skill Library
          </div>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {masteries.length} tracking · {learnedCount} learned · {avgScore}% avg mastery
          </span>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 rounded-lg text-xs"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  background: selectedCategory === cat ? 'var(--accent-violet)' : 'var(--bg-surface)',
                  color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${selectedCategory === cat ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-5">
          <div className="flex-1 space-y-6">
            {Array.from(skillsByCategory.entries()).map(([category, skills]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full" style={{ background: 'var(--accent-violet)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{category}</h3>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>({skills.length})</span>
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
      </div>

      {/* ── Mastery bars ───────────────────────────────────────────────────── */}
      <div
        className="pt-6"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="text-[10px] font-bold tracking-[0.18em] uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
          Mastery Breakdown
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {masteries.filter(m => m.score > 0).map((mastery, i) => {
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
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, CheckCircle, Zap, Users, GitBranch } from 'lucide-react';
import { PROJECTS, SKILLS } from '@/lib/data/seed';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { difficultyLabel } from '@/lib/utils';
import type { Project } from '@/lib/types';

const STATUS_CONFIG = {
  not_started: { label: 'Start Project', bg: 'var(--accent-violet)', color: 'white' },
  in_progress: { label: 'Continue', bg: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)' },
  completed: { label: 'Completed ✓', bg: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)' },
  submitted: { label: 'Submitted', bg: 'rgba(245,158,11,0.12)', color: 'var(--accent-amber)' },
};

const TYPE_ICONS = {
  solo: GitBranch,
  collaborative: Users,
  guided: Zap,
  challenge: Star,
};

const DIFF_COLORS = ['', 'var(--accent-green)', 'var(--accent-cyan)', 'var(--accent-amber)', 'var(--accent-rose)', '#dc2626'];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const config = STATUS_CONFIG[project.status];
  const skillNames = project.skillIds.slice(0, 4).map(id => SKILLS.find(s => s.id === id)?.name).filter(Boolean);
  const TypeIcon = TYPE_ICONS[project.type];
  const isActive = project.status === 'in_progress';

  return (
    <motion.div
      className="py-5"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        borderLeft: isActive ? '2px solid var(--accent-violet-bright)' : '2px solid transparent',
        paddingLeft: isActive ? '16px' : '0',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="flex items-start gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <TypeIcon size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>
              {project.type}
            </span>
            <span className="text-[10px] font-medium" style={{ color: DIFF_COLORS[project.difficulty] }}>
              {difficultyLabel(project.difficulty)}
            </span>
            {project.mentorReview && (
              <span
                className="text-[9px] px-1.5 rounded"
                style={{ background: 'rgba(6,182,212,0.08)', color: 'var(--accent-cyan)' }}
              >
                mentor review
              </span>
            )}
            {isActive && <Badge variant="violet" size="xs">In Progress</Badge>}
            {project.status === 'completed' && <Badge variant="green" size="xs">Completed</Badge>}
          </div>

          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {project.title}
          </h3>
          <p className="text-xs mb-2.5 leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: 520 }}>
            {project.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {skillNames.map(name => (
              <span
                key={name}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--accent-violet-bright)' }}
              >
                {name}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1"><Clock size={9} /> ~{project.estimatedHours}h</span>
            <span className="flex items-center gap-1" style={{ color: 'var(--accent-amber)' }}>
              <Star size={9} /> +{project.xpReward} XP
            </span>
            {project.status === 'completed' && project.completedAt && (
              <span>
                Completed {new Date(project.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {project.tags.map(tag => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <motion.button
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: config.bg, color: config.color }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {config.label}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'not_started' | 'completed'>('all');

  const inProgress = PROJECTS.filter(p => p.status === 'in_progress');
  const completed = PROJECTS.filter(p => p.status === 'completed');
  const filtered = PROJECTS.filter(p => filter === 'all' || p.status === filter);

  const totalXp = completed.reduce((sum, p) => sum + p.xpReward, 0);

  return (
    <div className="max-w-3xl">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Projects
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Build your portfolio.
        </h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Projects apply what you learn and produce evidence for your Skill Passport.
          Each one develops real skills through real problems.
        </p>
        <div className="flex gap-6 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span>
            <span className="font-semibold" style={{ color: 'var(--accent-violet-bright)' }}>{inProgress.length}</span> in progress
          </span>
          <span>
            <span className="font-semibold" style={{ color: 'var(--accent-green)' }}>{completed.length}</span> completed
          </span>
          <span>
            <span className="font-semibold" style={{ color: 'var(--accent-amber)' }}>{totalXp}</span> XP earned
          </span>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="mb-2">
        <Tabs
          tabs={[
            { id: 'all', label: 'All', badge: PROJECTS.length },
            { id: 'in_progress', label: 'In Progress', badge: inProgress.length },
            { id: 'not_started', label: 'Available' },
            { id: 'completed', label: 'Completed', badge: completed.length },
          ]}
          active={filter}
          onChange={id => setFilter(id as typeof filter)}
        />
      </div>

      {/* ── Project list ─────────────────────────────────────────────────── */}
      <div>
        {filtered.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>
    </div>
  );
}

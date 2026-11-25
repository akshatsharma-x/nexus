'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Star, CheckCircle, Zap, Users, GitBranch } from 'lucide-react';
import { PROJECTS, SKILLS, ACTIVE_PATH } from '@/lib/data/seed';
import { Tabs } from '@/components/ui/Tabs';
import { ModalShell } from '@/components/ui/ModalShell';
import { difficultyLabel, skillLevelColor } from '@/lib/utils';
import { useProjectProgress } from '@/lib/context/ProjectContext';
import { useJourneyProgress } from '@/lib/context/JourneyProgressContext';
import { useMastery } from '@/lib/context/MasteryContext';
import type { Project } from '@/lib/types';

const DIFF_COLORS = ['', 'var(--accent-green)', 'var(--accent-cyan)', 'var(--accent-amber)', 'var(--accent-rose)', '#dc2626'];
const DIFF_LABELS = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];

const TYPE_ICONS = {
  solo: GitBranch,
  collaborative: Users,
  guided: Zap,
  challenge: Star,
};

function deriveProjectWhy(project: Project): string {
  const skillNames = project.skillIds.slice(0, 2)
    .map(id => SKILLS.find(s => s.id === id)?.name ?? id.replace('sk_', '').replace(/_/g, ' '));
  const skillList = skillNames.join(' and ');
  switch (project.type) {
    case 'guided':
      return `This guided project develops your ${skillList} skills through a structured, real-world problem — the kind you'd encounter in a professional ML role.`;
    case 'challenge':
      return `This challenge applies your ${skillList} skills to a real dataset, producing concrete evidence of what you can do.`;
    case 'solo':
      return `Building this independently strengthens your ${skillList} skills while creating a concrete artifact that demonstrates your capabilities.`;
    default:
      return `This project develops your ${skillList} skills through hands-on practice.`;
  }
}

// ─── Project detail modal content ────────────────────────────────────────────

function ProjectDetailModalContent({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const { getStatus, getEntry, startProject, completeProject } = useProjectProgress();
  const { nodeStatuses, completeNode } = useJourneyProgress();
  const { masteries } = useMastery();

  const projectStatus = getStatus(project.id);
  const entry = getEntry(project.id);

  const [showCompletion, setShowCompletion] = useState(false);
  const [unlockedTitle, setUnlockedTitle] = useState<string | null>(null);

  // Find associated journey node
  const journeyNode = ACTIVE_PATH.nodes.find(n => n.type === 'project' && n.projectId === project.id) ?? null;
  const nodeStatus = journeyNode ? (nodeStatuses[journeyNode.id] ?? journeyNode.status) : null;

  const skillData = project.skillIds.map(id => {
    const skill = SKILLS.find(s => s.id === id);
    const mastery = masteries.find(m => m.skillId === id);
    return skill ? { skill, mastery } : null;
  }).filter(Boolean) as { skill: typeof SKILLS[0]; mastery: typeof masteries[0] | undefined }[];

  const whyText = journeyNode?.whyRecommended ?? deriveProjectWhy(project);

  const handleStart = useCallback(() => {
    startProject(project.id);
  }, [project.id, startProject]);

  const handleComplete = useCallback(() => {
    let unlocked: string | null = null;

    if (journeyNode && (nodeStatus === 'available' || nodeStatus === 'in_progress')) {
      // Find what will be unlocked after this node completes
      const nextUnlocked = ACTIVE_PATH.nodes.find(n => {
        const nStatus = nodeStatuses[n.id] ?? n.status;
        if (nStatus !== 'locked') return false;
        return n.unlockConditions.every(id =>
          id === journeyNode.id || (nodeStatuses[id] ?? ACTIVE_PATH.nodes.find(nn => nn.id === id)?.status) === 'completed'
        );
      });
      unlocked = nextUnlocked?.title ?? null;
      completeNode(journeyNode.id);
    }

    completeProject(project.id);
    setUnlockedTitle(unlocked);
    setShowCompletion(true);
  }, [project.id, journeyNode, nodeStatus, nodeStatuses, completeNode, completeProject]);

  // ── Completion screen ──────────────────────────────────────────────────────
  if (showCompletion) {
    return (
      <div style={{ paddingBottom: 8 }}>
        <div className="mb-5">
          <span className="k-tile" aria-hidden="true">
            <CheckCircle size={16} />
          </span>
        </div>

        <div className="k-slug mb-3">Project complete</div>
        <h2 className="k-display-sm mb-3">{project.title}</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          This project is now part of your learning history.
        </p>

        {unlockedTitle && (
          <div
            className="mt-5 pl-3.5 text-sm"
            style={{ borderLeft: '2px solid var(--amber)', color: 'var(--text-secondary)', lineHeight: 1.7 }}
          >
            Next stage available:{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{unlockedTitle}</span>
          </div>
        )}

        <div className="flex gap-2.5 mt-8">
          {unlockedTitle && (
            <a href="/journey" className="k-btn k-btn-amber flex-1">
              Continue journey
            </a>
          )}
          <button className="k-btn k-btn-solid flex-1" onClick={onClose}>
            Back to projects
          </button>
        </div>
      </div>
    );
  }

  // ── Main content ───────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 8 }}>

      {/* In-progress indicator */}
      {projectStatus === 'in_progress' && (
        <div className="flex items-center gap-2 mb-4">
          <span
            aria-hidden="true"
            className="flex-none"
            style={{ width: 8, height: 8, background: 'var(--amber)' }}
          />
          <span className="k-label" style={{ color: 'var(--text-primary)' }}>
            In progress · Continue building
          </span>
        </div>
      )}

      {/* Type label */}
      <div className="k-slug mb-2.5">Project · {project.type}</div>

      {/* Title */}
      <h2 className="k-display-sm mb-4">{project.title}</h2>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <span className="flex items-center gap-1">
          <Clock size={11} /> ~{project.estimatedHours}h
        </span>
        <span>·</span>
        <span style={{ color: DIFF_COLORS[project.difficulty] }}>
          {DIFF_LABELS[project.difficulty] ?? 'Intermediate'}
        </span>
        {project.mentorReview && (
          <>
            <span>·</span>
            <span style={{ color: 'var(--accent-cyan)' }}>Mentor review</span>
          </>
        )}
        <span>·</span>
        <span className="nx-numeric" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          +{project.xpReward} XP
        </span>
        {projectStatus === 'completed' && entry?.completedAt && (
          <>
            <span>·</span>
            <span>
              Completed {new Date(entry.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </>
        )}
      </div>

      {/* Description */}
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        {project.description}
      </p>

      {/* Skills developed */}
      {skillData.length > 0 && (
        <>
          <div className="k-rule-thin mb-4" />
          <div className="mb-5">
            <div className="k-label mb-3">Skills developed</div>
            <div className="space-y-2.5">
              {skillData.map(({ skill, mastery }) => {
                const score = mastery?.score ?? 0;
                const color = mastery ? skillLevelColor(mastery.level) : 'var(--text-muted)';
                return (
                  <div key={skill.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{skill.name}</span>
                    {score > 0 && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="k-meter" style={{ width: 72, height: 8 }}>
                          <div className="k-meter-fill" style={{ width: `${score}%` }} />
                        </div>
                        <span
                          className="nx-numeric text-[11px]"
                          style={{ color, minWidth: 30, textAlign: 'right' }}
                        >
                          {score}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Why this project */}
      <div className="k-rule-thin mb-4" />
      <div className="mb-6 pl-3.5" style={{ borderLeft: '2px solid var(--amber)' }}>
        <div className="k-label mb-2" style={{ color: 'var(--text-primary)' }}>
          Why this project
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          {whyText}
        </p>
      </div>

      {/* Journey context */}
      {journeyNode && (
        <>
          <div className="k-rule-thin mb-4" />
          <div className="mb-6 flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            <span>Journey stage:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{journeyNode.title}</span>
            {nodeStatus === 'completed' && (
              <CheckCircle size={11} style={{ color: 'var(--accent-green)' }} />
            )}
          </div>
        </>
      )}

      {/* CTA */}
      <div className="k-rule-hard mb-5" />
      {projectStatus === 'completed' ? (
        <div className="k-btn k-btn-outline w-full" aria-label="Project completed">
          <CheckCircle size={14} /> Project completed
        </div>
      ) : projectStatus === 'in_progress' ? (
        <button className="k-btn k-btn-amber w-full" onClick={handleComplete}>
          Mark project complete
        </button>
      ) : (
        <button className="k-btn k-btn-solid w-full" onClick={handleStart}>
          Start project
        </button>
      )}
    </div>
  );
}

// ─── Project row ──────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: (project: Project) => void;
}) {
  const { getStatus } = useProjectProgress();
  const status = getStatus(project.id);

  const TypeIcon = TYPE_ICONS[project.type];
  const skillNames = project.skillIds.slice(0, 4)
    .map(id => SKILLS.find(s => s.id === id)?.name)
    .filter(Boolean) as string[];

  const isActive = status === 'in_progress';
  const isCompleted = status === 'completed';

  const ctaConfig = {
    not_started: { label: 'Start project', variant: 'k-btn-solid' },
    in_progress: { label: 'Continue', variant: 'k-btn-amber' },
    completed: { label: 'Completed', variant: 'k-btn-outline' },
  }[status];

  return (
    <motion.div
      className="py-5"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        // The active project is marked with an amber block at the margin rather
        // than with a tinted row, so the ledger stays one colour.
        borderLeft: isActive ? '3px solid var(--amber)' : '3px solid transparent',
        paddingLeft: isActive ? '14px' : '0',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="flex items-start gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1.5 mb-2">
            <TypeIcon size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <span className="k-label">{project.type}</span>
            <span className="k-label" style={{ color: DIFF_COLORS[project.difficulty] }}>
              {difficultyLabel(project.difficulty)}
            </span>
            {project.mentorReview && (
              <span className="k-badge-quiet">Mentor review</span>
            )}
            {isActive && <span className="k-badge">In progress</span>}
            {isCompleted && <span className="k-badge-quiet">Completed</span>}
          </div>

          <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
            {project.title}
          </h3>
          <p className="text-[13px] mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 520 }}>
            {project.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {skillNames.map(name => (
              <span key={name} className="k-badge-quiet">{name}</span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1"><Clock size={11} /> ~{project.estimatedHours}h</span>
            <span className="nx-numeric" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              +{project.xpReward} XP
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <button
            className={`k-btn ${ctaConfig.variant}`}
            style={{ fontSize: 11, padding: '0.5rem 0.75rem' }}
            onClick={() => onOpen(project)}
          >
            {ctaConfig.label}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'not_started' | 'completed'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { getStatus, loaded } = useProjectProgress();

  const openProject = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const inProgressCount = PROJECTS.filter(p => getStatus(p.id) === 'in_progress').length;
  const completedCount = PROJECTS.filter(p => getStatus(p.id) === 'completed').length;
  const totalXp = PROJECTS
    .filter(p => getStatus(p.id) === 'completed')
    .reduce((sum, p) => sum + p.xpReward, 0);

  const filtered = PROJECTS.filter(p => {
    if (filter === 'all') return true;
    return getStatus(p.id) === filter;
  });

  return (
    <div className="max-w-3xl">

      {/* ── Header, directly on the dark room ────────────────────────────── */}
      <div className="mb-7">
        <div className="k-slug mb-3">Projects</div>
        <h1 className="k-display mb-4">
          Build your <span className="k-highlight">portfolio</span>.
        </h1>
        <p className="nx-support mb-6" style={{ maxWidth: 560 }}>
          Projects apply what you learn and produce evidence for your Skill Passport.
          Each one develops real skills through real problems.
        </p>

        {/* Counts as figures, compared across one row — the same numbers the
            filters used to carry in 9px chips. */}
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <div className="k-figure text-2xl">{PROJECTS.length}</div>
            <div className="k-label mt-1">Total</div>
          </div>
          <div>
            <div className="k-figure text-2xl">{inProgressCount}</div>
            <div className="k-label mt-1">In progress</div>
          </div>
          <div>
            <div className="k-figure text-2xl">{completedCount}</div>
            <div className="k-label mt-1">Completed</div>
          </div>
          {totalXp > 0 && (
            <div>
              <div className="k-figure text-2xl">{totalXp}</div>
              <div className="k-label mt-1">XP earned</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Filters + list, one sheet of stock ───────────────────────────── */}
      <div className="k-paper k-panel">
        <div className="px-5 pt-5">
          <Tabs
            variant="underline"
            size="md"
            tabs={[
              { id: 'all', label: 'All' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'not_started', label: 'Available' },
              { id: 'completed', label: 'Completed' },
            ]}
            active={filter}
            onChange={id => setFilter(id as typeof filter)}
          />
        </div>

        <div className="px-5 pb-1">
          {loaded && filtered.length === 0 && (
            <p className="py-10 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
              {filter === 'completed' ? 'No completed projects yet.' : 'No projects in this category.'}
            </p>
          )}
          {filtered.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              onOpen={openProject}
            />
          ))}
        </div>
      </div>

      {/* ── Project detail modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProject && (
          <ModalShell label={selectedProject.title} onClose={closeModal}>
            <ProjectDetailModalContent
              project={selectedProject}
              onClose={closeModal}
            />
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

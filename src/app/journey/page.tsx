'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  BarChart3, BookOpen, CheckCircle, Clock, Lock, Star, Target, Wrench, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ACTIVE_PATH, RESOURCES, PROJECTS, ASSESSMENTS, SKILLS } from '@/lib/data/seed';
import { formatDuration } from '@/lib/utils';
import { useJourneyProgress } from '@/lib/context/JourneyProgressContext';
import { useProjectProgress } from '@/lib/context/ProjectContext';
import { ModalShell } from '@/components/ui/ModalShell';
import type { PathNode, LearningResource, Project, Assessment } from '@/lib/types';

// ─── Phase definitions ────────────────────────────────────────────────────────
const PHASES = [
  {
    id: 'foundations',
    number: '01',
    label: 'Foundations',
    description: 'Python fluency and the mathematical backbone of ML.',
    nodeIds: ['node_python_core', 'node_linear_algebra', 'node_statistics', 'node_numpy_pandas'],
  },
  {
    id: 'core_ml',
    number: '02',
    label: 'Core ML',
    description: 'Build, evaluate, and validate machine learning models.',
    nodeIds: ['node_eda_project', 'node_ml_fundamentals', 'node_ml_assessment'],
  },
  {
    id: 'production',
    number: '03',
    label: 'Production ML',
    description: 'Deep learning, deployment, and production AI systems.',
    nodeIds: ['node_deep_learning', 'node_sentiment_project', 'node_llm_engineering'],
  },
];

const SKILL_MAP: Record<string, string> = Object.fromEntries(
  SKILLS.map(s => [s.id, s.name])
);

const NODE_ICON: Record<string, LucideIcon> = {
  resource: BookOpen,
  project: Wrench,
  assessment: BarChart3,
  milestone: Star,
  skill: Target,
};

const DIFF_LABELS = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];

// ─── Modal state ──────────────────────────────────────────────────────────────
type ModalState =
  | { kind: 'resource'; node: PathNode; resource: LearningResource }
  | { kind: 'project'; node: PathNode; project: Project }
  | { kind: 'assessment'; node: PathNode; assessment: Assessment }
  | { kind: 'skill'; node: PathNode }
  | null;

// ModalShell is imported from @/components/ui/ModalShell

// ─── Shared modal fragments ───────────────────────────────────────────────────
// The sheet these render into is owned by ModalShell, so every value here is a
// surface-adaptive var rather than a literal — the same markup has to read on
// the dark room and on stock.
function StageContext({ node, nodePhase }: { node: PathNode; nodePhase: typeof PHASES[number] | undefined }) {
  if (!nodePhase) return null;
  return (
    <div className="k-label mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>Stage {nodePhase.number}</span>
      <span aria-hidden="true">/</span>
      <span>{nodePhase.label}</span>
      <span aria-hidden="true">/</span>
      <span style={{ color: 'var(--text-secondary)' }}>{node.title}</span>
    </div>
  );
}

function WhyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-6 pl-4" style={{ borderLeft: '2px solid var(--k-edge-strong)' }}>
      <div className="k-label mb-2" style={{ color: 'var(--text-primary)' }}>{title}</div>
      <p className="text-[13px]" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        {body}
      </p>
    </div>
  );
}

function MetaRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-3 mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] nx-numeric"
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </div>
  );
}

function SkillMarks({ names }: { names: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map(name => (
        <span key={name} className="k-badge-quiet">{name}</span>
      ))}
    </div>
  );
}

// ─── Derive learning objectives from resource type + skills ──────────────────
function deriveObjectives(type: LearningResource['type'], skillNames: string[]): string[] {
  if (skillNames.length === 0) return [];
  const list =
    skillNames.length === 1
      ? skillNames[0]
      : skillNames.slice(0, -1).join(', ') + ' and ' + skillNames[skillNames.length - 1];
  switch (type) {
    case 'video':
      return [
        `Build intuitive understanding of ${list}`,
        'Recognize how these concepts apply to machine learning problems',
      ];
    case 'interactive':
      return [
        `Apply ${list} through hands-on exercises`,
        'Gain practical experience working with real datasets',
      ];
    case 'course':
      return [
        `Develop working knowledge of ${list}`,
        'Apply these skills to build and evaluate ML models',
      ];
    case 'book':
      return [
        `Build comprehensive understanding of ${list}`,
        'Apply the concepts through worked examples',
      ];
    default:
      return [
        `Understand ${list} and their role in ML`,
        'Apply these concepts to practical problems',
      ];
  }
}

// ─── Completion confirmation ──────────────────────────────────────────────────
function CompletionPanel({
  slug,
  title,
  body,
  unlockedTitle,
  onClose,
}: {
  slug: string;
  title: string;
  body: string;
  unlockedTitle: string | null;
  onClose: () => void;
}) {
  return (
    <div className="pb-2">
      <span className="k-tile" aria-hidden="true"><CheckCircle size={18} /></span>
      <div className="k-slug mt-4">{slug}</div>
      <h2 className="k-display-sm mt-2">{title}</h2>
      <p className="text-[13px] mt-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        {body}
      </p>
      {unlockedTitle && (
        <>
          <hr className="k-rule-hard my-4" />
          <div className="k-label mb-1">Now available</div>
          <div className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {unlockedTitle}
          </div>
        </>
      )}
      <button type="button" className="k-btn k-btn-solid w-full mt-7" onClick={onClose}>
        Back to Journey
      </button>
    </div>
  );
}

// ─── Resource modal content ───────────────────────────────────────────────────
function ResourceModalContent({
  node,
  resource,
  onClose,
}: {
  node: PathNode;
  resource: LearningResource;
  onClose: () => void;
}) {
  const { nodeStatuses, startedResources, startResource, completeNode } = useJourneyProgress();
  const isCompleted = nodeStatuses[node.id] === 'completed';
  const isStarted = startedResources[resource.id] ?? false;
  const [showCompletion, setShowCompletion] = useState(false);
  const [unlockedTitle, setUnlockedTitle] = useState<string | null>(null);

  const skillNames = resource.skillIds.map(
    id => SKILL_MAP[id] ?? id.replace('sk_', '').replace(/_/g, ' ')
  );
  const nodePhase = PHASES.find(ph => ph.nodeIds.includes(node.id));
  const objectives = deriveObjectives(resource.type, skillNames);

  const handleStart = () => startResource(resource.id);

  const handleComplete = () => {
    const nextNode = ACTIVE_PATH.nodes.find(n => {
      if (nodeStatuses[n.id] !== 'locked') return false;
      return n.unlockConditions.every(id => id === node.id || nodeStatuses[id] === 'completed');
    });
    completeNode(node.id);
    setUnlockedTitle(nextNode?.title ?? null);
    setShowCompletion(true);
  };

  // Completion confirmation screen
  if (showCompletion) {
    return (
      <CompletionPanel
        slug="Completed"
        title={resource.title}
        body={`${resource.title} is now complete.`}
        unlockedTitle={unlockedTitle}
        onClose={onClose}
      />
    );
  }

  const inProgress = isStarted && !isCompleted;

  return (
    <>
      {/* Stage context */}
      <StageContext node={node} nodePhase={nodePhase} />

      {/* In-progress badge */}
      {inProgress && (
        <div className="mb-3">
          <span className="k-badge">In progress · Continue learning</span>
        </div>
      )}

      {/* Resource type */}
      <div className="k-slug">{resource.type}</div>

      {/* Title */}
      <h2 className="k-display-sm mt-2">{resource.title}</h2>

      {/* Metadata */}
      <MetaRow>
        <span>{resource.provider}</span>
        <span className="flex items-center gap-1.5">
          <Clock size={11} aria-hidden="true" />{formatDuration(resource.estimatedHours)}
        </span>
        {resource.isFree ? (
          <span>Free</span>
        ) : resource.price != null ? (
          <span>${resource.price}</span>
        ) : null}
        <span className="k-figure text-[11px]">+{node.xpReward} XP</span>
      </MetaRow>

      {/* Description */}
      {resource.description && (
        <p className="text-[13px] mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          {resource.description}
        </p>
      )}

      {/* Skills */}
      {skillNames.length > 0 && (
        <>
          <hr className="k-rule-hard mb-4" />
          <div className="mb-5">
            <div className="k-label mb-2">Skills</div>
            <SkillMarks names={skillNames} />
          </div>
        </>
      )}

      {/* Why this is in your path */}
      <hr className="k-rule-hard mb-4" />
      <WhyBlock title="Why this is in your path" body={node.whyRecommended} />

      {/* By the end */}
      {objectives.length > 0 && (
        <>
          <hr className="k-rule-hard mb-4" />
          <div className="mb-7">
            <div className="k-label mb-3">By the end</div>
            <ul className="space-y-2">
              {objectives.map((obj, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}
                >
                  <span
                    aria-hidden="true"
                    className="flex-none"
                    style={{ width: 6, height: 6, marginTop: 9, background: 'var(--amber)' }}
                  />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* CTA */}
      {isCompleted ? (
        <div className="k-btn k-btn-outline w-full">
          <CheckCircle size={14} aria-hidden="true" /> Completed
        </div>
      ) : inProgress ? (
        <button type="button" className="k-btn k-btn-solid w-full" onClick={handleComplete}>
          Mark Complete · +{node.xpReward} XP
        </button>
      ) : (
        <button type="button" className="k-btn k-btn-amber w-full" onClick={handleStart}>
          Start Learning →
        </button>
      )}
    </>
  );
}

// ─── Project modal content ────────────────────────────────────────────────────
function ProjectModalContent({
  node,
  project,
  onClose,
}: {
  node: PathNode;
  project: Project;
  onClose: () => void;
}) {
  const { getStatus, startProject, completeProject } = useProjectProgress();
  const { nodeStatuses, completeNode } = useJourneyProgress();

  const projectStatus = getStatus(project.id);
  const liveNodeStatus = nodeStatuses[node.id] ?? node.status;
  const isNodeCompleted = liveNodeStatus === 'completed';
  const [showCompletion, setShowCompletion] = useState(false);
  const [unlockedTitle, setUnlockedTitle] = useState<string | null>(null);

  const skillNames = project.skillIds.map(
    id => SKILL_MAP[id] ?? id.replace('sk_', '').replace(/_/g, ' ')
  );
  const nodePhase = PHASES.find(ph => ph.nodeIds.includes(node.id));

  const handleStart = () => startProject(project.id);

  const handleComplete = () => {
    const nextNode = ACTIVE_PATH.nodes.find(n => {
      const nStatus = nodeStatuses[n.id] ?? n.status;
      if (nStatus !== 'locked') return false;
      return n.unlockConditions.every(id =>
        id === node.id || (nodeStatuses[id] ?? ACTIVE_PATH.nodes.find(nn => nn.id === id)?.status) === 'completed'
      );
    });
    completeProject(project.id);
    completeNode(node.id);
    setUnlockedTitle(nextNode?.title ?? null);
    setShowCompletion(true);
  };

  // Completion screen
  if (showCompletion) {
    return (
      <CompletionPanel
        slug="Project complete"
        title={project.title}
        body="This project is now part of your learning history."
        unlockedTitle={unlockedTitle}
        onClose={onClose}
      />
    );
  }

  return (
    <>
      {/* Stage context */}
      <StageContext node={node} nodePhase={nodePhase} />

      {/* In-progress badge */}
      {projectStatus === 'in_progress' && !isNodeCompleted && (
        <div className="mb-3">
          <span className="k-badge">In progress · Continue building</span>
        </div>
      )}

      <div className="k-slug">Project · {project.type}</div>
      <h2 className="k-display-sm mt-2">{project.title}</h2>
      <MetaRow>
        <span className="flex items-center gap-1.5">
          <Clock size={11} aria-hidden="true" />~{project.estimatedHours}h
        </span>
        <span>{DIFF_LABELS[project.difficulty] ?? 'Intermediate'}</span>
        {project.mentorReview && <span>Mentor review</span>}
        <span className="k-figure text-[11px]">+{node.xpReward} XP</span>
      </MetaRow>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        {project.description}
      </p>
      {skillNames.length > 0 && (
        <>
          <hr className="k-rule-hard mb-4" />
          <div className="mb-5">
            <div className="k-label mb-2">Skills developed</div>
            <SkillMarks names={skillNames} />
          </div>
        </>
      )}
      <hr className="k-rule-hard mb-4" />
      <WhyBlock title="Why this project" body={node.whyRecommended} />

      {/* CTA */}
      {isNodeCompleted ? (
        <div className="k-btn k-btn-outline w-full">
          <CheckCircle size={14} aria-hidden="true" /> Project Completed
        </div>
      ) : projectStatus === 'in_progress' ? (
        <button type="button" className="k-btn k-btn-solid w-full" onClick={handleComplete}>
          Mark Project Complete · +{node.xpReward} XP
        </button>
      ) : (
        <button type="button" className="k-btn k-btn-amber w-full" onClick={handleStart}>
          Start Project →
        </button>
      )}
    </>
  );
}

// ─── Assessment modal content ─────────────────────────────────────────────────
function AssessmentModalContent({
  node,
  assessment,
  onNavigate,
}: {
  node: PathNode;
  assessment: Assessment;
  onNavigate: () => void;
}) {
  const skillNames = assessment.skillIds.map(
    id => SKILL_MAP[id] ?? id.replace('sk_', '').replace(/_/g, ' ')
  );

  return (
    <>
      <div className="k-slug">Assessment · {assessment.type}</div>
      <h2 className="k-display-sm mt-2">{assessment.title}</h2>
      <MetaRow>
        {assessment.totalQuestions != null && <span>{assessment.totalQuestions} questions</span>}
        <span className="flex items-center gap-1.5">
          <Clock size={11} aria-hidden="true" />{assessment.estimatedMinutes}min
        </span>
        <span>Pass: {assessment.passingScore}%</span>
        <span className="k-figure text-[11px]">+{assessment.xpReward} XP</span>
      </MetaRow>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        {assessment.description}
      </p>
      {skillNames.length > 0 && (
        <>
          <hr className="k-rule-hard mb-4" />
          <div className="mb-5">
            <div className="k-label mb-2">Skills assessed</div>
            <SkillMarks names={skillNames} />
          </div>
        </>
      )}
      <hr className="k-rule-hard mb-4" />
      <WhyBlock title="Why this is next" body={node.whyRecommended} />
      <button type="button" className="k-btn k-btn-amber w-full" onClick={onNavigate}>
        Go to Assessments →
      </button>
    </>
  );
}

// ─── Skill modal content (skill-type nodes, no resource) ─────────────────────
function SkillModalContent({
  node,
  onComplete,
}: {
  node: PathNode;
  onComplete: () => void;
}) {
  const isCompleted = node.status === 'completed';
  const skillNames = node.skillsGained.map(
    id => SKILL_MAP[id] ?? id.replace('sk_', '').replace(/_/g, ' ')
  );

  return (
    <>
      <div className="k-slug">Skill</div>
      <h2 className="k-display-sm mt-2">{node.title}</h2>
      <MetaRow>
        <span className="flex items-center gap-1.5">
          <Clock size={11} aria-hidden="true" />{formatDuration(node.estimatedHours)}
        </span>
        <span className="k-figure text-[11px]">+{node.xpReward} XP</span>
      </MetaRow>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        {node.description}
      </p>
      {skillNames.length > 0 && (
        <>
          <hr className="k-rule-hard mb-4" />
          <div className="mb-5">
            <div className="k-label mb-2">Skills gained</div>
            <SkillMarks names={skillNames} />
          </div>
        </>
      )}
      <hr className="k-rule-hard mb-4" />
      <WhyBlock title="Why this is next" body={node.whyRecommended} />
      {isCompleted ? (
        <div className="k-btn k-btn-outline w-full">
          <CheckCircle size={14} aria-hidden="true" /> Completed
        </div>
      ) : (
        <button type="button" className="k-btn k-btn-amber w-full" onClick={onComplete}>
          Mark as Complete · +{node.xpReward} XP
        </button>
      )}
    </>
  );
}

// ─── Progress ring ────────────────────────────────────────────────────────────
// A ring is one of the few genuine circles left in the language, so it keeps its
// round form — but the arc is flat ink with butt caps rather than a gradient.
function DonutRing({ progress }: { progress: number }) {
  const prefersReducedMotion = useReducedMotion();
  const r = 38;
  const cx = 44;
  const cy = 44;
  const circumference = 2 * Math.PI * r;
  const targetOffset = circumference * (1 - progress / 100);

  return (
    <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
      <svg
        width="100"
        height="100"
        viewBox="0 0 88 88"
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--text-primary)"
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={prefersReducedMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 80, damping: 20, delay: 0.4 }
          }
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span className="k-figure" style={{ fontSize: 22, lineHeight: 1 }}>
          {progress}%
        </span>
        <span className="k-label mt-1">complete</span>
      </div>
    </div>
  );
}

// ─── Status marker (30×30) ────────────────────────────────────────────────────
function StatusIcon({ status }: { status: PathNode['status'] }) {
  const base = {
    width: 30, height: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    border: '2px solid var(--k-edge)',
  } as const;

  if (status === 'completed') {
    return (
      <div style={{ ...base, background: 'var(--text-primary)', color: 'var(--bg-base)' }}>
        <CheckCircle size={14} aria-hidden="true" />
      </div>
    );
  }
  if (status === 'in_progress') {
    return (
      <div style={{ ...base, background: 'var(--amber)' }}>
        <div style={{ width: 8, height: 8, background: 'var(--ink)' }} />
      </div>
    );
  }
  if (status === 'locked') {
    return (
      <div style={{ ...base, borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <Lock size={13} aria-hidden="true" />
      </div>
    );
  }
  return (
    <div style={base}>
      <div style={{ width: 8, height: 8, background: 'var(--text-muted)' }} />
    </div>
  );
}

// ─── PathNodeCard ─────────────────────────────────────────────────────────────
interface PathNodeCardProps {
  node: PathNode;
  index: number;
  isLast: boolean;
  onStartLearning: (node: PathNode, resource: LearningResource) => void;
  onViewProject: (node: PathNode, project: Project) => void;
  onTakeAssessment: (node: PathNode, assessment: Assessment) => void;
}

function PathNodeCard({ node, index, isLast, onStartLearning, onViewProject, onTakeAssessment }: PathNodeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isLocked = node.status === 'locked';
  const isActive = node.status === 'in_progress';
  const isCompleted = node.status === 'completed';

  const resource = node.resourceId ? RESOURCES.find(r => r.id === node.resourceId) ?? null : null;
  const project = node.projectId ? PROJECTS.find(p => p.id === node.projectId) ?? null : null;
  const assessment = node.assessmentId ? ASSESSMENTS.find(a => a.id === node.assessmentId) ?? null : null;

  const { nodeStatuses } = useJourneyProgress();
  // Name what is still missing, not just the first condition: a step that
  // needs two prerequisites kept reading "Requires: Statistics & Probability"
  // after Statistics was finished. Comma-separated, because step titles
  // already use "+" ("NumPy + Pandas").
  const prerequisiteTitle = isLocked
    ? node.unlockConditions
        .filter(id => (nodeStatuses[id] ?? ACTIVE_PATH.nodes.find(n => n.id === id)?.status) !== 'completed')
        .map(id => ACTIVE_PATH.nodes.find(n => n.id === id)?.title)
        .filter(Boolean)
        .join(', ') || null
    : null;

  const spineColor = isCompleted || isActive ? 'var(--k-edge)' : 'var(--border-default)';

  const panelId = `node-panel-${node.id}`;

  // Missing data fallback labels
  const hasContent = resource || project || assessment;

  return (
    <motion.div
      className="flex gap-4"
      initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: prefersReducedMotion ? 0 : index * 0.06,
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: 'easeOut',
      }}
    >
      {/* Spine column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 30, flexShrink: 0, paddingTop: 6 }}>
        <StatusIcon status={node.status} />
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: 18, marginTop: 6, background: spineColor }} />
        )}
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0 pb-5">
        <button
          className="w-full text-left"
          onClick={() => !isLocked && setExpanded(v => !v)}
          disabled={isLocked}
          aria-expanded={isLocked ? undefined : expanded}
          aria-controls={isLocked ? undefined : panelId}
        >
          <motion.div
            className="px-3 py-3"
            style={{ background: isActive ? 'var(--bg-elevated)' : 'transparent' }}
            whileHover={!isLocked && !prefersReducedMotion ? { x: 2 } : undefined}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2.5">
                  <span className="k-label nx-numeric" aria-hidden="true">
                    {String(node.order).padStart(2, '0')}
                  </span>
                  <span
                    className="text-[13px] font-semibold leading-snug"
                    style={{
                      color: isLocked ? 'var(--text-muted)' : isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                      textDecoration: isCompleted ? 'line-through' : undefined,
                    }}
                  >
                    {node.title}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 pl-[26px] text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  <span className="flex items-center gap-1.5">
                    <Clock size={11} aria-hidden="true" />{formatDuration(node.estimatedHours)}
                  </span>
                  {!isLocked && <span className="k-label">{node.type}</span>}
                  {isLocked && prerequisiteTitle && <span>Requires: {prerequisiteTitle}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                {isActive && <span className="k-badge">In progress</span>}
                {/* Completion is otherwise only a strikethrough and an
                    aria-hidden check, neither of which a screen reader reads. */}
                {isCompleted && <span className="sr-only">Completed</span>}
                {!isLocked && (
                  <motion.span
                    className="text-base font-light leading-none"
                    style={{ color: 'var(--text-tertiary)', display: 'inline-block' }}
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                    aria-hidden="true"
                  >
                    ›
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>
        </button>

        {/* Expanded panel */}
        <AnimatePresence>
          {expanded && !isLocked && (
            <motion.div
              id={panelId}
              role="region"
              aria-label={node.title}
              initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="k-well mt-2 p-4 space-y-4">
                {/* Why this node is here */}
                <div className="pl-3" style={{ borderLeft: '2px solid var(--k-edge-strong)' }}>
                  <div className="k-label mb-2" style={{ color: 'var(--text-primary)' }}>
                    Why this is here
                  </div>
                  <p className="text-[13px]" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                    {node.whyRecommended}
                  </p>
                </div>

                {/* Skills gained */}
                {node.skillsGained.length > 0 && (
                  <>
                    <hr className="k-rule-thin" />
                    <div>
                      <div className="k-label mb-2">Skills gained</div>
                      <div className="flex flex-wrap gap-1.5">
                        {node.skillsGained.map(sid => (
                          <span key={sid} className="k-badge-quiet">
                            {SKILL_MAP[sid] ?? sid.replace('sk_', '').replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Resource CTA */}
                {resource ? (
                  <>
                    <hr className="k-rule-thin" />
                    <div>
                      <div className="k-label mb-2">Resource</div>
                      <div className="mb-3">
                        <div className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          {resource.title}
                        </div>
                        <div className="text-[11px] flex flex-wrap gap-x-3" style={{ color: 'var(--text-tertiary)' }}>
                          <span>{resource.provider}</span>
                          <span>{resource.type}</span>
                          <span>{formatDuration(resource.estimatedHours)}</span>
                          {resource.isFree && <span>Free</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="k-btn k-btn-solid w-full"
                        onClick={() => onStartLearning(node, resource)}
                      >
                        {isCompleted ? 'Review Resource →' : 'Start Learning →'}
                      </button>
                    </div>
                  </>
                ) : node.type === 'resource' && (
                  <>
                    <hr className="k-rule-thin" />
                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Learning resource unavailable.</p>
                  </>
                )}

                {/* Project CTA */}
                {project ? (
                  <>
                    <hr className="k-rule-thin" />
                    <div>
                      <div className="k-label mb-2">Project</div>
                      <div className="mb-3">
                        <div className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          {project.title}
                        </div>
                        <div className="text-[11px] flex flex-wrap gap-x-3" style={{ color: 'var(--text-tertiary)' }}>
                          <span>{project.type}</span>
                          <span>~{project.estimatedHours}h</span>
                          {project.mentorReview && <span>mentor review</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="k-btn k-btn-solid w-full"
                        onClick={() => onViewProject(node, project)}
                      >
                        {isCompleted ? 'View Completed Project →' : isActive ? 'Continue Project →' : 'View Project →'}
                      </button>
                    </div>
                  </>
                ) : node.type === 'project' && (
                  <>
                    <hr className="k-rule-thin" />
                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>This stage doesn&apos;t have a project yet.</p>
                  </>
                )}

                {/* Assessment CTA */}
                {assessment ? (
                  <>
                    <hr className="k-rule-thin" />
                    <div>
                      <div className="k-label mb-2">Assessment</div>
                      <div className="mb-3">
                        <div className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          {assessment.title}
                        </div>
                        <div className="text-[11px] flex flex-wrap gap-x-3" style={{ color: 'var(--text-tertiary)' }}>
                          {assessment.totalQuestions != null && <span>{assessment.totalQuestions} questions</span>}
                          <span>{assessment.estimatedMinutes}min</span>
                          <span>pass: {assessment.passingScore}%</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="k-btn k-btn-solid w-full"
                        onClick={() => onTakeAssessment(node, assessment)}
                      >
                        Take Assessment →
                      </button>
                    </div>
                  </>
                ) : node.type === 'assessment' && (
                  <>
                    <hr className="k-rule-thin" />
                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Assessment unavailable.</p>
                  </>
                )}

                {/* Skill node with no sub-content — show no extra fallback, the why + skills is enough */}
                {!hasContent && node.type === 'skill' && null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function JourneyPage() {
  const { nodeStatuses, completeNode, progressPercent, completedCount, totalCount } = useJourneyProgress();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [modal, setModal] = useState<ModalState>(null);

  // Merge seed nodes with live statuses
  const nodes = useMemo(
    () => ACTIVE_PATH.nodes.map(n => ({ ...n, status: nodeStatuses[n.id] ?? n.status })),
    [nodeStatuses]
  );

  const completedHours = nodes
    .filter(n => n.status === 'completed')
    .reduce((sum, n) => sum + n.estimatedHours, 0);
  const remainingHours = ACTIVE_PATH.estimatedTotalHours - completedHours;
  const primaryActiveNode = nodes.find(n => n.status === 'in_progress');
  const activeNodeResource = primaryActiveNode?.resourceId
    ? RESOURCES.find(r => r.id === primaryActiveNode.resourceId) ?? null
    : null;
  const ActiveNodeIcon = primaryActiveNode ? NODE_ICON[primaryActiveNode.type] ?? Star : Star;
  const adaptationCount = ACTIVE_PATH.adaptationHistory.length;

  // Open modal for spotlight "Continue →" button
  const openForNode = useCallback((node: PathNode) => {
    if (node.resourceId) {
      const r = RESOURCES.find(res => res.id === node.resourceId);
      if (r) { setModal({ kind: 'resource', node, resource: r }); return; }
    }
    if (node.projectId) {
      const p = PROJECTS.find(proj => proj.id === node.projectId);
      if (p) { setModal({ kind: 'project', node, project: p }); return; }
    }
    if (node.assessmentId) {
      const a = ASSESSMENTS.find(asmnt => asmnt.id === node.assessmentId);
      if (a) { setModal({ kind: 'assessment', node, assessment: a }); return; }
    }
    setModal({ kind: 'skill', node });
  }, []);

  const handleComplete = useCallback((nodeId: string) => {
    completeNode(nodeId);
    setModal(null);
  }, [completeNode]);

  const closeModal = useCallback(() => setModal(null), []);

  return (
    <div className="max-w-4xl">
      {/* ── Page header, directly on the dark room ─────────────────────────── */}
      <motion.header
        className="mb-7"
        initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      >
        <div className="k-slug">Journey</div>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="k-display-sm" style={{ color: 'var(--text-tertiary)' }}>
            Frontend Developer
          </h1>
          <span className="k-display-sm" style={{ color: 'var(--text-muted)' }} aria-hidden="true">→</span>
          <h1 className="k-display">ML Engineer</h1>
        </div>
        <p className="nx-support mt-4 max-w-xl">
          {ACTIVE_PATH.description}
        </p>
      </motion.header>

      {/* ── Progress + rationale ───────────────────────────────────────────── */}
      <motion.div
        className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] mb-5"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.1, duration: prefersReducedMotion ? 0 : 0.35 }}
      >
        <div className="k-paper k-panel p-5 flex items-center gap-5">
          <DonutRing progress={progressPercent} />
          <div className="min-w-0 space-y-3">
            <div>
              <div className="k-label">Milestones</div>
              <div className="k-figure text-lg">{completedCount} / {totalCount}</div>
            </div>
            <hr className="k-rule-thin" />
            <div>
              <div className="k-label">Remaining</div>
              <div className="k-figure text-lg">{formatDuration(remainingHours)}</div>
            </div>
            {adaptationCount > 0 && (
              <>
                <hr className="k-rule-thin" />
                <div>
                  <div className="k-label">Adapted</div>
                  <div className="k-figure text-lg">{adaptationCount}×</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="k-paper k-panel p-5 sm:p-6">
          <div className="k-slug">Why this path</div>
          <p className="text-[14px] mt-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            {ACTIVE_PATH.recommendationReason}
          </p>
        </div>
      </motion.div>

      {/* ── NOW LEARNING spotlight — the one hero object on this view ──────── */}
      {primaryActiveNode && (
        <motion.section
          className="k-paper k-panel-hero p-5 sm:p-6 mb-9"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: prefersReducedMotion ? 0 : 0.35 }}
        >
          <div className="flex items-start gap-4">
            <span className="k-tile" aria-hidden="true"><ActiveNodeIcon size={18} /></span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="k-slug">Now learning</div>
                <div className="k-figure text-[13px]">+{primaryActiveNode.xpReward} XP</div>
              </div>
              <h2 className="k-display-sm mt-2">{primaryActiveNode.title}</h2>
              <p className="text-[13px] mt-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                {primaryActiveNode.description}
              </p>
              {activeNodeResource && (
                <>
                  <hr className="k-rule-hard my-4" />
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    <span>{activeNodeResource.provider}</span>
                    <span>{activeNodeResource.type}</span>
                    <span>{formatDuration(activeNodeResource.estimatedHours)}</span>
                    {activeNodeResource.isFree && <span>Free</span>}
                  </div>
                </>
              )}
              <button
                type="button"
                className="k-btn k-btn-solid mt-5"
                onClick={() => openForNode(primaryActiveNode)}
              >
                Continue →
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Phase timeline ───────────────────────────────────────────────────── */}
      <motion.div
        className="k-slug mb-4"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
      >
        Learning route
      </motion.div>

      <div className="space-y-5">
        {PHASES.map((phase, phaseIdx) => {
          const phaseNodes = nodes.filter(n => phase.nodeIds.includes(n.id));
          const phaseHours = phaseNodes.reduce((s, n) => s + n.estimatedHours, 0);
          const allComplete = phaseNodes.every(n => n.status === 'completed');
          const inProgress = phaseNodes.some(n => n.status === 'in_progress');

          return (
            <motion.section
              key={phase.id}
              className="k-paper k-panel p-5 sm:p-6"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 0.3 + phaseIdx * 0.12,
                duration: prefersReducedMotion ? 0 : 0.35,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-3">
                <div className="min-w-0">
                  <div className="k-slug">Stage {phase.number}</div>
                  <h2 className="k-display-sm mt-2">{phase.label}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className={inProgress ? 'k-badge' : 'k-badge-quiet'}>
                    {allComplete ? 'Complete' : inProgress ? 'Active' : 'Upcoming'}
                  </span>
                  <span className="k-figure text-[12px]">{formatDuration(phaseHours)}</span>
                </div>
              </div>
              <p className="text-[13px] mt-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {phase.description}
              </p>

              <hr className="k-rule-hard my-5" />

              <div>
                {phaseNodes.map((node, nodeIdx) => (
                  <PathNodeCard
                    key={node.id}
                    node={node}
                    index={phaseIdx * 5 + nodeIdx}
                    isLast={nodeIdx === phaseNodes.length - 1}
                    onStartLearning={(n, r) => setModal({ kind: 'resource', node: n, resource: r })}
                    onViewProject={(n, p) => setModal({ kind: 'project', node: n, project: p })}
                    onTakeAssessment={(n, a) => setModal({ kind: 'assessment', node: n, assessment: a })}
                  />
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* ── Destination ──────────────────────────────────────────────────────── */}
      <motion.section
        className="k-paper k-panel p-5 sm:p-6 mt-5"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.7 }}
      >
        <div className="k-slug">Your destination</div>
        <h2 className="k-display-sm mt-2">ML Engineer</h2>
        <p className="text-[13px] mt-3 max-w-md" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          Design, build, and deploy machine learning systems at scale. Bridge research and production.
        </p>
        <hr className="k-rule-hard my-5" />
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <div className="k-label">Target</div>
            <div className="k-figure text-base mt-1">March 2027</div>
          </div>
          <div>
            <div className="k-label">Current readiness</div>
            <div className="k-figure text-base mt-1">{progressPercent}%</div>
          </div>
        </div>
      </motion.section>

      {/* ── Latest Adaptation ────────────────────────────────────────────── */}
      {adaptationCount > 0 && (
        <motion.section
          className="k-paper k-panel p-5 mt-5"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.8 }}
        >
          {ACTIVE_PATH.adaptationHistory.slice(-1).map((a, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="k-tile" aria-hidden="true"><Zap size={16} /></span>
                <div className="k-slug">Path updated</div>
                <span className="k-figure text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(a.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-[13px] mt-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                {a.reason}
              </p>
            </div>
          ))}
        </motion.section>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal?.kind === 'resource' && (
          <ModalShell label={modal.resource.title} onClose={closeModal}>
            <ResourceModalContent
              node={modal.node}
              resource={modal.resource}
              onClose={closeModal}
            />
          </ModalShell>
        )}
        {modal?.kind === 'project' && (
          <ModalShell label={modal.project.title} onClose={closeModal}>
            <ProjectModalContent
              node={modal.node}
              project={modal.project}
              onClose={closeModal}
            />
          </ModalShell>
        )}
        {modal?.kind === 'assessment' && (
          <ModalShell label={modal.assessment.title} onClose={closeModal}>
            <AssessmentModalContent
              node={modal.node}
              assessment={modal.assessment}
              onNavigate={() => { closeModal(); router.push('/assessments'); }}
            />
          </ModalShell>
        )}
        {modal?.kind === 'skill' && (
          <ModalShell label={modal.node.title} onClose={closeModal}>
            <SkillModalContent
              node={modal.node}
              onComplete={() => handleComplete(modal.node.id)}
            />
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

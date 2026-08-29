'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Lock, Clock, Zap, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ACTIVE_PATH, RESOURCES, PROJECTS, ASSESSMENTS, SKILLS } from '@/lib/data/seed';
import { formatDuration } from '@/lib/utils';
import { useJourneyProgress } from '@/lib/context/JourneyProgressContext';
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

const NODE_EMOJI: Record<string, string> = {
  resource: '📚',
  project: '🛠',
  assessment: '📊',
  milestone: '⭐',
  skill: '🎯',
};

const DIFF_LABELS = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];

// ─── Modal state ──────────────────────────────────────────────────────────────
type ModalState =
  | { kind: 'resource'; node: PathNode; resource: LearningResource }
  | { kind: 'project'; node: PathNode; project: Project }
  | { kind: 'assessment'; node: PathNode; assessment: Assessment }
  | { kind: 'skill'; node: PathNode }
  | null;

// ─── Shared modal shell (bottom sheet) ───────────────────────────────────────
function ModalShell({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <motion.div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 600,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--bg-elevated)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          paddingBottom: 40,
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Drag handle + close */}
        <div
          style={{
            position: 'sticky', top: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px 20px 14px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
            zIndex: 1,
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={13} />
          </button>
        </div>
        <div style={{ padding: '24px 24px 0' }}>
          {children}
        </div>
      </motion.div>
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
      <div style={{ paddingBottom: 8 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
        </div>
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--accent-green)' }}>
          Completed
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {resource.title}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          {resource.title} is now complete.
        </p>
        {unlockedTitle && (
          <p className="text-sm mt-2" style={{ color: 'var(--accent-cyan)', lineHeight: 1.75 }}>
            {unlockedTitle} is now available.
          </p>
        )}
        <motion.button
          className="w-full h-10 rounded-xl text-sm font-semibold mt-8"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--accent-green)' }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
        >
          Back to Journey
        </motion.button>
      </div>
    );
  }

  const inProgress = isStarted && !isCompleted;

  return (
    <>
      {/* Stage context */}
      {nodePhase && (
        <div
          className="text-[10px] font-bold tracking-[0.15em] uppercase mb-4 flex items-center gap-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          <span>Stage {nodePhase.number}</span>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <span>{nodePhase.label}</span>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <span style={{ color: 'var(--text-secondary)' }}>{node.title}</span>
        </div>
      )}

      {/* In-progress badge */}
      {inProgress && (
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-violet-bright)', flexShrink: 0 }}
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--accent-violet-bright)' }}>
            In progress · Continue learning
          </span>
        </div>
      )}

      {/* Resource type */}
      <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
        {resource.type}
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
        {resource.title}
      </h2>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-5 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{resource.provider}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Clock size={10} />{formatDuration(resource.estimatedHours)}</span>
        {resource.isFree ? (
          <><span>·</span><span style={{ color: 'var(--accent-green)' }}>Free</span></>
        ) : resource.price != null ? (
          <><span>·</span><span>${resource.price}</span></>
        ) : null}
        <span>·</span>
        <span style={{ color: 'var(--accent-violet-bright)' }}>+{node.xpReward} XP</span>
      </div>

      {/* Description */}
      {resource.description && (
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          {resource.description}
        </p>
      )}

      {/* Skills */}
      {skillNames.length > 0 && (
        <>
          <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 16 }} />
          <div className="mb-5">
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
              Skills
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {skillNames.join('  ·  ')}
            </p>
          </div>
        </>
      )}

      {/* Why this is in your path */}
      <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 16 }} />
      <div className="mb-5" style={{ borderLeft: '2px solid rgba(124,58,237,0.5)', paddingLeft: 12 }}>
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--accent-violet-bright)' }}>
          Why this is in your path
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          {node.whyRecommended}
        </p>
      </div>

      {/* By the end */}
      {objectives.length > 0 && (
        <>
          <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 16 }} />
          <div className="mb-7">
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
              By the end
            </div>
            <ul className="space-y-2">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                  <span style={{ color: 'var(--accent-violet-bright)', flexShrink: 0, lineHeight: '1.75' }}>›</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* CTA */}
      {isCompleted ? (
        <div
          className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--accent-green)' }}
        >
          <CheckCircle size={14} /> Completed
        </div>
      ) : inProgress ? (
        <motion.button
          className="w-full h-11 rounded-xl text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-violet-bright))', color: 'white' }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleComplete}
        >
          Mark Complete · +{node.xpReward} XP
        </motion.button>
      ) : (
        <motion.button
          className="w-full h-11 rounded-xl text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-violet-bright))', color: 'white' }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
        >
          Start Learning →
        </motion.button>
      )}
    </>
  );
}

// ─── Project modal content ────────────────────────────────────────────────────
function ProjectModalContent({
  node,
  project,
  onClose,
  onComplete,
}: {
  node: PathNode;
  project: Project;
  onClose: () => void;
  onComplete: () => void;
}) {
  const skillNames = project.skillIds.map(
    id => SKILL_MAP[id] ?? id.replace('sk_', '').replace(/_/g, ' ')
  );
  const isCompleted = node.status === 'completed';

  return (
    <>
      <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
        Project · {project.type}
      </div>
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
        {project.title}
      </h2>
      <div className="flex flex-wrap items-center gap-2 mb-5 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1"><Clock size={10} />~{project.estimatedHours}h</span>
        <span>·</span>
        <span>{DIFF_LABELS[project.difficulty] ?? 'Intermediate'}</span>
        {project.mentorReview && (
          <><span>·</span><span style={{ color: 'var(--accent-cyan)' }}>Mentor review</span></>
        )}
        <span>·</span>
        <span style={{ color: 'var(--accent-violet-bright)' }}>+{project.xpReward} XP</span>
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        {project.description}
      </p>
      {skillNames.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
            Skills developed
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillNames.map(name => (
              <span
                key={name}
                className="text-[11px] px-2 py-0.5 rounded"
                style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--accent-green)' }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mb-7" style={{ borderLeft: '2px solid rgba(16,185,129,0.4)', paddingLeft: 12 }}>
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--accent-violet-bright)' }}>
          NEXUS noticed
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          {node.whyRecommended}
        </p>
      </div>
      {isCompleted ? (
        <div
          className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--accent-green)' }}
        >
          <CheckCircle size={14} /> Project Completed
        </div>
      ) : (
        <motion.button
          className="w-full h-11 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--accent-green)' }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
        >
          Mark Project Complete · +{node.xpReward} XP
        </motion.button>
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
      <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
        Assessment · {assessment.type}
      </div>
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
        {assessment.title}
      </h2>
      <div className="flex flex-wrap items-center gap-2 mb-5 text-xs" style={{ color: 'var(--text-muted)' }}>
        {assessment.totalQuestions != null && <span>{assessment.totalQuestions} questions</span>}
        {assessment.totalQuestions != null && <span>·</span>}
        <span className="flex items-center gap-1"><Clock size={10} />{assessment.estimatedMinutes}min</span>
        <span>·</span>
        <span>Pass: {assessment.passingScore}%</span>
        <span>·</span>
        <span style={{ color: 'var(--accent-violet-bright)' }}>+{assessment.xpReward} XP</span>
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        {assessment.description}
      </p>
      {skillNames.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
            Skills assessed
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillNames.map(name => (
              <span
                key={name}
                className="text-[11px] px-2 py-0.5 rounded"
                style={{ background: 'rgba(6,182,212,0.08)', color: 'var(--accent-cyan)' }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mb-7" style={{ borderLeft: '2px solid rgba(6,182,212,0.4)', paddingLeft: 12 }}>
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--accent-violet-bright)' }}>
          NEXUS noticed
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          {node.whyRecommended}
        </p>
      </div>
      <motion.button
        className="w-full h-11 rounded-xl text-sm font-semibold"
        style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--accent-cyan)' }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNavigate}
      >
        Go to Assessments →
      </motion.button>
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
      <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
        Skill
      </div>
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
        {node.title}
      </h2>
      <div className="flex flex-wrap items-center gap-2 mb-5 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1"><Clock size={10} />{formatDuration(node.estimatedHours)}</span>
        <span>·</span>
        <span style={{ color: 'var(--accent-violet-bright)' }}>+{node.xpReward} XP</span>
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        {node.description}
      </p>
      {skillNames.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
            Skills gained
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillNames.map(name => (
              <span
                key={name}
                className="text-[11px] px-2 py-0.5 rounded"
                style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--text-secondary)' }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mb-7" style={{ borderLeft: '2px solid rgba(124,58,237,0.5)', paddingLeft: 12 }}>
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--accent-violet-bright)' }}>
          NEXUS noticed
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          {node.whyRecommended}
        </p>
      </div>
      {isCompleted ? (
        <div
          className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--accent-green)' }}
        >
          <CheckCircle size={14} /> Completed
        </div>
      ) : (
        <motion.button
          className="w-full h-11 rounded-xl text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-violet-bright))', color: 'white' }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
        >
          Mark as Complete · +{node.xpReward} XP
        </motion.button>
      )}
    </>
  );
}

// ─── Donut Ring ───────────────────────────────────────────────────────────────
function DonutRing({ progress }: { progress: number }) {
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
        <defs>
          <linearGradient id="donutGrad" x1="0" y1="0" x2="88" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="url(#donutGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.4 }}
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)', lineHeight: 1 }}>
          {progress}%
        </span>
        <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>complete</span>
      </div>
    </div>
  );
}

// ─── Status Icon (36×36) ──────────────────────────────────────────────────────
function StatusIcon({ status }: { status: PathNode['status'] }) {
  const base = {
    width: 36, height: 36, borderRadius: '50%' as const,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };

  if (status === 'completed') {
    return (
      <div style={{ ...base, background: 'rgba(16,185,129,0.12)', border: '1.5px solid var(--accent-green)' }}>
        <CheckCircle size={15} style={{ color: 'var(--accent-green)' }} />
      </div>
    );
  }
  if (status === 'in_progress') {
    return (
      <div style={{ ...base, position: 'relative' }}>
        <motion.div
          style={{
            ...base, position: 'absolute',
            background: 'conic-gradient(from 0deg, #7c3aed, #06b6d4 55%, transparent 65%, transparent)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        <div
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--bg-elevated)',
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-violet-bright)' }} />
        </div>
      </div>
    );
  }
  if (status === 'locked') {
    return (
      <div style={{ ...base, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <Lock size={13} style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }
  return (
    <div style={{ ...base, border: '1.5px solid var(--border-strong)' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)' }} />
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
  const isLocked = node.status === 'locked';
  const isActive = node.status === 'in_progress';
  const isCompleted = node.status === 'completed';

  const resource = node.resourceId ? RESOURCES.find(r => r.id === node.resourceId) ?? null : null;
  const project = node.projectId ? PROJECTS.find(p => p.id === node.projectId) ?? null : null;
  const assessment = node.assessmentId ? ASSESSMENTS.find(a => a.id === node.assessmentId) ?? null : null;

  const prerequisiteTitle =
    isLocked && node.unlockConditions.length > 0
      ? ACTIVE_PATH.nodes.find(n => n.id === node.unlockConditions[0])?.title
      : null;

  const spineLineColor = isCompleted
    ? 'linear-gradient(to bottom, var(--accent-green), var(--accent-violet))'
    : isActive
    ? 'var(--accent-violet)'
    : 'var(--border-subtle)';

  const panelId = `node-panel-${node.id}`;

  // Missing data fallback labels
  const hasContent = resource || project || assessment;

  return (
    <motion.div
      className="flex gap-4"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
      style={{ opacity: isLocked ? 0.4 : 1 }}
    >
      {/* Spine column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0, paddingTop: 4 }}>
        <StatusIcon status={node.status} />
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: 20, marginTop: 4, background: spineLineColor, opacity: 0.5 }} />
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
            className="rounded-xl p-4"
            style={{
              background: isActive ? 'rgba(124,58,237,0.06)' : 'transparent',
              border: '1px solid transparent',
            }}
            whileHover={!isLocked ? { y: -1, boxShadow: '0 4px 20px rgba(124,58,237,0.15)' } : {}}
            animate={isActive ? {
              borderColor: ['rgba(124,58,237,0.3)', 'rgba(124,58,237,0.6)', 'rgba(124,58,237,0.3)'],
            } : { borderColor: 'transparent' }}
            transition={isActive ? { duration: 2.5, repeat: Infinity } : { duration: 0.15 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold leading-snug"
                  style={{
                    color: isLocked ? 'var(--text-muted)' : isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: isCompleted ? 'line-through' : undefined,
                    filter: isLocked ? 'blur(0.5px)' : undefined,
                  }}
                >
                  {node.title}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Clock size={9} />{formatDuration(node.estimatedHours)}
                  </span>
                  {!isLocked && <span className="capitalize">{node.type}</span>}
                  {isLocked && prerequisiteTitle && <span>Requires: {prerequisiteTitle}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                {isActive && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--accent-violet-bright)' }}
                  >
                    in progress
                  </span>
                )}
                {!isLocked && (
                  <motion.span
                    className="text-base font-light leading-none"
                    style={{ color: 'var(--text-muted)', display: 'inline-block' }}
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
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
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div
                className="mx-1 mt-1 rounded-b-xl p-4 space-y-4"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {/* NEXUS noticed */}
                <div style={{ borderLeft: '2px solid rgba(124,58,237,0.5)', paddingLeft: 12 }}>
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--accent-violet-bright)' }}>
                    NEXUS noticed
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                    {node.whyRecommended}
                  </p>
                </div>

                {/* Skills gained */}
                {node.skillsGained.length > 0 && (
                  <>
                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                        Skills gained
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {node.skillsGained.map(sid => (
                          <span
                            key={sid}
                            className="text-[11px] px-2 py-0.5 rounded"
                            style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--text-secondary)' }}
                          >
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
                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                        Resource
                      </div>
                      <div className="mb-3">
                        <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                          {resource.title}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {resource.provider} · {resource.type} · {formatDuration(resource.estimatedHours)}
                          {resource.isFree && <span className="ml-1.5" style={{ color: 'var(--accent-green)' }}>Free</span>}
                        </div>
                      </div>
                      <motion.button
                        className="w-full h-9 rounded-lg text-sm font-semibold"
                        style={{ background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-violet-bright))', color: 'white' }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onStartLearning(node, resource)}
                      >
                        {isCompleted ? 'Review Resource →' : 'Start Learning →'}
                      </motion.button>
                    </div>
                  </>
                ) : node.type === 'resource' && (
                  <>
                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Learning resource unavailable.</p>
                  </>
                )}

                {/* Project CTA */}
                {project ? (
                  <>
                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                        Project
                      </div>
                      <div className="mb-3">
                        <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                          {project.title}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {project.type} · ~{project.estimatedHours}h
                          {project.mentorReview ? ' · mentor review' : ''}
                        </div>
                      </div>
                      <motion.button
                        className="w-full h-9 rounded-lg text-sm font-semibold"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--accent-green)' }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onViewProject(node, project)}
                      >
                        {isCompleted ? 'View Completed Project →' : 'View Project →'}
                      </motion.button>
                    </div>
                  </>
                ) : node.type === 'project' && (
                  <>
                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>This stage doesn&apos;t have a project yet.</p>
                  </>
                )}

                {/* Assessment CTA */}
                {assessment ? (
                  <>
                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                        Assessment
                      </div>
                      <div className="mb-3">
                        <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                          {assessment.title}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {assessment.totalQuestions != null ? `${assessment.totalQuestions} questions · ` : ''}
                          {assessment.estimatedMinutes}min · pass: {assessment.passingScore}%
                        </div>
                      </div>
                      <motion.button
                        className="w-full h-9 rounded-lg text-sm font-semibold"
                        style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--accent-cyan)' }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onTakeAssessment(node, assessment)}
                      >
                        Take Assessment →
                      </motion.button>
                    </div>
                  </>
                ) : node.type === 'assessment' && (
                  <>
                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Assessment unavailable.</p>
                  </>
                )}

                {/* Skill node with no sub-content — show no extra fallback, NEXUS noticed + skills is enough */}
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

  const statChips = [
    { label: `${completedCount} / ${totalCount} milestones`, color: 'var(--text-secondary)' },
    { label: formatDuration(remainingHours) + ' remaining', color: 'var(--text-muted)' },
    ...(ACTIVE_PATH.adaptationHistory.length > 0
      ? [{ label: `Adapted ${ACTIVE_PATH.adaptationHistory.length}×`, color: 'var(--accent-cyan)' }]
      : []),
  ];

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
    <div>
      {/* ── Hero Panel ──────────────────────────────────────────────────────── */}
      <motion.div
        className="rounded-2xl p-7 mb-8 flex items-center gap-8"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 0 60px rgba(124,58,237,0.08)',
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
            My Journey
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-5">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-secondary)', lineHeight: 1.1 }}>
              Frontend Developer
            </h1>
            <span className="text-2xl font-thin" style={{ color: 'var(--text-muted)' }}>→</span>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', lineHeight: 1.1 }}>
              ML Engineer
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {statChips.map(chip => (
              <span
                key={chip.label}
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: chip.color }}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
        <DonutRing progress={progressPercent} />
      </motion.div>

      {/* ── Why This Path ────────────────────────────────────────────────────── */}
      <motion.div
        className="max-w-3xl mb-8 rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <div className="flex">
          <div style={{ width: 2, flexShrink: 0, background: 'linear-gradient(to bottom, var(--accent-violet), var(--accent-cyan))' }} />
          <div className="flex-1 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <motion.div
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-violet-bright)', flexShrink: 0 }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--accent-violet-bright)' }}>
                ⚡ Why this path was built for you
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              {ACTIVE_PATH.recommendationReason}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── NOW LEARNING Spotlight ───────────────────────────────────────────── */}
      {primaryActiveNode && (
        <motion.div
          className="max-w-3xl mb-10"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
        >
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
            Now Learning
          </div>
          <motion.div
            className="rounded-xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.04) 100%)',
              border: '1px solid rgba(124,58,237,0.3)',
            }}
            animate={{ borderColor: ['rgba(124,58,237,0.3)', 'rgba(124,58,237,0.55)', 'rgba(124,58,237,0.3)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 rounded-xl flex items-center justify-center text-2xl"
                style={{ width: 48, height: 48, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                {NODE_EMOJI[primaryActiveNode.type] ?? '⭐'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {primaryActiveNode.title}
                  </span>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--accent-violet-bright)' }}>
                    +{primaryActiveNode.xpReward} XP
                  </span>
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {primaryActiveNode.description}
                </p>
                {activeNodeResource && (
                  <div className="text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
                    {activeNodeResource.provider} · {activeNodeResource.type} · {formatDuration(activeNodeResource.estimatedHours)}
                    {activeNodeResource.isFree && <span className="ml-2" style={{ color: 'var(--accent-green)' }}>Free</span>}
                  </div>
                )}
                <motion.button
                  className="px-5 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--accent-violet)', color: 'white' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{
                    boxShadow: [
                      '0 0 0px rgba(124,58,237,0)',
                      '0 0 18px rgba(124,58,237,0.5)',
                      '0 0 0px rgba(124,58,237,0)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  onClick={() => openForNode(primaryActiveNode)}
                >
                  Continue →
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Phase timeline ───────────────────────────────────────────────────── */}
      <div className="max-w-3xl">
        <motion.div
          className="text-[11px] font-bold tracking-[0.2em] uppercase mb-7"
          style={{ color: 'var(--text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Learning Route
        </motion.div>

        <div className="space-y-10">
          {PHASES.map((phase, phaseIdx) => {
            const phaseNodes = nodes.filter(n => phase.nodeIds.includes(n.id));
            const phaseHours = phaseNodes.reduce((s, n) => s + n.estimatedHours, 0);
            const allComplete = phaseNodes.every(n => n.status === 'completed');
            const inProgress = phaseNodes.some(n => n.status === 'in_progress');
            const phaseColor = allComplete
              ? 'var(--accent-green)'
              : inProgress
              ? 'var(--accent-violet-bright)'
              : 'var(--text-muted)';

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + phaseIdx * 0.12, duration: 0.35 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1" style={{ height: 1, background: 'var(--border-subtle)' }} />
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {phase.number}
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: phaseColor }}>
                    {phase.label}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {formatDuration(phaseHours)}
                  </span>
                  <div className="flex-1" style={{ height: 1, background: 'var(--border-subtle)' }} />
                </div>
                <p className="text-[11px] mb-5 pl-1" style={{ color: 'var(--text-muted)' }}>
                  {phase.description}
                </p>
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
              </motion.div>
            );
          })}
        </div>

        {/* ── Destination ──────────────────────────────────────────────────── */}
        <motion.div
          className="mt-12 pt-8"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
            Your Destination
          </div>
          <div className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            ML Engineer
          </div>
          <p className="text-sm max-w-md mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            Design, build, and deploy machine learning systems at scale. Bridge research and production.
          </p>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Target: March 2027
            <span className="mx-2" style={{ color: 'var(--border-default)' }}>·</span>
            Current readiness: {progressPercent}%
          </div>
        </motion.div>

        {/* ── Latest Adaptation ────────────────────────────────────────────── */}
        {ACTIVE_PATH.adaptationHistory.length > 0 && (
          <motion.div
            className="mt-6 rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex">
              <div style={{ width: 2, flexShrink: 0, background: 'var(--accent-cyan)' }} />
              <div className="flex-1 p-4">
                {ACTIVE_PATH.adaptationHistory.slice(-1).map((a, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={12} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
                        Path Updated
                      </span>
                      <span className="text-xs font-medium" style={{ color: 'var(--accent-cyan)' }}>
                        {new Date(a.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                      {a.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

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
              onComplete={() => handleComplete(modal.node.id)}
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

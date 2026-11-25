'use client';

import { useState, useMemo, useEffect, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ACTIVE_PATH, SKILLS, RESOURCES, PROJECTS, ASSESSMENTS, DEMO_LEARNER_CONTEXT,
} from '@/lib/data/seed';
import { selectNextBestMove } from '@/lib/services/recommendation';
import { PathAdaptationService } from '@/lib/services/path-adaptation';
import { GapAnalysisService } from '@/lib/services/gap-analysis';
import { useOnboarding } from '@/lib/context/OnboardingContext';
import { useJourneyProgress } from '@/lib/context/JourneyProgressContext';
import { useMastery } from '@/lib/context/MasteryContext';
import { useAssessmentResults } from '@/lib/context/AssessmentContext';
import { useProjectProgress } from '@/lib/context/ProjectContext';
import { useSidebar } from '@/components/layout/SidebarContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { LearningSphere } from '@/components/visualization/LearningSphere';
import { buildSphereData } from '@/lib/visualization/sphereDataAdapter';
import { formatXP, skillLevelColor, skillLevelLabel } from '@/lib/utils';
import type { LearnerContext, PathNode, PathNodeStatus, Skill } from '@/lib/types';
import type { NodeMastery } from '@/lib/visualization/sphereTypes';

// ─── Deterministic date formatting ───────────────────────────────────────────
// Intl output can differ between the server's and the browser's ICU/timezone, so
// dates are formatted by hand from UTC parts. Same string on both sides, always.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonthYear(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatDayMonthYear(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

/** "a", "a and b", "a, b and c" — for naming skills inside a sentence. */
function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * The one line on this page written to a person rather than about their data.
 * `now` is null until after hydration — a greeting that read the server's clock
 * and then the browser's would be a mismatch — so the first render gets the
 * time-neutral form and the specific one arrives with the effect.
 */
function greetingFor(now: Date | null): string {
  if (!now) return 'Welcome back';
  const hour = now.getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Up late';
}

/** "This week", "Last week", "6 weeks ago" — for the weekly activity series. */
function weeksAgoLabel(weeksBack: number): string {
  if (weeksBack === 0) return 'This week';
  if (weeksBack === 1) return 'Last week';
  return `${weeksBack} weeks ago`;
}

/** How many skills the sphere highlights as "recommended next". */
const SPHERE_RECOMMENDED_LIMIT = 3;
const ACTIVITY_LIMIT = 4;

// The five buckets the sphere sorts every node into, in the sphere's own words —
// its tooltip and its screen-reader list both call the `locked` bucket "Not
// started" — ordered from most mastered to least. The legend beside the map is
// counted off these buckets and named with these labels, so the key and the map
// cannot describe one node two different ways.
//
// The colours mirror LearningSphere's own `MASTERY_COLOR`, which is private to
// that module. Mirrored rather than imported because the sphere's palette is an
// internal detail of the renderer; if it ever changes, this legend is the one
// place on the page that has to change with it.
const SPHERE_MASTERY_BUCKETS: { bucket: NodeMastery; label: string; color: string }[] = [
  { bucket: 'mastered', label: 'mastered', color: 'var(--accent-green)' },
  { bucket: 'strong', label: 'strong', color: 'var(--accent-violet-bright)' },
  { bucket: 'developing', label: 'developing', color: 'var(--accent-cyan)' },
  { bucket: 'weak', label: 'weak', color: 'var(--accent-amber)' },
  { bucket: 'locked', label: 'not started', color: 'var(--text-muted)' },
];

// The sphere is sized in pixels through its own `height` prop, so the box that
// reserves its space must mirror these two numbers exactly — see the
// `h-[320px] lg:h-[460px]` wrapper. The compact value keeps the node shell
// inside the camera frustum on a phone (the frustum is height-driven, so a box
// taller than it is wide crops the sphere's sides).
const SPHERE_HEIGHT_COMPACT = 320;
const SPHERE_HEIGHT_WIDE = 460;

interface ActivityEntry {
  id: string;
  title: string;
  detail: string;
  at: Date;
  color: string;
}

// ─── Path stages ─────────────────────────────────────────────────────────────
// `PathNode` carries `order` and `unlockConditions` and nothing else — there is
// no phase field on the path or its nodes — so stage names cannot be read out of
// the data. These are the three stages /journey already shows the learner
// (01 Foundations → 02 Core ML → 03 Production ML). Repeating that vocabulary is
// deliberate: a homepage that grouped the same ten nodes under different names
// than the page it links to would be describing one path two ways.
//
// A stage is identified by the node it *starts* at rather than by a list of its
// members, so a node added to the middle of the path joins the stage around it
// instead of disappearing from the grouping, and a boundary whose node no longer
// exists merges into the stage before it instead of rendering as an empty one.
// (The first boundary is the exception: nodes ahead of it have no earlier stage
// to fall into, so they open the first surviving stage instead.) If no boundary
// resolves at all, the whole path renders as one unlabelled progression.
const PATH_STAGES: { label: string; startsAt: string }[] = [
  { label: 'Foundations', startsAt: 'node_python_core' },
  { label: 'Core ML', startsAt: 'node_eda_project' },
  { label: 'Production ML', startsAt: 'node_deep_learning' },
];

/**
 * Live status → the wording and the indicator the path list uses. /journey
 * already calls these states "Completed", "In progress" and "Locked", so the
 * same words are used here. Keyed on the full status union, which means a status
 * the seed never produces today still cannot fall through to the wrong label.
 */
const NODE_STATUS: Record<PathNodeStatus, {
  label: string;
  /** Colour of the indicator, and of the thread below a completed step. */
  accent: string;
  /** Solid for what has been reached, hollow for what has not. */
  filled: boolean;
  title: string;
  weight: number;
}> = {
  completed: { label: 'Completed', accent: 'var(--accent-green)', filled: true, title: 'var(--text-tertiary)', weight: 400 },
  in_progress: { label: 'In progress', accent: 'var(--accent-violet-bright)', filled: true, title: 'var(--text-primary)', weight: 500 },
  available: { label: 'Available', accent: 'var(--accent-cyan)', filled: false, title: 'var(--text-secondary)', weight: 400 },
  locked: { label: 'Locked', accent: 'var(--border-default)', filled: false, title: 'var(--text-tertiary)', weight: 400 },
  skipped: { label: 'Skipped', accent: 'var(--text-tertiary)', filled: false, title: 'var(--text-muted)', weight: 400 },
};

/**
 * The statuses arrive from localStorage, which JourneyProgressContext parses and
 * casts without checking the values, so a stale or hand-edited entry can carry a
 * string that is outside the union at runtime even though it cannot be one at
 * compile time. A missing lookup here would throw while rendering and take the
 * whole homepage down, so an unrecognised status falls back to the inert
 * treatment and says plainly that it is not understood.
 */
const UNKNOWN_STATUS = {
  label: 'Status unknown',
  accent: 'var(--border-default)',
  filled: false,
  title: 'var(--text-tertiary)',
  weight: 400,
};

/** One stage of the path, with its live nodes in path order. */
interface PathStage {
  key: string;
  /** "01", "02", … — positional, so it stays sequential if a stage drops out. */
  number: string;
  /** Empty when the path could not be grouped — that renders one plain list. */
  label: string;
  color: string;
  nodes: PathNode[];
  /** Completed / total within this stage, so each column can report itself. */
  done: number;
}

/** One reading of the path's health. Signals with no data are never built. */
interface HealthSignal {
  label: string;
  value: string;
  /** Colour of the value — a state colour only where the state is meaningful. */
  color: string;
  /** 0–1. Omitted when the signal has no ratio to indicate. */
  ratio?: number;
  bar?: string;
  detail?: string;
}

// ─── Page furniture ──────────────────────────────────────────────────────────

/**
 * Every band opens the same way: a hard rule across the dark room, then the
 * band's printed slug, with an optional state or link at the far edge. One
 * component so the six bands cannot drift apart by a pixel, and so the rule and
 * the slug always travel together. `.k-slug` prints its own "// " prefix.
 */
function BandHead({ label, trailing, faint = false }: {
  label: string;
  trailing?: ReactNode;
  faint?: boolean;
}) {
  return (
    <>
      <div className={faint ? 'k-rule-thin' : 'k-rule-hard'} aria-hidden="true" />
      <div className="flex items-baseline justify-between gap-4 pt-5">
        <span className="k-slug truncate">
          {label}
        </span>
        {trailing && <span className="flex-shrink-0">{trailing}</span>}
      </div>
    </>
  );
}

/** The trailing link idiom shared by the band heads: a tracked mono label. */
function BandLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="k-label inline-flex items-center gap-1.5"
      style={{ color: 'var(--text-secondary)' }}
    >
      {label} <ArrowRight size={12} aria-hidden="true" />
    </Link>
  );
}

/**
 * A label over a figure — the page's only way of presenting a number, used by
 * the vitals strip, the move's cost and the health readout at three sizes. The
 * label is always the quiet element and the figure always the set one, so a
 * number never has to be boxed to read as a number.
 */
function Figure({
  label, value, color = 'var(--text-primary)', size = 15, hint,
  className = 'min-w-0', style, children,
}: {
  label: string;
  value: string;
  color?: string;
  size?: number;
  hint?: string;
  /** Set by the subdivided sheets, so a cell is a figure and not a box around one. */
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div className={className} style={style} title={hint}>
      <dt className="k-label">{label}</dt>
      <dd
        className="k-figure m-0 mt-2.5"
        style={{ color, fontSize: size, lineHeight: 1.1 }}
      >
        {value}
      </dd>
      {children}
    </div>
  );
}

// ─── Subdivided sheets ───────────────────────────────────────────────────────
// Four figures in a row are one ruled object, not four floating cards, so the
// strip is a single sheet cut up by 2px rules. Each cell draws its own top and
// left rule and the lattice is pulled 2px up and left, which slides the outer
// rules under the sheet's own border (the sheet clips them) and leaves exactly
// one 2px rule between neighbours. A short last row simply ends — there is no
// empty cell to draw, at any breakpoint, which a gap-drawn grid cannot say.
const CELL_RULE = {
  borderTop: '2px solid var(--k-edge)',
  borderLeft: '2px solid var(--k-edge)',
} as const;
const LATTICE = { margin: '-2px 0 0 -2px' } as const;

export default function HomePage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion() ?? false;
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const { learnerContext, hasCompletedOnboarding } = useOnboarding();
  const { nodeStatuses, progressPercent: journeyProgress, completedCount, totalCount } = useJourneyProgress();
  const { masteries } = useMastery();
  const { storedResults } = useAssessmentResults();
  const { projectState } = useProjectProgress();
  // Already the app's breakpoint signal (max-width: 1023px — exactly `lg`), and
  // it starts `false` on both sides of hydration, so the first render agrees.
  const { isMobile } = useSidebar();
  const sphereHeight = isMobile ? SPHERE_HEIGHT_COMPACT : SPHERE_HEIGHT_WIDE;

  // Anything derived from the wall clock is computed once after hydration, never
  // during the first render — the server and the client would disagree.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);

  // ── Live learner context ───────────────────────────────────────────────────
  // The onboarding context when the learner has completed onboarding, otherwise
  // the demo persona. Masteries always come from MasteryContext, which is the
  // mutable source assessments write into.
  const liveContext = useMemo<LearnerContext>(
    () => ({ ...(learnerContext ?? DEMO_LEARNER_CONTEXT), masteries }),
    [learnerContext, masteries]
  );

  // ── Live path ──────────────────────────────────────────────────────────────
  // Seed structure with real statuses overlaid. Same merge idiom as /journey.
  const livePath = useMemo(
    () => ({
      ...ACTIVE_PATH,
      nodes: ACTIVE_PATH.nodes.map(node => ({
        ...node,
        status: nodeStatuses[node.id] ?? node.status,
      })),
    }),
    [nodeStatuses]
  );

  const actionableNodes = useMemo(
    () => livePath.nodes.filter(n => n.status === 'in_progress' || n.status === 'available'),
    [livePath]
  );

  // ── Next best move ─────────────────────────────────────────────────────────
  const nextMove = useMemo(
    () => selectNextBestMove({
      context: liveContext,
      path: livePath,
      skills: SKILLS,
      resources: RESOURCES,
      projects: PROJECTS,
      assessments: ASSESSMENTS,
    }),
    [liveContext, livePath]
  );

  // Each move is handed to the page that already owns its interaction: an
  // assessment is directly addressable, and everything else is a node on the path,
  // which /journey opens — its node detail is where the resource, the project and
  // the skill are actually started. Two existing routes, no new ones. The label
  // names the action waiting there; Home only navigates to it.
  const moveTarget = useMemo(() => {
    if (!nextMove) return null;
    if (nextMove.assessmentId) {
      return { href: `/assessments/${nextMove.assessmentId}`, label: 'Take assessment' };
    }
    if (nextMove.projectId) {
      return { href: '/journey', label: nextMove.continuing ? 'Continue project' : 'Start project' };
    }
    return { href: '/journey', label: nextMove.continuing ? 'Continue learning' : 'Start learning' };
  }, [nextMove]);

  // Where the move sits and what it moves: its position on the live path, and the
  // skills its own node teaches, named from SKILLS. Either half is dropped when the
  // data has no answer — an assessment node teaches no skill — and the line is
  // omitted entirely when neither resolves.
  const moveContext = useMemo(() => {
    if (!nextMove) return '';
    const ordered = [...livePath.nodes].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex(n => n.id === nextMove.nodeId);
    const node = index >= 0 ? ordered[index] : null;
    const taught = node
      ? node.skillsGained.length > 0
        ? node.skillsGained
        : node.skillId ? [node.skillId] : []
      : nextMove.skillId ? [nextMove.skillId] : [];
    const names = taught
      .map(id => SKILLS.find(s => s.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    return [
      index >= 0 ? `Step ${index + 1} of ${ordered.length}` : null,
      names.length > 0 ? `advances ${formatList(names)}` : null,
    ].filter(Boolean).join(' · ');
  }, [nextMove, livePath]);

  // Time and XP are both optional on a node, and the score exists only for the
  // resource-backed moves the service can actually score — see NextBestMove.score.
  // A figure the selector didn't supply gets no row rather than a zero.
  const moveMetrics = useMemo(() => {
    if (!nextMove) return [];
    const rows: { label: string; value: string; hint?: string }[] = [];
    if (nextMove.estimatedMinutes !== undefined) {
      rows.push({ label: 'Time', value: `~${formatMinutes(nextMove.estimatedMinutes)}` });
    }
    if (nextMove.xpReward > 0) {
      rows.push({ label: 'Reward', value: `+${formatXP(nextMove.xpReward)} XP` });
    }
    if (nextMove.score) {
      rows.push({
        label: 'Fit',
        value: `${Math.round(nextMove.score.totalScore * 100)}%`,
        hint: 'Recommendation score — goal alignment, gap severity, readiness, difficulty, time and preference, weighted.',
      });
    }
    return rows;
  }, [nextMove]);

  // selectNextBestMove returns null for two different reasons. Name the actual one
  // rather than blaming an incomplete profile for a finished path.
  const noGoalRequirements = liveContext.goal.requiredSkills.length === 0;
  const emptyMove = noGoalRequirements
    ? hasCompletedOnboarding
      // The profile is complete — the app simply has no requirement data for this
      // target role. Telling the learner to redo onboarding would send them in a
      // circle and never fix it.
      ? {
        title: 'No ranked next step for this goal',
        description: `Your profile is set, but this build doesn't track skill requirements for ${liveContext.profile.targetRole}, so steps can't be prioritized yet. Your path is still there to work through.`,
        action: { label: 'Open journey', onClick: () => router.push('/journey') },
      }
      : {
        title: 'No personalized guidance yet',
        description: 'Complete your profile to unlock personalized guidance.',
        action: { label: 'Complete profile', onClick: () => router.push('/onboarding') },
      }
    : completedCount === totalCount
      ? {
        title: 'Path complete',
        description: 'Every step on this path is done. Review it or set a new goal.',
        action: { label: 'Review path', onClick: () => router.push('/journey') },
      }
      : {
        title: 'Nothing available right now',
        description: 'Every remaining step is still locked by an earlier one.',
        action: { label: 'Open journey', onClick: () => router.push('/journey') },
      };

  // ── Path health ────────────────────────────────────────────────────────────
  // From PathAdaptationService with the live path, so blockers and the next
  // milestone come from real node statuses. Clock-dependent, hence gated on `now`.
  const pathHealth = useMemo(
    () => (now ? PathAdaptationService.evaluatePathHealth(livePath, liveContext, now) : null),
    [now, livePath, liveContext]
  );
  const scheduleAdherence = useMemo(
    () => (now ? PathAdaptationService.computeScheduleAdherence(livePath, liveContext, now) : null),
    [now, livePath, liveContext]
  );
  const goalTarget = liveContext.goal.targetDate;

  // Every schedule figure in the report — pace, days behind, the estimated end
  // date, and the risk level the state is read off — comes from the same two
  // inputs: the path's start and the goal's target date. With no target date the
  // service substitutes "a year from now", and with nothing completed the rate is
  // zero, so both cases produce arithmetic rather than evidence. Neither is shown.
  const hasScheduleEvidence = Boolean(goalTarget) && completedCount > 0;

  // ── Sphere inputs ──────────────────────────────────────────────────────────
  // "Recommended next" = the skills the currently actionable path nodes teach.
  const recommendedSkillIds = useMemo(() => {
    const ids: string[] = [];
    for (const node of actionableNodes) {
      const taught = node.skillsGained.length > 0
        ? node.skillsGained
        : node.skillId ? [node.skillId] : [];
      for (const id of taught) {
        if (!ids.includes(id)) ids.push(id);
        if (ids.length === SPHERE_RECOMMENDED_LIMIT) return ids;
      }
    }
    return ids;
  }, [actionableNodes]);

  // The path's destination is its final node — that is the goal skill.
  const goalSkillId = useMemo(() => {
    const destination = livePath.nodes.reduce<PathNode | null>(
      (furthest, node) => (!furthest || node.order > furthest.order ? node : furthest),
      null
    );
    return destination?.skillsGained[0] ?? destination?.skillId ?? null;
  }, [livePath]);

  const { sphereSkills, sphereConnections } = useMemo(
    () => buildSphereData(SKILLS, masteries, recommendedSkillIds, goalSkillId),
    [masteries, recommendedSkillIds, goalSkillId]
  );

  // ── Knowledge state ───────────────────────────────────────────────────────
  // Counted off the very buckets the sphere colours its nodes with, so the legend
  // next to the map can never contradict the map. Skills the learner has no
  // record for land in `locked` — counted as not started, never given a score —
  // and a bucket nobody is in is left out rather than printed as a zero.
  const skillCounts = useMemo(() => {
    const tally = new Map<NodeMastery, number>();
    for (const skill of sphereSkills) {
      tally.set(skill.mastery, (tally.get(skill.mastery) ?? 0) + 1);
    }
    return SPHERE_MASTERY_BUCKETS
      .map(({ bucket, label, color }) => ({ label, color, count: tally.get(bucket) ?? 0 }))
      .filter(entry => entry.count > 0);
  }, [sphereSkills]);

  // Two honest headings, and the data decides which: `locked` is the bucket for a
  // skill with no record at all, so a map where every node is locked has never
  // been measured, and saying it is "in motion" would be flattery.
  const universeHeading = sphereSkills.some(skill => skill.mastery !== 'locked')
    ? 'Your skills, in motion.'
    : 'Your skills, not yet measured.';

  // Only describe the map's markers when the live data actually put them there.
  const mapHint = recommendedSkillIds.length > 0
    ? goalSkillId
      ? 'Highlighted nodes are the skills your next steps teach; the ringed node is where this path ends.'
      : 'Highlighted nodes are the skills your next steps teach.'
    : goalSkillId
      ? 'The ringed node is where this path ends.'
      : '';

  // ── Goal gaps ──────────────────────────────────────────────────────────────
  // Computed once and shared by every section that ranks them, so two readouts
  // cannot rank the same goal differently or disagree on what is left.
  const prioritizedGaps = useMemo(
    () => GapAnalysisService.prioritizeGaps(
      GapAnalysisService.computeSkillGaps(masteries, liveContext.goal, SKILLS),
      liveContext
    ),
    [masteries, liveContext]
  );

  // ── Selected skill ─────────────────────────────────────────────────────────
  // The map hands the page an id and nothing else, so everything shown for the
  // selection is looked up: the name from SKILLS, the level and the score from the
  // live masteries. A node can be selected without the learner having any record
  // for it — an untouched skill is still on the map — and that case is named out
  // loud rather than filled in with a zero nobody measured.
  const selectedSkill = selectedSkillId
    ? SKILLS.find(s => s.id === selectedSkillId) ?? null
    : null;
  const selectedMastery = selectedSkillId
    ? masteries.find(m => m.skillId === selectedSkillId) ?? null
    : null;

  // ── Recent activity ────────────────────────────────────────────────────────
  // Read-only, and only from the two stores that record real timestamps. Node
  // completions and resource starts are deliberately absent — neither is stamped.
  const activity = useMemo<ActivityEntry[]>(() => {
    const entries: ActivityEntry[] = [];

    for (const [assessmentId, stored] of Object.entries(storedResults)) {
      const assessment = ASSESSMENTS.find(a => a.id === assessmentId);
      if (!assessment) continue;
      entries.push({
        id: `assessment-${assessmentId}`,
        title: assessment.title,
        detail: `Assessment · ${stored.result.score}%`,
        at: new Date(stored.result.completedAt),
        color: stored.result.passed ? 'var(--accent-green)' : 'var(--accent-amber)',
      });
    }

    for (const [projectId, entry] of Object.entries(projectState)) {
      const project = PROJECTS.find(p => p.id === projectId);
      if (!project) continue;
      if (entry.completedAt) {
        entries.push({
          id: `project-completed-${projectId}`,
          title: project.title,
          detail: 'Project completed',
          at: new Date(entry.completedAt),
          color: 'var(--accent-green)',
        });
      } else if (entry.startedAt) {
        entries.push({
          id: `project-started-${projectId}`,
          title: project.title,
          detail: 'Project started',
          at: new Date(entry.startedAt),
          color: 'var(--accent-cyan)',
        });
      }
    }

    return entries
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, ACTIVITY_LIMIT);
  }, [storedResults, projectState]);

  // ── Activity chart ─────────────────────────────────────────────────────────
  // The series is chronological — oldest week first — so a week's distance from
  // now is its distance from the end of the array. Labels are relative for the
  // same reason `weekStart` is never rendered: seed builds those dates from a
  // module-load clock, and a date printed off that clock would not survive
  // hydration. "3 weeks ago" is both hydration-safe and how a person would say it.
  const chartData = useMemo(
    () => {
      const weeks = liveContext.progress.weeklyActivity;
      return weeks.map((week, i) => ({
        week: weeksAgoLabel(weeks.length - 1 - i),
        hours: week.hoursLearned,
      }));
    },
    [liveContext]
  );

  const totalChartHours = useMemo(
    () => chartData.reduce((sum, point) => sum + point.hours, 0),
    [chartData]
  );

  // ── Masthead copy ──────────────────────────────────────────────────────────
  // The target role is the headline. Onboarding writes it from the learner's own
  // answers; before that it is the demo persona's. Where there is no role at all
  // the goal's title carries the line instead — and then the "you are becoming"
  // lead-in is dropped, because a title already reads as a sentence.
  const targetRole = liveContext.profile.targetRole.trim();
  const headline = targetRole || liveContext.goal.title;
  const headlineLead = targetRole ? 'You are becoming' : null;

  // The amber band under the headline takes its last word only. At 60px a band
  // under the whole phrase would break across two lines and read as two bands,
  // and the final word is the one that names the role.
  const headlineWords = headline.trim().split(/\s+/);
  const headlineTail = headlineWords[headlineWords.length - 1] ?? '';
  const headlineStem = headlineWords.slice(0, -1).join(' ');

  // Onboarding stores the literal string "You" when the learner never gave a
  // name, so that placeholder is dropped rather than greeted by it — "Good
  // morning, You" is worse than no name at all. Only the first name is used:
  // this is the one line on the page addressed to a person.
  const firstName = useMemo(() => {
    const full = liveContext.user.name.trim();
    if (!full || full === 'You') return '';
    return full.split(/\s+/)[0];
  }, [liveContext]);

  const greeting = greetingFor(now);

  // The goal's own description when the learner phrased one, otherwise a line
  // built from the two facts the profile always carries — where they are now and
  // when they want to arrive. Nothing is invented: with neither fact there is no
  // sentence, and the paragraph is not rendered.
  const supportingLine = useMemo(() => {
    const described = liveContext.goal.description.trim();
    if (described) return described;
    const from = liveContext.profile.currentRole.trim();
    if (!from && !goalTarget) return '';
    return `Your path ${from ? `from ${from} ` : ''}to ${headline}`
      + `${goalTarget ? `, targeting ${formatMonthYear(goalTarget)}` : ''}.`;
  }, [liveContext, headline, goalTarget]);

  // ── Vitals ─────────────────────────────────────────────────────────────────
  // Read straight off the learner — level, XP, streak and the weekly hours they
  // told us they have are stored values, not figures computed here. A learner on
  // day one has 0 XP and no streak, and "0" is not worth a slot, so those entries
  // are dropped rather than shown empty. Level is a real 1 from the first day, so
  // it always has something to say. Journey progress is deliberately absent from
  // this list: it belongs to JourneyProgressContext and is rendered once, as the
  // strip's lead figure, so there is exactly one percentage on the page.
  //
  // The streak is the one warm colour on a cold page, and it is warm because it
  // is the one figure here that is about showing up rather than about scoring.
  const vitals = useMemo(() => {
    const rows: { label: string; value: string; color?: string; hint?: string }[] = [];
    if (liveContext.progress.level > 0) {
      rows.push({ label: 'Level', value: String(liveContext.progress.level) });
    }
    if (liveContext.progress.totalXP > 0) {
      rows.push({ label: 'XP', value: formatXP(liveContext.progress.totalXP) });
    }
    if (liveContext.user.streakDays > 0) {
      rows.push({
        label: 'Streak',
        value: `${liveContext.user.streakDays} days`,
        color: 'var(--accent-amber)',
      });
    }
    if (liveContext.user.weeklyHoursAvailable > 0) {
      rows.push({
        label: 'Weekly time',
        value: `${liveContext.user.weeklyHoursAvailable}h`,
        hint: 'The hours a week you told Nexus you have.',
      });
    }
    if (goalTarget) {
      rows.push({ label: 'Target', value: formatMonthYear(goalTarget) });
    }
    return rows;
  }, [liveContext, goalTarget]);

  // ── Path health signals ────────────────────────────────────────────────────
  // Four things about this path are actually knowable: how much of it is done,
  // how many of the goal's required skills are at their target level, whether the
  // next step's prerequisites hold, and — only when there is a real deadline and
  // real progress — the pace. Everything else the health report can produce
  // (days behind, an estimated finish date) is arithmetic over a substituted
  // deadline, so it stays out of the UI.

  const lockedCount = useMemo(
    () => livePath.nodes.filter(n => n.status === 'locked').length,
    [livePath]
  );

  // Completing a step is not the only way to have started one. This path ships with
  // steps already in progress, so a state keyed on `completedCount` alone would call
  // it "Not started" on the same screen as "already underway".
  const inProgressCount = useMemo(
    () => livePath.nodes.filter(n => n.status === 'in_progress').length,
    [livePath]
  );

  const topGap = prioritizedGaps[0] ?? null;

  // Requirements whose skill this build actually knows about — an unknown skill id
  // is skipped by the gap service, and counting it as "met" would be a free pass.
  const requiredSkillsStatus = useMemo(() => {
    const known = liveContext.goal.requiredSkills.filter(r => SKILLS.some(s => s.id === r.skillId));
    if (known.length === 0) return null;
    return { met: known.length - prioritizedGaps.length, total: known.length };
  }, [liveContext, prioritizedGaps]);

  // The skill the next step actually teaches. Only one seed node carries an explicit
  // `skillId`, so the primary entry of `skillsGained` is the real signal — the same
  // order the sphere's goal node uses.
  const moveSkillId = useMemo(() => {
    if (!nextMove) return null;
    const node = livePath.nodes.find(n => n.id === nextMove.nodeId);
    return node?.skillsGained[0] ?? nextMove.skillId ?? null;
  }, [nextMove, livePath]);

  // Prerequisite readiness, from the service that already owns this calculation.
  // The subject is the skill the next step teaches, or the goal's widest gap when
  // that step has no prerequisites to be ready for. Whichever subject actually has
  // an unmet prerequisite wins, so this signal and the sentence beside it are always
  // talking about the same skill.
  const prereqStatus = useMemo(() => {
    const subjects: Skill[] = [];
    for (const id of [moveSkillId, topGap?.skill.id]) {
      if (!id) continue;
      const skill = SKILLS.find(s => s.id === id);
      if (skill && skill.prerequisites.length > 0 && !subjects.includes(skill)) subjects.push(skill);
    }
    if (subjects.length === 0) return null;

    const evaluated = subjects.map(skill => {
      // The chain is transitive; the readiness ratio is not. Intersecting it with
      // the skill's own prerequisites keeps the count and the ratio in agreement.
      const unmetChain = new Set(
        GapAnalysisService.computePrerequisiteChain(skill.id, SKILLS, masteries)
      );
      const unmet = skill.prerequisites.filter(id => unmetChain.has(id));
      const total = skill.prerequisites.length;
      return {
        skill,
        total,
        met: total - unmet.length,
        readiness: GapAnalysisService.computePrerequisiteReadiness(skill.id, SKILLS, masteries),
        unmetNames: unmet
          .map(id => SKILLS.find(s => s.id === id)?.name)
          .filter((name): name is string => Boolean(name)),
      };
    });

    return evaluated.find(e => e.unmetNames.length > 0) ?? evaluated[0];
  }, [moveSkillId, topGap, masteries]);

  // The state, in words. `riskLevel` is read off the same schedule quantity as the
  // withheld day counts, so it is only trusted when that quantity has real inputs;
  // otherwise the state falls back to one that needs no timeline maths at all.
  const healthState = useMemo(() => {
    if (totalCount > 0 && completedCount === totalCount) {
      return { label: 'Path complete', color: 'var(--accent-green)' };
    }
    // "Not started" has to mean nothing has been touched — not merely nothing
    // finished — or it contradicts the Continue button directly above it.
    if (completedCount === 0 && inProgressCount === 0) {
      return { label: 'Not started', color: 'var(--text-secondary)' };
    }
    if (!pathHealth || !hasScheduleEvidence) {
      return { label: 'In progress', color: 'var(--accent-cyan)' };
    }
    if (pathHealth.riskLevel === 'low') return { label: 'On track', color: 'var(--accent-green)' };
    if (pathHealth.riskLevel === 'medium') return { label: 'Needs attention', color: 'var(--accent-amber)' };
    return { label: 'Off track', color: 'var(--accent-rose)' };
  }, [pathHealth, hasScheduleEvidence, completedCount, inProgressCount, totalCount]);

  const healthSignals = useMemo<HealthSignal[]>(() => {
    const rows: HealthSignal[] = [{
      label: 'Progress',
      value: `${completedCount} of ${totalCount} steps`,
      color: 'var(--text-primary)',
      ratio: totalCount > 0 ? completedCount / totalCount : 0,
      bar: 'var(--accent-cyan)',
      // Says why the count can read 0 while the state reads In progress.
      detail: [
        inProgressCount > 0 ? `${inProgressCount} underway` : null,
        lockedCount > 0 ? `${lockedCount} still locked behind earlier steps` : null,
      ].filter(Boolean).join(' · ') || undefined,
    }];

    if (requiredSkillsStatus) {
      rows.push({
        label: 'Skills at target',
        value: `${requiredSkillsStatus.met} of ${requiredSkillsStatus.total}`,
        color: 'var(--text-primary)',
        ratio: requiredSkillsStatus.met / requiredSkillsStatus.total,
        bar: 'var(--accent-violet-bright)',
        detail: topGap ? `highest priority: ${topGap.skill.name}` : 'every required skill is at level',
      });
    }

    if (prereqStatus) {
      const ready = prereqStatus.unmetNames.length === 0;
      rows.push({
        label: 'Prerequisites',
        value: `${prereqStatus.met} of ${prereqStatus.total} met`,
        color: ready ? 'var(--accent-green)' : 'var(--accent-amber)',
        ratio: prereqStatus.readiness,
        bar: ready ? 'var(--accent-green)' : 'var(--accent-amber)',
        detail: `for ${prereqStatus.skill.name}`,
      });
    }

    rows.push(
      pathHealth && hasScheduleEvidence && scheduleAdherence !== null
        ? {
          label: 'Pace',
          value: `${Math.round(scheduleAdherence * 100)}% of schedule`,
          color: pathHealth.riskLevel === 'low' ? 'var(--accent-green)' : 'var(--accent-amber)',
          ratio: scheduleAdherence,
          bar: pathHealth.riskLevel === 'low' ? 'var(--accent-green)' : 'var(--accent-amber)',
        }
        : {
          label: 'Pace',
          value: 'Not measured',
          color: 'var(--text-tertiary)',
          detail: goalTarget
            ? 'Complete a step to start tracking pace.'
            : 'Needs a target date to measure against.',
        }
    );

    return rows;
  }, [
    completedCount, totalCount, lockedCount, inProgressCount, requiredSkillsStatus,
    topGap, prereqStatus, pathHealth, hasScheduleEvidence, scheduleAdherence, goalTarget,
  ]);

  // ── Why this ───────────────────────────────────────────────────────────────
  // One sentence: the strongest true statement the live data supports, in order of
  // how load-bearing it is. Each branch quotes only values that exist — a required
  // skill with no mastery record is described as unrecorded, never scored — and
  // when none of them apply the line is omitted rather than padded.
  //
  // This is the page's argument for the move beside it, and it is set as the one
  // piece of large reading type on the page for exactly that reason. It replaces
  // the three-step chain that used to sit further down: that chain's first step
  // restated the health figures verbatim and its last step restated this move's
  // own heading and destination, so two thirds of it was the page talking to itself.
  const whyThis = useMemo<string | null>(() => {
    if (!nextMove) return null;

    if (prereqStatus && prereqStatus.unmetNames.length > 0) {
      const named = prereqStatus.unmetNames.slice(0, 2);
      const extra = prereqStatus.unmetNames.length - named.length;
      const names = extra > 0 ? `${formatList(named)} and ${extra} more` : formatList(named);
      const plural = prereqStatus.unmetNames.length > 1;
      // "not reached beginner level" is the service's own threshold, and it is the
      // only claim true of both an unrecorded skill and one recorded at novice.
      return `${prereqStatus.skill.name} rests on ${names}, which ${plural ? 'have' : 'has'} not reached beginner level yet — `
        + `${plural ? 'those are' : 'that is'} what this stage actually depends on.`;
    }

    if (topGap) {
      const tracked = masteries.some(m => m.skillId === topGap.skill.id);
      const standing = tracked
        ? `${skillLevelLabel(topGap.currentLevel)} now against ${skillLevelLabel(topGap.requiredLevel)} required`
        : `nothing recorded yet against ${skillLevelLabel(topGap.requiredLevel)} required`;
      const lead = nextMove.continuing
        ? `${nextMove.title} is already underway, so that is where Nexus keeps you`
        : `${nextMove.title} is the step that moves it`;
      // "Highest-priority", not "widest": several gaps can be equally wide, and the
      // service breaks that tie on hours-to-close, not size.
      return `${topGap.skill.name} is the highest-priority gap between you and ${headline} — ${standing} — and ${lead}.`;
    }

    if (requiredSkillsStatus && requiredSkillsStatus.met === requiredSkillsStatus.total) {
      return `Every required skill for ${headline} is at its target level, so what is left is finishing the path itself.`;
    }

    return null;
  }, [nextMove, prereqStatus, topGap, requiredSkillsStatus, masteries, headline]);

  // ── Your path ──────────────────────────────────────────────────────────────
  // The whole path, grouped into stages, with live statuses. Every value here
  // comes from `livePath` — that is JourneyProgressContext's status map merged
  // over the seed structure, the same merge /journey performs — so there is one
  // source of node state on this page and no local copy of it.
  const pathStages = useMemo<PathStage[]>(() => {
    const ordered = [...livePath.nodes].sort((a, b) => a.order - b.order);
    if (ordered.length === 0) return [];

    const withCounts = (stage: Omit<PathStage, 'done'>): PathStage => ({
      ...stage,
      done: stage.nodes.filter(n => n.status === 'completed').length,
    });

    // Boundaries are resolved against the live path; one whose node is gone is
    // dropped rather than left to claim nodes that are no longer behind it.
    const boundaries = PATH_STAGES
      .map(stage => ({ ...stage, at: ordered.findIndex(n => n.id === stage.startsAt) }))
      .filter(stage => stage.at >= 0)
      .sort((a, b) => a.at - b.at);

    // With no boundary left, the path is shown as one unlabelled progression
    // rather than under a stage name that no longer describes what is in it.
    if (boundaries.length === 0) {
      return [withCounts({ key: 'path', number: '', label: '', color: 'var(--text-muted)', nodes: ordered })];
    }

    const buckets = boundaries.map(boundary => ({ ...boundary, nodes: [] as PathNode[] }));
    ordered.forEach((node, i) => {
      // Anything ahead of the first boundary joins the first stage: the grouping
      // has to account for every node, not only the ones a boundary precedes.
      let target = 0;
      for (let b = 0; b < buckets.length; b += 1) if (buckets[b].at <= i) target = b;
      buckets[target].nodes.push(node);
    });

    return buckets
      .filter(bucket => bucket.nodes.length > 0)
      .map((bucket, i) => withCounts({
        key: bucket.startsAt,
        number: String(i + 1).padStart(2, '0'),
        label: bucket.label,
        // The same three-way rule /journey colours its stage headings with.
        color: bucket.nodes.every(n => n.status === 'completed')
          ? 'var(--accent-green)'
          : bucket.nodes.some(n => n.status === 'in_progress')
            ? 'var(--accent-violet-bright)'
            : 'var(--text-muted)',
        nodes: bucket.nodes,
      }));
  }, [livePath]);

  // The current step is the one the recommendation above already picked. The path
  // marks that node; it does not rank a step of its own.
  const currentNodeId = nextMove?.nodeId ?? null;

  // ── Motion ─────────────────────────────────────────────────────────────────
  // Two regimes, and the fold decides which. The masthead and the brief are
  // already on screen at load, so they settle once on mount and then never move
  // again. Everything below the fold arrives on scroll, `once`, because a band
  // that had already finished animating before it was ever seen would have
  // animated for nobody. Under reduced motion every step is instant and the
  // items start at their final position, so nothing translates at all.
  const heroGroup: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.07 } },
  };
  const heroItem: Variants = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };
  /** The below-the-fold entrance, applied per band. */
  const band = {
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    // The shell already centres the canvas at max-w-7xl and pads it, so the page
    // sets no measure of its own — a second max-width here would only be able to
    // disagree with the first.
    <div>

      {/* ── 1 · Masthead ───────────────────────────────────────────────────── */}
      {/* The header sits directly on the dark room — no sheet behind it, so the
          shell's atmosphere stays visible straight through and the display face
          carries the whole composition. The measure stops well short of the
          canvas so the upper right stays open air, which is where the eye
          travels on its way down. */}
      <motion.section
        className="mb-12 lg:mb-16"
        variants={heroGroup}
        initial="hidden"
        animate="show"
      >
        {/* The page's slug, and beside it the one line addressed to a person
            rather than to their data. The greeting is small on purpose: one that
            competed with the role would be sentiment pretending to be
            information. */}
        <motion.div variants={heroItem} className="flex items-baseline justify-between gap-4">
          <span className="k-slug">Dashboard</span>
          <span className="k-label truncate" style={{ color: 'var(--text-secondary)' }}>
            {greeting}
            {firstName && <>, {firstName}</>}
          </span>
        </motion.div>

        {/* The role is the largest thing on the page, and the only thing at full
            --text-primary against the near-black room. The lead-in sits above it
            inside the same heading so the two read as one sentence. */}
        <motion.h1 variants={heroItem} className="mt-6 break-words text-balance">
          {headlineLead && (
            <span className="k-label block mb-3.5" style={{ color: 'var(--text-secondary)' }}>
              {headlineLead}
            </span>
          )}
          {/* The measure has to sit on this span, not the heading: `ch` resolves
              against the element's own font-size, and on the heading it would
              resolve at the inherited 16px — a measure narrow enough to break a
              60px word in half. */}
          <span className="k-display block" style={{ maxWidth: '17ch' }}>
            {headlineStem && <>{headlineStem} </>}
            <span className="k-highlight">{headlineTail}</span>
          </span>
        </motion.h1>

        {supportingLine && (
          <motion.p variants={heroItem} className="nx-support mt-6" style={{ maxWidth: '50ch' }}>
            {supportingLine}
          </motion.p>
        )}

        <motion.div variants={heroItem} className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/journey" className="k-btn k-btn-solid">
            Open journey <ChevronRight size={15} aria-hidden="true" />
          </Link>
          <Link href="/skills" className="k-btn k-btn-outline">
            Skill map
          </Link>
        </motion.div>

        {/* Vitals strip. One sheet of stock cut into cells by hard rules —
            progress as the lead figure and the stored learner values beside it,
            the dominant number and the supporting ones in one horizontal move
            rather than a stat row and a progress bar competing as two focal
            points. Progress comes from JourneyProgressContext, which is the only
            source, and this is the only percentage on the page. */}
        <motion.div variants={heroItem} className="k-paper k-panel overflow-hidden mt-10 lg:mt-12">
          <dl className="flex flex-wrap" style={LATTICE}>
            <Figure
              label="Journey progress"
              value={`${journeyProgress}%`}
              size={34}
              className="flex-[1.4] min-w-[13rem] p-5"
              style={CELL_RULE}
            >
              <div className="k-meter mt-4">
                <motion.div
                  className="k-meter-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${journeyProgress}%` }}
                  transition={{ duration: reduceMotion ? 0 : 1.2, delay: reduceMotion ? 0 : 0.3, ease: 'easeOut' }}
                />
              </div>
              <p className="k-label mt-3">
                {completedCount} of {totalCount} steps
              </p>
            </Figure>

            {vitals.map(vital => (
              <Figure
                key={vital.label}
                label={vital.label}
                value={vital.value}
                color={vital.color ?? 'var(--text-primary)'}
                size={22}
                hint={vital.hint}
                className="flex-1 min-w-[8.5rem] p-5"
                style={CELL_RULE}
              />
            ))}
          </dl>
        </motion.div>
      </motion.section>

      {/* ── 2 · The brief ──────────────────────────────────────────────────── */}
      {/* What to do, and why, on one sheet — the page's primary object, and the
          only one carrying the amber offset block. The action reads down the
          wider column in the order a person would ask for it — what, why now,
          what it costs, where it goes — and the argument for it sits beside that
          in a recess, so the two are one statement rather than two cards. */}
      <section className="mb-12 lg:mb-16">
        <BandHead
          label="Next best move"
          trailing={
            moveTarget && moveTarget.href !== '/journey'
              ? <BandLink href="/journey" label="View journey" />
              : undefined
          }
        />

        <motion.div className="k-paper k-panel-hero p-5 sm:p-7 mt-6" {...band}>
          <div className="grid lg:grid-cols-12 gap-7 lg:gap-9 items-start">
            <div className="lg:col-span-7 min-w-0">
              {nextMove && moveTarget ? (
                <>
                  {/* WHAT TO DO. The step's own title — the largest type on the
                      sheet, and nothing here competes with it. */}
                  <h2 className="k-display-sm break-words text-balance">
                    {nextMove.title}
                  </h2>

                  {/* WHY NOW. The node's committed rationale, quoted, never generated. */}
                  <p className="nx-support mt-4" style={{ maxWidth: '54ch' }}>
                    {nextMove.reason}
                  </p>

                  {/* WHERE IT LEADS. Position on the live path and the skills it moves. */}
                  {moveContext && (
                    <p
                      className="text-xs mt-3"
                      style={{ color: 'var(--text-tertiary)', lineHeight: 1.7, maxWidth: '54ch' }}
                    >
                      {moveContext}
                    </p>
                  )}

                  {/* WHAT IT COSTS. The same label-over-figure idiom as the vitals
                      strip, set smaller. Wraps to two rows on a phone. */}
                  {moveMetrics.length > 0 && (
                    <dl className="flex flex-wrap items-start gap-x-9 gap-y-5 mt-8">
                      {moveMetrics.map(metric => (
                        <Figure
                          key={metric.label}
                          label={metric.label}
                          value={metric.value}
                          size={17}
                          hint={metric.hint}
                        />
                      ))}
                    </dl>
                  )}

                  {/* The one thing to act on, and the only ink-filled control on
                      the page. The offset block under it and the press that
                      translates onto that block are the depth — the button stays
                      a plain anchor so the router and the keyboard both keep it. */}
                  <div className="mt-9">
                    <Link href={moveTarget.href} className="k-btn k-btn-solid">
                      {moveTarget.label} <ChevronRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </>
              ) : (
                <EmptyState size="sm" {...emptyMove} />
              )}
            </div>

            {/* The argument. A quotation of the page's own reasoning, set at
                reading size against everything else's label size — the one
                moment where the page stops reporting and says something. A recess
                in the same sheet rather than a second panel, so it reads as an
                aside to the move and not as a rival to it. */}
            {whyThis && (
              <aside className="lg:col-span-5 min-w-0 k-well p-4 sm:p-5">
                <span className="k-label">Why this</span>
                <p
                  className="mt-3"
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'clamp(0.9375rem, 0.86rem + 0.3vw, 1.0625rem)',
                    lineHeight: 1.62,
                    letterSpacing: '-0.011em',
                    maxWidth: '42ch',
                  }}
                >
                  {whyThis}
                </p>
              </aside>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── 3 · Skill universe ─────────────────────────────────────────────── */}
      {/* The map is the object; the sheet beside it is its caption. The map is the
          one thing on the page that has to stay on the dark room — it is a lit
          object, and its violet and cyan nodes have nothing to read against on
          cream — so it is ruled like a plate rather than laid on stock. The words
          hold the narrow column on the left, the map takes the wider one on the
          right at its own fixed height. Reading order is the same at every width:
          what this is, then the map, then whatever is selected in it — so a
          selection made from the map's own list is answered after it, not before. */}
      <section className="mb-12 lg:mb-16">
        <BandHead label="Skill universe" trailing={<BandLink href="/skills" label="Open" />} />

        {/* Two rows at lg — the caption sheet on the first, the selection sheet
            under it on the second — with the map spanning both on the right.
            `1fr` on the second row keeps the caption tight to its own content, so
            the selection sits directly beneath it instead of drifting down beside
            the map. Below lg the three blocks simply stack in source order. The
            map takes eight columns rather than seven: it is the page's one object,
            and the extra width is also what keeps its node labels from meeting in
            the middle. */}
        <div className="grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] gap-5 lg:gap-6 items-start pt-6">

          {/* What this is, and the key to it — one sheet. The caption and the
              legend read the same map, so they are not two boxes. */}
          <motion.div
            className="lg:col-span-4 lg:col-start-1 lg:row-start-1 min-w-0 k-paper k-panel p-5"
            {...band}
          >
            <h2 className="k-display-sm">{universeHeading}</h2>

            {/* Only what is true of the map: colour is the mastery bucket, node
                size is the skill's demand score, and the threads are the
                prerequisite and related edges. Position is a Fibonacci
                distribution — even, not meaningful — so it is not described. */}
            <p className="nx-support mt-4" style={{ maxWidth: '40ch' }}>
              Every skill in the curriculum on one surface. Colour is your measured
              mastery, size is market demand, and the threads are prerequisites.
            </p>
            {mapHint && (
              <p className="text-xs mt-2.5" style={{ color: 'var(--text-tertiary)', lineHeight: 1.7, maxWidth: '40ch' }}>
                {mapHint}
              </p>
            )}

            <div className="k-rule-thin mt-5" aria-hidden="true" />

            {/* The count, and then the key to it. The caption above claims colour
                means mastery, so the colours are shown rather than only named —
                and because the counts are read off the very buckets the map
                colours, this is a reading of the map, not a second opinion. */}
            <p className="k-label mt-5">{sphereSkills.length} skills mapped</p>
            {skillCounts.length > 0 && (
              <ul className="flex flex-wrap gap-x-5 gap-y-2.5 mt-3.5">
                {skillCounts.map(entry => (
                  <li key={entry.label} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 flex-shrink-0"
                      style={{ background: entry.color, border: '1px solid var(--k-edge)' }}
                      aria-hidden="true"
                    />
                    <span className="k-figure text-xs">{entry.count}</span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {entry.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}

          </motion.div>

          {/* The map */}
          {/* Height is reserved here in CSS at both breakpoints, mirroring
              SPHERE_HEIGHT_COMPACT / SPHERE_HEIGHT_WIDE, so the box is already
              the right size before the WebGL chunk arrives. The rule sits on the
              wrapper outside that box so the reserved height still matches the
              sphere's own `height` prop exactly. Deliberately not wrapped in
              motion: the sphere runs its own entrance, and a parent transform on
              a canvas is a repaint for nothing. */}
          <div className="lg:col-span-8 lg:col-start-5 lg:row-start-1 lg:row-span-2 min-w-0">
            {/* .k-room because the sphere draws cream lines and amber light on
                transparency — it is a photograph of a dark room, not a diagram
                that can be re-inked, so it keeps its own night in either theme
                rather than inheriting the page's surface. */}
            <div className="k-room k-panel-flat">
              <div className="overflow-hidden h-[320px] lg:h-[460px]">
                <LearningSphere
                  skills={sphereSkills}
                  connections={sphereConnections}
                  selectedSkillId={selectedSkillId}
                  recommendedSkillIds={recommendedSkillIds}
                  goalSkillId={goalSkillId}
                  onSkillSelect={setSelectedSkillId}
                  height={sphereHeight}
                />
              </div>
            </div>
          </div>

          {/* What is selected in it */}
          {/* Selecting a node is a question asked of the page, and this is where
              the page answers — the skill's name, its level and its score, and
              nothing that had to be invented to fill the space. Its own sheet,
              because it is a readout that responds to the map rather than another
              line of the caption. */}
          <div className="lg:col-span-4 lg:col-start-1 lg:row-start-2 min-w-0 k-paper k-panel p-5">
            <span className="k-label">Selected skill</span>

            {selectedSkill ? (
              <>
                {/* Name and figure sit together rather than at opposite edges —
                    there is only ever one row here, so nothing needs a column to
                    line up with, and a wide gap between the two would read as a
                    table that lost its other rows. */}
                <div className="flex items-baseline gap-3 mt-3 min-w-0">
                  <span
                    className="text-[15px] font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {selectedSkill.name}
                  </span>
                  {selectedMastery && (
                    <span className="k-figure text-[15px] flex-shrink-0">
                      {selectedMastery.score}%
                    </span>
                  )}
                </div>

                {selectedMastery ? (
                  <span
                    className="k-badge k-badge-quiet mt-3"
                    style={{ color: skillLevelColor(selectedMastery.level) }}
                  >
                    {skillLevelLabel(selectedMastery.level)}
                  </span>
                ) : (
                  <p className="text-xs mt-2.5" style={{ color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
                    Nothing recorded yet, so there is no mastery to show.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
                Select a skill to inspect it.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── 4 · Path health ───────────────────────────────────────────────── */}
      {/* Four readings across, not down. The bands above and below both read as
          columns, so this one runs horizontally: it is the page's one instrument
          panel, and a change of rhythm is what keeps six bands from reading as
          one long ruled document. */}
      <section className="mb-12 lg:mb-16">
        <BandHead
          label="Path health"
          trailing={
            <span className="k-badge k-badge-quiet" style={{ color: healthState.color }}>
              {healthState.label}
            </span>
          }
        />

        {/* One instrument panel cut into cells, not four cards: the readings are
            meant to be compared across, and a shared rule is what says so. */}
        <motion.div className="k-paper k-panel overflow-hidden mt-6" {...band}>
          <dl className="flex flex-wrap" style={LATTICE}>
            {healthSignals.map((signal, i) => (
              <Figure
                key={signal.label}
                label={signal.label}
                value={signal.value}
                color={signal.color}
                size={18}
                className="flex-1 min-w-[13rem] p-5"
                style={CELL_RULE}
              >
                {signal.ratio !== undefined && (
                  <div className="k-meter mt-4">
                    <motion.div
                      className="k-meter-fill"
                      style={{ background: signal.bar ?? 'var(--text-tertiary)' }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.round(signal.ratio * 100)}%` }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.9,
                        delay: reduceMotion ? 0 : i * 0.07,
                        ease: 'easeOut',
                      }}
                    />
                  </div>
                )}
                {signal.detail && (
                  <p
                    className="text-[11px] mt-3"
                    style={{ color: 'var(--text-tertiary)', lineHeight: 1.6 }}
                  >
                    {signal.detail}
                  </p>
                )}
              </Figure>
            ))}
          </dl>
        </motion.div>
      </section>

      {/* ── 5 · Your path ─────────────────────────────────────────────────── */}
      {/* Where the learner is, across the whole path. /journey owns the detail —
          every node's resources, its modals, its unlock rules. This is the
          overview that page can't be: three stages side by side, a thread of
          statuses down each one, and the recommended step named on it. */}
      {pathStages.length > 0 && (
        <section className="mb-12 lg:mb-16">
          <BandHead label="Your path" trailing={<BandLink href="/journey" label="Full journey" />} />

          {/* One sheet, cut into a column per stage. Three sheets side by side
              would read as three paths; one ruled sheet reads as one path in
              three stages, which is what it is. */}
          <motion.div className="k-paper k-panel overflow-hidden mt-6" {...band}>
            <div className="flex flex-wrap" style={LATTICE}>
              {pathStages.map(stage => (
                <div key={stage.key} className="flex-1 min-w-[15rem] p-5" style={CELL_RULE}>
                  {stage.label && (
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex items-baseline gap-2.5 min-w-0">
                        <span className="k-figure text-[13px]" style={{ color: 'var(--text-muted)' }}>
                          {stage.number}
                        </span>
                        <span className="k-label truncate" style={{ color: stage.color }}>
                          {stage.label}
                        </span>
                      </span>
                      {/* Each column reports itself, so the eye can compare stages
                          without counting markers. */}
                      <span
                        className="k-figure text-[12px] flex-shrink-0"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {stage.done}/{stage.nodes.length}
                      </span>
                    </div>
                  )}

                  <div className="k-rule-thin mt-4 mb-5" aria-hidden="true" />

                  <ol>
                    {stage.nodes.map((node, i) => {
                      const status = NODE_STATUS[node.status] ?? UNKNOWN_STATUS;
                      const isCurrent = node.id === currentNodeId;
                      const isLast = i === stage.nodes.length - 1;
                      // The recommended step's marker is 10px so its amber block
                      // reads as a block; the inset keeps every marker's centre on
                      // the thread at (4, 9) whichever size it is.
                      const markerSize = isCurrent ? 10 : 8;
                      const markerInset = isCurrent ? -1 : 0;
                      return (
                        <li key={node.id} className={`relative pl-5 ${isLast ? '' : 'pb-5'}`}>
                          {/* The thread joins one marker to the next, centre to
                              centre: the 8px square sits at left 0 / top 5, so its
                              centre is at x 4, y 9, and the segment below it
                              reaches 9px into the following row. Drawn rather than
                              bordered on the row, so it neither overshoots above
                              the first step nor stops short of the last. */}
                          {!isLast && (
                            <span
                              aria-hidden
                              className="absolute"
                              style={{
                                left: 3,
                                top: 9,
                                bottom: -9,
                                width: 2,
                                background: node.status === 'completed'
                                  ? 'var(--accent-green)'
                                  : 'var(--border-default)',
                              }}
                            />
                          )}
                          {/* Square markers: solid for what has been reached,
                              hollow for what has not. The recommended step is the
                              one amber block in the thread, so it and the brief
                              above name one step. */}
                          <span
                            aria-hidden
                            className="absolute"
                            style={{
                              left: markerInset,
                              top: markerInset + 5,
                              width: markerSize,
                              height: markerSize,
                              background: isCurrent
                                ? 'var(--amber)'
                                : status.filled ? status.accent : 'var(--bg-base)',
                              border: isCurrent
                                ? '2px solid var(--k-edge)'
                                : status.filled ? undefined : `2px solid ${status.accent}`,
                            }}
                          />
                          <div
                            className="text-[13px]"
                            style={{
                              color: status.title,
                              fontWeight: isCurrent ? 600 : status.weight,
                              lineHeight: 1.45,
                            }}
                          >
                            {node.title}
                          </div>
                          {/* The status in words as well as in colour, and — on the
                              one step the recommendation picked — the name of the
                              band that picked it, so the two read as one thing. */}
                          <div
                            className="k-label mt-1.5"
                            style={isCurrent ? { color: 'var(--accent-amber)' } : undefined}
                          >
                            {isCurrent ? `${status.label} · next best move` : status.label}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── 6 · Rhythm and record ─────────────────────────────────────────── */}
      {/* The page closes on what has already happened rather than on another
          instruction: the shape of the weeks on the left, the timestamped record
          on the right. Both sides are dropped rather than left holding an empty
          column, so a learner on day one gets the coda and nothing else. */}
      {(chartData.length > 0 || activity.length > 0) && (
        <section>
          <div className="grid lg:grid-cols-12 gap-5 lg:gap-6 items-start">

            {chartData.length > 0 && (
              <motion.div
                className={`${activity.length > 0 ? 'lg:col-span-7' : 'lg:col-span-8'} min-w-0`}
                {...band}
              >
                <BandHead
                  label="Learning rhythm"
                  trailing={
                    <span className="k-figure text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      {formatHours(totalChartHours)} over {chartData.length} weeks
                    </span>
                  }
                />
                <div className="k-paper k-panel p-5 mt-6">
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
                    Hours a week, oldest to most recent.
                  </p>
                  {/* Both axes are hidden. A 9px tick scale on a 100px chart was
                      reading as instrumentation rather than as a shape, and the
                      only figure anyone actually wants off this is a single week's
                      hours — which the tooltip gives, under a label a person would
                      say out loud. `hide` still leaves the axis in the chart, so
                      the tooltip keeps its week name and the domain keeps its
                      headroom above the peak.

                      The shape itself is printed: flat amber under a hard ink
                      line, straight segments rather than a spline, no gradient. */}
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={chartData} margin={{ top: 6, right: 2, bottom: 0, left: 2 }}>
                        <XAxis dataKey="week" hide />
                        <YAxis hide domain={[0, 'dataMax + 2']} />
                        <Tooltip
                          cursor={{ stroke: 'var(--ink)', strokeWidth: 1 }}
                          contentStyle={{
                            background: 'var(--paper-raised)',
                            border: '2px solid var(--ink)',
                            borderRadius: 0,
                            color: 'var(--ink)',
                            fontSize: '12px',
                            boxShadow: '2px 2px 0 0 var(--ink)',
                          }}
                          itemStyle={{ color: 'var(--ink)' }}
                          labelStyle={{ color: 'var(--ink-3)', marginBottom: 2 }}
                        />
                        <Area
                          name="Hours"
                          type="linear"
                          dataKey="hours"
                          stroke="var(--ink)"
                          strokeWidth={2}
                          fill="var(--amber)"
                          fillOpacity={0.55}
                          dot={false}
                          activeDot={{ r: 4, fill: 'var(--amber)', stroke: 'var(--ink)', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activity.length > 0 && (
              <motion.div
                className={`${chartData.length > 0 ? 'lg:col-span-5' : 'lg:col-span-8'} min-w-0`}
                {...band}
                transition={{ ...band.transition, delay: reduceMotion ? 0 : 0.1 }}
              >
                <BandHead label="Recent" />
                <div className="k-paper k-panel p-5 mt-6">
                  <ul className="space-y-4">
                    {activity.map(entry => (
                      <li key={entry.id} className="flex items-start gap-3">
                        <span
                          className="w-2 h-2 flex-shrink-0"
                          style={{
                            background: entry.color,
                            border: '1px solid var(--k-edge)',
                            marginTop: 5,
                          }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="text-[13px] truncate" style={{ color: 'var(--text-primary)' }}>
                            {entry.title}
                          </div>
                          <div
                            className="nx-numeric text-[11px] mt-1"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            {entry.detail} · {formatDayMonthYear(entry.at)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ── Coda ──────────────────────────────────────────────────────────── */}
      {/* The page's one statement about itself. It earns its place by being true
          of the code above it: every figure here is read from a live store, and
          every section on this page has a branch that says so when the store is
          empty rather than printing a zero. */}
      <div className="mt-16 lg:mt-24">
        <div className="k-rule-thin" aria-hidden="true" />
        <p
          className="text-[11px] pt-6"
          style={{ color: 'var(--text-tertiary)', lineHeight: 1.85, maxWidth: '58ch' }}
        >
          Every number here is read from your own record — your assessments, your path,
          your goal. Where Nexus doesn&apos;t know something yet, it says so instead of
          filling the space.
        </p>
      </div>
    </div>
  );
}

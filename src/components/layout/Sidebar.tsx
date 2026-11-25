'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Home, Map, Sparkles, FolderOpen, ClipboardCheck,
  MessageSquare, Dna, Briefcase, Award, Settings, UserCircle,
  ChevronLeft, ChevronRight, X, Menu, Flame,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DEMO_LEARNER_CONTEXT } from '@/lib/data/seed';
import { getXPProgress, formatXP } from '@/lib/utils';
import { useJourneyProgress } from '@/lib/context/JourneyProgressContext';
import { useOnboarding } from '@/lib/context/OnboardingContext';
import { useSidebar } from './SidebarContext';
import { Tooltip } from '@/components/ui/Tooltip';

const SIDEBAR_EXPANDED = 220;
const SIDEBAR_COLLAPSED = 60;

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/journey', label: 'My Journey', icon: Map },
  { href: '/skills', label: 'Skill Universe', icon: Sparkles },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/assessments', label: 'Assessments', icon: ClipboardCheck },
  { href: '/tutor', label: 'AI Tutor', icon: MessageSquare, badge: true },
  { href: '/genome', label: 'Learning Genome', icon: Dna },
  { href: '/career', label: 'Career', icon: Briefcase },
  { href: '/passport', label: 'Skill Passport', icon: Award },
];

interface NavItemData {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
}

function NavItem({
  item,
  isActive,
  isCollapsed,
  onClick,
}: {
  item: NavItemData;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const prefersReducedMotion = useReducedMotion();

  const inner = (
    <Link href={item.href} onClick={onClick}>
      <motion.div
        className="relative flex items-center gap-2.5 px-3 py-2 cursor-pointer group/nav"
        style={{
          // The active item's surface is the shared layout element below, not
          // this background — otherwise the two would cross-fade against each
          // other while the marker is travelling between items.
          //
          // --frame-hover-off, not `transparent`: this is the resting end of
          // the hover animation below, and Motion cannot tween out of a
          // keyword. Both are invisible; only one can be animated from.
          background: 'var(--frame-hover-off)',
          color: isActive ? 'var(--ink)' : 'var(--text-secondary)',
          justifyContent: isCollapsed ? 'center' : undefined,
        }}
        whileHover={
          isActive
            ? { color: 'var(--ink)' }
            : { background: 'var(--frame-hover)', color: 'var(--text-primary)' }
        }
        transition={{ duration: 0.15 }}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && (
          <motion.span
            layoutId="sidebar-active-indicator"
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              // A printed amber block, not a lit wash: the marker is the one
              // solid area of accent in the rail, so it carries ink type rather
              // than a coloured edge.
              background: 'var(--amber)',
              border: '2px solid var(--k-edge)',
            }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 460, damping: 36 }
            }
          />
        )}
        {/* The marker is absolutely positioned and therefore paints after the
            in-flow icon and label; both are promoted so they stay in front of
            it rather than behind. */}
        <Icon size={15} className="relative flex-shrink-0" />
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span
              className="relative text-[11px] uppercase whitespace-nowrap overflow-hidden"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {item.badge && !isCollapsed && (
          <div
            className="relative ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: isActive ? 'var(--ink)' : 'var(--accent-green)' }}
          />
        )}
      </motion.div>
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={item.label} side="right">
        {inner}
      </Tooltip>
    );
  }

  return inner;
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, isMobile, toggle, closeMobile } = useSidebar();
  const { progressPercent } = useJourneyProgress();
  const { learnerContext } = useOnboarding();
  const prefersReducedMotion = useReducedMotion();

  const isExpanded = isMobile ? mobileOpen : !collapsed;
  const sidebarWidth = isExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  // Deliberately the same two lines the pages use — learner context if
  // onboarding has run, demo context before that, then role over goal title —
  // so the rail cannot name the goal differently from the page beside it.
  // `learnerContext` is null until an effect reads localStorage, so the first
  // client render matches the server's.
  const liveContext = learnerContext ?? DEMO_LEARNER_CONTEXT;
  const goal = liveContext.goal;

  // ── Learner metadata ───────────────────────────────────────────────────────
  // The same context the pages read, so the rail cannot claim a different level
  // or streak from the hero beside it. Previously these three lines came from the
  // seed's `CURRENT_USER` / `USER_PROGRESS` directly, which left an onboarded
  // learner reading "Level 12 · 23-day streak" next to a hero saying "Level 1".
  //
  // Everything below arrives via localStorage, which is user-editable, so a value
  // that is not a usable number is treated as absent rather than propagated into
  // arithmetic — a NaN would reach the bar as `width: "NaN%"`.
  const asCount = (value: number): number =>
    typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

  const userName = liveContext.user.name.trim() || 'Learner';
  const userInitial = userName.charAt(0).toUpperCase();
  const level = asCount(liveContext.progress.level);
  const streakDays = asCount(liveContext.user.streakDays);

  // The bar measures progress *within* the current level, so it needs XP to
  // measure — at zero there is no band to fill and no figure worth a row, which
  // is the same rule the hero applies to its own XP entry. Home shows the
  // lifetime total; this shows how far through the level that total is. One
  // field, two readings, and now one source.
  const totalXP = asCount(liveContext.progress.totalXP);
  const xpProgress = totalXP > 0 ? getXPProgress(totalXP) : null;
  const goalLabel = liveContext.profile.targetRole || goal.title;
  // The date is typed as a Date but arrives via localStorage, where only values
  // that still look like ISO strings get revived — anything else reaches here as
  // a string, and calling a Date method on it would take the whole frame down
  // rather than just this line.
  const targetDate =
    goal.targetDate instanceof Date && !Number.isNaN(goal.targetDate.getTime())
      ? goal.targetDate
      : null;
  const targetDateStr = targetDate
    ? targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'No target date';

  // Progress is read from the journey, which is the only thing that actually
  // advances it. `ACTIVE_GOAL.progressPercent` is a frozen 31 in the seed and
  // would sit in the rail contradicting the step count on the page.
  const goalProgress = progressPercent;
  const transitionDuration = prefersReducedMotion ? 0 : 0.25;

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            className="fixed inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={closeMobile}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="fixed left-0 top-0 h-screen flex flex-col z-40 overflow-hidden"
        animate={{
          width: sidebarWidth,
          x: isMobile && !mobileOpen ? -SIDEBAR_EXPANDED : 0,
        }}
        transition={{ duration: transitionDuration, ease: [0.4, 0, 0.2, 1] }}
        style={{
          // Deeper than the canvas, so the separation comes from the rail
          // receding rather than from a lighter panel sitting on top. The edge
          // is a hard 2px rule instead of a lit hairline — the rail is a cut
          // block, and nothing in this language fades.
          background: 'var(--frame-rail)',
          borderRight: '2px solid var(--k-edge)',
        }}
        aria-label="Primary navigation"
      >
        {/* Logo row */}
        <div
          className="flex items-center px-3 pt-5 pb-4 flex-shrink-0"
          style={{
            justifyContent: isExpanded ? 'space-between' : 'center',
            gap: isExpanded ? undefined : 0,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* The wordmark is a printed block: the initial set in the display
                face on a solid amber square, which is the same object the active
                nav marker is — the rail has one accent colour and two uses
                for it. */}
            <div className="k-mark" style={{ width: 32, height: 32, fontSize: 15 }} aria-hidden="true">
              N
            </div>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div
                    className="text-sm whitespace-nowrap uppercase"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.16em',
                    }}
                  >
                    NEXUS
                  </div>
                  {/* Kept in title case rather than promoted to the tracked
                      uppercase label: uppercase with label tracking, this string
                      is wider than the 220px rail leaves for it. */}
                  <div
                    className="text-[11px] whitespace-nowrap mt-px"
                    style={{ color: 'var(--text-muted)', letterSpacing: '0.02em' }}
                  >
                    Learning Intelligence
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse / close button */}
          {isMobile ? (
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeMobile}
                  className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'var(--frame-well)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--k-edge)',
                  }}
                  aria-label="Close navigation"
                >
                  <X size={12} />
                </motion.button>
              )}
            </AnimatePresence>
          ) : (
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={toggle}
                  className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'var(--frame-well)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--k-edge)',
                  }}
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft size={12} />
                </motion.button>
              )}
            </AnimatePresence>
          )}

          {/* Expand button when fully collapsed */}
          {!isMobile && !isExpanded && (
            <Tooltip content="Expand sidebar" side="right">
              <button
                onClick={toggle}
                className="w-6 h-6 flex items-center justify-center"
                style={{
                  background: 'var(--frame-well)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--k-edge)',
                }}
                aria-label="Expand sidebar"
              >
                <ChevronRight size={12} />
              </button>
            </Tooltip>
          )}
        </div>

        {/* User card — expanded */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden px-3 mb-2"
            >
              <div
                className="p-3"
                style={{
                  background: 'var(--frame-well)',
                  border: '1px solid var(--k-edge)',
                }}
              >
                {/* The gap below belongs to whatever follows — with no XP and no
                    streak there is nothing to separate from. */}
                <div
                  className={`flex items-center gap-2.5${xpProgress || streakDays > 0 ? ' mb-3' : ''}`}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center text-sm flex-shrink-0"
                    style={{
                      background: 'var(--frame-rail)',
                      border: '2px solid var(--k-edge)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                    }}
                  >
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-xs font-semibold truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {userName}
                    </div>
                    {/* A learner always has a level — the line is dropped only if
                        a stored context somehow carries none. */}
                    {level > 0 && (
                      <div
                        className="text-[11px] uppercase"
                        style={{
                          color: 'var(--text-tertiary)',
                          fontFamily: 'var(--font-display)',
                          letterSpacing: '0.08em',
                        }}
                      >
                        Level {level} Learner
                      </div>
                    )}
                  </div>
                </div>

                {/* XP bar — only once there is XP to measure. */}
                {xpProgress && (
                  <div className="space-y-1.5">
                    <div
                      className="flex justify-between items-baseline text-[11px]"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <span className="k-label">XP</span>
                      <span className="k-figure text-[11px]">
                        {formatXP(xpProgress.current)} / {formatXP(xpProgress.required)}
                      </span>
                    </div>
                    {/* The meter primitive, but the fill is animated by motion —
                        so it must not also carry .k-meter-fill's CSS transition,
                        or the two would fight over the same property. */}
                    <div className="k-meter">
                      <motion.div
                        className="h-full"
                        style={{ background: 'var(--amber)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress.percent}%` }}
                        transition={{ duration: prefersReducedMotion ? 0 : 1, delay: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}

                {/* Streak — day one has none, and "0-day streak" is not a fact. */}
                {streakDays > 0 && (
                  <div className="mt-2.5 flex items-center gap-1.5">
                    {/* --accent-amber, not --amber: ink rather than a block, and
                        plain --amber is 1.8:1 against cream. */}
                    <Flame size={11} style={{ color: 'var(--accent-amber)' }} aria-hidden="true" />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--accent-amber)' }}>
                      {streakDays}-day streak
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar — collapsed only */}
        {!isExpanded && !isMobile && (
          <div className="px-3 mb-2 flex justify-center">
            <Tooltip content={userName} side="right">
              <div
                className="w-8 h-8 flex items-center justify-center text-sm"
                style={{
                  background: 'var(--frame-rail)',
                  border: '2px solid var(--k-edge)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                }}
              >
                {userInitial}
              </div>
            </Tooltip>
          </div>
        )}

        {/* Nav */}
        <nav
          className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              isCollapsed={!isExpanded}
              onClick={isMobile ? closeMobile : undefined}
            />
          ))}

          {/* Divider */}
          <div className="k-rule-thin my-1.5 mx-1" role="separator" />

          <NavItem
            item={{ href: '/onboarding', label: 'Setup Profile', icon: UserCircle }}
            isActive={pathname === '/onboarding'}
            isCollapsed={!isExpanded}
            onClick={isMobile ? closeMobile : undefined}
          />

          <NavItem
            item={{ href: '/settings', label: 'Settings', icon: Settings }}
            isActive={pathname === '/settings'}
            isCollapsed={!isExpanded}
            onClick={isMobile ? closeMobile : undefined}
          />
        </nav>

        {/* Goal progress footer */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="px-3 pb-4 overflow-hidden"
            >
              <div
                className="p-3"
                style={{
                  background: 'var(--frame-well)',
                  border: '1px solid var(--k-edge)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--accent-green)' }}
                    aria-hidden="true"
                  />
                  <span className="k-label">Goal</span>
                </div>
                <div
                  className="text-[11px] font-medium mb-2 truncate"
                  style={{ color: 'var(--text-secondary)' }}
                  title={goalLabel}
                >
                  {goalLabel}
                </div>
                {/* Same arrangement as the XP meter above: the primitive's track,
                    a motion-driven fill with no competing CSS transition. */}
                <div className="k-meter">
                  <motion.div
                    className="h-full"
                    style={{ background: 'var(--amber)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 1.2,
                      delay: prefersReducedMotion ? 0 : 0.8,
                      ease: 'easeOut',
                    }}
                  />
                </div>
                <div className="flex justify-between items-baseline mt-1.5">
                  {/* --accent-amber, not --amber: a figure is ink. */}
                  <span className="k-figure text-[11px]" style={{ color: 'var(--accent-amber)' }}>
                    {goalProgress}%
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {targetDateStr}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}

// Exported for use in TopBar (hamburger button)
export function MobileMenuButton() {
  const { openMobile } = useSidebar();
  return (
    <button
      onClick={openMobile}
      className="w-8 h-8 flex items-center justify-center"
      style={{
        background: 'var(--frame-well)',
        border: '2px solid var(--k-edge)',
        color: 'var(--text-secondary)',
      }}
      aria-label="Open navigation"
    >
      <Menu size={15} />
    </button>
  );
}

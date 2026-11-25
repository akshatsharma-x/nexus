'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Target } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { RECOMMENDATIONS, DEMO_LEARNER_CONTEXT } from '@/lib/data/seed';
import { useOnboarding } from '@/lib/context/OnboardingContext';
import { useSidebar } from './SidebarContext';
import { MobileMenuButton } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

const SIDEBAR_EXPANDED = 220;
const SIDEBAR_COLLAPSED = 60;

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Home', subtitle: 'Learning command center' },
  // The subtitle names the page, not the goal — the goal is read from the
  // learner's own context in the bar beside it, and naming a role here would
  // contradict it for anyone who onboarded to a different one.
  '/journey': { title: 'My Journey', subtitle: 'Your adaptive path' },
  '/skills': { title: 'Skill Universe', subtitle: 'Your knowledge graph' },
  '/projects': { title: 'Projects', subtitle: 'Build to learn' },
  '/assessments': { title: 'Assessments', subtitle: 'Measure your competency' },
  '/tutor': { title: 'AI Tutor', subtitle: 'Strategic learning advisor' },
  '/genome': { title: 'Learning Genome', subtitle: 'Your unique learning DNA' },
  '/career': { title: 'Career', subtitle: 'Navigate your trajectory' },
  '/passport': { title: 'Skill Passport', subtitle: 'Your skills, evidence & badges' },
  '/settings': { title: 'Settings', subtitle: 'Preferences' },
};

export function TopBar() {
  const pathname = usePathname();
  const { collapsed, isMobile } = useSidebar();
  const { learnerContext } = useOnboarding();
  const prefersReducedMotion = useReducedMotion();

  const page = PAGE_TITLES[pathname] ?? { title: 'NEXUS', subtitle: 'Learning Intelligence' };
  const unreadCount = RECOMMENDATIONS.filter(r => !r.dismissed).length;
  const sidebarWidth = isMobile ? 0 : collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const transitionDuration = prefersReducedMotion ? 0 : 0.25;

  // Same two lines as the rail and the pages: learner context if onboarding has
  // run, demo context before that, then role over goal title. `learnerContext`
  // is null until an effect reads localStorage, so the first client render
  // matches the server's.
  const liveContext = learnerContext ?? DEMO_LEARNER_CONTEXT;
  const goalLabel = liveContext.profile.targetRole || liveContext.goal.title;

  // The avatar names whoever the rail's card names. It used to read the seed's
  // `CURRENT_USER`, so an onboarded learner saw "Y" in the rail and "A" here.
  // Same empty-name fallback and same casing as the rail, so the two initials
  // cannot diverge for a name typed in lower case.
  const userName = liveContext.user.name.trim() || 'Learner';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <motion.header
      className="fixed top-0 right-0 h-14 z-30"
      animate={{ left: sidebarWidth }}
      transition={{ duration: transitionDuration, ease: [0.4, 0, 0.2, 1] }}
      style={{
        // A cut block of the same stock as the rail rather than a pane of glass
        // over the page: opaque, and closed by a hard 2px rule instead of a
        // blurred falloff. The bar and the rail now read as one frame.
        background: 'var(--frame-rail)',
        borderBottom: '2px solid var(--k-edge)',
      }}
      role="banner"
    >
      {/* The bar bleeds to the edges, but its contents share the canvas measure
          and padding below it — so the page title sits over the page's own left
          margin and the avatar over its right, instead of the two columns
          drifting apart as the viewport widens. */}
      <div className="mx-auto w-full max-w-7xl h-full flex items-center gap-3 px-5 lg:px-8">

        {/* Mobile hamburger */}
        {isMobile && (
          <div className="flex-shrink-0">
            <MobileMenuButton />
          </div>
        )}

        {/* Page title */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-[13px] uppercase leading-none truncate"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              letterSpacing: '0.12em',
            }}
          >
            {page.title}
          </h1>
          <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--text-tertiary)' }}>
            {page.subtitle}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search trigger */}
          <motion.button
            className="hidden sm:flex items-center gap-2 px-3 py-1.5"
            style={{
              background: 'var(--frame-well)',
              border: '2px solid var(--k-edge)',
              color: 'var(--text-secondary)',
            }}
            whileHover={{
              borderColor: 'var(--k-edge-strong)',
              color: 'var(--text-primary)',
            }}
            aria-label="Search (Cmd+K)"
          >
            <Search size={12} />
            <span className="k-label hidden md:inline" style={{ color: 'inherit' }}>
              Search
            </span>
            <span
              className="hidden md:inline ml-1 px-1.5 py-0.5 text-[11px]"
              style={{
                background: 'var(--frame-hover)',
                border: '1px solid var(--k-edge)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
              }}
            >
              ⌘K
            </span>
          </motion.button>

          {/* Active goal — context, not a control. There is one goal in the data
              model and nothing anywhere that switches it, so this reads the live
              goal and stops there rather than presenting a picker that could not
              pick. It carries no hover state for the same reason. */}
          <div
            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 max-w-[220px]"
            style={{
              background: 'var(--frame-well)',
              border: '1px solid var(--k-edge)',
            }}
          >
            {/* --accent-amber rather than --amber: amber here is ink, not a
                block, and plain --amber is 1.8:1 against cream. */}
            <Target size={11} style={{ color: 'var(--accent-amber)' }} aria-hidden="true" />
            <span className="k-label flex-shrink-0">Goal</span>
            <span
              className="text-[11px] truncate"
              style={{ color: 'var(--text-secondary)' }}
              title={goalLabel}
            >
              {goalLabel}
            </span>
          </div>

          {/* Theme. A display preference, so it sits with the utilities rather
              than inside the notifications/avatar pair on the right, which is
              the account cluster. */}
          <ThemeToggle />

          {/* Notifications */}
          <motion.button
            className="relative w-8 h-8 flex items-center justify-center"
            style={{
              background: 'var(--frame-well)',
              border: '2px solid var(--k-edge)',
              color: 'var(--text-secondary)',
            }}
            whileHover={{ borderColor: 'var(--k-edge-strong)' }}
            whileTap={{ scale: 0.95 }}
            aria-label={`${unreadCount} notifications`}
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              /* A square amber count block with ink type — the badge is a stamp
                 on the corner of the key, not a lit pill. */
              <div
                className="k-figure absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[11px]"
                style={{
                  background: 'var(--amber)',
                  border: '1px solid var(--k-edge)',
                  color: 'var(--ink)',
                }}
                aria-hidden="true"
              >
                {unreadCount}
              </div>
            )}
          </motion.button>

          {/* User avatar */}
          <motion.button
            className="w-8 h-8 flex items-center justify-center text-sm flex-shrink-0"
            style={{
              background: 'var(--frame-well)',
              border: '2px solid var(--k-edge)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
            }}
            whileHover={{ borderColor: 'var(--k-edge-strong)' }}
            whileTap={{ scale: 0.95 }}
            aria-label={`${userName} — profile`}
          >
            {userInitial}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}

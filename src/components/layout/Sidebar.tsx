'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Home, Map, Sparkles, FolderOpen, ClipboardCheck,
  MessageSquare, Dna, Briefcase, Award, Settings, UserCircle,
  Zap, ChevronLeft, ChevronRight, X, Menu,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CURRENT_USER, USER_PROGRESS, ACTIVE_GOAL } from '@/lib/data/seed';
import { getXPProgress, formatXP } from '@/lib/utils';
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

  const inner = (
    <Link href={item.href} onClick={onClick}>
      <motion.div
        className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer group/nav"
        style={{
          background: isActive ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
          color: isActive ? 'var(--accent-violet-bright)' : 'var(--text-secondary)',
          justifyContent: isCollapsed ? 'center' : undefined,
        }}
        whileHover={{
          background: isActive ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255,255,255,0.05)',
          color: isActive ? 'var(--accent-violet-bright)' : 'var(--text-primary)',
        }}
        transition={{ duration: 0.15 }}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active-indicator"
            className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
            style={{ background: 'var(--accent-violet-bright)' }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        <Icon size={15} className="flex-shrink-0" />
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span
              className="text-xs font-medium whitespace-nowrap overflow-hidden"
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
            className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: 'var(--accent-green)',
              boxShadow: '0 0 6px var(--accent-green-glow)',
            }}
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
  const prefersReducedMotion = useReducedMotion();

  const xpProgress = getXPProgress(USER_PROGRESS.totalXP);
  const isExpanded = isMobile ? mobileOpen : !collapsed;
  const sidebarWidth = isExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  const targetDateStr = ACTIVE_GOAL.targetDate
    ? ACTIVE_GOAL.targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'In Progress';

  const goalProgress = ACTIVE_GOAL.progressPercent ?? 31;
  const transitionDuration = prefersReducedMotion ? 0 : 0.25;

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            className="fixed inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
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
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
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
            {/* Logo mark */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative"
              style={{
                background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-cyan) 100%)',
                boxShadow: '0 0 16px var(--accent-violet-glow)',
              }}
            >
              <Zap size={16} className="text-white" />
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
                    className="text-sm font-bold tracking-wide whitespace-nowrap"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    NEXUS
                  </div>
                  <div
                    className="text-[10px] whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}
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
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
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
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
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
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
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
                className="p-3 rounded-xl"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-cyan) 100%)',
                      color: 'white',
                    }}
                  >
                    {CURRENT_USER.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-xs font-semibold truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {CURRENT_USER.name}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Level {xpProgress.level} Learner
                    </div>
                  </div>
                </div>

                {/* XP bar */}
                <div className="space-y-1">
                  <div
                    className="flex justify-between text-[10px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span>Lv {xpProgress.level}</span>
                    <span>
                      {formatXP(xpProgress.current)} / {formatXP(xpProgress.required)} XP
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-overlay)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, var(--accent-violet) 0%, var(--accent-cyan) 100%)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${xpProgress.percent}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Streak */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs" aria-hidden="true">🔥</span>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--accent-amber)' }}>
                    {CURRENT_USER.streakDays}-day streak
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar — collapsed only */}
        {!isExpanded && !isMobile && (
          <div className="px-3 mb-2 flex justify-center">
            <Tooltip content={CURRENT_USER.name} side="right">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  background:
                    'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-cyan) 100%)',
                  color: 'white',
                }}
              >
                {CURRENT_USER.name.charAt(0)}
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
          <div
            className="my-1.5 mx-1"
            style={{ height: '1px', background: 'var(--border-subtle)' }}
            role="separator"
          />

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
                className="p-2.5 rounded-lg"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: 'var(--accent-green)',
                      boxShadow: '0 0 6px var(--accent-green-glow)',
                    }}
                  />
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Goal Progress
                  </span>
                </div>
                <div className="text-[10px] mb-1.5 truncate" style={{ color: 'var(--text-muted)' }}>
                  ML Engineer Transition
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-overlay)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        'linear-gradient(90deg, var(--accent-green) 0%, var(--accent-cyan) 100%)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                    {goalProgress}% complete
                  </span>
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
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
      className="w-8 h-8 flex items-center justify-center rounded-lg"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
      }}
      aria-label="Open navigation"
    >
      <Menu size={15} />
    </button>
  );
}

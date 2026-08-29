'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { RECOMMENDATIONS, CURRENT_USER } from '@/lib/data/seed';
import { useSidebar } from './SidebarContext';
import { MobileMenuButton } from './Sidebar';

const SIDEBAR_EXPANDED = 220;
const SIDEBAR_COLLAPSED = 60;

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Home', subtitle: 'Learning command center' },
  '/journey': { title: 'My Journey', subtitle: 'Adaptive path to ML Engineer' },
  '/skills': { title: 'Skill Universe', subtitle: 'Your knowledge graph' },
  '/projects': { title: 'Projects', subtitle: 'Build to learn' },
  '/assessments': { title: 'Assessments', subtitle: 'Measure your competency' },
  '/tutor': { title: 'AI Tutor', subtitle: 'Strategic learning advisor' },
  '/genome': { title: 'Learning Genome', subtitle: 'Your unique learning DNA' },
  '/career': { title: 'Career', subtitle: 'Navigate your trajectory' },
  '/passport': { title: 'Skill Passport', subtitle: 'Verified skills & credentials' },
  '/settings': { title: 'Settings', subtitle: 'Preferences' },
};

export function TopBar() {
  const pathname = usePathname();
  const { collapsed, isMobile } = useSidebar();
  const prefersReducedMotion = useReducedMotion();

  const page = PAGE_TITLES[pathname] ?? { title: 'NEXUS', subtitle: 'Learning Intelligence' };
  const unreadCount = RECOMMENDATIONS.filter(r => !r.dismissed).length;
  const sidebarWidth = isMobile ? 0 : collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const transitionDuration = prefersReducedMotion ? 0 : 0.25;

  return (
    <motion.header
      className="fixed top-0 right-0 h-14 flex items-center px-4 gap-3 z-30"
      animate={{ left: sidebarWidth }}
      transition={{ duration: transitionDuration, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: 'rgba(8, 8, 15, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
      role="banner"
    >
      {/* Mobile hamburger */}
      {isMobile && (
        <div className="flex-shrink-0">
          <MobileMenuButton />
        </div>
      )}

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold leading-none truncate" style={{ color: 'var(--text-primary)' }}>
          {page.title}
        </h1>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
          {page.subtitle}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search trigger */}
        <motion.button
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
          whileHover={{
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
          }}
          aria-label="Search (Cmd+K)"
        >
          <Search size={12} />
          <span className="hidden md:inline">Search...</span>
          <span
            className="hidden md:inline ml-1 px-1 py-0.5 rounded text-[10px]"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            ⌘K
          </span>
        </motion.button>

        {/* AI status indicator */}
        <motion.div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{
            background: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
          }}
          animate={prefersReducedMotion ? {} : { opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
          aria-label="AI path adaptation active"
        >
          <Zap size={11} style={{ color: 'var(--accent-violet-bright)' }} />
          <span className="text-[10px] font-medium" style={{ color: 'var(--accent-violet-bright)' }}>
            AI Active
          </span>
        </motion.div>

        {/* Notifications */}
        <motion.button
          className="relative w-8 h-8 flex items-center justify-center rounded-lg"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          whileHover={{ borderColor: 'var(--border-default)' }}
          whileTap={{ scale: 0.95 }}
          aria-label={`${unreadCount} notifications`}
        >
          <Bell size={14} />
          {unreadCount > 0 && (
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: 'var(--accent-violet)' }}
              aria-hidden="true"
            >
              {unreadCount}
            </div>
          )}
        </motion.button>

        {/* User avatar */}
        <motion.button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-cyan) 100%)',
            color: 'white',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={`${CURRENT_USER.name} — profile`}
        >
          {CURRENT_USER.name.charAt(0)}
        </motion.button>
      </div>
    </motion.header>
  );
}

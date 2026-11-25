'use client';

import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const SIDEBAR_EXPANDED = 220;
const SIDEBAR_COLLAPSED = 60;

function ShellContent({ children }: { children: React.ReactNode }) {
  const { collapsed, isMobile } = useSidebar();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Onboarding is a full-screen immersive experience — no sidebar or topbar
  if (pathname === '/onboarding') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        {children}
      </div>
    );
  }

  const sidebarWidth = isMobile ? 0 : collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const transitionDuration = prefersReducedMotion ? 0 : 0.25;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Environmental lighting. Sits at z-index 0, so the main column below is
          lifted to 1 — otherwise the vignette would paint over the content it
          is meant to sit behind. The rail (z-40) and topbar (z-30) are already
          above it. */}
      <div className="nx-atmosphere" aria-hidden="true" />

      <Sidebar />
      <TopBar />
      <motion.main
        className="relative min-h-screen"
        style={{ zIndex: 1 }}
        animate={{ marginLeft: sidebarWidth, paddingTop: 56 }}
        transition={{ duration: transitionDuration, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* The canvas is centred rather than left-aligned, so past the point
            where the measure stops growing the leftover width becomes symmetric
            margin instead of one dead gutter on the right. 1280px is the same
            measure the pages already lay out against, so the composition is
            unchanged — only its position in a wide viewport is. */}
        <motion.div
          key={pathname}
          className="mx-auto w-full max-w-7xl px-5 py-6 lg:px-8 lg:py-8"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ShellContent>{children}</ShellContent>
    </SidebarProvider>
  );
}

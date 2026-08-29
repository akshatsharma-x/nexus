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
      <Sidebar />
      <TopBar />
      <motion.main
        className="min-h-screen"
        animate={{ marginLeft: sidebarWidth, paddingTop: 56 }}
        transition={{ duration: transitionDuration, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          key={pathname}
          className="p-5 lg:p-6"
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

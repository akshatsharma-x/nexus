'use client';

import { createContext, useCallback, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  mobileOpen: boolean;
  isMobile: boolean;
  toggle: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  mobileOpen: false,
  isMobile: false,
  toggle: () => {},
  openMobile: () => {},
  closeMobile: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Stable identities: the drawer's keyboard effect depends on closeMobile,
  // and a fresh function per render would re-run it — pulling focus out of
  // the open drawer and back in on every unrelated update.
  const toggle = useCallback(() => setCollapsed(c => !c), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{ collapsed, mobileOpen, isMobile, toggle, openMobile, closeMobile }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

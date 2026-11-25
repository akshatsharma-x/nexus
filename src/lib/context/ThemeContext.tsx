'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import {
  DEFAULT_THEME,
  hasStoredTheme,
  resolveTheme,
  THEME_KEY,
  type Theme,
} from '@/lib/theme';

interface ThemeContextType {
  theme: Theme;
  /** True once the learner has chosen a theme, rather than inheriting the OS. */
  isExplicit: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  isExplicit: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * `useLayoutEffect` is what keeps the DOM attribute in step with this state
 * without a visible flash, but React logs a warning if it is called while
 * server-rendering. On the server there is no DOM to sync, so it degrades to
 * `useEffect`, which never runs there either.
 */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initialiser, reading the same source as the pre-paint script, so the
  // client's first render agrees with the attribute the script already wrote.
  const [theme, setThemeState] = useState<Theme>(resolveTheme);
  const [isExplicit, setIsExplicit] = useState(hasStoredTheme);

  // The attribute on <html> is the single source of truth for the CSS, and this
  // is the only place it is written after the initial parse. It also repairs the
  // attribute in development, where Strict Mode's one extra mount resets <html>
  // to just the attributes React manages from JSX — discarding the script's.
  // In production this is a no-op on first render and the toggle's effect after.
  useIsomorphicLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Until the learner picks a side, the OS keeps deciding — including when they
  // change it while the tab is open. An explicit choice ends that; the whole
  // point of choosing is that it stops moving.
  useEffect(() => {
    if (isExplicit) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e: MediaQueryListEvent) => setThemeState(e.matches ? 'light' : 'dark');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [isExplicit]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setIsExplicit(true);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private browsing or a full quota. The theme still changes for this
      // session; it just will not survive a reload.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(current => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      setIsExplicit(true);
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {
        /* see setTheme */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isExplicit, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Theme contract.
 *
 * Plain module (no React, no 'use client') so the root layout — a Server
 * Component — can import the pre-paint script alongside the client provider
 * that owns the state.
 *
 * Persistence is a single key holding one bare word, not a JSON object: the
 * pre-paint script below runs before anything else on the page and should not
 * be parsing a blob to decide what colour the room is.
 *
 * ── The resolution rule ──────────────────────────────────────────────────────
 * A stored value wins. With nothing stored, the OS preference decides. With
 * neither, the theme is dark — NEXUS is a dark-first product and the light
 * theme is the variant.
 *
 * That rule is implemented twice: once as a string of ES5 in THEME_INIT_SCRIPT
 * and once as `resolveTheme` in ThemeContext. They MUST agree. React hydrates
 * by comparing its client render against the DOM it finds — and the script has
 * already rewritten that DOM — so if the two disagree the app hydrates into a
 * theme the attribute contradicts. The storage key is interpolated into the
 * script from the constant below so at least that much cannot drift.
 */

export type Theme = 'dark' | 'light';

export const THEME_KEY = 'nexus_theme';

/** Dark is the product; light is the variant. Also what the server renders. */
export const DEFAULT_THEME: Theme = 'dark';

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

/**
 * Runs synchronously in <head>, during HTML parsing, before the first paint.
 *
 * The server cannot know the theme — localStorage and the OS preference are
 * both client-only — so it emits `data-theme="dark"` and this corrects the
 * attribute before the browser has painted anything. Doing the same work in an
 * effect would light the whole app up in the wrong theme for a frame or more;
 * on a slow connection the browser paints the server's HTML long before React
 * has even loaded, which no effect can get in front of.
 *
 * ES5 and no optional chaining on purpose: this is inlined verbatim and never
 * passes through the bundler, so it gets no transpilation and no polyfills.
 * Wrapped in try/catch because reading localStorage throws outright in some
 * privacy modes, and a theme is not worth taking the page down for.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

/**
 * The rule above, in TypeScript, for React to initialise state from.
 *
 * It lives here rather than in the provider so the two implementations sit
 * adjacent — a reader changing one has the other on screen — and so a test can
 * import it and check the pair agree on every input.
 */
export function resolveTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (isTheme(stored)) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return DEFAULT_THEME;
  }
}

/** Whether the learner has chosen a theme, as opposed to inheriting the OS. */
export function hasStoredTheme(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return isTheme(window.localStorage.getItem(THEME_KEY));
  } catch {
    return false;
  }
}

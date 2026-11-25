'use client';

import { Contrast } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/context/ThemeContext';

/**
 * Light/dark switch for the whole app.
 *
 * Nothing here renders differently per theme, which is deliberate. The server
 * has no way to know the theme, so it emits the dark markup; the pre-paint
 * script then corrects `data-theme` on <html> — but it does not, and should
 * not, rewrite this button's markup. React hydrates by comparing its own render
 * against the DOM it finds, so a component that rendered a sun for light and a
 * moon for dark would mismatch on every visit by a learner whose stored theme
 * is not the default.
 *
 * So the glyph is one half-filled circle for both themes — it names the axis
 * rather than reporting a position, and it is the same mark the reference design
 * uses — and the two accessible names both exist in the DOM at all times, with
 * CSS keyed on `html[data-theme]` hiding one. `display: none` removes a node
 * from the accessibility tree, so exactly one name is ever exposed, it is
 * correct before the first paint, and no hydration is involved in getting there.
 */
export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      className="w-8 h-8 flex items-center justify-center flex-shrink-0"
      style={{
        background: 'var(--frame-well)',
        border: '2px solid var(--k-edge)',
        color: 'var(--text-secondary)',
      }}
      whileHover={{ borderColor: 'var(--k-edge-strong)', color: 'var(--text-primary)' }}
      whileTap={{ scale: 0.95 }}
    >
      <Contrast size={14} className="nx-theme-icon" aria-hidden="true" />
      <span className="sr-only nx-when-dark">Switch to light theme</span>
      <span className="sr-only nx-when-light">Switch to dark theme</span>
    </motion.button>
  );
}

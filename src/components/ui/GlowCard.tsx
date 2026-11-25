'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'violet' | 'cyan' | 'green' | 'amber' | 'none';
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/* The name predates the paper language and is kept because many files import it.
   `glowColor` now picks the colour of a hard 2px rule rather than a blur, so the
   card is a printed sheet with a coded edge; 'none' stays the quiet default. */
const EDGE_COLORS: Record<string, string> = {
  violet: 'var(--accent-violet-bright)',
  cyan: 'var(--accent-cyan-bright)',
  green: 'var(--accent-green-bright)',
  amber: 'var(--amber-deep)',
  none: 'var(--k-edge)',
};

export function GlowCard({ children, className, glowColor = 'none', hover = true, onClick, style }: GlowCardProps) {
  const edge = EDGE_COLORS[glowColor];

  return (
    <motion.div
      className={cn('relative overflow-hidden', className)}
      style={{
        background: 'var(--bg-surface)',
        border: `2px solid ${edge}`,
        boxShadow: 'var(--k-shadow-sm)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

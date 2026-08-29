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

const glowStyles: Record<string, string> = {
  violet: 'var(--accent-violet-glow)',
  cyan: 'var(--accent-cyan-glow)',
  green: 'var(--accent-green-glow)',
  amber: 'var(--accent-amber-glow)',
  none: 'transparent',
};

export function GlowCard({ children, className, glowColor = 'none', hover = true, onClick, style }: GlowCardProps) {
  const glow = glowStyles[glowColor];

  return (
    <motion.div
      className={cn('relative rounded-xl overflow-hidden', className)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: glowColor !== 'none' ? `0 0 30px ${glow}` : undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      whileHover={hover ? {
        borderColor: 'var(--border-default)',
        y: -1,
        transition: { duration: 0.2 }
      } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

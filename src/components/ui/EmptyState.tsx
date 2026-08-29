'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) {
  const paddings = { sm: 'py-8', md: 'py-12', lg: 'py-16' };
  const iconSizes = { sm: 32, md: 40, lg: 48 };

  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center ${paddings[size]}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {(Icon || emoji) && (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {Icon ? (
            <Icon size={iconSizes[size]} style={{ color: 'var(--text-muted)' }} />
          ) : (
            <span style={{ fontSize: iconSizes[size] - 8 }}>{emoji}</span>
          )}
        </div>
      )}

      <h3
        className="text-sm font-semibold mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="text-xs max-w-xs leading-relaxed mb-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </p>
      )}

      {action && (
        <motion.button
          className="px-4 py-2 rounded-lg text-xs font-medium"
          style={{ background: 'var(--accent-violet)', color: 'white' }}
          onClick={action.onClick}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
}

export function LoadingSkeleton({ className = '', rows = 3 }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`} aria-label="Loading..." aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="shimmer rounded-lg"
          style={{
            height: i === 0 ? 20 : 14,
            width: i === rows - 1 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  );
}

export function LoadingCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`p-4 rounded-xl ${className}`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
      aria-busy="true"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="shimmer w-8 h-8 rounded-lg" />
        <div className="shimmer h-4 rounded w-32" />
      </div>
      <LoadingSkeleton rows={3} />
    </div>
  );
}

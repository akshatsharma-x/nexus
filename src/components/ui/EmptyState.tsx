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
  const iconSizes = { sm: 22, md: 26, lg: 30 };

  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center ${paddings[size]}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {(Icon || emoji) && (
        <div
          className="w-14 h-14 flex items-center justify-center mb-4"
          style={{
            border: '2px solid var(--k-edge)',
            boxShadow: 'var(--k-shadow-sm)',
          }}
        >
          {Icon ? (
            <Icon size={iconSizes[size]} style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
          ) : (
            <span style={{ fontSize: iconSizes[size] }} aria-hidden="true">{emoji}</span>
          )}
        </div>
      )}

      <h3
        className="mb-2 uppercase"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="text-xs max-w-xs leading-relaxed mb-5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </p>
      )}

      {action && (
        <button type="button" className="k-btn k-btn-amber" onClick={action.onClick}>
          {action.label}
        </button>
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
          className="shimmer"
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
      className={`p-4 ${className}`}
      style={{
        background: 'var(--bg-surface)',
        border: '2px solid var(--k-edge)',
      }}
      aria-busy="true"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="shimmer w-8 h-8" />
        <div className="shimmer h-4 w-32" />
      </div>
      <LoadingSkeleton rows={3} />
    </div>
  );
}

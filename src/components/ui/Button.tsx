'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: 'var(--accent-violet)', color: 'white', border: '1px solid transparent' },
  secondary: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
  },
  ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
  danger: {
    background: 'rgba(244,63,94,0.1)',
    color: 'var(--accent-rose)',
    border: '1px solid rgba(244,63,94,0.25)',
  },
  success: {
    background: 'rgba(16,185,129,0.12)',
    color: 'var(--accent-green)',
    border: '1px solid rgba(16,185,129,0.25)',
  },
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-[10px] rounded-md gap-1',
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
};

export function Button({
  variant = 'secondary',
  size = 'sm',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  children,
  className,
  disabled,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const style = VARIANT_STYLES[variant];
  const sizeClass = SIZES[size];
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors',
        sizeClass,
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
      )}
      style={style}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      disabled={isDisabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {loading && (
        <motion.span
          className="w-3 h-3 rounded-full border-2 border-current border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        />
      )}
      {!loading && Icon && iconPosition === 'left' && <Icon size={12} aria-hidden="true" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={12} aria-hidden="true" />}
    </motion.button>
  );
}

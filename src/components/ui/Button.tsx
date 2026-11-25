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

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'k-btn-amber',
  secondary: 'k-btn-outline',
  ghost: '',
  danger: 'k-btn-outline',
  success: 'k-btn-outline',
};

/* The two semantic variants are the outline key re-inked: the accent carries the
   type and, through currentColor, the rule as well. Every value is a variable so
   the same button reads on the dark room and on stock. */
const VARIANT_STYLE: Record<ButtonVariant, React.CSSProperties> = {
  primary: {},
  secondary: {},
  ghost: {
    background: 'transparent',
    borderColor: 'transparent',
    boxShadow: 'none',
    color: 'var(--text-secondary)',
  },
  danger: { color: 'var(--accent-rose)', borderColor: 'currentColor' },
  success: { color: 'var(--accent-green)', borderColor: 'currentColor' },
};

/* Sizing is inline rather than in utility classes: .k-btn is unlayered CSS and
   would win over Tailwind's layered padding and font-size utilities. */
const SIZE_STYLE: Record<ButtonSize, React.CSSProperties> = {
  xs: { padding: '0.25rem 0.5rem', fontSize: 11, gap: '0.375rem' },
  sm: { padding: '0.375rem 0.75rem', fontSize: 11, gap: '0.4375rem' },
  md: { padding: '0.5rem 1rem', fontSize: 12, gap: '0.5rem' },
  lg: { padding: '0.75rem 1.25rem', fontSize: 13, gap: '0.625rem' },
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
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={cn(
        'k-btn',
        VARIANT_CLASS[variant],
        isDisabled ? 'cursor-not-allowed pointer-events-none' : '',
        className,
      )}
      style={{ ...VARIANT_STYLE[variant], ...SIZE_STYLE[size] }}
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
    </button>
  );
}

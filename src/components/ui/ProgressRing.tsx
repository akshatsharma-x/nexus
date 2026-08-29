'use client';

import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string | number;
  sublabel?: string;
  delay?: number;
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  color = 'url(#progressGrad)',
  trackColor = 'rgba(255,255,255,0.05)',
  label,
  sublabel,
  delay = 0.3,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference * (1 - clampedProgress / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-label={`Progress: ${clampedProgress}%`}
        role="img"
      >
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-violet)" />
            <stop offset="100%" stopColor="var(--accent-cyan)" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, delay, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      {(label !== undefined || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label !== undefined && (
            <div
              className="font-bold leading-none"
              style={{
                fontSize: size < 60 ? 14 : size < 80 ? 18 : 22,
                color: 'var(--text-primary)',
              }}
            >
              {label}
            </div>
          )}
          {sublabel && (
            <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

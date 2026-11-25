'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatTileProps {
  label: string;
  value: string | number;
  subvalue?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { direction: 'up' | 'down' | 'stable'; label: string };
  delay?: number;
}

/* `iconColor` stays in the props for call-site compatibility but no longer paints:
   the icon is a single amber block (.k-tile), so a per-tile hue would break the
   one-accent rule and reintroduce the alpha-hex tinting this cell was built from. */
export function StatTile({ label, value, subvalue, icon: Icon, trend, delay = 0 }: StatTileProps) {
  return (
    <motion.div
      className="p-4"
      style={{
        background: 'var(--bg-surface)',
        border: '2px solid var(--k-edge)',
        boxShadow: 'var(--k-shadow-sm)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="k-tile" style={{ width: '2rem', height: '2rem' }}>
          <Icon size={15} aria-hidden="true" />
        </span>
        {trend && (
          <div className="flex items-center gap-1 text-[11px]"
            style={{ color: trend.direction === 'up' ? 'var(--accent-green)' : trend.direction === 'down' ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
            <span aria-hidden="true">{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}</span>
            <span>{trend.label}</span>
          </div>
        )}
      </div>
      <div className="k-figure text-2xl mb-1">{value}</div>
      <div className="k-label">{label}</div>
      {subvalue && <div className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>{subvalue}</div>}
    </motion.div>
  );
}

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

export function StatTile({ label, value, subvalue, icon: Icon, iconColor = 'var(--accent-violet-bright)', trend, delay = 0 }: StatTileProps) {
  return (
    <motion.div
      className="p-4 rounded-xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ borderColor: 'var(--border-default)', y: -1, transition: { duration: 0.2 } }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${iconColor}20`, border: `1px solid ${iconColor}30` }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px]"
            style={{ color: trend.direction === 'up' ? 'var(--accent-green)' : trend.direction === 'down' ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
            <span>{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}</span>
            <span>{trend.label}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</div>
      {subvalue && <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subvalue}</div>}
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';

interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  variant?: 'pill' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
}

/* Counts ride on the tab as a square chip, ink-quiet when the tab is idle and
   inverted out of the amber block when it is selected. */
function TabBadge({ value, onAmber }: { value: number | string; onAmber: boolean }) {
  return (
    <span
      className="text-[11px] px-1"
      style={{
        background: onAmber ? 'transparent' : 'var(--bg-elevated)',
        border: `1px solid ${onAmber ? 'var(--ink)' : 'var(--k-edge)'}`,
        color: onAmber ? 'var(--ink)' : 'var(--text-muted)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </span>
  );
}

export function Tabs({ tabs, active, onChange, variant = 'pill', size = 'sm', className = '' }: TabsProps) {
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2';
  /* The display face is what makes a tab read as a printed tab rather than a link. */
  const typeClass = 'font-bold uppercase tracking-[0.1em]';

  if (variant === 'underline') {
    return (
      <div className={`flex gap-1 ${className}`} style={{ borderBottom: '2px solid var(--k-edge)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative ${padding} ${textSize} ${typeClass} transition-colors`}
            style={{
              fontFamily: 'var(--font-display)',
              color: active === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
            role="tab"
            aria-selected={active === tab.id}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.badge !== undefined && <TabBadge value={tab.badge} onAmber={false} />}
            </span>
            {active === tab.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute -bottom-0.5 left-0 right-0"
                style={{ height: 3, background: 'var(--amber)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex gap-1.5 ${className}`} role="tablist">
      {tabs.map(tab => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative ${padding} ${textSize} ${typeClass} transition-colors`}
            style={{
              fontFamily: 'var(--font-display)',
              background: selected ? 'var(--amber)' : 'transparent',
              color: selected ? 'var(--ink)' : 'var(--text-secondary)',
              border: '2px solid var(--k-edge)',
              boxShadow: selected ? 'var(--k-shadow-sm)' : undefined,
            }}
            role="tab"
            aria-selected={selected}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.badge !== undefined && <TabBadge value={tab.badge} onAmber={selected} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

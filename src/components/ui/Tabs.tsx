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

export function Tabs({ tabs, active, onChange, variant = 'pill', size = 'sm', className = '' }: TabsProps) {
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2';

  if (variant === 'underline') {
    return (
      <div className={`flex gap-1 border-b ${className}`} style={{ borderColor: 'var(--border-subtle)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative ${padding} ${textSize} font-medium transition-colors`}
            style={{ color: active === tab.id ? 'var(--accent-violet-bright)' : 'var(--text-secondary)' }}
            role="tab"
            aria-selected={active === tab.id}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className="text-[9px] px-1 rounded"
                  style={{
                    background: active === tab.id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)',
                    color: active === tab.id ? 'var(--accent-violet-bright)' : 'var(--text-muted)',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </span>
            {active === tab.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: 'var(--accent-violet-bright)' }}
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
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative ${padding} ${textSize} font-medium rounded-lg transition-colors`}
          style={{
            background: active === tab.id ? 'var(--accent-violet)' : 'var(--bg-surface)',
            color: active === tab.id ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${active === tab.id ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
          }}
          role="tab"
          aria-selected={active === tab.id}
        >
          <span className="flex items-center gap-1.5">
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className="text-[9px] px-1 rounded"
                style={{
                  background: active === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                  color: active === tab.id ? 'white' : 'var(--text-muted)',
                }}
              >
                {tab.badge}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';

interface WhyThisProps {
  reason: string;
  compact?: boolean;
}

export function WhyThis({ reason, compact = false }: WhyThisProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        className="flex items-center gap-1 text-[10px] transition-colors hover:opacity-80"
        style={{ color: 'var(--accent-violet-bright)' }}
        onClick={() => setOpen(!open)}
      >
        <Info size={11} />
        {!compact && <span>Why this?</span>}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute bottom-6 left-0 w-64 p-3 rounded-xl z-50"
              style={{
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border-default)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 16px var(--accent-violet-glow)',
              }}
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-violet-bright)' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--accent-violet-bright)' }}>AI Recommendation Reason</span>
                </div>
                <button onClick={() => setOpen(false)}>
                  <X size={11} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {reason}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

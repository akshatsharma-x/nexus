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
        type="button"
        className="flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <Info size={11} aria-hidden="true" />
        {!compact && <span>Why this?</span>}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute bottom-6 left-0 w-64 p-3 z-50"
              style={{
                background: 'var(--bg-surface)',
                border: '2px solid var(--k-edge)',
                boxShadow: 'var(--k-shadow)',
              }}
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="k-label" style={{ color: 'var(--text-secondary)' }}>Why this</span>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close">
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

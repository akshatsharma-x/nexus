'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
  delayMs?: number;
}

const POSITIONS: Record<string, React.CSSProperties> = {
  right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 10 },
  left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 10 },
  top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
  bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
};

const ENTER_DIRECTION: Record<string, object> = {
  right: { x: -4 },
  left: { x: 4 },
  top: { y: 4 },
  bottom: { y: -4 },
};

export function Tooltip({ content, side = 'top', children, delayMs = 120 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    timerRef.current = setTimeout(() => setVisible(true), delayMs);
  }

  function hide() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            className="absolute z-50 pointer-events-none"
            style={POSITIONS[side]}
            initial={{ opacity: 0, scale: 0.92, ...ENTER_DIRECTION[side] }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.1 }}
            role="tooltip"
          >
            <div
              className="k-label px-2 py-1 whitespace-nowrap"
              style={{
                background: 'var(--bg-overlay)',
                border: '2px solid var(--k-edge)',
                boxShadow: 'var(--k-shadow-sm)',
                color: 'var(--text-primary)',
              }}
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

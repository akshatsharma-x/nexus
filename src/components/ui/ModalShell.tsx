'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export function ModalShell({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      {/* The scrim is the dark room dimmed — it must stay outside the paper scope. */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="k-paper"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 600,
          maxHeight: '85vh',
          overflowY: 'auto',
          border: '2px solid var(--k-edge)',
          borderBottom: 'none',
          paddingBottom: 40,
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Drag handle + close */}
        <div
          style={{
            position: 'sticky', top: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px 20px 14px',
            background: 'var(--paper)',
            borderBottom: '2px solid var(--k-edge)',
            zIndex: 1,
          }}
        >
          <div style={{ width: 40, height: 5, background: 'var(--k-edge)' }} />
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28,
              background: 'transparent',
              border: '2px solid var(--k-edge)',
              color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={13} />
          </button>
        </div>
        <div style={{ padding: '24px 24px 0' }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

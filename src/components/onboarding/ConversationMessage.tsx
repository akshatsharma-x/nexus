'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { OnboardingInsight } from '@/lib/types';

// The conversation is set on stock, so every colour here is read from the
// surface variables rather than hardcoded — the components are placed inside a
// .k-paper sheet by the page and must not carry a surface of their own.

// ─── NEXUS message ────────────────────────────────────────────────────────────

interface AssistantMessageProps {
  content: string;
  insight?: OnboardingInsight;
  index?: number;
}

export function AssistantMessage({ content, insight, index = 0 }: AssistantMessageProps) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      className="space-y-3"
      initial={shouldReduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.04 }}
    >
      <div className="k-label select-none" style={{ color: 'var(--text-tertiary)' }}>
        NEXUS
      </div>
      <div
        className="text-[15px] leading-[1.75]"
        style={{ color: 'var(--text-primary)', whiteSpace: 'pre-line', maxWidth: '36rem' }}
      >
        {content}
      </div>
      {insight && (
        <motion.div
          className="k-well px-4 py-3 space-y-1.5"
          style={{ borderLeft: '3px solid var(--amber)', maxWidth: '36rem' }}
          initial={shouldReduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="k-slug">NOTICED</div>
          <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {insight.text}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── User message ─────────────────────────────────────────────────────────────

interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      className="flex justify-end"
      initial={shouldReduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* The reader's own words are the quieter voice: right margin, no label,
          no container — the answer is a note in the margin of the interview. */}
      <p
        className="text-[14px] leading-[1.7] text-right pl-8"
        style={{
          color: 'var(--text-secondary)',
          maxWidth: '32rem',
          borderRight: '2px solid var(--border-default)',
          paddingRight: '0.875rem',
        }}
      >
        {content}
      </p>
    </motion.div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

export function TypingIndicator() {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      className="space-y-3"
      initial={shouldReduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="k-label select-none" style={{ color: 'var(--text-tertiary)' }}>
        NEXUS
      </div>
      {/* One ink caret in place of pulsing dots. The blink is the loading state
          itself, which is why it keeps repeating — and stops under reduced
          motion, where the caret simply sits in the measure. */}
      <div className="flex items-center gap-3" role="status">
        <span className="sr-only">NEXUS is thinking</span>
        <motion.span
          aria-hidden="true"
          className="block"
          style={{ width: '2px', height: '1.1rem', background: 'var(--text-primary)' }}
          animate={shouldReduce ? {} : { opacity: [1, 0.12, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span aria-hidden="true" className="block" style={{ width: '2.5rem', height: '2px', background: 'var(--amber)' }} />
      </div>
    </motion.div>
  );
}

// ─── Suggested replies ────────────────────────────────────────────────────────

interface SuggestedRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
}

function SuggestionItem({ text, onSelect }: { text: string; onSelect: () => void }) {
  return (
    <button
      className="block w-full text-left text-[13px] leading-relaxed py-2 transition-colors duration-150"
      style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      onClick={onSelect}
    >
      {text}
    </button>
  );
}

export function SuggestedReplies({ replies, onSelect }: SuggestedRepliesProps) {
  const shouldReduce = useReducedMotion();
  if (replies.length === 0) return null;
  return (
    <motion.div
      className="space-y-2"
      initial={shouldReduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.12 }}
      style={{ maxWidth: '36rem' }}
    >
      <div className="k-label" style={{ color: 'var(--text-tertiary)' }}>
        Or answer with
      </div>
      <div>
        {replies.map(r => (
          <SuggestionItem key={r} text={r} onSelect={() => onSelect(r)} />
        ))}
      </div>
    </motion.div>
  );
}

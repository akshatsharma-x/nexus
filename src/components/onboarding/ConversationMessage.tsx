'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { OnboardingInsight } from '@/lib/types';

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
      className="space-y-4"
      initial={shouldReduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.04 }}
    >
      <div
        className="text-[10px] font-semibold tracking-[0.15em] uppercase select-none"
        style={{ color: 'var(--text-muted)' }}
      >
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
          className="pl-4 space-y-1.5"
          style={{ borderLeft: '2px solid rgba(124,58,237,0.3)' }}
          initial={shouldReduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div
            className="text-[10px] font-semibold tracking-[0.15em] uppercase"
            style={{ color: 'var(--accent-violet-bright)' }}
          >
            NEXUS noticed
          </div>
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
      <p
        className="text-[14px] leading-[1.7] text-right"
        style={{ color: 'var(--text-secondary)', maxWidth: '32rem' }}
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
      className="space-y-2"
      initial={shouldReduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="text-[10px] font-semibold tracking-[0.15em] uppercase select-none"
        style={{ color: 'var(--text-muted)' }}
      >
        NEXUS
      </div>
      <div className="flex items-center gap-1.5" aria-label="NEXUS is thinking">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-[5px] h-[5px] rounded-full block"
            style={{ background: 'var(--text-muted)' }}
            animate={shouldReduce ? {} : { opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
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
      className="block w-full text-left text-[13px] leading-relaxed transition-colors duration-150 py-0.5"
      style={{ color: 'var(--text-tertiary)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
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
    >
      <div
        className="text-[10px] font-semibold tracking-[0.15em] uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        Suggestions
      </div>
      <div>
        {replies.map(r => (
          <SuggestionItem key={r} text={r} onSelect={() => onSelect(r)} />
        ))}
      </div>
    </motion.div>
  );
}

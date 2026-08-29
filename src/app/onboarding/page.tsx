'use client';

import {
  useState, useRef, useEffect, useCallback, type KeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import {
  AssistantMessage, UserMessage, TypingIndicator, SuggestedReplies,
} from '@/components/onboarding/ConversationMessage';
import { ProfilePreview } from '@/components/onboarding/ProfilePreview';
import { ProfileReview } from '@/components/onboarding/ProfileReview';
import { useOnboarding } from '@/lib/context/OnboardingContext';
import { processMessage, buildLearnerContext } from '@/lib/services/onboarding';
import type { OnboardingMessage, OnboardingProfile, OnboardingStage } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  'I want to become an ML Engineer.',
  'I want to transition from frontend into AI.',
  'I want to become a Data Scientist.',
  'I want to build production ML systems.',
];

const STAGE_LABELS: Partial<Record<OnboardingStage, string>> = {
  asking_experience: 'Understanding your background',
  asking_skills: 'Mapping your skills',
  asking_availability: 'Understanding your availability',
  asking_preferences: 'Understanding how you learn',
  review: 'Building your profile',
};

const INITIAL_PROFILE: Partial<OnboardingProfile> = {
  goalRaw: '', goal: '', targetRole: '', targetRoleId: null,
  experienceLevel: null, currentRole: '', yearsOfExperience: null,
  currentSkills: [], completedCourses: [], interests: [],
  weeklyHoursAvailable: null, targetDate: null, targetDateRaw: '',
  learningFormatPreference: [], projectPreference: 'mixed',
};

let msgCounter = 0;
function nextId() { return `msg_${++msgCounter}`; }

// ─── Intro screen ─────────────────────────────────────────────────────────────

interface IntroProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
}

function IntroScreen({ value, onChange, onSubmit }: IntroProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const shouldReduce = useReducedMotion();

  useEffect(() => { ref.current?.focus(); }, []);

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSubmit(value.trim());
    }
  }

  const borderColor = focused
    ? 'var(--accent-violet-bright)'
    : value.trim()
    ? 'var(--border-strong)'
    : 'var(--border-default)';

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-6"
      style={{ paddingBottom: '8vh' }}
      initial={shouldReduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduce ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
    >
      {/* Wordmark */}
      <div className="mb-14">
        <span
          className="text-[11px] font-bold tracking-[0.25em] uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          NEXUS
        </span>
      </div>

      {/* Headline */}
      <div className="text-center mb-12" style={{ maxWidth: '520px' }}>
        <h1
          className="font-bold tracking-tight mb-5"
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
            lineHeight: 1.1,
            color: 'var(--text-primary)',
          }}
        >
          Where do you<br />want to go?
        </h1>
        <p
          className="text-base leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          Tell me what you're trying to achieve. I'll understand where you're starting from
          before building your learning path.
        </p>
      </div>

      {/* Input */}
      <div className="w-full" style={{ maxWidth: '560px' }}>
        <div
          style={{
            borderBottom: `1px solid ${borderColor}`,
            transition: 'border-color 0.2s',
            paddingBottom: '4px',
          }}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. I want to become an ML Engineer within 6 months…"
            rows={4}
            className="w-full resize-none text-base py-3"
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              caretColor: 'var(--accent-violet-bright)',
              lineHeight: '1.7',
              outline: 'none',
            }}
            aria-label="Tell NEXUS your goal"
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Enter to begin · Shift+Enter for new line
          </span>
          <motion.button
            className="text-[12px] font-semibold flex items-center gap-1.5 px-4 py-2 rounded-lg"
            style={{
              background: value.trim()
                ? 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-cyan) 100%)'
                : 'var(--bg-elevated)',
              color: value.trim() ? 'white' : 'var(--text-muted)',
              transition: 'background 0.2s, color 0.2s',
            }}
            whileHover={value.trim() && !shouldReduce ? { scale: 1.02 } : {}}
            whileTap={value.trim() && !shouldReduce ? { scale: 0.97 } : {}}
            onClick={() => value.trim() && onSubmit(value.trim())}
            aria-label="Start"
          >
            Start <ArrowRight size={13} />
          </motion.button>
        </div>

        {/* Example prompts */}
        <div className="mt-10">
          <p
            className="text-[10px] tracking-[0.12em] uppercase mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Examples
          </p>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.map(prompt => (
              <ExamplePrompt key={prompt} text={prompt} onSelect={() => onSubmit(prompt)} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ExamplePrompt({ text, onSelect }: { text: string; onSelect: () => void }) {
  return (
    <button
      className="block w-full text-left text-[13px] leading-relaxed py-0.5 transition-colors duration-150"
      style={{ color: 'var(--text-tertiary)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
      onClick={onSelect}
    >
      {text}
    </button>
  );
}

// ─── Conversation input ───────────────────────────────────────────────────────

interface ConversationInputProps {
  onSubmit: (v: string) => void;
  disabled: boolean;
}

function ConversationInput({ onSubmit, disabled }: ConversationInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit(value.trim());
        setValue('');
      }
    }
  }

  const borderColor = disabled
    ? 'var(--border-subtle)'
    : focused
    ? 'var(--accent-violet-bright)'
    : value.trim()
    ? 'var(--border-strong)'
    : 'var(--border-default)';

  return (
    <div style={{ opacity: disabled ? 0.55 : 1, transition: 'opacity 0.2s' }}>
      <div
        style={{
          borderBottom: `1px solid ${borderColor}`,
          transition: 'border-color 0.2s',
          paddingBottom: '3px',
        }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={disabled ? 'Thinking…' : 'Reply…'}
          disabled={disabled}
          rows={2}
          className="w-full resize-none text-sm py-2"
          style={{
            background: 'transparent',
            color: 'var(--text-primary)',
            caretColor: 'var(--accent-violet-bright)',
            lineHeight: '1.65',
            outline: 'none',
          }}
          aria-label="Your reply"
        />
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Shift+Enter for new line
        </span>
        <motion.button
          className="text-[11px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{
            background: value.trim() && !disabled ? 'var(--accent-violet)' : 'var(--bg-elevated)',
            color: value.trim() && !disabled ? 'white' : 'var(--text-muted)',
            transition: 'background 0.2s, color 0.2s',
          }}
          whileTap={value.trim() && !disabled && !shouldReduce ? { scale: 0.97 } : {}}
          onClick={() => {
            if (value.trim() && !disabled) {
              onSubmit(value.trim());
              setValue('');
            }
          }}
          disabled={disabled || !value.trim()}
          aria-label="Send reply"
        >
          Send <ArrowRight size={11} />
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { setOnboardingResult } = useOnboarding();

  const [started, setStarted] = useState(false);
  const [introValue, setIntroValue] = useState('');
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [profile, setProfile] = useState<Partial<OnboardingProfile>>(INITIAL_PROFILE);
  const [stage, setStage] = useState<OnboardingStage>('intro');
  const [isThinking, setIsThinking] = useState(false);
  const [lastSuggestedReplies, setLastSuggestedReplies] = useState<string[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [showMobileProfile, setShowMobileProfile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = useCallback(async (text: string) => {
    if (isThinking) return;

    const userMsg: OnboardingMessage = {
      id: nextId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLastSuggestedReplies([]);
    setIsThinking(true);

    if (!started) setStarted(true);

    const delay = 700 + Math.random() * 400;
    await new Promise(r => setTimeout(r, delay));

    const result = processMessage(text, profile, stage);

    setProfile(result.mergedProfile);

    const aiMsg: OnboardingMessage = {
      id: nextId(),
      role: 'assistant',
      content: result.reply,
      timestamp: new Date(),
      insight: result.insight,
      suggestedReplies: result.suggestedReplies,
    };
    setMessages(prev => [...prev, aiMsg]);
    setLastSuggestedReplies(result.suggestedReplies ?? []);
    setStage(result.nextStage);
    setIsThinking(false);

    if (result.nextStage === 'review') {
      setShowReview(true);
    }
  }, [isThinking, profile, stage, started]);

  const handleConfirm = useCallback((finalProfile: OnboardingProfile) => {
    const context = buildLearnerContext(finalProfile);
    setOnboardingResult(finalProfile, context);
    router.push('/');
  }, [setOnboardingResult, router]);

  const handleSuggestedReply = useCallback((reply: string) => {
    handleSubmit(reply);
  }, [handleSubmit]);

  // ── Intro ────────────────────────────────────────────────────────────────

  if (!started) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <IntroScreen
          value={introValue}
          onChange={setIntroValue}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // ── Conversation ─────────────────────────────────────────────────────────

  const stageLabel = STAGE_LABELS[stage];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Topbar */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-4 z-10"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-baseline gap-3">
          <span
            className="text-sm font-bold tracking-[0.12em] uppercase"
            style={{ color: 'var(--text-primary)' }}
          >
            NEXUS
          </span>
          {stageLabel && (
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {stageLabel}
            </span>
          )}
        </div>

        <button
          className="lg:hidden text-[11px] transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          onClick={() => setShowMobileProfile(p => !p)}
          aria-label="Toggle profile preview"
        >
          {showMobileProfile ? 'Hide profile' : 'View profile'}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Conversation column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Mobile profile panel */}
          <AnimatePresence>
            {showMobileProfile && (
              <motion.div
                className="lg:hidden px-6 pt-6 pb-4"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ProfilePreview profile={profile} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-10">
            <div className="mx-auto px-6 sm:px-10 space-y-8" style={{ maxWidth: '680px' }}>

              <AnimatePresence>
                {messages.map((msg, i) => (
                  <div key={msg.id}>
                    {msg.role === 'assistant' ? (
                      <AssistantMessage
                        content={msg.content}
                        insight={msg.insight}
                        index={i}
                      />
                    ) : (
                      <UserMessage content={msg.content} />
                    )}
                  </div>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {isThinking && <TypingIndicator />}
              </AnimatePresence>

              <AnimatePresence>
                {!isThinking && lastSuggestedReplies.length > 0 && !showReview && (
                  <SuggestedReplies
                    replies={lastSuggestedReplies}
                    onSelect={handleSuggestedReply}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showReview && stage === 'review' && profile.targetRole && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <ProfileReview
                      profile={profile as OnboardingProfile}
                      onConfirm={handleConfirm}
                      onEdit={() => setShowReview(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          {!showReview && (
            <div
              className="flex-shrink-0 pt-4 pb-6"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <div className="mx-auto px-6 sm:px-10" style={{ maxWidth: '680px' }}>
                <ConversationInput onSubmit={handleSubmit} disabled={isThinking} />
              </div>
            </div>
          )}
        </div>

        {/* Desktop profile panel */}
        <div
          className="hidden lg:block flex-shrink-0 overflow-y-auto py-10 px-8"
          style={{
            width: '280px',
            borderLeft: '1px solid var(--border-subtle)',
          }}
          aria-label="Profile forming"
        >
          <ProfilePreview profile={profile} />
        </div>
      </div>
    </div>
  );
}

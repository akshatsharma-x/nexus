'use client';

import {
  useState, useRef, useEffect, useCallback, type KeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
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

// The interview is named by what it is doing, not by how far it has to go — a
// "step 3 of 6" turns a conversation into a form. Availability and preferences
// are two questions about the same thing, so they share a name.
const STAGE_SEQUENCE = [
  'Understanding your goal',
  'Understanding your starting point',
  'Mapping your skills',
  'Understanding how you learn',
  'Building your profile',
];

const STAGE_STEP: Record<OnboardingStage, number> = {
  intro: 0,
  asking_experience: 1,
  asking_skills: 2,
  asking_availability: 3,
  asking_preferences: 3,
  review: 4,
};

const SUBMIT_ERROR =
  "I couldn't read that answer. Nothing was lost — send it again, or try rewording it.";

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
  const shouldReduce = useReducedMotion();
  const ready = !!value.trim();

  useEffect(() => { ref.current?.focus(); }, []);

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSubmit(value.trim());
    }
  }

  return (
    <motion.div
      className="relative z-10 mx-auto flex min-h-screen w-full flex-col justify-center px-5 py-16 sm:px-8"
      style={{ maxWidth: '46rem' }}
      initial={shouldReduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduce ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
    >
      {/* Headline — sits directly on the dark room, no panel behind it. */}
      <div className="k-slug">Nexus</div>
      <h1 className="k-display mt-4">
        Where do you <span className="k-highlight">want to go</span>?
      </h1>
      <p className="nx-support mt-5" style={{ maxWidth: '34rem' }}>
        Tell me what you&apos;re trying to achieve, in your own words. I&apos;ll work out where
        you&apos;re starting from before building anything.
      </p>

      {/* The composer is the one primary object on this view, so it is the one
          sheet that gets the amber offset block. */}
      <div className="k-paper k-panel-hero mt-9 p-5 sm:p-6">
        <label className="k-label block" htmlFor="onboarding-goal" style={{ color: 'var(--text-tertiary)' }}>
          Your goal
        </label>
        <textarea
          id="onboarding-goal"
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="e.g. I want to become an ML Engineer within 6 months. Right now I build React apps and I've never trained a model."
          rows={5}
          className="k-field mt-2.5 w-full resize-none p-3.5 text-[15px]"
          style={{ lineHeight: '1.7', caretColor: 'var(--ink)' }}
          aria-label="Tell NEXUS your goal"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            Enter to begin · Shift+Enter for a new line
          </span>
          <button
            className="k-btn k-btn-solid"
            style={{ opacity: ready ? 1 : 0.45, transition: 'opacity 0.2s' }}
            aria-disabled={!ready}
            onClick={() => value.trim() && onSubmit(value.trim())}
            aria-label="Start"
          >
            Begin <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Example prompts */}
      <div className="mt-10">
        <p className="k-label" style={{ color: 'var(--text-secondary)' }}>
          Or start from one of these
        </p>
        <div className="mt-2">
          {EXAMPLE_PROMPTS.map(prompt => (
            <ExamplePrompt key={prompt} text={prompt} onSelect={() => onSubmit(prompt)} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ExamplePrompt({ text, onSelect }: { text: string; onSelect: () => void }) {
  return (
    <button
      className="block w-full py-2.5 text-left text-[13px] leading-relaxed transition-colors duration-150"
      style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      onClick={onSelect}
    >
      {text}
    </button>
  );
}

// ─── Stage progression ────────────────────────────────────────────────────────

function StageProgress({ stage }: { stage: OnboardingStage }) {
  const step = STAGE_STEP[stage] ?? 0;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="k-label" style={{ color: 'var(--text-secondary)' }}>
        {STAGE_SEQUENCE[step] ?? STAGE_SEQUENCE[0]}
      </span>
      {/* The stage is already named in text above, so the ticks are decoration. */}
      <span className="flex items-center gap-1" aria-hidden="true">
        {STAGE_SEQUENCE.map((name, i) => (
          <span
            key={name}
            className="block"
            style={{
              width: i === step ? '1.5rem' : '0.5rem',
              height: '3px',
              background: i <= step ? 'var(--amber)' : 'var(--border-default)',
              transition: 'width 250ms ease, background 250ms ease',
            }}
          />
        ))}
      </span>
    </div>
  );
}

// ─── Conversation input ───────────────────────────────────────────────────────

interface ConversationInputProps {
  onSubmit: (v: string) => void;
  disabled: boolean;
}

function ConversationInput({ onSubmit, disabled }: ConversationInputProps) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div style={{ opacity: disabled ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      <textarea
        ref={ref}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={disabled ? 'Reading your answer…' : 'Write as much as you like…'}
        disabled={disabled}
        rows={3}
        className="k-field w-full resize-none p-3.5 text-[14px]"
        style={{ lineHeight: '1.7', caretColor: 'var(--ink)' }}
        aria-label="Your reply"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          Enter to send · Shift+Enter for a new line
        </span>
        <button
          className="k-btn k-btn-solid"
          onClick={() => {
            if (value.trim() && !disabled) {
              onSubmit(value.trim());
              setValue('');
            }
          }}
          disabled={disabled || !value.trim()}
          aria-label="Send reply"
        >
          Send <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { setOnboardingResult } = useOnboarding();
  const shouldReduce = useReducedMotion();

  const [started, setStarted] = useState(false);
  const [introValue, setIntroValue] = useState('');
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [profile, setProfile] = useState<Partial<OnboardingProfile>>(INITIAL_PROFILE);
  const [stage, setStage] = useState<OnboardingStage>('intro');
  const [isThinking, setIsThinking] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    setSubmitError(null);
    setIsThinking(true);

    if (!started) setStarted(true);

    // Anything that throws in here must still clear the thinking state — the
    // composer is disabled while it is true, so a stranded `true` deadlocks the
    // whole interview.
    try {
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

      if (result.nextStage === 'review') {
        setShowReview(true);
      }
    } catch {
      // Never surface the raw error: the reader needs a next action, not a stack.
      setSubmitError(SUBMIT_ERROR);
    } finally {
      setIsThinking(false);
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
      <div className="relative min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div className="nx-atmosphere" aria-hidden="true" />
        <IntroScreen
          value={introValue}
          onChange={setIntroValue}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // ── Conversation ─────────────────────────────────────────────────────────

  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="nx-atmosphere" aria-hidden="true" />

      {/* Masthead — on the dark room, no panel. */}
      <header className="relative z-10 flex-shrink-0">
        <div className="mx-auto flex w-full items-start justify-between gap-4 px-5 py-5 lg:px-8" style={{ maxWidth: '1400px' }}>
          <div>
            <div className="k-slug">Nexus</div>
            <StageProgress stage={stage} />
          </div>

          <button
            className="k-btn k-btn-outline lg:hidden"
            style={{ padding: '0.5rem 0.75rem' }}
            onClick={() => setShowMobileProfile(p => !p)}
            aria-label="Toggle profile preview"
            aria-expanded={showMobileProfile}
            aria-controls="onboarding-profile-sheet"
          >
            Profile
          </button>
        </div>
      </header>

      {/* Body — two sheets of stock on the room, conversation clearly primary. */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
        <div className="mx-auto flex h-full w-full gap-6 px-5 pb-6 lg:px-8" style={{ maxWidth: '1400px' }}>

          {/* Conversation sheet */}
          <section className="k-paper k-panel flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-8">
              <div className="space-y-8">

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

                {submitError && (
                  <div
                    className="k-well px-4 py-3"
                    style={{ borderLeft: '3px solid var(--accent-rose)', maxWidth: '36rem' }}
                    role="alert"
                  >
                    <div className="k-slug" style={{ color: 'var(--accent-rose)' }}>Not sent</div>
                    <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {submitError}
                    </p>
                  </div>
                )}

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
                      initial={shouldReduce ? false : { opacity: 0 }}
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

            {/* Composer */}
            {!showReview && (
              <div
                className="flex-shrink-0 px-5 py-5 sm:px-8"
                style={{ borderTop: '2px solid var(--k-edge)' }}
              >
                <ConversationInput onSubmit={handleSubmit} disabled={isThinking} />
              </div>
            )}
          </section>

          {/* Profile sheet — secondary, and narrower than the conversation. */}
          <aside
            className="k-paper k-panel hidden flex-shrink-0 overflow-y-auto p-6 lg:block"
            style={{ width: '340px' }}
            aria-label="Profile forming"
          >
            <ProfilePreview profile={profile} />
          </aside>
        </div>
      </div>

      {/* Mobile: the profile is a sheet pulled over the conversation, never a
          second column stacked under it. */}
      <AnimatePresence>
        {showMobileProfile && (
          <>
            <motion.div
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(6, 6, 12, 0.72)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMobileProfile(false)}
              aria-hidden="true"
            />
            <motion.div
              id="onboarding-profile-sheet"
              className="k-paper k-panel fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto px-5 pb-8 pt-5 lg:hidden"
              role="group"
              aria-label="Profile forming"
              initial={shouldReduce ? { opacity: 0 } : { y: '100%' }}
              animate={shouldReduce ? { opacity: 1 } : { y: 0 }}
              exit={shouldReduce ? { opacity: 0 } : { y: '100%' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <div className="mb-4 flex justify-end">
                <button
                  className="flex h-8 w-8 items-center justify-center"
                  style={{ color: 'var(--text-secondary)', border: '2px solid var(--border-default)' }}
                  onClick={() => setShowMobileProfile(false)}
                  aria-label="Close profile preview"
                >
                  <X size={14} />
                </button>
              </div>
              <ProfilePreview profile={profile} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

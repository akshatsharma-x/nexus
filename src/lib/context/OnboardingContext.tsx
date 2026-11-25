'use client';

import {
  createContext, useContext, useState, useEffect,
  type ReactNode,
} from 'react';
import type { OnboardingProfile, LearnerContext } from '@/lib/types';

interface OnboardingContextValue {
  onboardingProfile: OnboardingProfile | null;
  learnerContext: LearnerContext | null;
  setOnboardingResult: (profile: OnboardingProfile, context: LearnerContext) => void;
  clearOnboarding: () => void;
  hasCompletedOnboarding: boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

// Revive ISO date strings to Date objects after JSON.parse
function reviveDates(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(reviveDates);
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      result[key] = new Date(val);
    } else if (val && typeof val === 'object') {
      result[key] = reviveDates(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

/**
 * localStorage is user-editable and can hold anything that parses as JSON — a
 * bare string, a number, `null`, an array. `reviveDates` passes all of those
 * through unchanged, and adopting one would leave every consumer reading
 * `.profile` / `.goal` off a non-object. Only a plain object is accepted; the
 * rest fall back to "never onboarded".
 */
function asStoredObject<T>(parsed: unknown): T | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  return parsed as T;
}

/**
 * The branches this context feeds — every page's `liveContext` and the
 * recommendation and gap services — reach straight through these five keys, so
 * a payload written by an older build that is missing one is not usable as a
 * learner context. Half-adopting it renders a blank error screen; rejecting it
 * falls back to the demo persona, which is the same outcome as never having
 * onboarded. Only the top level is checked: nothing here can vouch for the
 * whole tree, and this is the shape whose absence actually throws.
 */
const CONTEXT_REQUIRED_KEYS = ['goal', 'profile', 'user', 'progress', 'behavior'] as const;

function asLearnerContext(parsed: unknown): LearnerContext | null {
  const obj = asStoredObject<Record<string, unknown>>(parsed);
  if (!obj) return null;
  for (const key of CONTEXT_REQUIRED_KEYS) {
    const val = obj[key];
    if (!val || typeof val !== 'object' || Array.isArray(val)) return null;
  }
  return obj as unknown as LearnerContext;
}

const PROFILE_KEY = 'nexus_onboarding_profile';
const CONTEXT_KEY = 'nexus_learner_context';

export function OnboardingContextProvider({ children }: { children: ReactNode }) {
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
  const [learnerContext, setLearnerContext] = useState<LearnerContext | null>(null);

  useEffect(() => {
    try {
      const ps = localStorage.getItem(PROFILE_KEY);
      const cs = localStorage.getItem(CONTEXT_KEY);
      const profile = ps ? asStoredObject<OnboardingProfile>(reviveDates(JSON.parse(ps))) : null;
      const context = cs ? asLearnerContext(reviveDates(JSON.parse(cs))) : null;
      if (profile) setOnboardingProfile(profile);
      if (context) setLearnerContext(context);
    } catch {
      // localStorage may be unavailable (SSR, private browsing) — silently skip
    }
  }, []);

  const setOnboardingResult = (profile: OnboardingProfile, context: LearnerContext) => {
    setOnboardingProfile(profile);
    setLearnerContext(context);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
    } catch {
      // ignore write failures
    }
  };

  const clearOnboarding = () => {
    setOnboardingProfile(null);
    setLearnerContext(null);
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(CONTEXT_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingProfile,
        learnerContext,
        setOnboardingResult,
        clearOnboarding,
        hasCompletedOnboarding: !!onboardingProfile,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingContextProvider');
  return ctx;
}

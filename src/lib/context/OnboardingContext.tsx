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

const PROFILE_KEY = 'nexus_onboarding_profile';
const CONTEXT_KEY = 'nexus_learner_context';

export function OnboardingContextProvider({ children }: { children: ReactNode }) {
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
  const [learnerContext, setLearnerContext] = useState<LearnerContext | null>(null);

  useEffect(() => {
    try {
      const ps = localStorage.getItem(PROFILE_KEY);
      const cs = localStorage.getItem(CONTEXT_KEY);
      if (ps) setOnboardingProfile(reviveDates(JSON.parse(ps)) as OnboardingProfile);
      if (cs) setLearnerContext(reviveDates(JSON.parse(cs)) as LearnerContext);
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

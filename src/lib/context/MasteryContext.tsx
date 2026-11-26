'use client';

import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import { SKILL_MASTERIES } from '@/lib/data/seed';
import { MasteryService } from '@/lib/services/mastery';
import { useOnboarding } from '@/lib/context/OnboardingContext';
import type { SkillMastery, AssessmentResult, LearnerContext } from '@/lib/types';

const STORAGE_KEY = 'nexus_mastery_state';

/**
 * Where mastery starts before anything has been assessed — the onboarding → app
 * handoff. An onboarded learner's self-reported skills are their real starting
 * point; the demo persona's masteries are only the fallback for someone who
 * never onboarded, or who cleared their profile.
 */
function baselineMasteries(learnerContext: LearnerContext | null): SkillMastery[] {
  return learnerContext?.masteries ?? SKILL_MASTERIES;
}

interface MasteryContextValue {
  masteries: SkillMastery[];
  loaded: boolean;
  applyResult: (result: AssessmentResult) => void;
  getMastery: (skillId: string) => SkillMastery | undefined;
}

const MasteryContext = createContext<MasteryContextValue | null>(null);

function parseMasteries(raw: string): SkillMastery[] {
  const parsed = JSON.parse(raw) as SkillMastery[];
  return parsed.map(m => ({
    ...m,
    lastPracticed: new Date(m.lastPracticed as unknown as string),
    assessedAt: m.assessedAt ? new Date(m.assessedAt as unknown as string) : undefined,
  }));
}

export function MasteryProvider({ children }: { children: ReactNode }) {
  const { learnerContext } = useOnboarding();
  // Assessment-derived state, once written, outranks every baseline. `null` means
  // nothing has been assessed yet — which is exactly what selects the baseline below.
  const [assessed, setAssessed] = useState<SkillMastery[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only; read after hydration so the server and first client render agree
      if (raw) setAssessed(parseMasteries(raw));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  // Derived, not stored: there is still exactly one mastery source in this app,
  // and no effect is needed to react to OnboardingContext hydrating after this
  // provider does.
  const masteries = assessed ?? baselineMasteries(learnerContext);

  const applyResult = useCallback((result: AssessmentResult) => {
    setAssessed(prev => {
      const updated = MasteryService.applyAssessmentResult(
        result,
        prev ?? baselineMasteries(learnerContext),
      );
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, [learnerContext]);

  const getMastery = useCallback((skillId: string) => {
    return masteries.find(m => m.skillId === skillId);
  }, [masteries]);

  return (
    <MasteryContext.Provider value={{ masteries, loaded, applyResult, getMastery }}>
      {children}
    </MasteryContext.Provider>
  );
}

export function useMastery(): MasteryContextValue {
  const ctx = useContext(MasteryContext);
  if (!ctx) throw new Error('useMastery must be used inside MasteryProvider');
  return ctx;
}

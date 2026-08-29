'use client';

import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import { SKILL_MASTERIES } from '@/lib/data/seed';
import { MasteryService } from '@/lib/services/mastery';
import type { SkillMastery, AssessmentResult } from '@/lib/types';

const STORAGE_KEY = 'nexus_mastery_state';

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
  const [masteries, setMasteries] = useState<SkillMastery[]>(SKILL_MASTERIES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMasteries(parseMasteries(raw));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const applyResult = useCallback((result: AssessmentResult) => {
    setMasteries(prev => {
      const updated = MasteryService.applyAssessmentResult(result, prev);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

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

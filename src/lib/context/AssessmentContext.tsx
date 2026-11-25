'use client';

import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import type { AssessmentResult } from '@/lib/types';

const STORAGE_KEY = 'nexus_assessment_results';

export interface PerSkillPercent {
  skillId: string;
  percent: number;
}

export interface StoredResult {
  result: AssessmentResult;
  perSkillPercents: PerSkillPercent[];
}

interface AssessmentContextValue {
  loaded: boolean;
  storedResults: Record<string, StoredResult>;
  saveResult: (
    assessmentId: string,
    result: AssessmentResult,
    perSkillPercents: PerSkillPercent[],
  ) => void;
  getStoredResult: (assessmentId: string) => StoredResult | undefined;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

function parseStoredResults(raw: string): Record<string, StoredResult> {
  const parsed = JSON.parse(raw) as Record<string, StoredResult>;
  return Object.fromEntries(
    Object.entries(parsed).map(([id, sr]) => [
      id,
      {
        ...sr,
        result: {
          ...sr.result,
          completedAt: new Date(sr.result.completedAt as unknown as string),
        },
      },
    ])
  );
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [storedResults, setStoredResults] = useState<Record<string, StoredResult>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only; read after hydration so the server and first client render agree
      if (raw) setStoredResults(parseStoredResults(raw));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const saveResult = useCallback((
    assessmentId: string,
    result: AssessmentResult,
    perSkillPercents: PerSkillPercent[],
  ) => {
    setStoredResults(prev => {
      const next = { ...prev, [assessmentId]: { result, perSkillPercents } };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const getStoredResult = useCallback((assessmentId: string) => {
    return storedResults[assessmentId];
  }, [storedResults]);

  return (
    <AssessmentContext.Provider value={{ loaded, storedResults, saveResult, getStoredResult }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessmentResults(): AssessmentContextValue {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessmentResults must be used inside AssessmentProvider');
  return ctx;
}

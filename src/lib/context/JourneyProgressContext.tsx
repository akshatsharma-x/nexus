'use client';

import {
  createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode,
} from 'react';
import { ACTIVE_PATH } from '@/lib/data/seed';
import { useOnboarding } from '@/lib/context/OnboardingContext';
import type { LearnerContext, PathNodeStatus } from '@/lib/types';

const STORAGE_KEY = 'nexus_journey_progress';
const RESOURCE_STORAGE_KEY = 'nexus_resource_started';

interface JourneyProgressContextValue {
  nodeStatuses: Record<string, PathNodeStatus>;
  startedResources: Record<string, boolean>;
  completeNode: (nodeId: string) => void;
  startResource: (resourceId: string) => void;
  progressPercent: number;
  completedCount: number;
  totalCount: number;
}

const JourneyProgressContext = createContext<JourneyProgressContextValue | null>(null);

function seedStatuses(): Record<string, PathNodeStatus> {
  return Object.fromEntries(ACTIVE_PATH.nodes.map(n => [n.id, n.status]));
}

/**
 * Where the path starts before anything is recorded — the same handoff
 * MasteryContext makes. The seed's statuses are the demo persona's history,
 * with three steps already in progress, so an onboarded learner who had
 * started nothing was shown work "already underway". They start the path
 * fresh instead: steps with no prerequisites open, the rest locked until
 * their conditions complete. Recorded progress outranks either baseline.
 */
function baselineStatuses(learnerContext: LearnerContext | null): Record<string, PathNodeStatus> {
  if (!learnerContext) return seedStatuses();
  return Object.fromEntries(
    ACTIVE_PATH.nodes.map(n => [n.id, n.unlockConditions.length === 0 ? 'available' : 'locked']),
  );
}

/**
 * localStorage is user-editable and can hold anything that parses as JSON —
 * including `null`, which reads back as valid JSON but is not a status map.
 * Anything that is not a plain object is discarded in favour of the seed.
 */
function asRecord<T>(parsed: unknown): Record<string, T> | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  return parsed as Record<string, T>;
}

function unlockNext(statuses: Record<string, PathNodeStatus>): Record<string, PathNodeStatus> {
  const updated = { ...statuses };
  for (const node of ACTIVE_PATH.nodes) {
    if (updated[node.id] === 'locked' && node.unlockConditions.length > 0) {
      const allMet = node.unlockConditions.every(id => updated[id] === 'completed');
      if (allMet) updated[node.id] = 'available';
    }
  }
  return updated;
}

export function JourneyProgressProvider({ children }: { children: ReactNode }) {
  const { learnerContext } = useOnboarding();
  // Only what the learner has actually recorded; null until they record
  // something, which is what lets the baseline follow who the learner is.
  const [recorded, setRecorded] = useState<Record<string, PathNodeStatus> | null>(null);
  const [startedResources, setStartedResources] = useState<Record<string, boolean>>({});
  const statuses = useMemo(
    () => recorded ?? baselineStatuses(learnerContext),
    [recorded, learnerContext],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored = raw ? asRecord<PathNodeStatus>(JSON.parse(raw)) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only; read after hydration so the server and first client render agree
      if (stored) setRecorded(stored);
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem(RESOURCE_STORAGE_KEY);
      const stored = raw ? asRecord<boolean>(JSON.parse(raw)) : null;
      if (stored) setStartedResources(stored);
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((s: Record<string, PathNodeStatus>) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, []);

  const completeNode = useCallback((nodeId: string) => {
    setRecorded(prev => {
      const next = unlockNext({ ...(prev ?? baselineStatuses(learnerContext)), [nodeId]: 'completed' });
      persist(next);
      return next;
    });
  }, [persist, learnerContext]);

  const startResource = useCallback((resourceId: string) => {
    setStartedResources(prev => {
      const next = { ...prev, [resourceId]: true };
      try { localStorage.setItem(RESOURCE_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const completedCount = Object.values(statuses).filter(s => s === 'completed').length;
  const totalCount = ACTIVE_PATH.nodes.length;
  const progressPercent = Math.round((completedCount / Math.max(totalCount, 1)) * 100);

  return (
    <JourneyProgressContext.Provider
      value={{ nodeStatuses: statuses, startedResources, completeNode, startResource, progressPercent, completedCount, totalCount }}
    >
      {children}
    </JourneyProgressContext.Provider>
  );
}

export function useJourneyProgress(): JourneyProgressContextValue {
  const ctx = useContext(JourneyProgressContext);
  if (!ctx) throw new Error('useJourneyProgress must be used inside JourneyProgressProvider');
  return ctx;
}

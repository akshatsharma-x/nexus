'use client';

import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import { ACTIVE_PATH } from '@/lib/data/seed';
import type { PathNodeStatus } from '@/lib/types';

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
  const [statuses, setStatuses] = useState<Record<string, PathNodeStatus>>(seedStatuses);
  const [startedResources, setStartedResources] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStatuses(JSON.parse(raw) as Record<string, PathNodeStatus>);
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem(RESOURCE_STORAGE_KEY);
      if (raw) setStartedResources(JSON.parse(raw) as Record<string, boolean>);
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((s: Record<string, PathNodeStatus>) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, []);

  const completeNode = useCallback((nodeId: string) => {
    setStatuses(prev => {
      const next = unlockNext({ ...prev, [nodeId]: 'completed' });
      persist(next);
      return next;
    });
  }, [persist]);

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

'use client';

import {
  createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode,
} from 'react';
import { PROJECTS } from '@/lib/data/seed';
import { useOnboarding } from '@/lib/context/OnboardingContext';
import type { LearnerContext } from '@/lib/types';

type ProjectStatus = 'not_started' | 'in_progress' | 'completed';

export interface ProjectEntry {
  status: ProjectStatus;
  startedAt?: string;
  completedAt?: string;
}

type ProjectState = Record<string, ProjectEntry>;

interface ProjectContextValue {
  projectState: ProjectState;
  loaded: boolean;
  startProject: (projectId: string) => void;
  completeProject: (projectId: string) => void;
  getStatus: (projectId: string) => ProjectStatus;
  getEntry: (projectId: string) => ProjectEntry | undefined;
}

const STORAGE_KEY = 'nexus_project_progress';

const ProjectContext = createContext<ProjectContextValue | null>(null);

/**
 * localStorage is user-editable and can hold anything that parses as JSON —
 * including `null`, which reads back as valid JSON but is not a project map.
 * Anything that is not a plain object is discarded in favour of the seed.
 */
function asProjectState(parsed: unknown): ProjectState | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  return parsed as ProjectState;
}

function seedState(): ProjectState {
  const state: ProjectState = {};
  for (const p of PROJECTS) {
    const status: ProjectStatus = p.status === 'submitted' ? 'completed' : p.status;
    const entry: ProjectEntry = { status };
    if (p.completedAt) entry.completedAt = p.completedAt.toISOString();
    state[p.id] = entry;
  }
  return state;
}

/**
 * The seed's project history belongs to the demo persona — one project in
 * progress, one completed, 600 XP earned. An onboarded learner has begun
 * none of them, so their baseline is empty; recorded progress outranks both.
 */
function baselineState(learnerContext: LearnerContext | null): ProjectState {
  return learnerContext ? {} : seedState();
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { learnerContext } = useOnboarding();
  const [recorded, setRecorded] = useState<ProjectState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const state = useMemo(() => recorded ?? baselineState(learnerContext), [recorded, learnerContext]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored = raw ? asProjectState(JSON.parse(raw)) : null;
      if (stored) setRecorded(stored);
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const persist = useCallback((s: ProjectState) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, []);

  const startProject = useCallback((projectId: string) => {
    setRecorded(prev => {
      const base = prev ?? baselineState(learnerContext);
      const entry = base[projectId];
      if (entry?.status === 'completed' || entry?.status === 'in_progress') return prev;
      const next: ProjectState = {
        ...base,
        [projectId]: { status: 'in_progress', startedAt: new Date().toISOString() },
      };
      persist(next);
      return next;
    });
  }, [persist, learnerContext]);

  const completeProject = useCallback((projectId: string) => {
    setRecorded(prev => {
      const base = prev ?? baselineState(learnerContext);
      const entry = base[projectId];
      if (entry?.status === 'completed') return prev;
      const next: ProjectState = {
        ...base,
        [projectId]: { ...(entry ?? {}), status: 'completed', completedAt: new Date().toISOString() },
      };
      persist(next);
      return next;
    });
  }, [persist, learnerContext]);

  const getStatus = useCallback((projectId: string): ProjectStatus => {
    return state[projectId]?.status ?? 'not_started';
  }, [state]);

  const getEntry = useCallback((projectId: string): ProjectEntry | undefined => {
    return state[projectId];
  }, [state]);

  return (
    <ProjectContext.Provider value={{ projectState: state, loaded, startProject, completeProject, getStatus, getEntry }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectProgress(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectProgress must be used inside ProjectProvider');
  return ctx;
}

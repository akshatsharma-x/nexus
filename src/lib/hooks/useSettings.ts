'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_SETTINGS, SETTINGS_EVENT, loadSettings, saveSettings, sanitizeSettings,
  type NexusSettings,
} from '@/lib/settings';

/**
 * Read-only settings access for pages that consume preferences (e.g. Tutor).
 *
 * Starts from DEFAULT_SETTINGS so server and first client render agree, then
 * hydrates from localStorage in an effect. `loaded` tells callers whether the
 * values are the real stored ones yet.
 *
 * Stays in sync with the Settings page via a same-tab custom event, and with
 * other tabs via the native `storage` event.
 */
export function useStoredSettings(): { settings: NexusSettings; loaded: boolean } {
  const [settings, setSettings] = useState<NexusSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setLoaded(true);

    const onSameTab = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSettings(detail ? sanitizeSettings(detail) : loadSettings());
    };
    const onOtherTab = () => setSettings(loadSettings());

    window.addEventListener(SETTINGS_EVENT, onSameTab);
    window.addEventListener('storage', onOtherTab);
    return () => {
      window.removeEventListener(SETTINGS_EVENT, onSameTab);
      window.removeEventListener('storage', onOtherTab);
    };
  }, []);

  return { settings, loaded };
}

export interface EditableSettings {
  /** Current draft values shown in the form. */
  draft: NexusSettings;
  /** True once stored values have hydrated. */
  loaded: boolean;
  /** True when the draft differs from what is persisted. */
  dirty: boolean;
  /** Update one field of the draft. */
  set: <K extends keyof NexusSettings>(key: K, value: NexusSettings[K]) => void;
  /** Persist the draft. Returns false if storage was unavailable. */
  commit: () => boolean;
  /** Discard draft edits and return to the persisted values. */
  reset: () => void;
}

/**
 * Draft-and-commit settings editing for the Settings page.
 *
 * The page has an explicit "Save Changes" button, so edits are held in a draft
 * until `commit()` — that keeps the existing button meaningful rather than
 * making it decorative next to auto-saving controls.
 */
export function useEditableSettings(): EditableSettings {
  const [saved, setSaved] = useState<NexusSettings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<NexusSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = loadSettings();
    setSaved(stored);
    setDraft(stored);
    setLoaded(true);
  }, []);

  const set = useCallback(<K extends keyof NexusSettings>(key: K, value: NexusSettings[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  }, []);

  const commit = useCallback(() => {
    const ok = saveSettings(draft);
    if (ok) setSaved(draft);
    return ok;
  }, [draft]);

  const reset = useCallback(() => setDraft(saved), [saved]);

  const dirty = (Object.keys(draft) as Array<keyof NexusSettings>)
    .some(k => draft[k] !== saved[k]);

  return { draft, loaded, dirty, set, commit, reset };
}

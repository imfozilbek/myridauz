import { useCallback, useState } from 'react';

// A form kept on this phone for 24 hours (owner's decision 02.10.2026, docs/94 F3): closed by
// Telegram or by the system, it comes back as it was; sent, it is gone.
const DAY_MS = 24 * 60 * 60 * 1000;
const PREFIX = 'draft:';

type Stored = { readonly at: number; readonly value: unknown };
// A draft from an older version of the app may not fit: the form checks it, a stranger is dropped.
export type DraftCheck<T> = (value: unknown) => T | null;

function read<T>(key: string, check: DraftCheck<T>, now: number): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    const value = now - stored.at < DAY_MS ? check(stored.value) : null;
    if (value !== null) return value;
    localStorage.removeItem(PREFIX + key);
  } catch {
    // No storage on this phone or a broken copy: the form starts empty.
  }
  return null;
}

export function writeDraft(key: string, value: unknown, now = Date.now()) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ at: now, value }));
  } catch {
    // No storage on this phone: the draft lives only while the app is open.
  }
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing kept, nothing to clear.
  }
}

// restored: the form came back from a draft, the screen says «Oldingi yozganingiz tiklandi.».
export function useDraft<T>(key: string, check: DraftCheck<T>) {
  const [restored] = useState(() => read(key, check, Date.now()));
  const save = useCallback((value: T) => writeDraft(key, value), [key]);
  const clear = useCallback(() => clearDraft(key), [key]);
  return { restored, save, clear };
}

import { cloudStorage } from '@telegram-apps/sdk-react';

// Small values of a person, kept by Telegram CloudStorage on all their phones; this phone keeps a copy,
// so a screen reads it at once (docs/88 L12). No storage (a private window): nothing is kept.
const LEGACY = { 'way.recent': 'way_recent', 'way.navigator': 'way_navigator' } as const;
const KEYS = [
  'way_recent',
  'way_navigator',
  'driver_approval_seen',
  'route_recent',
  'book_points',
  'way_saved',
] as const;
export type StoredKey = (typeof KEYS)[number];

export function readStored(key: StoredKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: StoredKey, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // No storage on this phone: the cloud still keeps it.
  }
  void cloudStorage.setItem.ifAvailable(key, value)?.[1]?.catch(() => undefined);
}

// At the start: an old key of this phone moves to its new name, then the cloud wins over the copy;
// a value only this phone has goes up to the cloud, so nothing is lost.
export async function syncFromCloud() {
  for (const [old, key] of Object.entries(LEGACY)) moveLegacy(old, key);
  for (const key of KEYS) {
    const remote = await cloudStorage.getItem.ifAvailable(key)?.[1]?.catch(() => '');
    const local = readStored(key);
    if (remote) writeLocal(key, remote);
    else if (local) writeStored(key, local);
  }
}

function moveLegacy(old: string, key: string) {
  try {
    const value = localStorage.getItem(old);
    if (value !== null && localStorage.getItem(key) === null) localStorage.setItem(key, value);
    localStorage.removeItem(old);
  } catch {
    // No storage: nothing to move.
  }
}

function writeLocal(key: StoredKey, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // No storage: the screen asks again.
  }
}

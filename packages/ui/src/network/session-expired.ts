import { useSyncExternalStore } from 'react';

// Telegram signs the launch data of a Mini App for 24 hours (docs/47). After that every request is
// refused with auth.expired: only a new launch helps, so the whole app says it at once (G43).
let expired = false;
const listeners = new Set<() => void>();

export function markExpired(): void {
  if (expired) return;
  expired = true;
  listeners.forEach((listener) => listener());
}

const subscribe = (changed: () => void) => {
  listeners.add(changed);
  return () => listeners.delete(changed);
};

export const useExpired = () => useSyncExternalStore(subscribe, () => expired);

import { useEffect, useRef } from 'react';

// A refusal about the person, a block or a deleted account, while the app is open: the gate asks the
// server who they are again and shows it, instead of «try again later» on every tap (G89 U12).
export const ABOUT_PERSON: readonly string[] = ['users.blocked', 'users.not_registered'];
const listeners = new Set<() => void>();

export const askAccountAgain = () => listeners.forEach((listener) => listener());

export function useAccountAgain(onAsk: () => void): void {
  const latest = useRef(onAsk);
  useEffect(() => {
    latest.current = onAsk;
  });
  useEffect(() => {
    const listener = () => latest.current();
    listeners.add(listener);
    return () => void listeners.delete(listener);
  }, []);
}

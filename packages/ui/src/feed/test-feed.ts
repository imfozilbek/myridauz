import { act } from '@testing-library/react';

// Test helper: a channel the test fires, "another person changed something" (docs/64).
export function testFeed() {
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => (
    listeners.add(listener),
    () => void listeners.delete(listener)
  );
  return { subscribe, fire: () => act(() => listeners.forEach((listener) => listener())) };
}

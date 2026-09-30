import { createContext, useContext, useEffect, useRef } from 'react';

export type Subscribe = (listener: () => void) => () => void;

// Without the channel (tests, a screen outside the app) nothing changes by itself.
export const FeedContext = createContext<Subscribe>(() => () => undefined);

// onChange runs when another person changed something or the person came back to the app (docs/64).
export function useFeedChange(onChange: () => void): void {
  const subscribe = useContext(FeedContext);
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });
  useEffect(() => subscribe(() => latest.current()), [subscribe]);
}

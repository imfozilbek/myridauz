import { createContext, useContext, useEffect, useRef } from 'react';

export type Subscribe = (listener: () => void) => () => void;
export type SubscribeCall = (listener: (chat: string) => void) => () => void;

// Without the channel (tests, a screen outside the app) nothing changes by itself.
export const FeedContext = createContext<Subscribe>(() => () => undefined);
export const FeedCallContext = createContext<SubscribeCall>(() => () => undefined);

// onChange runs when another person changed something or the person came back to the app (docs/64).
export function useFeedChange(onChange: () => void): void {
  const subscribe = useContext(FeedContext);
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });
  useEffect(() => subscribe(() => latest.current()), [subscribe]);
}

// onCall runs when a call rings for this person in a chat that is not open (docs/115).
export function useFeedCall(onCall: (chat: string) => void): void {
  const subscribe = useContext(FeedCallContext);
  const latest = useRef(onCall);
  useEffect(() => {
    latest.current = onCall;
  });
  useEffect(() => subscribe((chat) => latest.current(chat)), [subscribe]);
}

import { feedEventSchema, type FeedEvent } from '@platform/contracts';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { FeedCallContext, FeedContext, type Subscribe, type SubscribeCall } from './feed-context';

const FIRST_PAUSE_MS = 1000;
const MAX_PAUSE_MS = 30_000;
// Signals closer than this are one change for the screens.
const SETTLE_MS = 300;

type FeedProviderProps = {
  // The address of the personal socket with a fresh ticket (docs/64).
  readonly connect: () => Promise<string>;
  // The person came back to the app: the screen refreshes even if a signal was missed.
  readonly onWake: (listener: () => void) => () => void;
  // A bot message reached this person: the notification of the brand plays (docs/115).
  readonly onSignal?: () => void;
  readonly children: ReactNode;
};

const eventOf = (data: string): FeedEvent | null => {
  try {
    return feedEventSchema.safeParse(JSON.parse(data)).data ?? null;
  } catch {
    return null;
  }
};

// One socket per Mini App (G19): "something changed" refreshes the open screen quietly.
// A lost socket comes back after a pause that grows up to 30 seconds.
export function FeedProvider({ connect, onWake, onSignal, children }: FeedProviderProps) {
  const listeners = useMemo(() => new Set<() => void>(), []);
  const callListeners = useMemo(() => new Set<(chat: string) => void>(), []);
  const subscribeCall = useCallback<SubscribeCall>(
    (listener) => {
      callListeners.add(listener);
      return () => void callListeners.delete(listener);
    },
    [callListeners],
  );
  const signal = useRef(onSignal);
  signal.current = onSignal;
  const subscribe = useCallback<Subscribe>(
    (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    [listeners],
  );
  useEffect(() => {
    // One return to the app comes as two signals (the browser and Telegram), and changes come in
    // bursts: the screens refresh once for them all, not twice in a row (G41, docs/108 F).
    let settle: ReturnType<typeof setTimeout> | undefined;
    const changed = () => {
      clearTimeout(settle);
      settle = setTimeout(() => [...listeners].forEach((listener) => listener()), SETTLE_MS);
    };
    let socket: WebSocket | null = null;
    // A socket that opens again may have missed signals while it was lost: the screens catch up.
    let wasOpen = false;
    let connecting = false;
    let stopped = false;
    let pause = FIRST_PAUSE_MS;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const retry = () => {
      if (stopped) return;
      clearTimeout(timer);
      timer = setTimeout(open, pause);
      pause = Math.min(pause * 2, MAX_PAUSE_MS);
    };
    function open() {
      if (stopped || socket || connecting) return;
      connecting = true;
      connect().then(
        (url) => {
          connecting = false;
          if (stopped) return;
          const ws = new WebSocket(url);
          socket = ws;
          ws.addEventListener('open', () => {
            pause = FIRST_PAUSE_MS;
            if (wasOpen) changed();
            wasOpen = true;
          });
          ws.addEventListener('message', (message: MessageEvent<string>) => {
            const event = eventOf(message.data);
            if (event?.type === 'call') callListeners.forEach((listener) => listener(event.chat));
            if (event?.type !== 'changed') return;
            signal.current?.();
            changed();
          });
          ws.addEventListener('close', () => {
            socket = null;
            retry();
          });
        },
        () => {
          connecting = false;
          retry();
        },
      );
    }
    open();
    const stopWake = onWake(() => {
      changed();
      if (socket) return;
      pause = FIRST_PAUSE_MS;
      clearTimeout(timer);
      open();
    });
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(settle);
      stopWake();
      socket?.close();
    };
  }, [connect, onWake, listeners, callListeners]);
  return (
    <FeedContext.Provider value={subscribe}>
      <FeedCallContext.Provider value={subscribeCall}>{children}</FeedCallContext.Provider>
    </FeedContext.Provider>
  );
}

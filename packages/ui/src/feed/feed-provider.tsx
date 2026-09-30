import { feedEventSchema } from '@platform/contracts';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { FeedContext, type Subscribe } from './feed-context';

const FIRST_PAUSE_MS = 1000;
const MAX_PAUSE_MS = 30_000;

type FeedProviderProps = {
  // The address of the personal socket with a fresh ticket (docs/64).
  readonly connect: () => Promise<string>;
  // The person came back to the app: the screen refreshes even if a signal was missed.
  readonly onWake: (listener: () => void) => () => void;
  readonly children: ReactNode;
};

const isChanged = (data: string) => {
  try {
    return feedEventSchema.safeParse(JSON.parse(data)).success;
  } catch {
    return false;
  }
};

// One socket per Mini App (G19): "something changed" refreshes the open screen quietly.
// A lost socket comes back after a pause that grows up to 30 seconds.
export function FeedProvider({ connect, onWake, children }: FeedProviderProps) {
  const listeners = useMemo(() => new Set<() => void>(), []);
  const subscribe = useCallback<Subscribe>(
    (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    [listeners],
  );
  useEffect(() => {
    const changed = () => [...listeners].forEach((listener) => listener());
    let socket: WebSocket | null = null;
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
          ws.addEventListener('open', () => void (pause = FIRST_PAUSE_MS));
          ws.addEventListener('message', (event: MessageEvent<string>) => isChanged(event.data) && changed());
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
      stopWake();
      socket?.close();
    };
  }, [connect, onWake, listeners]);
  return <FeedContext.Provider value={subscribe}>{children}</FeedContext.Provider>;
}

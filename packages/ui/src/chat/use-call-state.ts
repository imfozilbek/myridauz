import type { CallEnding, CallTrack, CallView, ChatServerEvent } from '@platform/contracts';
import { useCallback, useRef, useState } from 'react';

type CallEvent = Extract<ChatServerEvent, { type: 'call' | 'callEnded' | 'callTrack' }>;

// How a call cut without a word ended, as the server says it: a talk is over, the rest failed.
const endingOf = (call: CallView): CallEnding => (call.status === 'active' ? 'ended' : 'failed');

// The voice call of a chat (docs/08): open after the confirmation, its state, how it ended.
// A call gone with the socket (the app slept, the network dropped) still says it ended (docs/94 C4).
export function useCallState() {
  const [canCall, setCanCall] = useState(false);
  const [call, setCall] = useState<CallView | null>(null);
  const [ended, setEnded] = useState<CallEnding | null>(null);
  const shown = useRef<CallView | null>(null);
  const onTrack = useRef<(track: CallTrack) => void>(() => undefined);
  const show = useCallback((next: CallView | null) => {
    const was = shown.current;
    shown.current = next;
    setCall(next);
    if (next) setEnded(null);
    else if (was) setEnded(endingOf(was));
  }, []);
  const handle = useCallback(
    (event: CallEvent) => {
      if (event.type === 'call') show(event.call);
      else if (event.type === 'callEnded') setEnded(event.reason);
      else onTrack.current(event.track);
    },
    [show],
  );
  return {
    canCall,
    setCanCall,
    call,
    ended,
    onTrack,
    handle,
    // The socket is gone: so is the call on the server.
    lost: useCallback(() => show(null), [show]),
    dismiss: useCallback(() => setEnded(null), []),
  };
}

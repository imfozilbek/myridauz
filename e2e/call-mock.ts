import type { WebSocketRoute } from '@playwright/test';

// The chat's side of a voice call (G13, docs/08): a ring that nobody answers, an answered call.
const say = (ws: WebSocketRoute, event: object) => ws.send(JSON.stringify(event));
let missedId = 100;

export function playCall(ws: WebSocketRoute, action: string): void {
  if (action === 'ring') say(ws, { type: 'call', call: { status: 'ringing', caller: 'me' } });
  if (action === 'accept') say(ws, { type: 'call', call: { status: 'active', caller: 'other' } });
  if (action !== 'end') return;
  say(ws, { type: 'call', call: null });
  say(ws, { type: 'callEnded', reason: 'missed' });
  missedId += 1;
  say(ws, {
    type: 'message',
    message: { id: missedId, author: 'system', text: '', event: 'missed_call', at: Date.now() },
  });
}

// A microphone and Realtime that answer at once: the screens, not the voice, are shot.
export const FAKE_MEDIA = `
  navigator.mediaDevices.getUserMedia = async () => {
    const context = new AudioContext();
    return context.createMediaStreamDestination().stream;
  };
`;

import { chatClientEventSchema } from '@platform/contracts';
import { callAction, callTrack } from './call-room';
import type { ChatSocket, RoomDeps } from './ports';
import { sendText } from './room';

// One event from the socket of a person: a text or a step of a call (docs/07, docs/08).
export async function received(deps: RoomDeps, from: ChatSocket, raw: string): Promise<void> {
  const parsed = chatClientEventSchema.safeParse(safeJson(raw));
  if (!parsed.success) return;
  const event = parsed.data;
  if (event.type === 'send') return sendText(deps, from, event.text);
  if (event.type === 'call') return callAction(deps, from, event.action);
  callTrack(deps, from, event.track);
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

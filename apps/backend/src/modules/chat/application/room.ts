import { type ChatMessage, type ChatServerEvent, type ChatSystemEvent } from '@platform/contracts';
import { maskContacts } from '../domain/mask';
import { callView } from './call-view';
import {
  otherRole,
  SYSTEM_AUTHOR,
  type ChatSocket,
  type Member,
  type RoomDeps,
  type StoredMessage,
} from './ports';

const HISTORY = 100;
// The bot says "Yangi xabar" at most once in this time per person and chat: no flood.
const NOTIFY_PAUSE_MS = 5 * 60 * 1000;
// One person sends at most this many messages a minute: a flood never reaches the other side (G42).
export const MAX_PER_MINUTE = 30;
const MINUTE_MS = 60 * 1000;
// Every third hidden contact from one person reaches the moderators (docs/07, docs/17).
const ATTEMPTS_STEP = 3;

const view = (message: StoredMessage, userId: number): ChatMessage => ({
  id: message.id,
  author: message.author === SYSTEM_AUTHOR ? 'system' : message.author === userId ? 'me' : 'other',
  text: message.text,
  event: message.event,
  at: message.at,
});
const send = (socket: ChatSocket, event: ChatServerEvent) => socket.send(JSON.stringify(event));
const broadcast = (deps: RoomDeps, message: StoredMessage) => {
  for (const socket of deps.sockets())
    send(socket, { type: 'message', message: view(message, socket.member.userId) });
};

// A person opened the chat: the latest messages, the oldest first; nothing is unread any more.
export async function joined(deps: RoomDeps, socket: ChatSocket): Promise<void> {
  const { userId, canCall } = socket.member;
  const messages = deps.store.recent(HISTORY).map((message) => view(message, userId));
  send(socket, { type: 'history', messages, canCall });
  const call = callView(deps.store.call(), userId);
  if (call) send(socket, { type: 'call', call });
  await deps.unread.clear(userId);
}

// A message from a person: contacts hidden, everyone in the chat sees it, the other one hears of it.
export async function sendText(deps: RoomDeps, from: ChatSocket, raw: string): Promise<void> {
  const { member } = from;
  const lastMinute = deps.store
    .recent(HISTORY)
    .filter((message) => message.author === member.userId && deps.now() - message.at < MINUTE_MS);
  if (lastMinute.length >= MAX_PER_MINUTE) return;
  const { text, masked } = maskContacts(raw);
  const message = deps.store.add({ author: member.userId, text, event: null, masked, at: deps.now() });
  broadcast(deps, message);
  if (masked) await hidden(deps, from);
  await tellOther(deps, member);
}

async function hidden(deps: RoomDeps, from: ChatSocket) {
  send(from, { type: 'warning' });
  const count = deps.store.maskedCount(from.member.userId);
  if (count % ATTEMPTS_STEP === 0) await deps.signals.contactAttempts(from.member.userId, deps.key, count);
}

async function tellOther(deps: RoomDeps, member: Member) {
  const there = deps.sockets().some((socket) => socket.member.userId === member.otherId);
  if (there) return;
  // Every message counts for the plate, the bot speaks only once in a while.
  await deps.unread.add({ userId: member.otherId, role: otherRole(member.role) });
  const last = deps.store.lastNotified(member.otherId);
  if (last !== null && deps.now() - last < NOTIFY_PAUSE_MS) return;
  deps.store.notified(member.otherId, deps.now());
  await deps.signals.newMessage({ userId: member.otherId, role: otherRole(member.role) }, deps.key);
}

// A line about the booking: requested, confirmed, declined, cancelled (docs/35).
export function systemEvent(deps: RoomDeps, event: ChatSystemEvent): void {
  const message = deps.store.add({ author: SYSTEM_AUTHOR, text: '', event, masked: false, at: deps.now() });
  broadcast(deps, message);
}

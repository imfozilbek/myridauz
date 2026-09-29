import type { CallAction, CallEnding, CallTrack, ChatServerEvent } from '@platform/contracts';
import { callView, inCall } from './call-view';
import { otherRole, type ChatSocket, type Member, type RoomDeps, type StoredCall } from './ports';
import { systemEvent } from './room';

// A voice call inside the chat of a booking (docs/08): ring, accept, connect, end. The chat is
// always the way back: a call that did not happen leaves a line in the chat and a bot message.
const send = (socket: ChatSocket, event: ChatServerEvent) => socket.send(JSON.stringify(event));
const present = (deps: RoomDeps, userId: number) => deps.sockets().some((s) => s.member.userId === userId);

function show(deps: RoomDeps, call: StoredCall | null) {
  deps.store.saveCall(call);
  for (const socket of deps.sockets())
    send(socket, { type: 'call', call: callView(call, socket.member.userId) });
}

async function end(deps: RoomDeps, call: StoredCall, reason: CallEnding) {
  deps.wakeAt(null);
  show(deps, null);
  for (const socket of deps.sockets()) send(socket, { type: 'callEnded', reason });
  if (reason !== 'missed' && reason !== 'failed') return;
  systemEvent(deps, 'missed_call');
  if (!present(deps, call.calleeId))
    await deps.signals.missedCall({ userId: call.calleeId, role: call.calleeRole }, deps.key);
}

// Hung up: a talk is over; a ring nobody took is missed; a call that never connected failed.
const endingOf = (call: StoredCall): CallEnding =>
  call.status === 'active' ? 'ended' : call.status === 'ringing' ? 'missed' : 'failed';

async function ring(deps: RoomDeps, from: ChatSocket, call: StoredCall | null) {
  const { member } = from;
  if (!member.canCall || call) return send(from, { type: 'call', call: callView(call, member.userId) });
  const calleeRole = otherRole(member.role);
  deps.wakeAt(deps.now() + deps.calls.ringMs);
  show(deps, { callerId: member.userId, calleeId: member.otherId, calleeRole, status: 'ringing' });
  if (!present(deps, member.otherId))
    await deps.signals.incomingCall({ userId: member.otherId, role: calleeRole }, deps.key);
}

export async function callAction(deps: RoomDeps, from: ChatSocket, action: CallAction): Promise<void> {
  const call = deps.store.call();
  if (action === 'ring') return ring(deps, from, call);
  const { userId } = from.member;
  if (!call || !inCall(call, userId)) return;
  const isCallee = call.calleeId === userId;
  if (action === 'accept' && isCallee && call.status === 'ringing') {
    deps.wakeAt(deps.now() + deps.calls.connectMs);
    return show(deps, { ...call, status: 'connecting' });
  }
  if (action === 'connected' && call.status === 'connecting') {
    deps.wakeAt(null);
    return show(deps, { ...call, status: 'active' });
  }
  if (action === 'decline' && isCallee && call.status === 'ringing') return end(deps, call, 'declined');
  if (action === 'failed') return end(deps, call, 'failed');
  if (action === 'end') return end(deps, call, endingOf(call));
}

// The published voice of one side goes to the other side only.
export function callTrack(deps: RoomDeps, from: ChatSocket, track: CallTrack): void {
  const call = deps.store.call();
  if (!call || !inCall(call, from.member.userId)) return;
  for (const socket of deps.sockets())
    if (socket.member.userId === from.member.otherId) send(socket, { type: 'callTrack', track });
}

// The wake-up: nobody answered in time, or the voice did not connect in time.
export async function callTimeout(deps: RoomDeps): Promise<void> {
  const call = deps.store.call();
  if (call && call.status !== 'active')
    await end(deps, call, call.status === 'ringing' ? 'missed' : 'failed');
}

// A person left the chat: a talk or a connecting call is broken; the caller gone means missed.
export async function callLeft(deps: RoomDeps, member: Member): Promise<void> {
  const call = deps.store.call();
  if (!call || !inCall(call, member.userId) || present(deps, member.userId)) return;
  if (call.status !== 'ringing') return end(deps, call, 'failed');
  if (call.callerId === member.userId) return end(deps, call, 'missed');
}

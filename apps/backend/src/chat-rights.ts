import type { Bindings } from './env';
import { chatMemberOf, ridingChatOf } from './modules/bookings';
import { callsReady } from './modules/calls';
import { wireChatRights } from './modules/chat';
import { isBlocked } from './modules/users';

// A side of a chat (docs/07, G89 C3): of its booking, offer or talk, not blocked; a person blocked on
// the road only in the chat of that trip (owner decision 10.10.2026). The call asks it.
export async function chatSide(env: Bindings, key: string, userId: number) {
  const member = await chatMemberOf(env, key, userId);
  if (!member) return null;
  if ((await isBlocked(env, userId)) && !(await ridingChatOf(env, key, userId))) return null;
  return member;
}

// Who may write and ring in a chat (G89 C1): the ticket asks it, and the chat room asks it again at
// each event of an open socket. A call button only where calls are set up.
export async function chatRights(env: Bindings, key: string, userId: number) {
  const member = await chatSide(env, key, userId);
  return member && { ...member, canCall: member.canCall && callsReady(env) };
}

wireChatRights(chatRights);

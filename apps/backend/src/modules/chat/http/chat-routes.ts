import {
  chatKeySchema,
  chatSocketPath,
  type ApiErrorCode,
  type ChatAbout,
  type ChatSystemEvent,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import type { Member } from '../application/ports';
import { signTicket, verifyTicket } from '../application/ticket';

// Who may open a chat: the bookings module knows (docs/07). null: not a member of this chat.
export type MemberOf = (env: Bindings, key: string, userId: number) => Promise<Member | null>;
// The booking, the request and the offer of the chat as this member sees them (G54, G64); null for a
// person who is not in it.
export type AboutOf = (env: Bindings, key: string, userId: number) => Promise<ChatAbout | null>;

const secretOf = (env: Bindings) => env.PASSENGER_BOT_TOKEN ?? '';
const fail = (code: ApiErrorCode, status: 400 | 403 | 503) => Response.json({ error: code }, { status });

// The signed API gives a ticket; the socket shows the ticket and goes to the chat's Durable Object.
export function chatRoutes(memberOf: MemberOf, aboutOf: AboutOf) {
  return (
    new Hono<AppEnv>()
      // Who calls and about which trip or request, on the chat and the call screen (G54, G64).
      .get('/chats/:key/about', async (context) => {
        const key = context.req.param('key');
        const about = chatKeySchema.safeParse(key).success
          ? await aboutOf(context.env, key, context.get('session').user.id)
          : null;
        return context.json(about ?? { booking: null, role: null, request: null, offer: null });
      })
      .post('/chats/:key/ticket', async (context) => {
        const key = context.req.param('key');
        if (!chatKeySchema.safeParse(key).success) return fail('chat.not_member', 403);
        const member = await memberOf(context.env, key, context.get('session').user.id);
        if (!member) return fail('chat.not_member', 403);
        const ticket = await signTicket(secretOf(context.env), key, member.userId, Date.now());
        const url = new URL(chatSocketPath(key), context.req.url);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.searchParams.set('ticket', ticket);
        return context.json({ url: url.toString() });
      })
      .get('/chats/:key/socket', async (context) => {
        const key = context.req.param('key');
        const userId = await verifyTicket(
          secretOf(context.env),
          key,
          context.req.query('ticket') ?? '',
          Date.now(),
        );
        // The other side is found again on the server: the ticket never names it.
        const member = userId === null ? null : await memberOf(context.env, key, userId);
        if (!member) return fail('chat.invalid_ticket', 403);
        if (context.req.header('upgrade') !== 'websocket') return fail('chat.invalid_ticket', 400);
        const chats = context.env.CHATS;
        if (!chats) return fail('chat.invalid_ticket', 503);
        const headers = new Headers(context.req.raw.headers);
        headers.set('x-chat-key', key);
        headers.set('x-chat-member', JSON.stringify(member));
        return chats.get(chats.idFromName(key)).fetch(new Request('https://chat/socket', { headers }));
      })
  );
}

// A line about the booking in its chat (docs/35). Without Durable Objects (tests) nothing happens.
export async function postSystemEvent(env: Bindings, key: string, event: ChatSystemEvent): Promise<void> {
  const chats = env.CHATS;
  if (!chats) return;
  try {
    await chats.get(chats.idFromName(key)).fetch(
      new Request('https://chat/system', {
        method: 'POST',
        headers: { 'x-chat-key': key },
        body: JSON.stringify({ event }),
      }),
    );
  } catch (error) {
    console.warn(JSON.stringify({ event: 'chat_system_failed', message: String(error) }));
  }
}

// "Maʼlumotlarimni oʻchirish" (docs/30): the messages of a chat go. Without Durable Objects nothing happens.
export async function forgetChat(env: Bindings, key: string): Promise<void> {
  const chats = env.CHATS;
  if (chats)
    await chats.get(chats.idFromName(key)).fetch(new Request('https://chat/forget', { method: 'POST' }));
}

import { CHATS_UNREAD_PATH, chatKeySchema, chatTextSchema, type ApiErrorCode } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv } from '../../../env';
import { lastUnread } from '../infrastructure/d1-unread';
import type { MemberOf } from './chat-routes';

const fail = (code: ApiErrorCode, status: 400 | 403 | 503) => Response.json({ error: code }, { status });

// The sheet «Yangi xabar» of the open Mini App (G68, docs/122): the last words of the unread chats
// of this side, and a ready answer («Yaxshi», «Kutaman») that goes without opening the chat.
export function chatSheetRoutes(memberOf: MemberOf) {
  return new Hono<AppEnv>()
    .get(CHATS_UNREAD_PATH, async (context) => {
      const { user, app } = context.get('session');
      const chats = app === 'admin' ? [] : await lastUnread(context.env, user.id, app);
      return context.json({ chats });
    })
    .post('/chats/:key/messages', async (context) => {
      const key = context.req.param('key');
      if (!chatKeySchema.safeParse(key).success) return fail('chat.not_member', 403);
      const member = await memberOf(context.env, key, context.get('session').user.id);
      if (!member) return fail('chat.not_member', 403);
      const input = chatTextSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail('chat.invalid_text', 400);
      const chats = context.env.CHATS;
      if (!chats) return fail('chat.not_member', 503);
      const headers = { 'x-chat-key': key, 'x-chat-member': JSON.stringify(member) };
      const room = chats.get(chats.idFromName(key));
      await room.fetch(new Request('https://chat/send', { method: 'POST', headers, body: input.data.text }));
      return new Response(null, { status: 204 });
    });
}

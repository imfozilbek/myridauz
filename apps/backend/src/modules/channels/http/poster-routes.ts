import { tashkentDate } from '@platform/contracts';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv, Bindings } from '../../../env';
import { recordServerEvent } from '../../analytics';
import { fromTelegram } from '../../../shared/telegram/webhook-secret';
import { lifeKey, moveOf } from '../application/channel-life';
import { heard, type HeardDeps, type MemberChange } from '../application/my-channels';

export const POSTER_WEBHOOK_PATH = '/telegram/poster';
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const SECOND_MS = 1000;
const IN_CHANNEL = ['creator', 'administrator', 'member'];

// Only the part of a chat_member update the bot of the posts reads.
const memberSchema = z.object({
  status: z.string(),
  is_member: z.boolean().optional(),
  user: z.object({ id: z.number(), is_bot: z.boolean().optional() }),
});
// A public channel has its name: the brand knows it as «@name» (G87).
const chatSchema = z.object({ id: z.number(), username: z.string().optional() });
// invite_link: the link the person joined by; an ad of the waitlist counts its own (G83, docs/184).
const updateSchema = z.object({
  chat_member: z
    .object({
      chat: chatSchema,
      date: z.number(),
      old_chat_member: memberSchema.optional(),
      new_chat_member: memberSchema,
      invite_link: z.object({ invite_link: z.string() }).optional(),
    })
    .optional(),
  // How many reactions a post has now (G87, docs/191): anonymous in a channel, the count only.
  message_reaction_count: z
    .object({
      chat: chatSchema,
      message_id: z.number(),
      date: z.number(),
      reactions: z.array(z.object({ total_count: z.number().int().nonnegative() })),
    })
    .optional(),
});
type Member = z.infer<typeof memberSchema>;
type Chat = z.infer<typeof chatSchema>;
// Anyone else who hears a join or a leave: the ad links of the waitlist (G83).
export type ChannelChange = MemberChange & { readonly invite: string | null };

const inChannel = (member: Member | undefined) =>
  member !== undefined && (IN_CHANNEL.includes(member.status) || member.is_member === true);
const keyOf = (chat: Chat) => lifeKey(chat.username ? `@${chat.username}` : String(chat.id));
// A failed count never makes Telegram send the update again: the life of a channel is only numbers.
const quietly = async (env: Bindings, write: () => Promise<void>) =>
  write().catch((error: unknown) => {
    console.error(JSON.stringify({ event: 'channel_life_failed', message: String(error) }));
    recordServerEvent(env, { name: 'server_error', source: 'poster', code: 'channel_life' });
  });

// The bot of the posts hears who joins or leaves a channel (docs/176) and the reactions of its posts
// (G87). Only requests with our secret_token are taken (docs/32); anything else is still answered
// 200, Telegram retries errors.
export const posterRoutes = (
  deps: (env: Bindings) => HeardDeps,
  changed: (env: Bindings, change: ChannelChange) => Promise<void>,
) =>
  new Hono<AppEnv>().post(POSTER_WEBHOOK_PATH, async (context) => {
    const secret = context.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || !context.env.POSTER_BOT_TOKEN) return context.body(null, NOT_FOUND);
    if (!fromTelegram(context.req, secret)) return context.body(null, UNAUTHORIZED);
    const update = updateSchema.safeParse(await context.req.json().catch(() => null));
    const change = update.success ? update.data.chat_member : undefined;
    const person = change?.new_chat_member;
    if (change && person && person.user.is_bot !== true) {
      const heardChange = {
        chat: String(change.chat.id),
        userId: person.user.id,
        member: inChannel(person),
        at: change.date * SECOND_MS,
      };
      await heard(deps(context.env), heardChange);
      await changed(context.env, { ...heardChange, invite: change.invite_link?.invite_link ?? null });
      const move = moveOf(inChannel(change.old_chat_member), heardChange.member);
      const day = tashkentDate(heardChange.at);
      if (move) await quietly(context.env, () => deps(context.env).life.moved(day, keyOf(change.chat), move));
    }
    const reaction = update.success ? update.data.message_reaction_count : undefined;
    if (reaction) {
      const count = reaction.reactions.reduce((sum, one) => sum + one.total_count, 0);
      const at = reaction.date * SECOND_MS;
      const { life } = deps(context.env);
      await quietly(context.env, () => life.reacted(keyOf(reaction.chat), reaction.message_id, count, at));
    }
    return context.json({});
  });

import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv, Bindings } from '../../../env';
import { fromTelegram } from '../../../shared/telegram/webhook-secret';
import { heard, type HeardDeps, type MemberChange } from '../application/my-channels';
import { countReactions } from '../application/post-reactions';

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
const inChannel = (one: z.infer<typeof memberSchema>) =>
  IN_CHANNEL.includes(one.status) || one.is_member === true;
// invite_link: the link the person joined by; an ad of the waitlist counts its own (G83, docs/184).
const updateSchema = z.object({
  chat_member: z
    .object({
      chat: z.object({ id: z.number() }),
      date: z.number(),
      old_chat_member: memberSchema.optional(),
      new_chat_member: memberSchema,
      invite_link: z.object({ invite_link: z.string() }).optional(),
    })
    .optional(),
  // G87 V6: the reactions on a post, anonymous: each kind with its total, grouped by Telegram.
  message_reaction_count: z
    .object({
      chat: z.object({ id: z.number(), username: z.string().optional() }),
      message_id: z.number(),
      date: z.number(),
      reactions: z.array(z.object({ total_count: z.number().int().min(0) })),
    })
    .optional(),
});
// Anyone else who hears a join or a leave: the ad links of the waitlist (G83).
export type ChannelChange = MemberChange & { readonly invite: string | null };

// The bot of the posts hears who joins or leaves a channel (docs/176) and the reactions on its posts
// (G87 V6). Only requests with our
// secret_token are taken (docs/32); anything else is still answered 200, Telegram retries errors.
export const posterRoutes = (
  deps: (env: Bindings) => HeardDeps,
  changed: (env: Bindings, change: ChannelChange) => Promise<void>,
) =>
  new Hono<AppEnv>().post(POSTER_WEBHOOK_PATH, async (context) => {
    const secret = context.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || !context.env.POSTER_BOT_TOKEN) return context.body(null, NOT_FOUND);
    if (!fromTelegram(context.req, secret)) return context.body(null, UNAUTHORIZED);
    const update = updateSchema.safeParse(await context.req.json().catch(() => null));
    const heardDeps = deps(context.env);
    const reaction = update.success ? update.data.message_reaction_count : undefined;
    if (reaction)
      await countReactions(heardDeps.reactions, {
        chatId: reaction.chat.id,
        username: reaction.chat.username ?? null,
        messageId: reaction.message_id,
        totals: reaction.reactions.map((one) => one.total_count),
        at: reaction.date * SECOND_MS,
      });
    const change = update.success ? update.data.chat_member : undefined;
    const person = change?.new_chat_member;
    if (change && person && person.user.is_bot !== true) {
      const heardChange = {
        chat: String(change.chat.id),
        userId: person.user.id,
        member: inChannel(person),
        at: change.date * SECOND_MS,
      };
      // Without the old state a change is taken as a move (G87 V5).
      const was = change.old_chat_member ? inChannel(change.old_chat_member) : !heardChange.member;
      await heard(heardDeps, heardChange, was);
      await changed(context.env, { ...heardChange, invite: change.invite_link?.invite_link ?? null });
    }
    return context.json({});
  });

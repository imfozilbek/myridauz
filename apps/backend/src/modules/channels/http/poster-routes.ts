import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv, Bindings } from '../../../env';
import { fromTelegram } from '../../../shared/telegram/webhook-secret';
import { heard, type HeardDeps } from '../application/my-channels';

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
const updateSchema = z.object({
  chat_member: z
    .object({ chat: z.object({ id: z.number() }), date: z.number(), new_chat_member: memberSchema })
    .optional(),
});

// The bot of the posts hears who joins or leaves a channel (docs/176). Only requests with our
// secret_token are taken (docs/32); anything else is still answered 200, Telegram retries errors.
export const posterRoutes = (deps: (env: Bindings) => HeardDeps) =>
  new Hono<AppEnv>().post(POSTER_WEBHOOK_PATH, async (context) => {
    const secret = context.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || !context.env.POSTER_BOT_TOKEN) return context.body(null, NOT_FOUND);
    if (!fromTelegram(context.req, secret)) return context.body(null, UNAUTHORIZED);
    const update = updateSchema.safeParse(await context.req.json().catch(() => null));
    const change = update.success ? update.data.chat_member : undefined;
    const person = change?.new_chat_member;
    if (change && person && person.user.is_bot !== true)
      await heard(deps(context.env), {
        chat: String(change.chat.id),
        userId: person.user.id,
        member: IN_CHANNEL.includes(person.status) || person.is_member === true,
        at: change.date * SECOND_MS,
      });
    return context.json({});
  });

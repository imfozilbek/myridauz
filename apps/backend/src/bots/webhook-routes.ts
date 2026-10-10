import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { recordServerEvent } from '../modules/analytics';
import { teamRole } from '../modules/team';
import { isBlocked } from '../modules/users';
import { safeEqual } from '../shared/http/safe-equal';
import { botToken } from '../shared/telegram/bot-config';
import type { Fetch } from '../shared/telegram/telegram-api';
import { onAdminCallback } from './admin-callbacks';
import { isAskButton, onAskCallback } from './ask-callbacks';
import { isNewsOffButton, onNewsOffCallback } from './news-callbacks';
import { onAdminMessage } from './admin-messages';
import { onRatingCallback } from './rating-callbacks';
import { onSupportMessage, SUPPORT_BOT, toSupportBot } from './support-bot';
import type { BotContext } from './bot-context';
import { botEventOf } from './bot-events';
import { DOCUMENTS_COMMAND, documentsReply } from './documents-reply';
import { isBotRole, type BotRole } from './bot-roles';
import { noRepliesReply } from './no-replies';
import { startReply } from './start-reply';
import { isStartCommand, telegramUpdateSchema, type TelegramUpdate } from './telegram-update';
import { brandOf } from '../shared/brand/brand-of';

const SECRET_HEADER = 'x-telegram-bot-api-secret-token';
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;

// Telegram sends every update of a bot here. Only requests with our secret_token are accepted (docs/32).
// Telegram retries on errors, so anything we do not handle is still answered with 200.
export function webhookRoutes(fetch: Fetch) {
  return new Hono<AppEnv>().post('/telegram/:role', async (context) => {
    const role = context.req.param('role');
    if (role !== SUPPORT_BOT && !isBotRole(role)) return context.body(null, NOT_FOUND);
    const secret = context.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || !botToken(context.env, role)) return context.body(null, NOT_FOUND);
    if (!safeEqual(context.req.header(SECRET_HEADER) ?? '', secret)) return context.body(null, UNAUTHORIZED);
    const update = telegramUpdateSchema.safeParse(await context.req.json().catch(() => null));
    if (!update.success) return context.json({});
    const event = botEventOf(role, update.data);
    if (event) recordServerEvent(context.env, event);
    const bot: BotContext = { env: context.env, brand: brandOf(context.env), fetch };
    try {
      return context.json(await answer(bot, role, update.data));
    } catch (error) {
      // A broken step still answers 200: a retry would repeat a forward to the team (G42).
      console.error(JSON.stringify({ event: 'webhook_error', role, message: String(error) }));
      recordServerEvent(context.env, { name: 'server_error', source: role, code: 'webhook' });
      return context.json({});
    }
  });
}

// The answer to one update of a bot: a reply method for Telegram, or nothing to do.
async function answer(bot: BotContext, role: BotRole | typeof SUPPORT_BOT, data: TelegramUpdate) {
  if (role === SUPPORT_BOT) return data.message ? onSupportMessage(bot, data.message) : {};
  const query = data.callback_query;
  if (query) {
    if (role === 'admin') return onAdminCallback(bot, query);
    if (isNewsOffButton(query.data)) return onNewsOffCallback(bot, role, query);
    return role === 'driver' && isAskButton(query.data)
      ? onAskCallback(bot, query)
      : onRatingCallback(bot, role, query);
  }
  const message = data.message;
  if (!message) return {};
  const fromId = message.from?.id ?? 0;
  const blocked = await isBlocked(bot.env, fromId);
  const team = role === 'admin' ? await teamRole(bot.env, fromId) : null;
  if (isStartCommand(message.text)) {
    if (!blocked && role === 'admin' && team === null) return toSupportBot(bot.brand, message.chat.id);
    const access = blocked ? 'blocked' : 'allowed';
    const payload = message.text?.split(' ')[1] ?? '';
    return startReply({ brand: bot.brand, role, chatId: message.chat.id, access, payload });
  }
  if (blocked) return {};
  if (message.text === DOCUMENTS_COMMAND && role !== 'admin')
    return documentsReply(bot.brand, role, message.chat.id);
  if (role !== 'admin') return message.text ? noRepliesReply(bot.brand, role, message.chat.id) : {};
  return onAdminMessage(bot, message, team);
}

import { loadBrand } from '@platform/brands';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { recordServerEvent } from '../modules/analytics';
import { teamRole } from '../modules/team';
import { isBlocked } from '../modules/users';
import { safeEqual } from '../shared/http/safe-equal';
import { botToken } from '../shared/telegram/bot-config';
import type { Fetch } from '../shared/telegram/telegram-api';
import { onAdminCallback } from './admin-callbacks';
import { onAdminMessage } from './admin-messages';
import { onRatingCallback } from './rating-callbacks';
import { onSupportMessage, SUPPORT_BOT, toSupportBot } from './support-bot';
import type { BotContext } from './bot-context';
import { botEventOf } from './bot-events';
import { DOCUMENTS_COMMAND, documentsReply } from './documents-reply';
import { isBotRole } from './bot-roles';
import { startReply } from './start-reply';
import { isStartCommand, telegramUpdateSchema } from './telegram-update';

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
    const bot: BotContext = { env: context.env, brand: loadBrand(context.env.BRAND), fetch };
    if (role === SUPPORT_BOT)
      return context.json(update.data.message ? await onSupportMessage(bot, update.data.message) : {});
    const query = update.data.callback_query;
    if (query)
      return context.json(
        role === 'admin' ? await onAdminCallback(bot, query) : await onRatingCallback(bot, role, query),
      );
    const message = update.data.message;
    if (!message) return context.json({});
    const fromId = message.from?.id ?? 0;
    const blocked = await isBlocked(context.env, fromId);
    const team = role === 'admin' ? await teamRole(context.env, fromId) : null;
    if (isStartCommand(message.text)) {
      if (!blocked && role === 'admin' && team === null)
        return context.json(toSupportBot(bot.brand, message.chat.id));
      const access = blocked ? 'blocked' : 'allowed';
      const payload = message.text?.split(' ')[1] ?? '';
      return context.json(startReply({ brand: bot.brand, role, chatId: message.chat.id, access, payload }));
    }
    if (blocked) return context.json({});
    if (message.text === DOCUMENTS_COMMAND && role !== 'admin')
      return context.json(documentsReply(bot.brand, role, message.chat.id));
    if (role !== 'admin') return context.json({});
    return context.json(await onAdminMessage(bot, message, team));
  });
}

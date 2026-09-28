import { loadBrand } from '@platform/brands';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { safeEqual } from '../shared/http/safe-equal';
import { adminIds, botToken, isBotRole } from './bot-roles';
import { startReply } from './start-reply';
import { isStartCommand, telegramUpdateSchema } from './telegram-update';

const SECRET_HEADER = 'x-telegram-bot-api-secret-token';
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;

// Telegram sends every update of a bot here. Only requests with our secret_token are accepted (docs/32).
export const webhookRoutes = new Hono<AppEnv>().post('/telegram/:role', async (context) => {
  const role = context.req.param('role');
  const secret = context.env.TELEGRAM_WEBHOOK_SECRET;
  if (!isBotRole(role) || !secret || !botToken(context.env, role)) return context.body(null, NOT_FOUND);
  if (!safeEqual(context.req.header(SECRET_HEADER) ?? '', secret)) return context.body(null, UNAUTHORIZED);
  const update = telegramUpdateSchema.safeParse(await context.req.json().catch(() => null));
  const message = update.success ? update.data.message : undefined;
  // Telegram retries on errors, so anything we do not handle is still answered with 200.
  if (!message || !isStartCommand(message.text)) return context.json({});
  const allowed = role !== 'admin' || adminIds(context.env).has(message.from?.id ?? 0);
  return context.json(
    startReply({ brand: loadBrand(context.env.BRAND), role, chatId: message.chat.id, allowed }),
  );
});

import { Hono } from 'hono';
import type { AppEnv } from '../env';
import type { Fetch } from '../shared/telegram/telegram-api';
import { fromSetup } from '../shared/telegram/webhook-secret';
import { configureBots } from './configure-bots';

const UNAUTHORIZED = 401;

// Points the bots at this Worker by hand (docs/45); the Cron does the same by itself after a deploy
// (bot-setup-job.ts). Protected by the webhook secret: bot tokens never leave Cloudflare (docs/32).
export function setupRoutes(fetch: Fetch) {
  return new Hono<AppEnv>().post('/telegram/setup', async (context) => {
    const secret = context.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || !fromSetup(context.req, secret)) return context.body(null, UNAUTHORIZED);
    return context.json({ configured: await configureBots(context.env, fetch, secret) });
  });
}

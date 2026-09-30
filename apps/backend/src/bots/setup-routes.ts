import { apiHost, loadBrand } from '@platform/brands';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { safeEqual } from '../shared/http/safe-equal';
import { callTelegram, type Fetch } from '../shared/telegram/telegram-api';
import { botToken } from '../shared/telegram/bot-config';
import { BOT_ROLES } from './bot-roles';
import { botCommands } from './documents-reply';
import { openButton } from './start-reply';

const SETUP_HEADER = 'x-setup-secret';
const UNAUTHORIZED = 401;

// Points the 3 bots at this Worker. Run once after the first deploy and when bot settings change (docs/45).
// Protected by the webhook secret: bot tokens never leave Cloudflare (docs/32).
export function setupRoutes(fetch: Fetch) {
  return new Hono<AppEnv>().post('/telegram/setup', async (context) => {
    const secret = context.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || !safeEqual(context.req.header(SETUP_HEADER) ?? '', secret))
      return context.body(null, UNAUTHORIZED);
    const brand = loadBrand(context.env.BRAND);
    const configured: string[] = [];
    for (const role of BOT_ROLES) {
      const token = botToken(context.env, role);
      if (!token) continue;
      await callTelegram(fetch, token, 'setWebhook', {
        url: `https://${apiHost(brand)}/telegram/${role}`,
        secret_token: secret,
        // Buttons of the moderation card come as callback queries (docs/04).
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
      });
      // The team menu is not shown to everyone: admins open their Mini App from the /start button.
      if (role !== 'admin') {
        await callTelegram(fetch, token, 'setChatMenuButton', {
          menu_button: { type: 'web_app', ...openButton(brand, role) },
        });
        // "/hujjatlar" opens the legal documents (docs/30).
        await callTelegram(fetch, token, 'setMyCommands', { commands: botCommands() });
      }
      configured.push(role);
    }
    return context.json({ configured });
  });
}

import { apiHost } from '@platform/brands';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { callTelegram, type Fetch } from '../shared/telegram/telegram-api';
import { BOT_NAMES, botToken } from '../shared/telegram/bot-config';
import { fromSetup } from '../shared/telegram/webhook-secret';
import { isBotRole } from './bot-roles';
import { botCommands } from './documents-reply';
import { menuButton } from './start-reply';
import { brandOf } from '../shared/brand/brand-of';
import { POSTER_WEBHOOK_PATH } from '../modules/channels';

const UNAUTHORIZED = 401;

// Points the bots at this Worker. Run once after the first deploy and when bot settings change (docs/45).
// Protected by the webhook secret: bot tokens never leave Cloudflare (docs/32). The names, the texts
// and the pictures of the bots come from the looks (docs/180).
export function setupRoutes(fetch: Fetch) {
  return new Hono<AppEnv>().post('/telegram/setup', async (context) => {
    const secret = context.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || !fromSetup(context.req, secret)) return context.body(null, UNAUTHORIZED);
    const brand = brandOf(context.env);
    const configured: string[] = [];
    for (const role of BOT_NAMES) {
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
      // The support bot has no Mini App: people only write there (docs/50).
      if (isBotRole(role) && role !== 'admin') {
        await callTelegram(fetch, token, 'setChatMenuButton', { menu_button: menuButton(brand, role) });
        // "/hujjatlar" opens the legal documents (docs/30).
        await callTelegram(fetch, token, 'setMyCommands', { commands: botCommands() });
      }
      configured.push(role);
    }
    // The bot of the posts hears only who joins or leaves the channels (docs/176).
    const poster = context.env.POSTER_BOT_TOKEN;
    if (poster) {
      await callTelegram(fetch, poster, 'setWebhook', {
        url: `https://${apiHost(brand)}${POSTER_WEBHOOK_PATH}`,
        secret_token: secret,
        allowed_updates: ['chat_member'],
        drop_pending_updates: true,
      });
      configured.push('poster');
    }
    return context.json({ configured });
  });
}

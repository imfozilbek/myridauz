import { apiHost, loadBrand } from '@platform/brands';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { safeEqual } from '../shared/http/safe-equal';
import { callTelegram, type Fetch } from '../shared/telegram/telegram-api';
import { botToken, type BotName } from '../shared/telegram/bot-config';
import { avatarUrl, setBotAvatar } from './bot-avatar';
import { botProfile } from './bot-profile';
import { BOT_ROLES, isBotRole } from './bot-roles';
import { botCommands } from './documents-reply';
import { openButton } from './start-reply';
import { SUPPORT_BOT } from './support-bot';

const SETUP_HEADER = 'x-setup-secret';
const UNAUTHORIZED = 401;
const BOTS: readonly BotName[] = [...BOT_ROLES, SUPPORT_BOT];

// Points the bots at this Worker. Run once after the first deploy and when bot settings change (docs/45).
// Protected by the webhook secret: bot tokens never leave Cloudflare (docs/32).
export function setupRoutes(fetch: Fetch) {
  return new Hono<AppEnv>().post('/telegram/setup', async (context) => {
    const secret = context.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || !safeEqual(context.req.header(SETUP_HEADER) ?? '', secret))
      return context.body(null, UNAUTHORIZED);
    const brand = loadBrand(context.env.BRAND);
    const configured: string[] = [];
    for (const role of BOTS) {
      const token = botToken(context.env, role);
      if (!token) continue;
      await callTelegram(fetch, token, 'setWebhook', {
        url: `https://${apiHost(brand)}/telegram/${role}`,
        secret_token: secret,
        // Buttons of the moderation card come as callback queries (docs/04).
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
      });
      // The name, the text of an empty chat and the profile line (G16).
      const { name, description, short_description } = botProfile(brand, role);
      await callTelegram(fetch, token, 'setMyName', { name });
      await callTelegram(fetch, token, 'setMyDescription', { description });
      await callTelegram(fetch, token, 'setMyShortDescription', { short_description });
      // The face of the bot (G34): a missing picture must not stop the rest of the setup.
      await setBotAvatar(fetch, token, avatarUrl(brand, role)).catch((error: unknown) =>
        console.warn(String(error)),
      );
      // The team menu is not shown to everyone: admins open their Mini App from the /start button.
      // The support bot has no Mini App: people only write there (docs/50).
      if (isBotRole(role) && role !== 'admin') {
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

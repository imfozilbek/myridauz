import { apiHost } from '@platform/brands';
import type { Bindings } from '../env';
import { brandOf, siteOf } from '../shared/brand/brand-of';
import { botToken, type BotName } from '../shared/telegram/bot-config';
import { callTelegram, type Fetch } from '../shared/telegram/telegram-api';
import { POSTER_WEBHOOK_PATH } from '../modules/channels';
import { avatarUrl, setBotAvatar } from './bot-avatar';
import { botProfile } from './bot-profile';
import { setTextsWhenChanged } from './bot-texts';
import { BOT_ROLES, isBotRole } from './bot-roles';
import { botCommands } from './documents-reply';
import { menuButton } from './start-reply';
import { SUPPORT_BOT } from './support-bot';

const BOTS: readonly BotName[] = [...BOT_ROLES, SUPPORT_BOT];
// Buttons of the moderation card come as callback queries (docs/04); a person who blocks a bot or
// comes back is my_chat_member (G87, docs/191).
const BOT_UPDATES = ['message', 'callback_query', 'my_chat_member'];
// The bot of the posts hears who joins or leaves the channels (docs/176) and how many reactions a
// post has (G87).
const POSTER_UPDATES = ['chat_member', 'message_reaction_count'];

// The team menu is not shown to everyone: admins open their Mini App from the /start button.
// The support bot has no Mini App: people only write there (docs/50).
const hasMenu = (role: BotName) => isBotRole(role) && role !== 'admin';

// What the setup gives each bot that has a token: the webhook, the profile, the picture, the menu.
function plansOf(env: Bindings) {
  const brand = brandOf(env);
  return BOTS.flatMap((role) => {
    const token = botToken(env, role);
    if (!token) return [];
    const menu = hasMenu(role) ? { menu: menuButton(brand, role), commands: botCommands() } : null;
    const hook = `https://${apiHost(brand)}/telegram/${role}`;
    return [
      { role, token, hook, profile: botProfile(brand, role), avatar: avatarUrl(siteOf(env), role), menu },
    ];
  });
}

// Points the bots at this Worker (docs/45): the secret token on every webhook (docs/32).
export async function configureBots(env: Bindings, fetch: Fetch, secret: string): Promise<string[]> {
  const configured: string[] = [];
  for (const { role, token, hook, profile, avatar, menu } of plansOf(env)) {
    await callTelegram(fetch, token, 'setWebhook', {
      url: hook,
      secret_token: secret,
      allowed_updates: BOT_UPDATES,
      drop_pending_updates: true,
    });
    await setTextsWhenChanged(fetch, token, profile);
    // The face of the bot (G34): a missing picture must not stop the rest of the setup.
    await setBotAvatar(fetch, token, avatar).catch((error: unknown) =>
      console.warn(JSON.stringify({ event: 'bot_avatar_failed', role, message: String(error) })),
    );
    if (menu) {
      await callTelegram(fetch, token, 'setChatMenuButton', { menu_button: menu.menu });
      // "/hujjatlar" opens the legal documents (docs/30).
      await callTelegram(fetch, token, 'setMyCommands', { commands: menu.commands });
    }
    configured.push(role);
  }
  const poster = env.POSTER_BOT_TOKEN;
  if (poster) {
    await callTelegram(fetch, poster, 'setWebhook', {
      url: `https://${apiHost(brandOf(env))}${POSTER_WEBHOOK_PATH}`,
      secret_token: secret,
      allowed_updates: POSTER_UPDATES,
      drop_pending_updates: true,
    });
    configured.push('poster');
  }
  return configured;
}

// A short mark of everything the setup sends: the token of a new bot or a new text gives a new mark,
// so the Worker sets the bots up again by itself (bot-setup-job.ts). The tokens are not in it.
export async function setupStamp(env: Bindings): Promise<string> {
  const plans = plansOf(env).map(({ role, hook, profile, avatar, menu }) => [
    role,
    hook,
    profile,
    avatar,
    menu,
  ]);
  const updates = [BOT_UPDATES, POSTER_UPDATES];
  const text = JSON.stringify([plans, Boolean(env.POSTER_BOT_TOKEN), apiHost(brandOf(env)), updates]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

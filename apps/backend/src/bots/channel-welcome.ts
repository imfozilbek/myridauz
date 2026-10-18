import type { BrandConfig } from '@platform/brands';
import { botStartLink, channelVia, HOUR_MS } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../env';
import { brandOf } from '../shared/brand/brand-of';
import { askTelegram, sendFlags, type Fetch } from '../shared/telegram/telegram-api';
import { welcomeCaption, welcomePicture } from './start-reply';

const { t } = createI18n(DEFAULT_LOCALE);

// The welcomes of the passenger and the driver bot in every channel of the brand, the main one first
// (owner, 18.10.2026): the bot of the posts is an admin there already. The button opens the Mini App
// of the bot with the mark of the channel, so «Statistika» shows who came from which channel.
const ROLES = ['passenger', 'driver'] as const;
type Role = (typeof ROLES)[number];
// A few posts a tick: the Cron run shares its requests with the other jobs (docs/117).
const PER_TICK = 12;
// A channel that refused (the bot is not its admin yet) waits, so it does not hold the others.
const RETRY_MS = HOUR_MS;
const REFUSED = /_4\d\d$/u;
const TOO_MANY = '_429';

// Without sound: in a channel only the board of the day sounds (docs/122).
const channelWelcome = (brand: BrandConfig, role: Role, chat: string) => ({
  chat_id: chat,
  photo: welcomePicture(brand, role),
  caption: welcomeCaption(brand, role),
  reply_markup: {
    inline_keyboard: [[{ text: t('bot.open'), url: botStartLink(brand.bots[role], channelVia(chat)) }]],
  },
  ...sendFlags({ quiet: true }),
});

// Table channel_welcomes (migration 0074). A welcome counts as posted once taken, so neither two ticks
// nor a lost answer of Telegram post it twice: a double in a channel is seen by all, a lost one by
// none. Only a post Telegram refused (4xx) is given back, and taken again after RETRY_MS.
const DONE = 'SELECT chat, role FROM channel_welcomes WHERE posted_at IS NOT NULL OR tried_at > ?';
const TAKE = `INSERT INTO channel_welcomes (chat, role, tried_at, posted_at) VALUES (?1, ?2, ?3, ?3)
  ON CONFLICT (chat, role) DO UPDATE SET tried_at = excluded.tried_at, posted_at = excluded.posted_at
  WHERE posted_at IS NULL AND tried_at <= ?4`;
const KEEP = 'UPDATE channel_welcomes SET message_id = ? WHERE chat = ? AND role = ?';
const GIVE_BACK = 'UPDATE channel_welcomes SET posted_at = NULL WHERE chat = ? AND role = ?';

// True when this tick took the welcome: a new one, or one refused RETRY_MS ago.
async function take(db: D1Database, chat: string, role: Role, now: number): Promise<boolean> {
  const { meta } = await db
    .prepare(TAKE)
    .bind(chat, role, now, now - RETRY_MS)
    .run();
  return meta.changes > 0;
}

const welcomesOf = (brand: BrandConfig) =>
  [`@${brand.mainChannel}`, ...brand.channels.map(({ chat }) => chat)].flatMap((chat) =>
    ROLES.map((role) => ({ chat, role })),
  );

// Each welcome goes once, while the channel posts are on (docs/33). A post the owner deleted stays
// deleted.
export async function postChannelWelcomes(env: Bindings, fetch: Fetch, now: number): Promise<void> {
  const [db, token] = [env.DB, env.POSTER_BOT_TOKEN];
  if (!db || !token || env.CHANNEL_POSTS !== 'on') return;
  const brand = brandOf(env);
  const { results } = await db
    .prepare(DONE)
    .bind(now - RETRY_MS)
    .all<{ chat: string; role: Role }>();
  const done = new Set(results.map(({ chat, role }) => `${chat} ${role}`));
  const due = welcomesOf(brand).filter(({ chat, role }) => !done.has(`${chat} ${role}`));
  for (const { chat, role } of due.slice(0, PER_TICK)) {
    if (!(await take(db, chat, role, now))) continue;
    try {
      const welcome = channelWelcome(brand, role, chat);
      const post = await askTelegram<{ message_id: number }>(fetch, token, 'sendPhoto', welcome);
      await db
        .prepare(KEEP)
        .bind(post?.message_id ?? null, chat, role)
        .run();
    } catch (error) {
      const message = String(error);
      console.warn(JSON.stringify({ event: 'channel_welcome_failed', chat, role, message }));
      if (!REFUSED.test(message)) continue;
      await db.prepare(GIVE_BACK).bind(chat, role).run();
      if (message.endsWith(TOO_MANY)) return;
    }
  }
}

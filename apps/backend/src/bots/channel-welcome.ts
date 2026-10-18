import type { BrandConfig } from '@platform/brands';
import { botStartLink, channelVia, HOUR_MS, isQuietTime } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../env';
import { brandOf } from '../shared/brand/brand-of';
import { callTelegram, sendFlags, type Fetch } from '../shared/telegram/telegram-api';
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
const TOO_MANY = '_429';

const channelWelcome = (brand: BrandConfig, role: Role, chat: string) => ({
  chat_id: chat,
  photo: welcomePicture(brand, role),
  caption: welcomeCaption(brand, role),
  reply_markup: {
    inline_keyboard: [[{ text: t('bot.open'), url: botStartLink(brand.bots[role], channelVia(chat)) }]],
  },
});

// Table channel_welcomes (migration 0074): a welcome is taken before its post, so two ticks never
// post it twice; a refused one is taken again after RETRY_MS.
const DONE = 'SELECT chat, role FROM channel_welcomes WHERE posted_at IS NOT NULL OR tried_at > ?';
const TAKE = `INSERT INTO channel_welcomes (chat, role, tried_at) VALUES (?1, ?2, ?3)
  ON CONFLICT (chat, role) DO UPDATE SET tried_at = excluded.tried_at
  WHERE posted_at IS NULL AND tried_at <= ?4`;
const POSTED = 'UPDATE channel_welcomes SET posted_at = ? WHERE chat = ? AND role = ?';

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
      const post = { ...channelWelcome(brand, role, chat), ...sendFlags({ quiet: isQuietTime(now) }) };
      await callTelegram(fetch, token, 'sendPhoto', post);
      await db.prepare(POSTED).bind(now, chat, role).run();
    } catch (error) {
      console.warn(JSON.stringify({ event: 'channel_welcome_waits', chat, role, message: String(error) }));
      if (String(error).endsWith(TOO_MANY)) return;
    }
  }
}

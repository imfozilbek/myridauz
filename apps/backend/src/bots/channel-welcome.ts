import type { BrandConfig } from '@platform/brands';
import { botStartLink, channelVia, HOUR_MS } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../env';
import { recordServerEvent } from '../modules/analytics';
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
// A welcome without the number of its post waits, so it does not hold the others.
const RETRY_MS = HOUR_MS;
// The status of Telegram in the error of askTelegram; none: Telegram never answered.
const STATUS = /_(\d{3})$/u;
const NO_ANSWER = 'lost';
const TOO_MANY = '429';

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

// Table channel_welcomes (migration 0076). A welcome is posted only when Telegram gave the number of
// its post (owner, 18.10.2026): a refusal, a failure or no answer at all is tried again RETRY_MS
// later. Taking the row first keeps two ticks from posting it at once.
const DONE = 'SELECT chat, role FROM channel_welcomes WHERE message_id IS NOT NULL OR tried_at > ?';
const TAKE = `INSERT INTO channel_welcomes (chat, role, tried_at) VALUES (?1, ?2, ?3)
  ON CONFLICT (chat, role) DO UPDATE SET tried_at = excluded.tried_at
  WHERE message_id IS NULL AND tried_at <= ?4`;
const KEEP = 'UPDATE channel_welcomes SET message_id = ?, posted_at = ? WHERE chat = ? AND role = ?';

// True when this tick took the welcome: a new one, or one without its post RETRY_MS later.
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
// deleted. Every failure is a server error in «Statistika»; 429 or no answer ends the tick.
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
        .bind(post?.message_id ?? null, now, chat, role)
        .run();
    } catch (error) {
      const status = STATUS.exec(String(error))?.[1] ?? NO_ANSWER;
      console.warn(JSON.stringify({ event: 'channel_welcome_failed', chat, role, status }));
      recordServerEvent(env, { name: 'server_error', source: 'poster', code: `channel_welcome.${status}` });
      if (status === TOO_MANY || status === NO_ANSWER) return;
    }
  }
}

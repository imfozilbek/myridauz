import { loadBrand } from '@platform/brands';
import { botStartLink, channelVia, HOUR_MS } from '@platform/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Bindings } from '../env';
import { testD1 } from '../test-d1';
import { postChannelWelcomes } from './channel-welcome';
import { welcomeCaption, welcomePicture } from './start-reply';

afterEach(() => vi.restoreAllMocks());

const brand = loadBrand();
const MAIN = `@${brand.mainChannel}`;
const FIRST = brand.channels[0]?.chat ?? '';
const ALL = 2 * (1 + brand.channels.length);
const DAY = Date.UTC(2026, 9, 18, 6);

type Post = {
  chat_id: string;
  photo: string;
  caption: string;
  disable_notification?: boolean;
  reply_markup: { inline_keyboard: { text: string; url: string }[][] };
};

// Telegram that answers the chats of `answers` with their status (0: no answer at all), and 429 from
// the post number `busyAt`.
function telegram(answers: Readonly<Record<string, number>> = {}, busyAt = Infinity) {
  const posts: Post[] = [];
  const fetch = async (_url: string, init?: RequestInit) => {
    const post = JSON.parse(String(init?.body)) as Post;
    posts.push(post);
    const status = posts.length >= busyAt ? 429 : (answers[post.chat_id] ?? 200);
    if (status === 0) throw new Error('Network connection lost.');
    return Response.json({ ok: status === 200, result: { message_id: posts.length } }, { status });
  };
  return { posts, fetch, where: () => posts.map((post) => post.chat_id) };
}

// The server errors of «Statistika»: the code of each failed welcome.
const errors: string[] = [];
const ANALYTICS = { writeDataPoint: ({ blobs }: { blobs: string[] }) => errors.push(blobs.join(' ')) };
const envWith = (values: object = {}) =>
  ({ POSTER_BOT_TOKEN: 'c', CHANNEL_POSTS: 'on', DB: testD1(), ANALYTICS, ...values }) as unknown as Bindings;

describe('the welcomes of the bots in the channels (owner, 18.10.2026)', () => {
  it('posts both welcomes to the main channel first, then a few channels a tick, never twice', async () => {
    const db = testD1();
    const env = envWith({ DB: db });
    const first = telegram();
    await postChannelWelcomes(env, first.fetch, DAY);
    const [passenger, driver] = first.posts;
    expect(first.where().slice(0, 2)).toEqual([MAIN, MAIN]);
    expect(passenger).toEqual({
      chat_id: MAIN,
      photo: welcomePicture(brand, 'passenger'),
      caption: welcomeCaption(brand, 'passenger'),
      reply_markup: {
        inline_keyboard: [[{ text: 'Ochish', url: botStartLink(brand.bots.passenger, channelVia(MAIN)) }]],
      },
      // In a channel only the board of the day sounds (docs/122).
      disable_notification: true,
    });
    expect(driver?.photo).toBe(welcomePicture(brand, 'driver'));
    expect(driver?.reply_markup.inline_keyboard[0]?.[0]?.url).toBe(
      botStartLink(brand.bots.driver, channelVia(MAIN)),
    );
    const kept = await db
      .prepare('SELECT message_id FROM channel_welcomes WHERE chat = ? AND role = ?')
      .bind(MAIN, 'driver')
      .first<{ message_id: number }>();
    expect(kept?.message_id).toBe(2);
    const sent = [...first.where()];
    for (let tick = 1; tick * first.posts.length < ALL; tick += 1) {
      const next = telegram();
      await postChannelWelcomes(env, next.fetch, DAY + tick);
      sent.push(...next.where());
    }
    expect(sent).toHaveLength(ALL);
    expect(new Set(sent)).toEqual(new Set([MAIN, ...brand.channels.map(({ chat }) => chat)]));
    const after = telegram();
    await postChannelWelcomes(env, after.fetch, DAY + 2 * HOUR_MS);
    expect(after.posts).toEqual([]);
  });

  it('tries a refused or failed welcome an hour later, stops at 429, shows each in «Statistika»', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    errors.length = 0;
    const env = envWith();
    await postChannelWelcomes(env, telegram({ [MAIN]: 400, [FIRST]: 500 }).fetch, DAY);
    expect(errors).toContain('server_error poster    channel_welcome.400');
    expect(errors).toContain('server_error poster    channel_welcome.500');
    const soon = telegram();
    await postChannelWelcomes(env, soon.fetch, DAY + 1);
    expect(soon.where()).not.toContain(MAIN);
    expect(soon.where()).not.toContain(FIRST);
    const busy = telegram({}, 1);
    await postChannelWelcomes(env, busy.fetch, DAY + HOUR_MS + 1);
    expect(busy.where()).toEqual([MAIN]);
    expect(errors.at(-1)).toBe('server_error poster    channel_welcome.429');
    const later = telegram();
    await postChannelWelcomes(env, later.fetch, DAY + 2 * HOUR_MS + 2);
    expect(later.where().slice(0, 4)).toEqual([MAIN, MAIN, FIRST, FIRST]);
  });

  it('ends the tick when Telegram does not answer and tries that welcome again an hour later', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    errors.length = 0;
    const env = envWith();
    const silent = telegram({ [MAIN]: 0 });
    await postChannelWelcomes(env, silent.fetch, DAY);
    expect(silent.where()).toEqual([MAIN]);
    expect(errors).toEqual(['server_error poster    channel_welcome.lost']);
    const next = telegram();
    await postChannelWelcomes(env, next.fetch, DAY + 1);
    expect(next.posts.filter(({ chat_id }) => chat_id === MAIN).map(({ photo }) => photo)).toEqual([
      welcomePicture(brand, 'driver'),
    ]);
    const later = telegram();
    await postChannelWelcomes(env, later.fetch, DAY + HOUR_MS);
    expect(later.where()[0]).toBe(MAIN);
  });

  it('posts each welcome once when two ticks run at once', async () => {
    const env = envWith();
    const [one, two] = [telegram(), telegram()];
    await Promise.all([postChannelWelcomes(env, one.fetch, DAY), postChannelWelcomes(env, two.fetch, DAY)]);
    const sent = [...one.posts, ...two.posts].map((post) => `${post.chat_id} ${post.photo}`);
    expect(sent).toHaveLength(12);
    expect(new Set(sent).size).toBe(12);
  });

  it('waits for the switch of the posts and the token of the bot of the posts', async () => {
    for (const values of [{ CHANNEL_POSTS: 'off' }, { POSTER_BOT_TOKEN: undefined }]) {
      const quiet = telegram();
      await postChannelWelcomes(envWith(values), quiet.fetch, DAY);
      expect(quiet.posts).toEqual([]);
    }
  });
});

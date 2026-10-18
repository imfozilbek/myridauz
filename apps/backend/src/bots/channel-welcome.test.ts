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
const ALL = 2 * (1 + brand.channels.length);
// 11:00 and 01:00 in Tashkent: the day and the night of the bots (docs/122).
const DAY = Date.UTC(2026, 9, 18, 6);
const NIGHT = Date.UTC(2026, 9, 18, 20);

type Post = {
  chat_id: string;
  photo: string;
  caption: string;
  disable_notification?: boolean;
  reply_markup: { inline_keyboard: { text: string; url: string }[][] };
};

// Telegram that refuses the chats of `refused` with 400 and answers 429 from the post number `busyAt`.
function telegram(refused: readonly string[] = [], busyAt = Infinity) {
  const posts: Post[] = [];
  const fetch = async (_url: string, init?: RequestInit) => {
    const post = JSON.parse(String(init?.body)) as Post;
    posts.push(post);
    if (posts.length >= busyAt) return new Response('{}', { status: 429 });
    return new Response('{}', { status: refused.includes(post.chat_id) ? 400 : 200 });
  };
  return { posts, fetch, where: () => posts.map((post) => post.chat_id) };
}

const envWith = (values: object = {}) =>
  ({ POSTER_BOT_TOKEN: 'c', CHANNEL_POSTS: 'on', DB: testD1(), ...values }) as unknown as Bindings;

describe('the welcomes of the bots in the channels (owner, 18.10.2026)', () => {
  it('posts both welcomes to the main channel first, then a few channels a tick, never twice', async () => {
    const env = envWith();
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
    });
    expect(driver?.photo).toBe(welcomePicture(brand, 'driver'));
    expect(driver?.reply_markup.inline_keyboard[0]?.[0]?.url).toBe(
      botStartLink(brand.bots.driver, channelVia(MAIN)),
    );
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

  it('tries a refused channel again an hour later, stops at 429, posts at night without sound', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const env = envWith();
    const refusing = telegram([MAIN]);
    await postChannelWelcomes(env, refusing.fetch, NIGHT);
    expect(refusing.posts.every((post) => post.disable_notification === true)).toBe(true);
    const soon = telegram();
    await postChannelWelcomes(env, soon.fetch, NIGHT + 1);
    expect(soon.where()).not.toContain(MAIN);
    const busy = telegram([], 1);
    await postChannelWelcomes(env, busy.fetch, NIGHT + HOUR_MS + 1);
    expect(busy.where()).toEqual([MAIN]);
    const later = telegram();
    await postChannelWelcomes(env, later.fetch, NIGHT + HOUR_MS + 2);
    expect(later.where()[0]).toBe(MAIN);
    expect(later.posts[0]?.photo).toBe(welcomePicture(brand, 'driver'));
  });

  it('waits for the switch of the posts and the token of the bot of the posts', async () => {
    for (const values of [{ CHANNEL_POSTS: 'off' }, { POSTER_BOT_TOKEN: undefined }]) {
      const quiet = telegram();
      await postChannelWelcomes(envWith(values), quiet.fetch, DAY);
      expect(quiet.posts).toEqual([]);
    }
  });
});

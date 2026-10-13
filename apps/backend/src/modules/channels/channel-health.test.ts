import type { Channel } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { deadPostsByChannel } from '../notifications/infrastructure/dead-posts';
import { arrivalsByChannelVia } from '../users/infrastructure/channel-arrivals';
import { appLinks, channelHealth, checkChannels, type HealthDeps } from './application/health';
import { createMemoryHealth, d1Health } from './infrastructure/d1-health';

const NOW = Date.parse('2026-10-12T05:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const channel = (name: string): Channel => ({
  chat: `@${name}`,
  title: name,
  places: ['1726'],
  link: `https://t.me/${name}`,
  fixed: true,
});
const CHANNELS = ['zone_samarqand', 'zone_buxoro', 'zone_navoiy', 'zone_xorazm'].map(channel);

function setup(): HealthDeps & { readonly asked: string[]; readonly linked: string[] } {
  const asked: string[] = [];
  const linked: string[] = [];
  return {
    asked,
    linked,
    channels: async () => CHANNELS,
    store: createMemoryHealth(),
    count: async (chat) => {
      asked.push(chat);
      return chat === '@zone_navoiy' ? null : 1200;
    },
    canPost: async (chat) => chat !== '@zone_buxoro',
    // Telegram makes the link «Rida ilovasi» of every channel but Navoiy.
    appLink: async (chat) => {
      linked.push(chat);
      return chat === '@zone_navoiy' ? null : `https://t.me/+app_${chat.slice(1)}`;
    },
    failed: async () => new Map([['@zone_buxoro', 4]]),
    arrivals: async () => new Map([['ch-zone-samarqand', 17]]),
    now: () => NOW,
  };
}

// «Kanallar» of the owner (G75, docs/120): the people, the bot, the lost posts and the arrivals.
describe('the health of the channels', () => {
  it('reads a few channels an hour from Telegram, the never checked first, then the oldest', async () => {
    const deps = setup();
    await deps.store.save({
      channel: '@zone_samarqand',
      subscribers: 900,
      canPost: true,
      checkedAt: NOW - DAY,
      appLink: null,
    });
    await checkChannels(deps);
    expect(deps.asked).toEqual(['@zone_buxoro', '@zone_navoiy', '@zone_xorazm']);
    const health = await channelHealth(deps);
    expect(health.channels).toEqual([
      { ...row('zone_samarqand'), subscribers: 900, canPost: true, checkedAt: NOW - DAY, arrivals: 17 },
      { ...row('zone_buxoro'), subscribers: 1200, canPost: false, checkedAt: NOW, failed: 4 },
      { ...row('zone_navoiy'), subscribers: null, canPost: true, checkedAt: NOW },
      { ...row('zone_xorazm'), subscribers: 1200, canPost: true, checkedAt: NOW },
    ]);
  });

  // Owner decision 4 (docs/176): the app opens its own link of each channel, Telegram counts by it.
  it('makes the own link of the app in a channel once and makes a failed one at the next check', async () => {
    const deps = setup();
    for (let hour = 0; hour < 3; hour += 1) await checkChannels({ ...deps, now: () => NOW + hour });
    expect(deps.linked.toSorted()).toEqual([
      '@zone_buxoro',
      '@zone_navoiy',
      '@zone_navoiy',
      '@zone_samarqand',
      '@zone_xorazm',
    ]);
    expect(await appLinks(deps.store)).toEqual(
      new Map([
        ['@zone_samarqand', 'https://t.me/+app_zone_samarqand'],
        ['@zone_buxoro', 'https://t.me/+app_zone_buxoro'],
        ['@zone_xorazm', 'https://t.me/+app_zone_xorazm'],
      ]),
    );
  });

  it('shows a channel never checked with no numbers yet', async () => {
    const health = await channelHealth(setup());
    expect(health.channels[3]).toEqual({
      ...row('zone_xorazm'),
      subscribers: null,
      canPost: null,
      checkedAt: null,
    });
  });

  it('keeps the rows, counts the lost posts and the arrivals in D1 without a full scan', async () => {
    const db = testD1();
    const store = d1Health(db);
    const appLink = 'https://t.me/+app';
    await store.save({ channel: 'zone_buxoro', subscribers: 50, canPost: false, checkedAt: NOW, appLink });
    expect(await store.rows()).toEqual([
      { channel: 'zone_buxoro', subscribers: 50, canPost: false, checkedAt: NOW, appLink },
    ]);
    await db.exec(
      `INSERT INTO dead_notifications (bot, chat_id, text, reason, at) VALUES ('passenger', '@zone_buxoro', 't', 'telegram', ${NOW}), ('passenger', '@zone_buxoro', 't', 'telegram', ${NOW - 9 * DAY}), ('passenger', 42, 't', 'telegram', ${NOW}), ('passenger', -1004328825984, 't', 'telegram', ${NOW})`,
    );
    await db.exec(
      `INSERT INTO user_arrivals (user_id, source, via, client, arrived_at) VALUES (1, 'trip', 'ch-zone-buxoro', NULL, ${NOW}), (2, 'trip', 'site', NULL, ${NOW}), (3, 'trip', 'ch-zone-buxoro', NULL, ${NOW - 40 * DAY})`,
    );
    expect(await deadPostsByChannel(db, NOW - 7 * DAY)).toEqual(
      new Map([
        ['-1004328825984', 1],
        ['@zone_buxoro', 1],
      ]),
    );
    expect(await arrivalsByChannelVia(db, NOW - 30 * DAY)).toEqual(new Map([['ch-zone-buxoro', 1]]));
    const scans = fullScans(db).filter((scan) => /dead_notifications|user_arrivals/.test(scan));
    expect(scans).toEqual([]);
  });
});

function row(name: string) {
  return {
    chat: `@${name}`,
    title: name,
    subscribers: null,
    canPost: null,
    checkedAt: null,
    failed: 0,
    arrivals: 0,
  };
}

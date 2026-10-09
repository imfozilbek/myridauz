import type { Channel } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { deadPostsByChannel } from '../notifications/infrastructure/dead-posts';
import { arrivalsByChannelVia } from '../users/infrastructure/channel-arrivals';
import { channelHealth, checkChannels, type HealthDeps } from './application/health';
import { createMemoryHealth, d1Health } from './infrastructure/d1-health';

const NOW = Date.parse('2026-10-12T05:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const channel = (username: string): Channel => ({ username, title: username, places: ['1726'], fixed: true });
const CHANNELS = ['zone_samarqand', 'zone_buxoro', 'zone_navoiy', 'zone_xorazm'].map(channel);

function setup(): HealthDeps & { readonly asked: string[] } {
  const asked: string[] = [];
  return {
    asked,
    channels: async () => CHANNELS,
    store: createMemoryHealth(),
    count: async (username) => {
      asked.push(username);
      return username === 'zone_navoiy' ? null : 1200;
    },
    canPost: async (username) => username !== 'zone_buxoro',
    failed: async () => new Map([['zone_buxoro', 4]]),
    arrivals: async () => new Map([['ch-zone-samarqand', 17]]),
    now: () => NOW,
  };
}

// «Kanallar» of the owner (G75, docs/120): the people, the bot, the lost posts and the arrivals.
describe('the health of the channels', () => {
  it('reads a few channels an hour from Telegram, the never checked first, then the oldest', async () => {
    const deps = setup();
    await deps.store.save({
      channel: 'zone_samarqand',
      subscribers: 900,
      canPost: true,
      checkedAt: NOW - DAY,
    });
    await checkChannels(deps);
    expect(deps.asked).toEqual(['zone_buxoro', 'zone_navoiy', 'zone_xorazm']);
    const health = await channelHealth(deps);
    expect(health.channels).toEqual([
      { ...row('zone_samarqand'), subscribers: 900, canPost: true, checkedAt: NOW - DAY, arrivals: 17 },
      { ...row('zone_buxoro'), subscribers: 1200, canPost: false, checkedAt: NOW, failed: 4 },
      { ...row('zone_navoiy'), subscribers: null, canPost: true, checkedAt: NOW },
      { ...row('zone_xorazm'), subscribers: 1200, canPost: true, checkedAt: NOW },
    ]);
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
    await store.save({ channel: 'zone_buxoro', subscribers: 50, canPost: false, checkedAt: NOW });
    expect(await store.rows()).toEqual([
      { channel: 'zone_buxoro', subscribers: 50, canPost: false, checkedAt: NOW },
    ]);
    await db.exec(
      `INSERT INTO dead_notifications (bot, chat_id, text, reason, at) VALUES ('passenger', '@zone_buxoro', 't', 'telegram', ${NOW}), ('passenger', '@zone_buxoro', 't', 'telegram', ${NOW - 9 * DAY}), ('passenger', 42, 't', 'telegram', ${NOW})`,
    );
    await db.exec(
      `INSERT INTO user_arrivals (user_id, source, via, client, arrived_at) VALUES (1, 'trip', 'ch-zone-buxoro', NULL, ${NOW}), (2, 'trip', 'site', NULL, ${NOW}), (3, 'trip', 'ch-zone-buxoro', NULL, ${NOW - 40 * DAY})`,
    );
    expect(await deadPostsByChannel(db, NOW - 7 * DAY)).toEqual(new Map([['zone_buxoro', 1]]));
    expect(await arrivalsByChannelVia(db, NOW - 30 * DAY)).toEqual(new Map([['ch-zone-buxoro', 1]]));
    const scans = fullScans(db).filter((scan) => /dead_notifications|user_arrivals/.test(scan));
    expect(scans).toEqual([]);
  });
});

function row(username: string) {
  return {
    username,
    title: username,
    subscribers: null,
    canPost: null,
    checkedAt: null,
    failed: 0,
    arrivals: 0,
  };
}

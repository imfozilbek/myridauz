import type { Channel } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { channelHealth, checkChannels, type HealthDeps } from './application/health';
import { heard } from './application/my-channels';
import { createMemoryChannelMembers } from './infrastructure/channel-members';
import { d1ChannelDays } from './infrastructure/d1-channel-days';
import { createMemoryHealth } from './infrastructure/d1-health';

// 10:00 in Tashkent on 18.10.2026.
const NOW = Date.parse('2026-10-18T05:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const CHAT = '-1004328825984';
const OTHER = '-1004328825985';
const channel = (chat: string): Channel => ({ chat, title: chat, places: ['1726'], link: '', fixed: true });

function setup() {
  const db = testD1();
  const days = d1ChannelDays(db);
  const heardDeps = {
    members: createMemoryChannelMembers(),
    chats: new Set([CHAT, OTHER]),
    registered: async () => false,
    days,
  };
  const health: HealthDeps = {
    channels: async () => [channel(CHAT), channel(OTHER)],
    store: createMemoryHealth(),
    days,
    count: async () => 1200,
    canPost: async () => true,
    appLink: async () => null,
    failed: async () => new Map(),
    arrivals: async () => new Map(),
    now: () => NOW,
  };
  const move = (chat: string, was: boolean, is: boolean, at = NOW) =>
    heard(heardDeps, { chat, userId: 7, member: is, at }, was);
  return { db, days, heardDeps, health, move };
}

// G87 V5 (docs/176): the joins and leaves of each channel by day, and its people by day; only numbers.
describe('the life of the channels by day', () => {
  it('counts every join and leave of a week, of anyone, and keeps no person', async () => {
    const { heardDeps, health, move } = setup();
    await move(CHAT, false, true);
    await move(CHAT, false, true, NOW - 6 * DAY);
    await move(CHAT, true, false, NOW - DAY);
    // Eight days ago: older than the week of the screen.
    await move(CHAT, false, true, NOW - 8 * DAY);
    // A member made an admin is no move; a strange chat is not counted.
    await move(OTHER, true, true);
    await move('-100999', false, true);
    const rows = (await channelHealth(health)).channels;
    expect(rows.map(({ chat, joined, left }) => ({ chat, joined, left }))).toEqual([
      { chat: CHAT, joined: 2, left: 1 },
      { chat: OTHER, joined: 0, left: 0 },
    ]);
    expect([...(await heardDeps.members.joined(7))]).toEqual([]);
  });

  it('keeps the people of each check by the day of Tashkent, without a full scan', async () => {
    const { db, health, days } = setup();
    await checkChannels(health);
    await checkChannels({ ...health, count: async () => 1250, now: () => NOW + 1 });
    await days.moved(CHAT, '2026-10-17', true);
    expect(await days.movesSince('2026-10-12')).toEqual([
      { chat: CHAT, joined: 1, gone: 0 },
      { chat: OTHER, joined: 0, gone: 0 },
    ]);
    expect(fullScans(db)).toEqual([]);
    const kept = await db.prepare('SELECT day, chat, members FROM channel_days ORDER BY chat, day').all();
    expect(kept.results).toEqual([
      { day: '2026-10-17', chat: CHAT, members: null },
      { day: '2026-10-18', chat: CHAT, members: 1250 },
      { day: '2026-10-18', chat: OTHER, members: 1250 },
    ]);
  });
});

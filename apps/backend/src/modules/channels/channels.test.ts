import type { Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { NotificationJob } from '../notifications';
import { closeDeparted, postTrip, refreshPosts, rememberPost } from './application/channels';
import type { ChannelsDeps } from './application/ports';
import { channelsOf } from './domain/route-channels';
import { createMemoryChannelPosts } from './infrastructure/channel-posts';
import { channelPost } from './infrastructure/post-text';
import { CHANNELS, PLACES, TRIP } from './channels-fixtures';

// Before the trip leaves (TRIP departs 2.10.2026 08:30 in Tashkent).
const BEFORE = Date.parse('2026-10-01T00:00:00Z');

function setup(trip: Trip = TRIP, enabled = true) {
  let now = trip;
  let clock = BEFORE;
  const sent: NotificationJob[] = [];
  const deps: ChannelsDeps = {
    enabled,
    channels: CHANNELS,
    places: async () => PLACES,
    trip: async (id) => (id === now.id ? now : undefined),
    posts: createMemoryChannelPosts(),
    render: channelPost('test_bot'),
    send: async (jobs) => void sent.push(...jobs),
    now: () => clock,
  };
  const change = (next: Partial<Trip>) => void (now = { ...now, ...next });
  return { deps, sent, change, later: (ms: number) => void (clock = ms) };
}

describe('the channels of a trip (docs/15)', () => {
  it('posts to the channels of both regions, never to Toshkent shahri', () => {
    expect(channelsOf('1726269', '1718401', PLACES, CHANNELS)).toEqual(['ch_samarqand']);
    expect(channelsOf('1718401', '1706401', PLACES, CHANNELS)).toEqual(['ch_samarqand', 'ch_buxoro']);
    expect(channelsOf('1718401', '1718', PLACES, CHANNELS)).toEqual(['ch_samarqand']);
    expect(channelsOf('1726269', '1726', PLACES, CHANNELS)).toEqual([]);
  });
});

describe('posting and editing through the queue (docs/15)', () => {
  it('posts a new trip once per channel and edits the posts when it changes', async () => {
    const { deps, sent, change } = setup({ ...TRIP, to: '1706401' });
    await postTrip(deps, 'trip-1');
    expect(sent.map((job) => job.chatId)).toEqual(['@ch_buxoro']);
    expect(sent[0]?.after).toEqual({
      type: 'channelPost',
      tripId: 'trip-1',
      channel: 'ch_buxoro',
      shown: 'active 3 true',
    });
    await rememberPost(deps, { tripId: 'trip-1', channel: 'ch_buxoro', messageId: 41 }, 'active 3 true');
    expect(sent).toHaveLength(1);
    change({ seatsLeft: 0, status: 'full' });
    await refreshPosts(deps, 'trip-1');
    expect(sent[1]).toMatchObject({ chatId: '@ch_buxoro', edit: 41 });
    // Only the subscription stays: "Joy band qilish" is gone.
    expect(JSON.stringify(sent[1]?.markup)).not.toContain('startapp=trip_');
    expect(sent[1]?.html).toBe(true);
  });

  it('edits at once a post whose trip changed while it waited in the queue', async () => {
    const { deps, sent, change } = setup();
    change({ seatsLeft: 2 });
    await rememberPost(deps, { tripId: 'trip-1', channel: 'ch_samarqand', messageId: 7 }, 'active 3 true');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.text).toContain('💺 <b>2</b> ta boʻsh joy');
  });

  it('posts nothing while autoposting is off, nor a trip that is not active', async () => {
    const off = setup(TRIP, false);
    await postTrip(off.deps, 'trip-1');
    expect(off.sent).toEqual([]);
    const cancelled = setup({ ...TRIP, status: 'cancelled' });
    await postTrip(cancelled.deps, 'trip-1');
    await refreshPosts(cancelled.deps, 'trip-1');
    expect(cancelled.sent).toEqual([]);
  });

  it('says once in its posts that a trip has left, without "Joy band qilish"', async () => {
    const { deps, sent, later } = setup();
    await rememberPost(deps, { tripId: 'trip-1', channel: 'ch_samarqand', messageId: 7 }, 'active 3 true');
    await closeDeparted(deps);
    expect(sent).toEqual([]);
    later(TRIP.departAt);
    await closeDeparted(deps);
    await closeDeparted(deps);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.text.startsWith('<b>🚗 Safar boshlandi</b>')).toBe(true);
    expect(JSON.stringify(sent[0]?.markup)).not.toContain('startapp=trip_');
  });
});

import type { Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { NotificationJob } from '../notifications';
import { postTrip, refreshPosts, rememberPost } from './application/channels';
import type { ChannelsDeps } from './application/ports';
import { channelsOf } from './domain/route-channels';
import { createMemoryChannelPosts } from './infrastructure/channel-posts';
import { channelPost } from './infrastructure/post-text';
import { CHANNELS, PLACES, TRIP } from './channels-fixtures';

function setup(trip: Trip = TRIP, enabled = true) {
  let now = trip;
  const sent: NotificationJob[] = [];
  const deps: ChannelsDeps = {
    enabled,
    channels: CHANNELS,
    places: async () => PLACES,
    trip: async (id) => (id === now.id ? now : undefined),
    posts: createMemoryChannelPosts(),
    render: channelPost('test_bot'),
    send: async (jobs) => void sent.push(...jobs),
  };
  return { deps, sent, change: (next: Partial<Trip>) => void (now = { ...now, ...next }) };
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
      shown: 'open 3 true',
    });
    await rememberPost(deps, { tripId: 'trip-1', channel: 'ch_buxoro', messageId: 41 }, 'open 3 true');
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
    await rememberPost(deps, { tripId: 'trip-1', channel: 'ch_samarqand', messageId: 7 }, 'open 3 true');
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
});

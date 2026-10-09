import { describe, expect, it } from 'vitest';
import { closeDeparted, closePosts, postTrip, refreshPosts, rememberPost } from './application/channels';
import { channelsOf } from './domain/route-channels';
import { BEFORE, setup } from './channels-kit';
import { CHANNELS, PLACES, TRIP } from './channels-fixtures';

describe('the channels of a trip (docs/15)', () => {
  it('posts to the channels of both regions, never to Toshkent shahri', () => {
    expect(channelsOf('1726269', '1718401', PLACES, CHANNELS)).toEqual(['ch_samarqand']);
    expect(channelsOf('1718401', '1706401', PLACES, CHANNELS)).toEqual(['ch_samarqand', 'ch_buxoro']);
    expect(channelsOf('1718401', '1718', PLACES, CHANNELS)).toEqual(['ch_samarqand']);
    expect(channelsOf('1726269', '1726', PLACES, CHANNELS)).toEqual([]);
  });
});

describe('one post in several district channels (docs/63)', () => {
  it('reaches every channel whose list has a place of the trip or its region', () => {
    const places = new Map([
      ...PLACES,
      ['1710', { name: 'Qashqadaryo viloyati', parentId: null }],
      ['1710224', { name: 'Kitob', parentId: '1710' }],
      ['1710245', { name: 'Shahrisabz', parentId: '1710' }],
      ['1710250', { name: 'Yakkabogʻ', parentId: '1710' }],
    ]);
    const near = ['1710224', '1710245', '1710250'];
    const channels = [
      { username: 'ch_qashqadaryo', places: ['1710'] },
      { username: 'ch_kitob', places: near },
      { username: 'ch_shahrisabz', places: near },
      { username: 'ch_yakkabog', places: ['1710250', '1710245'] },
      { username: 'ch_samarqand', places: ['1718'] },
    ];
    expect(channelsOf('1726269', '1710245', places, channels)).toEqual([
      'ch_qashqadaryo',
      'ch_kitob',
      'ch_shahrisabz',
      'ch_yakkabog',
    ]);
    expect(channelsOf('1710224', '1718401', places, channels)).toEqual([
      'ch_qashqadaryo',
      'ch_kitob',
      'ch_shahrisabz',
      'ch_samarqand',
    ]);
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
    // «Joy band qilish» is gone, «Shunga oʻxshash safarlar» takes its place (G68, mockup g68/5).
    expect(JSON.stringify(sent[1]?.markup)).not.toContain('startapp=trip_');
    expect(JSON.stringify(sent[1]?.markup)).toContain('startapp=find_');
    expect(sent[1]?.html).toBe(true);
    // A post comes without sound: the board of the day is the one sound of a channel (docs/122).
    expect(sent[0]?.silent).toBe(true);
  });

  it('marks the links of each channel with that channel (G55, docs/116)', async () => {
    const { deps, sent } = setup({ ...TRIP, from: '1718401', to: '1706401' });
    await postTrip(deps, 'trip-1');
    const links = sent.map((job) => JSON.stringify(job.markup).match(/trip_trip-1__[a-z0-9-]+/u)?.[0]);
    expect(links).toEqual(['trip_trip-1__ch-ch-samarqand', 'trip_trip-1__ch-ch-buxoro']);
    await rememberPost(deps, { tripId: 'trip-1', channel: 'ch_buxoro', messageId: 41 }, 'active 3 true');
    await refreshPosts(deps, 'trip-1');
    expect(JSON.stringify(sent.at(-1)?.markup)).toContain('__ch-ch-buxoro');
  });

  it('edits at once a post whose trip changed while it waited in the queue', async () => {
    const { deps, sent, change } = setup();
    change({ seatsLeft: 2 });
    await rememberPost(deps, { tripId: 'trip-1', channel: 'ch_samarqand', messageId: 7 }, 'active 3 true');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.text).toContain('🟩🟩⬜⬜ 2 ta boʻsh joy');
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
    expect(sent[0]?.text.startsWith('<b>🚗 Yoʻlga chiqdi</b>')).toBe(true);
    expect(JSON.stringify(sent[0]?.markup)).not.toContain('startapp=trip_');
  });

  it('closes the posts at once when the driver pressed «Yoʻlga chiqdim» early (G63)', async () => {
    const { deps, sent, change, later } = setup();
    await rememberPost(deps, { tripId: 'trip-1', channel: 'ch_samarqand', messageId: 7 }, 'active 3 true');
    change({ departedAt: BEFORE });
    await closePosts(deps, 'trip-1');
    expect(sent[0]?.text.startsWith('<b>🚗 Yoʻlga chiqdi</b>')).toBe(true);
    later(TRIP.departAt);
    await closeDeparted(deps);
    expect(sent).toHaveLength(1);
  });
});

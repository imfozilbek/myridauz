import type { Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { NotificationJob } from '../notifications';
import { postTrip, refreshPosts, rememberPost } from './application/channels';
import type { ChannelsDeps } from './application/ports';
import { channelsOf } from './domain/route-channels';
import { createMemoryChannelPosts } from './infrastructure/channel-posts';
import { channelPost } from './infrastructure/post-text';

const PLACES = new Map([
  ['1726', { name: 'Toshkent shahri', parentId: null }],
  ['1726269', { name: 'Chilonzor', parentId: '1726' }],
  ['1718', { name: 'Samarqand viloyati', parentId: null }],
  ['1718401', { name: 'Samarqand shahri', parentId: '1718' }],
  ['1706', { name: 'Buxoro viloyati', parentId: null }],
  ['1706401', { name: 'Buxoro shahri', parentId: '1706' }],
]);
const CHANNELS = { '1718': 'ch_samarqand', '1706': 'ch_buxoro' };
const TRIP: Trip = {
  id: 'trip-1',
  driver: {
    id: 1,
    firstName: 'Jasur',
    hasAvatar: true,
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white' },
  },
  from: '1726269',
  to: '1718401',
  departAt: Date.parse('2026-10-02T03:30:00Z'),
  km: 300,
  seats: 4,
  seatsLeft: 3,
  price: 85000,
  woman: true,
  hasMeetingPoint: false,
  comment: '',
  status: 'active',
};

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

  it('writes the post without contacts, with "Band qilish" into the passenger Mini App', () => {
    const { text, markup } = channelPost('test_bot')(TRIP, PLACES);
    expect(text.replace(/\s/gu, ' ')).toBe(
      '🚗 Chilonzor, Toshkent shahri → Samarqand shahri, Samarqand viloyati ' +
        '📅 2-oktabr, juma, soat 08:30 💺 Boʻsh joylar: 3 💰 Bir joy narxi: 85 000 soʻm ' +
        '👩 Mashinada ayol bor',
    );
    expect(text).not.toContain('Jasur');
    expect(markup).toEqual({
      inline_keyboard: [[{ text: 'Band qilish', url: 'https://t.me/test_bot?startapp=trip_trip-1' }]],
    });
    const full = channelPost('test_bot')({ ...TRIP, seatsLeft: 0, status: 'full', woman: false }, PLACES);
    expect(full.text.startsWith('⛔ Joy qolmagan\n\n🚗')).toBe(true);
    expect(full.markup).toBeUndefined();
    const cancelled = channelPost('test_bot')({ ...TRIP, status: 'cancelled' }, PLACES);
    expect(cancelled.text.startsWith('❌ Safar bekor qilindi')).toBe(true);
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
    expect(sent[1]?.markup).toBeUndefined();
  });

  it('edits at once a post whose trip changed while it waited in the queue', async () => {
    const { deps, sent, change } = setup();
    change({ seatsLeft: 2 });
    await rememberPost(deps, { tripId: 'trip-1', channel: 'ch_samarqand', messageId: 7 }, 'open 3 true');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.text).toContain('Boʻsh joylar: 2');
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

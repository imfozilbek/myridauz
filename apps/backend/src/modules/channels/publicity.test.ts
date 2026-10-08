import { describe, expect, it } from 'vitest';
import { recordView, tripPublicity, type PublicityDeps, type TripFacts } from './application/publicity';
import { createMemoryChannelPosts } from './infrastructure/channel-posts';
import { createMemoryTripViews } from './infrastructure/trip-views';

const NOW = Date.parse('2026-10-08T05:00:00Z');
const DRIVER = 7;
// Toshkent shahri has no channel; the zone of Samarqand and a team channel of one district do.
const PLACES = new Map([
  ['1726', { name: 'Toshkent shahri', parentId: null }],
  ['1726273', { name: 'Mirobod tumani', parentId: '1726' }],
  ['1718', { name: 'Samarqand viloyati', parentId: null }],
  ['1718401', { name: 'Urgut tumani', parentId: '1718' }],
  ['1703', { name: 'Andijon viloyati', parentId: null }],
]);
const CHANNELS = [
  { username: 'yol_andijon', title: 'Andijon', places: ['1703'] },
  { username: 'yol_samarqand', title: 'Samarqand', places: ['1718'] },
  { username: 'yol_urgut', title: 'Urgut yoʻli', places: ['1718401'] },
];
const TRIP: TripFacts = { driverId: DRIVER, from: '1726273', to: '1718401' };
const LINK = 'https://t.me/test_bot?startapp=trip_trip-1__driver';

function setup(change: Partial<PublicityDeps> = {}) {
  const posts = createMemoryChannelPosts();
  const views = createMemoryTripViews();
  const deps: PublicityDeps = {
    enabled: true,
    trip: async (id) => (id === 'trip-1' ? TRIP : undefined),
    places: async () => PLACES,
    channels: async () => CHANNELS,
    posts,
    views,
    link: (id) => `https://t.me/test_bot?startapp=trip_${id}__driver`,
    now: () => NOW,
    ...change,
  };
  return { deps, posts, views };
}

const postedOf = async (deps: PublicityDeps) =>
  (await tripPublicity(deps, DRIVER, 'trip-1'))?.channels.map((channel) => channel.posted);

describe('what the driver sees after the publishing (G63, docs/119)', () => {
  it('names the channels of both ends with the team ones, the people who opened it and the link', async () => {
    const { deps, posts, views } = setup();
    await posts.save({ tripId: 'trip-1', channel: 'yol_samarqand', messageId: 3 }, NOW);
    await views.record('trip-1', 21, NOW);
    expect(await tripPublicity(deps, DRIVER, 'trip-1')).toEqual({
      channels: [
        { username: 'yol_samarqand', title: 'Samarqand', posted: true },
        { username: 'yol_urgut', title: 'Urgut yoʻli', posted: false },
      ],
      views: 1,
      link: LINK,
    });
  });

  // Published while the posts were off, a channel added later, a send Telegram refused: no post there.
  it('shows a post only when Telegram gave it an id', async () => {
    const { deps } = setup();
    expect(await postedOf(deps)).toEqual([false, false]);
  });

  it('shows no post while the channel posts are switched off', async () => {
    const { deps, posts } = setup({ enabled: false });
    await posts.save({ tripId: 'trip-1', channel: 'yol_samarqand', messageId: 3 }, NOW);
    expect(await postedOf(deps)).toEqual([false, false]);
  });

  it('answers only the driver of the trip', async () => {
    const { deps } = setup();
    expect(await tripPublicity(deps, 8, 'trip-1')).toBeUndefined();
    expect(await tripPublicity(deps, DRIVER, 'trip-2')).toBeUndefined();
  });
});

describe('the people who opened a trip in the app (G63, docs/119)', () => {
  it('counts each person once, never the driver, never an unknown trip', async () => {
    const { deps, views } = setup();
    for (const viewer of [21, 21, 22, DRIVER]) await recordView(deps, 'trip-1', viewer);
    await recordView(deps, 'trip-2', 23);
    expect(await views.count('trip-1')).toBe(2);
    expect(await views.count('trip-2')).toBe(0);
  });
});

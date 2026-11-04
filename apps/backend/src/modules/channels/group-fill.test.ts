import { tashkentDate, type Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { FILL_DAYS, FILL_PER_RUN, fillGroups, type GroupFillDeps } from './application/group-fill';
import { BEFORE, setup } from './channels-kit';
import { TRIP } from './channels-fixtures';

// The group of a direction (docs/222): here the Samarqand one; Buxoro stays a channel.
const GROUP = '@ch_samarqand';
// Samarqand shahri → Buxoro shahri reaches both: the group and the channel.
const BOTH = { from: '1718401', to: '1706401' };

function fill(trips: readonly Trip[], options: { enabled?: boolean; groups?: string[] } = {}) {
  const { deps, sent } = setup(TRIP, options.enabled ?? true);
  const dates: string[] = [];
  const full: GroupFillDeps = {
    ...deps,
    trip: async (id) => trips.find((trip) => trip.id === id),
    groups: new Set(options.groups ?? [GROUP]),
    tripsOf: async (date) => {
      dates.push(date);
      return date === tashkentDate(TRIP.departAt) ? trips : [];
    },
  };
  return { deps: full, sent, dates };
}

const trip = (id: string, extra: Partial<Trip> = {}): Trip => ({ ...TRIP, id, ...BOTH, ...extra });

// Owner, 04.11.2026: «Уже были поездки давай их публикуй».
describe('a group that takes the posts of a direction (docs/222)', () => {
  it('gets the open trips it lacks, the group only: a channel that had them is left alone', async () => {
    const { deps, sent } = fill([trip('a')]);
    expect(await fillGroups(deps)).toBe(1);
    expect(sent.map((job) => job.chatId)).toEqual([GROUP]);
    expect(sent[0]?.silent).toBe(true);
  });

  it('never posts a trip twice: one with its post in the group is skipped', async () => {
    const { deps, sent } = fill([trip('a')]);
    await deps.posts.save({ tripId: 'a', channel: GROUP, messageId: 7 }, TRIP.departAt);
    expect(await fillGroups(deps)).toBe(0);
    expect(sent).toEqual([]);
  });

  it('posts only trips that still offer seats, of a route that reaches a group', async () => {
    const trips = [
      trip('full', { seatsLeft: 0 }),
      trip('cancelled', { status: 'cancelled' }),
      trip('away', { from: '1726269', to: '1706401' }),
      trip('last', { seatsLeft: 1 }),
    ];
    const { deps, sent } = fill(trips);
    expect(await fillGroups(deps)).toBe(1);
    expect(sent.map((job) => job.chatId)).toEqual([GROUP]);
  });

  it('posts a few trips a run, reads the trips of today and the next days', async () => {
    const trips = Array.from({ length: FILL_PER_RUN + 2 }, (_, index) => trip(`t${index}`));
    const { deps, sent, dates } = fill(trips);
    expect(await fillGroups(deps)).toBe(FILL_PER_RUN);
    expect(sent).toHaveLength(FILL_PER_RUN);
    expect(dates).toHaveLength(FILL_DAYS);
    expect(dates[0]).toBe(tashkentDate(BEFORE));
  });

  it('does nothing while the posts are off or the brand has no group', async () => {
    for (const options of [{ enabled: false }, { groups: [] }]) {
      const { deps, sent } = fill([trip('a')], options);
      expect(await fillGroups(deps)).toBe(0);
      expect(sent).toEqual([]);
    }
  });
});

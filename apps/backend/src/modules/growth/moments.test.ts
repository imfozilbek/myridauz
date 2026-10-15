import { describe, expect, it } from 'vitest';
import type { ShareMoment } from '@platform/contracts';
import { momentCard } from './application/cards';
import { dueMoment, offeredWith } from './application/moments';
import type { CardDeps } from './application/cards';
import type { CardMessage, Ride, Side } from './application/ports';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-15T05:00:00Z');
const ride = (daysAgo: number, seats = 1): Ride => ({
  tripId: `t${daysAgo}`,
  seats,
  from: '1726273',
  to: '1718401',
  departAt: NOW - daysAgo * DAY,
});

type World = {
  rides?: Partial<Record<Side, Ride[]>>;
  joinedAt?: number;
  approvedAt?: number | null;
  offered?: ShareMoment[];
};

function deps(world: World) {
  const prepared: { side: Side; message: CardMessage; link: string }[] = [];
  const value: CardDeps = {
    store: {
      codeOf: async () => 'a1b2c3',
      impactOf: async () => ({ joined: 0, rode: 0 }),
      offered: async () => world.offered ?? [],
      offer: async () => undefined,
      approvedAt: async () => world.approvedAt ?? null,
      riders: async () => 3,
    },
    rides: async (_userId, side) => world.rides?.[side] ?? [],
    joinedAt: async () => world.joinedAt ?? NOW - 30 * DAY,
    passengerBot: 'brand_bot',
    now: () => NOW,
    nameOf: async () => 'Madina',
    placeName: async (id) => (id === '1726273' ? 'Toshkent' : 'Urgut'),
    message: (input) => ({
      text: `${input.phrase}:${input.route?.to}:${input.people}`,
      words: { title: 't', button: 'b' },
    }),
    prepare: async (side, _userId, message, link) => {
      prepared.push({ side, message, link });
      return 'prepared-1';
    },
  };
  return { value, prepared };
}

const due = async (world: World, side: Side = 'passenger') =>
  (await dueMoment(deps(world).value, 7, side)).moment;

// The moments of the cards of a person (G69, docs/123): the right moment, fresh, once, only from the data.
describe('the moments of the cards of a person', () => {
  it('greets a new passenger on the day of the registration only', async () => {
    expect(await due({ joinedAt: NOW - DAY / 2 })).toBe('join');
    expect(await due({ joinedAt: NOW - 2 * DAY })).toBeNull();
  });

  it('gives the highest round count of trips while the last trip is fresh', async () => {
    expect(await due({ rides: { passenger: [ride(1)] } })).toBe('trip1');
    expect(await due({ rides: { passenger: [1, 20, 30, 40, 50].map((days) => ride(days)) } })).toBe('trip5');
    expect(await due({ rides: { passenger: [ride(8)] } })).toBeNull();
    // A mark not offered yet comes with the next fresh trip: its words never say «the first».
    expect(await due({ rides: { passenger: [ride(1), ride(9)] } })).toBe('trip1');
  });

  it('never offers a moment twice, and a mark offers the lower ones with it', async () => {
    expect(await due({ rides: { passenger: [ride(1)] }, offered: ['trip1'] })).toBeNull();
    expect(offeredWith('trip10')).toEqual(['trip10', 'trip5', 'trip1']);
    expect(offeredWith('riders50')).toEqual(['riders50', 'riders10']);
    expect(offeredWith('driver')).toEqual(['driver']);
  });

  it('counts the people a driver brought, and greets a new driver a week', async () => {
    const twelve = [ride(1, 4), ride(3, 4), ride(5, 4)];
    expect(await due({ rides: { driver: twelve } }, 'driver')).toBe('riders10');
    expect(await due({ approvedAt: NOW - 3 * DAY }, 'driver')).toBe('driver');
    expect(await due({ approvedAt: NOW - 8 * DAY }, 'driver')).toBeNull();
  });

  it('leads a trip card to the search of its direction with the loop and the code', async () => {
    const facts = await dueMoment(deps({ rides: { passenger: [ride(1)] } }).value, 7, 'passenger');
    expect(facts).toMatchObject({
      moment: 'trip1',
      route: { from: '1726273', to: '1718401' },
      people: 4,
      link: 'https://t.me/brand_bot?startapp=find_1726273_1718401__share-trip-a1b2c3',
      joinLink: 'https://t.me/brand_bot?startapp=__share-trip-a1b2c3',
    });
  });

  it('makes a chat card only of a moment the person reached, from the app of its side', async () => {
    const { value, prepared } = deps({ rides: { passenger: [ride(1)] } });
    expect(await momentCard(value, 7, 'trip25', 0)).toBeNull();
    expect(await momentCard(value, 7, 'trip1', 2)).toEqual({
      prepared: 'prepared-1',
      link: 'https://t.me/brand_bot?startapp=find_1726273_1718401__share-trip-a1b2c3',
    });
    expect(prepared).toMatchObject([{ side: 'passenger', message: { text: '2:Urgut:4' } }]);
    const driver = deps({ offered: ['driver'] });
    expect(await momentCard(driver.value, 7, 'driver', 0)).not.toBeNull();
    expect(driver.prepared[0]?.side).toBe('driver');
  });
});

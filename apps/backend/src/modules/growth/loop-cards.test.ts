import { describe, expect, it } from 'vitest';
import { loopCard, type LoopDeps } from './application/loop-cards';
import { loopMessage } from './infrastructure/loop-text';

const DEPART = Date.parse('2026-10-16T03:00:00Z');
const REQUEST = { passengerId: 7, from: '1726273', to: '1718401', date: '2026-10-16', seats: 2 };
const SEAT = {
  passengerId: 7,
  tripId: 'trip-1',
  from: '1726273',
  to: '1718401',
  departAt: DEPART,
  seatsLeft: 2,
};
const place = async (id: string) => (id === '1726273' ? 'Toshkent' : 'Urgut');

function deps(seatsLeft = 2) {
  const prepared: string[] = [];
  const value: LoopDeps = {
    store: {
      codeOf: async () => 'a1b2c3',
      impactOf: async () => ({ joined: 0, rode: 0 }),
      offered: async () => [],
      offer: async () => undefined,
      approvedAt: async () => null,
      riders: async () => 0,
    },
    request: async (id) => (id === 'r1' ? REQUEST : undefined),
    seat: async (id) => (id === 'b1' ? { ...SEAT, seatsLeft } : undefined),
    loopMessage: (input) => loopMessage(input, place),
    links: {
      requests: (request, via) => `driver:${request.from}_${request.to}_${request.date}__${via}`,
      trip: (tripId, via) => `passenger:trip_${tripId}__${via}`,
    },
    prepare: async (side, _userId, message) => {
      prepared.push(`${side}|${message.text}|${message.words.button}`);
      return 'prepared-1';
    },
  };
  return { value, prepared };
}

// The loops 2 and 3 (G69, docs/123): the person's own request or seat, with the mark of the loop.
describe('the cards of the request and of the free seats', () => {
  it('sends a request with no offer into the group: the drivers open it in their bot', async () => {
    const { value, prepared } = deps();
    expect(await loopCard(value, 7, { loop: 'req-share', requestId: 'r1' })).toEqual({
      prepared: 'prepared-1',
      link: 'driver:1726273_1718401_2026-10-16__req-share-a1b2c3',
    });
    expect(prepared).toEqual([
      'passenger|Toshkent → Urgut, 16-oktabr\n2 kishi yoʻlga chiqmoqchi. Haydovchilar, taklif yuboring:|Taklif yuborish',
    ]);
    expect(await loopCard(value, 8, { loop: 'req-share', requestId: 'r1' })).toBeNull();
    expect(await loopCard(value, 7, { loop: 'req-share', requestId: 'r2' })).toBeNull();
  });

  it('calls a friend to the free seats of a booked trip, never to a full one', async () => {
    const { value, prepared } = deps();
    expect((await loopCard(value, 7, { loop: 'seats', bookingId: 'b1' }))?.link).toBe(
      'passenger:trip_trip-1__seats-a1b2c3',
    );
    expect(prepared[0]).toMatch(
      /^passenger\|Toshkent → Urgut, .+\nMen shu safarda boraman, yana 2 ta joy bor/u,
    );
    expect(await loopCard(deps(0).value, 7, { loop: 'seats', bookingId: 'b1' })).toBeNull();
    expect(await loopCard(value, 8, { loop: 'seats', bookingId: 'b1' })).toBeNull();
  });
});

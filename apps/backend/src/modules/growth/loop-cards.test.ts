import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { loopCard, type LoopDeps } from './application/loop-cards';
import { loopMessage } from './infrastructure/loop-text';

const brand = loadBrand();
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
const TRIP = { ...SEAT, driverId: 9, price: 90_000 };
const PLACES = new Map([
  ['1726273', { name: 'Toshkent', parentId: null }],
  ['1718401', { name: 'Urgut', parentId: null }],
]);
const PASSENGER_VALUE = 'Raqamingiz yashirin. Telegramda ochiladi. Ilova yuklab olish shart emas.';

function deps(seatsLeft = 2) {
  const prepared: string[] = [];
  const value: LoopDeps = {
    store: {
      codeOf: async () => 'a1b2c3',
      impactOf: async () => ({ joined: 0, rode: 0 }),
      offered: async () => [],
      offer: async () => undefined,
      approvedAt: async () => null,
    },
    request: async (id) => (id === 'r1' ? REQUEST : undefined),
    seat: async (id) => (id === 'b1' ? { ...SEAT, seatsLeft } : undefined),
    trip: async (id) => (id === 'trip-1' ? { ...TRIP, seatsLeft } : undefined),
    loopMessage: async (input) => loopMessage(brand, input, PLACES),
    links: {
      requests: (request, via) => `driver:${request.from}_${request.to}_${request.date}__${via}`,
      trip: (tripId, via) => `passenger:trip_${tripId}__${via}`,
      start: (via) => `passenger:start__${via}`,
    },
    prepare: async (side, _userId, message) => {
      prepared.push(`${side}|${message.photo ?? ''}|${message.text}|${message.words.button}`);
      return 'prepared-1';
    },
  };
  return { value, prepared };
}
const passenger = (userId: number, card: Parameters<typeof loopCard>[1]['card']) => ({
  userId,
  side: 'passenger' as const,
  card,
});

// The loops 2 and 3 (G69, docs/123): the person's own request or seat, with the mark of the loop.
describe('the cards of the request and of the free seats', () => {
  it('sends a request with no offer into the group: the drivers read why the brand (G88)', async () => {
    const { value, prepared } = deps();
    const card = await loopCard(value, passenger(7, { loop: 'req-share', requestId: 'r1' }));
    expect(card).toMatchObject({
      prepared: 'prepared-1',
      link: 'driver:1726273_1718401_2026-10-16__req-share-a1b2c3',
    });
    expect(card?.text.replace(/[\u00a0\u202f]/gu, ' ')).toBe(
      'Toshkent → Urgut, 16-oktabr\n2 kishi yoʻlga chiqmoqchi.\n\n' +
        'Narxni oʻzingiz belgilaysiz. Har 10 daqiqada yozish shart emas.\n' +
        'Yangi haydovchilarga 1 500 000 soʻmgacha bonus.\n' +
        'Haydovchilar, taklif yuboring:',
    );
    expect(prepared[0]).toMatch(/^passenger\|\|Toshkent → Urgut.+\|Taklif yuborish$/su);
    expect(await loopCard(value, passenger(8, { loop: 'req-share', requestId: 'r1' }))).toBeNull();
    expect(await loopCard(value, passenger(7, { loop: 'req-share', requestId: 'r2' }))).toBeNull();
  });

  it('calls a friend to the free seats of a booked trip, never to a full one', async () => {
    const { value } = deps();
    const card = await loopCard(value, passenger(7, { loop: 'seats', bookingId: 'b1' }));
    expect(card?.link).toBe('passenger:trip_trip-1__seats-a1b2c3');
    expect(card?.text).toMatch(/^Toshkent → Urgut, .+\nMen shu safarda boraman, yana 2 ta joy bor/u);
    expect(card?.text.endsWith(`\n\n${PASSENGER_VALUE}`)).toBe(true);
    expect(await loopCard(deps(0).value, passenger(7, { loop: 'seats', bookingId: 'b1' }))).toBeNull();
    expect(await loopCard(value, passenger(8, { loop: 'seats', bookingId: 'b1' }))).toBeNull();
  });
});

// The driver's own trip and «Yana ulashish» (G88, docs/193): a ready card instead of a bare link.
describe('the card of the driver trip and of «Yana ulashish»', () => {
  it('sends the driver trip with its picture from the driver bot, only while it has free seats', async () => {
    const { value, prepared } = deps();
    const photo = 'https://api.test/stories/p1';
    const card = await loopCard(value, {
      userId: 9,
      side: 'driver',
      card: { loop: 'trip', tripId: 'trip-1' },
      photo,
    });
    expect(card?.link).toBe('passenger:trip_trip-1__trip-a1b2c3');
    expect(card?.text.split('\n')[0]).toBe('Safarimda 2 ta boʻsh joy bor');
    expect(card?.text.endsWith(`\n\n${PASSENGER_VALUE}`)).toBe(true);
    expect(prepared[0]).toMatch(new RegExp(`^driver\\|${photo}\\|Safarimda .+\\|Joy band qilish$`, 'su'));
    // Another driver's trip, or a full one: nothing to send.
    const other = { userId: 7, side: 'driver' as const, card: { loop: 'trip' as const, tripId: 'trip-1' } };
    expect(await loopCard(value, other)).toBeNull();
    expect(await loopCard(deps(0).value, { ...other, userId: 9 })).toBeNull();
  });

  it('sends «Men {brand} bilan» from the app of the person, with the start of the passenger bot', async () => {
    const { value, prepared } = deps();
    const card = await loopCard(value, { userId: 9, side: 'driver', card: { loop: 'share-join' } });
    expect(card).toEqual({
      prepared: 'prepared-1',
      link: 'passenger:start__share-join-a1b2c3',
      text: `Men ${brand.name} bilan yoʻlga chiqaman. Siz ham qoʻshiling!\n\n${PASSENGER_VALUE}`,
    });
    expect(prepared[0]).toMatch(/^driver\|\|Men .+\|Men ham qoʻshilaman$/su);
  });
});

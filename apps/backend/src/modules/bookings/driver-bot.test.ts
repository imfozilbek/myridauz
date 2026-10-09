import { loadBrand } from '@platform/brands';
import { tashkentDate, tashkentDayStart, HOUR_MS, type Booking } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { Card, Ring } from '../notifications';
import { requestBooking } from './application/request';
import { driverNews, type DriverRing } from './infrastructure/driver-news';
import { telegramNotifier } from './infrastructure/telegram-notifier';
import { DILNOZA, seats, setup } from './test-kit';

const DRIVER_CHAT = 7;

// What the driver bot shows: the cards and the rings of every call (G68, docs/122).
// Noon of the day before the trip: day time, not on the road yet.
const dayBefore = (booking: Booking) => tashkentDayStart(tashkentDate(booking.trip.departAt)) - 12 * HOUR_MS;

async function driverBot(at: (booking: Booking) => number = dayBefore) {
  const { deps, addTrip } = setup();
  const asked = await requestBooking(deps, DILNOZA, addTrip(), seats(1));
  if (!asked.ok) throw new Error(asked.error);
  let booking = asked.value;
  const shown: { cards: Card[]; rings: Ring[] }[] = [];
  const news = driverNews({
    brand: loadBrand(),
    places: async () => new Map(),
    show: async (cards, rings) => void shown.push({ cards: [...cards], rings: [...rings] }),
    trip: async () => ({ trip: booking.trip, chatId: DRIVER_CHAT, bookings: [booking] }),
    now: () => at(booking),
  });
  const notifier = telegramNotifier({
    brand: loadBrand(),
    notify: async () => undefined,
    system: async () => undefined,
    placeName: async (id) => id,
    closeOnes: async () => undefined,
    passenger: async () => undefined,
    driver: (tripId, about, ring?: DriverRing) => news(tripId, about, ring),
  });
  const change = (next: Partial<Booking>) => (booking = { ...booking, ...next });
  return { notifier, shown, booking: () => booking, change };
}

describe('the driver bot about a request (G68, docs/122, mockup g68/3)', () => {
  it('a request rings as its own card under the trip; when it burns the same card says so', async () => {
    const bot = await driverBot();
    await bot.notifier.requested(bot.booking());
    const [first] = bot.shown;
    expect(first?.cards.map((card) => card.key)).toEqual([
      `trip:${bot.booking().trip.id}`,
      `ask:${bot.booking().id}`,
    ]);
    expect(first?.cards[1]).toMatchObject({ loud: true, answers: `trip:${bot.booking().trip.id}` });
    bot.change({ status: 'expired' });
    await bot.notifier.expired(bot.booking());
    const burned = bot.shown[1]?.cards[1];
    expect(burned).toMatchObject({ editOnly: true, refresh: true });
    expect(burned?.text).toContain('⌛ Javob muddati tugadi');
    expect(bot.shown[1]?.rings).toEqual([]);
  });

  it('a confirmed passenger who cancels rings: the commission is back; a request only edits', async () => {
    const bot = await driverBot();
    bot.change({ status: 'cancelled_by_passenger' });
    await bot.notifier.cancelled(bot.booking(), 'passenger');
    expect(bot.shown[0]?.rings).toEqual([]);
    bot.change({ confirmedAt: 1 });
    await bot.notifier.cancelled(bot.booking(), 'passenger');
    expect(bot.shown[1]?.rings[0]?.text).toBe(
      '🙋 Dilnoza joyini bekor qildi. Komissiya hamyoningizga qaytdi.',
    );
    expect(bot.shown[1]?.rings[0]?.quiet).toBe(false);
  });

  it('keeps quiet at night and on the road; a cancel still rings on the road', async () => {
    const night = (booking: Booking) => tashkentDayStart(tashkentDate(booking.trip.departAt)) - HOUR_MS;
    const bot = await driverBot(night);
    await bot.notifier.requested(bot.booking());
    expect(bot.shown[0]?.cards[1]?.loud).toBe(false);
    const road = await driverBot((booking) => booking.trip.departAt + HOUR_MS);
    road.change({ confirmedAt: 1, status: 'cancelled_by_passenger' });
    await road.notifier.cancelled(road.booking(), 'passenger');
    await road.notifier.came(road.booking());
    expect(road.shown.map(({ rings }) => rings[0]?.quiet)).toEqual([false, true]);
  });
});

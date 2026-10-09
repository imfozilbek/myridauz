import { loadBrand } from '@platform/brands';
import { DAY_MS, HOUR_MS, type Booking } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { Card } from '../notifications';
import { requestBooking } from './application/request';
import { askCard } from './infrastructure/ask-card';
import { driverCard } from './infrastructure/driver-card';
import { ALI, DILNOZA, seats, setup } from './test-kit';
import { PITAK, PLACES } from './card-places';

const named = (name: string) => ({
  point: { lat: 41.3, lng: 69.3 },
  name: { step: 'landmark' as const, name },
  area: null,
});

// Madina waits for an answer, Sardor is confirmed: the two rows of mockup g68/3.
async function two(): Promise<[Booking, Booking]> {
  const { deps, addTrip } = setup();
  const tripId = addTrip();
  const asked = await requestBooking(deps, DILNOZA, tripId, seats(2));
  const other = await requestBooking(deps, ALI, tripId, seats(1));
  if (!asked.ok || !other.ok) throw new Error('no booking');
  const confirmed: Booking = {
    ...other.value,
    status: 'confirmed',
    pitak: PITAK,
    dropoff: named('Registon yaqinida'),
  };
  return [{ ...asked.value, pickup: named('Chorsu bozori'), dropoff: named('Urgut markazi') }, confirmed];
}
const card = (bookings: readonly Booking[], now: number, trip = bookings[0]?.trip) =>
  driverCard({ brand: loadBrand(), chatId: 7, trip: trip as Booking['trip'], bookings, places: PLACES, now });
const buttons = (shown: Card) => JSON.stringify(shown.markup);

describe('the trip card of the driver bot (G68, docs/122, mockup g68/3)', () => {
  it('a published trip: seats taken, when, 🟢 🔴, the passengers and their answers, price', async () => {
    const [madina, sardor] = await two();
    const shown = card([madina, sardor], madina.trip.departAt - DAY_MS);
    const lines = shown.text.split('\n');
    expect(lines[0]).toBe('<b>📣 Eʼlon qilindi · 1 / 3 joy band</b>');
    expect(lines[1]).toMatch(/^<b>Ertaga, \d+-[a-zʻ]+ · \d\d:\d\d<\/b>$/u);
    expect(shown.text).toContain(
      '<blockquote>👥 Yoʻlovchilar\n1. Dilnoza, 2 joy · ⏳ javob kerak\n2. Ali, 1 joy · ✅</blockquote>',
    );
    expect(shown.text).toMatch(/💰 Bir joy <b>90\s000\ssoʻm<\/b>/u);
    expect(buttons(shown)).toContain(`?mytrip=${madina.trip.id}`);
    expect(buttons(shown)).toContain('https://t.me/share/url?url=');
    expect(shown.pin).toBe(true);
  });

  it('on the road: the order of the stops, who got in, and the road keeps quiet', async () => {
    const [madina, sardor] = await two();
    const onWay = { ...madina.trip, departedAt: madina.trip.departAt };
    const boarded: Booking = { ...sardor, trip: onWay, boardedAt: onWay.departAt };
    const shown = card([{ ...madina, trip: onWay }, boarded], onWay.departAt + HOUR_MS, onWay);
    expect(shown.text.split('\n')[0]).toBe('<b>🚗 Yoʻldasiz · yana 1 ta manzil</b>');
    expect(shown.text).toContain('1. 🚏 Ali, 1 joy · Chilonzor pitagi · ✅ chiqdi');
    expect(shown.text).toContain('2. 🏁 Ali tushadi · Registon yaqinida');
    expect(shown.text).not.toContain('Dilnoza');
    expect(shown.text).toContain('🔕 Yoʻlda');
    expect(buttons(shown)).toContain('Yetib keldik');
  });

  it('a cancelled or ended trip leaves the top of the chat', async () => {
    const [madina] = await two();
    const cancelled = card([], 0, { ...madina.trip, status: 'cancelled' });
    expect(cancelled.text.split('\n')[0]).toBe('<b>❌ Safar bekor qilindi</b>');
    expect(cancelled.pin).toBe(false);
    const arrived = card([], 0, { ...madina.trip, departedAt: 1, arrivedAt: 2 });
    expect(arrived.text.split('\n')[0]).toBe('<b>🏁 Yetib keldingiz</b>');
    expect(arrived.pin).toBe(false);
  });
});

describe('a request in the driver bot, answered right there (docs/122, mockup g68/3)', () => {
  it('who, from where to where, until when; «Qabul qilish», «Rad etish», chat and call', async () => {
    const [madina] = await two();
    const rated = { ...madina, passenger: { ...madina.passenger, rating: { average: 4.8, count: 5 } } };
    const shown = askCard({ brand: loadBrand(), chatId: 7, booking: rated, quiet: false });
    const lines = shown.text.split('\n');
    expect(lines[0]).toBe('🙋 Yangi soʻrov: <b>Dilnoza</b> ⭐ 4,8 · 2 joy');
    expect(lines[1]).toBe('🏠 Chorsu bozori → 🏠 Urgut markazi');
    expect(lines[2]).toMatch(/^<b>\d\d:\d\d gacha javob bering<\/b>$/u);
    expect(buttons(shown)).toContain(`ask:${madina.id}:yes`);
    expect(buttons(shown)).toContain(`ask:${madina.id}:no`);
    expect(buttons(shown)).toContain('💬 Chat');
    // A request refreshes the open app of the driver, at night too, when it comes quietly (docs/64).
    expect({ loud: shown.loud, answers: shown.answers, refresh: shown.refresh }).toEqual({
      loud: true,
      answers: `trip:${madina.trip.id}`,
      refresh: true,
    });
  });

  it('the answer edits the request: no buttons, never a new message', async () => {
    const [madina] = await two();
    const shown = askCard({
      brand: loadBrand(),
      chatId: 7,
      booking: { ...madina, status: 'confirmed' },
      quiet: true,
    });
    expect(shown.text).toContain('<b>✅ Qabul qilindi</b>');
    expect(shown.markup).toBeUndefined();
    expect(shown.editOnly).toBe(true);
    const late = askCard({
      brand: loadBrand(),
      chatId: 7,
      booking: { ...madina, status: 'expired' },
      quiet: true,
    });
    expect(late.text).toContain('⌛ Javob muddati tugadi');
  });
});

import { loadBrand } from '@platform/brands';
import { DAY_MS, type Booking } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { Card } from '../notifications';
import { requestBooking } from './application/request';
import { driverCard } from './infrastructure/driver-card';
import { DILNOZA, seats, setup } from './test-kit';
import { PLACES } from './card-places';

const VIA = 'trip-a1b2c3';
type Keyboard = { readonly inline_keyboard: { readonly url?: string }[][] };

async function asked(): Promise<Booking> {
  const { deps, addTrip } = setup();
  const booking = await requestBooking(deps, DILNOZA, addTrip(), seats(1));
  if (!booking.ok) throw new Error(booking.error);
  return booking.value;
}
const card = (booking: Booking, trip = booking.trip) =>
  driverCard({
    brand: loadBrand(),
    chatId: 7,
    trip,
    bookings: [booking],
    places: PLACES,
    now: trip.departAt - DAY_MS,
    via: VIA,
  });
const share = (shown: Card) =>
  (shown.markup as Keyboard | undefined)?.inline_keyboard
    .flat()
    .find((button) => button.url?.includes('share/url'));

// «🔗 Havolani yuborish» of the trip card of the driver bot (G88, docs/193): the words of the trip,
// never only a link, and the link carries the driver's code (loop trip).
describe('the share button of the driver trip card', () => {
  it('sends the words of the trip and the link with the code', async () => {
    const booking = await asked();
    const url = new URL(share(card(booking))?.url ?? '');
    expect(url.searchParams.get('url')).toBe(
      `https://t.me/${loadBrand().bots.passenger}?startapp=trip_${booking.trip.id}__${VIA}`,
    );
    const lines = (url.searchParams.get('text') ?? '').replace(/[\u00a0\u202f]/gu, ' ').split('\n');
    expect(lines[0]).toBe(`Safarimda ${booking.trip.seatsLeft} ta boʻsh joy bor`);
    expect(lines.slice(1, 3)).toEqual([
      '🟢 Chilonzor, Toshkent shahri',
      '🔴 Samarqand shahri, Samarqand viloyati',
    ]);
    expect(lines[3]).toMatch(/^🗓 \d+-[a-zʻ]+, soat \d\d:\d\d$/u);
    expect(lines[4]).toBe('💰 Bir joy 90 000 soʻm');
    expect(lines.slice(5)).toEqual([
      '',
      'Raqamingiz yashirin. Telegramda ochiladi. Ilova yuklab olish shart emas.',
    ]);
  });

  it('a full trip has nothing to send', async () => {
    const booking = await asked();
    expect(share(card(booking, { ...booking.trip, seatsLeft: 0 }))).toBeUndefined();
  });
});

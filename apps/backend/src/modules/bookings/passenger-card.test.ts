import { loadBrand } from '@platform/brands';
import { DAY_MS, HOUR_MS, tashkentDayStart, tashkentDate, type Booking } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { Card, Ring } from '../notifications';
import { requestBooking } from './application/request';
import { passengerCard } from './infrastructure/passenger-card';
import { passengerNews } from './infrastructure/passenger-news';
import { DILNOZA, seats, setup } from './test-kit';
import { PITAK, PLACES } from './card-places';

async function asked(): Promise<Booking> {
  const { deps, addTrip } = setup();
  const result = await requestBooking(deps, DILNOZA, addTrip(), seats(2));
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
const card = (booking: Booking, now = booking.trip.departAt - DAY_MS, unread = 0) =>
  passengerCard({ brand: loadBrand(), chatId: 9, booking, places: PLACES, unread, now });
const buttons = (shown: Card) => JSON.stringify(shown.markup);

describe('the trip card of the passenger bot (G68, docs/122, mockup g68/2 variant 2)', () => {
  it('a confirmed seat: status, when, 🟢 from, 🔴 to, the car with the plate, seats and price', async () => {
    const booking = await asked();
    const shown = card({ ...booking, status: 'confirmed', plate: '01A123BC', pitak: PITAK });
    const lines = shown.text.split('\n');
    expect(lines[0]).toBe('<b>✅ Joy tasdiqlandi</b>');
    expect(lines[1]).toMatch(/^<b>Ertaga, \d+-[a-zʻ]+ · \d\d:\d\d<\/b>$/u);
    expect(shown.text).toContain(
      '<blockquote>🟢 <b>Chilonzor</b>, Toshkent shahri\n🚏 Chilonzor pitagi</blockquote>',
    );
    expect(shown.text).toMatch(
      /<blockquote>🔴 <b>Samarqand shahri<\/b>, Samarqand viloyati\n🏠 .+<\/blockquote>/u,
    );
    expect(shown.text).toMatch(/<code>01 A 123 BC<\/code><\/blockquote>/u);
    expect(shown.text).toMatch(/💺 2 joy · <b>180\s000\ssoʻm<\/b>/u);
    expect(shown.footer).toMatch(/^<i>✏️ \d\d:\d\d da yangilandi<\/i>$/u);
    expect(buttons(shown)).toContain('💬 Chat');
    expect(buttons(shown)).toContain('Yaqinlarimga yuborish');
    expect(shown.pin).toBe(true);
  });

  it('a request shows no plate yet and opens the booking; a moved time keeps the old one under it', async () => {
    const booking = await asked();
    const waiting = card(booking);
    expect(waiting.text.split('\n')[0]).toBe('<b>⏳ Haydovchi javobi kutilmoqda</b>');
    expect(waiting.text).not.toContain('<code>');
    expect(buttons(waiting)).toContain(`?booking=${booking.id}`);
    const later = { ...booking.trip, departAt: booking.trip.departAt + HOUR_MS };
    expect(card({ ...booking, trip: later }, booking.trip.departAt - DAY_MS).text).toMatch(
      /<i>Avval \d\d:\d\d edi<\/i>/u,
    );
  });

  it('on the road: when the passenger arrives, and «Yetib keldim»; a name cannot break the HTML', async () => {
    const booking = await asked();
    const driver = { ...booking.trip.driver, firstName: '<Ali>' };
    const onWay = card({ ...booking, status: 'confirmed', boardedAt: 1, trip: { ...booking.trip, driver } });
    expect(onWay.text).toContain('<b>🚗 Yoʻldasiz</b>');
    expect(onWay.text).toMatch(/≈\s\d\d:\d\d yetib borasiz/u);
    expect(onWay.text).toContain('&lt;Ali&gt;');
    expect(buttons(onWay)).toContain('Yetib keldim');
  });

  it('after the arrival: «Qaytish safari» finds the trips back, the card leaves the top', async () => {
    const booking = await asked();
    const arrived = card({ ...booking, status: 'completed', arrivedAt: 1 });
    expect(arrived.text.split('\n')[0]).toBe('<b>🏁 Yetib keldingiz</b>');
    const back = `?find=${booking.trip.to}_${booking.trip.from}_`;
    expect(buttons(arrived)).toContain('🔁 Qaytish safari');
    expect(buttons(arrived)).toContain(back);
    expect(arrived.pin).toBe(false);
  });

  it('«Kelmadi» of the driver ends the seat: it says so, offers other trips, leaves the top', async () => {
    const booking = await asked();
    const missed = card({ ...booking, status: 'confirmed', noShowAt: 1 });
    expect(missed.text.split('\n')[0]).toBe('<b>❌ Haydovchi sizni uchrashuv joyida topmadi</b>');
    expect(buttons(missed)).toContain('Boshqa safar topish');
    expect(missed.pin).toBe(false);
  });

  it('counts the unread messages of the chat under the seats (docs/122 rule 5)', async () => {
    const booking = { ...(await asked()), status: 'confirmed' as const };
    expect(card(booking).text).not.toContain('yangi xabar');
    expect(
      card(booking, booking.trip.departAt - DAY_MS, 2)
        .text.split('\n')
        .at(-1),
    ).toBe('💬 2 ta yangi xabar');
  });

  it('rings quietly at night, but «2 soat qoldi» wakes the person (docs/122 rule 3)', async () => {
    const booking = await asked();
    const night = tashkentDayStart(tashkentDate(booking.trip.departAt)) + 23 * HOUR_MS;
    const rings: Ring[] = [];
    const tell = passengerNews({
      brand: loadBrand(),
      places: async () => PLACES,
      show: async (_cards, sent) => void rings.push(...sent),
      telegramId: async () => 9,
      unread: async () => 0,
      now: () => night,
    });
    await tell({ ...booking, status: 'confirmed' }, 'confirmed');
    await tell({ ...booking, status: 'confirmed', pitak: PITAK }, 'soon');
    // A message waits for the morning; a call that rings now does not (docs/122 rule 3).
    await tell({ ...booking, status: 'confirmed' }, 'message');
    await tell({ ...booking, status: 'confirmed' }, 'call');
    expect(rings.map((ring) => ring.quiet)).toEqual([true, false, true, false]);
    expect(rings[1]?.text).toMatch(/^🚏 Safarga 2 soat qoldi: \d\d:\d\d da pitakda boʻling$/u);
    expect(rings[0]?.card).toBe(`trip:${booking.id}`);
  });
});

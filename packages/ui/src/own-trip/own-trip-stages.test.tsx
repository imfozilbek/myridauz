import type { Booking, Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE, toCyrillic } from '@platform/i18n';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking, confirmed } from '../bookings/booking-test-kit';
import { openOwnTrip, renderMarket, tap, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';

afterEach(cleanup);

const MINUTE = 60 * 1000;
const asked: Booking = {
  ...booking,
  passenger: { ...booking.passenger, rating: { average: 4.8, count: 12 } },
};
const rider: Booking = { ...confirmed, id: 'b2' };

// The card of the trip in the list opens it, whatever its status (docs/83 U6).
async function openCard() {
  await openOwnTrip();
}

// «Yoʻlga chiqdim» and «Yetib keldik» go to the server (G63 B1): the trip comes back as it was.
async function open(shown: Trip, bookings: readonly Booking[]) {
  const steps = { departTrip: vi.fn(async () => shown), arriveTrip: vi.fn(async () => shown) };
  renderMarket(
    <MyTripsScreen onBack={() => undefined} />,
    testClients({
      market: { myTrips: async () => [shown], ...steps },
      bookings: { driverBookings: async () => [...bookings], driverOffers: async () => [] },
    }),
  );
  await openCard();
  return steps;
}

describe('«Mening safarim» after the publishing (mockup g63/3, phone 1)', () => {
  it('shows the amber plate, the requests with their commission, the trip and four tiles', async () => {
    await open(trip, [asked]);
    expect(await screen.findByText(toCyrillic('Safar eʼlon qilindi'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Yoʻlovchilar qidiruvda koʻrmoqda'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Joy soʻraganlar (1)'))).toBeTruthy();
    expect(screen.getByText('★ 4,8')).toBeTruthy();
    // The commission is in the card before any tap: no window in between (owner decision 06.10.2026).
    // Each part stays whole, so a narrow phone breaks the line only after «·» (docs/121).
    const parts = [...document.querySelectorAll('.seat-card-line .line-part')].map(
      (part) => part.textContent,
    );
    expect(parts.join(' ')).toMatch(/^Қатортол · \+2\sкм · комиссия 19\s000$/u);
    expect(parts).toHaveLength(3);
    expect(screen.getByText(toCyrillic('2 kishi'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Rad etish'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Tasdiqlash'))).toBeTruthy();
    // The trip: from the pitak with the day and time, the road, the end with the arrival (docs/121).
    expect(screen.getByText(toCyrillic('Qoʻyliq pitagi'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Ertaga, 08:00'))).toBeTruthy();
    expect(screen.getByText(/^≈\s320\sкм · ≈\s5 соат йўл$/u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Fargʻona shahri'))).toBeTruthy();
    expect(screen.getByText(/^≈\s13:20$/u)).toBeTruthy();
    expect(screen.getByText(/^3 бўш жой · 95\s000$/u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Faqat joylar'))).toBeTruthy();
    for (const tile of ['Yaqinlarimga', 'Hikoyaga', 'Vaqt yoki narx', 'Yoʻl xaritasi'].map((name) =>
      toCyrillic(name),
    ))
      expect(screen.getByText(tile)).toBeTruthy();
    // No main button more than an hour before the departure; the cancel is a link.
    expect(screen.queryByText(toCyrillic('Yoʻlga chiqdim'))).toBeNull();
    expect(screen.getByText(toCyrillic('Safarni bekor qilish'))).toBeTruthy();
  });

  it('says «Hamma joy band» and the rule of the whole car', async () => {
    await open({ ...trip, seatsLeft: 0, status: 'full', bookingRule: 'seats_or_car' }, []);
    expect(await screen.findByText(/^Ҳамма жой банд · 95\s000$/u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Joylar yoki salon'))).toBeTruthy();
    // Nobody yet: the passengers say so, nothing disappears (docs/121).
    expect(screen.getByText(toCyrillic('Yoʻlovchilar (0)'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Hali soʻrov yoʻq'))).toBeTruthy();
  });
});

describe('«Mening safarim» before the departure and on the way (mockup g63/3, phones 2 and 3)', () => {
  it('counts the minutes, lists the passengers and asks «Yoʻlga chiqdim»', async () => {
    vi.setSystemTime(trip.departAt - 30 * MINUTE);
    const steps = await open({ ...trip, seatsLeft: 1 }, [rider]);
    expect(await screen.findByText(toCyrillic('Joʻnashga 30 daqiqa'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('2 yoʻlovchi tasdiqlangan · 1 boʻsh joy'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Yoʻlovchilar (2)'))).toBeTruthy();
    expect(document.querySelector('.rider-name')?.textContent).toBe(`Dilnoza · ${toCyrillic('2 kishi')}`);
    expect(screen.getByText(toCyrillic('Chilonzor bozori yaqinida'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Safarni bekor qilish'))).toBeTruthy();
    await tap(toCyrillic('Yoʻlga chiqdim'));
    await vi.waitFor(() => expect(steps.departTrip).toHaveBeenCalledWith('t1'));
  });

  it('from the time of the trip is on the way as on the server: no cancel, «Yoʻlga chiqdim» stays', async () => {
    vi.setSystemTime(trip.departAt + 10 * MINUTE);
    const steps = await open({ ...trip, seatsLeft: 1 }, [rider]);
    expect(await screen.findByText(toCyrillic('Yoʻldasiz'))).toBeTruthy();
    expect(screen.getByText(/^Фарғонага ≈\s13:20\sда$/u)).toBeTruthy();
    expect(screen.queryByText(/дақиқа/u)).toBeNull();
    expect(screen.queryByText(toCyrillic('Safarni bekor qilish'))).toBeNull();
    await tap(toCyrillic('Yoʻlga chiqdim'));
    await vi.waitFor(() => expect(steps.departTrip).toHaveBeenCalledWith('t1'));
  });

  it('after an early «Yoʻlga chiqdim» is on the way and asks «Yetib keldik» (G63 B1)', async () => {
    vi.setSystemTime(trip.departAt - 15 * MINUTE);
    const left = { ...trip, seatsLeft: 1, departedAt: trip.departAt - 20 * MINUTE };
    const steps = await open(left, [rider]);
    expect(await screen.findByText(toCyrillic('Yoʻldasiz'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Safarni bekor qilish'))).toBeNull();
    expect(document.querySelector('.own-trip')?.hasAttribute('data-button')).toBe(true);
    await tap(toCyrillic('Yetib keldik'));
    await vi.waitFor(() => expect(steps.arriveTrip).toHaveBeenCalledWith('t1'));
    expect(steps.departTrip).not.toHaveBeenCalled();
  });

  it('on the way says the next point and who waits there, as the block of the main screen (G78 В2)', async () => {
    vi.setSystemTime(trip.departAt + 10 * MINUTE);
    await open({ ...trip, seatsLeft: 1, departedAt: trip.departAt }, [rider]);
    expect(await screen.findByText(toCyrillic('Yoʻldasiz · 0 / 1'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Keyingi: Chilonzor bozori yaqinida'))).toBeTruthy();
    expect(screen.getByText(`Dilnoza · ${toCyrillic('2 kishi')}`)).toBeTruthy();
  });

  it('a cancelled trip says so in grey, without a cancel or a main button', async () => {
    await open({ ...trip, status: 'cancelled' }, []);
    expect(await screen.findByText(toCyrillic('Safar bekor qilindi'))).toBeTruthy();
    expect(document.querySelector('.own-banner')?.getAttribute('data-stage')).toBe('over');
    expect(screen.queryByText(toCyrillic('Safarni bekor qilish'))).toBeNull();
    expect(screen.queryByText(toCyrillic('Yoʻlga chiqdim'))).toBeNull();
  });
});

describe('the end of the place before «≈ 13:00 da» (docs/25)', () => {
  it('follows its last letter: qa after q, ka after k, ga after the rest', () => {
    const { t } = createI18n(DEFAULT_LOCALE);
    const say = (place: string) => t('driverTrip.onWay.sub', { place, last: place.slice(-1), time: '13:00' });
    expect(say('Oltiariq')).toBe(toCyrillic('Oltiariqqa ≈\u00a013:00\u00a0da'));
    expect(say('Muborak')).toBe(toCyrillic('Muborakka ≈\u00a013:00\u00a0da'));
    expect(say('Samarqand shahri')).toBe(toCyrillic('Samarqand shahriga ≈\u00a013:00\u00a0da'));
    expect(say('Yakkabogʻ')).toBe(toCyrillic('Yakkabogʻga ≈\u00a013:00\u00a0da'));
  });
});

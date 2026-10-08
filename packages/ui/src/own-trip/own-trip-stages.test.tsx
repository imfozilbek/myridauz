import type { Booking, Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking, confirmed } from '../bookings/booking-test-kit';
import { renderMarket, tap, trip } from '../market/market-test-kit';
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
  await vi.waitFor(() => expect(document.querySelector('.trip-card')).toBeTruthy());
  fireEvent.click(document.querySelector('.trip-card') as HTMLElement);
}

async function open(shown: Trip, bookings: readonly Booking[], onTripStep = vi.fn()) {
  renderMarket(
    <MyTripsScreen onBack={() => undefined} onTripStep={onTripStep} />,
    testClients({
      market: { myTrips: async () => [shown] },
      bookings: { driverBookings: async () => [...bookings], driverOffers: async () => [] },
    }),
  );
  await openCard();
  return onTripStep;
}

describe('«Mening safarim» after the publishing (mockup g63/3, phone 1)', () => {
  it('shows the amber plate, the requests with their commission, the trip and four tiles', async () => {
    await open(trip, [asked]);
    expect(await screen.findByText('Safar eʼlon qilindi')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchilar qidiruvda koʻrmoqda')).toBeTruthy();
    expect(screen.getByText('Joy soʻraganlar (1)')).toBeTruthy();
    expect(screen.getByText('★ 4,8')).toBeTruthy();
    // The commission is in the card before any tap: no window in between (owner decision 06.10.2026).
    // Each part stays whole, so a narrow phone breaks the line only after «·» (docs/121).
    const parts = [...document.querySelectorAll('.seat-card-line .line-part')].map((part) => part.textContent);
    expect(parts.join(' ')).toMatch(/^Qatortol · \+2\skm · komissiya 19\s000$/u);
    expect(parts).toHaveLength(3);
    expect(screen.getByText('2 kishi')).toBeTruthy();
    expect(screen.getByText('Rad etish')).toBeTruthy();
    expect(screen.getByText('Tasdiqlash')).toBeTruthy();
    // The trip: from the pitak with the day and time, the road, the end with the arrival (docs/121).
    expect(screen.getByText('Qoʻyliq pitagi')).toBeTruthy();
    expect(screen.getByText('Ertaga, 08:00')).toBeTruthy();
    expect(screen.getByText(/^≈\s320\skm · ≈\s5 soat yoʻl$/u)).toBeTruthy();
    expect(screen.getByText('Fargʻona shahri')).toBeTruthy();
    expect(screen.getByText(/^≈\s13:20$/u)).toBeTruthy();
    expect(screen.getByText(/^3 boʻsh joy · 95\s000$/u)).toBeTruthy();
    expect(screen.getByText('Faqat joylar')).toBeTruthy();
    for (const tile of ['Yaqinlarimga', 'Hikoyaga', 'Vaqt yoki narx', 'Yoʻl xaritasi'])
      expect(screen.getByText(tile)).toBeTruthy();
    // No main button more than an hour before the departure; the cancel is a link.
    expect(screen.queryByText('Yoʻlga chiqdim')).toBeNull();
    expect(screen.getByText('Safarni bekor qilish')).toBeTruthy();
  });

  it('says «Hamma joy band» and the rule of the whole car', async () => {
    await open({ ...trip, seatsLeft: 0, status: 'full', bookingRule: 'seats_or_car' }, []);
    expect(await screen.findByText(/^Hamma joy band · 95\s000$/u)).toBeTruthy();
    expect(screen.getByText('Joylar yoki salon')).toBeTruthy();
    // Nobody yet: the passengers say so, nothing disappears (docs/121).
    expect(screen.getByText('Yoʻlovchilar (0)')).toBeTruthy();
    expect(screen.getByText('Hali soʻrov yoʻq')).toBeTruthy();
  });
});

describe('«Mening safarim» before the departure and on the way (mockup g63/3, phones 2 and 3)', () => {
  it('counts the minutes, lists the passengers and asks «Yoʻlga chiqdim»', async () => {
    vi.setSystemTime(trip.departAt - 30 * MINUTE);
    const onTripStep = await open({ ...trip, seatsLeft: 1 }, [rider]);
    expect(await screen.findByText('Joʻnashga 30 daqiqa')).toBeTruthy();
    expect(screen.getByText('2 yoʻlovchi tasdiqlangan · 1 boʻsh joy')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchilar (2)')).toBeTruthy();
    expect(document.querySelector('.rider-name')?.textContent).toBe('Dilnoza · 2 kishi');
    expect(screen.getByText('Chilonzor bozori yaqinida')).toBeTruthy();
    expect(screen.getByText('Safarni bekor qilish')).toBeTruthy();
    await tap('Yoʻlga chiqdim');
    expect(onTripStep).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }), 'departed');
  });

  it('from the time of the trip is on the way as on the server: no cancel, «Yoʻlga chiqdim» stays', async () => {
    vi.setSystemTime(trip.departAt + 10 * MINUTE);
    const onTripStep = await open({ ...trip, seatsLeft: 1 }, [rider]);
    expect(await screen.findByText('Yoʻldasiz')).toBeTruthy();
    expect(screen.getByText(/^Fargʻona shahriga ≈\s13:20\sda$/u)).toBeTruthy();
    expect(screen.queryByText(/daqiqa/u)).toBeNull();
    expect(screen.queryByText('Safarni bekor qilish')).toBeNull();
    await tap('Yoʻlga chiqdim');
    expect(onTripStep).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }), 'departed');
  });

  it('after an early «Yoʻlga chiqdim» is on the way and asks «Yetib keldik» (G63 B1)', async () => {
    vi.setSystemTime(trip.departAt - 15 * MINUTE);
    const left = { ...trip, seatsLeft: 1, departedAt: trip.departAt - 20 * MINUTE };
    const onTripStep = await open(left, [rider]);
    expect(await screen.findByText('Yoʻldasiz')).toBeTruthy();
    expect(screen.queryByText('Safarni bekor qilish')).toBeNull();
    expect(document.querySelector('.own-trip')?.hasAttribute('data-button')).toBe(true);
    await tap('Yetib keldik');
    expect(onTripStep).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }), 'arrived');
  });

  it('waits for the app to give the steps of the trip before showing the main button (G63 B1)', async () => {
    vi.setSystemTime(trip.departAt - 30 * MINUTE);
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip] },
        bookings: { driverBookings: async () => [], driverOffers: async () => [] },
      }),
    );
    await openCard();
    expect(await screen.findByText('Joʻnashga 30 daqiqa')).toBeTruthy();
    expect(screen.queryByText('Yoʻlga chiqdim')).toBeNull();
    expect(document.querySelector('.own-trip')?.hasAttribute('data-button')).toBe(false);
  });

  it('a cancelled trip says so in grey, without a cancel or a main button', async () => {
    await open({ ...trip, status: 'cancelled' }, []);
    expect(await screen.findByText('Safar bekor qilindi')).toBeTruthy();
    expect(document.querySelector('.own-banner')?.getAttribute('data-stage')).toBe('over');
    expect(screen.queryByText('Safarni bekor qilish')).toBeNull();
    expect(screen.queryByText('Yoʻlga chiqdim')).toBeNull();
  });
});

describe('the end of the place before «≈ 13:00 da» (docs/25)', () => {
  it('follows its last letter: qa after q, ka after k, ga after the rest', () => {
    const { t } = createI18n(DEFAULT_LOCALE);
    const say = (place: string) => t('driverTrip.onWay.sub', { place, last: place.slice(-1), time: '13:00' });
    expect(say('Oltiariq')).toBe('Oltiariqqa ≈\u00a013:00\u00a0da');
    expect(say('Muborak')).toBe('Muborakka ≈\u00a013:00\u00a0da');
    expect(say('Samarqand shahri')).toBe('Samarqand shahriga ≈\u00a013:00\u00a0da');
    expect(say('Yakkabogʻ')).toBe('Yakkabogʻga ≈\u00a013:00\u00a0da');
  });
});

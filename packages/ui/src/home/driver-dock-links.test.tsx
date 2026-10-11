import type { BookingsClient, MarketClient } from '@platform/api-client';
import { DAY_MS, HOUR_MS, MINUTE_MS, MY_TRIP_LINK } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { markApprovalSeen } from '../driver/approval-seen';
import { tap, trip } from '../market/market-test-kit';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS, linkOf } from './home-test-actions';
import { approved, renderHome } from './home-test-kit';

beforeEach(markApprovalSeen);
afterEach(cleanup);

const opened = (screenOf: string) => `${linkOf({ name: MY_TRIP_LINK, id: trip.id })} ${screenOf}`;
const home = (of: typeof trip, people: (typeof confirmed)[], market: Partial<MarketClient> = {}) =>
  renderHome(
    () => <DriverHome />,
    DRIVER_ACTIONS,
    { trips: async () => [of], requests: async () => people, market },
    approved,
  );

// The buttons of the block lead right where they say (G76, mockup g76/3 states 11, 14 and 16).
describe('the buttons of a trip in the block of a driver', { timeout: 20_000 }, () => {
  it('«Yoʻl xaritasi» opens the map of the trip, not its page', async () => {
    const soon = { ...trip, departAt: Date.now() + 40 * MINUTE_MS };
    home(soon, [{ ...confirmed, trip: soon }]);
    await tap('Yoʻl xaritasi');
    expect(screen.getByText(opened('map'))).toBeTruthy();
  });

  it('on the way the next point to pick up comes first, with «Men keldim» (G77, docs/170 О1)', async () => {
    const road = { ...trip, departAt: Date.now() + 10 * MINUTE_MS, departedAt: Date.now() - MINUTE_MS };
    const meet = vi.fn<BookingsClient['meet']>(async () => ({ ...confirmed, driverCameAt: Date.now() }));
    renderHome(
      () => <DriverHome />,
      DRIVER_ACTIONS,
      { trips: async () => [road], requests: async () => [{ ...confirmed, trip: road }], answers: { meet } },
      approved,
    );
    expect(await screen.findByText('Keyingi: Chilonzor bozori yaqinida')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Yetib keldik' })).toBeNull();
    await tap('Men keldim');
    await vi.waitFor(() => expect(meet).toHaveBeenCalledWith(confirmed.id, 'came'));
  });

  it('at a pitak on the way the card names the people who wait there, not the pitak twice', async () => {
    const road = { ...trip, departAt: Date.now() + 10 * MINUTE_MS, departedAt: Date.now() - MINUTE_MS };
    const pitak = { id: 'qoyliq', name: 'Qoʻyliq pitagi', point: { lat: 41.2438, lng: 69.3394 }, hint: null };
    home(road, [{ ...confirmed, trip: road, mode: 'pitak' as const, pitak }]);
    expect(await screen.findByText('Keyingi: Qoʻyliq pitagi')).toBeTruthy();
    expect(screen.getByText(confirmed.passenger.firstName)).toBeTruthy();
    expect(screen.getAllByText(/Qoʻyliq pitagi/u)).toHaveLength(1);
  });

  it('«Yetib keldik» marks the arrival, then «Safar tugadi» with its stars and «Qaytish»', async () => {
    const road = { ...trip, departAt: Date.now() - HOUR_MS, departedAt: Date.now() - HOUR_MS };
    const arriveTrip = vi.fn<MarketClient['arriveTrip']>(async () => ({ ...road, arrivedAt: Date.now() }));
    // Everybody is in the car: the dropoffs lead.
    home(road, [{ ...confirmed, trip: road, boardedAt: road.departAt }], { arriveTrip });
    await tap('Yetib keldik');
    expect(await screen.findByText(opened('end'))).toBeTruthy();
    expect(arriveTrip).toHaveBeenCalledWith(trip.id);
  });

  it('«Qaytish safari» opens the way back with the answers of the trip, counted once out', async () => {
    const past = { ...trip, departAt: Date.now() - DAY_MS, status: 'completed' as const };
    home(past, [{ ...confirmed, trip: past, status: 'completed' as const }]);
    await tap('Qaytish safari');
    expect(screen.getByText('opened Fargʻona shahri>Chilonzor again 3')).toBeTruthy();
  });

  it('«Baho berish» opens the stars at once, not the past trip a tap before them', async () => {
    const past = { ...trip, departAt: Date.now() - DAY_MS, status: 'completed' as const };
    home(past, [{ ...confirmed, trip: past, status: 'completed' as const }]);
    await tap('Baho berish');
    expect(screen.getByText(opened('end'))).toBeTruthy();
  });
});

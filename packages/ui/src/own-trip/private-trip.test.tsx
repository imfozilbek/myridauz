import type { MarketClient } from '@platform/api-client';
import type { Offer, Trip } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { offer } from '../bookings/booking-test-kit';
import { openOwnTrip, renderMarket, tap, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';

// The trip opened from Sardor's «Boʻsh salon kerak» request at 06:00 of its day (G64, mockup g64/3).
const NOW = trip.departAt - 2 * 3_600_000;
const hidden: Trip = { ...trip, private: true };
const asked = (status: Offer['status']): Offer => ({
  ...offer,
  tripId: trip.id,
  status,
  passenger: { id: '00000000000000000000000000000008', firstName: 'Sardor', hasAvatar: false },
});

beforeEach(() => void vi.useFakeTimers({ toFake: ['Date'], now: NOW }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function open(status: Offer['status'], openTrip = vi.fn<MarketClient['openTrip']>(async () => trip)) {
  renderMarket(
    <MyTripsScreen onBack={() => undefined} />,
    testClients({
      market: { myTrips: async () => [hidden], openTrip },
      bookings: { driverBookings: async () => [], driverOffers: async () => [asked(status)] },
    }),
  );
  await openOwnTrip();
  return openTrip;
}

describe('a trip of one «Boʻsh salon kerak» request (G64, docs/118 path 7)', { timeout: 20_000 }, () => {
  it('waits for the answer of the passenger: the plate, the trip and the cancel only', async () => {
    await open('sent');
    expect(await screen.findByText('Sardorga taklif yuborildi')).toBeTruthy();
    expect(screen.getByText('Javobini kutyapsiz. Safar boshqalarga koʻrinmaydi.')).toBeTruthy();
    expect(screen.getByText('Faqat butun salon · 3 joy')).toBeTruthy();
    expect(screen.getByText('285 000')).toBeTruthy();
    expect(screen.getByText('Safarni bekor qilish')).toBeTruthy();
    expect(screen.queryByText('Safarni hammaga ochish')).toBeNull();
    expect(screen.queryByText('Yoʻl xaritasi')).toBeNull();
  });

  it('after «Rad etish» the driver opens it for everybody', async () => {
    const openTrip = await open('declined');
    expect(await screen.findByText('Sardor taklifni rad etdi')).toBeTruthy();
    expect(screen.getByText('Safarni hammaga ochish yoki bekor qilish mumkin.')).toBeTruthy();
    await tap('Safarni hammaga ochish');
    await waitFor(() => expect(openTrip).toHaveBeenCalledWith(trip.id));
  });

  it('says when the offer ran out without an answer', async () => {
    await open('expired');
    expect(await screen.findByText('Taklif muddati tugadi')).toBeTruthy();
    expect(screen.getByText('Safarni hammaga ochish')).toBeTruthy();
  });
});

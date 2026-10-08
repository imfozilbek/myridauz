import type { ChannelsClient } from '@platform/api-client';
import type { Trip, TripPublicity } from '@platform/contracts';
import { activity, counted } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const MINUTE = 60 * 1000;
const LINK = 'https://t.me/test_bot?startapp=trip_t1__driver';
const publicity: TripPublicity = {
  channels: [
    { username: 'yol_toshkent', title: 'Toshkent yoʻli', posted: false },
    { username: 'yol_fargona', title: 'Fargʻona yoʻli', posted: true },
  ],
  views: 12,
  link: LINK,
};

function open(shown: Trip, tripPublicity: ChannelsClient['tripPublicity']) {
  renderMarket(
    <MyTripsScreen onBack={() => undefined} />,
    testClients({
      market: { myTrips: async () => [shown] },
      bookings: { driverBookings: async () => [], driverOffers: async () => [] },
      channels: { tripPublicity },
    }),
  );
}
async function openTrip() {
  await vi.waitFor(() => expect(document.querySelector('.trip-card')).toBeTruthy());
  fireEvent.click(document.querySelector('.trip-card') as HTMLElement);
}

describe('the trip in the channel on «Mening safarim» (owner decision 08.10.2026, docs/119)', () => {
  it('says the channel that posted it and how many people opened it, under the plate', async () => {
    // Quiet: a request made now does not show the top loader of the app (docs/121 §3).
    const busy: number[] = [];
    const tripPublicity = vi.fn<ChannelsClient['tripPublicity']>(async () => {
      const before = activity.busy();
      await counted(async () => void busy.push(activity.busy() - before));
      return publicity;
    });
    open(trip, tripPublicity);
    await openTrip();
    expect(await screen.findByText('Safaringiz kanalda chiqdi')).toBeTruthy();
    expect(tripPublicity).toHaveBeenCalledWith('t1');
    expect(busy).toEqual([0]);
    expect(screen.getByText('Fargʻona yoʻli · 12 kishi koʻrdi')).toBeTruthy();
    const card = document.querySelector('.own-channel') as HTMLElement;
    expect(card.previousElementSibling?.classList.contains('own-banner')).toBe(true);
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    fireEvent.click(screen.getByText('Safaringiz kanalda chiqdi'));
    expect(opened.mock.calls[0]?.[0]).toBe('https://t.me/yol_fargona');
    fireEvent.click(screen.getByText('Havolani yoʻlovchilarga yuborish'));
    await vi.waitFor(() =>
      expect(opened.mock.calls[1]?.[0]).toBe(`https://t.me/share/url?url=${encodeURIComponent(LINK)}`),
    );
  });

  it('shows only the channel while nobody opened the trip yet', async () => {
    open(trip, async () => ({ ...publicity, views: 0 }));
    await openTrip();
    expect(await screen.findByText('Fargʻona yoʻli')).toBeTruthy();
    expect(screen.queryByText(/kishi koʻrdi/u)).toBeNull();
  });

  it('keeps the link button before any channel posted the trip', async () => {
    open(trip, async () => ({ ...publicity, channels: [] }));
    await openTrip();
    expect(await screen.findByText('Havolani yoʻlovchilarga yuborish')).toBeTruthy();
    expect(screen.queryByText('Safaringiz kanalda chiqdi')).toBeNull();
  });

  it('hides on an error and once the trip is on the way', async () => {
    open(trip, async () => {
      throw new Error('network.failed');
    });
    await openTrip();
    expect(await screen.findByText('Safar eʼlon qilindi')).toBeTruthy();
    expect(document.querySelector('.own-channel')).toBeNull();
    cleanup();
    vi.setSystemTime(trip.departAt + 10 * MINUTE);
    const tripPublicity = vi.fn(async () => publicity);
    open(trip, tripPublicity);
    await openTrip();
    expect(await screen.findByText('Yoʻldasiz')).toBeTruthy();
    expect(document.querySelector('.own-channel')).toBeNull();
    expect(tripPublicity).not.toHaveBeenCalled();
  });
});

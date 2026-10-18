import { channelOf, loadBrand } from '@platform/brands';
import type { ChannelsClient, GrowthClient } from '@platform/api-client';
import type { Trip, TripPublicity } from '@platform/contracts';
import { activity, counted } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openOwnTrip, renderMarket, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';

// The channel by its name in Telegram (mockup g59/7 phone 1, owner 13.10.2026, docs/176): a channel of
// the brand by the name copied from Telegram, a channel of the team by the title the team gave it.
const FARGONA = channelOf(loadBrand(), '1730401');
const TEAM = {
  chat: '@yol_fargona',
  title: 'Fargʻona yoʻli',
  link: 'https://t.me/yol_fargona',
  posted: true,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const MINUTE = 60 * 1000;
const CARD = {
  prepared: null,
  link: 'https://t.me/test_bot?startapp=trip_t1__trip-a1b2c3',
  text: 'Safarimda 3 ta boʻsh joy bor',
};
const publicity: TripPublicity = {
  channels: [
    { chat: '@yol_toshkent', title: 'Toshkent yoʻli', link: 'https://t.me/yol_toshkent', posted: false },
    { chat: FARGONA?.chat ?? '', title: FARGONA?.title ?? '', link: 'https://t.me/+fargona', posted: true },
  ],
  views: 12,
};

function open(
  shown: Trip,
  tripPublicity: ChannelsClient['tripPublicity'],
  loopCard: GrowthClient['loopCard'] = async () => CARD,
) {
  return renderMarket(
    <MyTripsScreen onBack={() => undefined} />,
    testClients({
      market: { myTrips: async () => [shown] },
      bookings: { driverBookings: async () => [], driverOffers: async () => [] },
      channels: { tripPublicity },
      growth: { loopCard },
    }),
  );
}
async function openTrip() {
  await openOwnTrip();
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
    expect(screen.getByText('Margʻilon | Fargʻona shahri · 12 koʻrdi')).toBeTruthy();
    const card = document.querySelector('.own-channel') as HTMLElement;
    expect(card.previousElementSibling?.classList.contains('own-banner')).toBe(true);
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    fireEvent.click(screen.getByText('Safaringiz kanalda chiqdi'));
    expect(opened.mock.calls[0]?.[0]).toBe('https://t.me/+fargona');
  });

  it('sends the ready card of the trip with the driver code while it has free seats (G88)', async () => {
    const loopCard = vi.fn<GrowthClient['loopCard']>(async () => CARD);
    const { tracked } = open(trip, async () => publicity, loopCard);
    await openTrip();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    fireEvent.click(await screen.findByText('Havolani yoʻlovchilarga yuborish'));
    await vi.waitFor(() => expect(opened).toHaveBeenCalled());
    // No canvas here: the card goes as text, an old Telegram gets its words.
    expect(loopCard).toHaveBeenCalledWith({ loop: 'trip', tripId: 't1' });
    expect(opened.mock.calls[0]?.[0]).toBe(
      `https://t.me/share/url?url=${encodeURIComponent(CARD.link)}&text=${encodeURIComponent(CARD.text)}`,
    );
    // The story tile of the page has its own share_shown.
    expect(tracked.filter((event) => 'button' in event && event.button === 'trip')).toMatchObject([
      { name: 'share_shown', button: 'trip' },
      { name: 'share_done', button: 'trip', target: 'chat' },
    ]);
    cleanup();
    open({ ...trip, seatsLeft: 0 }, async () => publicity);
    await openTrip();
    expect(await screen.findByText('Safaringiz kanalda chiqdi')).toBeTruthy();
    expect(screen.queryByText('Havolani yoʻlovchilarga yuborish')).toBeNull();
  });

  it('shows only the channel while nobody opened the trip yet, a channel of the team by its title', async () => {
    open(trip, async () => ({ ...publicity, channels: [TEAM], views: 0 }));
    await openTrip();
    expect(await screen.findByText('Fargʻona yoʻli')).toBeTruthy();
    expect(screen.queryByText(/koʻrdi/u)).toBeNull();
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

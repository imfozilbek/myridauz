import type { BookingsClient, ChatClient, MarketClient } from '@platform/api-client';
import type { Booking, Trip } from '@platform/contracts';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { renderMarket, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { akmal, MEETING_NOW } from '../meeting/meet-test-kit';
import { testClients } from '../test-shell';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

type Clients = {
  readonly market?: Partial<MarketClient>;
  readonly chat?: Partial<ChatClient>;
  readonly meet?: BookingsClient['meet'];
};

async function open(shown: Trip, bookings: readonly Booking[], { market, chat, meet }: Clients) {
  renderMarket(
    <MyTripsScreen onBack={() => undefined} />,
    testClients({
      market: { myTrips: async () => [shown], ...market },
      bookings: {
        driverBookings: async () => [...bookings],
        driverOffers: async () => [],
        ...(meet && { meet }),
      },
      wallet: { mine: async () => wallet },
      ...(chat && { chat }),
    }),
  );
  await vi.waitFor(() => expect(document.querySelector('.trip-card')).toBeTruthy());
  fireEvent.click(document.querySelector('.trip-card') as HTMLElement);
}

// Two taps before the first answer: the second one does nothing (docs/65 A4).
async function twice(text: string) {
  const button = await screen.findByText(text);
  fireEvent.click(button);
  fireEvent.click(button);
  await act(async () => undefined);
}

describe('a double tap on «Mening safarim» calls the server once (G63)', { timeout: 20_000 }, () => {
  it('the cancel of the trip is asked once and sent once', async () => {
    const asked = vi.fn(() => true);
    vi.stubGlobal('confirm', asked);
    const cancelTrip = vi.fn(() => new Promise<Trip>(() => undefined));
    await open(trip, [], { market: { cancelTrip } });
    await twice('Safarni bekor qilish');
    expect(asked).toHaveBeenCalledOnce();
    expect(cancelTrip).toHaveBeenCalledOnce();
  });

  it('«Yaqinlarimga» asks the card of the family once', async () => {
    vi.stubGlobal('open', vi.fn());
    const shareTrip = vi.fn<ChatClient['shareTrip']>(() => new Promise(() => undefined));
    await open(trip, [], { chat: { shareTrip } });
    await twice('Yaqinlarimga');
    expect(shareTrip).toHaveBeenCalledOnce();
  });

  it('«Kelmadi» in the row is asked once and sent once', async () => {
    vi.setSystemTime(MEETING_NOW);
    const asked = vi.fn(() => true);
    vi.stubGlobal('confirm', asked);
    const meet = vi.fn<BookingsClient['meet']>(() => new Promise(() => undefined));
    await open(akmal.trip, [{ ...akmal, driverCameAt: MEETING_NOW }], { meet });
    await twice('Kelmadi · safar tugaguncha belgilash mumkin');
    expect(asked).toHaveBeenCalledOnce();
    expect(meet).toHaveBeenCalledOnce();
  });
});

import { DAY_MS, MINUTE_MS, MY_TRIP_LINK } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed, wallet } from '../bookings/booking-test-kit';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { madina, MEETING_NOW } from '../meeting/meet-test-kit';
import type { TripScreen } from './own-trip-opened';
import { testClients } from '../test-shell';

// The chat is a screen of its own: here only what the trip hands it.
vi.mock('../chat/chat-screen', () => ({
  ChatScreen: ({ onTrip, onBack }: { readonly onTrip?: () => void; readonly onBack: () => void }) => (
    <>
      <button type="button" onClick={onBack}>
        chat
      </button>
      {onTrip ? (
        <button type="button" onClick={onTrip}>
          the trip line
        </button>
      ) : null}
    </>
  ),
}));

afterEach(cleanup);

function open(of: typeof trip, status: typeof confirmed.status, tripScreen: TripScreen, seat = confirmed) {
  const onBack = vi.fn();
  renderMarket(
    <MyTripsScreen onBack={onBack} link={{ name: MY_TRIP_LINK, id: of.id }} tripScreen={tripScreen} />,
    testClients({
      market: { myTrips: async () => [of] },
      bookings: {
        driverBookings: async () => [{ ...seat, trip: of, status }],
        driverOffers: async () => [],
      },
      wallet: { mine: async () => wallet },
    }),
  );
  return onBack;
}

// «Yoʻl xaritasi» and «Baho berish» of the block open their screen at once (G76): «Назад» goes
// straight to the main screen, not to the page of the trip a tap before it (G77, A1).
describe('a screen of a trip opened by the block', { timeout: 20_000 }, () => {
  it('the map: «Назад» goes home', async () => {
    const soon = { ...trip, departAt: Date.now() + 40 * MINUTE_MS };
    const onBack = open(soon, 'confirmed', 'map');
    await screen.findByText(/ · \d+ yoʻlovchi$/u);
    await tap('Orqaga');
    await waitFor(() => expect(onBack).toHaveBeenCalledOnce());
  });

  it('the stars: «Назад» goes home', async () => {
    const past = { ...trip, departAt: Date.now() - DAY_MS, status: 'completed' as const };
    const onBack = open(past, 'completed', 'end');
    await screen.findByText('Safar tugadi');
    await tap('Orqaga');
    await waitFor(() => expect(onBack).toHaveBeenCalledOnce());
  });

  // The map, a point, its meeting, a chat: «Назад» walks the same way back, the map, then home.
  it('the map: the chat of a meeting comes back to the meeting, the meeting to the map', async () => {
    vi.setSystemTime(MEETING_NOW);
    const onBack = open(madina.trip, 'confirmed', 'map', madina);
    await tap('Madina · 2 joy');
    await tap('Yozish');
    // The line of the trip in the chat is this very trip: back where the chat came from.
    await tap('the trip line');
    expect(await screen.findByText('Men keldim')).toBeTruthy();
    await tap('Orqaga');
    await waitFor(() => expect(document.querySelector('.trip-map-title')).not.toBeNull());
    expect(onBack).not.toHaveBeenCalled();
  });
});

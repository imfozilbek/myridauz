import type { BookingsClient, MarketClient } from '@platform/api-client';
import type { ChatAbout, Offer } from '@platform/contracts';
import { act, waitFor } from '@testing-library/react';
import { expect, vi } from 'vitest';
import { offer } from '../bookings/booking-test-kit';
import { ChatScreen } from '../chat/chat-screen';
import { FakeSocket } from '../chat/fake-socket';
import { renderMarket, trip } from '../market/market-test-kit';
import { asked, board } from '../requests/board-test-kit';
import { testClients } from '../test-shell';

const TALK = 'tk1';

// The talk of the driver Jasur and the passenger Dilnoza about her request, before any offer.
export const talk = (role: 'driver' | 'passenger', over: Partial<ChatAbout> = {}): ChatAbout => ({
  booking: null,
  role,
  request: asked,
  offer: null,
  driver: role === 'passenger' ? trip.driver : null,
  ...over,
});

// The offer of Jasur for all 4 seats at 08:00 from the pitak, as the talk shows it.
export const salonOffer: Offer = {
  ...offer,
  seats: 4,
  wholeCar: true,
  price: 90000,
  pitak: 'Qoʻyliq pitagi',
};

type Fakes = {
  readonly about: ChatAbout[];
  readonly market?: Partial<MarketClient>;
  readonly bookings?: Partial<BookingsClient>;
};

// The chat of a talk: each load of «about» takes the next state, the last one stays.
export async function openTalk({ about, market, bookings }: Fakes) {
  const states = [...about];
  const load = vi.fn(async () => (states.length > 1 ? states.shift() : states[0]) as ChatAbout);
  renderMarket(
    <ChatScreen chatKey={TALK} onBack={() => undefined} />,
    testClients({
      chat: { socketUrl: async () => 'wss://api.test/socket', about: load },
      market: { requestBoard: async () => board(), ...market },
      bookings: { ...bookings },
    }),
  );
  await waitFor(() => expect(FakeSocket.last).not.toBeNull());
  const socket = FakeSocket.last as FakeSocket;
  act(() => {
    socket.open();
    socket.receive({ type: 'history', messages: [], canCall: true });
  });
  return { socket, load };
}

import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { ChatScreen } from '../chat/chat-screen';
import { FakeSocket } from '../chat/fake-socket';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';

beforeEach(() => vi.stubGlobal('WebSocket', FakeSocket));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// A chat opened by a ring has no title: the screen asks who and which trip (G54, docs/115).
async function ringing(role: 'passenger' | 'driver') {
  renderMarket(
    <ChatScreen chatKey={confirmed.chatKey} onBack={() => undefined} />,
    testClients({
      chat: {
        socketUrl: async () => 'wss://api.test/socket',
        about: async () => ({ booking: confirmed, role }),
      },
    }),
  );
  await waitFor(() => expect(FakeSocket.last).not.toBeNull());
  const socket = FakeSocket.last as FakeSocket;
  act(() => {
    socket.open();
    socket.receive({ type: 'history', messages: [], canCall: true });
    socket.receive({ type: 'call', call: { status: 'ringing', caller: 'other' } });
  });
  return socket;
}

const shown = () => document.body.textContent ?? '';

describe('the trip on the call screen (G54, docs/115)', () => {
  it('shows a passenger the driver, the car, the plate, the time and the seats', async () => {
    await ringing('passenger');
    const { driver } = confirmed.trip;
    await waitFor(() => expect(shown()).toContain(`Haydovchi · ${driver.car.model}`));
    expect(screen.getAllByText(driver.firstName).length).toBeGreaterThan(0);
    expect(shown()).toContain(`${confirmed.seats} kishi`);
    expect(screen.getByLabelText(/→/u)).toBeTruthy();
  });

  it('shows a driver the passenger; the headphones hint comes once the voice connects', async () => {
    const socket = await ringing('driver');
    await waitFor(() => expect(screen.getAllByText(confirmed.passenger.firstName).length).toBeGreaterThan(0));
    expect(screen.getByText('Yoʻlovchi')).toBeTruthy();
    expect(shown()).not.toContain('Quloqchin');
    act(() => socket.receive({ type: 'call', call: { status: 'active', caller: 'other' } }));
    expect(screen.getByText('Quloqchin taqsangiz, ovoz faqat sizga eshitiladi.')).toBeTruthy();
  });
});

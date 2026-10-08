import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
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
        about: async () => ({ booking: confirmed, role, request: null, offer: null, driver: null }),
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

describe('the call (G60, mockup g60/4): the face, the car, the one trip card', () => {
  it('shows a passenger the driver with the car and plate, and the card of the booking', async () => {
    await ringing('passenger');
    expect(await screen.findByText('Sizga qoʻngʻiroq qilishyapti')).toBeTruthy();
    const call = within(screen.getByRole('dialog', { name: 'Qoʻngʻiroq' }));
    expect(call.getByText(/^Cobalt, /u)).toBeTruthy();
    expect(call.getByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    expect(call.getByText(/olib ketish joyi$/u)).toBeTruthy();
    expect(call.getByText('2 joy')).toBeTruthy();
    expect(call.getByText('Ilovani yopmang: qoʻngʻiroq uziladi.')).toBeTruthy();
  });

  it('shows a driver the passenger, one hint only, also while talking', async () => {
    const socket = await ringing('driver');
    const call = within(await screen.findByRole('dialog', { name: 'Qoʻngʻiroq' }));
    expect(call.getAllByText(confirmed.passenger.firstName).length).toBeGreaterThan(0);
    expect(call.queryByRole('img', { name: '01 A 123 BC' })).toBeNull();
    act(() => socket.receive({ type: 'call', call: { status: 'active', caller: 'other' } }));
    expect(screen.queryByText(/Quloqchin/u)).toBeNull();
    expect(call.getByText(/^\d{2}:\d{2}$/u)).toBeTruthy();
  });
});

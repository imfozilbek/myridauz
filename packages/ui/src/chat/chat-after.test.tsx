import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { arrivalAt } from '@platform/contracts';
import { confirmed } from '../bookings/booking-test-kit';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ChatScreen } from './chat-screen';
import { FakeSocket } from './fake-socket';

beforeEach(() => vi.stubGlobal('WebSocket', FakeSocket));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const HOUR = 3_600_000;
const done = { ...confirmed, status: 'completed' as const, plate: null };
const ended = arrivalAt(done.trip.departAt, done.trip.km);

describe('the chat in the 24 hours after the trip (G60, docs/129, mockup g60/7)', () => {
  it('marks the end of the trip and says until when one can write', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: ended + HOUR });
    const about = async () => ({ booking: done, role: 'passenger' as const });
    renderMarket(
      <ChatScreen chatKey="b1" title="Jasur" onBack={() => undefined} />,
      testClients({ chat: { socketUrl: async () => 'wss://api.test/socket', about } }),
    );
    await waitFor(() => expect(FakeSocket.last).toBeTruthy());
    const socket = FakeSocket.last as FakeSocket;
    act(() => {
      socket.open();
      socket.receive({
        type: 'history',
        messages: [{ id: 1, author: 'other', text: 'Rahmat', event: null, at: ended + 60_000 }],
        canCall: true,
        canWrite: true,
      });
    });
    expect(await screen.findByText(/· safar tugadi$/u)).toBeTruthy();
    expect(screen.getByText('Safar tugadi')).toBeTruthy();
    expect(screen.getByPlaceholderText(/^Xabar · (bugun|ertaga) .* gacha$/u)).toBeTruthy();
    vi.useRealTimers();
  });
});

import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ChatScreen } from './chat-screen';
import { FakeSocket } from './fake-socket';

beforeEach(() => vi.stubGlobal('WebSocket', FakeSocket));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('the chat 24 hours after the trip (G60, docs/129)', () => {
  it('keeps the messages and puts «Suhbat yopildi» in place of the field', async () => {
    renderMarket(
      <ChatScreen chatKey="b1" title="Jasur" onBack={() => undefined} />,
      testClients({ chat: { socketUrl: async () => 'wss://api.test/socket' } }),
    );
    await waitFor(() => expect(FakeSocket.last).toBeTruthy());
    const socket = FakeSocket.last as FakeSocket;
    act(() => {
      socket.open();
      socket.receive({
        type: 'history',
        messages: [{ id: 1, author: 'other', text: 'Rahmat', event: null, at: 1 }],
        canCall: false,
        canWrite: false,
      });
    });
    expect(screen.getByText('Rahmat')).toBeTruthy();
    expect(screen.getByText('Suhbat yopildi')).toBeTruthy();
    expect(screen.queryByLabelText('Xabar')).toBeNull();
  });

  it('offers the new trips of the driver under the closed chat (mockup g60/6)', async () => {
    const onAgain = vi.fn();
    renderMarket(
      <ChatScreen chatKey="b1" title="Jasur" onBack={() => undefined} onAgain={onAgain} />,
      testClients({ chat: { socketUrl: async () => 'wss://api.test/socket' } }),
    );
    await waitFor(() => expect(FakeSocket.last).toBeTruthy());
    act(() => {
      (FakeSocket.last as FakeSocket).open();
      (FakeSocket.last as FakeSocket).receive({
        type: 'history',
        messages: [],
        canCall: false,
        canWrite: false,
      });
    });
    screen.getByText('Jasurning yangi safarlari').click();
    expect(onAgain).toHaveBeenCalled();
  });
});

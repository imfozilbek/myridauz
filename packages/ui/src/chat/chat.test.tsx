import type { ChatClient } from '@platform/api-client';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
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

const KEY = 'b00000000-0000-4000-8000-0000000000b1';
const socketUrl = vi.fn<ChatClient['socketUrl']>(async () => 'wss://api.test/chats/x/socket?ticket=t');

describe('the chat screen (docs/07)', () => {
  it('shows the history, sends a message and warns about a hidden contact', async () => {
    const { tracked } = renderMarket(
      <ChatScreen chatKey={KEY} title="Jasur" onBack={() => undefined} />,
      testClients({ chat: { socketUrl } }),
    );
    await screen.findByText('Hali xabar yoʻq. Birinchi boʻlib yozing.');
    const socket = FakeSocket.last;
    if (!socket) throw new Error('no socket');
    act(() => {
      socket.open();
      socket.receive({
        type: 'history',
        messages: [
          { id: 1, author: 'system', text: '', event: 'requested', at: 1 },
          { id: 2, author: 'other', text: 'Salom', event: null, at: 2 },
        ],
        canCall: false,
      });
    });
    expect(screen.getByText('Joy soʻraldi')).toBeTruthy();
    expect(screen.getByText('Salom')).toBeTruthy();
    // Not confirmed yet: no call button (docs/08).
    expect(screen.queryByText('Qoʻngʻiroq')).toBeNull();
    expect(screen.getByLabelText('Xabar').tagName).toBe('TEXTAREA');
    fireEvent.change(screen.getByLabelText('Xabar'), { target: { value: 'Qayerda uchrashamiz?' } });
    fireEvent.click(screen.getByText('Yuborish'));
    expect(JSON.parse(socket.sent[0] ?? '{}')).toEqual({ type: 'send', text: 'Qayerda uchrashamiz?' });
    act(() => {
      socket.receive({
        type: 'message',
        message: { id: 3, author: 'me', text: 'Raqam ***', event: null, at: 3 },
      });
      socket.receive({ type: 'warning' });
    });
    expect(screen.getByText('Raqam ***')).toBeTruthy();
    expect(screen.getByText(/Telefon raqami va havolalarni/)).toBeTruthy();
    expect(tracked.map((event) => event.name)).toEqual(
      expect.arrayContaining(['chat_open', 'chat_first_message']),
    );
  });

  it('offers to try again when the chat cannot be reached', async () => {
    const failing = vi.fn<ChatClient['socketUrl']>(async () => Promise.reject(new Error('down')));
    renderMarket(
      <ChatScreen chatKey={KEY} onBack={() => undefined} />,
      testClients({ chat: { socketUrl: failing } }),
    );
    expect(await screen.findByText('Chatga ulanib boʻlmadi')).toBeTruthy();
    fireEvent.click(screen.getByText('Qayta urinish'));
    expect(failing).toHaveBeenCalledTimes(2);
  });

  it('comes back by itself after the connection drops, keeping the messages (docs/65 B7)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    renderMarket(<ChatScreen chatKey={KEY} onBack={() => undefined} />, testClients({ chat: { socketUrl } }));
    await vi.waitFor(() => expect(FakeSocket.last).toBeTruthy());
    const first = FakeSocket.last;
    act(() => {
      first?.open();
      first?.receive({
        type: 'message',
        message: { id: 1, author: 'other', text: 'Salom', event: null, at: 1 },
      });
      first?.close();
    });
    expect(screen.queryByText('Chatga ulanib boʻlmadi')).toBeNull();
    expect(screen.getByText('Salom')).toBeTruthy();
    await act(async () => void (await vi.advanceTimersByTimeAsync(1000)));
    expect(FakeSocket.last).not.toBe(first);
    vi.useRealTimers();
  });

  it('keeps "back" on the error screen: a bad network never locks the person in (docs/65 B1)', async () => {
    const onBack = vi.fn();
    const failing = vi.fn<ChatClient['socketUrl']>(async () => Promise.reject(new Error('down')));
    renderMarket(<ChatScreen chatKey={KEY} onBack={onBack} />, testClients({ chat: { socketUrl: failing } }));
    await screen.findByText('Chatga ulanib boʻlmadi');
    fireEvent.click(screen.getByText('Orqaga'));
    expect(onBack).toHaveBeenCalled();
  });
});

import { loadBrand } from '@platform/brands';
import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { holdLiveCall } from '../call/live-call';
import { sheetClosed } from '../home/home-test-kit';
import { ChatLink } from '../chat/chat-link';
import { FakeSocket } from '../chat/fake-socket';
import { FeedCallContext } from '../feed/feed-context';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';

// The chat screen itself is tested apart: here only which chat opens and how.
vi.mock('../chat/chat-screen', () => ({
  ChatScreen: ({ chatKey, answer }: { readonly chatKey: string; readonly answer?: boolean }) => (
    <p>{`chat ${chatKey}${answer ? ' answer' : ''}`}</p>
  ),
}));
beforeEach(() => {
  FakeSocket.last = null;
  vi.stubGlobal('WebSocket', FakeSocket);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const KEY = 'b00000000-0000-4000-8000-0000000000e1';

function shown() {
  let ring: (chat: string) => void = () => undefined;
  const subscribe = (listener: (chat: string) => void) => {
    ring = listener;
    return () => undefined;
  };
  renderMarket(
    <FeedCallContext.Provider value={subscribe}>
      <ChatLink>
        <p>home</p>
      </ChatLink>
    </FeedCallContext.Provider>,
    testClients({
      chat: {
        socketUrl: async () => 'wss://api.test/socket',
        about: async () => ({
          booking: confirmed,
          role: 'passenger',
          request: null,
          offer: null,
          driver: null,
        }),
      },
    }),
  );
  return (chat: string) => act(() => ring(chat));
}

async function ringing() {
  shown()(KEY);
  await waitFor(() => expect(FakeSocket.last).not.toBeNull());
  const socket = FakeSocket.last as FakeSocket;
  act(() => {
    socket.open();
    socket.receive({ type: 'history', messages: [], canCall: true });
    socket.receive({ type: 'call', call: { status: 'ringing', caller: 'other' } });
  });
  const sent = () => socket.sent.map((data) => JSON.parse(data) as Record<string, unknown>);
  return { socket, sent };
}

// A call while the Mini App is open (G68, docs/122, mockup g68/8 «Qoʻngʻiroq»): a sheet over the
// screen, not the whole chat; the screen under it stays.
describe('the sheet of a call (G68)', () => {
  it('says who calls about which trip; «Rad etish» declines it', async () => {
    const { sent } = await ringing();
    expect(await screen.findByText(`Qoʻngʻiroq · ${loadBrand().name} orqali`)).toBeTruthy();
    expect(screen.getByText('Jasur')).toBeTruthy();
    expect(screen.getByText('Raqamlar yashirin')).toBeTruthy();
    expect(screen.getByText('home')).toBeTruthy();
    await tap('Rad etish');
    await waitFor(() => expect(sent()).toContainEqual({ type: 'call', action: 'decline' }));
    await sheetClosed();
  });

  it('«Javob berish» opens the chat and takes the call there', async () => {
    await ringing();
    await tap('Javob berish');
    expect(await screen.findByText(`chat ${KEY} answer`)).toBeTruthy();
    await sheetClosed();
  });

  it('the caller hung up: the sheet goes by itself', async () => {
    const { socket } = await ringing();
    await screen.findByText('Javob berish');
    act(() => socket.receive({ type: 'call', call: null }));
    await waitFor(() => expect(screen.queryByText('Javob berish')).toBeNull());
    // The drawer closes on its own timer: the test waits for it before the window goes (lesson 203).
    await sheetClosed();
  });

  it('a live call keeps the screen: another caller goes through the bot', () => {
    const release = holdLiveCall();
    shown()(KEY);
    expect(FakeSocket.last).toBeNull();
    expect(screen.getByText('home')).toBeTruthy();
    release();
  });
});

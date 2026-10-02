import type { ChatMessage } from '@platform/contracts';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ChatScreen } from './chat-screen';
import { FakeSocket } from './fake-socket';

const KEY = 'b00000000-0000-4000-8000-0000000000b1';
const toEnd = vi.fn();
const INPUT_HEIGHT = 132;

beforeEach(() => {
  vi.stubGlobal('WebSocket', FakeSocket);
  Element.prototype.scrollIntoView = toEnd;
  toEnd.mockClear();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const message = (id: number, author: 'me' | 'other', text = `Xabar ${id}`): ChatMessage => ({
  id,
  author,
  text,
  event: null,
  at: id,
});
// The page is long: 3000 px, the person sees 700 of them from y.
const scrollAt = (y: number) => {
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 700, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  fireEvent.scroll(window);
};

async function openChat() {
  const view = renderMarket(
    <ChatScreen chatKey={KEY} title="Jasur" onBack={() => undefined} />,
    testClients({ chat: { socketUrl: async () => 'wss://api.test/socket' } }),
  );
  await waitFor(() => expect(FakeSocket.last).not.toBeNull());
  const socket = FakeSocket.last as FakeSocket;
  act(() => socket.open());
  return { ...view, socket };
}

describe('the chat stays where the person reads (docs/94 F10, S5, C3)', () => {
  it('F10: the first messages show the end; a new one moves down only at the end or for an own message', async () => {
    const { socket } = await openChat();
    const older = Array.from({ length: 25 }, (_, index) => message(index + 1, 'other'));
    act(() => socket.receive({ type: 'history', messages: older, canCall: false }));
    expect(toEnd).toHaveBeenCalledOnce();
    scrollAt(0);
    act(() => socket.receive({ type: 'message', message: message(26, 'other') }));
    expect(toEnd).toHaveBeenCalledOnce();
    act(() => socket.receive({ type: 'message', message: message(27, 'me') }));
    expect(toEnd).toHaveBeenCalledTimes(2);
    scrollAt(2250);
    act(() => socket.receive({ type: 'message', message: message(28, 'other') }));
    expect(toEnd).toHaveBeenCalledTimes(3);
  });

  it('S5: the messages keep room for the input as tall as it is now', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(INPUT_HEIGHT);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly changed: () => void) {}
        observe() {
          this.changed();
        }
        disconnect() {}
      },
    );
    const { container } = await openChat();
    const chat = container.querySelector('.chat') as HTMLElement;
    expect(chat.style.getPropertyValue('--chat-input-height')).toBe(`${INPUT_HEIGHT}px`);
  });

  it('C3: the text goes only when the chat delivered it; a closed chat keeps it as a draft', async () => {
    const { socket, unmount } = await openChat();
    const field = () => screen.getByLabelText('Xabar') as HTMLTextAreaElement;
    fireEvent.change(field(), { target: { value: 'Qayerda uchrashamiz?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Yuborish' }));
    expect(socket.sent).toHaveLength(1);
    expect(field().value).toBe('Qayerda uchrashamiz?');
    unmount();
    await openChat();
    expect(field().value).toBe('Qayerda uchrashamiz?');
    act(() => FakeSocket.last?.receive({ type: 'message', message: message(1, 'other', 'Salom') }));
    fireEvent.click(screen.getByRole('button', { name: 'Yuborish' }));
    act(() =>
      FakeSocket.last?.receive({ type: 'message', message: message(2, 'me', 'Qayerda uchrashamiz?') }),
    );
    expect(field().value).toBe('');
    cleanup();
    await openChat();
    expect(field().value).toBe('');
  });
});

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSocket } from '../chat/fake-socket';
import { useList } from '../market/use-list';
import { FeedProvider } from './feed-provider';

beforeEach(() => {
  FakeSocket.last = null;
  vi.stubGlobal('WebSocket', FakeSocket);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// A list screen like "Mening safarlarim": what the API gives, and when it is still loading.
function Seats({ load }: { readonly load: () => Promise<string[]> }) {
  const { items } = useList(load);
  return <p>{items === null ? 'loading' : items.join(',')}</p>;
}

function setup() {
  let wake: () => void = () => undefined;
  const onWake = vi.fn((listener: () => void) => {
    wake = listener;
    return () => undefined;
  });
  const connect = vi.fn(async () => 'wss://api.test/feed/socket?ticket=t');
  let answer = ['booked'];
  const load = vi.fn(async () => answer);
  render(
    <FeedProvider connect={connect} onWake={onWake}>
      <Seats load={load} />
    </FeedProvider>,
  );
  return { connect, load, wake: () => wake(), answer: (next: string[]) => void (answer = next) };
}

describe('live updates of the screens (docs/64, G19)', () => {
  it('refreshes the open screen quietly when another person changed something', async () => {
    const feed = setup();
    await screen.findByText('booked');
    const socket = FakeSocket.last;
    if (!socket) throw new Error('no socket');
    expect(socket.url).toBe('wss://api.test/feed/socket?ticket=t');
    feed.answer(['confirmed']);
    act(() => {
      socket.open();
      socket.receive({ type: 'changed' });
    });
    // The old data stays until the fresh data comes: no skeleton, no blink.
    expect(screen.getByText('booked')).toBeTruthy();
    await screen.findByText('confirmed');
    expect(screen.queryByText('loading')).toBeNull();
    // Anything else on the socket is not a change.
    act(() => socket.receive({ type: 'other' }));
    expect(feed.load).toHaveBeenCalledTimes(2);
  });

  it('refreshes when the person comes back and opens a lost socket again', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const feed = setup();
    await screen.findByText('booked');
    const first = FakeSocket.last;
    act(() => first?.close());
    feed.answer(['cancelled']);
    act(() => feed.wake());
    await screen.findByText('cancelled');
    await waitFor(() => expect(feed.connect).toHaveBeenCalledTimes(2));
    expect(FakeSocket.last).not.toBe(first);
    // A lost socket also comes back by itself after a pause.
    act(() => FakeSocket.last?.close());
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    await waitFor(() => expect(feed.connect).toHaveBeenCalledTimes(3));
  });

  it('tries again later when there is no ticket', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const connect = vi.fn(async () => Promise.reject(new Error('offline')));
    render(
      <FeedProvider connect={connect} onWake={() => () => undefined}>
        <p>screen</p>
      </FeedProvider>,
    );
    await waitFor(() => expect(connect).toHaveBeenCalledTimes(1));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    await waitFor(() => expect(connect).toHaveBeenCalledTimes(2));
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(connect).toHaveBeenCalledTimes(2);
  });
});

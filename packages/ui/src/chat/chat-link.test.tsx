import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { holdLiveCall } from '../call/live-call';
import { FeedCallContext } from '../feed/feed-context';
import { ChatLink } from './chat-link';

// The chat screen itself is tested apart: here only which chat opens.
vi.mock('./chat-screen', () => ({
  ChatScreen: ({ chatKey }: { readonly chatKey: string }) => <p>chat {chatKey}</p>,
}));
afterEach(cleanup);

const FIRST = 'b00000000-0000-0000-0000-000000000001';
const SECOND = 'b00000000-0000-0000-0000-000000000002';

function setup() {
  let ring: (chat: string) => void = () => undefined;
  const subscribe = (listener: (chat: string) => void) => {
    ring = listener;
    return () => undefined;
  };
  render(
    <FeedCallContext.Provider value={subscribe}>
      <ChatLink>
        <p>home</p>
      </ChatLink>
    </FeedCallContext.Provider>,
  );
  return (chat: string) => act(() => ring(chat));
}

describe('a ringing call opens its chat (G54, docs/115)', () => {
  it('opens the chat of the call over any screen, and the next call over the open chat', () => {
    const ring = setup();
    expect(screen.getByText('home')).toBeTruthy();
    ring(FIRST);
    expect(screen.getByText(`chat ${FIRST}`)).toBeTruthy();
    ring(SECOND);
    expect(screen.getByText(`chat ${SECOND}`)).toBeTruthy();
  });

  it('keeps a live call on the screen: the other caller goes through the bot', () => {
    const ring = setup();
    ring(FIRST);
    const release = holdLiveCall();
    ring(SECOND);
    expect(screen.getByText(`chat ${FIRST}`)).toBeTruthy();
    release();
  });
});

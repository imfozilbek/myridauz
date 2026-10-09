import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { ChatLink } from './chat-link';
import { useOpenChat } from './open-chat';

// The chat screen itself is tested apart: here only which chat opens and how. A ringing call comes
// as a sheet now (G68): action-sheet/call-sheet.test.tsx.
vi.mock('./chat-screen', () => ({
  ChatScreen: ({ chatKey, ring }: { readonly chatKey: string; readonly ring?: boolean }) => (
    <p>{`chat ${chatKey}${ring ? ' ring' : ''}`}</p>
  ),
}));
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const KEY = 'b00000000-0000-4000-8000-000000000001';

function Home() {
  const open = useOpenChat();
  return (
    <button type="button" onClick={() => open(KEY, 'ring')}>
      call
    </button>
  );
}

describe('the chat over any screen (docs/07, G68)', () => {
  it('a bot link opens its chat at once', () => {
    window.history.replaceState(null, '', `/?chat=${KEY}`);
    renderInShell(
      <ChatLink>
        <p>home</p>
      </ChatLink>,
    );
    expect(screen.getByText(`chat ${KEY}`)).toBeTruthy();
  });

  it('«Qoʻngʻiroq» of a sheet opens the chat and rings', () => {
    renderInShell(
      <ChatLink>
        <Home />
      </ChatLink>,
    );
    act(() => void fireEvent.click(screen.getByText('call')));
    expect(screen.getByText(`chat ${KEY} ring`)).toBeTruthy();
  });
});

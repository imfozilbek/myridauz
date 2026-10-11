import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackButton } from '../telegram/back-button';
import { pressBack } from '../test-native';
import { renderInShell } from '../test-shell';
import { ChatLink } from './chat-link';
import { useOpenChat } from './open-chat';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));
// The chat screen itself is tested apart: here only which chat opens and how, and its «Назад». A
// ringing call comes as a sheet now (G68): action-sheet/call-sheet.test.tsx.
vi.mock('./chat-screen', async () => {
  const { BackButton: Back } = await import('../telegram/back-button');
  type Props = { readonly chatKey: string; readonly ring?: boolean; readonly onBack: () => void };
  return {
    ChatScreen: ({ chatKey, ring, onBack }: Props) => (
      <>
        <p>{`chat ${chatKey}${ring ? ' ring' : ''}`}</p>
        <Back onClick={onBack} />
      </>
    ),
  };
});
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

  // The two buttons under a trip card of a bot (G77): «📞 Qoʻngʻiroq» starts the call at once.
  it('«📞 Qoʻngʻiroq» of a bot rings at once; back forgets the link', () => {
    window.history.replaceState(null, '', `/?call=${KEY}`);
    renderInShell(
      <ChatLink>
        <p>home</p>
      </ChatLink>,
      true,
    );
    expect(screen.getByText(`chat ${KEY} ring`)).toBeTruthy();
    act(() => pressBack());
    expect(screen.getByText('home')).toBeTruthy();
    expect(window.location.search).toBe('');
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

describe('back from a chat opened over the app (G76)', () => {
  it('comes to the very screen that opened it, as it was; the screen gives «Назад» to the chat', () => {
    const left = vi.fn();
    function Counted() {
      const open = useOpenChat();
      const [count, setCount] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setCount(count + 1)}>{`seen ${count}`}</button>
          <button type="button" onClick={() => open(KEY)}>
            write
          </button>
          <BackButton onClick={left} />
        </>
      );
    }
    renderInShell(
      <ChatLink>
        <Counted />
      </ChatLink>,
      true,
    );
    fireEvent.click(screen.getByText('seen 0'));
    act(() => void fireEvent.click(screen.getByText('write')));
    expect(screen.getByText(`chat ${KEY}`)).toBeTruthy();
    act(() => pressBack());
    expect(screen.queryByText(`chat ${KEY}`)).toBeNull();
    expect(screen.getByText('seen 1')).toBeTruthy();
    expect(left).not.toHaveBeenCalled();
    act(() => pressBack());
    expect(left).toHaveBeenCalledOnce();
  });
});

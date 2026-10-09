import { CHAT_KEY } from '@platform/contracts';
import { useCallback, useState, type ReactNode } from 'react';
import { ActionSheet } from '../action-sheet/action-sheet';
import { CallSource } from '../action-sheet/kinds/call-source';
import { callIsLive } from '../call/live-call';
import { useFeedCall } from '../feed/feed-context';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { ChatScreen } from './chat-screen';
import { OpenChatContext, type OpenChat } from './open-chat';

const PARAM = 'chat';

type Open = { readonly key: string; readonly mode?: 'ring' | 'answer' };

// "Yangi xabar" from the bot opens its chat at once (docs/07); back goes to the main screen.
// A call that rings for this person while the app is open comes as a sheet over the screen, unless
// a call is live (docs/122): «Javob berish» opens its chat. The sheet of the app lives here, over
// every screen.
export function ChatLink({ children }: { readonly children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(() => {
    const key = launchParam(PARAM, CHAT_KEY);
    return key ? { key } : null;
  });
  const [ringing, setRinging] = useState<string | null>(null);
  useFeedCall((chat) => {
    if (chat !== open?.key && !callIsLive()) setRinging(chat);
  });
  const openChat: OpenChat = useCallback((key, mode) => setOpen(mode ? { key, mode } : { key }), []);
  const close = () => {
    forgetLaunchParam(PARAM);
    setOpen(null);
  };
  return (
    <OpenChatContext.Provider value={openChat}>
      {open ? (
        <ChatScreen
          key={open.key}
          chatKey={open.key}
          ring={open.mode === 'ring'}
          answer={open.mode === 'answer'}
          onBack={close}
        />
      ) : (
        children
      )}
      {ringing ? (
        <CallSource
          key={ringing}
          chatKey={ringing}
          onGone={() => setRinging(null)}
          onAnswer={() => {
            setRinging(null);
            openChat(ringing, 'answer');
          }}
        />
      ) : null}
      <ActionSheet />
    </OpenChatContext.Provider>
  );
}

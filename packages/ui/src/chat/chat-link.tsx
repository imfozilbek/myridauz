import { CALL_LINK, CHAT_KEY, CHAT_LINK } from '@platform/contracts';
import { useCallback, useState, type ReactNode } from 'react';
import { ActionSheet } from '../action-sheet/action-sheet';
import { CallSource } from '../action-sheet/kinds/call-source';
import { callIsLive } from '../call/live-call';
import { useFeedCall } from '../feed/feed-context';
import { KeptBehind } from '../telegram/kept-behind';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { ChatScreen } from './chat-screen';
import { OpenChatContext, type OpenChat } from './open-chat';

type Open = { readonly key: string; readonly mode?: 'ring' | 'answer' };

// "Yangi xabar" from the bot opens its chat at once (docs/07). The app stays under the chat as it
// was: back comes to the very screen that opened it, «Suhbatlar» or a section (G76). A call that
// rings for this person while the app is open comes as a sheet over the screen, unless a call is
// live (docs/122): «Javob berish» opens its chat. The sheet of the app lives here, over every screen.
export function ChatLink({ children }: { readonly children: ReactNode }) {
  // «📞 Qoʻngʻiroq» of a trip card rings at once, «💬 Chat» only opens the chat (G77).
  const [open, setOpen] = useState<Open | null>(() => {
    const key = launchParam(CHAT_LINK, CHAT_KEY);
    const call = launchParam(CALL_LINK, CHAT_KEY);
    if (key) return { key };
    return call ? { key: call, mode: 'ring' } : null;
  });
  const [ringing, setRinging] = useState<string | null>(null);
  useFeedCall((chat) => {
    if (chat !== open?.key && !callIsLive()) setRinging(chat);
  });
  const openChat: OpenChat = useCallback((key, mode) => setOpen(mode ? { key, mode } : { key }), []);
  const close = () => {
    forgetLaunchParam(CHAT_LINK);
    forgetLaunchParam(CALL_LINK);
    setOpen(null);
  };
  return (
    <OpenChatContext.Provider value={openChat}>
      <KeptBehind under={open !== null}>{children}</KeptBehind>
      {open ? (
        <ChatScreen
          key={open.key}
          chatKey={open.key}
          ring={open.mode === 'ring'}
          answer={open.mode === 'answer'}
          onBack={close}
        />
      ) : null}
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

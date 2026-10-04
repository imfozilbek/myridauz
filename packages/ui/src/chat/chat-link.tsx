import { CHAT_KEY } from '@platform/contracts';
import { useState, type ReactNode } from 'react';
import { callIsLive } from '../call/live-call';
import { useFeedCall } from '../feed/feed-context';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { ChatScreen } from './chat-screen';

const PARAM = 'chat';

// "Yangi xabar" from the bot opens its chat at once (docs/07); back goes to the main screen.
// A call that rings for this person opens its chat by itself, unless a call is live (docs/115).
export function ChatLink({ children }: { readonly children: ReactNode }) {
  const [key, setKey] = useState(() => launchParam(PARAM, CHAT_KEY));
  useFeedCall((chat) => {
    if (chat !== key && !callIsLive()) setKey(chat);
  });
  if (!key) return <>{children}</>;
  const close = () => {
    forgetLaunchParam(PARAM);
    setKey(null);
  };
  return <ChatScreen key={key} chatKey={key} onBack={close} />;
}

import { CHAT_KEY } from '@platform/contracts';
import { useState, type ReactNode } from 'react';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { ChatScreen } from './chat-screen';

const PARAM = 'chat';

// "Yangi xabar" from the bot opens its chat at once (docs/07); back goes to the main screen.
export function ChatLink({ children }: { readonly children: ReactNode }) {
  const [key, setKey] = useState(() => launchParam(PARAM, CHAT_KEY));
  if (!key) return <>{children}</>;
  const close = () => {
    forgetLaunchParam(PARAM);
    setKey(null);
  };
  return <ChatScreen chatKey={key} onBack={close} />;
}

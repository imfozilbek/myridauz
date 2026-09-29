import { useState, type ReactNode } from 'react';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { SubscriptionsScreen } from './subscriptions-screen';

const PARAM = 'subscriptions';
const ON = /^1$/u;

// "Obunalar" from the bot's offer to renew (docs/24) opens the list at once.
export function SubscriptionsLink({ children }: { readonly children: ReactNode }) {
  const [open, setOpen] = useState(() => launchParam(PARAM, ON) !== null);
  if (!open) return <>{children}</>;
  const close = () => {
    forgetLaunchParam(PARAM);
    setOpen(false);
  };
  return <SubscriptionsScreen onBack={close} />;
}

import type { MiniApp } from '@platform/contracts';
import type { ReactNode } from 'react';
import { ChatLink } from './chat/chat-link';
import { TripLink } from './market/trip-link';
import { SubscribeLink } from './subscriptions/subscribe-link';
import { SubscriptionsLink } from './subscriptions/subscriptions-link';

// A link from a bot or a channel opens its screen at once (docs/07, docs/15, docs/24);
// without one, the main screen.
export function LaunchLinks({ app, children }: { readonly app: MiniApp; readonly children: ReactNode }) {
  return (
    <ChatLink>
      <TripLink enabled={app === 'passenger'}>
        <SubscribeLink enabled={app === 'passenger'}>
          <SubscriptionsLink>{children}</SubscriptionsLink>
        </SubscribeLink>
      </TripLink>
    </ChatLink>
  );
}

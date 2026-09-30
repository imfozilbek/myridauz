import type { MiniApp } from '@platform/contracts';
import type { ReactNode } from 'react';
import { ChatLink } from './chat/chat-link';
import { FeedbackLink } from './feedback/feedback-link';
import { BookingsLink } from './market/bookings-link';
import { FindLink } from './market/find-link';
import { TripLink } from './market/trip-link';
import { SubscribeLink } from './subscriptions/subscribe-link';
import { SubscriptionsLink } from './subscriptions/subscriptions-link';

// A link from a bot, a channel or the landing opens its screen at once (docs/07, docs/15, docs/24, docs/59);
// without one, the main screen.
export function LaunchLinks({ app, children }: { readonly app: MiniApp; readonly children: ReactNode }) {
  return (
    <ChatLink>
      <TripLink enabled={app === 'passenger'}>
        <SubscribeLink enabled={app === 'passenger'}>
          <FindLink enabled={app === 'passenger'}>
            <FeedbackLink enabled={app !== 'admin'}>
              <SubscriptionsLink>
                <BookingsLink app={app}>{children}</BookingsLink>
              </SubscriptionsLink>
            </FeedbackLink>
          </FindLink>
        </SubscribeLink>
      </TripLink>
    </ChatLink>
  );
}

import type { AppLink, MiniApp } from '@platform/contracts';
import { useState, type ReactNode } from 'react';
import { ChatLink } from './chat/chat-link';
import { FeedbackLink } from './feedback/feedback-link';
import { AppLinkContext } from './market/app-link';
import { BookingsLink, bookingLinkOf } from './market/bookings-link';
import { FindLink } from './market/find-link';
import { RequestsLink } from './market/requests-link';
import { TripLink } from './market/trip-link';
import { SubscribeLink } from './subscriptions/subscribe-link';
import { SubscriptionsLink } from './subscriptions/subscriptions-link';

// A link from a bot, a channel or the landing opens its screen at once (docs/07, docs/15, docs/24, docs/59);
// without one, the main screen.
export function LaunchLinks({ app, children }: { readonly app: MiniApp; readonly children: ReactNode }) {
  const [booking, setBooking] = useState<AppLink | null>(() => bookingLinkOf(app));
  return (
    <AppLinkContext.Provider value={setBooking}>
      <ChatLink>
        <TripLink enabled={app === 'passenger'}>
          <SubscribeLink enabled={app === 'passenger'}>
            <FindLink enabled={app === 'passenger'}>
              <FeedbackLink app={app}>
                <SubscriptionsLink>
                  <RequestsLink enabled={app === 'driver'}>
                    <BookingsLink app={app} link={booking} onClose={() => setBooking(null)}>
                      {children}
                    </BookingsLink>
                  </RequestsLink>
                </SubscriptionsLink>
              </FeedbackLink>
            </FindLink>
          </SubscribeLink>
        </TripLink>
      </ChatLink>
    </AppLinkContext.Provider>
  );
}

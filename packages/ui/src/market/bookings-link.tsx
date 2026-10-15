import {
  BOOKING_LINK,
  LINK_ID,
  MY_TRIP_LINK,
  OFFER_LINK,
  REQUEST_LINK,
  type AppLink,
  type MiniApp,
} from '@platform/contracts';
import type { ReactNode } from 'react';
import { HomeProvider } from '../flow/home-context';
import { ErrorBoundary } from '../states/error-boundary';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { MyRequestsScreen } from './my-requests-screen';
import { MyTripsScreen } from './my-trips-screen';

// The links the bots send (G77): the passenger card its seat, «Ochish» and «Takliflarni koʻrish»
// under the card of a request «Mening soʻrovim» (G61); the driver card its trip, an offer the
// passenger answered its booking or the list.
const NAMES: Record<MiniApp, readonly string[]> = {
  passenger: [BOOKING_LINK, REQUEST_LINK],
  driver: [MY_TRIP_LINK, OFFER_LINK],
  admin: [],
  main: [],
};

export function bookingLinkOf(app: MiniApp): AppLink | null {
  for (const name of NAMES[app]) {
    const id = launchParam(name, LINK_ID);
    if (id) return { name, id };
  }
  return null;
}

type Props = {
  readonly app: MiniApp;
  readonly link: AppLink | null;
  readonly onClose: () => void;
  readonly children: ReactNode;
};

// "Ochish" under a bot message about a booking, an offer, a trip or a request opens it in "Mening
// safarlarim" (docs/65 B5); a chat opens a seat here too (market/app-link.ts). Back and «Bosh sahifa»
// go straight to the main screen (G77).
export function BookingsLink({ app, link, onClose, children }: Props) {
  if (!link) return <>{children}</>;
  // Every name: a chat over the app may have opened another link over the first one (G77).
  const close = () => {
    for (const name of NAMES[app]) forgetLaunchParam(name);
    onClose();
  };
  // A new link opens its own screen, never the one of the link before.
  const key = `${link.name}:${link.id}`;
  return (
    <HomeProvider value={close}>
      <ErrorBoundary key={key} onBack={close}>
        {app === 'driver' ? (
          <MyTripsScreen onBack={close} link={link} />
        ) : (
          <MyRequestsScreen onBack={close} link={link} />
        )}
      </ErrorBoundary>
    </HomeProvider>
  );
}

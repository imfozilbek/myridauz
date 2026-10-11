import {
  BOOKING_LINK,
  LINK_ID,
  MY_TRIP_LINK,
  OFFER_LINK,
  REQUEST_LINK,
  type AppLink,
  type MiniApp,
} from '@platform/contracts';
import { useState, type ReactNode } from 'react';
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
};

function linked(app: MiniApp): AppLink | null {
  for (const name of NAMES[app]) {
    const id = launchParam(name, LINK_ID);
    if (id) return { name, id };
  }
  return null;
}

// "Ochish" under a bot message about a booking, an offer, a trip or a request opens it in "Mening
// safarlarim" (docs/65 B5); back goes straight to the main screen (G77).
export function BookingsLink({ app, children }: { readonly app: MiniApp; readonly children: ReactNode }) {
  const [link, setLink] = useState(() => linked(app));
  if (!link) return <>{children}</>;
  const close = () => {
    forgetLaunchParam(link.name);
    setLink(null);
  };
  return app === 'driver' ? (
    <MyTripsScreen onBack={close} link={link} />
  ) : (
    <MyRequestsScreen onBack={close} link={link} />
  );
}

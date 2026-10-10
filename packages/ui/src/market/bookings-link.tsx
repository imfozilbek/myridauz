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

// «Ochish» and «Takliflarni koʻrish» under the card of a request open «Mening soʻrovim» (G61).
const NAMES = [BOOKING_LINK, OFFER_LINK, MY_TRIP_LINK, REQUEST_LINK];

function linked(): AppLink | null {
  for (const name of NAMES) {
    const id = launchParam(name, LINK_ID);
    if (id) return { name, id };
  }
  return null;
}

// "Ochish" under a bot message about a booking, an offer, a trip or a request opens it in "Mening
// safarlarim" (docs/65 B5); back goes to the main screen.
export function BookingsLink({ app, children }: { readonly app: MiniApp; readonly children: ReactNode }) {
  const [link, setLink] = useState(() => (app === 'admin' ? null : linked()));
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

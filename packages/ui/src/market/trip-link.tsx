import { useState, type ReactNode } from 'react';
import { BookFlow } from '../bookings/book-flow';
import { useApiClients } from '../context/api-clients';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { forgetLaunchParam, launchParam, startParam } from '../telegram/launch-param';
import { PlacesGate } from './places-gate';
import { TripScreen } from './trip-screen';
import { useLoad } from './use-list';

const PARAM = 'trip';
const TRIP_ID = /^[A-Za-z0-9-]{1,64}$/u;
const START = /^trip_([A-Za-z0-9-]{1,64})$/u;

// A trip the link names: "Band qilish" in a channel (startapp=trip_<id>, docs/15) or a bot message
// about a subscription (?trip=<id>, docs/24).
function linkedTrip(): string | null {
  const fromBot = launchParam(PARAM, TRIP_ID);
  if (fromBot) return fromBot;
  return START.exec(startParam() ?? '')?.[1] ?? null;
}

// The passenger app opens that trip at once, ready to book; back goes to the main screen.
export function TripLink({ enabled, children }: { readonly enabled: boolean; readonly children: ReactNode }) {
  const [id, setId] = useState(() => (enabled ? linkedTrip() : null));
  if (!id) return <>{children}</>;
  const close = () => {
    forgetLaunchParam(PARAM);
    setId(null);
  };
  return (
    <PlacesGate>
      <LinkedTrip id={id} onClose={close} />
    </PlacesGate>
  );
}

function LinkedTrip({ id, onClose }: { readonly id: string; readonly onClose: () => void }) {
  const { market } = useApiClients();
  const { value, failed, reload } = useLoad(() => market.trip(id));
  const [booking, setBooking] = useState(false);
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!value) return <ScreenSkeleton />;
  if (booking) return <BookFlow trip={value} onBack={() => setBooking(false)} onClose={onClose} />;
  return <TripScreen trip={value} onBack={onClose} onBook={() => setBooking(true)} />;
}

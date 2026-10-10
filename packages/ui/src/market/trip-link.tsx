import { tashkentDate, TRIP_LINK } from '@platform/contracts';
import { useState, type ReactNode } from 'react';
import { BookFlow } from '../bookings/book-flow';
import { SafarScreen } from '../find/safar-screen';
import type { SeatChoice } from '../find/seat-choice';
import { useApiClients } from '../context/api-clients';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { freshStartParam, launchParam, useLinkOpened } from '../telegram/launch-param';
import { LinkedSearch } from './find-link';
import { PlacesGate } from './places-gate';
import { useLoad } from './use-list';

const PARAM = TRIP_LINK;
const PARAMS = [PARAM];
const TRIP_ID = /^[A-Za-z0-9-]{1,64}$/u;
const START = /^trip_([A-Za-z0-9-]{1,64})$/u;

// A trip the link names: "Band qilish" in a channel (startapp=trip_<id>, docs/15) or a bot message
// about a subscription (?trip=<id>, docs/24).
export function linkedTrip(): string | null {
  const fromBot = launchParam(PARAM, TRIP_ID);
  if (fromBot) return fromBot;
  return START.exec(freshStartParam() ?? '')?.[1] ?? null;
}

// The passenger app opens that trip at once, ready to book; back goes to the main screen.
export function TripLink({ enabled, children }: { readonly enabled: boolean; readonly children: ReactNode }) {
  const [id, setId] = useState(() => (enabled ? linkedTrip() : null));
  useLinkOpened(id !== null, PARAMS);
  if (!id) return <>{children}</>;
  const close = () => setId(null);
  return (
    <PlacesGate onBack={close}>
      <TripById id={id} onClose={close} />
    </PlacesGate>
  );
}

// One trip by its id, ready to book: a link, or a trip of a saved driver (G18).
export function TripById({ id, onClose }: { readonly id: string; readonly onClose: () => void }) {
  const { market } = useApiClients();
  const { value, failed, reload } = useLoad(() => market.trip(id));
  const [booking, setBooking] = useState<SeatChoice | null>(null);
  const [others, setOthers] = useState(false);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onClose} />;
  if (!value) return <ScreenSkeleton onBack={onClose} />;
  if (booking)
    return (
      <BookFlow
        trip={value}
        choice={booking}
        onBack={() => setBooking(null)}
        onClose={onClose}
        onHome={onClose}
      />
    );
  if (others) {
    const ids = { from: value.from, to: value.to, day: tashkentDate(value.departAt) };
    return <LinkedSearch ids={ids} onClose={() => setOthers(false)} />;
  }
  return <SafarScreen trip={value} onBack={onClose} onBook={setBooking} onOthers={() => setOthers(true)} />;
}

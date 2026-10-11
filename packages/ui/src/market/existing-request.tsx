import type { RideRequest } from '@platform/contracts';
import { useEffect } from 'react';
import { PassengerOpen } from '../bookings/passenger-open';
import { useApiClients } from '../context/api-clients';
import { useSharedPassengerData } from '../home/passenger-data';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { PlacesGate } from './places-gate';
import { useLoad } from './use-list';

type Props = {
  readonly from: string;
  readonly to: string;
  readonly date: string;
  readonly onClose: () => void;
};

// The open request on this route and day: one per day (G37, docs/101 R5).
export const openOn =
  ({ from, to, date }: Pick<Props, 'from' | 'to' | 'date'>) =>
  (item: RideRequest) =>
    item.status === 'open' && item.from === from && item.to === to && item.date === date;

// The open request of the person on this route and day, with its offers: a second one is never
// left (G37, docs/101 R5). Gone meanwhile (ended or cancelled): back to the check, the lists of
// the main screen fresh, so the check does not open it again (G79 П10).
export function ExistingRequest(props: Props) {
  return (
    <PlacesGate onBack={props.onClose}>
      <Existing {...props} />
    </PlacesGate>
  );
}

function Existing({ from, to, date, onClose }: Props) {
  const { market, bookings } = useApiClients();
  const shared = useSharedPassengerData();
  const { value, failed, reload } = useLoad(() => Promise.all([market.myRequests(), bookings.myOffers()]));
  const request = value?.[0].find(openOn({ from, to, date }));
  const gone = value !== null && !request;
  useEffect(() => {
    if (!gone) return;
    void shared?.refresh();
    onClose();
  }, [gone, onClose, shared]);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onClose} />;
  if (!value || !request) return <ScreenSkeleton onBack={onClose} />;
  return <PassengerOpen opened={{ kind: 'request', request }} offers={value[1]} onClose={onClose} />;
}

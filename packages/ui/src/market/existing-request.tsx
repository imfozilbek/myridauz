import { useEffect } from 'react';
import { PassengerOpen } from '../bookings/passenger-open';
import { useApiClients } from '../context/api-clients';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useLoad } from './use-list';

type Props = {
  readonly from: string;
  readonly to: string;
  readonly date: string;
  readonly onClose: () => void;
};

// The open request of the person on this route and day, with its offers: a second one is never
// left (G37, docs/101 R5). Gone meanwhile (ended or cancelled): back to the check.
export function ExistingRequest({ from, to, date, onClose }: Props) {
  const { market, bookings } = useApiClients();
  const { value, failed, reload } = useLoad(() => Promise.all([market.myRequests(), bookings.myOffers()]));
  const request = value?.[0].find(
    (item) => item.status === 'open' && item.from === from && item.to === to && item.date === date,
  );
  const gone = value !== null && !request;
  useEffect(() => {
    if (gone) onClose();
  }, [gone, onClose]);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onClose} />;
  if (!value || !request) return <ScreenSkeleton onBack={onClose} />;
  return <PassengerOpen opened={{ kind: 'request', request }} offers={value[1]} onClose={onClose} />;
}

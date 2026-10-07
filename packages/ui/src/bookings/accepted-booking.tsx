import { useApiClients } from '../context/api-clients';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { PassengerBooking } from './passenger-booking';

type Props = {
  readonly bookingId: string;
  readonly onClose: (changed: boolean) => void;
  readonly onHome?: (() => void) | undefined;
};

// An accepted offer opens the page of its seat at once (G61, docs/118 path 4, journey screen 8):
// «Joy tasdiqlandi», the plate, the meeting and the close people, as any booking (G60).
export function AcceptedBooking({ bookingId, onClose, onHome }: Props) {
  const { bookings } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(() => bookings.myBookings());
  const booking = value?.find((item) => item.id === bookingId);
  if (failed) return <ErrorScreen onRetry={reload} onBack={() => onClose(true)} />;
  if (!booking) return <ScreenSkeleton onBack={() => onClose(true)} />;
  return (
    <PassengerBooking
      booking={booking}
      onClose={() => onClose(true)}
      onStale={() => void refresh()}
      onHome={onHome}
    />
  );
}

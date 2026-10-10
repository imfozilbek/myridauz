import { onTheWay, tashkentDate, type Booking } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { ApiError } from '@platform/api-client';
import { useState } from 'react';
import { ChatScreen } from '../chat/chat-screen';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ComplaintScreen } from '../feedback/complaint-screen';
import { ReviewScreen } from '../feedback/review-screen';
import { errorKey } from '../market/error-text';
import { LinkedSearch } from '../market/find-link';
import { ActionFailure } from '../states/action-failure';
import { confirm, haptic } from '../telegram/feedback';
import { cancellable } from './booking-status';
import { ConfirmedBooking } from './confirmed-booking';
import { PendingBooking } from './pending-booking';
import { withTold } from './use-trip-steps';

const isStale = (caught: unknown) =>
  caught instanceof ApiError && Boolean(caught.code?.endsWith('.wrong_status'));

type Props = {
  readonly booking: Booking;
  readonly onClose: (changed: boolean) => void;
  // A seat changed meanwhile: the parent loads it again at once (G52, docs/112).
  readonly onStale?: (() => void) | undefined;
  readonly onHome?: (() => void) | undefined;
};

type Opened = { readonly screen: 'chat' | 'call' | 'complaint' | 'review' | 'others' | 'again' } | null;

// One booking of a passenger (docs/35, docs/118 path 3): waiting, confirmed or after the trip, with
// its chat, call, complaint and review. The parent gives fresh data on each signal (docs/64).
export function PassengerBooking({ booking: fresh, onClose, onStale, onHome }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { bookings } = useApiClients();
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const [opened, setOpened] = useState<Opened>(null);
  const [told, setTold] = useState<Booking | null>(null);
  const booking = withTold(fresh, told);
  const back = () => setOpened(null);
  // The same route: of that day after a bad end, any day for «Yana … bilan» (docs/124 А, docs/129).
  if (opened?.screen === 'others' || opened?.screen === 'again') {
    const { from, to, departAt } = booking.trip;
    const day = opened.screen === 'others' ? { day: tashkentDate(departAt) } : {};
    return <LinkedSearch ids={{ from, to, ...day }} onClose={back} />;
  }
  if (opened?.screen === 'complaint') return <ComplaintScreen bookingId={booking.id} onBack={back} />;
  if (opened?.screen === 'review')
    return (
      <ReviewScreen
        bookingId={booking.id}
        onBack={back}
        onComplain={() => setOpened({ screen: 'complaint' })}
      />
    );
  if (opened)
    return (
      <ChatScreen
        chatKey={booking.chatKey}
        title={booking.trip.driver.firstName}
        ring={opened.screen === 'call'}
        onTrip={back}
        onBack={back}
        onAgain={() => setOpened({ screen: 'again' })}
      />
    );
  // A cancel is asked first: one tap never loses a seat (docs/65 B4). A failed one keeps the screen.
  const cancel = async () => {
    if (!(await confirm(t('bookings.cancelAsk'), t('bookings.cancel')))) return;
    try {
      setFailure(null);
      await bookings.cancelMine(booking.id);
      haptic.success();
      track({ name: 'booking_step', screen: 'bookings.passenger', step: 'cancelled' });
      onClose(true);
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught));
      if (isStale(caught)) onStale?.();
    }
  };
  if (booking.status === 'requested')
    return (
      <PendingBooking
        booking={booking}
        onBack={() => onClose(false)}
        onCancel={() => void cancel()}
        onHome={onHome ?? (() => onClose(false))}
      >
        <ActionFailure error={failure} />
      </PendingBooking>
    );
  // In the car, arrived or the driver left: nothing to cancel, the server refuses it (docs/35, G75).
  const inCar =
    booking.boardedAt !== null || booking.arrivedAt !== null || onTheWay(booking.trip, Date.now());
  return (
    <ConfirmedBooking
      booking={booking}
      onBack={() => onClose(false)}
      onOpen={(screen) => setOpened({ screen })}
      onCancel={cancellable(booking.status) && !inCar ? () => void cancel() : null}
      onTold={setTold}
      onAgain={() => setOpened({ screen: 'again' })}
      onOthers={() => setOpened({ screen: 'others' })}
    >
      <ActionFailure error={failure} />
    </ConfirmedBooking>
  );
}

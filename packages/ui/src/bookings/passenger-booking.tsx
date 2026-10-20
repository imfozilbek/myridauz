import { onTheWay, type Booking } from '@platform/contracts';
import { useState } from 'react';
import { ChatScreen } from '../chat/chat-screen';
import { ComplaintScreen } from '../feedback/complaint-screen';
import { ReviewScreen } from '../feedback/review-screen';
import { LinkedSearch } from '../market/find-link';
import { ActionFailure } from '../states/action-failure';
import { cancellable } from './booking-status';
import { ConfirmedBooking } from './confirmed-booking';
import { PendingBooking } from './pending-booking';
import { similarDay } from './similar-trips';
import { useCancelSeat } from './use-cancel-seat';
import { withTold } from './use-seat-steps';

type Props = {
  readonly booking: Booking;
  readonly onClose: (changed: boolean) => void;
  // A seat changed meanwhile: the parent loads it again at once (G52, docs/112).
  readonly onStale?: (() => void) | undefined;
  readonly onHome?: (() => void) | undefined;
  // Opened on its stars (G79 П3): «Назад» from them leaves the seat.
  readonly stars?: boolean;
};

type Opened = { readonly screen: 'chat' | 'call' | 'complaint' | 'review' | 'others' | 'again' } | null;

// One booking of a passenger (docs/35, docs/118 path 3): waiting, confirmed or after the trip, with
// its chat, call, complaint and review. The parent gives fresh data on each signal (docs/64).
export function PassengerBooking({ booking: fresh, onClose, onStale, onHome, stars = false }: Props) {
  const [opened, setOpened] = useState<Opened>(stars ? { screen: 'review' } : null);
  const [told, setTold] = useState<Booking | null>(null);
  const booking = withTold(fresh, told);
  const { cancel, failure } = useCancelSeat(booking.id, { onDone: () => onClose(true), onStale });
  const back = () => setOpened(null);
  // The same route: of that day after a bad end, any day for «Yana … bilan» (docs/124 А, docs/129).
  if (opened?.screen === 'others' || opened?.screen === 'again') {
    const { from, to } = booking.trip;
    const day = opened.screen === 'others' ? { day: similarDay(booking.trip) } : {};
    return <LinkedSearch ids={{ from, to, ...day }} onClose={back} />;
  }
  if (opened?.screen === 'complaint')
    return (
      <ComplaintScreen
        bookingId={booking.id}
        onBack={back}
        onSent={back}
        passenger={{ driverName: booking.trip.driver.firstName }}
      />
    );
  if (opened?.screen === 'review')
    return (
      <ReviewScreen
        bookingId={booking.id}
        onBack={stars ? () => onClose(false) : back}
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
  if (booking.status === 'requested')
    return (
      <PendingBooking
        booking={booking}
        onBack={() => onClose(false)}
        onCancel={cancel}
        onHome={onHome ?? (() => onClose(false))}
      >
        <ActionFailure error={failure} />
      </PendingBooking>
    );
  // In the car, arrived or the driver left: nothing to cancel, the server refuses it (docs/35, G75).
  // After the driver's «Kelmadi» the server refuses it too (metOrMissed, G90 PAS-1).
  const inCar =
    booking.boardedAt !== null ||
    booking.arrivedAt !== null ||
    booking.noShowAt !== null ||
    onTheWay(booking.trip, Date.now());
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

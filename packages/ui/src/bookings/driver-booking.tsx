import { onTheWay, type Booking, type DriverBookingAction } from '@platform/contracts';
import { useRef, useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { confirm } from '../telegram/feedback';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { ComplainCell, useCanComplain } from '../feedback/complain-cell';
import { ComplaintScreen } from '../feedback/complaint-screen';
import { ChatScreen } from '../chat/chat-screen';
import { Cell, Section } from '../components';
import { IconTile } from '../icon-tile';
import { taken } from '../trip-end/trip-sums';
import { AnswerDeadline } from './answer-deadline';
import { BookingScreen, type BookingAction } from './booking-screen';
import { notEnough, useAnswerBooking } from './use-answer-booking';
import { missingFor, useBalance } from './use-balance';
import { useTopUp } from '../wallet/top-up-link';
import { useCallsOn } from '../call/calls-on';

type Step = 'view' | 'chat' | 'call' | 'complain';
type Props = {
  readonly booking: Booking;
  readonly onClose: (changed: boolean) => void;
  // The booking changed meanwhile: the parent loads it again (G52, docs/112).
  readonly onStale?: () => void;
};

// One booking for the driver (docs/35): the commission is on the screen, «Tasdiqlash» answers at
// once, no window in between (owner decision 06.10.2026, docs/122). Without money for the
// commission «Hisobni toʻldirish» opens the support chat at once (G27, docs/170 В9). A confirmed one
// can still be cancelled: the commission goes back.
export function DriverBooking({ booking, onClose, onStale }: Props) {
  const { t } = useI18n();
  const callsOn = useCallsOn();
  const canComplain = useCanComplain();
  const [step, setStep] = useState<Step>('view');
  const { balance, reload } = useBalance(booking.status === 'requested');
  const { failure, fail, clear } = useFailure();
  const topUp = useTopUp();
  const answerBooking = useAnswerBooking({
    screen: 'bookings.driver',
    onDone: () => onClose(true),
    onShort: () => (reload(), fail(notEnough())),
    fail,
    ...(onStale ? { onStale } : {}),
  });
  // A failed answer keeps the booking open with the reason (docs/65 B3). One answer at a time: a
  // second tap while the first runs sends nothing (G52, docs/112).
  const answering = useRef(false);
  const answer = async (action: DriverBookingAction) => {
    if (answering.current) return;
    answering.current = true;
    clear();
    try {
      await answerBooking(booking, action);
    } finally {
      answering.current = false;
    }
  };
  if (step === 'chat' || step === 'call')
    return (
      <ChatScreen
        chatKey={booking.chatKey}
        title={booking.passenger.firstName}
        ring={step === 'call'}
        // The line of the trip is this very booking (G77).
        onTrip={() => setStep('view')}
        onBack={() => setStep('view')}
      />
    );
  if (step === 'complain')
    return (
      <ComplaintScreen bookingId={booking.id} onBack={() => setStep('view')} onSent={() => setStep('view')} />
    );
  // A cancel of a confirmed seat is asked first (docs/65 B4).
  const cancel = async () => {
    if (await confirm(t('bookings.driverCancelAsk'), t('bookings.cancel'))) await answer('cancel');
  };
  const missing = missingFor(balance, booking.commission);
  const confirmSeat: BookingAction =
    missing > 0
      ? { label: t('wallet.topUp'), onClick: () => topUp(booking.passenger.firstName, missing), main: true }
      : { label: t('bookings.confirm'), onClick: () => answer('confirm'), main: true };
  // A seat that rode or was missed, and every seat once the car left, stays: the server refuses a
  // cancel (docs/35, G91 DRV-6).
  const kept = booking.metAt !== null || booking.noShowAt !== null || onTheWay(booking.trip, Date.now());
  const actions: BookingAction[] =
    booking.status === 'requested'
      ? [confirmSeat, { label: t('bookings.decline'), onClick: () => answer('decline') }]
      : booking.status === 'confirmed' && !kept
        ? [{ label: t('bookings.cancel'), onClick: () => void cancel() }]
        : [];
  return (
    <BookingScreen booking={booking} onBack={() => onClose(false)} actions={actions}>
      <ActionFailure error={failure} />
      <AnswerDeadline booking={booking} />
      <Section>
        <Cell before={<IconTile name="chat" />} onClick={() => setStep('chat')}>
          {t('chat.open')}
        </Cell>
        {/* The call of a seat that rides, as on «Mening safarim» (G78 sheet 3, d-seat). */}
        {taken(booking) && callsOn ? (
          <Cell before={<IconTile name="phone" size="row" />} onClick={() => setStep('call')}>
            {t('calls.call')}
          </Cell>
        ) : null}
        {canComplain(booking) ? <ComplainCell onClick={() => setStep('complain')} /> : null}
      </Section>
    </BookingScreen>
  );
}

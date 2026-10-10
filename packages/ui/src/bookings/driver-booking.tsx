import type { Booking, DriverBookingAction } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { confirm } from '../telegram/feedback';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { ComplainCell, canComplain } from '../feedback/complain-cell';
import { ComplaintScreen } from '../feedback/complaint-screen';
import { ChatScreen } from '../chat/chat-screen';
import { Cell, Section } from '../components';
import { IconTile } from '../icon-tile';
import { AnswerDeadline } from './answer-deadline';
import { BookingScreen, type BookingAction } from './booking-screen';
import { useAnswerBooking } from './use-answer-booking';
import { short, useBalance } from './use-balance';
import { ShortfallSheet } from '../wallet/shortfall-sheet';

type Step = 'view' | 'not_enough' | 'chat' | 'complain';
type Props = {
  readonly booking: Booking;
  readonly onClose: (changed: boolean) => void;
};

// One booking for the driver (docs/35): the commission is on the screen, «Tasdiqlash» answers at
// once, no window in between (owner decision 06.10.2026, docs/122). Without money for the
// commission the way to top up comes instead (G27). A confirmed one can still be cancelled: the
// commission goes back.
export function DriverBooking({ booking, onClose }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>('view');
  const { balance } = useBalance(booking.status === 'requested');
  const { failure, fail, clear } = useFailure();
  const answerBooking = useAnswerBooking({
    onDone: () => onClose(true),
    onShort: () => setStep('not_enough'),
    fail,
  });
  // A failed answer keeps the booking open with the reason (docs/65 B3).
  const answer = (action: DriverBookingAction) => {
    clear();
    return answerBooking(booking, action);
  };
  if (step === 'chat')
    return (
      <ChatScreen
        chatKey={booking.chatKey}
        title={booking.passenger.firstName}
        onBack={() => setStep('view')}
      />
    );
  if (step === 'complain') return <ComplaintScreen bookingId={booking.id} onBack={() => setStep('view')} />;
  // A cancel of a confirmed seat is asked first (docs/65 B4).
  const cancel = async () => {
    if (await confirm(t('bookings.driverCancelAsk'), t('bookings.cancel'))) await answer('cancel');
  };
  const confirmSeat: BookingAction = short(balance, booking.commission)
    ? { label: t('wallet.topUp'), onClick: () => setStep('not_enough'), main: true }
    : { label: t('bookings.confirm'), onClick: () => void answer('confirm'), main: true };
  const actions: BookingAction[] =
    booking.status === 'requested'
      ? [confirmSeat, { label: t('bookings.decline'), onClick: () => void answer('decline') }]
      : booking.status === 'confirmed'
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
        {canComplain(booking.status) ? <ComplainCell onClick={() => setStep('complain')} /> : null}
      </Section>
      {/* No money for the commission: the sum short over the booking (G75, mockup g75/4 B). */}
      <ShortfallSheet
        shortfall={
          step === 'not_enough'
            ? { need: booking.commission, seats: booking.seats, name: booking.passenger.firstName }
            : null
        }
        onClose={() => setStep('view')}
      />
    </BookingScreen>
  );
}

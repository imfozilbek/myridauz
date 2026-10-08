import type { Booking, DriverBookingAction } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { ApiError } from '@platform/api-client';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { confirm, haptic } from '../telegram/feedback';
import { errorKey } from '../market/error-text';
import { ActionFailure } from '../states/action-failure';
import { ComplainCell, canComplain } from '../feedback/complain-cell';
import { ComplaintScreen } from '../feedback/complaint-screen';
import { ChatScreen } from '../chat/chat-screen';
import { Cell, Section } from '../components';
import { IconTile } from '../icon-tile';
import { AnswerDeadline } from './answer-deadline';
import { BookingScreen, type BookingAction } from './booking-screen';
import { short, useBalance } from './use-balance';
import { NotEnoughScreen, TopUpScreen } from './wallet-steps';

type Step = 'view' | 'not_enough' | 'top_up' | 'chat' | 'complain';
const STEP_OF = { confirm: 'confirmed', decline: 'declined', cancel: 'cancelled' } as const;
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
  const { track } = useAnalytics();
  const { bookings } = useApiClients();
  const [step, setStep] = useState<Step>('view');
  const { balance } = useBalance();
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  // A failed answer keeps the booking open with the reason (docs/65 B3).
  const answer = async (action: DriverBookingAction) => {
    try {
      setFailure(null);
      await bookings.answer(booking.id, action);
      track({ name: 'booking_step', screen: 'bookings.driver', step: STEP_OF[action] });
      haptic.success();
      onClose(true);
    } catch (caught) {
      haptic.error();
      if (caught instanceof ApiError && caught.code === 'wallet.not_enough') setStep('not_enough');
      else setFailure(errorKey(caught));
    }
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
  if (step === 'top_up') return <TopUpScreen onBack={() => setStep('not_enough')} />;
  if (step === 'not_enough')
    return (
      <NotEnoughScreen
        amount={booking.commission}
        onBack={() => setStep('view')}
        onTopUp={() => setStep('top_up')}
      />
    );
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
    <BookingScreen booking={booking} side="driver" onBack={() => onClose(false)} actions={actions}>
      <ActionFailure error={failure} />
      <AnswerDeadline booking={booking} />
      <Section>
        <Cell before={<IconTile name="chat" />} onClick={() => setStep('chat')}>
          {t('chat.open')}
        </Cell>
        {canComplain(booking.status) ? <ComplainCell onClick={() => setStep('complain')} /> : null}
      </Section>
    </BookingScreen>
  );
}

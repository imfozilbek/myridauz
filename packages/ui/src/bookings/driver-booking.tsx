import type { Booking, DriverBookingAction } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { ApiError } from '@platform/api-client';
import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton, SecondaryButton } from '../telegram/bottom-button';
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
import { NotEnoughScreen, TopUpScreen } from './wallet-steps';

type Step = 'view' | 'confirm' | 'confirmed' | 'not_enough' | 'top_up' | 'chat' | 'complain';
const STEP_OF = { confirm: 'confirmed', decline: 'declined', cancel: 'cancelled' } as const;
type Props = {
  readonly booking: Booking;
  readonly onClose: (changed: boolean) => void;
  // «Safar xaritasi» after a confirmation: the exact places of the passenger are there (docs/89 D5).
  readonly onMap: () => void;
};

// The driver answers a booking (docs/35): "Joyni tasdiqlaysizmi?" with the commission, then the
// charge; without money, the way to top up. A confirmed one can still be cancelled: the commission goes back.
export function DriverBooking({ booking, onClose, onMap }: Props) {
  const { t, formatMoney } = useI18n();
  const { track } = useAnalytics();
  const { bookings, wallet } = useApiClients();
  const [step, setStep] = useState<Step>('view');
  // The balance next to the commission: the driver knows before tapping (docs/65 C). Less than the
  // commission: straight to the way to top up, a «Tasdiqlash» would only fail (G27).
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    if (step === 'confirm')
      wallet.mine().then(
        (mine) => {
          const total = mine.bonus + mine.main;
          if (total < booking.commission) setStep('not_enough');
          else setBalance(total);
        },
        () => undefined,
      );
  }, [step, wallet, booking.commission]);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  // A failed answer keeps the booking open with the reason (docs/65 B3).
  const answer = async (action: DriverBookingAction) => {
    try {
      setFailure(null);
      await bookings.answer(booking.id, action);
      track({ name: 'booking_step', screen: 'bookings.driver', step: STEP_OF[action] });
      haptic.success();
      if (action === 'confirm') setStep('confirmed');
      else onClose(true);
    } catch (caught) {
      haptic.error();
      if (caught instanceof ApiError && caught.code === 'wallet.not_enough') setStep('not_enough');
      else {
        setFailure(errorKey(caught));
        setStep('view');
      }
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
  if (step === 'confirmed') {
    return (
      <StepLayout icon="selected" title={t('bookings.confirmed.title')} hint={t('bookings.confirmed.hint')}>
        <Screen onBack={() => onClose(true)} />
        <MainButton text={t('way.map.title')} onClick={onMap} />
        <SecondaryButton text={t('chat.open')} onClick={() => setStep('chat')} />
      </StepLayout>
    );
  }
  if (step === 'confirm') {
    return (
      <StepLayout
        icon="wallet"
        title={t('bookings.confirm.title')}
        hint={t('bookings.confirm.hint', { amount: formatMoney(booking.commission) })}
      >
        <Screen onBack={() => setStep('view')} />
        {balance === null ? null : (
          <Text className="step-note">{t('bookings.confirm.balance', { amount: formatMoney(balance) })}</Text>
        )}
        <MainButton text={t('bookings.confirm')} onClick={() => answer('confirm')} />
      </StepLayout>
    );
  }
  // A cancel of a confirmed seat is asked first (docs/65 B4).
  const cancel = async () => {
    if (await confirm(t('bookings.driverCancelAsk'), t('bookings.cancel'))) await answer('cancel');
  };
  const actions: BookingAction[] =
    booking.status === 'requested'
      ? [
          { label: t('bookings.confirm'), onClick: () => setStep('confirm'), main: true },
          { label: t('bookings.decline'), onClick: () => void answer('decline') },
        ]
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

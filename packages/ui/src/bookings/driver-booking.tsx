import type { Booking, DriverBookingAction } from '@platform/contracts';
import { ApiError } from '@platform/api-client';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { BookingScreen, type BookingAction } from './booking-screen';
import { NotEnoughScreen, TopUpScreen } from './wallet-steps';

type Step = 'view' | 'confirm' | 'confirmed' | 'not_enough' | 'top_up';
const STEP_OF = { confirm: 'confirmed', decline: 'declined', cancel: 'cancelled' } as const;
type Props = { readonly booking: Booking; readonly onClose: (changed: boolean) => void };

// The driver answers a booking (docs/35): "Ishonchingiz komilmi?" with the commission, then the
// charge; without money, the way to top up. A confirmed one can still be cancelled (no refund).
export function DriverBooking({ booking, onClose }: Props) {
  const { t, formatMoney } = useI18n();
  const { track } = useAnalytics();
  const { bookings } = useApiClients();
  const [step, setStep] = useState<Step>('view');
  const answer = async (action: DriverBookingAction) => {
    try {
      await bookings.answer(booking.id, action);
      track({ name: 'booking_step', screen: 'bookings.driver', step: STEP_OF[action] });
      haptic.success();
      if (action === 'confirm') setStep('confirmed');
      else onClose(true);
    } catch (caught) {
      haptic.error();
      if (caught instanceof ApiError && caught.code === 'wallet.not_enough') setStep('not_enough');
      else onClose(true);
    }
  };
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
        <MainButton text={t('market.done')} onClick={() => onClose(true)} />
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
        <BackButton onClick={() => setStep('view')} />
        <MainButton text={t('bookings.confirm')} onClick={() => void answer('confirm')} />
      </StepLayout>
    );
  }
  const actions: BookingAction[] =
    booking.status === 'requested'
      ? [
          { label: t('bookings.confirm'), onClick: () => setStep('confirm'), main: true },
          { label: t('bookings.decline'), onClick: () => void answer('decline') },
        ]
      : booking.status === 'confirmed'
        ? [{ label: t('bookings.cancel'), onClick: () => void answer('cancel') }]
        : [];
  return <BookingScreen booking={booking} side="driver" onBack={() => onClose(false)} actions={actions} />;
}

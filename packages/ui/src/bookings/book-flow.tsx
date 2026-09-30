import type { Trip } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { errorKey } from '../market/error-text';
import { RouteView } from '../market/route-view';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import '../market/market.css';

// A person asks for more than 4 seats rarely; the car decides the rest (docs/35).
const MAX_ASKED = 4;
type Props = { readonly trip: Trip; readonly onBack: () => void; readonly onClose: () => void };

// A passenger books seats (docs/35): how many, a check with the total, sent. The driver answers.
export function BookFlow({ trip, onBack, onClose }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const [seats, setSeats] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <StepLayout icon="selected" title={t('bookings.sent.title')} hint={t('bookings.sent.hint')}>
        <MainButton text={t('market.done')} onClick={onClose} />
      </StepLayout>
    );
  }
  if (seats === null) {
    const choices = Array.from({ length: Math.min(trip.seatsLeft, MAX_ASKED) }, (_, index) => ({
      value: index + 1,
      label: t('market.request.seats', { count: String(index + 1) }),
    }));
    return (
      <ChoiceStep
        screen="bookings.seats"
        icon="passengers"
        title={t('bookings.seats.title')}
        choices={choices}
        onBack={onBack}
        onDone={(value) => {
          track({ name: 'booking_step', screen: 'bookings.seats', step: 'seats' });
          setSeats(value);
        }}
      />
    );
  }
  return <BookReview trip={trip} seats={seats} onBack={() => setSeats(null)} onSent={() => setSent(true)} />;
}

type ReviewProps = {
  readonly trip: Trip;
  readonly seats: number;
  readonly onBack: () => void;
  readonly onSent: () => void;
};

function BookReview({ trip, seats, onBack, onSent }: ReviewProps) {
  useScreenView('bookings.review');
  const { t, formatMoney } = useI18n();
  const { track } = useAnalytics();
  const { bookings } = useApiClients();
  const [error, setError] = useState<ReturnType<typeof errorKey> | null>(null);
  const send = async () => {
    setError(null);
    try {
      await bookings.book(trip.id, seats);
      track({ name: 'booking_step', screen: 'bookings.review', step: 'requested' });
      haptic.success();
      onSent();
    } catch (caught) {
      haptic.error();
      setError(errorKey(caught));
    }
  };
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  return (
    <StepLayout icon="myTrips" title={t('bookings.review.title')} hint={t('bookings.review.hint')}>
      <BackButton onClick={onBack} />
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
          </div>
          {line(t('bookings.review.seats'), String(seats))}
          {line(t('market.review.price'), formatMoney(trip.price))}
          {line(t('bookings.review.total'), formatMoney(trip.price * seats))}
        </Section>
      </List>
      {error ? <Text className="step-error">{t(error)}</Text> : null}
      <MainButton text={t('bookings.send')} onClick={send} />
    </StepLayout>
  );
}

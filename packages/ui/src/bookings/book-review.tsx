import type { BookingMode, Trip } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { RouteView } from '../market/route-view';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { useNameText, type Way } from '../way/way-end';

type Props = {
  readonly trip: Trip;
  readonly seats: number;
  readonly way: Way;
  // Null: the trip takes the passenger by no way the passenger chose (docs/70).
  readonly mode: BookingMode | null;
  readonly onBack: () => void;
  readonly onSent: () => void;
};

// The check before the request (docs/35): the seats, the money, where from and where to.
export function BookReview({ trip, seats, way, mode, onBack, onSent }: Props) {
  useScreenView('bookings.review');
  const { t, formatMoney } = useI18n();
  const { track } = useAnalytics();
  const { bookings } = useApiClients();
  const nameText = useNameText();
  const [error, setError] = useState<ReturnType<typeof errorKey> | 'way.fit.other' | null>(null);
  const dropoff = way.to.point;
  const send = async () => {
    setError(null);
    if (!mode || !dropoff) return (haptic.error(), setError('way.fit.other'));
    try {
      const pickup = mode === 'door' ? way.from.point : null;
      await bookings.book(trip.id, { seats, mode, pickup, dropoff });
      track({ name: 'booking_step', screen: 'bookings.review', step: 'requested' });
      haptic.success();
      return onSent();
    } catch (caught) {
      haptic.error();
      return setError(errorKey(caught));
    }
  };
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  const start = mode === 'pitak' && trip.pitak ? trip.pitak.name : nameText(way.from.name, way.from.place);
  return (
    <StepLayout icon="myTrips" title={t('bookings.review.title')} hint={t('way.book.fixed')}>
      <BackButton onClick={onBack} />
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
          </div>
          <Cell subtitle={start}>{t('way.book.pickup')}</Cell>
          <Cell subtitle={nameText(way.to.name, way.to.place)}>{t('way.book.dropoff')}</Cell>
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

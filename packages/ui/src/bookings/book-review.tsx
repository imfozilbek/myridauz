import type { Booking, BookingMode, Trip } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { usePayHint } from './pay-hint';
import { errorKey } from '../market/error-text';
import { RouteView } from '../market/route-view';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { PitakMap } from '../map/pitak-map';
import { haptic } from '../telegram/feedback';
import { useNameText, type WayEnd } from '../way/way-end';

type Props = {
  readonly trip: Trip;
  readonly seats: number;
  readonly mode: BookingMode;
  // The point at the door: only for «Uyimdan» (G26, docs/74).
  readonly pickup: WayEnd | null;
  readonly dropoff: WayEnd;
  readonly onBack: () => void;
  readonly onSent: (booking: Booking) => void;
};

// The check before the request (docs/35): the seats, the money, where from and where to.
export function BookReview({ trip, seats, mode, pickup, dropoff, onBack, onSent }: Props) {
  useScreenView('bookings.review');
  const { t, formatMoney } = useI18n();
  const payHint = usePayHint();
  const { track } = useAnalytics();
  const { bookings } = useApiClients();
  const nameText = useNameText();
  const [error, setError] = useState<ReturnType<typeof errorKey> | null>(null);
  const send = async () => {
    setError(null);
    if (!dropoff.point) return (haptic.error(), setError(errorKey(null)));
    try {
      const at = mode === 'door' ? (pickup?.point ?? null) : null;
      const booking = await bookings.book(trip.id, { seats, mode, pickup: at, dropoff: dropoff.point });
      track({ name: 'booking_step', screen: 'bookings.review', step: 'requested' });
      haptic.success();
      return onSent(booking);
    } catch (caught) {
      haptic.error();
      return setError(errorKey(caught));
    }
  };
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  const pitak = mode === 'pitak' ? trip.pitak : null;
  const start = pitak ? pitak.name : pickup ? nameText(pickup.name, pickup.place) : '';
  return (
    <StepLayout icon="myTrips" title={t('bookings.review.title')} hint={t('way.book.fixed')}>
      <BackButton onClick={onBack} />
      <List>
        <Section footer={payHint}>
          <div className="route-summary">
            <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
          </div>
          <Cell subtitle={start}>{t('way.book.pickup')}</Cell>
          {pitak ? <PitakMap pitak={pitak} /> : null}
          <Cell subtitle={nameText(dropoff.name, dropoff.place)}>{t('way.book.dropoff')}</Cell>
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

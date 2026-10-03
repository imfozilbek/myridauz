import type { Booking, BookingMode, Trip } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import type { IconName } from '../icons';
import { usePayHint } from './pay-hint';
import { errorKey } from '../market/error-text';
import { RouteView } from '../market/route-view';
import { SeatsCell } from '../market/seats-cell';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { PitakMap } from '../map/pitak-map';
import { haptic } from '../telegram/feedback';
import { PointRow } from '../way/point-row';
import { rememberWay } from '../way/remembered-way';
import { useNameText, type WayEnd } from '../way/way-end';

type Props = {
  readonly trip: Trip;
  readonly seats: number;
  readonly most: number;
  readonly mode: BookingMode;
  // The point at the door: only for «Uyimdan» (G26, docs/74).
  readonly pickup: WayEnd | null;
  readonly dropoff: WayEnd;
  readonly onSeats: (seats: number) => void;
  // «Oʻzgartirish» of the start and of the end (G35, docs/97 K4); a pitak alone has nothing to change.
  readonly onStart?: () => void;
  readonly onDropoff: () => void;
  readonly onBack: () => void;
  readonly onSent: (booking: Booking) => void;
};

// The check before the request (docs/35): the seats, the money, where from and where to. Sent, the
// way is kept for the next trip on this route (G35, docs/97 K4).
export function BookReview(props: Props) {
  const { trip, seats, most, mode, pickup, dropoff, onSeats, onStart, onDropoff, onBack, onSent } = props;
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
      rememberWay(trip.from, trip.to, { mode, pickup, dropoff });
      haptic.success();
      return onSent(booking);
    } catch (caught) {
      haptic.error();
      return setError(errorKey(caught));
    }
  };
  const line = (icon: IconName, label: string, value: string) => (
    <Cell before={<IconTile name={icon} />} after={<CellValue>{value}</CellValue>}>
      {label}
    </Cell>
  );
  const pitak = mode === 'pitak' ? trip.pitak : null;
  const start = pitak ? pitak.name : pickup ? nameText(pickup.name, pickup.place) : '';
  return (
    <StepLayout icon="myTrips" title={t('bookings.review.title')} hint={t('way.book.fixed')}>
      <Screen onBack={onBack} />
      <List>
        <Section footer={payHint}>
          <div className="route-summary">
            <RouteView from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
          </div>
          <PointRow
            icon={pitak ? 'pitak' : 'origin'}
            label={t('way.book.pickup')}
            text={start}
            {...(onStart ? { onChange: onStart } : {})}
          />
          {pitak ? <PitakMap pitak={pitak} /> : null}
          <PointRow
            icon="destination"
            tone="accent"
            label={t('way.book.dropoff')}
            text={nameText(dropoff.name, dropoff.place)}
            onChange={onDropoff}
          />
          <SeatsCell seats={seats} most={most} onSeats={onSeats} />
          {/* One seat: the price is the total, one line says it (G40, docs/106 C8). */}
          {seats > 1 ? line('price', t('market.review.price'), formatMoney(trip.price)) : null}
          {line('wallet', t('bookings.review.total'), formatMoney(trip.price * seats))}
        </Section>
      </List>
      {error ? <Text className="step-error">{t(error)}</Text> : null}
      <MainButton text={t('bookings.send')} onClick={send} />
    </StepLayout>
  );
}

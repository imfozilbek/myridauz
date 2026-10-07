import type { Booking, Trip } from '@platform/contracts';
import { useState } from 'react';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import type { SeatChoice } from '../find/seat-choice';
import { Icon } from '../icons';
import { errorKey } from '../market/error-text';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { rememberWay } from '../way/remembered-way';
import { useNameText } from '../way/way-end';
import type { useBooking } from './book-state';
import './book-points.css';

type Props = {
  readonly trip: Trip;
  readonly choice: SeatChoice;
  readonly flow: ReturnType<typeof useBooking>;
  readonly route: string;
  readonly onBack: () => void;
  readonly onSent: (booking: Booking) => void;
};

// «Qayerdan, qayerga?» (owner decision 06.10.2026, docs/118 path 2, B): one screen instead of the way,
// two maps and the check. A row opens its map; «Soʻrov yuborish» works when both are chosen.
export function BookPoints({ trip, choice, flow, route, onBack, onSent }: Props) {
  useScreenView('bookings.points');
  useScreenBackground();
  const { t, formatMoney, formatNumber, formatDate, formatTime } = useI18n();
  const { colors } = useBrand().theme;
  const { track } = useAnalytics();
  const { bookings } = useApiClients();
  const nameText = useNameText();
  const [error, setError] = useState<ReturnType<typeof errorKey> | null>(null);
  const { mode, pickup, dropoff, ready, patch } = flow;
  const start =
    mode === 'pitak' ? (trip.pitak?.name ?? null) : pickup ? nameText(pickup.name, pickup.place) : null;
  const end = dropoff ? nameText(dropoff.name, dropoff.place) : null;
  const send = async () => {
    setError(null);
    if (!ready || !mode || !dropoff?.point) return haptic.error();
    try {
      const at = mode === 'door' ? (pickup?.point ?? null) : null;
      const booking = await bookings.book(trip.id, { ...choice, mode, pickup: at, dropoff: dropoff.point });
      track({ name: 'booking_step', screen: 'bookings.points', step: 'requested' });
      rememberWay(trip.from, trip.to, { mode, pickup: mode === 'door' ? pickup : null, dropoff });
      haptic.success();
      return onSent(booking);
    } catch (caught) {
      haptic.error();
      return setError(errorKey(caught));
    }
  };
  const day = new Date(trip.departAt);
  const row = (kind: 'pickup' | 'dropoff', value: string | null) => (
    <button type="button" className="points-row" onClick={() => patch({ screen: kind })}>
      <span className={`points-tile points-${kind}`}>
        <Icon name="destination" size={20} />
      </span>
      <span className="points-text">
        <span className="points-label">{t(kind === 'pickup' ? 'way.book.pickup' : 'way.book.dropoff')}</span>
        <span className={value ? 'points-value' : 'points-value points-empty'}>
          {value ?? t('places.choose')}
        </span>
      </span>
      {value ? <span className="points-change">{t('way.change')}</span> : <Icon name="next" size={18} />}
    </button>
  );
  return (
    <div className="find points" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="points-title">{t('bookings.points.title')}</h1>
      <p className="points-sub">
        {t('bookings.points.sub', {
          route,
          date: formatDate(day),
          time: formatTime(day),
          seats: String(choice.seats),
        })}
      </p>
      <div className="points-card">
        {row('pickup', start)}
        {row('dropoff', end)}
      </div>
      <p className="find-head points-head">{t('bookings.points.all')}</p>
      <div className="points-card points-sum">
        <span>
          {t('bookings.points.line', { seats: String(choice.seats), price: formatNumber(trip.price) })}
        </span>
        <b>{formatMoney(trip.price * choice.seats)}</b>
      </div>
      <p className="points-hint">{t('bookings.points.hint')}</p>
      {error ? <p className="points-error">{t(error)}</p> : null}
      <MainButton text={t('bookings.send')} onClick={() => void send()} />
    </div>
  );
}

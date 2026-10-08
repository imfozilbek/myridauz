import type { Booking, Trip } from '@platform/contracts';
import { useState } from 'react';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import type { SeatChoice } from '../find/seat-choice';
import { errorKey } from '../market/error-text';
import { Icon } from '../icons';
import { haptic } from '../telegram/feedback';
import { rememberWay } from '../way/remembered-way';
import { useNameText } from '../way/way-end';
import type { useBooking } from './book-state';
import { PointsScreen, usePassengerWords } from './points-screen';

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
  const { t, formatMoney, formatNumber, formatDate, formatTime } = useI18n();
  const words = usePassengerWords();
  const { track } = useAnalytics();
  const { bookings } = useApiClients();
  const nameText = useNameText();
  const [error, setError] = useState<ReturnType<typeof errorKey> | null>(null);
  const { mode, pickup, dropoff, note, ready, patch } = flow;
  const start =
    mode === 'pitak' ? (trip.pitak?.name ?? null) : pickup ? nameText(pickup.name, pickup.place) : null;
  const end = dropoff ? nameText(dropoff.name, dropoff.place) : null;
  const send = async () => {
    setError(null);
    if (!ready || !mode || !dropoff?.point) return haptic.error();
    try {
      const at = mode === 'door' ? (pickup?.point ?? null) : null;
      const input = { ...choice, mode, pickup: at, dropoff: dropoff.point, note };
      const booking = await bookings.book(trip.id, input);
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
  return (
    <PointsScreen
      {...words}
      sub={t('bookings.points.sub', {
        route,
        date: formatDate(day),
        time: formatTime(day),
        seats: String(choice.seats),
      })}
      start={start}
      end={end}
      onEnd={(screen) => patch({ screen })}
      hint={t('bookings.points.hint')}
      error={error ? t(error) : null}
      button={t('bookings.send')}
      onSend={send}
      onBack={onBack}
      extra={
        // How the driver knows the passenger at the meeting (owner decision 08.10.2026): a third
        // row of the same card, as the two ends.
        <button type="button" className="points-row" onClick={() => patch({ screen: 'note' })}>
          <span className="points-tile points-note">
            <Icon name="chat" size={20} />
          </span>
          <span className="points-text">
            <span className="points-label">{t('bookings.points.note')}</span>
            <span className={note ? 'points-value' : 'points-value points-empty'}>
              {note || t('market.comment.placeholder')}
            </span>
          </span>
          <Icon name="next" size={18} />
        </button>
      }
    >
      <div className="points-card points-sum">
        <span>
          {t('bookings.points.line', { seats: String(choice.seats), price: formatNumber(trip.price) })}
        </span>
        <b>{formatMoney(trip.price * choice.seats)}</b>
      </div>
    </PointsScreen>
  );
}

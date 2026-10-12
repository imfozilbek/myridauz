import type { Booking, Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useRoadNext } from './use-road-next';
import './road-next-card.css';

type Props = { readonly trip: Trip; readonly bookings: readonly Booking[] };

// В2 (G78 sheet 3): on the way «Mening safarim» says the next point too, as the block of the main
// screen does: «Yoʻldasiz · 0 / 2», «Keyingi: …», who waits there and how many.
export function RoadNextCard({ trip, bookings }: Props) {
  const { t } = useI18n();
  const road = useRoadNext(trip, bookings);
  if (!road.next) return null;
  return (
    <div className="road-next">
      <span className="road-next-chip">{road.chip}</span>
      <b>{t('home.dock.next', { place: road.place })}</b>
      <span>
        {road.who}
        {road.seats > 0 ? ` · ${t('market.request.seats', { count: String(road.seats) })}` : null}
      </span>
    </div>
  );
}

import { arrivalAt, roadMs, type Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useBookingEnds } from '../trip/booking-ends';
import '../find/route-line.css';

const HOUR_MS = 60 * 60 * 1000;

// The two points of a booking with the line of the way between them (docs/126, mockup 4-sent): the
// place, then its region and the time; «≈ 300 km · ≈ 5 soat yoʻl» in the middle.
export function BookingPoints({ booking }: { readonly booking: Booking }) {
  const { t, formatTime } = useI18n();
  const { trip } = booking;
  const { start, end: finish, regionName } = useBookingEnds(booking);
  const end = (kind: 'from' | 'to', name: string, region: string, time: string) => (
    <div className={`route-line-end route-line-${kind}`}>
      <span className="route-line-dot" aria-hidden />
      <span className="route-line-names">
        <span className="route-line-name">{name}</span>
        <span className="route-line-region">{t('bookings.pending.at', { region, time })}</span>
      </span>
    </div>
  );
  return (
    <div className="pending-points route-line">
      {end('from', start, regionName(trip.from), formatTime(new Date(trip.departAt)))}
      <div className="route-line-way">
        {t('find.road', { km: String(trip.km), hours: String(Math.round(roadMs(trip.km) / HOUR_MS)) })}
      </div>
      {end(
        'to',
        finish,
        regionName(trip.to),
        t('market.trip.arrival', { time: formatTime(new Date(arrivalAt(trip.departAt, trip.km))) }),
      )}
    </div>
  );
}

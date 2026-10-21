import { type Booking, HOUR_MS, roadMs } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useBookingEnds } from '../trip/booking-ends';
import { useArrivalTime, useTripTime } from '../trip/trip-time';
import '../find/route-line.css';

// The two points of a booking with the line of the way between them (docs/126, mockup 4-sent): the
// place, then its region and the time; «≈ 300 km · ≈ 5 soat yoʻl» in the middle.
export function BookingPoints({ booking }: { readonly booking: Booking }) {
  const { t } = useI18n();
  const tripTime = useTripTime();
  const arrival = useArrivalTime()(booking.trip);
  const { trip } = booking;
  const { start, end: finish, regionName } = useBookingEnds(booking);
  // A range has no arrival: the end shows its region alone (G90, docs/216).
  const end = (kind: 'from' | 'to', name: string, region: string, time: string | null) => (
    <div className={`route-line-end route-line-${kind}`}>
      <span className="route-line-dot" aria-hidden />
      <span className="route-line-names">
        <span className="route-line-name">{name}</span>
        <span className="route-line-region">
          {time === null ? region : t('bookings.pending.at', { region, time })}
        </span>
      </span>
    </div>
  );
  return (
    <div className="pending-points route-line">
      {end('from', start, regionName(trip.from), tripTime(trip))}
      <div className="route-line-way">
        {t('find.road', { km: String(trip.km), hours: String(Math.round(roadMs(trip.km) / HOUR_MS)) })}
      </div>
      {end(
        'to',
        finish,
        regionName(trip.to),
        arrival === null ? null : t('market.trip.arrival', { time: arrival }),
      )}
    </div>
  );
}

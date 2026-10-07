import { arrivalAt, roadMs, type Booking, type Point } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useBookingEnds } from './booking-ends';
import './trip-card.css';

const HOUR_MS = 60 * 60 * 1000;

type Props = {
  readonly booking: Booking;
  // The review needs the way only (mockup g60/5).
  readonly sum?: boolean;
  // A tap on a point with its place opens it in a map (docs/70, docs/126).
  readonly onPoint?: (point: Point) => void;
};

// The one card of a booked trip (owner decision 06.10.2026, docs/118 path 3): the two points with
// their times, then the seats and the sum. The booking, the call and the review show this card.
export function TripCard({ booking, sum = true, onPoint }: Props) {
  const { t, formatTime, formatMoney } = useI18n();
  const { start, end, startPoint, endPoint, regionName } = useBookingEnds(booking);
  const { trip } = booking;
  // After the trip the exact places are gone: each end with its region, the road between (g60/7).
  const past = booking.status === 'completed';
  const departs = formatTime(new Date(trip.departAt));
  const arrives = formatTime(new Date(arrivalAt(trip.departAt, trip.km)));
  const point = (kind: 'from' | 'to', name: string, note: string) => {
    const place = kind === 'from' ? startPoint : endPoint;
    const content = (
      <>
        <span className="trip-card-dot" aria-hidden />
        <span className="trip-card-names">
          <span className="trip-card-name">{name}</span>
          <span className="trip-card-note">{note}</span>
        </span>
      </>
    );
    const className = `trip-card-point trip-card-${kind}`;
    return place && onPoint ? (
      <button type="button" className={className} onClick={() => onPoint(place)}>
        {content}
      </button>
    ) : (
      <div className={className}>{content}</div>
    );
  };
  return (
    <div className="trip-sheet">
      <div className={past ? 'trip-card-way trip-card-past' : 'trip-card-way'}>
        {past
          ? point('from', start, t('bookings.card.region', { region: regionName(trip.from), time: departs }))
          : point('from', start, t('bookings.card.pickup', { time: departs }))}
        {past ? (
          <span className="trip-card-road">
            {t('find.road', { km: String(trip.km), hours: String(Math.round(roadMs(trip.km) / HOUR_MS)) })}
          </span>
        ) : null}
        {past
          ? point('to', end, t('bookings.card.region', { region: regionName(trip.to), time: arrives }))
          : point('to', end, t('bookings.card.dropoff', { time: arrives }))}
      </div>
      {sum ? (
        <div className="trip-card-sum">
          <span>{t('bookings.card.seats', { seats: String(booking.seats) })}</span>
          <b>{formatMoney(booking.price * booking.seats)}</b>
        </div>
      ) : null}
    </div>
  );
}

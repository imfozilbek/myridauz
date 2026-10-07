import { arrivalAt, roadMs, type Booking, type BookedPlace } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { usePlaces } from '../market/places-gate';
import { useNameText } from '../way/way-end';
import '../find/route-line.css';

const HOUR_MS = 60 * 60 * 1000;

// The two points of a booking with the line of the way between them (docs/126, mockup 4-sent): the
// place, then its region and the time; «≈ 300 km · ≈ 5 soat yoʻl» in the middle.
export function BookingPoints({ booking }: { readonly booking: Booking }) {
  const { t, formatTime } = useI18n();
  const directory = usePlaces();
  const nameText = useNameText();
  const { trip } = booking;
  const regionName = (id: string) => {
    const place = directory.find(id);
    return (place?.parentId ? directory.find(place.parentId) : place)?.name ?? '';
  };
  const placeName = (booked: BookedPlace | null, id: string) =>
    booked
      ? nameText(booked.name ?? booked.area, directory.find(id) ?? id)
      : (directory.find(id)?.name ?? id);
  const start = booking.pitak ? booking.pitak.name : placeName(booking.pickup, trip.from);
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
        <Icon name="carSide" size={15} />
        {t('find.road', { km: String(trip.km), hours: String(Math.round(roadMs(trip.km) / HOUR_MS)) })}
      </div>
      {end(
        'to',
        placeName(booking.dropoff, trip.to),
        regionName(trip.to),
        t('market.trip.arrival', { time: formatTime(new Date(arrivalAt(trip.departAt, trip.km))) }),
      )}
    </div>
  );
}

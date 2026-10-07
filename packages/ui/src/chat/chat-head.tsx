import { arrivalAt, formatPlate, tashkentDate, type Booking, type ChatAbout } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { Icon } from '../icons';
import { usePlaces } from '../market/places-gate';
import { useBookingEnds } from '../trip/booking-ends';
import { today, tomorrow } from '../market/when';
import './chat-head.css';

type Props = {
  readonly about: ChatAbout | null;
  readonly name: string;
  // A voice call only after the confirmation; phone numbers are never shown (docs/08).
  readonly onCall: (() => void) | null;
  readonly onTrip: (() => void) | undefined;
};

const PHOTO = 38;
const LETTER = 16;

// The head of a chat (owner decision 06.10.2026, docs/118 path 3, mockup g60/2): the face, the
// name, the car and its plate, the call; under them the line of the trip that opens the booking.
export function ChatHead({ about, name, onCall, onTrip }: Props) {
  const { t } = useI18n();
  const booking = about?.booking ?? null;
  const other = booking ? (about?.role === 'passenger' ? booking.trip.driver : booking.passenger) : null;
  const car = booking && about?.role === 'passenger' ? booking.trip.driver.car : null;
  const carLine = car
    ? [
        `${car.model}, ${t(`drivers.color.${car.color}`)}`,
        ...(booking?.plate ? [formatPlate(booking.plate)] : []),
      ]
    : [];
  return (
    <div className="chat-top">
      <div className="chat-head">
        {other ? (
          <PersonBadge
            id={other.id}
            name={other.firstName}
            hasAvatar={other.hasAvatar}
            size={PHOTO}
            letter={LETTER}
            plain
          />
        ) : null}
        <span className="chat-head-text">
          <b>{name}</b>
          {carLine.length > 0 ? <span>{carLine.join(' · ')}</span> : null}
        </span>
        {onCall ? (
          <button type="button" className="chat-call" aria-label={t('calls.call')} onClick={onCall}>
            <Icon name="phone" size={22} />
          </button>
        ) : null}
      </div>
      {booking ? <TripLine booking={booking} onTrip={onTrip} /> : null}
    </div>
  );
}

type LineProps = { readonly booking: Booking; readonly onTrip: (() => void) | undefined };

// «Ertaga, 16:00 · Chilonzor bozori yaqinida», under it «Toshkent shahri → Samarqand viloyati · 2 joy».
function TripLine({ booking, onTrip }: LineProps) {
  const { t, formatTime, formatDate } = useI18n();
  const directory = usePlaces();
  const { start } = useBookingEnds(booking);
  const { trip } = booking;
  const region = (id: string) => {
    const place = directory.find(id);
    return (place?.parentId ? directory.find(place.parentId) : place)?.name ?? '';
  };
  const ended = booking.status === 'completed';
  const date = tashkentDate(trip.departAt);
  const now = Date.now();
  const day =
    date === today(now)
      ? t('market.day.today')
      : date === tomorrow(now)
        ? t('market.day.tomorrow')
        : formatDate(new Date(trip.departAt));
  return (
    <button type="button" className="chat-trip" onClick={onTrip} disabled={!onTrip}>
      <span className="chat-trip-text">
        <b>
          {ended
            ? t('chat.trip.done', { date: formatDate(new Date(arrivalAt(trip.departAt, trip.km))) })
            : t('chat.trip.when', { day, time: formatTime(new Date(trip.departAt)), place: start })}
        </b>
        <span>
          {t('chat.trip.way', { from: region(trip.from), to: region(trip.to), seats: String(booking.seats) })}
        </span>
      </span>
      {onTrip ? <Icon name="next" size={10} /> : null}
    </button>
  );
}

import type { Booking, DriverMeetStep } from '@platform/contracts';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { mapUrl } from '../bookings/map-link';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { usePlaceLabel } from '../market/places-gate';
import { openExternal } from '../telegram/feedback';
import { useBookingEnds } from '../trip/booking-ends';
import { MeetingMap } from '../trip/meeting-map';
import { MeetActions } from './meet-actions';
import './meet-map.css';

const FACE = 63;
const TOOL_ICON = 17.5;
const MAP_ICON = 15;
// The pin of the point on the small map, as tall as on the mockup g63/4 screen 13.
const PIN = 42;

type Props = {
  readonly booking: Booking;
  readonly number: number;
  // The point the driver goes to now: in the colour of the app (mockup g63/4 screen 13).
  readonly current: boolean;
  readonly onMark: (step: DriverMeetStep) => void;
  readonly onChat: () => void;
  readonly onCall: () => void;
};

// One point of the meeting (owner decision 06.10.2026, docs/126): when, the small map, the place by
// the rule of docs/121, who waits there, the mark of the driver, the chat and the call.
export function MeetCard({ booking, number, current, onMark, onChat, onCall }: Props) {
  const { t, formatTime } = useI18n();
  const { start, startPoint } = useBookingEnds(booking);
  // «Chilonzor, Toshkent shahri» under the place (docs/121): the district of the trip, its region.
  const { name, area: region } = usePlaceLabel()(booking.trip.from);
  const area = [name, region].filter(Boolean).join(', ');
  const open = () => (startPoint ? openExternal(mapUrl(startPoint)) : undefined);
  const { passenger } = booking;
  return (
    <section className={current ? 'meet-card meet-card-now' : 'meet-card'}>
      <span className="meet-chip">
        {t('driverAfter.meet.point', {
          number: String(number),
          time: formatTime(new Date(booking.trip.departAt)),
        })}
      </span>
      {startPoint ? (
        <div className="meet-map">
          <MeetingMap point={startPoint} onOpen={open} pin={PIN} />
          <button type="button" className="meet-map-open" onClick={open}>
            <Icon name="map" size={MAP_ICON} />
            {t('bookings.openMap')}
          </button>
        </div>
      ) : null}
      <span className="meet-place">
        <b>{start}</b>
        <span>{area}</span>
      </span>
      <span className="meet-who">
        <ProfilePhoto
          userId={passenger.id}
          name={passenger.firstName}
          hasAvatar={passenger.hasAvatar}
          size={FACE}
        />
        <span className="meet-who-text">
          <b>{`${passenger.firstName} · ${t('bookings.card.seats', { seats: String(booking.seats) })}`}</b>
          {/* How the driver knows the passenger (the note of the booking, mockup g63/4 screen 13). */}
          {booking.note ? <span>{booking.note}</span> : null}
        </span>
      </span>
      <MeetActions booking={booking} onMark={onMark} />
      <div className="meet-tools">
        <button type="button" onClick={onChat}>
          <Icon name="write" size={TOOL_ICON} />
          {t('driverAfter.meet.write')}
        </button>
        <button type="button" onClick={onCall}>
          <Icon name="phone" size={TOOL_ICON} />
          {t('calls.call')}
        </button>
      </div>
    </section>
  );
}

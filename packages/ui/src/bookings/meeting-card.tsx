import { meetingStartsAt, type Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { UzPlate } from '../plate/uz-plate';
import { Icon } from '../icons';
import { ActionFailure } from '../states/action-failure';
import { useCame } from '../meeting/use-came';
import { openExternal } from '../telegram/feedback';
import { useBookingEnds } from '../trip/booking-ends';
import { MeetingMap } from '../trip/meeting-map';
import { mapUrl } from './map-link';
import './meeting-card.css';

// From the brand's minutes before the departure until the passenger is in the car (docs/126).
export const meetingTime = (booking: Booking, now: number, minutes: number) =>
  booking.status === 'confirmed' &&
  booking.boardedAt === null &&
  now >= meetingStartsAt(booking.trip.departAt, minutes);

type Props = { readonly booking: Booking; readonly onTold: (booking: Booking) => void };

// The meeting (owner decision 06.10.2026, docs/126): when, where on a small map, the plate big;
// «Men keldim» tells the driver the passenger is at the point.
export function MeetingCard({ booking, onTold }: Props) {
  const { t, formatTime } = useI18n();
  const { came, failure } = useCame(onTold, 'bookings.passenger');
  const { start, startPoint } = useBookingEnds(booking);
  return (
    <section className="meeting-card" aria-label={t('bookings.meeting.title')}>
      <b>{t('bookings.meeting.when', { time: formatTime(new Date(booking.trip.departAt)) })}</b>
      {startPoint ? <MeetingMap point={startPoint} onOpen={() => openExternal(mapUrl(startPoint))} /> : null}
      <span className="meeting-place">{start}</span>
      {booking.plate ? <UzPlate plate={booking.plate} /> : null}
      <ActionFailure error={failure} />
      {booking.cameAt === null ? (
        <button type="button" className="meeting-came" onClick={() => void came(booking)}>
          <Icon name="selected" size={20} />
          {t('bookings.meeting.came')}
        </button>
      ) : (
        <span className="meeting-told">{t('bookings.meeting.told')}</span>
      )}
    </section>
  );
}

import { meetingStartsAt, type Booking } from '@platform/contracts';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { UzPlate } from '../plate/uz-plate';
import { Icon } from '../icons';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { haptic, openExternal } from '../telegram/feedback';
import { useBookingEnds } from '../trip/booking-ends';
import { MeetingMap } from '../trip/meeting-map';
import { mapUrl } from './map-link';
import './meeting-card.css';

// From MEET_BEFORE_MINUTES before the departure until the passenger is in the car (docs/126).
export const meetingTime = (booking: Booking, now: number) =>
  booking.status === 'confirmed' &&
  booking.boardedAt === null &&
  now >= meetingStartsAt(booking.trip.departAt);

type Props = { readonly booking: Booking; readonly onTold: (booking: Booking) => void };

// The meeting (owner decision 06.10.2026, docs/126): when, where on a small map, the plate big;
// «Men keldim» tells the driver the passenger is at the point.
export function MeetingCard({ booking, onTold }: Props) {
  const { t, formatTime } = useI18n();
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const { failure, fail, clear } = useFailure();
  const { start, startPoint } = useBookingEnds(booking);
  const came = async () => {
    clear();
    try {
      onTold(await chat.came(booking.id));
      haptic.success();
      track({ name: 'booking_step', screen: 'bookings.passenger', step: 'came' });
    } catch (caught) {
      fail(caught);
    }
  };
  return (
    <section className="meeting-card" aria-label={t('bookings.meeting.title')}>
      <b>{t('bookings.meeting.when', { time: formatTime(new Date(booking.trip.departAt)) })}</b>
      {startPoint ? <MeetingMap point={startPoint} onOpen={() => openExternal(mapUrl(startPoint))} /> : null}
      <span className="meeting-place">{start}</span>
      {booking.plate ? <UzPlate plate={booking.plate} /> : null}
      <ActionFailure error={failure} />
      {booking.cameAt === null ? (
        <button type="button" className="meeting-came" onClick={() => void came()}>
          <Icon name="selected" size={20} />
          {t('bookings.meeting.came')}
        </button>
      ) : (
        <span className="meeting-told">{t('bookings.meeting.told')}</span>
      )}
    </section>
  );
}

import { meetingStartsAt, type Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useDockWords } from '../home/dock/dock-words';
import { SeatMeetCard } from '../home/dock/seat-meet-card';
import { usePlaces } from '../market/places-gate';
import { useCame } from '../meeting/use-came';
import { useNow } from '../own-trip/use-now';
import { ActionFailure } from '../states/action-failure';
import { openExternal } from '../telegram/feedback';
import { useBookingEnds } from '../trip/booking-ends';
import { mapUrl } from './map-link';
import './meeting-card.css';

// From the brand's minutes before the departure until the passenger is in the car (docs/126).
export const meetingTime = (booking: Booking, now: number, minutes: number) =>
  booking.status === 'confirmed' &&
  booking.boardedAt === null &&
  now >= meetingStartsAt(booking.trip.departAt, minutes);

type Props = {
  readonly booking: Booking;
  readonly onOpen: (screen: 'chat' | 'call') => void;
  readonly onTold: (booking: Booking) => void;
};

// The meeting on the page of the seat (docs/126, G78 sheet 2): the card of the block at the bottom,
// one component, with the driver in it; «Xaritada ochish» and «Men keldim» under it. After «Men
// keldim» the map stays until the driver's «Keldi», as in the block (G76).
export function MeetingCard({ booking, onOpen, onTold }: Props) {
  const { t } = useI18n();
  const words = useDockWords(usePlaces(), useNow());
  const { came, failure } = useCame(onTold, 'bookings.passenger');
  const { startPoint } = useBookingEnds(booking);
  const told = booking.cameAt !== null;
  const tools = [
    { icon: 'phone' as const, label: t('sheet.meet.call'), onClick: () => onOpen('call') },
    {
      icon: 'chat' as const,
      label: t('chat.open'),
      dot: (booking.unread ?? 0) > 0,
      onClick: () => onOpen('chat'),
    },
  ];
  return (
    <div className="meeting-block">
      <SeatMeetCard booking={booking} words={words} tools={tools} />
      <ActionFailure error={failure} />
      <div className="meeting-buttons">
        {startPoint ? (
          <button
            type="button"
            className={told ? 'meeting-main' : 'meeting-second'}
            onClick={() => openExternal(mapUrl(startPoint))}
          >
            {t('bookings.openMap')}
          </button>
        ) : null}
        {told ? null : (
          <button type="button" className="meeting-main" onClick={() => void came(booking)}>
            {t('bookings.meeting.came')}
          </button>
        )}
      </div>
    </div>
  );
}

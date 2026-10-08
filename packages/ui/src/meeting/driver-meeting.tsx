import type { Booking } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { MeetCard } from './meet-card';
import { meetingPoints, meetOpen } from './meet-state';
import { useMeetMark } from './use-meet-mark';
import './meeting.css';

// The tick of «Madina keldi: uchrashuv joyida» (mockup g63/4 screen 13).
const TICK = 20;

type Props = {
  // The bookings of the trip: the confirmed ones are the points.
  readonly bookings: readonly Booking[];
  // The passengers of the point opened on «Safar xaritasi» (screen 12).
  readonly only: readonly string[];
  readonly onBack: () => void;
  // A mark changed a booking: the page shows it at once, the list refreshes.
  readonly onChanged: (booking: Booking) => void;
  readonly onChat: (booking: Booking) => void;
  readonly onCall: (booking: Booking) => void;
};

// «Uchrashuv» of the driver (owner decision 06.10.2026, docs/126, docs/124 В, mockup g63/4 screen
// 13): the passenger who said «Men keldim» on top, then the point opened on the map, with its
// number in the order of the way.
export function DriverMeeting({ bookings, only, onBack, onChanged, onChat, onCall }: Props) {
  useScreenView('bookings.meeting');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const { mark, failure } = useMeetMark(onChanged);
  const points = meetingPoints(bookings).filter(({ booking }) => only.includes(booking.id));
  const now = points.find(({ booking }) => meetOpen(booking))?.booking.id;
  const waiting = points.filter(({ booking }) => booking.cameAt !== null && meetOpen(booking));
  return (
    <div className="meet" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      {waiting.map(({ booking }) => (
        <p key={booking.id} className="meet-came" role="status">
          <Icon name="selected" size={TICK} />
          {t('driverAfter.meet.came', { name: booking.passenger.firstName })}
        </p>
      ))}
      <ActionFailure error={failure} />
      {points.map(({ booking, number }) => (
        <MeetCard
          key={booking.id}
          booking={booking}
          number={number}
          current={booking.id === now}
          onMark={(step) => void mark(booking, step)}
          onChat={() => onChat(booking)}
          onCall={() => onCall(booking)}
        />
      ))}
    </div>
  );
}

import type { Booking } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { PersonBadge } from '../find/person-badge';
import { Icon } from '../icons';
import { FormSheet } from '../sheet/form-sheet';
import { haptic } from '../telegram/feedback';
import './rider-pick.css';

const FACE = 36;
const CHEVRON = 18;

type Props = {
  readonly riders: readonly Booking[] | null;
  readonly question: string;
  readonly onPick: (booking: Booking) => void;
  readonly onClose: () => void;
};

// «Qaysi yoʻlovchi?» (G75, the sheets of the mockup g75/3 A): which passenger a row of «Safardan
// keyin» is about, in a sheet over the past trip; every passenger, one tap each (docs/19).
export function RiderPick({ riders, question, onPick, onClose }: Props) {
  return (
    <FormSheet open={riders !== null} title={question} onClose={onClose}>
      {riders ? <Riders riders={riders} onPick={onPick} /> : null}
    </FormSheet>
  );
}

function Riders({
  riders,
  onPick,
}: {
  readonly riders: readonly Booking[];
  readonly onPick: (booking: Booking) => void;
}) {
  useScreenView('trip_end.pick');
  return (
    <div className="rider-pick">
      {riders.map((booking) => (
        <button
          key={booking.id}
          type="button"
          className="rider-pick-row"
          onClick={() => (haptic.select(), onPick(booking))}
        >
          <PersonBadge
            id={booking.passenger.id}
            name={booking.passenger.firstName}
            hasAvatar={booking.passenger.hasAvatar}
            size={FACE}
            plain
          />
          <span className="rider-pick-name">{booking.passenger.firstName}</span>
          <Icon name="next" size={CHEVRON} />
        </button>
      ))}
    </div>
  );
}

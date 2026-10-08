import type { Booking } from '@platform/contracts';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { PersonBadge } from '../find/person-badge';
import { Screen } from '../screen/screen';

// The face of a passenger in the list, as in the rows of the past trip (mockup g63/5 phone 5).
const FACE = 35;

type Props = {
  readonly riders: readonly Booking[];
  readonly question: string;
  readonly onPick: (booking: Booking) => void;
  readonly onBack: () => void;
};

// Which passenger a row of «Safardan keyin» is about, when the window of Telegram cannot hold them
// all (it shows three) or Telegram is not there: every passenger of the trip, one tap each (docs/19).
export function RiderPick({ riders, question, onPick, onBack }: Props) {
  useScreenView('trip_end.pick');
  return (
    <List>
      <Screen onBack={onBack} />
      <Section header={question}>
        {riders.map((booking) => (
          <Cell
            key={booking.id}
            before={
              <PersonBadge
                id={booking.passenger.id}
                name={booking.passenger.firstName}
                hasAvatar={booking.passenger.hasAvatar}
                size={FACE}
                plain
              />
            }
            onClick={() => onPick(booking)}
          >
            {booking.passenger.firstName}
          </Cell>
        ))}
      </Section>
    </List>
  );
}

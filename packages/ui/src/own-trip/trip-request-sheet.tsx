import type { Booking } from '@platform/contracts';
import { useRequestItem, useSheetAnswer } from '../action-sheet/kinds/request-item';
import { OneSheet } from '../action-sheet/one-sheet';
import { usePlaces } from '../market/places-gate';

type Props = {
  readonly booking: Booking | null;
  readonly balance: number | null;
  // Fresh wallet and trip after the answer.
  readonly onAnswered: () => void;
  readonly onClose: () => void;
};

// A request opened from its name on «Mening safarim» is the sheet of the main screen (G78 sheet 3,
// docs/122): one look of a request everywhere; the trip stays seen under it.
export function TripRequestSheet({ booking, balance, onAnswered, onClose }: Props) {
  const item = useRequestItem(usePlaces());
  const answer = useSheetAnswer(onAnswered);
  return (
    <OneSheet item={booking ? item(booking, balance, answer) : null} onDone={onClose} onClose={onClose} />
  );
}

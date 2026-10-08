import { NewTripFlow } from '../market/new-trip-flow';
import type { TripAgain, TripDraft } from '../market/trip-draft';

type Props = { readonly draft: Partial<TripDraft>; readonly onBack: () => void };

// The publishing of the way back (G18, docs/40): the route the other way with the answers of the
// trip, «Mashinada ayol bor», and the day and the time of «Qaytish»: the driver only confirms them.
// The one-screen publishing of G63 C1 takes the same answers.
export function ReturnPublish({ draft, onBack }: Props) {
  const { route, pickupMode, seats, price, comment, bookingRule, date, time, womanOnBoard } = draft;
  if (!route || !pickupMode || !seats || !price || comment === undefined) return null;
  const again: TripAgain = {
    pickupMode,
    seats,
    price,
    comment,
    ...(bookingRule ? { bookingRule } : {}),
    ...(date ? { date } : {}),
    ...(time ? { time } : {}),
    ...(womanOnBoard === undefined ? {} : { womanOnBoard }),
  };
  return <NewTripFlow route={route} again={again} onBack={onBack} />;
}

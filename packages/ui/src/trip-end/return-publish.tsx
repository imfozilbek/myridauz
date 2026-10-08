import { NewTripFlow } from '../market/new-trip-flow';
import type { TripDraft } from '../market/trip-draft';

type Props = { readonly draft: Partial<TripDraft>; readonly onBack: () => void };

// The publishing of the way back (G18): the route the other way with the answers of the trip; the
// day and the time are asked again. The one-screen publishing of G63 C1 takes the whole draft.
export function ReturnPublish({ draft, onBack }: Props) {
  const { route, pickupMode, seats, price, comment, bookingRule } = draft;
  if (!route || !pickupMode || !seats || !price || comment === undefined) return null;
  const again = { pickupMode, seats, price, comment, ...(bookingRule ? { bookingRule } : {}) };
  return <NewTripFlow route={route} again={again} onBack={onBack} />;
}

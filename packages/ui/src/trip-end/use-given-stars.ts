import type { Booking } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useLoad } from '../market/use-list';

// The stars the driver gave each passenger (docs/24) for «Baho: ★★★★★ qoʻydingiz»; a review that
// cannot be read any more (the deadline) shows no stars.
export function useGivenStars(bookings: readonly Booking[]): ReadonlyMap<string, number> {
  const { feedback } = useApiClients();
  const rated = bookings.filter((booking) => booking.rated === true);
  const { value } = useLoad(() =>
    Promise.all(
      rated.map(async ({ id }) => {
        const stars = await feedback.target(id).then(
          (target) => target.mine?.stars ?? null,
          () => null,
        );
        return [id, stars] as const;
      }),
    ),
  );
  const known = (value ?? []).flatMap(([id, stars]) => (stars === null ? [] : [[id, stars] as const]));
  return new Map(known);
}

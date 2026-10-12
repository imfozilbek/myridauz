import type { Booking } from '@platform/contracts';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';

const ALL_STARS = 5;
const NONE: ReadonlyMap<string, number> = new Map();

type Options = {
  // A passenger who waits for their own question of the bot: no stars until a tap (G78 sheet 6).
  readonly waits?: (booking: Booking) => boolean;
  // The stars already on the server (from the bot): sent again only when changed.
  readonly saved?: ReadonlyMap<string, number>;
};

// The stars of each passenger not rated yet (docs/24): five by default, one tap changes them; «Yuborish» sends the
// chosen ones with the rating API of G11, then the next step: the list, or the way back (G78 В10 A).
export function useRateRiders(
  toRate: readonly Booking[],
  { waits = () => false, saved = NONE }: Options = {},
) {
  const { feedback } = useApiClients();
  const { track } = useAnalytics();
  const { failure, fail, clear } = useFailure();
  const [stars, setStars] = useState<Readonly<Record<string, number>>>({});
  const starsOf = (booking: Booking) =>
    stars[booking.id] ?? saved.get(booking.id) ?? (waits(booking) ? null : ALL_STARS);
  const choose = (booking: Booking, value: number) => {
    haptic.select();
    setStars({ ...stars, [booking.id]: value });
  };
  const send = async (then: () => void) => {
    clear();
    const chosen = toRate.flatMap((booking) => {
      const value = starsOf(booking);
      return value === null || value === saved.get(booking.id)
        ? []
        : [{ bookingId: booking.id, stars: value }];
    });
    try {
      for (const review of chosen) await feedback.review(review);
      if (chosen.length > 0) track({ name: 'review_sent', screen: 'trip_end.rate' });
      haptic.success();
      then();
    } catch (caught) {
      fail(caught);
    }
  };
  return { starsOf, choose, send, failure };
}

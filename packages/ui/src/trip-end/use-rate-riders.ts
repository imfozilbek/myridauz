import type { Booking } from '@platform/contracts';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';

const ALL_STARS = 5;

// The stars of each passenger not rated yet (docs/24): five by default, one tap lowers them; «Yuborish»
// sends them all with the rating API of G11, then the next step.
export function useRateRiders(toRate: readonly Booking[], onSent: () => void) {
  const { feedback } = useApiClients();
  const { track } = useAnalytics();
  const { failure, fail, clear } = useFailure();
  const [stars, setStars] = useState<Readonly<Record<string, number>>>({});
  const starsOf = (booking: Booking) => stars[booking.id] ?? ALL_STARS;
  const choose = (booking: Booking, value: number) => {
    haptic.select();
    setStars({ ...stars, [booking.id]: value });
  };
  const send = async () => {
    clear();
    try {
      for (const booking of toRate) await feedback.review({ bookingId: booking.id, stars: starsOf(booking) });
      if (toRate.length > 0) track({ name: 'review_sent', screen: 'trip_end.rate' });
      haptic.success();
      onSent();
    } catch (caught) {
      fail(caught);
    }
  };
  return { starsOf, choose, send, failure };
}

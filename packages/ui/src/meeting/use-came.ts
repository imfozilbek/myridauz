import type { Booking } from '@platform/contracts';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';

// «Men keldim» of a passenger at the point (docs/126): the block of the main screen and the card of
// the meeting send it the same way, count it and answer with the phone; a failure says why (G77).
export function useCame(onTold: (booking: Booking) => void, screen: string) {
  const { chat } = useApiClients();
  const { track } = useAnalytics();
  const { failure, fail, clear } = useFailure();
  const came = async (booking: Booking) => {
    clear();
    try {
      onTold(await chat.came(booking.id));
      track({ name: 'booking_step', screen, step: 'came' });
      haptic.success();
    } catch (caught) {
      fail(caught);
    }
  };
  return { came, failure };
}

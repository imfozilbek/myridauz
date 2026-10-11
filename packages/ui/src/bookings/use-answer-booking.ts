import { ApiError } from '@platform/api-client';
import type { Booking, DriverBookingAction } from '@platform/contracts';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { haptic } from '../telegram/feedback';

const STEP_OF = { confirm: 'confirmed', decline: 'declined', cancel: 'cancelled' } as const;

type Options = {
  // Where the answer is counted: the trip, the booking, the sheet (docs/29).
  readonly screen: string;
  readonly onDone: () => void;
  // The wallet cannot pay the commission: the way to top up comes instead (G27).
  readonly onShort: (booking: Booking) => void;
  // Any other failure keeps the screen with its reason (docs/65 B3).
  readonly fail: (caught: unknown) => void;
};

// The answer of the driver to a booking (docs/35), the same on «Mening safarim», on the booking and
// in the sheet of a new request (G77): one tap, the step is counted, the phone answers.
export function useAnswerBooking({ screen, onDone, onShort, fail }: Options) {
  const { track } = useAnalytics();
  const { bookings } = useApiClients();
  return async (booking: Booking, action: DriverBookingAction) => {
    try {
      await bookings.answer(booking.id, action);
      track({ name: 'booking_step', screen, step: STEP_OF[action] });
      haptic.success();
      onDone();
    } catch (caught) {
      if (!(caught instanceof ApiError && caught.code === 'wallet.not_enough')) return fail(caught);
      haptic.error();
      onShort(booking);
    }
  };
}

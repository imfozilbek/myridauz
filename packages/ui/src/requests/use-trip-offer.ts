import { ApiError } from '@platform/api-client';
import { commissionFor } from '@platform/brands';
import type { RideRequest, Trip } from '@platform/contracts';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import type { Shortfall } from '../wallet/shortfall-sheet';

// The driver offers a trip on a request the same way on the board and in a talk (G77, docs/168 B):
// the live trip in one tap with its time and price, the step counted; a wallet short of the
// commission opens the sheet of the sum short (G75, mockup g75/4 B), any other failure says why.
export function useTripOffer(screen: string) {
  const { bookings } = useApiClients();
  const { track } = useAnalytics();
  const { commission } = useBrand();
  const [shortfall, setShortfall] = useState<Shortfall | null>(null);
  const { failure, fail, clear } = useFailure();
  const short = (need: number, request: RideRequest) =>
    setShortfall({ need, seats: request.seats, name: request.passenger.firstName });
  // The live trip of the driver: true once the offer went.
  const onTrip = async (request: RideRequest, trip: Trip) => {
    clear();
    try {
      await bookings.sendOffer(request.id, { departAt: trip.departAt, price: trip.price, tripId: trip.id });
      track({ name: 'booking_step', screen, step: 'offer_sent' });
      haptic.success();
      return true;
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'wallet.not_enough')
        short(commissionFor(commission, trip.price, request.seats), request);
      else fail(caught);
      return false;
    }
  };
  return { onTrip, short, shortfall, closeShortfall: () => setShortfall(null), failure, fail, clear };
}

import type { Offer } from '@platform/contracts';
import { offerStatusAt, type OfferRecord } from '../domain/offer';
import type { BookingsDeps, RequestFacts } from './ports';

// An offer as both sides see it: the driver's name, face and car, never the plate (docs/07).
export async function offerViews(
  deps: BookingsDeps,
  offers: readonly OfferRecord[],
  requests: readonly RequestFacts[],
): Promise<Offer[]> {
  const now = deps.now();
  const views = await Promise.all(
    offers.map(async (offer): Promise<Offer | null> => {
      const request = requests.find((item) => item.id === offer.requestId);
      const [driver, car] = await Promise.all([
        deps.people.find(offer.driverId),
        deps.approvedCar(offer.driverId),
      ]);
      if (!request || !driver || !car) return null;
      return {
        id: offer.id,
        requestId: offer.requestId,
        driver: {
          id: driver.id,
          firstName: driver.firstName,
          hasAvatar: driver.avatarKey !== null,
          car: { make: car.make, model: car.model, color: car.color },
        },
        from: request.from,
        to: request.to,
        departAt: offer.departAt,
        km: request.km,
        seats: request.seats,
        price: offer.price,
        commission: deps.wallet.commission(offer.price, request.seats),
        status: offerStatusAt(offer, request.open, now),
        bookingId: offer.bookingId,
      };
    }),
  );
  return views.filter((view) => view !== null);
}

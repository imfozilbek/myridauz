import { chatKeyOfOffer, type Offer } from '@platform/contracts';
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
      // The car kept in the offer: a new check of the driver hides nothing (docs/65 A1).
      const [driver, car] = [await deps.people.find(offer.driverId), offer.car];
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
        chatKey: chatKeyOfOffer(offer.id),
      };
    }),
  );
  return views.filter((view) => view !== null);
}

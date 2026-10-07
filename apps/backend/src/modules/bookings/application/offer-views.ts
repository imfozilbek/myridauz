import { chatKeyOfOffer, NO_RATING, type Offer } from '@platform/contracts';
import { offerSeats, offerStatusAt, type OfferRecord } from '../domain/offer';
import type { BookingsDeps } from './ports';
import type { RequestFacts } from './request-facts';

// An offer as both sides see it: the driver's name, face, car and plate (G61, as a trip of G59).
export async function offerViews(
  deps: BookingsDeps,
  offers: readonly OfferRecord[],
  requests: readonly RequestFacts[],
): Promise<Offer[]> {
  const now = deps.now();
  const ratings = await deps.ratings([...new Set(offers.map((offer) => offer.driverId))]);
  const views = await Promise.all(
    offers.map(async (offer): Promise<Offer | null> => {
      const request = requests.find((item) => item.id === offer.requestId);
      // The car kept in the offer: a new check of the driver hides nothing (docs/65 A1).
      const [driver, car] = [await deps.people.find(offer.driverId), offer.car];
      if (!request || !driver || !car) return null;
      const seats = offerSeats(offer, request);
      return {
        id: offer.id,
        requestId: offer.requestId,
        driver: {
          id: driver.publicId,
          firstName: driver.firstName,
          hasAvatar: driver.avatarShown,
          car: { make: car.make, model: car.model, color: car.color, plate: car.plate },
          rating: ratings.get(offer.driverId) ?? NO_RATING,
        },
        from: request.from,
        to: request.to,
        departAt: offer.departAt,
        km: request.km,
        seats,
        wholeCar: request.wholeCar,
        price: offer.price,
        commission: deps.wallet.commission(offer.price, seats),
        status: offerStatusAt(offer, request.open, now),
        bookingId: offer.bookingId,
        chatKey: chatKeyOfOffer(offer.id),
      };
    }),
  );
  return views.filter((view) => view !== null);
}

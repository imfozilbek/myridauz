import type { Offer } from '@platform/contracts';
import { offerStatusAt, type OfferRecord } from '../domain/offer';
import { offerChatKey } from '../domain/talk';
import { acceptedWith, offerBooking, offerView, type AcceptError } from './accept-steps';
import { acceptOnTrip } from './accept-on-trip';
import type { BookingsDeps, Result } from './ports';
import type { RequestFacts } from './request-facts';

type Found = { readonly offer: OfferRecord; readonly request: RequestFacts };

async function sentToMe(deps: BookingsDeps, passengerId: number, id: string): Promise<Found | AcceptError> {
  const offer = await deps.offers.find(id);
  const request = offer ? await deps.requests.find(offer.requestId) : undefined;
  if (!offer || request?.passengerId !== passengerId) return 'bookings.not_found';
  return offerStatusAt(offer, request.open, deps.now()) === 'sent'
    ? { offer, request }
    : 'bookings.wrong_status';
}

// The passenger accepts (docs/35): a confirmed booking at once and the commission taken now (docs/12),
// on the trip of the offer (G64) or on a new trip with all the car's seats (others see it).
export async function acceptOffer(
  deps: BookingsDeps,
  passengerId: number,
  id: string,
): Promise<Result<Offer, AcceptError>> {
  const found = await sentToMe(deps, passengerId, id);
  if (typeof found === 'string') return { ok: false, error: found };
  const { offer, request } = found;
  // The offer is taken in one step first: a second tap finds it accepted (docs/65 A4).
  const taken: OfferRecord = { ...offer, status: 'accepted' };
  if (!(await deps.offers.replace(taken, 'sent'))) return { ok: false, error: 'bookings.wrong_status' };
  const result = offer.tripId
    ? await acceptOnTrip(deps, offer, request, offer.tripId)
    : await acceptTaken(deps, offer, request);
  if (!result.ok) await deps.offers.replace(offer, 'accepted');
  return result;
}

async function acceptTaken(
  deps: BookingsDeps,
  offer: OfferRecord,
  request: RequestFacts,
): Promise<Result<Offer, AcceptError>> {
  const car = await deps.approvedCar(offer.driverId);
  const draft = await offerBooking(deps, offer, request, '', null);
  if (!car || !(await deps.wallet.canAfford(offer.driverId, draft.commission)))
    return { ok: false, error: 'wallet.not_enough' };
  const published = await deps.trips.publish(offer.driverId, {
    from: request.from,
    to: request.to,
    departAt: offer.departAt,
    seats: car.seats,
    price: offer.price,
    womanOnBoard: false,
    comment: '',
    // The trip of an offer is the passenger's request: seats as asked, or the whole car (docs/09).
    bookingRule: request.wholeCar ? 'car_only' : 'seats',
  });
  if (!published.ok) return { ok: false, error: 'bookings.wrong_status' };
  const trip = published.value;
  const booking = await offerBooking(deps, offer, request, trip.id, trip.pitak?.id ?? null);
  if ((await deps.wallet.charge(offer.driverId, booking.id, booking.commission)) !== 'ok') {
    await deps.trips.cancel(offer.driverId, trip.id);
    return { ok: false, error: 'wallet.not_enough' };
  }
  await deps.bookings.save(booking);
  return acceptedWith(deps, offer, request, booking);
}

export async function declineOffer(
  deps: BookingsDeps,
  passengerId: number,
  id: string,
): Promise<Result<Offer, AcceptError>> {
  const found = await sentToMe(deps, passengerId, id);
  if (typeof found === 'string') return { ok: false, error: found };
  const declined: OfferRecord = { ...found.offer, status: 'declined' };
  await deps.offers.save(declined);
  await deps.notify.offerAnswered(found.offer.driverId, false, {
    id: declined.id,
    chatKey: offerChatKey(declined),
  });
  return offerView(deps, declined, found.request);
}

import type { Offer } from '@platform/contracts';
import { offerStatusAt, type OfferRecord } from '../domain/offer';
import { offerChatKey } from '../domain/talk';
import { acceptedWith, offerBooking, offerView, walletShort, type AcceptError } from './accept-steps';
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

async function endTaken(deps: BookingsDeps, offer: OfferRecord): Promise<Result<Offer, AcceptError>> {
  await deps.offers.replace({ ...offer, status: 'expired' }, 'accepted');
  return { ok: false, error: 'bookings.wrong_status' };
}

async function acceptTaken(
  deps: BookingsDeps,
  offer: OfferRecord,
  request: RequestFacts,
): Promise<Result<Offer, AcceptError>> {
  const car = await deps.approvedCar(offer.driverId);
  // The car is not approved now (a new check, a block): the offer never will work (G89 B5).
  if (!car) return endTaken(deps, offer);
  const draft = await offerBooking(deps, offer, request, '', null);
  if (!(await deps.wallet.canAfford(offer.driverId, draft.commission)))
    return walletShort(deps, offer, draft);
  const published = await deps.trips.publish(
    offer.driverId,
    {
      from: request.from,
      to: request.to,
      departAt: offer.departAt,
      seats: car.seats,
      price: offer.price,
      womanOnBoard: false,
      comment: '',
      // The trip of an offer is the passenger's request: seats as asked, or the whole car (docs/09).
      bookingRule: request.wholeCar ? 'car_only' : 'seats',
    },
    request.id,
  );
  // A trip that cannot open now (another live trip of the driver, a price out of bounds) never will:
  // the offer ends instead of waiting for a tap that always fails (G89 B2).
  if (!published.ok) return endTaken(deps, offer);
  const trip = published.value;
  const booking = await offerBooking(deps, offer, request, trip.id, trip.pitak?.id ?? null);
  if ((await deps.wallet.charge(offer.driverId, booking.id, booking.commission)) !== 'ok') {
    await deps.trips.cancel(offer.driverId, trip.id);
    return walletShort(deps, offer, booking);
  }
  await deps.bookings.save(booking);
  // Quiet until now: a whole car is nobody's news; the free seats of a seats trip are, with the
  // booking already on it (G89 T12, B13).
  if (request.wholeCar) await deps.trips.release(trip.id);
  else await deps.trips.open(offer.driverId, trip.id);
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
  // One answer: an accept that came first wins (docs/65 A4, G89 U9).
  if (!(await deps.offers.replace(declined, 'sent'))) return { ok: false, error: 'bookings.wrong_status' };
  await deps.notify.offerAnswered(found.offer.driverId, false, {
    id: declined.id,
    chatKey: offerChatKey(declined),
    requestId: declined.requestId,
  });
  return offerView(deps, declined, found.request);
}

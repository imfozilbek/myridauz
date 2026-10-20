import type { Offer, Point } from '@platform/contracts';
import { NO_MARKS, type BookingRecord, type Named } from '../domain/booking';
import { offerSeats, type OfferRecord } from '../domain/offer';
import { offerChatKey } from '../domain/talk';
import { offerViews } from './offer-views';
import { endOffers } from './offers-ended';
import type { BookingsDeps, Result } from './ports';
import type { RequestFacts } from './request-facts';
import { bookingViews } from './views';

export type AcceptError =
  | 'bookings.not_found'
  | 'bookings.wrong_status'
  | 'bookings.no_seats'
  | 'bookings.departed'
  | 'bookings.offer_unavailable';

// The driver of the offer is short of money for the commission (G89 B5, U8): the passenger reads
// the offer does not work now, the driver hears what is missing; the offer waits for the top up.
export async function walletShort(
  deps: BookingsDeps,
  offer: OfferRecord,
  booking: Pick<BookingRecord, 'commission'>,
): Promise<Result<Offer, AcceptError>> {
  await deps.notify.walletShort(offer.driverId, booking.commission);
  return { ok: false, error: 'bookings.offer_unavailable' };
}

export async function offerView(
  deps: BookingsDeps,
  offer: OfferRecord,
  request: RequestFacts,
): Promise<Result<Offer, AcceptError>> {
  const [shown] = await offerViews(deps, [offer], [request], 'passenger');
  return shown ? { ok: true, value: shown } : { ok: false, error: 'bookings.not_found' };
}

// The way and the points of the request become the booking's (docs/70): «Pitakdan» when the
// passenger chose only the pitak, else the door with the point.
async function offerPoints(deps: BookingsDeps, request: RequestFacts, pitakId: string | null) {
  const describe = async (point: Point | null): Promise<Named | null> => {
    if (!point) return null;
    const { name, area } = await deps.places.describe(point);
    return { name, area };
  };
  const byPitak = request.pickupMode === 'pitak' || !request.pickup;
  const pickup = byPitak ? null : request.pickup;
  return {
    mode: byPitak ? ('pitak' as const) : ('door' as const),
    pitakId: byPitak ? pitakId : null,
    pickup,
    pickupNamed: await describe(pickup),
    dropoff: request.dropoff,
    dropoffNamed: await describe(request.dropoff),
    note: request.note,
  };
}

// The confirmed booking of an accepted offer, on its trip (docs/35): the seats and the marks of the
// request, the price of the offer, the chat of the talk (G64).
export async function offerBooking(
  deps: BookingsDeps,
  offer: OfferRecord,
  request: RequestFacts,
  tripId: string,
  pitakId: string | null,
): Promise<BookingRecord> {
  const now = deps.now();
  const seats = offerSeats(offer, request);
  return {
    id: deps.newId(),
    tripId,
    passengerId: request.passengerId,
    seats,
    wholeCar: request.wholeCar,
    withWoman: request.withWoman,
    price: offer.price,
    commission: deps.wallet.commission(offer.price, seats),
    status: 'confirmed',
    expiresAt: offer.departAt,
    ...(await offerPoints(deps, request, pitakId)),
    offerId: offer.id,
    talkId: offer.talkId,
    // Accepting an offer confirms the seat at once (docs/88 L6).
    confirmedAt: now,
    boardedAt: null,
    arrivedAt: null,
    cameAt: null,
    ...NO_MARKS,
    createdAt: now,
    updatedAt: now,
  };
}

// The booking is in: the offer is taken, the request closed, both sides hear it (docs/35).
export async function acceptedWith(
  deps: BookingsDeps,
  offer: OfferRecord,
  request: RequestFacts,
  booking: BookingRecord,
): Promise<Result<Offer, AcceptError>> {
  const accepted: OfferRecord = { ...offer, status: 'accepted', bookingId: booking.id };
  await deps.offers.save(accepted);
  await deps.requests.matched(request.id);
  await endOffers(deps, request.id);
  const answered = { id: offer.id, chatKey: offerChatKey(offer), requestId: offer.requestId };
  await deps.notify.offerAnswered(offer.driverId, true, answered, { id: booking.id, tripId: booking.tripId });
  const [forPassenger] = await bookingViews(deps, [booking], 'passenger');
  if (forPassenger) await deps.notify.confirmed(forPassenger, 'passenger');
  return offerView(deps, accepted, { ...request, open: false });
}

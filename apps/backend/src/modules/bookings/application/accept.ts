import type { Offer, Point } from '@platform/contracts';
import type { BookingRecord, Named } from '../domain/booking';
import { offerSeats, offerStatusAt, type OfferRecord } from '../domain/offer';
import { offerViews } from './offer-views';
import type { BookingsDeps, Result } from './ports';
import type { RequestFacts } from './request-facts';
import { bookingViews } from './views';

type AcceptError = 'bookings.not_found' | 'bookings.wrong_status' | 'wallet.not_enough';
type Found = { readonly offer: OfferRecord; readonly request: RequestFacts };

async function sentToMe(deps: BookingsDeps, passengerId: number, id: string): Promise<Found | AcceptError> {
  const offer = await deps.offers.find(id);
  const request = offer ? await deps.requests.find(offer.requestId) : undefined;
  if (!offer || request?.passengerId !== passengerId) return 'bookings.not_found';
  return offerStatusAt(offer, request.open, deps.now()) === 'sent'
    ? { offer, request }
    : 'bookings.wrong_status';
}

async function view(
  deps: BookingsDeps,
  offer: OfferRecord,
  request: RequestFacts,
): Promise<Result<Offer, AcceptError>> {
  const [shown] = await offerViews(deps, [offer], [request]);
  return shown ? { ok: true, value: shown } : { ok: false, error: 'bookings.not_found' };
}

// The passenger accepts (docs/35): the driver gets a trip with all the car's seats (others see it),
// the passenger's seats are booked and confirmed, the commission is taken now (docs/12).
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
  const result = await acceptTaken(deps, passengerId, offer, request);
  if (!result.ok) await deps.offers.replace(offer, 'accepted');
  return result;
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
  };
}

async function acceptTaken(
  deps: BookingsDeps,
  passengerId: number,
  offer: OfferRecord,
  request: RequestFacts,
): Promise<Result<Offer, AcceptError>> {
  const seats = offerSeats(offer, request);
  const commission = deps.wallet.commission(offer.price, seats);
  const car = await deps.approvedCar(offer.driverId);
  if (!car || !(await deps.wallet.canAfford(offer.driverId, commission)))
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
  const now = deps.now();
  const booking: BookingRecord = {
    id: deps.newId(),
    tripId: published.value.id,
    passengerId,
    seats,
    wholeCar: request.wholeCar,
    withWoman: request.withWoman,
    price: offer.price,
    commission,
    status: 'confirmed',
    expiresAt: offer.departAt,
    ...(await offerPoints(deps, request, published.value.pitak?.id ?? null)),
    offerId: offer.id,
    // Accepting an offer confirms the seat at once (docs/88 L6).
    confirmedAt: now,
    boardedAt: null,
    arrivedAt: null,
    cameAt: null,
    createdAt: now,
    updatedAt: now,
  };
  if ((await deps.wallet.charge(offer.driverId, booking.id, commission)) !== 'ok') {
    await deps.trips.cancel(offer.driverId, published.value.id);
    return { ok: false, error: 'wallet.not_enough' };
  }
  await deps.bookings.save(booking);
  const accepted: OfferRecord = { ...offer, status: 'accepted', bookingId: booking.id };
  await deps.offers.save(accepted);
  await deps.requests.matched(request.id);
  await deps.notify.offerAnswered(offer.driverId, true, offer.id);
  const [forPassenger] = await bookingViews(deps, [booking], 'passenger');
  if (forPassenger) await deps.notify.confirmed(forPassenger);
  return view(deps, accepted, { ...request, open: false });
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
  await deps.notify.offerAnswered(found.offer.driverId, false, found.offer.id);
  return view(deps, declined, found.request);
}

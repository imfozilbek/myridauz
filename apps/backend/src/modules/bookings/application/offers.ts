import type { Offer, OfferInput } from '@platform/contracts';
import { offerStatusAt, type OfferRecord } from '../domain/offer';
import { newTripPlan, ownTripPlan, type PlanError } from './offer-plan';
import { offerViews } from './offer-views';
import type { BookingsDeps, Result } from './ports';
import { talkOf } from './talks';

export type OfferError =
  PlanError | 'bookings.own_trip' | 'bookings.wrong_status' | 'trips.not_driver' | 'wallet.not_enough';

const LIVE_FIRST: Record<Offer['status'], number> = { sent: 0, accepted: 1, declined: 2, expired: 2 };

// A driver offers a time and a price on a request (docs/09, docs/35), or a seat of a trip of theirs
// (G64). Only with money for the commission: an accepted offer is charged at once (docs/35). The offer
// lives in the talk of the pair: the same chat as the messages before it (G64).
export async function sendOffer(
  deps: BookingsDeps,
  driverId: number,
  requestId: string,
  input: OfferInput,
): Promise<Result<Offer, OfferError>> {
  const now = deps.now();
  const [car, request] = await Promise.all([deps.approvedCar(driverId), deps.requests.find(requestId)]);
  if (!car) return { ok: false, error: 'trips.not_driver' };
  if (!request?.open) return { ok: false, error: 'bookings.not_found' };
  if (request.passengerId === driverId) return { ok: false, error: 'bookings.own_trip' };
  if (request.seats > car.seats) return { ok: false, error: 'bookings.no_seats' };
  const plan = input.tripId
    ? await ownTripPlan(deps, driverId, request, input.tripId)
    : await newTripPlan(deps, driverId, request, input, car);
  if (!plan.ok) return plan;
  const { departAt, price, seats } = plan.value;
  if (!(await deps.wallet.canAfford(driverId, deps.wallet.commission(price, seats))))
    return { ok: false, error: 'wallet.not_enough' };
  const sent = await deps.offers.byRequests([requestId]);
  if (sent.some((offer) => offer.driverId === driverId && offerStatusAt(offer, request.open, now) === 'sent'))
    return { ok: false, error: 'bookings.wrong_status' };
  const talk = await talkOf(deps, request, driverId);
  const offer: OfferRecord = {
    id: deps.newId(),
    requestId,
    driverId,
    departAt,
    price,
    seats,
    car: { make: car.make, model: car.model, color: car.color, plate: car.plate },
    status: 'sent',
    bookingId: null,
    talkId: talk.id,
    tripId: input.tripId ?? null,
    createdAt: now,
  };
  await deps.offers.save(offer);
  const [view] = await offerViews(deps, [offer], [request]);
  if (!view) return { ok: false, error: 'bookings.not_found' };
  await deps.notify.offered(view);
  return { ok: true, value: view };
}

export async function passengerOffers(deps: BookingsDeps, passengerId: number): Promise<Offer[]> {
  const requests = await deps.requests.ofPassenger(passengerId);
  const offers = await deps.offers.byRequests(requests.map((request) => request.id));
  return offerViews(
    deps,
    [...offers].sort((a, b) => b.createdAt - a.createdAt),
    requests,
  );
}

export async function driverOffers(deps: BookingsDeps, driverId: number): Promise<Offer[]> {
  const offers = await deps.offers.byDriver(driverId);
  const requests = await Promise.all(
    [...new Set(offers.map((offer) => offer.requestId))].map(deps.requests.find),
  );
  const known = requests.filter((request) => request !== undefined);
  const views = await offerViews(
    deps,
    [...offers].sort((a, b) => b.createdAt - a.createdAt),
    known,
  );
  // What still waits for an answer comes first, then what was taken, the closed ones last; the
  // newest first inside each (G41, docs/90 F-D10).
  return views.sort((a, b) => LIVE_FIRST[a.status] - LIVE_FIRST[b.status]);
}

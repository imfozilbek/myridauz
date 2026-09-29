import { tashkentDate, type Offer, type OfferInput } from '@platform/contracts';
import { offerStatusAt, type OfferRecord } from '../domain/offer';
import { offerViews } from './offer-views';
import type { BookingsDeps, Result } from './ports';

type OfferError =
  | 'bookings.not_found'
  | 'bookings.own_trip'
  | 'bookings.no_seats'
  | 'bookings.invalid_input'
  | 'bookings.wrong_status'
  | 'trips.not_driver'
  | 'trips.price_out_of_bounds'
  | 'wallet.not_enough';

// A driver offers a time on the request's day and a price within the bounds (docs/09, docs/35).
// Only with money for the commission: an accepted offer is charged at once (docs/35).
export async function sendOffer(
  deps: BookingsDeps,
  driverId: number,
  requestId: string,
  input: Required<OfferInput>,
): Promise<Result<Offer, OfferError>> {
  const now = deps.now();
  const [car, request] = await Promise.all([deps.approvedCar(driverId), deps.requests.find(requestId)]);
  if (!car) return { ok: false, error: 'trips.not_driver' };
  if (!request?.open) return { ok: false, error: 'bookings.not_found' };
  if (request.passengerId === driverId) return { ok: false, error: 'bookings.own_trip' };
  if (request.seats > car.seats) return { ok: false, error: 'bookings.no_seats' };
  if (input.departAt <= now || tashkentDate(input.departAt) !== request.date)
    return { ok: false, error: 'bookings.invalid_input' };
  const recommendation = await deps.recommend(request.from, request.to);
  if (!recommendation.ok) return { ok: false, error: 'bookings.not_found' };
  const { minPrice, maxPrice } = recommendation.value;
  if (input.price < minPrice || input.price > maxPrice) return { ok: false, error: 'trips.price_out_of_bounds' };
  if (!(await deps.wallet.canAfford(driverId, deps.wallet.commission(input.price, request.seats))))
    return { ok: false, error: 'wallet.not_enough' };
  const sent = await deps.offers.byRequests([requestId]);
  if (sent.some((offer) => offer.driverId === driverId && offerStatusAt(offer, request.open, now) === 'sent'))
    return { ok: false, error: 'bookings.wrong_status' };
  const offer: OfferRecord = { id: deps.newId(), requestId, driverId, ...input, status: 'sent', bookingId: null, createdAt: now };
  await deps.offers.save(offer);
  await deps.notify.offered(request.passengerId);
  const [view] = await offerViews(deps, [offer], [request]);
  return view ? { ok: true, value: view } : { ok: false, error: 'bookings.not_found' };
}

export async function passengerOffers(deps: BookingsDeps, passengerId: number): Promise<Offer[]> {
  const requests = await deps.requests.ofPassenger(passengerId);
  const offers = await deps.offers.byRequests(requests.map((request) => request.id));
  return offerViews(deps, [...offers].sort((a, b) => b.createdAt - a.createdAt), requests);
}

export async function driverOffers(deps: BookingsDeps, driverId: number): Promise<Offer[]> {
  const offers = await deps.offers.byDriver(driverId);
  const requests = await Promise.all([...new Set(offers.map((offer) => offer.requestId))].map(deps.requests.find));
  const known = requests.filter((request) => request !== undefined);
  return offerViews(deps, [...offers].sort((a, b) => b.createdAt - a.createdAt), known);
}

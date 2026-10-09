import { tashkentDate, type Offer, type Trip } from '@platform/contracts';
import { offerStatusAt } from '../domain/offer';
import { sendOffer, type OfferError } from './offers';
import type { BookingsDeps, Result } from './ports';

// The errors of publishing that reach the driver as they are (docs/103, docs/70); any other one
// means the request or the car changed meanwhile.
const TRIP_ERRORS = [
  'trips.price_out_of_bounds',
  'trips.too_soon',
  'trips.too_many',
  'trips.busy',
  'trips.no_pitak',
  'trips.in_past',
] as const;
type TripError = (typeof TRIP_ERRORS)[number];
const tripError = (error: string): TripError | 'bookings.wrong_status' =>
  TRIP_ERRORS.find((known) => known === error) ?? 'bookings.wrong_status';

// «Safar ochib taklif qilish» (G64, docs/118 path 7): a «Boʻsh salon kerak» request without a fitting
// trip. One window filled from the request: its direction, day, way and price; every seat of the car
// as the whole car; the driver picks the time. Only this passenger sees the trip until the answer.
export async function offerSalonTrip(
  deps: BookingsDeps,
  driverId: number,
  requestId: string,
  departAt: number,
): Promise<Result<{ readonly trip: Trip; readonly offer: Offer }, OfferError | TripError>> {
  const [car, request] = await Promise.all([deps.approvedCar(driverId), deps.requests.find(requestId)]);
  if (!car) return { ok: false, error: 'trips.not_driver' };
  if (!request?.open) return { ok: false, error: 'bookings.not_found' };
  if (request.passengerId === driverId) return { ok: false, error: 'bookings.own_trip' };
  if (!request.wholeCar || tashkentDate(departAt) !== request.date)
    return { ok: false, error: 'bookings.invalid_input' };
  if (request.seats > car.seats) return { ok: false, error: 'bookings.no_seats' };
  if (!(await deps.wallet.canAfford(driverId, deps.wallet.commission(request.price, car.seats))))
    return { ok: false, error: 'wallet.not_enough' };
  const sent = await deps.offers.byRequests([requestId]);
  if (sent.some((offer) => offer.driverId === driverId && offerStatusAt(offer, true, deps.now()) === 'sent'))
    return { ok: false, error: 'bookings.wrong_status' };
  const input = { from: request.from, to: request.to, departAt, seats: car.seats, price: request.price };
  const marks = { womanOnBoard: false, comment: '', bookingRule: 'car_only' as const };
  const published = await deps.trips.publishPrivate(
    driverId,
    { ...input, ...marks, pickupMode: request.pickupMode },
    requestId,
  );
  if (!published.ok) return { ok: false, error: tripError(published.error) };
  const trip = published.value;
  const offer = await sendOffer(deps, driverId, requestId, {
    departAt,
    price: request.price,
    tripId: trip.id,
  });
  if (!offer.ok) {
    await deps.trips.cancel(driverId, trip.id);
    return offer;
  }
  return { ok: true, value: { trip, offer: offer.value } };
}

// The passenger said no or did not answer (G64): the driver opens the trip for everybody. Not while
// the offer still waits: the passenger was promised the trip is theirs until the answer.
export async function openSalonTrip(
  deps: BookingsDeps,
  driverId: number,
  tripId: string,
): Promise<Result<Trip, 'bookings.wrong_status' | 'trips.not_found'>> {
  const offers = (await deps.offers.byDriver(driverId)).filter((offer) => offer.tripId === tripId);
  const requests = await Promise.all(offers.map((offer) => deps.requests.find(offer.requestId)));
  const waits = offers.some(
    (offer, index) => offerStatusAt(offer, requests[index]?.open ?? false, deps.now()) === 'sent',
  );
  if (waits) return { ok: false, error: 'bookings.wrong_status' };
  const opened = await deps.trips.open(driverId, tripId);
  return opened.ok ? opened : { ok: false, error: 'trips.not_found' };
}

// The driver cancelled the trip of an offer that still waits (G64): the passenger sees it is over.
export async function expireTripOffers(deps: BookingsDeps, driverId: number, tripId: string): Promise<void> {
  const waiting = (await deps.offers.byDriver(driverId)).filter(
    (offer) => offer.tripId === tripId && offer.status === 'sent',
  );
  for (const offer of waiting) await deps.offers.save({ ...offer, status: 'expired' });
}

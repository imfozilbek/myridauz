import {
  arrivalAt,
  DAY_MS,
  HOUR_MS,
  meetingStartsAt,
  tripEndsAt,
  type Booking,
  type Offer,
  type RideRequest,
  type Trip,
} from '@platform/contracts';
import { endedBadly } from '../../bookings/booking-banner';
import { waitingOffers } from '../home-items';
import { inCar } from '../../bookings/in-car';

// What the block at the bottom of a passenger shows (G76, docs/165, mockup g76/2): one thing, the
// most important by its level (1 the most). Levels as in docs/165: 1 someone waits at the point,
// 3 the meeting, 4 an answer is needed, 5 on the road, 6 the next seat, 7 waiting, 8 ended,
// 9 a suggestion, 10 free.
export type PassengerState =
  | { readonly kind: 'driverWaits' | 'meeting' | 'onRoad' | 'arrivedAsk'; readonly booking: Booking }
  | {
      readonly kind: 'moved' | 'confirmed' | 'asked' | 'refused' | 'noShow' | 'ended';
      readonly booking: Booking;
    }
  | { readonly kind: 'offers'; readonly request: RideRequest; readonly offers: readonly Offer[] }
  | { readonly kind: 'request'; readonly request: RideRequest }
  | { readonly kind: 'favorite'; readonly trip: Trip }
  | { readonly kind: 'idle' };

export const PASSENGER_LEVEL: Record<PassengerState['kind'], number> = {
  driverWaits: 1,
  meeting: 3,
  offers: 4,
  moved: 4,
  arrivedAsk: 4,
  onRoad: 5,
  confirmed: 6,
  asked: 7,
  request: 7,
  ended: 8,
  refused: 8,
  noShow: 8,
  favorite: 9,
  idle: 10,
};

// What the person told on this phone: «Roziman» to a moved time, «Hali yoʻldaman» to the question.
export type PassengerMarks = {
  readonly agreed: ReadonlySet<string>;
  readonly stillOnWay: ReadonlySet<string>;
};

type Lists = {
  readonly bookings: readonly Booking[];
  readonly requests: readonly RideRequest[];
  readonly offers: readonly Offer[];
  // A trip of a saved driver not shown yet (docs/129), null when none.
  readonly favorite: Trip | null;
};

const RATE_DAYS = 7;
const ASK_ARRIVED_AFTER_MS = HOUR_MS;
const atPoint = (booking: Booking) =>
  booking.boardedAt === null && booking.metAt === null && booking.noShowAt === null;

// The state of one seat, or null when it says nothing now.
function seatState(
  booking: Booking,
  now: number,
  meet: number,
  marks: PassengerMarks,
): PassengerState | null {
  const { trip } = booking;
  const of = <K extends PassengerState['kind']>(kind: K) => ({ kind, booking }) as PassengerState;
  if (booking.status === 'completed') {
    const fresh = now - trip.departAt < RATE_DAYS * DAY_MS;
    return fresh && booking.rated !== true && booking.noShowAt === null ? of('ended') : null;
  }
  if (endedBadly(booking.status))
    return booking.status !== 'cancelled_by_passenger' && trip.departAt > now ? of('refused') : null;
  if (booking.noShowAt !== null) return now < tripEndsAt(trip.departAt, trip.km) ? of('noShow') : null;
  if (booking.status === 'requested') return of('asked');
  if (booking.arrivedAt !== null) return null;
  if (inCar(booking, now, meet)) {
    const late = now >= arrivalAt(trip.departAt, trip.km) + ASK_ARRIVED_AFTER_MS;
    return late && !marks.stillOnWay.has(booking.id) ? of('arrivedAsk') : of('onRoad');
  }
  if (trip.firstDepartAt !== trip.departAt && !marks.agreed.has(booking.id) && now < trip.departAt)
    return of('moved');
  if (now >= meetingStartsAt(trip.departAt, meet) && atPoint(booking))
    return booking.driverCameAt !== null && booking.cameAt === null ? of('driverWaits') : of('meeting');
  return now < tripEndsAt(trip.departAt, trip.km) ? of('confirmed') : null;
}

const departureOf = (state: PassengerState) =>
  'booking' in state ? state.booking.trip.departAt : 'trip' in state ? state.trip.departAt : Infinity;

// Every state there is, the most important first; the block shows the first one, the tile counts
// the rest (docs/165).
export function passengerStates(
  lists: Lists,
  now: number,
  meet: number,
  marks: PassengerMarks,
): PassengerState[] {
  const seats = lists.bookings.flatMap((booking) => seatState(booking, now, meet, marks) ?? []);
  const waiting = waitingOffers(lists.requests, lists.offers);
  const open = lists.requests.filter((request) => request.status === 'open');
  const requests = open.map((request): PassengerState => {
    const offers = waiting.filter((offer) => offer.requestId === request.id);
    return offers.length > 0 ? { kind: 'offers', request, offers } : { kind: 'request', request };
  });
  const favorite: PassengerState[] = lists.favorite ? [{ kind: 'favorite', trip: lists.favorite }] : [];
  const all = [...seats, ...requests, ...favorite];
  return all.sort(
    (a, b) => PASSENGER_LEVEL[a.kind] - PASSENGER_LEVEL[b.kind] || departureOf(a) - departureOf(b),
  );
}

export const passengerState = (states: readonly PassengerState[]): PassengerState =>
  states[0] ?? { kind: 'idle' };

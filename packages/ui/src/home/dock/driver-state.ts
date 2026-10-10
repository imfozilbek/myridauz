import {
  DAY_MS,
  DEPART_REMIND_MS,
  meetingStartsAt,
  type Booking,
  type DriverApplication,
  type Trip,
  type Wallet,
} from '@platform/contracts';
import { tripPast, tripStep } from '../../own-trip/trip-stage';

// What the block at the bottom of a driver shows (G76, docs/165, mockup g76/3), by the levels of
// docs/165: 1 a passenger waits at the point, 2 money or a fix, 3 the departure or the point, 4 the
// requests, 5 on the road, 6 the next trip or an offer taken, 8 ended, 9 a suggestion, 10 free.
export type DriverState =
  | { readonly kind: 'draft' | 'pending' | 'fix' | 'welcome' | 'idle' | 'low' }
  | { readonly kind: 'short'; readonly missing: number; readonly requests: readonly Booking[] }
  | { readonly kind: 'requests'; readonly trip: Trip; readonly requests: readonly Booking[] }
  | {
      readonly kind: 'passengerWaits' | 'atPoint' | 'accepted';
      readonly trip: Trip;
      readonly booking: Booking;
    }
  | { readonly kind: 'depart' | 'departAsk' | 'onRoad' | 'published' | 'ended'; readonly trip: Trip };

export const DRIVER_LEVEL: Record<DriverState['kind'], number> = {
  draft: 2,
  fix: 2,
  pending: 7,
  passengerWaits: 1,
  short: 2,
  departAsk: 3,
  depart: 3,
  atPoint: 3,
  requests: 4,
  onRoad: 5,
  accepted: 6,
  published: 6,
  welcome: 6,
  ended: 8,
  low: 9,
  idle: 10,
};

type Lists = {
  readonly status: DriverApplication['status'];
  // The first visit after the approval (G62): «Siz haydovchisiz!» with the bonus.
  readonly welcome: boolean;
  readonly trips: readonly Trip[];
  readonly bookings: readonly Booking[];
  readonly wallet: Wallet | null;
  // Fewer seats than this: «Hamyon kam» (the brand, docs/12).
  readonly fewSeats: number;
  // The bookings of accepted offers not seen yet on this phone.
  readonly unseen: ReadonlySet<string>;
};

const RATE_DAYS = 7;
const own = (trip: Trip, bookings: readonly Booking[]) =>
  bookings.filter((booking) => booking.trip.id === trip.id);
const atPoint = (booking: Booking) =>
  booking.status === 'confirmed' &&
  booking.boardedAt === null &&
  booking.metAt === null &&
  booking.noShowAt === null;

// The states of one trip of the driver, the most important first.
function tripStates(trip: Trip, lists: Lists, now: number, meet: number): DriverState[] {
  const people = own(trip, lists.bookings);
  if (tripPast(trip)) {
    const fresh = now - trip.departAt < RATE_DAYS * DAY_MS;
    const unrated = people.some(
      (one) => one.status === 'completed' && one.rated !== true && one.noShowAt === null,
    );
    return fresh && unrated ? [{ kind: 'ended', trip }] : [];
  }
  if (trip.status === 'cancelled') return [];
  if (trip.departedAt !== null) return [{ kind: 'onRoad', trip }];
  const states: DriverState[] = [];
  const meeting = now >= meetingStartsAt(trip.departAt, meet);
  for (const booking of people.filter(atPoint)) {
    if (meeting && booking.cameAt !== null && booking.driverCameAt === null)
      states.push({ kind: 'passengerWaits', trip, booking });
    else if (meeting && booking.driverCameAt !== null) states.push({ kind: 'atPoint', trip, booking });
  }
  if (tripStep(trip, now) === 'departed')
    states.push({ kind: now >= trip.departAt + DEPART_REMIND_MS ? 'departAsk' : 'depart', trip });
  const requests = people.filter((one) => one.status === 'requested');
  if (requests.length > 0) states.push({ kind: 'requests', trip, requests });
  for (const booking of people.filter((one) => lists.unseen.has(one.id)))
    states.push({ kind: 'accepted', trip, booking });
  states.push({ kind: 'published', trip });
  return states;
}

// What the wallet lacks for the first waiting request (docs/12).
const lacks = (wallet: Wallet | null, requests: readonly Booking[]) => {
  const [first] = requests;
  return wallet && first ? Math.max(0, first.commission - wallet.bonus - wallet.main) : 0;
};

// Every state there is, the most important first; the block shows the first one (docs/165).
export function driverStates(lists: Lists, now: number, meet: number): DriverState[] {
  if (lists.status === 'draft') return [{ kind: 'draft' }];
  if (lists.status === 'changes_requested') return [{ kind: 'fix' }];
  if (lists.status !== 'approved') return [{ kind: 'pending' }];
  const live = [...lists.trips].sort((a, b) => a.departAt - b.departAt);
  const states = live.flatMap((trip) => tripStates(trip, lists, now, meet));
  const requests = states.flatMap((state) => (state.kind === 'requests' ? state.requests : []));
  const missing = lacks(lists.wallet, requests);
  if (missing > 0) states.push({ kind: 'short', missing, requests });
  if (lists.welcome) states.push({ kind: 'welcome' });
  const seats = lists.wallet?.seatsLeft ?? null;
  if (seats !== null && seats < lists.fewSeats) states.push({ kind: 'low' });
  const sorted = states.sort((a, b) => DRIVER_LEVEL[a.kind] - DRIVER_LEVEL[b.kind]);
  return sorted.length > 0 ? sorted : [{ kind: 'idle' }];
}

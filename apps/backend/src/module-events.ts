import { NO_RATING } from '@platform/contracts';
import {
  cancelAllOf,
  chatRing,
  driverBookingOf,
  passengerRideCount,
  filedRideOfBooking,
  ratableRideOfBooking,
  rideOfBooking,
  ridesOfTrips,
  tellRequest,
  tellRequestClosed,
  walletBookingsOf,
} from './modules/bookings';
import { wireChatRings } from './modules/chat';
import { hiddenByComplaints, waitingComplaints, wireComplaints } from './modules/complaints';
import { assignTo, waitingSupport } from './modules/assignments';
import { inviteFromMark } from './modules/channels';
import { approvedCar, waitingApplications, wireLiveTrips } from './modules/drivers';
import { wireFavorites } from './modules/favorites';
import {
  handleRequestChanged,
  handleRequestPublished,
  requestViewOf,
  wireHiddenRequesters,
} from './modules/ride-requests';
import { wireRealPrices } from './modules/pricing';
import { requestPublished } from './modules/route-subscriptions';
import { ratingsOfPeople, wireRatings } from './modules/ratings';
import {
  driverTripIds,
  hasLiveTrips,
  lastTripPrice,
  tripsEnded,
  realPricesSince,
  upcomingTripsOf,
  wireTripStanding,
} from './modules/trips';
import { wireTeamQueue } from './modules/team-queue';
import { peopleOf, waitingFaces, wireFaceTeam, wireRegistered } from './modules/users';
import { refundNoShow, wireWalletLinks } from './modules/wallet';

// What one module does after another: set here, the one place that knows every module, so the
// modules do not depend on each other in circles. The trips and their channel posts: trip-events.ts.
export { closeDepartedPosts, sendChannelSummaries, showChannelBoards } from './trip-events';

// A new face goes to the member who gets the person's application that day (docs/92, G51); a new
// person who came by a channel post hears of the channel of that zone (docs/119).
wireFaceTeam((env, userId) => assignTo(env, 'application', userId));
wireRegistered((env) => (userId, came) => inviteFromMark(env, userId, came?.via));

// A message or a call about a seat rings under its trip card in the bot (G68, docs/122 rule 5).
wireChatRings(chatRing);

// The admin price table shows the median of real prices (G18, docs/09).
wireRealPrices(realPricesSince);

// "Sevimli haydovchilar" (G18): an approved driver as passengers see one, and the driver's trips.
wireFavorites({
  driver: async (env, id) => {
    const [person, car, ratings] = await Promise.all([
      peopleOf(env).find(id),
      approvedCar(env, id),
      ratingsOfPeople(env, [id]),
    ]);
    if (!person || !car) return undefined;
    const { firstName, avatarShown } = person;
    const rating = ratings.get(id) ?? NO_RATING;
    return {
      id: person.publicId,
      firstName,
      hasAvatar: avatarShown,
      car: { make: car.make, model: car.model, color: car.color },
      rating,
    };
  },
  upcoming: upcomingTripsOf,
});

// A published request reaches subscribed drivers (docs/24).
handleRequestPublished(async (env, requestId) => {
  // Its own card waits quietly on top of the passenger bot (G68, docs/122).
  await tellRequest(env, requestId);
  const request = await requestViewOf(env, requestId);
  if (request) await requestPublished(env, request);
});
// A request cancelled or burned: its card says so (G68), the drivers who offered hear it (G75).
handleRequestChanged(tellRequestClosed);

// The ratings ask about rides of ended trips and show first names only (docs/24); a passenger
// who did not come is neither rated nor rates (docs/129, G63).
wireRatings({
  ended: async (env, from, to) => ridesOfTrips(env, await tripsEnded(env, from, to)),
  ride: ratableRideOfBooking,
  names: async (env, ids) => {
    const people = peopleOf(env);
    const found = await Promise.all(
      ids.map(async (id) => [id, (await people.find(id))?.firstName ?? ''] as const),
    );
    return new Map(found);
  },
});

// Trips show the driver's rating; complaints hide a person from the search (docs/17, docs/24).
wireTripStanding((env) => ({
  ratings: (ids) => ratingsOfPeople(env, ids),
  hidden: (ids) => hiddenByComplaints(env, ids),
}));
wireHiddenRequesters(hiddenByComplaints);

// «Hamyon» names the passenger and seats of its rows, opens the booking behind a commission and
// counts the seats left at the price of the last trip (G63, G65).
wireWalletLinks({ bookings: walletBookingsOf, booking: driverBookingOf, lastPrice: lastTripPrice });

// Complaints are about rides; a block cancels live trips and bookings; a no-show may give the
// commission back once the owner confirms (docs/17, docs/35).
wireComplaints({
  ride: rideOfBooking,
  filedRide: filedRideOfBooking,
  trips: async (env, userId, side) =>
    side === 'driver' ? (await driverTripIds(env, userId)).length : passengerRideCount(env, userId),
  cancelAll: cancelAllOf,
  refund: refundNoShow,
});

// «Navbat» of the team reads its cases from the modules that hold them (G68, docs/122).
wireTeamQueue(async (env) => {
  const [applications, complaints, faces, support] = await Promise.all([
    waitingApplications(env),
    waitingComplaints(env),
    waitingFaces(env),
    waitingSupport(env),
  ]);
  return [
    ...applications.map(({ publicId, name, submittedAt, car }) => ({
      kind: 'application' as const,
      id: publicId,
      name,
      since: submittedAt,
      car,
    })),
    ...complaints.map((item) => ({ kind: 'complaint' as const, ...item })),
    ...faces.map((item) => ({ kind: 'face' as const, ...item })),
    ...support.map((item) => ({ kind: 'support' as const, ...item })),
  ];
});

// One car at the launch: an approved driver changes it only without live trips (G75, docs/124 Ё).
wireLiveTrips(hasLiveTrips);

import { loadBrand } from '@platform/brands';
import { tashkentDate, type Trip } from '@platform/contracts';
import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import { showCards } from '../notifications';
import { showBoards, type BoardDeps } from './application/board';
import { allChannels } from './application/team';
import { channelsOf } from './domain/route-channels';
import { boardCard } from './infrastructure/board-text';
import { teamDeps } from './team-deps';

// The trips the boards show: set by the app, so channels does not depend on trips (app.ts).
type TripOf = (env: Bindings, id: string) => Promise<Trip | undefined>;
type TripsOfDate = (env: Bindings, date: string) => Promise<readonly Trip[]>;

function boardDeps(env: Bindings, tripsOf: TripsOfDate): BoardDeps {
  const brand = loadBrand(env.BRAND);
  const pageOf = (username: string) => brand.channels.find((zone) => zone.username === username)?.page;
  return {
    enabled: env.CHANNEL_POSTS === 'on',
    channels: async () => allChannels(await teamDeps(env)),
    places: () => placesOf(env),
    tripsOf: (date) => tripsOf(env, date),
    card: boardCard({ bot: brand.bots.passenger, domain: brand.domain, pageOf }),
    show: (cards) => showCards(env, cards),
    now: () => Date.now(),
  };
}

// The boards of the day (G68, docs/122): the Cron keeps all of them fresh; a trip of today that
// changed redraws the boards of its channels at once.
export const channelBoards = (tripOf: TripOf, tripsOf: TripsOfDate) => ({
  all: (env: Bindings) => showBoards(boardDeps(env, tripsOf)),
  ofTrip: async (env: Bindings, tripId: string) => {
    const trip = await tripOf(env, tripId);
    if (!trip || tashkentDate(trip.departAt) !== tashkentDate(Date.now())) return;
    const deps = boardDeps(env, tripsOf);
    const [places, list] = await Promise.all([deps.places(), deps.channels()]);
    await showBoards(deps, channelsOf(trip.from, trip.to, places, list));
  },
});

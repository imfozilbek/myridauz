import { tashkentDate, type Trip } from '@platform/contracts';
import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import { showCards } from '../notifications';
import { showBoards, type BoardDeps } from './application/board';
import { sendSummaries } from './application/summaries';
import { allChannels } from './application/team';
import { channelsOf } from './domain/route-channels';
import { boardCard } from './infrastructure/board-text';
import { dayCard, weekCard } from './infrastructure/summary-text';
import { teamDeps } from './team-deps';
import { brandOf } from '../../shared/brand/brand-of';

// The trips the boards show: set by the app, so channels does not depend on trips (app.ts).
type TripOf = (env: Bindings, id: string) => Promise<Trip | undefined>;
type TripsOfDate = (env: Bindings, date: string) => Promise<readonly Trip[]>;

// The parts of the boards and the summaries: the channels, the trips, the site of the brand.
function common(env: Bindings, tripsOf: TripsOfDate) {
  const brand = brandOf(env);
  const pageOf = (username: string) => brand.channels.find((zone) => zone.username === username)?.page;
  return {
    site: { bot: brand.bots.passenger, domain: brand.domain, pageOf },
    deps: {
      enabled: env.CHANNEL_POSTS === 'on',
      channels: async () => allChannels(await teamDeps(env)),
      places: () => placesOf(env),
      tripsOf: (date: string) => tripsOf(env, date),
      show: (cards: Parameters<typeof showCards>[1]) => showCards(env, cards),
      now: () => Date.now(),
    },
  };
}

function boardDeps(env: Bindings, tripsOf: TripsOfDate): BoardDeps {
  const { site, deps } = common(env, tripsOf);
  return { ...deps, card: boardCard(site) };
}

// The boards of the day and the summaries (G68, docs/122): the Cron keeps the boards fresh; a trip
// of today that changed redraws the boards of its channels at once.
export const channelBoards = (tripOf: TripOf, tripsOf: TripsOfDate) => ({
  all: (env: Bindings) => showBoards(boardDeps(env, tripsOf)),
  // The hourly Cron: the day at 22:00, the week on Monday (G68, docs/122).
  summaries: (env: Bindings) => {
    const { site, deps } = common(env, tripsOf);
    return sendSummaries({ ...deps, day: dayCard(site), week: weekCard(site) });
  },
  ofTrip: async (env: Bindings, tripId: string) => {
    const trip = await tripOf(env, tripId);
    if (!trip || tashkentDate(trip.departAt) !== tashkentDate(Date.now())) return;
    const deps = boardDeps(env, tripsOf);
    const [places, list] = await Promise.all([deps.places(), deps.channels()]);
    await showBoards(deps, channelsOf(trip.from, trip.to, places, list));
  },
});

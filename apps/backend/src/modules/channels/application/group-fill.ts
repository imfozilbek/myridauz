import { DAY_MS, tashkentDate, type Trip } from '@platform/contracts';
import { channelsOf, postState } from '../domain/route-channels';
import { postTrip } from './channels';
import type { ChannelsDeps } from './ports';

// A group of a direction takes the trips that were already open when it took the direction's posts
// (owner, 04.11.2026: «Уже были поездки давай их публикуй», docs/222), and one whose send Telegram
// refused. A few trips a run: the Cron shares its requests with the other jobs (docs/117).
export const FILL_PER_RUN = 5;
// The open trips of today and the next days: a driver publishes a trip up to a week ahead.
export const FILL_DAYS = 7;

export type GroupFillDeps = ChannelsDeps & {
  readonly groups: ReadonlySet<string>;
  readonly tripsOf: (date: string) => Promise<readonly Trip[]>;
};

const offersSeats = (trip: Trip, now: number) => ['open', 'lastSeat'].includes(postState(trip, now));

// The hourly Cron: each open trip whose route reaches a group without a post there is posted to it.
export async function fillGroups(deps: GroupFillDeps): Promise<number> {
  if (!deps.enabled || deps.groups.size === 0) return 0;
  const now = deps.now();
  const dates = Array.from({ length: FILL_DAYS }, (_, day) => tashkentDate(now + day * DAY_MS));
  const [places, list, days] = await Promise.all([
    deps.places(),
    deps.channels(),
    Promise.all(dates.map((date) => deps.tripsOf(date))),
  ]);
  let posted = 0;
  for (const trip of days.flat()) {
    if (posted === FILL_PER_RUN) break;
    if (trip.status !== 'active' || !offersSeats(trip, now)) continue;
    const groups = channelsOf(trip.from, trip.to, places, list).filter((chat) => deps.groups.has(chat));
    if (groups.length === 0) continue;
    const have = new Set((await deps.posts.byTrip(trip.id)).map(({ channel }) => channel));
    const missing = new Set(groups.filter((chat) => !have.has(chat)));
    if (missing.size === 0) continue;
    await postTrip(deps, trip.id, missing);
    posted += 1;
  }
  return posted;
}

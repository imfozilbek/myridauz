import { HOUR_MS, tashkentDate, tashkentDayStart, type Trip } from '@platform/contracts';
import type { Card } from '../../notifications';
import type { Places } from '../../../shared/places/end-names';
import { covers, type ChannelCoverage } from '../domain/route-channels';

// The board of the day goes up at 07:00 in Tashkent (docs/122): the one sound of a channel a day.
const BOARD_FROM_MS = 7 * HOUR_MS;

export type BoardDeps = {
  // Autoposting starts only when the owner switches it on (docs/33, public action).
  readonly enabled: boolean;
  readonly channels: () => Promise<readonly ChannelCoverage[]>;
  readonly places: () => Promise<Places>;
  // Every trip of the day, whatever its status: the board strikes what left or has no seats.
  readonly tripsOf: (date: string) => Promise<readonly Trip[]>;
  readonly card: (
    channel: ChannelCoverage,
    trips: readonly Trip[],
    places: Places,
    now: number,
  ) => Card | null;
  readonly show: (cards: readonly Card[]) => Promise<void>;
  readonly now: () => number;
};

const touches = (channel: ChannelCoverage, trip: Trip, places: Places) =>
  covers(channel, trip.from, places) || covers(channel, trip.to, places);

// The boards of the day (G68, docs/122, mockup g68/5): the Cron keeps them fresh, a changed trip
// redraws the boards of its channels at once. A board shows only what changed (the hash of a card).
export async function showBoards(deps: BoardDeps, only?: readonly string[]): Promise<void> {
  if (!deps.enabled) return;
  const now = deps.now();
  const date = tashkentDate(now);
  if (now - tashkentDayStart(date) < BOARD_FROM_MS) return;
  const channels = (await deps.channels()).filter((channel) => !only || only.includes(channel.username));
  if (channels.length === 0) return;
  const [places, trips] = await Promise.all([deps.places(), deps.tripsOf(date)]);
  const cards = channels.flatMap((channel) => {
    const card = deps.card(
      channel,
      trips.filter((trip) => touches(channel, trip, places)),
      places,
      now,
    );
    return card ? [card] : [];
  });
  if (cards.length > 0) await deps.show(cards);
}

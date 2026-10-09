import { DAY_MS, HOUR_MS, tashkentDate, tashkentDayStart, type Trip } from '@platform/contracts';
import type { Card } from '../../notifications';
import type { Places } from '../../../shared/places/end-names';
import { covers, type ChannelCoverage } from '../domain/route-channels';

// The day ends at 22:00, the week is told on Monday from 10:00 (docs/122, mockup g68/5).
const DAY_FROM_MS = 22 * HOUR_MS;
const WEEK_FROM_MS = 10 * HOUR_MS;
const MONDAY = 1;
const WEEK_DAYS = 7;

type Channel = ChannelCoverage & { readonly title?: string };
export type SummaryDeps = {
  readonly enabled: boolean;
  readonly channels: () => Promise<readonly Channel[]>;
  readonly places: () => Promise<Places>;
  readonly tripsOf: (date: string) => Promise<readonly Trip[]>;
  readonly day: (
    channel: Channel,
    today: readonly Trip[],
    tomorrow: readonly Trip[],
    now: number,
  ) => Card | null;
  readonly week: (channel: Channel, week: readonly Trip[], now: number) => Card | null;
  readonly show: (cards: readonly Card[]) => Promise<void>;
  readonly now: () => number;
};

const touching = (channel: Channel, trips: readonly Trip[], places: Places) =>
  trips.filter((trip) => covers(channel, trip.from, places) || covers(channel, trip.to, places));

// The hourly Cron job: each summary goes once, a card sent before is never sent again (once).
export async function sendSummaries(deps: SummaryDeps): Promise<void> {
  if (!deps.enabled) return;
  const now = deps.now();
  const date = tashkentDate(now);
  const start = tashkentDayStart(date);
  const evening = now - start >= DAY_FROM_MS;
  const monday = new Date(start + DAY_MS / 2).getUTCDay() === MONDAY && now - start >= WEEK_FROM_MS;
  if (!evening && !monday) return;
  const [channels, places] = await Promise.all([deps.channels(), deps.places()]);
  const cards: (Card | null)[] = [];
  if (evening) {
    const [today, tomorrow] = await Promise.all([
      deps.tripsOf(date),
      deps.tripsOf(tashkentDate(now + DAY_MS)),
    ]);
    for (const channel of channels)
      cards.push(
        deps.day(channel, touching(channel, today, places), touching(channel, tomorrow, places), now),
      );
  }
  if (monday) {
    const days = Array.from({ length: WEEK_DAYS }, (_, at) =>
      tashkentDate(start - (WEEK_DAYS - at) * DAY_MS),
    );
    const week = (await Promise.all(days.map(deps.tripsOf))).flat();
    for (const channel of channels) cards.push(deps.week(channel, touching(channel, week, places), now));
  }
  const ready = cards.filter((card) => card !== null);
  if (ready.length > 0) await deps.show(ready);
}

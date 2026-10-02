import { DAY_MS, TRIP_DAYS_AHEAD, tashkentDate, type Trip } from '@platform/contracts';
import { useCallback, useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useFeedChange } from '../feed/feed-context';

// Yesterday, today and two days ahead first; «Yana koʻrsatish» brings a week more (docs/90 F-A6).
const FIRST_DAYS = 4;
const MORE_DAYS = 7;
// From yesterday to the last day a trip can be published for.
const ALL_DAYS = TRIP_DAYS_AHEAD + 2;

export type TeamDay = { readonly date: string; readonly trips: readonly Trip[] };

const datesOf = (now: number, from: number, count: number) =>
  Array.from({ length: Math.min(count, ALL_DAYS - from) }, (_, index) =>
    tashkentDate(now + (from + index - 1) * DAY_MS),
  );

// The team's trips day by day: the server reads one day by its index, nothing is cut silently.
export function useTeamDays() {
  const { market } = useApiClients();
  const [now] = useState(Date.now);
  const [days, setDays] = useState<TeamDay[] | null>(null);
  const [failed, setFailed] = useState(false);
  const fetch = useCallback(
    (dates: readonly string[]) =>
      Promise.all(dates.map(async (date) => ({ date, trips: await market.teamTrips(date) }))),
    [market],
  );
  const reload = useCallback(() => {
    setFailed(false);
    setDays(null);
    fetch(datesOf(now, 0, FIRST_DAYS)).then(setDays, () => setFailed(true));
  }, [fetch, now]);
  useEffect(reload, [reload]);
  // A new or cancelled trip: the loaded days refresh quietly (docs/64).
  useFeedChange(() => {
    if (days) void fetch(days.map((day) => day.date)).then(setDays, () => undefined);
  });
  const loaded = days?.length ?? 0;
  const more =
    days && loaded < ALL_DAYS
      ? () => void fetch(datesOf(now, loaded, MORE_DAYS)).then((next) => setDays([...days, ...next]))
      : null;
  return { now, days, failed, reload, more };
}

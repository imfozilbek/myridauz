import { DAY_MS, tashkentDate, type Trip } from '@platform/contracts';
import { useCallback, useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useFeedChange } from '../feed/feed-context';
import { useBrand } from '../context/brand-context';

// Yesterday, today and two days ahead first; «Yana koʻrsatish» brings a week more (docs/90 F-A6).
const FIRST_DAYS = 4;
const MORE_DAYS = 7;
// From yesterday to the last day a trip can be published for (the brand's days ahead).
const allDays = (daysAhead: number) => daysAhead + 2;

export type TeamDay = { readonly date: string; readonly trips: readonly Trip[] };

const datesOf = (now: number, from: number, count: number, last: number) =>
  Array.from({ length: Math.min(count, last - from) }, (_, index) =>
    tashkentDate(now + (from + index - 1) * DAY_MS),
  );

// The team's trips day by day: the server reads one day by its index, nothing is cut silently.
export function useTeamDays() {
  const { market } = useApiClients();
  const [now] = useState(Date.now);
  const last = allDays(useBrand().schedule.daysAhead);
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
    fetch(datesOf(now, 0, FIRST_DAYS, last)).then(setDays, () => setFailed(true));
  }, [fetch, now, last]);
  useEffect(reload, [reload]);
  // A new or cancelled trip or a pull down: the loaded days refresh quietly (docs/64, docs/94 W1).
  const refresh = async () => {
    if (days) await fetch(days.map((day) => day.date)).then(setDays, () => undefined);
  };
  useFeedChange(() => void refresh());
  const loaded = days?.length ?? 0;
  const more =
    days && loaded < last
      ? () => void fetch(datesOf(now, loaded, MORE_DAYS, last)).then((next) => setDays([...days, ...next]))
      : null;
  return { now, days, failed, reload, refresh, more };
}

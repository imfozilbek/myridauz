import type { Stats, StatsPeriod } from '@platform/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useFeedChange } from '../feed/feed-context';

// The numbers of a period (docs/29). A new period keeps the old numbers on the screen until the new
// ones come: the page never collapses to a skeleton under the finger (docs/94 S4).
export function usePeriodStats(period: StatsPeriod) {
  const { stats } = useApiClients();
  const [shown, setShown] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);
  // A late answer of the period before never replaces the numbers of the chosen one.
  const current = useRef(period);
  current.current = period;
  const take = useCallback(
    (fresh: Stats) => {
      if (current.current === period) setShown(fresh);
    },
    [period],
  );
  const load = useCallback(() => {
    setFailed(false);
    stats.get(period).then(take, () => {
      if (current.current === period) setFailed(true);
    });
  }, [stats, period, take]);
  useEffect(load, [load]);
  // New events while the team looks: fresh numbers quietly (docs/64).
  useFeedChange(() => void stats.get(period).then(take, () => undefined));
  return { shown, failed, reload: load };
}

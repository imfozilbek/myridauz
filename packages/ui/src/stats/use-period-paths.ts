import type { Paths, StatsPeriod } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';

// The paths of a period (G99, docs/234), after the main numbers: a failed answer leaves the sections
// out, the rest of «Statistika» stays. A late answer of another period is not shown.
export function usePeriodPaths(period: StatsPeriod): Paths | null {
  const { stats } = useApiClients();
  const [paths, setPaths] = useState<Paths | null>(null);
  useEffect(() => {
    let current = true;
    stats.paths(period).then(
      (fresh) => current && setPaths(fresh),
      () => current && setPaths(null),
    );
    return () => {
      current = false;
    };
  }, [stats, period]);
  return paths?.period === period ? paths : null;
}

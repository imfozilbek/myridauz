import { alertsOf } from '../domain/alerts';
import type { StatsDeps } from './ports';
import { funnelsOf } from './read-stats';

const HOUR = 3_600_000;

// The Cron job, once an hour: errors of the last hour and drops of today against the usual (docs/29).
// A signal goes to the admin bot once, then again only after repeatHours.
export async function checkAlerts(deps: StatsDeps): Promise<number> {
  const { events, cache, rules } = deps;
  if (!events) return 0;
  const [hourErrors, dayErrors, day, week] = await Promise.all([
    events.errorsSince(1),
    events.errorsSince(24),
    funnelsOf(deps, 'day'),
    funnelsOf(deps, 'week'),
  ]);
  const now = deps.now();
  let sent = 0;
  for (const alert of alertsOf(rules, { hourErrors, dayErrors, day, week })) {
    const key = `alert:${alert.key}`;
    if ((await cache.get(key, now)) !== undefined) continue;
    await deps.tellTeam(alert);
    await cache.put(key, '1', now + rules.repeatHours * HOUR);
    sent += 1;
  }
  return sent;
}

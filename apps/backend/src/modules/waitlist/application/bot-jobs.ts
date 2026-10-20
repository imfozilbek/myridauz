import { mondayStart, WEEK_MS } from '../domain/waiting';
import { cardViews, showCards, type CardView, type PersonDeps } from './person';

export type BotJobDeps = PersonDeps & {
  // The card turns green «✅ Yoʻnalish ochildi» and one ring with sound answers it (docs/181).
  readonly ring: (views: readonly CardView[]) => Promise<void>;
};

// The people of the opened directions hear it, a few at a time: the rest in the next Cron run.
// They are marked first: a failed run never rings twice, the promise «bir marta» (docs/181); of
// two runs at once («Ochish» and the Cron), only the one that marked a person rings (G89 A12).
export async function tellOpened(deps: BotJobDeps, limit: number): Promise<number> {
  const now = deps.now();
  const records = [];
  for (const record of await deps.records.untold(now - WEEK_MS, limit))
    if (await deps.records.told(record, now)) records.push(record);
  if (records.length > 0) await deps.ring(await cardViews(deps, records));
  return records.length;
}

// «har dushanba yangilanadi» (docs/181): every card shows the new numbers once a week, silently.
export async function refreshCards(deps: BotJobDeps, limit: number): Promise<number> {
  const stale = await deps.records.stale(mondayStart(deps.now()), limit);
  await showCards(deps, stale);
  return stale.length;
}

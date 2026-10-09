import type { Bindings } from '../../env';
import { peopleOf } from '../users';
import type { Action, JournalStore } from './application/ports';
import { createMemoryJournal, d1Journal } from './infrastructure/d1-journal';
import { journalRoutes } from './http/journal-routes';

// The journal of the team (G75, gap К of docs/158): D1, or memory where there is none.
const memoryJournal = createMemoryJournal();
const storeOf = (env: Bindings): JournalStore => (env.DB ? d1Journal(env.DB) : memoryJournal);

// A decision or a change of a member goes to the journal; the journal never stops the step itself.
export async function recordAction(env: Bindings, action: Omit<Action, 'at'>): Promise<void> {
  await storeOf(env)
    .add({ ...action, at: Date.now() })
    .catch((error: unknown) =>
      console.warn(JSON.stringify({ event: 'journal_failed', message: String(error) })),
    );
}

export const actionsOf = (env: Bindings, memberId: number, from: number, to: number) =>
  storeOf(env).ofMember(memberId, from, to);

export const journalModule = journalRoutes({
  store: storeOf,
  name: async (env, memberId) => (await peopleOf(env).find(memberId))?.firstName ?? null,
});
export { workOf } from './domain/work';

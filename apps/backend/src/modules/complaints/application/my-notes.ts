import { DAY_MS, type ComplaintNotes } from '@platform/contracts';
import { hiddenFromSearch } from './file';
import type { ComplaintsDeps } from './ports';

// What a person sees of the complaints about them (G75, docs/158 З): out of the search until the team
// decides, and the latest warning of the team within the window of the rule; never who complained.
export async function myNotes(deps: ComplaintsDeps, userId: number): Promise<ComplaintNotes> {
  const since = deps.now() - deps.limits.windowDays * DAY_MS;
  const hidden = (await hiddenFromSearch(deps, [userId])).has(userId);
  const warned = (await deps.store.against([userId], since))
    .filter((complaint) => complaint.decision?.startsWith('warning') && complaint.decidedAt !== null)
    .map((complaint) => complaint.decidedAt ?? 0);
  return { hidden, warnedAt: warned.length > 0 ? Math.max(...warned) : null };
}

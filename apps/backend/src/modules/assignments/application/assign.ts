import { tashkentDate } from '@platform/contracts';
import { operatorNumber } from '../domain/operator';
import { pickAssignee } from '../domain/pick';
import type { AssignDeps, Kind } from './ports';

// The team member for this question or application (docs/92). The same person on the same day
// goes to the same member while that member is in the team; otherwise the least busy one.
export async function assign(deps: AssignDeps, kind: Kind, subjectId: number): Promise<number | undefined> {
  const team = await deps.teamIds();
  const at = deps.now();
  const day = tashkentDate(at);
  const current = await deps.store.assigneeOf(kind, subjectId, day);
  if (current !== undefined && team.includes(current)) return current;
  const assigneeId = pickAssignee(team, await deps.store.loads(day));
  if (assigneeId === undefined) return undefined;
  await deps.store.save({ kind, subjectId, day, assigneeId, at, operator: operatorNumber(deps.random()) });
  return assigneeId;
}

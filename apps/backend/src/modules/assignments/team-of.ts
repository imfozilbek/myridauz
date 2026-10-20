import type { Bindings } from '../../env';
import { teamMembers } from '../team';
import { isBlocked } from '../users';
import { d1Assignments } from './infrastructure/d1-assignments';
import { createMemoryAssignments } from './infrastructure/memory-assignments';

// The assignments in D1, or in memory where there is none (tests, local runs).
const localAssignments = createMemoryAssignments();
export const storeOf = (env: Bindings) => (env.DB ? d1Assignments(env.DB) : localAssignments);

// The team now: a blocked member gets no new cases and no rings (G89 M10).
export async function activeTeam(env: Bindings): Promise<number[]> {
  const ids = (await teamMembers(env)).map((member) => member.id);
  const blocked = await Promise.all(ids.map((id) => isBlocked(env, id)));
  return ids.filter((_, index) => !blocked[index]);
}

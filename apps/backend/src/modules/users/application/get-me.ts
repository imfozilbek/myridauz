import type { MeResponse } from '@platform/contracts';
import { toMyProfile } from '../domain/profiles';
import { checkAccess } from './check-access';
import type { Caller, UsersDeps } from './ports';

export async function getMe(deps: UsersDeps, caller: Caller): Promise<MeResponse> {
  const user = await deps.users.find(caller.id);
  if (!user) return { state: 'unregistered', suggestedName: caller.firstName };
  const profile = toMyProfile(user, caller.isAdmin);
  const block = await checkAccess(deps, caller.id);
  if (!block) return { state: 'active', profile };
  // Blocked on the road: the trip on the way is finished first (owner decision 10.10.2026).
  if (await deps.riding(caller.id)) return { state: 'active', profile, block: { until: block.until } };
  return { state: 'blocked', until: block.until };
}

import type { MeResponse } from '@platform/contracts';
import { toMyProfile } from '../domain/profiles';
import { activeBlock } from '../domain/user';
import { checkAccess } from './check-access';
import type { Caller, UsersDeps } from './ports';

export async function getMe(deps: UsersDeps, caller: Caller): Promise<MeResponse> {
  const user = await deps.users.find(caller.id);
  if (!user) {
    // A blocked person who deleted the account: the block and its end, not a registration that is
    // refused at the last step (G89 U13).
    const block = activeBlock([await deps.users.idBlock(caller.id)], deps.now());
    return block
      ? { state: 'blocked', until: block.until }
      : { state: 'unregistered', suggestedName: caller.firstName };
  }
  const profile = toMyProfile(user, caller.isAdmin);
  const block = await checkAccess(deps, caller.id);
  if (!block) return { state: 'active', profile };
  // Blocked on the road: the trip on the way is finished first (owner decision 10.10.2026).
  if (await deps.riding(caller.id)) return { state: 'active', profile, block: { until: block.until } };
  return { state: 'blocked', until: block.until };
}
